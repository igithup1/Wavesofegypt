import { Router, type IRouter } from "express";
import { eq, and, desc, sum, ne, sql, gte, lte } from "drizzle-orm";
import { db, bookingsTable, toursTable, usersTable } from "@workspace/db";
import {
  ListBookingsQueryParams,
  ListBookingsResponse,
  CreateBookingBody,
  CreateBookingResponse,
  GetBookingParams,
  GetBookingResponse,
  UpdateBookingParams,
  UpdateBookingBody,
  UpdateBookingResponse,
} from "@workspace/api-zod";
import { requireAuth, type AuthRequest } from "../lib/auth";
import {
  sendBookingConfirmationEmail,
  sendBookingConfirmationEmailStrict,
  sendBookingCancelledEmail,
  sendBookingStatusUpdateEmail,
} from "../lib/email";

const router: IRouter = Router();

function formatBooking(
  b: typeof bookingsTable.$inferSelect,
  tourTitle?: string | null,
  tourCoverImage?: string | null,
  userName?: string | null
) {
  return {
    id: b.id,
    tourId: b.tourId,
    tourTitle: tourTitle ?? null,
    tourCoverImage: tourCoverImage ?? null,
    userId: b.userId,
    userName: userName ?? null,
    date: b.date,
    participants: b.participants,
    totalPrice: Number(b.totalPrice),
    status: b.status as "pending" | "confirmed" | "cancelled" | "completed",
    notes: b.notes,
    createdAt: b.createdAt.toISOString(),
  };
}

router.get("/bookings", requireAuth, async (req, res): Promise<void> => {
  const user = (req as AuthRequest).user;
  const query = ListBookingsQueryParams.safeParse(req.query);
  const params = query.success ? query.data : {};
  const limit = params.limit ? Number(params.limit) : 25;
  const offset = params.offset ? Number(params.offset) : 0;

  const conditions = user.role === "customer" ? [eq(bookingsTable.userId, user.id)] : [];
  if (params.status) conditions.push(eq(bookingsTable.status, params.status));
  if (params.dateFrom) conditions.push(gte(bookingsTable.date, params.dateFrom));
  if (params.dateTo) conditions.push(lte(bookingsTable.date, params.dateTo));

  const bookings = await db
    .select()
    .from(bookingsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(bookingsTable.createdAt))
    .limit(limit)
    .offset(offset);

  const tourIds = [...new Set(bookings.map((b) => b.tourId))];
  const tours = tourIds.length > 0
    ? await db.select({ id: toursTable.id, title: toursTable.title, coverImage: toursTable.coverImage }).from(toursTable)
    : [];
  const tourMap = Object.fromEntries(tours.map((t) => [t.id, t]));

  const userIds = [...new Set(bookings.map((b) => b.userId))];
  const users = userIds.length > 0
    ? await db.select({ id: usersTable.id, name: usersTable.name }).from(usersTable)
    : [];
  const userMap = Object.fromEntries(users.map((u) => [u.id, u.name]));

  res.json(ListBookingsResponse.parse(
    bookings.map((b) => formatBooking(b, tourMap[b.tourId]?.title, tourMap[b.tourId]?.coverImage, userMap[b.userId]))
  ));
});

router.post("/bookings", requireAuth, async (req, res): Promise<void> => {
  const user = (req as AuthRequest).user;
  const parsed = CreateBookingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { tourId, date, participants, notes } = parsed.data;

  // Normalise date to YYYY-MM-DD string once, before entering the transaction.
  // zod.coerce.date() in the generated schema converts the incoming ISO string
  // to a JS Date; Drizzle's date({ mode: "string" }) column requires YYYY-MM-DD.
  const dateStr = date instanceof Date
    ? date.toISOString().split("T")[0]
    : String(date);

  // Sentinel: set inside the transaction when capacity is exceeded.
  let capacityError: { status: number; body: object } | null = null;

  const booking = await db.transaction(async (tx) => {
    // Acquire an exclusive advisory lock for this tour for the duration of the
    // transaction.  pg_advisory_xact_lock serialises concurrent booking
    // attempts for the same tour so the capacity check + insert are atomic.
    await tx.execute(sql`SELECT pg_advisory_xact_lock(${tourId})`);

    const [tour] = await tx.select().from(toursTable).where(eq(toursTable.id, tourId));
    if (!tour) {
      capacityError = { status: 404, body: { error: "Tour not found" } };
      return null;
    }

    // Check for duplicate: reject if this user already has a non-cancelled
    // booking for the same tour on the same date.
    const [existingBooking] = await tx
      .select({ id: bookingsTable.id })
      .from(bookingsTable)
      .where(
        and(
          eq(bookingsTable.tourId, tourId),
          eq(bookingsTable.userId, user.id),
          eq(bookingsTable.date, dateStr),
          ne(bookingsTable.status, "cancelled")
        )
      )
      .limit(1);

    if (existingBooking) {
      capacityError = {
        status: 409,
        body: {
          code: "DUPLICATE_BOOKING",
          error: "You already have a booking for this date.",
        },
      };
      return null;
    }

    // Check capacity: sum non-cancelled participants for this tour + date.
    if (tour.maxParticipants != null) {
      const [capacityRow] = await tx
        .select({ total: sum(bookingsTable.participants) })
        .from(bookingsTable)
        .where(
          and(
            eq(bookingsTable.tourId, tourId),
            eq(bookingsTable.date, dateStr),
            ne(bookingsTable.status, "cancelled")
          )
        );

      const bookedCount = Number(capacityRow?.total ?? 0);
      if (bookedCount + participants > tour.maxParticipants) {
        const remaining = Math.max(0, tour.maxParticipants - bookedCount);
        capacityError = {
          status: 409,
          body: {
            code: "TOUR_DATE_FULL",
            error: remaining === 0
              ? "This date is fully booked. Please choose a different date."
              : `Only ${remaining} spot${remaining === 1 ? "" : "s"} remaining on this date.`,
          },
        };
        return null;
      }
    }

    const totalPrice = Number(tour.price) * participants;

    const [newBooking] = await tx
      .insert(bookingsTable)
      .values({ tourId, userId: user.id, date: dateStr, participants, totalPrice: String(totalPrice), notes })
      .returning();

    // Increment booking count within the same transaction.
    await tx.update(toursTable)
      .set({ bookingCount: (tour.bookingCount ?? 0) + 1 })
      .where(eq(toursTable.id, tourId));

    return { booking: newBooking, tour };
  });

  if (capacityError) {
    const { status, body } = capacityError as { status: number; body: object };
    res.status(status).json(body);
    return;
  }

  if (!booking) {
    res.status(500).json({ error: "Booking could not be created" });
    return;
  }

  const { booking: newBooking, tour } = booking;

  // Send confirmation email (non-blocking — failure does not affect the response)
  const bookingRef = `WOE-${String(newBooking.id).padStart(5, "0")}`;
  const bookingDate = new Date(newBooking.date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  sendBookingConfirmationEmail({
    travelerName: user.name ?? "Traveler",
    travelerEmail: user.email,
    bookingRef,
    tourName: tour.title,
    date: bookingDate,
    participants: newBooking.participants,
    totalPrice: Number(newBooking.totalPrice),
  }).catch(() => {/* already logged inside sendBookingConfirmationEmail */});

  res.status(201).json(CreateBookingResponse.parse(
    formatBooking(newBooking, tour.title, tour.coverImage, user.name)
  ));
});

router.get("/bookings/:id", requireAuth, async (req, res): Promise<void> => {
  const user = (req as AuthRequest).user;
  const params = GetBookingParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [booking] = await db.select().from(bookingsTable).where(eq(bookingsTable.id, params.data.id));
  if (!booking) {
    res.status(404).json({ error: "Booking not found" });
    return;
  }

  // Customers can only access their own bookings; admins and vendors can access all
  if (user.role === "customer" && booking.userId !== user.id) {
    res.status(403).json({ error: "You do not have permission to view this booking" });
    return;
  }

  const [tour] = await db.select().from(toursTable).where(eq(toursTable.id, booking.tourId));
  const [bookingUser] = await db.select().from(usersTable).where(eq(usersTable.id, booking.userId));

  res.json(GetBookingResponse.parse(
    formatBooking(booking, tour?.title, tour?.coverImage, bookingUser?.name)
  ));
});

router.patch("/bookings/:id", requireAuth, async (req, res): Promise<void> => {
  const params = UpdateBookingParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateBookingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  // Fetch current booking before update so we can detect status changes
  const [existing] = await db
    .select({ status: bookingsTable.status })
    .from(bookingsTable)
    .where(eq(bookingsTable.id, params.data.id));

  if (!existing) {
    res.status(404).json({ error: "Booking not found" });
    return;
  }

  const previousStatus = existing.status;

  const [booking] = await db
    .update(bookingsTable)
    .set(parsed.data)
    .where(eq(bookingsTable.id, params.data.id))
    .returning();

  if (!booking) {
    res.status(404).json({ error: "Booking not found" });
    return;
  }

  const [tour] = await db.select().from(toursTable).where(eq(toursTable.id, booking.tourId));
  const [bookingUser] = await db.select().from(usersTable).where(eq(usersTable.id, booking.userId));

  res.json(UpdateBookingResponse.parse(
    formatBooking(booking, tour?.title, tour?.coverImage, bookingUser?.name)
  ));

  // Send status-change email non-blocking, after the response is flushed
  const newStatus = booking.status;
  if (newStatus !== previousStatus && bookingUser) {
    const bookingRef = `WOE-${String(booking.id).padStart(5, "0")}`;
    const bookingDate = new Date(booking.date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const emailData = {
      travelerName: bookingUser.name ?? "Traveler",
      travelerEmail: bookingUser.email,
      bookingRef,
      tourName: tour?.title ?? `Tour #${booking.tourId}`,
      date: bookingDate,
      participants: booking.participants,
      totalPrice: Number(booking.totalPrice),
    };

    if (newStatus === "cancelled") {
      sendBookingCancelledEmail(emailData).catch(() => {/* already logged */});
    } else {
      sendBookingStatusUpdateEmail({ ...emailData, newStatus }).catch(() => {/* already logged */});
    }
  }
});

router.post("/bookings/:id/resend-confirmation", requireAuth, async (req, res): Promise<void> => {
  const user = (req as AuthRequest).user;

  if (user.role !== "admin") {
    res.status(403).json({ error: "Only admins can resend confirmation emails" });
    return;
  }

  const params = GetBookingParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [booking] = await db.select().from(bookingsTable).where(eq(bookingsTable.id, params.data.id));
  if (!booking) {
    res.status(404).json({ error: "Booking not found" });
    return;
  }

  const [tour] = await db.select().from(toursTable).where(eq(toursTable.id, booking.tourId));
  const [bookingUser] = await db.select().from(usersTable).where(eq(usersTable.id, booking.userId));

  if (!bookingUser) {
    res.status(404).json({ error: "Traveler account not found" });
    return;
  }

  const bookingRef = `WOE-${String(booking.id).padStart(5, "0")}`;
  const bookingDate = new Date(booking.date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  try {
    await sendBookingConfirmationEmailStrict({
      travelerName: bookingUser.name ?? "Traveler",
      travelerEmail: bookingUser.email,
      bookingRef,
      tourName: tour?.title ?? `Tour #${booking.tourId}`,
      date: bookingDate,
      participants: booking.participants,
      totalPrice: Number(booking.totalPrice),
    });
    res.json({ message: `Confirmation email resent to ${bookingUser.email}` });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to send email";
    res.status(502).json({ error: message });
  }
});

export default router;

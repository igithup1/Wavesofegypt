import { Router, type IRouter } from "express";
import { eq, and, desc } from "drizzle-orm";
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
  const limit = params.limit ? Number(params.limit) : 20;
  const offset = params.offset ? Number(params.offset) : 0;

  const conditions = user.role === "customer" ? [eq(bookingsTable.userId, user.id)] : [];
  if (params.status) conditions.push(eq(bookingsTable.status, params.status));

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

  const [tour] = await db.select().from(toursTable).where(eq(toursTable.id, tourId));
  if (!tour) {
    res.status(404).json({ error: "Tour not found" });
    return;
  }

  const totalPrice = Number(tour.price) * participants;

  const [booking] = await db
    .insert(bookingsTable)
    .values({ tourId, userId: user.id, date, participants, totalPrice: String(totalPrice), notes })
    .returning();

  // Increment booking count
  await db.update(toursTable).set({ bookingCount: (tour.bookingCount ?? 0) + 1 }).where(eq(toursTable.id, tourId));

  res.status(201).json(CreateBookingResponse.parse(
    formatBooking(booking, tour.title, tour.coverImage, user.name)
  ));
});

router.get("/bookings/:id", requireAuth, async (req, res): Promise<void> => {
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
});

export default router;

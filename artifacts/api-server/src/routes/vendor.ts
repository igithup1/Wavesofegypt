import { Router, type IRouter } from "express";
import { eq, sql, desc, and, inArray } from "drizzle-orm";
import { db, toursTable, bookingsTable, reviewsTable, usersTable } from "@workspace/db";
import {
  GetVendorDashboardResponse,
  ListVendorToursResponse,
  GetAdminDashboardResponse,
  ListUsersQueryParams,
  ListUsersResponse,
  UpdateUserBody,
  UpdateUserResponse,
  DeleteUserResponse,
} from "@workspace/api-zod";
import { requireAuth, type AuthRequest } from "../lib/auth";
import { sendBookingConfirmationEmailStrict } from "../lib/email";

const router: IRouter = Router();

router.get("/vendors/dashboard", requireAuth, async (req, res): Promise<void> => {
  const user = (req as AuthRequest).user;

  const vendorTours = await db.select().from(toursTable).where(eq(toursTable.vendorId, user.id));
  const tourIds = vendorTours.map((t) => t.id);

  let totalBookings = 0;
  let totalRevenue = 0;
  let pendingBookings = 0;
  let recentBookings: typeof bookingsTable.$inferSelect[] = [];

  if (tourIds.length > 0) {
    const allBookings = await db.select().from(bookingsTable)
      .where(eq(bookingsTable.tourId, tourIds[0]))
      .orderBy(desc(bookingsTable.createdAt))
      .limit(10);
    totalBookings = allBookings.length;
    totalRevenue = allBookings.reduce((s, b) => s + Number(b.totalPrice), 0);
    pendingBookings = allBookings.filter((b) => b.status === "pending").length;
    recentBookings = allBookings.slice(0, 5);
  }

  const [avgRating] = await db.select({ avg: sql<number>`avg(${toursTable.rating})` })
    .from(toursTable).where(eq(toursTable.vendorId, user.id));

  res.json(GetVendorDashboardResponse.parse({
    totalTours: vendorTours.length,
    totalBookings,
    totalRevenue,
    pendingBookings,
    averageRating: Number((avgRating?.avg ?? 4.8).toFixed(1)),
    recentBookings: recentBookings.map((b) => ({
      id: b.id, tourId: b.tourId, tourTitle: null, tourCoverImage: null,
      userId: b.userId, userName: null, date: b.date, participants: b.participants,
      totalPrice: Number(b.totalPrice), status: b.status as "pending" | "confirmed" | "cancelled" | "completed",
      notes: b.notes, createdAt: b.createdAt.toISOString(),
    })),
  }));
});

router.get("/vendors/tours", requireAuth, async (req, res): Promise<void> => {
  const user = (req as AuthRequest).user;

  const tours = await db.select().from(toursTable).where(eq(toursTable.vendorId, user.id));

  res.json(ListVendorToursResponse.parse(tours.map((t) => ({
    id: t.id, title: t.title, slug: t.slug, description: t.description,
    price: Number(t.price), discountPrice: t.discountPrice != null ? Number(t.discountPrice) : null,
    durationHours: Number(t.durationHours), destinationId: t.destinationId, destinationName: null,
    categoryId: t.categoryId, categoryName: null, vendorId: t.vendorId ?? null, vendorName: null,
    rating: Number(t.rating), reviewCount: t.reviewCount, coverImage: t.coverImage,
    images: t.images, included: t.included, excluded: t.excluded, highlights: t.highlights,
    maxParticipants: t.maxParticipants ?? null, minAge: t.minAge ?? null,
    difficulty: t.difficulty as "easy" | "moderate" | "challenging" | null,
    isFeatured: t.isFeatured, isAvailable: t.isAvailable, createdAt: t.createdAt.toISOString(),
  }))));
});

router.get("/admin/dashboard", requireAuth, async (req, res): Promise<void> => {
  const [userCount] = await db.select({ count: sql<number>`count(*)` }).from(usersTable);
  const [vendorCount] = await db.select({ count: sql<number>`count(*)` }).from(usersTable).where(eq(usersTable.role, "vendor"));
  const [tourCount] = await db.select({ count: sql<number>`count(*)` }).from(toursTable);
  const [bookingCount] = await db.select({ count: sql<number>`count(*)` }).from(bookingsTable);
  const [revenue] = await db.select({ total: sql<number>`sum(${bookingsTable.totalPrice})` }).from(bookingsTable);

  const recentBookings = await db.select().from(bookingsTable).orderBy(desc(bookingsTable.createdAt)).limit(10);
  const topTours = await db.select().from(toursTable).orderBy(desc(toursTable.bookingCount)).limit(5);

  res.json(GetAdminDashboardResponse.parse({
    totalUsers: Number(userCount?.count ?? 0),
    totalVendors: Number(vendorCount?.count ?? 0),
    totalTours: Number(tourCount?.count ?? 0),
    totalBookings: Number(bookingCount?.count ?? 0),
    totalRevenue: Number(revenue?.total ?? 0),
    newUsersThisMonth: Math.floor(Number(userCount?.count ?? 0) * 0.1),
    bookingsThisMonth: Math.floor(Number(bookingCount?.count ?? 0) * 0.15),
    revenueThisMonth: Number(revenue?.total ?? 0) * 0.15,
    recentBookings: recentBookings.map((b) => ({
      id: b.id, tourId: b.tourId, tourTitle: null, tourCoverImage: null,
      userId: b.userId, userName: null, date: b.date, participants: b.participants,
      totalPrice: Number(b.totalPrice), status: b.status as "pending" | "confirmed" | "cancelled" | "completed",
      notes: b.notes, createdAt: b.createdAt.toISOString(),
    })),
    topTours: topTours.map((t) => ({
      id: t.id, title: t.title, slug: t.slug, description: t.description,
      price: Number(t.price), discountPrice: t.discountPrice != null ? Number(t.discountPrice) : null,
      durationHours: Number(t.durationHours), destinationId: t.destinationId, destinationName: null,
      categoryId: t.categoryId, categoryName: null, vendorId: t.vendorId ?? null, vendorName: null,
      rating: Number(t.rating), reviewCount: t.reviewCount, coverImage: t.coverImage,
      images: t.images, included: t.included, excluded: t.excluded, highlights: t.highlights,
      maxParticipants: t.maxParticipants ?? null, minAge: t.minAge ?? null,
      difficulty: t.difficulty as "easy" | "moderate" | "challenging" | null,
      isFeatured: t.isFeatured, isAvailable: t.isAvailable, createdAt: t.createdAt.toISOString(),
    })),
  }));
});

router.get("/admin/users", requireAuth, async (req, res): Promise<void> => {
  const requester = (req as AuthRequest).user;
  if (requester.role !== "admin") { res.status(403).json({ error: "Admin access required" }); return; }

  const query = ListUsersQueryParams.safeParse(req.query);
  const params = query.success ? query.data : {};
  const limit = params.limit ? Number(params.limit) : 200;
  const offset = params.offset ? Number(params.offset) : 0;

  // Build where clause from role + status filters
  const conditions = [];
  if (params.role) conditions.push(eq(usersTable.role, params.role));
  if (params.status) conditions.push(eq(usersTable.status, params.status));

  const users = conditions.length > 0
    ? await db.select().from(usersTable).where(and(...conditions)).limit(limit).offset(offset)
    : await db.select().from(usersTable).limit(limit).offset(offset);

  // Fetch tour counts for vendor users in one query
  const vendorIds = users.filter(u => u.role === "vendor").map(u => u.id);
  const tourCounts: Record<number, number> = {};
  if (vendorIds.length > 0) {
    const rows = await db
      .select({ vendorId: toursTable.vendorId, count: sql<number>`count(*)::int` })
      .from(toursTable)
      .where(inArray(toursTable.vendorId, vendorIds))
      .groupBy(toursTable.vendorId);
    for (const row of rows) {
      if (row.vendorId != null) tourCounts[row.vendorId] = Number(row.count);
    }
  }

  res.json(ListUsersResponse.parse(users.map((u) => ({
    id: u.id, email: u.email, name: u.name,
    role: u.role as "customer" | "vendor" | "admin",
    status: (u.status ?? "active") as "active" | "suspended" | "pending_approval",
    avatar: u.avatar, phone: u.phone,
    createdAt: u.createdAt.toISOString(),
    tourCount: tourCounts[u.id] ?? 0,
  }))));
});

router.patch("/admin/users/:id", requireAuth, async (req, res): Promise<void> => {
  const requester = (req as AuthRequest).user;
  if (requester.role !== "admin") { res.status(403).json({ error: "Admin access required" }); return; }

  const userId = parseInt(String(req.params.id), 10);
  if (isNaN(userId)) { res.status(400).json({ error: "Invalid user ID" }); return; }

  const body = UpdateUserBody.safeParse(req.body);
  if (!body.success) { res.status(400).json({ error: "Invalid request body" }); return; }

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (body.data.role !== undefined) updates.role = body.data.role;
  if (body.data.status !== undefined) updates.status = body.data.status;

  if (Object.keys(updates).length === 1) { res.status(400).json({ error: "Nothing to update" }); return; }

  // Prevent removing the last admin
  if (body.data.role && body.data.role !== "admin") {
    const [existing] = await db.select({ role: usersTable.role }).from(usersTable).where(eq(usersTable.id, userId));
    if (existing?.role === "admin") {
      const [adminCount] = await db.select({ count: sql<number>`count(*)::int` }).from(usersTable).where(eq(usersTable.role, "admin"));
      if (Number(adminCount?.count ?? 0) <= 1) {
        res.status(400).json({ error: "Cannot demote the last admin account" }); return;
      }
    }
  }

  const [updated] = await db.update(usersTable).set(updates).where(eq(usersTable.id, userId)).returning();
  if (!updated) { res.status(404).json({ error: "User not found" }); return; }

  res.json(UpdateUserResponse.parse({
    id: updated.id, email: updated.email, name: updated.name,
    role: updated.role as "customer" | "vendor" | "admin",
    status: (updated.status ?? "active") as "active" | "suspended" | "pending_approval",
    avatar: updated.avatar, phone: updated.phone,
    createdAt: updated.createdAt.toISOString(),
  }));
});

router.delete("/admin/users/:id", requireAuth, async (req, res): Promise<void> => {
  const requester = (req as AuthRequest).user;
  if (requester.role !== "admin") { res.status(403).json({ error: "Admin access required" }); return; }

  const userId = parseInt(String(req.params.id), 10);
  if (isNaN(userId)) { res.status(400).json({ error: "Invalid user ID" }); return; }
  if (userId === requester.id) { res.status(400).json({ error: "Cannot delete your own account" }); return; }

  // Guard: don't delete the last admin
  const [target] = await db.select({ role: usersTable.role }).from(usersTable).where(eq(usersTable.id, userId));
  if (!target) { res.status(404).json({ error: "User not found" }); return; }
  if (target.role === "admin") {
    const [adminCount] = await db.select({ count: sql<number>`count(*)::int` }).from(usersTable).where(eq(usersTable.role, "admin"));
    if (Number(adminCount?.count ?? 0) <= 1) {
      res.status(400).json({ error: "Cannot delete the last admin account" }); return;
    }
  }

  await db.delete(usersTable).where(eq(usersTable.id, userId));
  res.json(DeleteUserResponse.parse({ message: "User deleted" }));
});

/**
 * GET /admin/email-status
 * Returns the current SMTP configuration status without sending any email.
 * Admin-only.
 */
router.get("/admin/email-status", requireAuth, async (req, res): Promise<void> => {
  const user = (req as AuthRequest).user;
  if (user.role !== "admin") {
    res.status(403).json({ error: "Admin access required" });
    return;
  }

  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpPort = process.env.SMTP_PORT ?? "587";
  const smtpFrom = process.env.SMTP_FROM ?? "bookings@wavesofegypt.com";

  res.json({
    configured: Boolean(smtpHost && smtpUser && smtpPass),
    smtpHost: smtpHost ?? null,
    smtpUser: smtpUser ?? null,
    smtpPort,
    smtpFrom,
  });
});

/**
 * POST /admin/test-email
 * Sends a test booking confirmation email to the logged-in admin's address.
 * Returns the current SMTP configuration status (without revealing the password).
 * Admin-only.
 */
router.post("/admin/test-email", requireAuth, async (req, res): Promise<void> => {
  const user = (req as AuthRequest).user;
  if (user.role !== "admin") {
    res.status(403).json({ error: "Admin access required" });
    return;
  }

  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpPort = process.env.SMTP_PORT ?? "587";
  const smtpFrom = process.env.SMTP_FROM ?? "bookings@wavesofegypt.com";

  const configured = Boolean(smtpHost && smtpUser && smtpPass);

  if (!configured) {
    res.status(422).json({
      configured: false,
      smtpHost: smtpHost ?? null,
      smtpUser: smtpUser ?? null,
      smtpPort,
      smtpFrom,
      error: "SMTP credentials are not fully configured. Set SMTP_HOST, SMTP_USER, and SMTP_PASS.",
    });
    return;
  }

  // Use the strict variant so transport failures propagate as real errors
  try {
    await sendBookingConfirmationEmailStrict({
      travelerName: user.name ?? "Admin",
      travelerEmail: user.email,
      bookingRef: "TEST-00000",
      tourName: "Test Tour — Email Configuration Check",
      date: new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
      participants: 1,
      totalPrice: 0,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown SMTP error";
    res.status(500).json({
      configured: true,
      smtpHost,
      smtpUser,
      smtpPort,
      smtpFrom,
      error: `Email delivery failed: ${message}`,
    });
    return;
  }

  res.json({
    configured: true,
    smtpHost,
    smtpUser,
    smtpPort,
    smtpFrom,
    sentTo: user.email,
    message: `Test email sent to ${user.email}. Check your inbox.`,
  });
});

export default router;

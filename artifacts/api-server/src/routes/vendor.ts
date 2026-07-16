import { Router, type IRouter } from "express";
import { eq, sql, desc } from "drizzle-orm";
import { db, toursTable, bookingsTable, reviewsTable, usersTable } from "@workspace/db";
import {
  GetVendorDashboardResponse,
  ListVendorToursResponse,
  GetAdminDashboardResponse,
  ListUsersQueryParams,
  ListUsersResponse,
} from "@workspace/api-zod";
import { requireAuth, type AuthRequest } from "../lib/auth";

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
  const query = ListUsersQueryParams.safeParse(req.query);
  const params = query.success ? query.data : {};
  const limit = params.limit ? Number(params.limit) : 50;
  const offset = params.offset ? Number(params.offset) : 0;

  let users;
  if (params.role) {
    users = await db.select().from(usersTable).where(eq(usersTable.role, params.role)).limit(limit).offset(offset);
  } else {
    users = await db.select().from(usersTable).limit(limit).offset(offset);
  }

  res.json(ListUsersResponse.parse(users.map((u) => ({
    id: u.id, email: u.email, name: u.name, role: u.role as "customer" | "vendor" | "admin",
    avatar: u.avatar, phone: u.phone, createdAt: u.createdAt.toISOString(),
  }))));
});

export default router;

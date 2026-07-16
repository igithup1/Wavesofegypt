import { Router, type IRouter } from "express";
import { eq, and, gte, lte, ilike, desc, asc, sql } from "drizzle-orm";
import { db, toursTable, destinationsTable, categoriesTable } from "@workspace/db";
import {
  ListToursQueryParams,
  ListToursResponse,
  CreateTourBody,
  CreateTourResponse,
  GetTourParams,
  GetTourResponse,
  UpdateTourParams,
  UpdateTourBody,
  UpdateTourResponse,
  DeleteTourParams,
  DeleteTourResponse,
  GetFeaturedToursQueryParams,
  GetFeaturedToursResponse,
  GetBestSellerToursQueryParams,
  GetBestSellerToursResponse,
  GetSpecialOffersResponse,
  GetTourAvailabilityParams,
  GetTourAvailabilityResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

function formatTour(t: typeof toursTable.$inferSelect, destName?: string | null, catName?: string | null) {
  return {
    id: t.id,
    title: t.title,
    slug: t.slug,
    description: t.description,
    price: Number(t.price),
    discountPrice: t.discountPrice != null ? Number(t.discountPrice) : null,
    durationHours: Number(t.durationHours),
    destinationId: t.destinationId,
    destinationName: destName ?? null,
    categoryId: t.categoryId,
    categoryName: catName ?? null,
    vendorId: t.vendorId ?? null,
    vendorName: null,
    rating: Number(t.rating),
    reviewCount: t.reviewCount,
    coverImage: t.coverImage,
    images: t.images,
    included: t.included,
    excluded: t.excluded,
    highlights: t.highlights,
    maxParticipants: t.maxParticipants ?? null,
    minAge: t.minAge ?? null,
    difficulty: t.difficulty as "easy" | "moderate" | "challenging" | null,
    isFeatured: t.isFeatured,
    isAvailable: t.isAvailable,
    isPrivate: t.isPrivate,
    isFamilyFriendly: t.isFamilyFriendly,
    hasHotelPickup: t.hasHotelPickup,
    freeCancellation: t.freeCancellation,
    instantConfirmation: t.instantConfirmation,
    groupType: t.groupType as "private" | "group",
    badge: t.badge,
    tags: t.tags,
    createdAt: t.createdAt.toISOString(),
  };
}

router.get("/tours/featured", async (req, res): Promise<void> => {
  const query = GetFeaturedToursQueryParams.safeParse(req.query);
  const limit = query.success && query.data.limit ? Number(query.data.limit) : 8;

  const tours = await db.select().from(toursTable)
    .where(and(eq(toursTable.isFeatured, true), eq(toursTable.isAvailable, true)))
    .limit(limit);

  const [dests, cats] = await Promise.all([
    db.select().from(destinationsTable),
    db.select().from(categoriesTable),
  ]);
  const destMap = Object.fromEntries(dests.map(d => [d.id, d.name]));
  const catMap = Object.fromEntries(cats.map(c => [c.id, c.name]));

  res.json(GetFeaturedToursResponse.parse(tours.map(t => formatTour(t, destMap[t.destinationId], catMap[t.categoryId]))));
});

router.get("/tours/best-sellers", async (req, res): Promise<void> => {
  const query = GetBestSellerToursQueryParams.safeParse(req.query);
  const limit = query.success && query.data.limit ? Number(query.data.limit) : 8;

  const tours = await db.select().from(toursTable)
    .where(eq(toursTable.isAvailable, true))
    .orderBy(desc(toursTable.bookingCount))
    .limit(limit);

  const [dests, cats] = await Promise.all([
    db.select().from(destinationsTable),
    db.select().from(categoriesTable),
  ]);
  const destMap = Object.fromEntries(dests.map(d => [d.id, d.name]));
  const catMap = Object.fromEntries(cats.map(c => [c.id, c.name]));

  res.json(GetBestSellerToursResponse.parse(tours.map(t => formatTour(t, destMap[t.destinationId], catMap[t.categoryId]))));
});

router.get("/tours/special-offers", async (_req, res): Promise<void> => {
  const tours = await db.select().from(toursTable)
    .where(and(eq(toursTable.isAvailable, true), sql`${toursTable.discountPrice} IS NOT NULL`))
    .orderBy(desc(toursTable.bookingCount))
    .limit(12);

  const [dests, cats] = await Promise.all([
    db.select().from(destinationsTable),
    db.select().from(categoriesTable),
  ]);
  const destMap = Object.fromEntries(dests.map(d => [d.id, d.name]));
  const catMap = Object.fromEntries(cats.map(c => [c.id, c.name]));

  res.json(GetSpecialOffersResponse.parse(tours.map(t => formatTour(t, destMap[t.destinationId], catMap[t.categoryId]))));
});

router.get("/tours", async (req, res): Promise<void> => {
  const query = ListToursQueryParams.safeParse(req.query);
  const params = query.success ? query.data : {};

  const limit = params.limit ? Number(params.limit) : 20;
  const offset = params.offset ? Number(params.offset) : 0;

  const conditions: ReturnType<typeof eq>[] = [eq(toursTable.isAvailable, true) as any];

  if (params.destinationId) conditions.push(eq(toursTable.destinationId, Number(params.destinationId)) as any);
  if (params.categoryId) conditions.push(eq(toursTable.categoryId, Number(params.categoryId)) as any);
  if (params.featured !== undefined) conditions.push(eq(toursTable.isFeatured, params.featured) as any);
  if (params.isPrivate !== undefined) conditions.push(eq(toursTable.isPrivate, params.isPrivate) as any);
  if (params.isFamilyFriendly !== undefined) conditions.push(eq(toursTable.isFamilyFriendly, params.isFamilyFriendly) as any);
  if (params.hasHotelPickup !== undefined) conditions.push(eq(toursTable.hasHotelPickup, params.hasHotelPickup) as any);
  if (params.freeCancellation !== undefined) conditions.push(eq(toursTable.freeCancellation, params.freeCancellation) as any);
  if (params.instantConfirmation !== undefined) conditions.push(eq(toursTable.instantConfirmation, params.instantConfirmation) as any);
  if (params.isBestSeller) conditions.push(sql`${toursTable.bookingCount} > 500` as any);
  if (params.minPrice) conditions.push(gte(toursTable.price, String(params.minPrice)) as any);
  if (params.maxPrice) conditions.push(lte(toursTable.price, String(params.maxPrice)) as any);
  if (params.minDuration) conditions.push(gte(toursTable.durationHours, String(params.minDuration)) as any);
  if (params.maxDuration) conditions.push(lte(toursTable.durationHours, String(params.maxDuration)) as any);
  if (params.minRating) conditions.push(gte(toursTable.rating, String(params.minRating)) as any);
  if (params.search) conditions.push(ilike(toursTable.title, `%${params.search}%`) as any);

  let orderBy;
  switch (params.sortBy) {
    case "price_asc": orderBy = asc(toursTable.price); break;
    case "price_desc": orderBy = desc(toursTable.price); break;
    case "rating": orderBy = desc(toursTable.rating); break;
    case "best_seller": orderBy = desc(toursTable.bookingCount); break;
    case "duration_asc": orderBy = asc(toursTable.durationHours); break;
    case "duration_desc": orderBy = desc(toursTable.durationHours); break;
    default: orderBy = desc(toursTable.createdAt);
  }

  const [tours, countResult, dests, cats] = await Promise.all([
    db.select().from(toursTable).where(and(...conditions)).orderBy(orderBy).limit(limit).offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(toursTable).where(and(...conditions)),
    db.select().from(destinationsTable),
    db.select().from(categoriesTable),
  ]);

  const destMap = Object.fromEntries(dests.map(d => [d.id, d.name]));
  const catMap = Object.fromEntries(cats.map(c => [c.id, c.name]));

  res.json(ListToursResponse.parse({
    tours: tours.map(t => formatTour(t, destMap[t.destinationId], catMap[t.categoryId])),
    total: Number(countResult[0]?.count ?? 0),
    limit,
    offset,
  }));
});

router.post("/tours", async (req, res): Promise<void> => {
  const parsed = CreateTourBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const data = parsed.data;
  const [tour] = await db.insert(toursTable).values({
    ...data,
    price: String(data.price),
    durationHours: String(data.durationHours),
    discountPrice: data.discountPrice != null ? String(data.discountPrice) : null,
  }).returning();

  res.status(201).json(CreateTourResponse.parse(formatTour(tour)));
});

router.get("/tours/:id", async (req, res): Promise<void> => {
  const params = GetTourParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const [tour] = await db.select().from(toursTable).where(eq(toursTable.id, params.data.id));
  if (!tour) { res.status(404).json({ error: "Tour not found" }); return; }

  const [dest] = await db.select().from(destinationsTable).where(eq(destinationsTable.id, tour.destinationId));
  const [cat] = await db.select().from(categoriesTable).where(eq(categoriesTable.id, tour.categoryId));

  let itinerary: Array<{ order: number; title: string; description: string | null; durationMinutes: number | null }> = [];
  let faq: Array<{ question: string; answer: string }> = [];
  try { itinerary = JSON.parse(tour.itinerary); } catch { itinerary = []; }
  try { faq = JSON.parse(tour.faq); } catch { faq = []; }

  const formatted = formatTour(tour, dest?.name, cat?.name);
  res.json(GetTourResponse.parse({
    ...formatted,
    itinerary,
    meetingPoint: tour.meetingPoint ?? null,
    languages: tour.languages,
    reviews: [],
    faq,
    whatsappNumber: tour.whatsappNumber ?? null,
    videoUrl: tour.videoUrl ?? null,
  }));
});

router.patch("/tours/:id", async (req, res): Promise<void> => {
  const params = UpdateTourParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const parsed = UpdateTourBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const data = parsed.data;
  const updates: Record<string, unknown> = { ...data };
  if (data.price !== undefined) updates.price = String(data.price);
  if (data.durationHours !== undefined) updates.durationHours = String(data.durationHours);
  if (data.discountPrice !== undefined) updates.discountPrice = data.discountPrice != null ? String(data.discountPrice) : null;

  const [tour] = await db.update(toursTable).set(updates).where(eq(toursTable.id, params.data.id)).returning();
  if (!tour) { res.status(404).json({ error: "Tour not found" }); return; }

  res.json(UpdateTourResponse.parse(formatTour(tour)));
});

router.delete("/tours/:id", async (req, res): Promise<void> => {
  const params = DeleteTourParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const [tour] = await db.delete(toursTable).where(eq(toursTable.id, params.data.id)).returning();
  if (!tour) { res.status(404).json({ error: "Tour not found" }); return; }

  res.json(DeleteTourResponse.parse({ message: "Tour deleted" }));
});

router.get("/tours/:id/availability", async (req, res): Promise<void> => {
  const params = GetTourAvailabilityParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const [tour] = await db.select().from(toursTable).where(eq(toursTable.id, params.data.id));
  if (!tour) { res.status(404).json({ error: "Tour not found" }); return; }

  const slots = [];
  const today = new Date();
  for (let i = 1; i <= 30; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const available = tour.isAvailable;
    slots.push({
      date: date.toISOString().split("T")[0],
      available,
      spotsLeft: available ? (tour.maxParticipants ?? 12) : 0,
      price: null,
    });
  }
  res.json(GetTourAvailabilityResponse.parse(slots));
});

export default router;

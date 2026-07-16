import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, wishlistsTable, toursTable, destinationsTable, categoriesTable } from "@workspace/db";
import {
  GetWishlistResponse,
  AddToWishlistBody,
  AddToWishlistResponse,
  RemoveFromWishlistParams,
  RemoveFromWishlistResponse,
} from "@workspace/api-zod";
import { requireAuth, type AuthRequest } from "../lib/auth";

const router: IRouter = Router();

router.get("/wishlist", requireAuth, async (req, res): Promise<void> => {
  const user = (req as AuthRequest).user;

  const items = await db.select().from(wishlistsTable).where(eq(wishlistsTable.userId, user.id));
  const tourIds = items.map((i) => i.tourId);

  if (tourIds.length === 0) {
    res.json(GetWishlistResponse.parse([]));
    return;
  }

  const tours = await db.select().from(toursTable).where(eq(toursTable.id, tourIds[0]));
  const dests = await db.select().from(destinationsTable);
  const cats = await db.select().from(categoriesTable);
  const destMap = Object.fromEntries(dests.map((d) => [d.id, d.name]));
  const catMap = Object.fromEntries(cats.map((c) => [c.id, c.name]));

  const result = tours.map((t) => ({
    id: t.id,
    title: t.title,
    slug: t.slug,
    description: t.description,
    price: Number(t.price),
    discountPrice: t.discountPrice != null ? Number(t.discountPrice) : null,
    durationHours: Number(t.durationHours),
    destinationId: t.destinationId,
    destinationName: destMap[t.destinationId] ?? null,
    categoryId: t.categoryId,
    categoryName: catMap[t.categoryId] ?? null,
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
    createdAt: t.createdAt.toISOString(),
  }));

  res.json(GetWishlistResponse.parse(result));
});

router.post("/wishlist", requireAuth, async (req, res): Promise<void> => {
  const user = (req as AuthRequest).user;
  const parsed = AddToWishlistBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { tourId } = parsed.data;

  // Avoid duplicates
  const [existing] = await db.select().from(wishlistsTable)
    .where(and(eq(wishlistsTable.userId, user.id), eq(wishlistsTable.tourId, tourId)));

  if (!existing) {
    await db.insert(wishlistsTable).values({ userId: user.id, tourId });
  }

  res.status(201).json(AddToWishlistResponse.parse({ message: "Added to wishlist" }));
});

router.delete("/wishlist/:tourId", requireAuth, async (req, res): Promise<void> => {
  const user = (req as AuthRequest).user;
  const params = RemoveFromWishlistParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  await db.delete(wishlistsTable)
    .where(and(eq(wishlistsTable.userId, user.id), eq(wishlistsTable.tourId, params.data.tourId)));

  res.json(RemoveFromWishlistResponse.parse({ message: "Removed from wishlist" }));
});

export default router;

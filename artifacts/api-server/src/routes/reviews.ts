import { Router, type IRouter } from "express";
import { eq, desc, and, gte } from "drizzle-orm";
import { db, reviewsTable, toursTable } from "@workspace/db";
import {
  ListReviewsQueryParams,
  ListReviewsResponse,
  CreateReviewBody,
  CreateReviewResponse,
} from "@workspace/api-zod";
import { requireAuth, type AuthRequest } from "../lib/auth.js";

const router: IRouter = Router();

function formatReview(
  r: typeof reviewsTable.$inferSelect,
  tourTitle?: string | null,
) {
  return {
    id: r.id,
    tourId: r.tourId,
    userId: r.userId ?? null,
    name: r.name,
    country: r.country ?? null,
    tourTitle: tourTitle ?? null,
    userName: null,
    userAvatar: null,
    rating: Number(r.rating),
    comment: r.comment ?? null,
    createdAt: r.createdAt.toISOString(),
  };
}

/** Recalculate and persist a tour's rating + reviewCount */
async function recalcTourStats(tourId: number): Promise<void> {
  const tourReviews = await db
    .select()
    .from(reviewsTable)
    .where(eq(reviewsTable.tourId, tourId));

  const count = tourReviews.length;
  const avgRating =
    count > 0
      ? tourReviews.reduce((sum, r) => sum + Number(r.rating), 0) / count
      : 0;

  await db
    .update(toursTable)
    .set({
      rating: String(avgRating.toFixed(2)),
      reviewCount: count,
    })
    .where(eq(toursTable.id, tourId));
}

router.get("/reviews", async (req, res): Promise<void> => {
  const query = ListReviewsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const { tourId, rating, limit: rawLimit, offset: rawOffset } = query.data;
  const limit = rawLimit ? Number(rawLimit) : 20;
  const offset = rawOffset ? Number(rawOffset) : 0;

  const conditions = [];
  if (tourId !== undefined) conditions.push(eq(reviewsTable.tourId, tourId));
  if (rating !== undefined) conditions.push(gte(reviewsTable.rating, String(rating)));

  const reviews = await db
    .select()
    .from(reviewsTable)
    .where(conditions.length > 0 ? and(...(conditions as [ReturnType<typeof eq>])) : undefined)
    .orderBy(desc(reviewsTable.createdAt))
    .limit(limit)
    .offset(offset);

  // Fetch tour titles when no specific tourId is provided (e.g. homepage top reviews)
  let tourTitleMap: Record<number, string> = {};
  if (tourId === undefined && reviews.length > 0) {
    const tours = await db.select({ id: toursTable.id, title: toursTable.title }).from(toursTable);
    tourTitleMap = Object.fromEntries(tours.map((t) => [t.id, t.title]));
  }

  const result = reviews.map((r) => formatReview(r, tourTitleMap[r.tourId]));
  res.json(ListReviewsResponse.parse(result));
});

router.post("/reviews", async (req, res): Promise<void> => {
  const parsed = CreateReviewBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { tourId, name, country, rating, comment } = parsed.data;

  // Verify tour exists
  const [tour] = await db.select().from(toursTable).where(eq(toursTable.id, tourId));
  if (!tour) {
    res.status(404).json({ error: "Tour not found" });
    return;
  }

  const [review] = await db
    .insert(reviewsTable)
    .values({
      tourId,
      userId: null,
      name,
      country: country ?? null,
      rating: String(rating),
      comment: comment ?? null,
    })
    .returning();

  await recalcTourStats(tourId);

  res.status(201).json(
    CreateReviewResponse.parse(formatReview(review, tour.title)),
  );
});

/** DELETE /reviews/:id  — admin only */
router.delete("/reviews/:id", requireAuth, async (req, res): Promise<void> => {
  const user = (req as AuthRequest).user;
  if (user.role !== "admin") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const id = parseInt(String(req.params.id), 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid review ID" });
    return;
  }

  const [existing] = await db
    .select()
    .from(reviewsTable)
    .where(eq(reviewsTable.id, id));

  if (!existing) {
    res.status(404).json({ error: "Review not found" });
    return;
  }

  await db.delete(reviewsTable).where(eq(reviewsTable.id, id));
  await recalcTourStats(existing.tourId);

  res.json({ message: "Review deleted", tourId: existing.tourId });
});

/** PATCH /reviews/:id  — admin only (edit comment/rating) */
router.patch("/reviews/:id", requireAuth, async (req, res): Promise<void> => {
  const user = (req as AuthRequest).user;
  if (user.role !== "admin") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const id = parseInt(String(req.params.id), 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid review ID" });
    return;
  }

  const { rating, comment } = req.body as { rating?: number; comment?: string };
  if (rating === undefined && comment === undefined) {
    res.status(400).json({ error: "Provide rating or comment to update" });
    return;
  }

  const [existing] = await db
    .select()
    .from(reviewsTable)
    .where(eq(reviewsTable.id, id));

  if (!existing) {
    res.status(404).json({ error: "Review not found" });
    return;
  }

  const updates: Partial<typeof reviewsTable.$inferInsert> = {};
  if (rating !== undefined) {
    if (rating < 1 || rating > 5) {
      res.status(400).json({ error: "Rating must be between 1 and 5" });
      return;
    }
    updates.rating = String(rating);
  }
  if (comment !== undefined) updates.comment = comment;

  const [updated] = await db
    .update(reviewsTable)
    .set(updates)
    .where(eq(reviewsTable.id, id))
    .returning();

  await recalcTourStats(existing.tourId);

  const [tour] = await db.select({ title: toursTable.title }).from(toursTable).where(eq(toursTable.id, existing.tourId));
  res.json(formatReview(updated, tour?.title ?? null));
});

export default router;

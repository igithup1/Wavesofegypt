import { Router, type IRouter } from "express";
import { eq, desc, and, gte } from "drizzle-orm";
import { db, reviewsTable, toursTable } from "@workspace/db";
import {
  ListReviewsQueryParams,
  ListReviewsResponse,
  CreateReviewBody,
  CreateReviewResponse,
} from "@workspace/api-zod";

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
    const tourIds = [...new Set(reviews.map((r) => r.tourId))];
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

  // Update tour rating and review count
  const tourReviews = await db
    .select()
    .from(reviewsTable)
    .where(eq(reviewsTable.tourId, tourId));
  const avgRating =
    tourReviews.reduce((sum, r) => sum + Number(r.rating), 0) / tourReviews.length;
  await db
    .update(toursTable)
    .set({
      rating: String(avgRating.toFixed(2)),
      reviewCount: tourReviews.length,
    })
    .where(eq(toursTable.id, tourId));

  res.status(201).json(
    CreateReviewResponse.parse(formatReview(review, tour.title)),
  );
});

export default router;

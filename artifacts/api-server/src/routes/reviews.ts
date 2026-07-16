import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, reviewsTable, usersTable, toursTable } from "@workspace/db";
import {
  ListReviewsQueryParams,
  ListReviewsResponse,
  CreateReviewBody,
  CreateReviewResponse,
} from "@workspace/api-zod";
import { requireAuth, type AuthRequest } from "../lib/auth";

const router: IRouter = Router();

router.get("/reviews", async (req, res): Promise<void> => {
  const query = ListReviewsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const tourId = Number(query.data.tourId);
  const limit = query.data.limit ? Number(query.data.limit) : 20;
  const offset = query.data.offset ? Number(query.data.offset) : 0;

  const reviews = await db
    .select()
    .from(reviewsTable)
    .where(eq(reviewsTable.tourId, tourId))
    .orderBy(desc(reviewsTable.createdAt))
    .limit(limit)
    .offset(offset);

  const userIds = [...new Set(reviews.map((r) => r.userId))];
  const users = userIds.length > 0
    ? await db.select({ id: usersTable.id, name: usersTable.name, avatar: usersTable.avatar })
        .from(usersTable)
        .where(eq(usersTable.id, userIds[0])) // simplified
    : [];
  const userMap = Object.fromEntries(users.map((u) => [u.id, u]));

  const result = reviews.map((r) => ({
    id: r.id,
    tourId: r.tourId,
    userId: r.userId,
    userName: userMap[r.userId]?.name ?? null,
    userAvatar: userMap[r.userId]?.avatar ?? null,
    rating: Number(r.rating),
    comment: r.comment,
    createdAt: r.createdAt.toISOString(),
  }));

  res.json(ListReviewsResponse.parse(result));
});

router.post("/reviews", requireAuth, async (req, res): Promise<void> => {
  const user = (req as AuthRequest).user;
  const parsed = CreateReviewBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { tourId, rating, comment } = parsed.data;

  const [review] = await db
    .insert(reviewsTable)
    .values({ tourId, userId: user.id, rating: String(rating), comment })
    .returning();

  // Update tour rating and review count
  const tourReviews = await db.select().from(reviewsTable).where(eq(reviewsTable.tourId, tourId));
  const avgRating = tourReviews.reduce((sum, r) => sum + Number(r.rating), 0) / tourReviews.length;
  await db.update(toursTable)
    .set({ rating: String(avgRating.toFixed(2)), reviewCount: tourReviews.length })
    .where(eq(toursTable.id, tourId));

  res.status(201).json(CreateReviewResponse.parse({
    id: review.id,
    tourId: review.tourId,
    userId: review.userId,
    userName: user.name,
    userAvatar: user.avatar,
    rating: Number(review.rating),
    comment: review.comment,
    createdAt: review.createdAt.toISOString(),
  }));
});

export default router;

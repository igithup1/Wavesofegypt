import { Router, type IRouter } from "express";
import { sql, eq, desc } from "drizzle-orm";
import { db, toursTable, destinationsTable, categoriesTable, bookingsTable, usersTable } from "@workspace/db";
import {
  GetPlatformStatsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/stats", async (_req, res): Promise<void> => {
  const [tourCount] = await db.select({ count: sql<number>`count(*)` }).from(toursTable);
  const [destCount] = await db.select({ count: sql<number>`count(*)` }).from(destinationsTable);
  const [bookingCount] = await db.select({ count: sql<number>`count(*)` }).from(bookingsTable);
  const [userCount] = await db.select({ count: sql<number>`count(*)` }).from(usersTable);
  const [avgRating] = await db.select({ avg: sql<number>`avg(${toursTable.rating})` }).from(toursTable);

  const topDestinations = await db.select().from(destinationsTable).where(eq(destinationsTable.featured, true)).limit(6);
  const tours = await db.select({ destinationId: toursTable.destinationId }).from(toursTable).where(eq(toursTable.isAvailable, true));
  const tourCountMap: Record<number, number> = {};
  for (const t of tours) { tourCountMap[t.destinationId] = (tourCountMap[t.destinationId] ?? 0) + 1; }

  const popularCategories = await db.select().from(categoriesTable).limit(8);
  const catTours = await db.select({ categoryId: toursTable.categoryId }).from(toursTable).where(eq(toursTable.isAvailable, true));
  const catCountMap: Record<number, number> = {};
  for (const t of catTours) { catCountMap[t.categoryId] = (catCountMap[t.categoryId] ?? 0) + 1; }

  res.json(GetPlatformStatsResponse.parse({
    totalTours: Number(tourCount?.count ?? 0),
    totalDestinations: Number(destCount?.count ?? 0),
    totalBookings: Number(bookingCount?.count ?? 0),
    happyTravelers: Number(userCount?.count ?? 0) * 12,
    averageRating: Number(Number(avgRating?.avg ?? 4.8).toFixed(1)),
    topDestinations: topDestinations.map((d) => ({
      id: d.id, name: d.name, slug: d.slug, description: d.description,
      region: d.region as "red_sea" | "nile_valley" | "mediterranean" | "western_desert" | "sinai",
      imageUrl: d.imageUrl, tourCount: tourCountMap[d.id] ?? 0, featured: d.featured,
    })),
    popularCategories: popularCategories.map((c) => ({
      id: c.id, name: c.name, slug: c.slug, icon: c.icon, color: c.color,
      tourCount: catCountMap[c.id] ?? 0,
    })),
  }));
});

export default router;

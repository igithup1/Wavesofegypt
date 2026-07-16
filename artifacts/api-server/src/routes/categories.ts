import { Router, type IRouter } from "express";
import { db, categoriesTable, toursTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  ListCategoriesResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/categories", async (_req, res): Promise<void> => {
  const categories = await db.select().from(categoriesTable);

  const tours = await db.select({ categoryId: toursTable.categoryId }).from(toursTable).where(eq(toursTable.isAvailable, true));
  const countMap: Record<number, number> = {};
  for (const t of tours) {
    countMap[t.categoryId] = (countMap[t.categoryId] ?? 0) + 1;
  }

  const result = categories.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    icon: c.icon,
    color: c.color,
    tourCount: countMap[c.id] ?? 0,
  }));

  res.json(ListCategoriesResponse.parse(result));
});

export default router;

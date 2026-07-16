import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, destinationsTable, toursTable } from "@workspace/db";
import {
  ListDestinationsQueryParams,
  ListDestinationsResponse,
  CreateDestinationBody,
  CreateDestinationResponse,
  GetDestinationParams,
  GetDestinationResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/destinations", async (req, res): Promise<void> => {
  const query = ListDestinationsQueryParams.safeParse(req.query);
  const limit = query.success && query.data.limit ? Number(query.data.limit) : 100;

  const destinations = await db.select().from(destinationsTable);

  // Count tours per destination
  const tours = await db.select({ destinationId: toursTable.destinationId }).from(toursTable).where(eq(toursTable.isAvailable, true));
  const tourCountMap: Record<number, number> = {};
  for (const t of tours) {
    tourCountMap[t.destinationId] = (tourCountMap[t.destinationId] ?? 0) + 1;
  }

  let filtered = destinations.map((d) => ({
    id: d.id,
    name: d.name,
    slug: d.slug,
    description: d.description,
    region: d.region as "red_sea" | "nile_valley" | "mediterranean" | "western_desert" | "sinai",
    imageUrl: d.imageUrl,
    tourCount: tourCountMap[d.id] ?? 0,
    featured: d.featured,
  }));

  if (query.success && query.data.featured !== undefined) {
    filtered = filtered.filter((d) => d.featured === query.data.featured);
  }

  const result = filtered.slice(0, limit);
  res.json(ListDestinationsResponse.parse(result));
});

router.post("/destinations", async (req, res): Promise<void> => {
  const parsed = CreateDestinationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [dest] = await db.insert(destinationsTable).values(parsed.data).returning();

  res.status(201).json(CreateDestinationResponse.parse({
    id: dest.id,
    name: dest.name,
    slug: dest.slug,
    description: dest.description,
    region: dest.region as "red_sea" | "nile_valley" | "mediterranean" | "western_desert" | "sinai",
    imageUrl: dest.imageUrl,
    tourCount: 0,
    featured: dest.featured,
  }));
});

router.get("/destinations/:id", async (req, res): Promise<void> => {
  const params = GetDestinationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [dest] = await db.select().from(destinationsTable).where(eq(destinationsTable.id, params.data.id));
  if (!dest) {
    res.status(404).json({ error: "Destination not found" });
    return;
  }

  const tours = await db.select({ id: toursTable.id }).from(toursTable)
    .where(eq(toursTable.destinationId, dest.id));

  res.json(GetDestinationResponse.parse({
    id: dest.id,
    name: dest.name,
    slug: dest.slug,
    description: dest.description,
    region: dest.region as "red_sea" | "nile_valley" | "mediterranean" | "western_desert" | "sinai",
    imageUrl: dest.imageUrl,
    tourCount: tours.length,
    featured: dest.featured,
  }));
});

export default router;

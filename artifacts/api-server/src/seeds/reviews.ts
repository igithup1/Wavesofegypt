/**
 * Seed script: populate reviews table with the 6 original review objects.
 * Run with: pnpm --filter @workspace/api-server tsx src/seeds/reviews.ts
 */
import { db, reviewsTable, toursTable } from "@workspace/db";
import { ilike, eq } from "drizzle-orm";

const SEED_REVIEWS = [
  {
    tourSearch: "Orange Bay",
    name: "Sarah M.",
    country: "United Kingdom",
    rating: 5,
    comment:
      "Absolutely incredible. The Orange Bay trip was the highlight of our holiday. The boat, food, and snorkeling were all perfect. Booked via WhatsApp and confirmed in minutes.",
  },
  {
    tourSearch: "Desert Safari",
    name: "Marcus K.",
    country: "Germany",
    rating: 5,
    comment:
      "The desert quad bike safari was amazing. Our guide was so knowledgeable about Bedouin culture. Hotel pickup was on time, everything was organized perfectly.",
  },
  {
    tourSearch: "Snorkeling",
    name: "Elena V.",
    country: "Russia",
    rating: 5,
    comment:
      "My kids loved the family snorkeling trip. The guide was patient with children, the boat had good shade and the fish were incredible. Will definitely book again next year.",
  },
  {
    tourSearch: "Diving",
    name: "Ahmed R.",
    country: "Saudi Arabia",
    rating: 5,
    comment:
      "Best diving experience I've ever had. The instructor was PADI certified, the equipment was clean and modern, and the coral reef at Giftun Island is stunning.",
  },
  {
    tourSearch: "Luxor",
    name: "Julia B.",
    country: "France",
    rating: 5,
    comment:
      "The Luxor day trip from Hurghada was worth every penny. The private guide at Karnak Temple was exceptional — so much knowledge. Highly recommend this company.",
  },
  {
    tourSearch: "Water Sports",
    name: "Tom H.",
    country: "Australia",
    rating: 5,
    comment:
      "Jet skiing, parasailing, and banana boat all in one afternoon. The staff were friendly and safety-conscious. Great value for money and instant WhatsApp confirmation.",
  },
];

async function seed() {
  console.log("Seeding reviews…");

  // Check if reviews already exist
  const existing = await db.select().from(reviewsTable).limit(1);
  if (existing.length > 0) {
    console.log("Reviews table already has data — skipping seed.");
    process.exit(0);
  }

  // Fetch all tours once
  const allTours = await db.select({ id: toursTable.id, title: toursTable.title }).from(toursTable);

  // Find a fallback tourId (first available tour)
  const fallbackTourId = allTours[0]?.id ?? 1;

  const toInsert = SEED_REVIEWS.map((rev) => {
    const match = allTours.find((t) =>
      t.title.toLowerCase().includes(rev.tourSearch.toLowerCase()),
    );
    const tourId = match?.id ?? fallbackTourId;
    return {
      tourId,
      userId: null as number | null,
      name: rev.name,
      country: rev.country,
      rating: String(rev.rating),
      comment: rev.comment,
    };
  });

  await db.insert(reviewsTable).values(toInsert);
  console.log(`Inserted ${toInsert.length} reviews.`);

  // Update rating/reviewCount for affected tours
  const affectedTourIds = [...new Set(toInsert.map((r) => r.tourId))];
  for (const tourId of affectedTourIds) {
    const tourReviews = await db
      .select()
      .from(reviewsTable)
      .where(eq(reviewsTable.tourId, tourId));
    const avg =
      tourReviews.reduce((s, r) => s + Number(r.rating), 0) / tourReviews.length;
    await db
      .update(toursTable)
      .set({ rating: String(avg.toFixed(2)), reviewCount: tourReviews.length })
      .where(eq(toursTable.id, tourId));
  }

  console.log("Done.");
  process.exit(0);
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});

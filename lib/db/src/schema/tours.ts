import { pgTable, serial, text, boolean, integer, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const toursTable = pgTable("tours", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  discountPrice: numeric("discount_price", { precision: 10, scale: 2 }),
  durationHours: numeric("duration_hours", { precision: 5, scale: 1 }).notNull(),
  destinationId: integer("destination_id").notNull(),
  categoryId: integer("category_id").notNull(),
  vendorId: integer("vendor_id"),
  coverImage: text("cover_image").notNull(),
  images: text("images").array().notNull().default([]),
  included: text("included").array().notNull().default([]),
  excluded: text("excluded").array().notNull().default([]),
  highlights: text("highlights").array().notNull().default([]),
  itinerary: text("itinerary").notNull().default("[]"),
  maxParticipants: integer("max_participants"),
  minAge: integer("min_age"),
  difficulty: text("difficulty"),
  meetingPoint: text("meeting_point"),
  languages: text("languages").array().notNull().default(["English", "Arabic"]),
  isFeatured: boolean("is_featured").notNull().default(false),
  isAvailable: boolean("is_available").notNull().default(true),
  isPrivate: boolean("is_private").notNull().default(false),
  isFamilyFriendly: boolean("is_family_friendly").notNull().default(false),
  hasHotelPickup: boolean("has_hotel_pickup").notNull().default(true),
  freeCancellation: boolean("free_cancellation").notNull().default(false),
  instantConfirmation: boolean("instant_confirmation").notNull().default(true),
  groupType: text("group_type").notNull().default("group"),
  badge: text("badge"),
  tags: text("tags").array().notNull().default([]),
  faq: text("faq").notNull().default("[]"),
  whatsappNumber: text("whatsapp_number"),
  videoUrl: text("video_url"),
  rating: numeric("rating", { precision: 3, scale: 2 }).notNull().default("0"),
  reviewCount: integer("review_count").notNull().default(0),
  bookingCount: integer("booking_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertTourSchema = createInsertSchema(toursTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertTour = z.infer<typeof insertTourSchema>;
export type Tour = typeof toursTable.$inferSelect;

import { sqliteTable, text, real, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";

export const placeTypes = ["skog", "vid_vagen", "fjall", "strand", "ovrigt"] as const;
export type PlaceType = (typeof placeTypes)[number];

export const places = sqliteTable("places", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => randomUUID()),
  name: text("name").notNull(),
  description: text("description"),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  type: text("type", { enum: placeTypes }).notNull().default("ovrigt"),
  // Nullable tills flera användare/inloggning finns.
  ownerId: text("owner_id"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(current_timestamp)`),
});

export type Place = typeof places.$inferSelect;
export type NewPlace = typeof places.$inferInsert;

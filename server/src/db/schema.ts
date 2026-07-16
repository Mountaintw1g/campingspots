import { sqliteTable, text, real, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";

export const placeTypes = ["skog", "vid_vatten", "fjall", "vagkant", "ovrigt"] as const;
export type PlaceType = (typeof placeTypes)[number];

export const reportReasons = ["privat_mark", "farlig_plats", "felaktig_info", "ej_tillatet", "annat"] as const;
export type ReportReason = (typeof reportReasons)[number];

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
  saved: integer("saved", { mode: "boolean" }).notNull().default(false),
  // Måste vara true innan en plats får skapas - bekräftar att marken är
  // laglig att tälta på enligt allemansrätten.
  legalConfirmed: integer("legal_confirmed", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(current_timestamp)`),
});

export const reports = sqliteTable("reports", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => randomUUID()),
  placeId: text("place_id")
    .notNull()
    .references(() => places.id, { onDelete: "cascade" }),
  reason: text("reason", { enum: reportReasons }).notNull(),
  comment: text("comment"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(current_timestamp)`),
});

export type Place = typeof places.$inferSelect;
export type NewPlace = typeof places.$inferInsert;
export type Report = typeof reports.$inferSelect;
export type NewReport = typeof reports.$inferInsert;

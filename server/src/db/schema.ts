import { pgSchema, pgTable, uuid, text, real, boolean, timestamp, primaryKey, unique } from "drizzle-orm/pg-core";

export const placeTypes = ["skog", "vid_vatten", "fjall", "vagkant", "ovrigt"] as const;
export type PlaceType = (typeof placeTypes)[number];

export const reportReasons = ["privat_mark", "farlig_plats", "felaktig_info", "ej_tillatet", "annat"] as const;
export type ReportReason = (typeof reportReasons)[number];

// Read-only referens in i Supabase Auths schema, bara för att kunna sätta
// riktiga foreign keys mot auth.users.id. drizzle-kit rör aldrig detta
// schema tack vare schemaFilter i drizzle.config.ts.
const authSchema = pgSchema("auth");
export const authUsers = authSchema.table("users", {
  id: uuid("id").primaryKey(),
});

export const places = pgTable("places", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  type: text("type", { enum: placeTypes }).notNull().default("ovrigt"),
  // Platsen överlever om ägarens konto raderas.
  ownerId: uuid("owner_id").references(() => authUsers.id, { onDelete: "set null" }),
  // Måste vara true innan en plats får skapas - bekräftar att marken är
  // laglig att tälta på enligt allemansrätten.
  legalConfirmed: boolean("legal_confirmed").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const savedPlaces = pgTable(
  "saved_places",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    placeId: uuid("place_id")
      .notNull()
      .references(() => places.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.placeId] })],
);

export const reports = pgTable(
  "reports",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    placeId: uuid("place_id")
      .notNull()
      .references(() => places.id, { onDelete: "cascade" }),
    reporterId: uuid("reporter_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    reason: text("reason", { enum: reportReasons }).notNull(),
    comment: text("comment"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique("reports_place_reporter_unique").on(t.placeId, t.reporterId)],
);

export type Place = typeof places.$inferSelect;
export type NewPlace = typeof places.$inferInsert;
export type SavedPlace = typeof savedPlaces.$inferSelect;
export type Report = typeof reports.$inferSelect;
export type NewReport = typeof reports.$inferInsert;

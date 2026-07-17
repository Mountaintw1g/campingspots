import { Router } from "express";
import { and, eq, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import { places, placeTypes, reports, reportReasons, savedPlaces, profiles } from "../db/schema.js";
import { requireAuth, optionalAuth } from "../middleware/auth.js";

export const placesRouter = Router();

function isUniqueViolation(err: unknown): boolean {
  return typeof err === "object" && err !== null && "code" in err && (err as { code?: string }).code === "23505";
}

async function reportCountsByPlace(): Promise<Map<string, number>> {
  const rows = await db
    .select({ placeId: reports.placeId, count: sql<number>`count(*)` })
    .from(reports)
    .groupBy(reports.placeId);
  return new Map(rows.map((r) => [r.placeId, r.count]));
}

async function savedPlaceIdsForUser(userId: string): Promise<Set<string>> {
  const rows = await db.select({ placeId: savedPlaces.placeId }).from(savedPlaces).where(eq(savedPlaces.userId, userId));
  return new Set(rows.map((r) => r.placeId));
}

async function reportedPlaceIdsForUser(userId: string): Promise<Set<string>> {
  const rows = await db.select({ placeId: reports.placeId }).from(reports).where(eq(reports.reporterId, userId));
  return new Set(rows.map((r) => r.placeId));
}

async function usernamesByOwnerId(): Promise<Map<string, string>> {
  const rows = await db.select({ id: profiles.id, username: profiles.username }).from(profiles);
  return new Map(rows.map((r) => [r.id, r.username]));
}

async function usernameForOwner(ownerId: string | null): Promise<string | null> {
  if (!ownerId) return null;
  const [profile] = await db.select({ username: profiles.username }).from(profiles).where(eq(profiles.id, ownerId));
  return profile?.username ?? null;
}

placesRouter.get("/", optionalAuth, async (req, res) => {
  const rows = await db.select().from(places);
  const counts = await reportCountsByPlace();
  const usernames = await usernamesByOwnerId();
  const savedIds = req.userId ? await savedPlaceIdsForUser(req.userId) : new Set<string>();
  const reportedIds = req.userId ? await reportedPlaceIdsForUser(req.userId) : new Set<string>();

  res.json(
    rows.map((row) => ({
      ...row,
      reportCount: counts.get(row.id) ?? 0,
      ownerUsername: row.ownerId ? (usernames.get(row.ownerId) ?? null) : null,
      savedByMe: savedIds.has(row.id),
      reportedByMe: reportedIds.has(row.id),
    })),
  );
});

placesRouter.get("/:id", optionalAuth, async (req, res) => {
  const [row] = await db.select().from(places).where(eq(places.id, req.params.id));
  if (!row) {
    res.status(404).json({ error: "Platsen hittades inte", code: "PLACE_NOT_FOUND" });
    return;
  }
  const counts = await reportCountsByPlace();
  const savedIds = req.userId ? await savedPlaceIdsForUser(req.userId) : new Set<string>();
  const reportedIds = req.userId ? await reportedPlaceIdsForUser(req.userId) : new Set<string>();

  res.json({
    ...row,
    reportCount: counts.get(row.id) ?? 0,
    ownerUsername: await usernameForOwner(row.ownerId),
    savedByMe: savedIds.has(row.id),
    reportedByMe: reportedIds.has(row.id),
  });
});

placesRouter.post("/", requireAuth, async (req, res) => {
  const { name, description, latitude, longitude, type, legalConfirmed } = req.body ?? {};

  if (typeof name !== "string" || name.trim() === "") {
    res.status(400).json({ error: "Namn krävs", code: "NAME_REQUIRED" });
    return;
  }
  if (typeof latitude !== "number" || typeof longitude !== "number") {
    res.status(400).json({ error: "Latitude och longitude krävs som tal", code: "COORDINATES_REQUIRED" });
    return;
  }
  if (type !== undefined && !placeTypes.includes(type)) {
    res.status(400).json({ error: `Typ måste vara en av: ${placeTypes.join(", ")}`, code: "INVALID_TYPE" });
    return;
  }
  if (legalConfirmed !== true) {
    res.status(400).json({
      error: "Du måste bekräfta att platsen är laglig enligt allemansrätten",
      code: "LEGAL_CONFIRMATION_REQUIRED",
    });
    return;
  }

  const ownerUsername = await usernameForOwner(req.userId!);
  if (!ownerUsername) {
    res.status(403).json({ error: "Du måste välja ett användarnamn innan du kan lägga till platser", code: "USERNAME_REQUIRED" });
    return;
  }

  const [created] = await db
    .insert(places)
    .values({
      name: name.trim(),
      description: typeof description === "string" ? description : null,
      latitude,
      longitude,
      type: type ?? "ovrigt",
      legalConfirmed: true,
      ownerId: req.userId,
    })
    .returning();

  res.status(201).json({ ...created, reportCount: 0, ownerUsername, savedByMe: false, reportedByMe: false });
});

placesRouter.put("/:id", requireAuth, async (req, res) => {
  const [existing] = await db.select().from(places).where(eq(places.id, req.params.id));
  if (!existing) {
    res.status(404).json({ error: "Platsen hittades inte", code: "PLACE_NOT_FOUND" });
    return;
  }
  if (existing.ownerId !== req.userId && !req.isAdmin) {
    res.status(403).json({ error: "Du kan bara redigera dina egna platser", code: "NOT_OWNER_EDIT" });
    return;
  }

  const { name, description, latitude, longitude, type } = req.body ?? {};

  if (type !== undefined && !placeTypes.includes(type)) {
    res.status(400).json({ error: `Typ måste vara en av: ${placeTypes.join(", ")}`, code: "INVALID_TYPE" });
    return;
  }

  const [updated] = await db
    .update(places)
    .set({
      ...(name !== undefined && { name }),
      ...(description !== undefined && { description }),
      ...(latitude !== undefined && { latitude }),
      ...(longitude !== undefined && { longitude }),
      ...(type !== undefined && { type }),
    })
    .where(eq(places.id, req.params.id))
    .returning();

  const counts = await reportCountsByPlace();
  const savedIds = await savedPlaceIdsForUser(req.userId!);
  const reportedIds = await reportedPlaceIdsForUser(req.userId!);

  res.json({
    ...updated,
    reportCount: counts.get(updated.id) ?? 0,
    ownerUsername: await usernameForOwner(updated.ownerId),
    savedByMe: savedIds.has(updated.id),
    reportedByMe: reportedIds.has(updated.id),
  });
});

placesRouter.delete("/:id", requireAuth, async (req, res) => {
  const [existing] = await db.select().from(places).where(eq(places.id, req.params.id));
  if (!existing) {
    res.status(404).json({ error: "Platsen hittades inte", code: "PLACE_NOT_FOUND" });
    return;
  }
  if (existing.ownerId !== req.userId && !req.isAdmin) {
    res.status(403).json({ error: "Du kan bara ta bort dina egna platser", code: "NOT_OWNER_DELETE" });
    return;
  }

  await db.delete(places).where(eq(places.id, req.params.id));
  res.status(204).send();
});

placesRouter.post("/:id/save", requireAuth, async (req, res) => {
  const [place] = await db.select().from(places).where(eq(places.id, req.params.id));
  if (!place) {
    res.status(404).json({ error: "Platsen hittades inte", code: "PLACE_NOT_FOUND" });
    return;
  }

  await db.insert(savedPlaces).values({ userId: req.userId!, placeId: req.params.id }).onConflictDoNothing();
  res.status(204).send();
});

placesRouter.delete("/:id/save", requireAuth, async (req, res) => {
  await db
    .delete(savedPlaces)
    .where(and(eq(savedPlaces.userId, req.userId!), eq(savedPlaces.placeId, req.params.id)));
  res.status(204).send();
});

placesRouter.get("/:id/reports/mine", requireAuth, async (req, res) => {
  const [mine] = await db
    .select()
    .from(reports)
    .where(and(eq(reports.placeId, req.params.id), eq(reports.reporterId, req.userId!)));

  if (!mine) {
    res.status(404).json({ error: "Ingen rapport hittades", code: "REPORT_NOT_FOUND" });
    return;
  }
  res.json(mine);
});

placesRouter.post("/:id/reports", requireAuth, async (req, res) => {
  const [place] = await db.select().from(places).where(eq(places.id, req.params.id));
  if (!place) {
    res.status(404).json({ error: "Platsen hittades inte", code: "PLACE_NOT_FOUND" });
    return;
  }

  const { reason, comment } = req.body ?? {};
  if (typeof reason !== "string" || !reportReasons.includes(reason as (typeof reportReasons)[number])) {
    res.status(400).json({ error: `Anledning måste vara en av: ${reportReasons.join(", ")}`, code: "INVALID_REASON" });
    return;
  }

  try {
    const [created] = await db
      .insert(reports)
      .values({
        placeId: place.id,
        reporterId: req.userId!,
        reason: reason as (typeof reportReasons)[number],
        comment: typeof comment === "string" && comment.trim() !== "" ? comment.trim() : null,
      })
      .returning();

    res.status(201).json(created);
  } catch (err) {
    if (isUniqueViolation(err)) {
      res.status(409).json({ error: "Du har redan rapporterat den här platsen", code: "ALREADY_REPORTED" });
      return;
    }
    throw err;
  }
});

placesRouter.delete("/:id/reports/:reportId", requireAuth, async (req, res) => {
  const [deleted] = await db
    .delete(reports)
    .where(
      and(
        eq(reports.id, req.params.reportId),
        eq(reports.placeId, req.params.id),
        eq(reports.reporterId, req.userId!),
      ),
    )
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Rapporten hittades inte", code: "REPORT_NOT_FOUND" });
    return;
  }
  res.status(204).send();
});

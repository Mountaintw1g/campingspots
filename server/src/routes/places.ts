import { Router } from "express";
import { eq, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import { places, placeTypes, reports, reportReasons } from "../db/schema.js";

export const placesRouter = Router();

async function reportCountsByPlace(): Promise<Map<string, number>> {
  const rows = await db
    .select({ placeId: reports.placeId, count: sql<number>`count(*)` })
    .from(reports)
    .groupBy(reports.placeId)
    .all();
  return new Map(rows.map((r) => [r.placeId, r.count]));
}

placesRouter.get("/", async (_req, res) => {
  const rows = await db.select().from(places).all();
  const counts = await reportCountsByPlace();
  res.json(rows.map((row) => ({ ...row, reportCount: counts.get(row.id) ?? 0 })));
});

placesRouter.get("/:id", async (req, res) => {
  const row = await db.select().from(places).where(eq(places.id, req.params.id)).get();
  if (!row) {
    res.status(404).json({ error: "Platsen hittades inte" });
    return;
  }
  const counts = await reportCountsByPlace();
  res.json({ ...row, reportCount: counts.get(row.id) ?? 0 });
});

placesRouter.post("/", async (req, res) => {
  const { name, description, latitude, longitude, type, legalConfirmed } = req.body ?? {};

  if (typeof name !== "string" || name.trim() === "") {
    res.status(400).json({ error: "Namn krävs" });
    return;
  }
  if (typeof latitude !== "number" || typeof longitude !== "number") {
    res.status(400).json({ error: "Latitude och longitude krävs som tal" });
    return;
  }
  if (type !== undefined && !placeTypes.includes(type)) {
    res.status(400).json({ error: `Typ måste vara en av: ${placeTypes.join(", ")}` });
    return;
  }
  if (legalConfirmed !== true) {
    res.status(400).json({ error: "Du måste bekräfta att platsen är laglig enligt allemansrätten" });
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
    })
    .returning();

  res.status(201).json({ ...created, reportCount: 0 });
});

placesRouter.put("/:id", async (req, res) => {
  const { name, description, latitude, longitude, type, saved } = req.body ?? {};

  if (type !== undefined && !placeTypes.includes(type)) {
    res.status(400).json({ error: `Typ måste vara en av: ${placeTypes.join(", ")}` });
    return;
  }
  if (saved !== undefined && typeof saved !== "boolean") {
    res.status(400).json({ error: "saved måste vara true eller false" });
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
      ...(saved !== undefined && { saved }),
    })
    .where(eq(places.id, req.params.id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Platsen hittades inte" });
    return;
  }
  const counts = await reportCountsByPlace();
  res.json({ ...updated, reportCount: counts.get(updated.id) ?? 0 });
});

placesRouter.delete("/:id", async (req, res) => {
  const [deleted] = await db.delete(places).where(eq(places.id, req.params.id)).returning();
  if (!deleted) {
    res.status(404).json({ error: "Platsen hittades inte" });
    return;
  }
  res.status(204).send();
});

placesRouter.post("/:id/reports", async (req, res) => {
  const place = await db.select().from(places).where(eq(places.id, req.params.id)).get();
  if (!place) {
    res.status(404).json({ error: "Platsen hittades inte" });
    return;
  }

  const { reason, comment } = req.body ?? {};
  if (typeof reason !== "string" || !reportReasons.includes(reason as (typeof reportReasons)[number])) {
    res.status(400).json({ error: `Anledning måste vara en av: ${reportReasons.join(", ")}` });
    return;
  }

  const [created] = await db
    .insert(reports)
    .values({
      placeId: place.id,
      reason: reason as (typeof reportReasons)[number],
      comment: typeof comment === "string" && comment.trim() !== "" ? comment.trim() : null,
    })
    .returning();

  res.status(201).json(created);
});

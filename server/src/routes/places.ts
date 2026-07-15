import { Router } from "express";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { places, placeTypes } from "../db/schema.js";

export const placesRouter = Router();

placesRouter.get("/", async (_req, res) => {
  const rows = await db.select().from(places).all();
  res.json(rows);
});

placesRouter.get("/:id", async (req, res) => {
  const row = await db.select().from(places).where(eq(places.id, req.params.id)).get();
  if (!row) {
    res.status(404).json({ error: "Platsen hittades inte" });
    return;
  }
  res.json(row);
});

placesRouter.post("/", async (req, res) => {
  const { name, description, latitude, longitude, type } = req.body ?? {};

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

  const [created] = await db
    .insert(places)
    .values({
      name: name.trim(),
      description: typeof description === "string" ? description : null,
      latitude,
      longitude,
      type: type ?? "ovrigt",
    })
    .returning();

  res.status(201).json(created);
});

placesRouter.put("/:id", async (req, res) => {
  const { name, description, latitude, longitude, type } = req.body ?? {};

  if (type !== undefined && !placeTypes.includes(type)) {
    res.status(400).json({ error: `Typ måste vara en av: ${placeTypes.join(", ")}` });
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

  if (!updated) {
    res.status(404).json({ error: "Platsen hittades inte" });
    return;
  }
  res.json(updated);
});

placesRouter.delete("/:id", async (req, res) => {
  const [deleted] = await db.delete(places).where(eq(places.id, req.params.id)).returning();
  if (!deleted) {
    res.status(404).json({ error: "Platsen hittades inte" });
    return;
  }
  res.status(204).send();
});

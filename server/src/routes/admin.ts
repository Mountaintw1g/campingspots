import { Router } from "express";
import { eq, inArray } from "drizzle-orm";
import { db } from "../db/index.js";
import { places, reports, profiles } from "../db/schema.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { getSupabaseAdmin } from "../lib/supabaseAdmin.js";

export const adminRouter = Router();

adminRouter.get("/users", requireAuth, requireAdmin, async (_req, res) => {
  try {
    const { data, error } = await getSupabaseAdmin().auth.admin.listUsers({ perPage: 1000 });
    if (error) {
      res.status(500).json({ error: "Kunde inte hämta användarlistan", code: "GENERIC" });
      return;
    }

    const users = data.users.map((u) => ({
      id: u.id,
      email: u.email ?? "",
      createdAt: u.created_at,
      lastSignInAt: u.last_sign_in_at ?? null,
    }));

    res.json(users);
  } catch {
    res.status(500).json({ error: "Kunde inte hämta användarlistan", code: "GENERIC" });
  }
});

adminRouter.get("/reports", requireAuth, requireAdmin, async (_req, res) => {
  const allReports = await db.select().from(reports);
  if (allReports.length === 0) {
    res.json([]);
    return;
  }

  const placeIds = [...new Set(allReports.map((r) => r.placeId))];
  const [reportedPlaces, profileRows] = await Promise.all([
    db.select().from(places).where(inArray(places.id, placeIds)),
    db.select().from(profiles),
  ]);
  const usernames = new Map(profileRows.map((p) => [p.id, p.username]));

  const reportsByPlace = new Map<string, typeof allReports>();
  for (const r of allReports) {
    const list = reportsByPlace.get(r.placeId) ?? [];
    list.push(r);
    reportsByPlace.set(r.placeId, list);
  }

  const result = reportedPlaces
    .map((place) => ({
      id: place.id,
      name: place.name,
      type: place.type,
      latitude: place.latitude,
      longitude: place.longitude,
      ownerUsername: place.ownerId ? (usernames.get(place.ownerId) ?? null) : null,
      reports: (reportsByPlace.get(place.id) ?? [])
        .map((r) => ({
          id: r.id,
          reason: r.reason,
          comment: r.comment,
          createdAt: r.createdAt,
          reporterUsername: usernames.get(r.reporterId) ?? null,
        }))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    }))
    .sort((a, b) => b.reports.length - a.reports.length);

  res.json(result);
});

adminRouter.delete("/reports/:placeId", requireAuth, requireAdmin, async (req, res) => {
  await db.delete(reports).where(eq(reports.placeId, req.params.placeId));
  res.status(204).send();
});

import { Router } from "express";
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

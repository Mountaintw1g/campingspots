import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { getSupabaseAdmin } from "../lib/supabaseAdmin.js";

export const accountRouter = Router();

// Platser användaren äger blir ägarlösa (owner_id sätts till null via
// ON DELETE SET NULL i schemat) - de försvinner inte från kartan.
accountRouter.delete("/", requireAuth, async (req, res) => {
  try {
    const { error } = await getSupabaseAdmin().auth.admin.deleteUser(req.userId!);
    if (error) {
      res.status(500).json({ error: "Kunde inte ta bort kontot", code: "ACCOUNT_DELETE_FAILED" });
      return;
    }
    res.status(204).send();
  } catch {
    res.status(500).json({ error: "Kunde inte ta bort kontot", code: "ACCOUNT_DELETE_FAILED" });
  }
});

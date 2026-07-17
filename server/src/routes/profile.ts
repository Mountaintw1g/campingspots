import { Router } from "express";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { profiles } from "../db/schema.js";
import { requireAuth } from "../middleware/auth.js";

export const profileRouter = Router();

const USERNAME_REGEX = /^[a-zA-Z0-9]{3,20}$/;

function isUniqueViolation(err: unknown): boolean {
  return typeof err === "object" && err !== null && "code" in err && (err as { code?: string }).code === "23505";
}

profileRouter.get("/me", requireAuth, async (req, res) => {
  const [profile] = await db.select().from(profiles).where(eq(profiles.id, req.userId!));
  res.json({ username: profile?.username ?? null });
});

profileRouter.get("/availability", requireAuth, async (req, res) => {
  const username = typeof req.query.username === "string" ? req.query.username : "";
  if (!USERNAME_REGEX.test(username)) {
    res.status(400).json({ error: "Ogiltigt användarnamn", code: "INVALID_USERNAME" });
    return;
  }

  const [existing] = await db.select({ id: profiles.id }).from(profiles).where(eq(profiles.username, username));
  res.json({ available: !existing });
});

profileRouter.post("/", requireAuth, async (req, res) => {
  const { username } = req.body ?? {};
  if (typeof username !== "string" || !USERNAME_REGEX.test(username)) {
    res.status(400).json({
      error: "Användarnamnet måste vara 3-20 tecken och bara innehålla bokstäver och siffror",
      code: "INVALID_USERNAME",
    });
    return;
  }

  try {
    await db
      .insert(profiles)
      .values({ id: req.userId!, username })
      .onConflictDoUpdate({ target: profiles.id, set: { username } });
    res.status(201).json({ username });
  } catch (err) {
    if (isUniqueViolation(err)) {
      res.status(409).json({ error: "Användarnamnet är upptaget", code: "USERNAME_TAKEN" });
      return;
    }
    throw err;
  }
});

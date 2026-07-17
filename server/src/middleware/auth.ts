import type { Request, Response, NextFunction } from "express";
import { webcrypto } from "node:crypto";
import { createRemoteJWKSet, jwtVerify } from "jose";

// jose förlitar sig på webbläsarens globala crypto (Web Crypto API), som
// Node 18 inte exponerar automatiskt (stabilt först från Node 19+).
if (!globalThis.crypto) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).crypto = webcrypto;
}

// .trim() skyddar mot extra radbrytning/mellanslag som lätt smyger sig med
// vid copy-paste i molnplattformars miljövariabel-fält (t.ex. Render).
const supabaseUrl = process.env.SUPABASE_URL?.trim();
if (!supabaseUrl) {
  throw new Error("SUPABASE_URL saknas");
}

const adminEmails = new Set(
  (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean),
);

const issuer = `${supabaseUrl}/auth/v1`;
// Skapas en gång vid modul-laddning - jose cachar/uppdaterar nycklarna
// internt, ska inte skapas om per request.
const jwks = createRemoteJWKSet(new URL(`${issuer}/.well-known/jwks.json`));

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userId?: string;
      userEmail?: string;
      isAdmin?: boolean;
    }
  }
}

interface VerifiedUser {
  userId: string;
  email: string | null;
}

async function verifyBearer(authHeader: string | undefined): Promise<VerifiedUser | null> {
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice("Bearer ".length);
  try {
    const { payload } = await jwtVerify(token, jwks, { issuer });
    if (typeof payload.sub !== "string") return null;
    return { userId: payload.sub, email: typeof payload.email === "string" ? payload.email : null };
  } catch {
    return null;
  }
}

function isAdminEmail(email: string | null): boolean {
  return !!email && adminEmails.has(email.toLowerCase());
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const verified = await verifyBearer(req.headers.authorization);
  if (!verified) {
    res.status(401).json({ error: "Inloggning krävs", code: "LOGIN_REQUIRED" });
    return;
  }
  req.userId = verified.userId;
  req.userEmail = verified.email ?? undefined;
  req.isAdmin = isAdminEmail(verified.email);
  next();
}

export async function optionalAuth(req: Request, res: Response, next: NextFunction) {
  const verified = await verifyBearer(req.headers.authorization);
  req.userId = verified?.userId;
  req.userEmail = verified?.email ?? undefined;
  req.isAdmin = isAdminEmail(verified?.email ?? null);
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.isAdmin) {
    res.status(403).json({ error: "Kräver administratörsbehörighet", code: "ADMIN_REQUIRED" });
    return;
  }
  next();
}

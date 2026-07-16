import type { Request, Response, NextFunction } from "express";
import { webcrypto } from "node:crypto";
import { createRemoteJWKSet, jwtVerify } from "jose";

// jose förlitar sig på webbläsarens globala crypto (Web Crypto API), som
// Node 18 inte exponerar automatiskt (stabilt först från Node 19+).
if (!globalThis.crypto) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).crypto = webcrypto;
}

if (!process.env.SUPABASE_URL) {
  throw new Error("SUPABASE_URL saknas");
}

const issuer = `${process.env.SUPABASE_URL}/auth/v1`;
// Skapas en gång vid modul-laddning - jose cachar/uppdaterar nycklarna
// internt, ska inte skapas om per request.
const jwks = createRemoteJWKSet(new URL(`${issuer}/.well-known/jwks.json`));

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

async function verifyBearer(authHeader: string | undefined): Promise<string | null> {
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice("Bearer ".length);
  try {
    const { payload } = await jwtVerify(token, jwks, { issuer });
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const userId = await verifyBearer(req.headers.authorization);
  if (!userId) {
    res.status(401).json({ error: "Inloggning krävs" });
    return;
  }
  req.userId = userId;
  next();
}

export async function optionalAuth(req: Request, res: Response, next: NextFunction) {
  req.userId = (await verifyBearer(req.headers.authorization)) ?? undefined;
  next();
}

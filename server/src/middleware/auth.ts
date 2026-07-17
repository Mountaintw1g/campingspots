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

async function verifyBearer(authHeader: string | undefined): Promise<{ userId: string | null; debug?: string }> {
  if (!authHeader?.startsWith("Bearer ")) return { userId: null, debug: "no-bearer-header" };
  const token = authHeader.slice("Bearer ".length);
  try {
    const { payload } = await jwtVerify(token, jwks, { issuer });
    return { userId: typeof payload.sub === "string" ? payload.sub : null };
  } catch (err) {
    const msg = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
    return { userId: null, debug: `expected-issuer="${issuer}" | ${msg}` };
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const { userId, debug } = await verifyBearer(req.headers.authorization);
  if (!userId) {
    // TILLFÄLLIG debug-info i svaret för att felsöka produktionsmiljön - tas bort igen.
    res.status(401).json({ error: "Inloggning krävs", debug });
    return;
  }
  req.userId = userId;
  next();
}

export async function optionalAuth(req: Request, res: Response, next: NextFunction) {
  const { userId } = await verifyBearer(req.headers.authorization);
  req.userId = userId ?? undefined;
  next();
}

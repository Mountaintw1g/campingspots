import "dotenv/config";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema.js";

const databaseUrl = process.env.DATABASE_URL?.trim();
if (!databaseUrl) {
  throw new Error("DATABASE_URL saknas");
}

// prepare: false krävs för Supabases Supavisor-pooler (session mode, port 5432).
const client = postgres(databaseUrl, { prepare: false });

export const db = drizzle(client, { schema });

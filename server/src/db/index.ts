import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import * as schema from "./schema.js";

const dataDir = fileURLToPath(new URL("../../data", import.meta.url));
const dbPath = fileURLToPath(new URL("../../data/campingspots.db", import.meta.url));

mkdirSync(dataDir, { recursive: true });

const sqlite = new Database(dbPath);
sqlite.pragma("journal_mode = WAL");

export const db = drizzle(sqlite, { schema });

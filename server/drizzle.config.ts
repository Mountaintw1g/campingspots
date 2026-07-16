import "dotenv/config";
import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL saknas");
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
  // Vi äger bara public-schemat - auth är Supabases eget schema och ska
  // aldrig diffas/migreras av drizzle-kit.
  schemaFilter: ["public"],
});

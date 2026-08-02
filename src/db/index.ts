import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Supabase Postgres, sterownik postgres.js.
// `prepare: false` jest wymagane przy poolerze transakcyjnym Supabase (Supavisor,
// port 6543) — nie wspiera prepared statements. Transakcje interaktywne wymagane
// przez maszynę stanów (status + ticket_event razem) działają.
if (!process.env.DATABASE_URL) {
  throw new Error("Brak zmiennej DATABASE_URL");
}

const client = postgres(process.env.DATABASE_URL, {
  prepare: false,
  ssl: "require",
});

export const db = drizzle(client, { schema, casing: "snake_case" });

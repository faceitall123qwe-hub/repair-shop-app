import { defineConfig } from "drizzle-kit";

// drizzle-kit CLI nie ładuje .env sam; Node ≥20.12 potrafi to zrobić.
// W CI/produkcji zmienne przychodzą ze środowiska, więc brak pliku jest OK.
try {
  process.loadEnvFile(".env.local");
} catch {
  // .env.local nie istnieje — pomijamy
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL ?? "" },
  casing: "snake_case",
  strict: true,
  verbose: true,
});

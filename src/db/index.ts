import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import * as schema from "./schema";

// Sterownik neon-serverless (WebSocket), a NIE neon-http: maszyna stanów
// wymaga interaktywnych transakcji (zmiana statusu + ticket_event razem),
// których wariant HTTP nie obsługuje.
if (!process.env.DATABASE_URL) {
  throw new Error("Brak zmiennej DATABASE_URL");
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export const db = drizzle({ client: pool, schema });

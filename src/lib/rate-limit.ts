import { and, eq, gt, lt } from "drizzle-orm";
import { createHash } from "node:crypto";
import { db } from "../db";
import { rateLimits } from "../db/schema";

// Surowe IP nigdy nie trafia do bazy — tylko SHA-256 z solą z env (RODO).
export function hashIp(ip: string): string {
  return createHash("sha256")
    .update(ip + (process.env.IP_HASH_SALT ?? ""))
    .digest("hex");
}

// Przesuwane okno w Postgresie (bez Redisa). true = wolno, false = limit.
export async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<boolean> {
  const since = new Date(Date.now() - windowMs);
  const count = await db.$count(
    rateLimits,
    and(eq(rateLimits.key, key), gt(rateLimits.createdAt, since)),
  );
  if (count >= limit) return false;
  await db.insert(rateLimits).values({ key });
  if (Math.random() < 0.02) {
    await db
      .delete(rateLimits)
      .where(lt(rateLimits.createdAt, new Date(Date.now() - 24 * 60 * 60 * 1000)));
  }
  return true;
}

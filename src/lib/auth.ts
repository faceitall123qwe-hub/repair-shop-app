import { and, eq, gt } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { randomBytes } from "node:crypto";
import { db } from "../db";
import { adminUsers, sessions } from "../db/schema";

const COOKIE = "serwis_session";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 dni

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: "OWNER" | "STAFF";
};

export async function createSession(userId: string): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + MAX_AGE * 1000);
  await db.insert(sessions).values({ token, userId, expiresAt });
  const c = await cookies();
  c.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const rows = await db
    .select({
      id: adminUsers.id,
      email: adminUsers.email,
      name: adminUsers.name,
      role: adminUsers.role,
    })
    .from(sessions)
    .innerJoin(adminUsers, eq(sessions.userId, adminUsers.id))
    .where(and(eq(sessions.token, token), gt(sessions.expiresAt, new Date())))
    .limit(1);
  return rows[0] ?? null;
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/panel/login");
  return user;
}

export async function destroySession(): Promise<void> {
  const c = await cookies();
  const token = c.get(COOKIE)?.value;
  if (token) await db.delete(sessions).where(eq(sessions.token, token));
  c.delete(COOKIE);
}

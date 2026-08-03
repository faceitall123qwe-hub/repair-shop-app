"use server";

import { verify } from "@node-rs/argon2";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { adminUsers } from "@/db/schema";
import { createSession } from "@/lib/auth";
import { checkRateLimit, hashIp } from "@/lib/rate-limit";

export type LoginState = { error: string };

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  const ip =
    (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "0.0.0.0";
  if (!(await checkRateLimit(`login:${hashIp(ip)}`, 5, 15 * 60 * 1000))) {
    return { error: "Za dużo prób logowania. Spróbuj za kilkanaście minut." };
  }

  const [user] = await db
    .select()
    .from(adminUsers)
    .where(eq(adminUsers.email, email))
    .limit(1);

  if (!user || !(await verify(user.passwordHash, password))) {
    return { error: "Nieprawidłowy e-mail lub hasło." };
  }

  await db.update(adminUsers).set({ lastLoginAt: new Date() }).where(eq(adminUsers.id, user.id));
  await createSession(user.id);
  redirect("/panel");
}

"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { tickets } from "@/db/schema";
import { checkRateLimit, hashIp } from "@/lib/rate-limit";
import { notifyQuoteDecision } from "@/services/notifications";
import { TicketError, updateTicketStatus } from "@/services/tickets";
import { verifyCodePhone } from "@/services/tracking";

export type LookupState = { error: string };

export async function lookupAction(
  _prev: LookupState,
  formData: FormData,
): Promise<LookupState> {
  const start = Date.now();
  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  const phone4 = String(formData.get("phone4") ?? "").replace(/\D/g, "").slice(-4);

  const ip =
    (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "0.0.0.0";
  const allowed = await checkRateLimit(`status:${hashIp(ip)}`, 5, 15 * 60 * 1000);

  let token: string | null = null;
  if (allowed && /^SRV-\d{4}-\d{4}$/.test(code) && phone4.length === 4) {
    token = await verifyCodePhone(code, phone4);
  }

  // Stały czas odpowiedzi (próg 500 ms) — timing nie zdradza, czy kod istnieje.
  const remaining = start + 500 - Date.now();
  if (remaining > 0) await new Promise((r) => setTimeout(r, remaining));

  if (!allowed) return { error: "Za dużo prób. Spróbuj za kilkanaście minut." };
  if (token) redirect(`/status/${token}`);
  return { error: "Nie znaleziono zgłoszenia dla podanych danych." };
}

export type DecideState = { error: string };

// Akceptacja/rezygnacja z wyceny przez klienta — token jest autoryzacją.
export async function decideQuoteAction(
  _prev: DecideState,
  formData: FormData,
): Promise<DecideState> {
  const token = String(formData.get("token") ?? "");
  const accepted = String(formData.get("decision")) === "accept";
  const [t] = await db
    .select({ id: tickets.id, status: tickets.status })
    .from(tickets)
    .where(eq(tickets.trackingToken, token))
    .limit(1);
  if (!t) return { error: "Nie znaleziono zgłoszenia." };
  if (t.status !== "WYCENA_WYSLANA") {
    return { error: "Wycena nie jest już do decyzji." };
  }
  try {
    await updateTicketStatus(t.id, accepted ? "W_NAPRAWIE" : "ODRZUCONA_WYCENA", "klient");
  } catch (e) {
    return { error: e instanceof TicketError ? e.message : "Nie udało się zapisać decyzji." };
  }
  await notifyQuoteDecision(t.id, accepted);
  revalidatePath(`/status/${token}`);
  return { error: "" };
}

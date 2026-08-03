"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { checkRateLimit, hashIp } from "@/lib/rate-limit";
import { verifyTurnstile } from "@/lib/turnstile";
import { ticketFormSchema } from "@/lib/validation/ticket";
import { createTicket } from "@/services/tickets";

export type SubmitState = {
  ok: boolean;
  errors?: Record<string, string>;
  formError?: string;
};

function str(v: FormDataEntryValue | null): string {
  return typeof v === "string" ? v : "";
}

export async function submitTicket(
  _prev: SubmitState,
  formData: FormData,
): Promise<SubmitState> {
  // Honeypot — udawaj sukces botowi.
  if (str(formData.get("website")).length > 0) return { ok: true };

  // Minimalny czas wypełnienia (bot < 3 s).
  const ts = Number(formData.get("formTs"));
  if (ts && Date.now() - ts < 3000) {
    return { ok: false, formError: "Formularz wysłany zbyt szybko — spróbuj ponownie." };
  }

  const h = await headers();
  const ip = str(h.get("x-forwarded-for") as never).split(",")[0]?.trim() || "0.0.0.0";
  const ipHash = hashIp(ip);

  // Turnstile tylko, gdy token obecny (ścieżka z JS).
  const tsToken = formData.get("cf-turnstile-response");
  if (typeof tsToken === "string" && tsToken.length > 0) {
    const ok = await verifyTurnstile(tsToken, ip);
    if (!ok) {
      return { ok: false, formError: "Weryfikacja antybot nie powiodła się. Odśwież stronę." };
    }
  }

  if (!(await checkRateLimit(`form:${ipHash}`, 3, 60 * 60 * 1000))) {
    return { ok: false, formError: "Za dużo zgłoszeń z tego adresu. Spróbuj później lub zadzwoń." };
  }

  const parsed = ticketFormSchema.safeParse({
    deviceType: str(formData.get("deviceType")),
    deviceBrand: str(formData.get("deviceBrand")),
    deviceModel: str(formData.get("deviceModel")),
    problemDescription: str(formData.get("problemDescription")),
    serviceIds: formData.getAll("serviceIds").map(String),
    postalCode: str(formData.get("postalCode")),
    addressLine: str(formData.get("addressLine")),
    city: str(formData.get("city")),
    preferredPickupDate: str(formData.get("preferredPickupDate")),
    preferredPickupSlot: str(formData.get("preferredPickupSlot")) || undefined,
    pickupNote: str(formData.get("pickupNote")),
    customerName: str(formData.get("customerName")),
    customerPhone: str(formData.get("customerPhone")),
    customerEmail: str(formData.get("customerEmail")),
    consentRodo: formData.get("consentRodo") === "on" || formData.get("consentRodo") === "true",
    consentMarketing: formData.get("consentMarketing") === "on",
  });

  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string" && !errors[key]) errors[key] = issue.message;
    }
    return { ok: false, errors };
  }

  const res = await createTicket(parsed.data, {
    ipHash,
    userAgent: h.get("user-agent") ?? undefined,
    source: "FORMULARZ",
  });

  redirect(`/zgloszenie/potwierdzenie?code=${encodeURIComponent(res.code)}`);
}

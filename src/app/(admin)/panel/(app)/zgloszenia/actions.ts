"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import type { TicketStatus } from "@/lib/ticket-state";
import {
  TicketError,
  setQuote,
  updateNotes,
  updateTicketStatus,
} from "@/services/tickets";

export type ActionState = { error: string };

function toGrosze(v: FormDataEntryValue | null): number | null {
  const s = String(v ?? "").replace(",", ".").trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? Math.round(n * 100) : null;
}

export async function updateStatusAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const ticketId = String(formData.get("ticketId"));
  const to = String(formData.get("toStatus")) as TicketStatus;
  if (!to) return { error: "Wybierz status." };
  try {
    await updateTicketStatus(ticketId, to, user.email);
  } catch (e) {
    if (e instanceof TicketError) return { error: e.message };
    throw e;
  }
  revalidatePath(`/panel/zgloszenia/${ticketId}`);
  return { error: "" };
}

export async function setQuoteAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const ticketId = String(formData.get("ticketId"));
  await setQuote(
    ticketId,
    {
      estimatedPriceMin: toGrosze(formData.get("estimatedPriceMin")),
      estimatedPriceMax: toGrosze(formData.get("estimatedPriceMax")),
      finalPrice: toGrosze(formData.get("finalPrice")),
      partsCost: toGrosze(formData.get("partsCost")),
    },
    user.email,
  );
  revalidatePath(`/panel/zgloszenia/${ticketId}`);
  return { error: "" };
}

export async function updateNotesAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const ticketId = String(formData.get("ticketId"));
  await updateNotes(
    ticketId,
    {
      publicNote: String(formData.get("publicNote") ?? "") || null,
      internalNote: String(formData.get("internalNote") ?? "") || null,
    },
    user.email,
  );
  revalidatePath(`/panel/zgloszenia/${ticketId}`);
  return { error: "" };
}

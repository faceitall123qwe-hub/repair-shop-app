import { eq, sql } from "drizzle-orm";
import { db } from "../db";
import {
  type NewTicket,
  ticketCounters,
  ticketEvents,
  tickets,
} from "../db/schema";
import { baseCoord, classifyArea, haversineKm } from "../lib/distance";
import { formatTicketCode, generateTrackingToken } from "../lib/ids";
import { lookupPostalCode } from "../lib/postal-codes";
import { canTransition, type TicketStatus } from "../lib/ticket-state";
import { normalizePhonePl, type TicketFormInput } from "../lib/validation/ticket";
import { notifyNewTicket, notifyStatusChange } from "./notifications";

type TicketSource = NonNullable<NewTicket["source"]>;

export type CreateTicketMeta = {
  ipHash?: string;
  userAgent?: string;
  source?: TicketSource;
};

export type CreateTicketResult = {
  id: string;
  code: string;
  trackingToken: string;
  distanceKm: number | null;
  inServiceArea: boolean | null;
};

// Jedyne miejsce tworzenia zgłoszenia. Woła je Server Action, API i webhook.
export async function createTicket(
  input: TicketFormInput,
  meta: CreateTicketMeta = {},
): Promise<CreateTicketResult> {
  const radiusKm = Number(process.env.SERVICE_RADIUS_KM ?? 50);

  const postal = lookupPostalCode(input.postalCode);
  let lat: string | null = null;
  let lng: string | null = null;
  let distanceKm: number | null = null;
  let inServiceArea: boolean | null = null;
  if (postal) {
    lat = String(postal.lat);
    lng = String(postal.lng);
    distanceKm = haversineKm(baseCoord(), { lat: postal.lat, lng: postal.lng });
    inServiceArea = classifyArea(distanceKm, radiusKm).inServiceArea;
  }

  const phone = normalizePhonePl(input.customerPhone);
  const year = new Date().getFullYear();
  const trackingToken = generateTrackingToken();

  const result = await db.transaction(async (tx) => {
    // Transakcyjny numer kolejny per rok (atomowy upsert-increment).
    const [counter] = await tx
      .insert(ticketCounters)
      .values({ year, lastSeq: 1 })
      .onConflictDoUpdate({
        target: ticketCounters.year,
        set: { lastSeq: sql`${ticketCounters.lastSeq} + 1` },
      })
      .returning({ lastSeq: ticketCounters.lastSeq });
    const code = formatTicketCode(year, counter!.lastSeq);

    const [ticket] = await tx
      .insert(tickets)
      .values({
        code,
        trackingToken,
        source: meta.source ?? "FORMULARZ",
        customerName: input.customerName,
        customerPhone: phone,
        customerEmail: input.customerEmail || null,
        addressLine: input.addressLine,
        city: input.city,
        postalCode: input.postalCode,
        lat,
        lng,
        distanceKm: distanceKm !== null ? distanceKm.toFixed(2) : null,
        inServiceArea,
        deviceType: input.deviceType,
        deviceBrand: input.deviceBrand || null,
        deviceModel: input.deviceModel || null,
        problemDescription: input.problemDescription,
        serviceIds: input.serviceIds && input.serviceIds.length ? input.serviceIds : null,
        preferredPickupDate: input.preferredPickupDate || null,
        preferredPickupSlot: input.preferredPickupSlot ?? null,
        pickupNote: input.pickupNote || null,
        consentRodo: input.consentRodo,
        consentMarketing: input.consentMarketing ?? false,
        ipHash: meta.ipHash ?? null,
        userAgent: meta.userAgent ?? null,
      })
      .returning({ id: tickets.id });

    await tx.insert(ticketEvents).values({
      ticketId: ticket!.id,
      type: "STATUS_CHANGE",
      toStatus: "NOWE",
      payload: { via: meta.source ?? "FORMULARZ" },
      actor: "system",
    });

    return { id: ticket!.id, code, trackingToken, distanceKm, inServiceArea };
  });

  await runSafely(() => notifyNewTicket(result.id));
  return result;
}

// Powiadomienia poza transakcją i fail-safe: ich błąd nie wywala operacji biznesowej.
async function runSafely(fn: () => Promise<void>): Promise<void> {
  try {
    await fn();
  } catch (e) {
    console.error("Powiadomienie nie powiodło się:", e);
  }
}

export class TicketError extends Error {}

// Zmiana statusu — jedyne miejsce. Waliduje przejście i wymóg ceny, zapisuje event.
export async function updateTicketStatus(
  ticketId: string,
  toStatus: TicketStatus,
  actor: string,
): Promise<void> {
  await db.transaction(async (tx) => {
    const [t] = await tx
      .select({
        status: tickets.status,
        estMin: tickets.estimatedPriceMin,
        estMax: tickets.estimatedPriceMax,
        finalPrice: tickets.finalPrice,
      })
      .from(tickets)
      .where(eq(tickets.id, ticketId))
      .for("update");
    if (!t) throw new TicketError("Nie znaleziono zgłoszenia.");
    if (!canTransition(t.status, toStatus)) {
      throw new TicketError(`Niedozwolone przejście: ${t.status} → ${toStatus}.`);
    }
    if (toStatus === "WYCENA_WYSLANA" && (t.estMin == null || t.estMax == null)) {
      throw new TicketError("Ustaw widełki wyceny przed jej wysłaniem.");
    }
    if (toStatus === "ZAKONCZONE" && t.finalPrice == null) {
      throw new TicketError("Ustaw cenę finalną przed zakończeniem.");
    }
    const closed = toStatus === "ZAKONCZONE" || toStatus === "ANULOWANE";
    await tx
      .update(tickets)
      .set({ status: toStatus, ...(closed ? { closedAt: new Date() } : {}) })
      .where(eq(tickets.id, ticketId));
    await tx.insert(ticketEvents).values({
      ticketId,
      type: "STATUS_CHANGE",
      fromStatus: t.status,
      toStatus,
      actor,
    });
  });

  await runSafely(() => notifyStatusChange(ticketId, toStatus));
}

export type QuoteInput = {
  estimatedPriceMin?: number | null;
  estimatedPriceMax?: number | null;
  finalPrice?: number | null;
  partsCost?: number | null;
};

export async function setQuote(
  ticketId: string,
  quote: QuoteInput,
  actor: string,
): Promise<void> {
  await db.transaction(async (tx) => {
    await tx.update(tickets).set(quote).where(eq(tickets.id, ticketId));
    await tx.insert(ticketEvents).values({
      ticketId,
      type: "PRICE_SET",
      payload: quote,
      actor,
    });
  });
}

export async function updateNotes(
  ticketId: string,
  notes: { publicNote?: string | null; internalNote?: string | null },
  actor: string,
): Promise<void> {
  await db.transaction(async (tx) => {
    await tx.update(tickets).set(notes).where(eq(tickets.id, ticketId));
    await tx.insert(ticketEvents).values({
      ticketId,
      type: "NOTE",
      payload: notes,
      actor,
    });
  });
}

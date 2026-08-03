import { sql } from "drizzle-orm";
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
import { normalizePhonePl, type TicketFormInput } from "../lib/validation/ticket";

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

  return await db.transaction(async (tx) => {
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
}

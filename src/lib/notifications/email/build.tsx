import type { ReactElement } from "react";
import { company } from "../../../config/company";
import {
  GotoweEmail,
  OdbiorEmail,
  PotwierdzenieEmail,
  WycenaEmail,
  ZakonczoneEmail,
} from "../../../emails/templates";
import { PICKUP_SLOT_LABELS } from "../../labels";
import type { TicketStatus } from "../../ticket-state";

type TicketLike = {
  code: string;
  customerName: string;
  trackingToken: string;
  estimatedPriceMin: number | null;
  estimatedPriceMax: number | null;
  finalPrice: number | null;
  preferredPickupDate: string | null;
  preferredPickupSlot: string | null;
};

function trackingUrl(token: string): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return `${base}/status/${token}`;
}

export function buildConfirmation(t: TicketLike): { subject: string; element: ReactElement } {
  return {
    subject: `Zgłoszenie ${t.code} przyjęte — ${company.name}`,
    element: PotwierdzenieEmail({
      code: t.code,
      customerName: t.customerName,
      trackingUrl: trackingUrl(t.trackingToken),
    }),
  };
}

export function buildStatusEmail(
  t: TicketLike,
  status: TicketStatus,
): { subject: string; element: ReactElement } | null {
  const url = trackingUrl(t.trackingToken);
  switch (status) {
    case "ODBIOR_ZAPLANOWANY":
      return {
        subject: `Odbiór zaplanowany — ${t.code}`,
        element: OdbiorEmail({
          code: t.code,
          pickupDate: t.preferredPickupDate ?? undefined,
          pickupSlot: t.preferredPickupSlot
            ? (PICKUP_SLOT_LABELS[t.preferredPickupSlot] ?? undefined)
            : undefined,
          trackingUrl: url,
        }),
      };
    case "WYCENA_WYSLANA":
      return {
        subject: `Wycena — ${t.code}`,
        element: WycenaEmail({
          code: t.code,
          min: t.estimatedPriceMin,
          max: t.estimatedPriceMax,
          final: t.finalPrice,
          trackingUrl: url,
        }),
      };
    case "GOTOWE":
      return {
        subject: `Sprzęt gotowy — ${t.code}`,
        element: GotoweEmail({ code: t.code, final: t.finalPrice, trackingUrl: url }),
      };
    case "ZAKONCZONE":
      return {
        subject: `Zlecenie zakończone — ${t.code}`,
        element: ZakonczoneEmail({ code: t.code, trackingUrl: url }),
      };
    default:
      return null;
  }
}

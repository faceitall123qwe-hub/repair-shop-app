import { describe, expect, it } from "vitest";
import {
  STATUS_META,
  TERMINAL_STATUSES,
  TICKET_STATUSES,
  type TicketStatus,
  allowedTransitions,
  canTransition,
  isTerminal,
  requiresPrice,
} from "@/lib/ticket-state";

const HAPPY_PATH: TicketStatus[] = [
  "NOWE",
  "POTWIERDZONE",
  "ODBIOR_ZAPLANOWANY",
  "ODEBRANE",
  "W_DIAGNOZIE",
  "WYCENA_WYSLANA",
  "W_NAPRAWIE",
  "GOTOWE",
  "ZWROT_ZAPLANOWANY",
  "ZAKONCZONE",
];

describe("canTransition", () => {
  it("przechodzi całą ścieżkę happy-path", () => {
    for (let i = 0; i < HAPPY_PATH.length - 1; i++) {
      expect(canTransition(HAPPY_PATH[i]!, HAPPY_PATH[i + 1]!)).toBe(true);
    }
  });

  it("pozwala anulować każdy stan nieterminalny", () => {
    for (const s of TICKET_STATUSES) {
      if (isTerminal(s)) continue;
      expect(canTransition(s, "ANULOWANE")).toBe(true);
    }
  });

  it("nie pozwala wyjść ze stanów terminalnych", () => {
    for (const s of TERMINAL_STATUSES) {
      for (const t of TICKET_STATUSES) {
        expect(canTransition(s, t)).toBe(false);
      }
    }
  });

  it("odrzuca przejścia niezadeklarowane", () => {
    expect(canTransition("NOWE", "GOTOWE")).toBe(false);
    expect(canTransition("WYCENA_WYSLANA", "ZAKONCZONE")).toBe(false);
    expect(canTransition("ODEBRANE", "W_NAPRAWIE")).toBe(false);
  });

  it("allowedTransitions jest spójne z canTransition dla wszystkich par", () => {
    for (const from of TICKET_STATUSES) {
      const allowed = allowedTransitions(from);
      for (const to of TICKET_STATUSES) {
        expect(canTransition(from, to)).toBe(allowed.includes(to));
      }
    }
  });
});

describe("requiresPrice", () => {
  it("wymaga ceny tylko dla WYCENA_WYSLANA i ZAKONCZONE", () => {
    for (const s of TICKET_STATUSES) {
      expect(requiresPrice(s)).toBe(s === "WYCENA_WYSLANA" || s === "ZAKONCZONE");
    }
  });
});

describe("STATUS_META", () => {
  it("ma niepusty wpis dla każdego statusu", () => {
    for (const s of TICKET_STATUSES) {
      expect(STATUS_META[s].label.length).toBeGreaterThan(0);
      expect(STATUS_META[s].clientDescription.length).toBeGreaterThan(0);
    }
  });
});

export const TICKET_STATUSES = [
  "NOWE",
  "POTWIERDZONE",
  "ODBIOR_ZAPLANOWANY",
  "ODEBRANE",
  "W_DIAGNOZIE",
  "WYCENA_WYSLANA",
  "W_NAPRAWIE",
  "GOTOWE",
  "ODRZUCONA_WYCENA",
  "ZWROT_ZAPLANOWANY",
  "ZAKONCZONE",
  "ANULOWANE",
] as const;

export type TicketStatus = (typeof TICKET_STATUSES)[number];

// Mapa dozwolonych przejść (sekcja 4 briefu). ANULOWANE dostępne z każdego
// stanu przed ZAKONCZONE. ZAKONCZONE i ANULOWANE są terminalne.
const TRANSITIONS: Record<TicketStatus, readonly TicketStatus[]> = {
  NOWE: ["POTWIERDZONE", "ANULOWANE"],
  POTWIERDZONE: ["ODBIOR_ZAPLANOWANY", "ANULOWANE"],
  ODBIOR_ZAPLANOWANY: ["ODEBRANE", "ANULOWANE"],
  ODEBRANE: ["W_DIAGNOZIE", "ANULOWANE"],
  W_DIAGNOZIE: ["WYCENA_WYSLANA", "ANULOWANE"],
  WYCENA_WYSLANA: ["W_NAPRAWIE", "ODRZUCONA_WYCENA", "ANULOWANE"],
  W_NAPRAWIE: ["GOTOWE", "ANULOWANE"],
  GOTOWE: ["ZWROT_ZAPLANOWANY", "ANULOWANE"],
  ODRZUCONA_WYCENA: ["ZWROT_ZAPLANOWANY", "ANULOWANE"],
  ZWROT_ZAPLANOWANY: ["ZAKONCZONE", "ANULOWANE"],
  ZAKONCZONE: [],
  ANULOWANE: [],
};

export function canTransition(from: TicketStatus, to: TicketStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

export function allowedTransitions(from: TicketStatus): readonly TicketStatus[] {
  return TRANSITIONS[from];
}

export const TERMINAL_STATUSES: readonly TicketStatus[] = [
  "ZAKONCZONE",
  "ANULOWANE",
];

export function isTerminal(status: TicketStatus): boolean {
  return TERMINAL_STATUSES.includes(status);
}

// Przejścia DO tych statusów wymagają ustawionej ceny (walidacja serwerowa).
const REQUIRES_PRICE: readonly TicketStatus[] = ["WYCENA_WYSLANA", "ZAKONCZONE"];

export function requiresPrice(to: TicketStatus): boolean {
  return REQUIRES_PRICE.includes(to);
}

export type StatusColor = "steel" | "pcb" | "signal" | "alert";

export type StatusMeta = {
  label: string;
  colorToken: StatusColor;
  clientDescription: string;
  notifyCustomer: boolean;
};

export const STATUS_META: Record<TicketStatus, StatusMeta> = {
  NOWE: {
    label: "Nowe",
    colorToken: "steel",
    clientDescription: "Zgłoszenie przyjęte. Wkrótce potwierdzę telefonicznie.",
    notifyCustomer: true,
  },
  POTWIERDZONE: {
    label: "Potwierdzone",
    colorToken: "steel",
    clientDescription: "Potwierdziłem zgłoszenie. Ustalamy termin odbioru.",
    notifyCustomer: false,
  },
  ODBIOR_ZAPLANOWANY: {
    label: "Odbiór zaplanowany",
    colorToken: "signal",
    clientDescription:
      "Odbiór sprzętu zaplanowany. Przyjadę w umówionym oknie czasowym.",
    notifyCustomer: true,
  },
  ODEBRANE: {
    label: "Odebrane",
    colorToken: "pcb",
    clientDescription: "Sprzęt odebrany, trafia do warsztatu.",
    notifyCustomer: false,
  },
  W_DIAGNOZIE: {
    label: "W diagnozie",
    colorToken: "pcb",
    clientDescription: "Diagnozuję usterkę. Wkrótce wyślę wycenę.",
    notifyCustomer: false,
  },
  WYCENA_WYSLANA: {
    label: "Wycena wysłana",
    colorToken: "signal",
    clientDescription: "Wysłałem wycenę. Czekam na Twoją decyzję.",
    notifyCustomer: true,
  },
  W_NAPRAWIE: {
    label: "W naprawie",
    colorToken: "pcb",
    clientDescription: "Wycena zaakceptowana — naprawiam sprzęt.",
    notifyCustomer: false,
  },
  GOTOWE: {
    label: "Gotowe",
    colorToken: "signal",
    clientDescription: "Sprzęt gotowy. Umawiamy się na zwrot.",
    notifyCustomer: true,
  },
  ODRZUCONA_WYCENA: {
    label: "Wycena odrzucona",
    colorToken: "alert",
    clientDescription: "Wycena odrzucona. Odwożę sprzęt bez naprawy.",
    notifyCustomer: false,
  },
  ZWROT_ZAPLANOWANY: {
    label: "Zwrot zaplanowany",
    colorToken: "pcb",
    clientDescription:
      "Zwrot sprzętu zaplanowany. Przywiozę go w umówionym oknie.",
    notifyCustomer: false,
  },
  ZAKONCZONE: {
    label: "Zakończone",
    colorToken: "pcb",
    clientDescription: "Zlecenie zakończone. Dziękuję!",
    notifyCustomer: true,
  },
  ANULOWANE: {
    label: "Anulowane",
    colorToken: "alert",
    clientDescription: "Zgłoszenie anulowane.",
    notifyCustomer: false,
  },
};

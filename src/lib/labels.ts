export const DEVICE_TYPE_LABELS: Record<string, string> = {
  LAPTOP: "Laptop",
  PC: "Komputer PC",
  IPHONE: "iPhone",
  ANDROID: "Telefon Android",
  KONSOLA: "Konsola",
  INNE: "Inne",
};

export const PICKUP_SLOT_LABELS: Record<string, string> = {
  RANO_8_12: "Rano 8–12",
  POPOLUDNIE_12_17: "Popołudnie 12–17",
  WIECZOR_17_21: "Wieczór 17–21",
  DOWOLNIE: "Dowolnie",
};

export const ZONE_LABELS: Record<string, string> = {
  GRATIS: "Odbiór i dowóz gratis",
  DO_USTALENIA: "Poza strefą gratis — dojazd do ustalenia",
  KURIER: "Daleko — sugerujemy wysyłkę kurierem",
};

export const SERVICE_CATEGORY_LABELS: Record<string, string> = {
  DIAGNOSTYKA: "Diagnostyka",
  NAPRAWA: "Naprawa",
  SERWIS_OKRESOWY: "Serwis okresowy",
  SOFTWARE: "Oprogramowanie",
  SKLADANIE: "Składanie i upgrade",
  TELEFONY: "Telefony",
};

export const SERVICE_CATEGORY_ORDER = [
  "DIAGNOSTYKA",
  "NAPRAWA",
  "SERWIS_OKRESOWY",
  "SOFTWARE",
  "SKLADANIE",
  "TELEFONY",
] as const;

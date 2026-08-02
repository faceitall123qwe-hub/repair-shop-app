import { hash } from "@node-rs/argon2";
import { haversineKm } from "../lib/distance";
import { formatTicketCode, generateTrackingToken } from "../lib/ids";
import { db } from "./index";
import {
  type NewService,
  adminUsers,
  serviceAreas,
  services,
  tickets,
} from "./schema";

const base = { lat: Number(process.env.BASE_LAT), lng: Number(process.env.BASE_LNG) };

// grosze = PLN * 100. TODO: zweryfikuj ceny — to są wartości startowe, nie mój cennik.
const SERVICES: NewService[] = [
  // Diagnostyka
  { slug: "diagnoza-laptopa", name: "Diagnoza laptopa", category: "DIAGNOSTYKA", shortDesc: "Ustalenie przyczyny usterki laptopa.", priceFromGrosze: 0, priceNote: "bezpłatna przy naprawie", turnaround: "24 h", deviceTypes: ["LAPTOP"], sortOrder: 10 },
  { slug: "diagnoza-pc", name: "Diagnoza komputera PC", category: "DIAGNOSTYKA", shortDesc: "Ustalenie przyczyny usterki komputera stacjonarnego.", priceFromGrosze: 0, priceNote: "bezpłatna przy naprawie", turnaround: "24 h", deviceTypes: ["PC"], sortOrder: 11 },
  { slug: "diagnoza-po-zalaniu", name: "Diagnoza po zalaniu", category: "DIAGNOSTYKA", shortDesc: "Kwalifikacja sprzętu po zalaniu i wstępna ocena szans.", priceFromGrosze: 8000, priceNote: "od", turnaround: "24–48 h", deviceTypes: ["LAPTOP", "PC"], sortOrder: 12 },

  // Naprawa
  { slug: "wymiana-ssd", name: "Montaż / wymiana dysku SSD", category: "NAPRAWA", shortDesc: "Wymiana lub dołożenie dysku SSD (bez kosztu części).", priceFromGrosze: 12000, priceNote: "od + części", turnaround: "24–48 h", deviceTypes: ["LAPTOP", "PC"], isPopular: true, sortOrder: 20 },
  { slug: "rozbudowa-ram", name: "Rozbudowa pamięci RAM", category: "NAPRAWA", shortDesc: "Dołożenie lub wymiana pamięci RAM.", priceFromGrosze: 8000, priceNote: "od + części", turnaround: "24 h", deviceTypes: ["LAPTOP", "PC"], sortOrder: 21 },
  { slug: "wymiana-zasilacza", name: "Wymiana zasilacza", category: "NAPRAWA", shortDesc: "Diagnoza i wymiana zasilacza w PC.", priceFromGrosze: 10000, priceNote: "od + części", turnaround: "24–48 h", deviceTypes: ["PC"], sortOrder: 22 },
  { slug: "wymiana-klawiatury", name: "Wymiana klawiatury w laptopie", category: "NAPRAWA", shortDesc: "Wymiana uszkodzonej klawiatury laptopa.", priceFromGrosze: 12000, priceNote: "od + części", turnaround: "48 h", deviceTypes: ["LAPTOP"], sortOrder: 23 },
  { slug: "wymiana-matrycy", name: "Wymiana matrycy laptopa", category: "NAPRAWA", shortDesc: "Wymiana pękniętej lub niesprawnej matrycy.", priceFromGrosze: 18000, priceNote: "od + części", turnaround: "48 h", deviceTypes: ["LAPTOP"], sortOrder: 24 },
  { slug: "usuwanie-bsod", name: "Usuwanie BSOD i błędów systemu", category: "NAPRAWA", shortDesc: "Diagnoza i usunięcie błędów systemowych, BSOD.", priceFromGrosze: 10000, priceNote: "od", turnaround: "24–48 h", deviceTypes: ["LAPTOP", "PC"], sortOrder: 25 },

  // Serwis okresowy
  { slug: "czyszczenie-laptopa", name: "Czyszczenie laptopa + pasta", category: "SERWIS_OKRESOWY", shortDesc: "Czyszczenie z kurzu i wymiana pasty termoprzewodzącej.", priceFromGrosze: 12000, priceNote: "od", turnaround: "24 h", deviceTypes: ["LAPTOP"], isPopular: true, sortOrder: 30 },
  { slug: "czyszczenie-pc", name: "Czyszczenie PC + pasta", category: "SERWIS_OKRESOWY", shortDesc: "Czyszczenie komputera z kurzu i wymiana pasty.", priceFromGrosze: 12000, priceNote: "od", turnaround: "24 h", deviceTypes: ["PC"], sortOrder: 31 },
  { slug: "wymiana-padow", name: "Wymiana padów termicznych", category: "SERWIS_OKRESOWY", shortDesc: "Wymiana padów termicznych w laptopie.", priceFromGrosze: 10000, priceNote: "od", turnaround: "48 h", deviceTypes: ["LAPTOP"], sortOrder: 32 },
  { slug: "serwis-chlodzenia", name: "Serwis układu chłodzenia", category: "SERWIS_OKRESOWY", shortDesc: "Przegląd i serwis chłodzenia, redukcja temperatur.", priceFromGrosze: 15000, priceNote: "od", turnaround: "48 h", deviceTypes: ["LAPTOP", "PC"], sortOrder: 33 },

  // Software
  { slug: "instalacja-systemu", name: "Instalacja Windows / Linux", category: "SOFTWARE", shortDesc: "Czysta instalacja systemu ze sterownikami.", priceFromGrosze: 10000, priceNote: "od", turnaround: "24 h", deviceTypes: ["LAPTOP", "PC"], isPopular: true, sortOrder: 40 },
  { slug: "reinstalacja-z-danymi", name: "Reinstalacja z zachowaniem danych", category: "SOFTWARE", shortDesc: "Reinstalacja systemu bez utraty Twoich plików.", priceFromGrosze: 15000, priceNote: "od", turnaround: "24–48 h", deviceTypes: ["LAPTOP", "PC"], sortOrder: 41 },
  { slug: "usuwanie-wirusow", name: "Usuwanie wirusów", category: "SOFTWARE", shortDesc: "Usunięcie wirusów i złośliwego oprogramowania.", priceFromGrosze: 10000, priceNote: "od", turnaround: "24 h", deviceTypes: ["LAPTOP", "PC"], sortOrder: 42 },
  { slug: "optymalizacja", name: "Przyspieszenie i optymalizacja", category: "SOFTWARE", shortDesc: "Optymalizacja systemu, przyspieszenie działania.", priceFromGrosze: 8000, priceNote: "od", turnaround: "24 h", deviceTypes: ["LAPTOP", "PC"], sortOrder: 43 },
  { slug: "migracja-na-ssd", name: "Migracja HDD → SSD", category: "SOFTWARE", shortDesc: "Przeniesienie systemu i danych z dysku HDD na SSD.", priceFromGrosze: 15000, priceNote: "od + części", turnaround: "24–48 h", deviceTypes: ["LAPTOP", "PC"], isPopular: true, sortOrder: 44 },

  // Składanie
  { slug: "dobor-podzespolow", name: "Dobór podzespołów do PC", category: "SKLADANIE", shortDesc: "Dobór części do komputera pod budżet i zastosowanie.", priceFromGrosze: 0, priceNote: "bezpłatny przy montażu", turnaround: "do ustalenia", deviceTypes: ["PC"], sortOrder: 50 },
  { slug: "montaz-pc", name: "Montaż PC z części", category: "SKLADANIE", shortDesc: "Złożenie komputera z podzespołów klienta.", priceFromGrosze: 20000, priceNote: "od", turnaround: "48 h", deviceTypes: ["PC"], sortOrder: 51 },
  { slug: "upgrade-pc", name: "Upgrade zestawu", category: "SKLADANIE", shortDesc: "Modernizacja istniejącego komputera.", priceFromGrosze: 12000, priceNote: "od + części", turnaround: "48 h", deviceTypes: ["PC"], sortOrder: 52 },

  // Telefony
  { slug: "wymiana-szybki", name: "Wymiana szybki w telefonie", category: "TELEFONY", shortDesc: "Wymiana pękniętej szybki wyświetlacza.", priceFromGrosze: 12000, priceNote: "od + części", turnaround: "48 h", deviceTypes: ["IPHONE", "ANDROID"], sortOrder: 60 },
  { slug: "wymiana-wyswietlacza", name: "Wymiana wyświetlacza", category: "TELEFONY", shortDesc: "Wymiana uszkodzonego wyświetlacza telefonu.", priceFromGrosze: 20000, priceNote: "od + części", turnaround: "48 h", deviceTypes: ["IPHONE", "ANDROID"], sortOrder: 61 },
  { slug: "wymiana-baterii-tel", name: "Wymiana baterii w telefonie", category: "TELEFONY", shortDesc: "Wymiana zużytej baterii telefonu.", priceFromGrosze: 12000, priceNote: "od + części", turnaround: "24–48 h", deviceTypes: ["IPHONE", "ANDROID"], isPopular: true, sortOrder: 62 },
];

const AREAS: { name: string; slug: string; lat: number; lng: number }[] = [
  { name: "Warszawa", slug: "warszawa", lat: 52.2297, lng: 21.0122 },
  { name: "Białołęka", slug: "bialoleka", lat: 52.321, lng: 20.9876 },
  { name: "Legionowo", slug: "legionowo", lat: 52.4022, lng: 20.9265 },
  { name: "Marki", slug: "marki", lat: 52.32, lng: 21.1067 },
  { name: "Ząbki", slug: "zabki", lat: 52.2918, lng: 21.1447 },
  { name: "Zielonka", slug: "zielonka", lat: 52.303, lng: 21.167 },
  { name: "Kobyłka", slug: "kobylka", lat: 52.33, lng: 21.2 },
  { name: "Wołomin", slug: "wolomin", lat: 52.345, lng: 21.242 },
  { name: "Radzymin", slug: "radzymin", lat: 52.4155, lng: 21.1786 },
  { name: "Nieporęt", slug: "nieporet", lat: 52.427, lng: 21.0 },
  { name: "Jabłonna", slug: "jablonna", lat: 52.373, lng: 20.92 },
  { name: "Łomianki", slug: "lomianki", lat: 52.333, lng: 20.883 },
  { name: "Wieliszew", slug: "wieliszew", lat: 52.44, lng: 20.99 },
  { name: "Nowy Dwór Mazowiecki", slug: "nowy-dwor-mazowiecki", lat: 52.437, lng: 20.715 },
  { name: "Serock", slug: "serock", lat: 52.514, lng: 21.064 },
  { name: "Sulejówek", slug: "sulejowek", lat: 52.247, lng: 21.267 },
  { name: "Otwock", slug: "otwock", lat: 52.105, lng: 21.261 },
  { name: "Pruszków", slug: "pruszkow", lat: 52.17, lng: 20.812 },
];

async function main() {
  if (Number.isNaN(base.lat) || Number.isNaN(base.lng)) {
    throw new Error("Brak BASE_LAT/BASE_LNG w .env.local");
  }

  await db.insert(services).values(SERVICES).onConflictDoNothing({ target: services.slug });
  console.log(`Usługi: ${SERVICES.length}`);

  const areaRows = AREAS.map((a) => ({
    slug: a.slug,
    name: a.name,
    distanceKm: haversineKm(base, { lat: a.lat, lng: a.lng }).toFixed(2),
  }));
  await db.insert(serviceAreas).values(areaRows).onConflictDoNothing({ target: serviceAreas.slug });
  console.log(`Miejscowości: ${areaRows.length}`);

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (adminEmail && adminPassword) {
    const passwordHash = await hash(adminPassword);
    await db
      .insert(adminUsers)
      .values({ email: adminEmail, passwordHash, name: "Właściciel", role: "OWNER" })
      .onConflictDoNothing({ target: adminUsers.email });
    console.log(`Admin: ${adminEmail}`);
  } else {
    console.warn("Pomijam admina — brak ADMIN_EMAIL/ADMIN_PASSWORD.");
  }

  if (process.env.NODE_ENV !== "production") {
    const areaByCoord = (lat: number, lng: number) => ({
      lat: String(lat),
      lng: String(lng),
      distanceKm: haversineKm(base, { lat, lng }).toFixed(2),
      inServiceArea: true,
    });
    const sample = [
      { code: formatTicketCode(2026, 1), status: "NOWE" as const, customerName: "Anna Kowalska", customerPhone: "+48501111111", addressLine: "ul. Kwiatowa 3", city: "Marki", postalCode: "05-270", deviceType: "LAPTOP" as const, deviceBrand: "Lenovo", problemDescription: "Nie włącza się, brak reakcji.", ...areaByCoord(52.32, 21.1067) },
      { code: formatTicketCode(2026, 2), status: "POTWIERDZONE" as const, customerName: "Piotr Nowak", customerPhone: "+48502222222", addressLine: "ul. Główna 12", city: "Ząbki", postalCode: "05-091", deviceType: "PC" as const, problemDescription: "Nie uruchamia systemu, restartuje się.", ...areaByCoord(52.2918, 21.1447) },
      { code: formatTicketCode(2026, 3), status: "ODBIOR_ZAPLANOWANY" as const, customerName: "Kasia Wiśniewska", customerPhone: "+48503333333", addressLine: "ul. Polna 8", city: "Legionowo", postalCode: "05-120", deviceType: "IPHONE" as const, deviceBrand: "Apple", deviceModel: "iPhone 12", problemDescription: "Pęknięta szybka.", preferredPickupSlot: "WIECZOR_17_21" as const, ...areaByCoord(52.4022, 20.9265) },
      { code: formatTicketCode(2026, 4), status: "W_DIAGNOZIE" as const, customerName: "Marek Zieliński", customerPhone: "+48504444444", addressLine: "ul. Leśna 21", city: "Wołomin", postalCode: "05-200", deviceType: "LAPTOP" as const, deviceBrand: "HP", problemDescription: "Przegrzewa się i wyłącza.", ...areaByCoord(52.345, 21.242) },
      { code: formatTicketCode(2026, 5), status: "WYCENA_WYSLANA" as const, customerName: "Ewa Lewandowska", customerPhone: "+48505555555", addressLine: "ul. Słoneczna 5", city: "Radzymin", postalCode: "05-250", deviceType: "LAPTOP" as const, problemDescription: "Wymiana matrycy.", estimatedPriceMin: 28000, estimatedPriceMax: 42000, publicNote: "Matryca FHD, dostępna od ręki.", ...areaByCoord(52.4155, 21.1786) },
      { code: formatTicketCode(2026, 6), status: "ZAKONCZONE" as const, customerName: "Tomasz Kamiński", customerPhone: "+48506666666", addressLine: "ul. Miła 2", city: "Warszawa", postalCode: "03-138", deviceType: "PC" as const, problemDescription: "Wymiana SSD + instalacja Windows.", finalPrice: 32000, partsCost: 18000, closedAt: new Date(), ...areaByCoord(52.2297, 21.0122) },
    ].map((t) => ({ ...t, consentRodo: true, trackingToken: generateTrackingToken() }));

    await db.insert(tickets).values(sample).onConflictDoNothing({ target: tickets.code });
    console.log(`Zgłoszenia testowe: ${sample.length}`);
  }

  console.log("Seed zakończony.");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });

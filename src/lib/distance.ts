export type Coord = { lat: number; lng: number };

const EARTH_RADIUS_KM = 6371;

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

// Odległość w linii prostej (haversine). Kierunkowa decyzja właściciela:
// promień liczony po prostej, nie po trasie.
export function haversineKm(a: Coord, b: Coord): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

export type ServiceZone = "GRATIS" | "DO_USTALENIA" | "KURIER";

export type AreaResult = {
  distanceKm: number;
  zone: ServiceZone;
  inServiceArea: boolean;
};

// ≤ radiusKm → gratis; radiusKm..negotiableMaxKm → dojazd do ustalenia; dalej → kurier.
export function classifyArea(
  distanceKm: number,
  radiusKm = 50,
  negotiableMaxKm = 70,
): AreaResult {
  let zone: ServiceZone;
  if (distanceKm <= radiusKm) zone = "GRATIS";
  else if (distanceKm <= negotiableMaxKm) zone = "DO_USTALENIA";
  else zone = "KURIER";
  return { distanceKm, zone, inServiceArea: zone === "GRATIS" };
}

// Baza z env — oddzielone od czystej matematyki, żeby testy nie zależały od środowiska.
export function baseCoord(): Coord {
  const lat = Number(process.env.BASE_LAT);
  const lng = Number(process.env.BASE_LNG);
  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    throw new Error("BASE_LAT/BASE_LNG nie są ustawione");
  }
  return { lat, lng };
}

export function areaForCoord(coord: Coord, radiusKm?: number): AreaResult {
  const km = haversineKm(baseCoord(), coord);
  const r = radiusKm ?? Number(process.env.SERVICE_RADIUS_KM ?? 50);
  return classifyArea(km, r);
}

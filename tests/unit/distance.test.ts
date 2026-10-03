import { describe, expect, it } from "vitest";
import { areaForCoord, baseCoord, classifyArea, haversineKm } from "@/lib/distance";

const BASE = { lat: 52.321, lng: 20.9876 };
const WARSAW_CENTER = { lat: 52.2297, lng: 21.0122 };

describe("haversineKm", () => {
  it("zwraca 0 dla tego samego punktu", () => {
    expect(haversineKm(BASE, BASE)).toBe(0);
  });

  it("liczy znany dystans baza → centrum Warszawy (~10 km)", () => {
    const d = haversineKm(BASE, WARSAW_CENTER);
    expect(d).toBeGreaterThan(9);
    expect(d).toBeLessThan(12);
  });

  it("jest symetryczny", () => {
    expect(haversineKm(BASE, WARSAW_CENTER)).toBeCloseTo(
      haversineKm(WARSAW_CENTER, BASE),
      6,
    );
  });
});

describe("classifyArea", () => {
  it("≤ promień → GRATIS", () => {
    expect(classifyArea(0)).toMatchObject({ zone: "GRATIS", inServiceArea: true });
    expect(classifyArea(50)).toMatchObject({ zone: "GRATIS", inServiceArea: true });
  });

  it("promień..70 km → DO_USTALENIA", () => {
    expect(classifyArea(50.01)).toMatchObject({
      zone: "DO_USTALENIA",
      inServiceArea: false,
    });
    expect(classifyArea(70)).toMatchObject({
      zone: "DO_USTALENIA",
      inServiceArea: false,
    });
  });

  it("> 70 km → KURIER", () => {
    expect(classifyArea(70.01)).toMatchObject({
      zone: "KURIER",
      inServiceArea: false,
    });
  });
});

describe("baseCoord / areaForCoord", () => {
  it("rzuca, gdy brak BASE_LAT/BASE_LNG", () => {
    const prevLat = process.env.BASE_LAT;
    const prevLng = process.env.BASE_LNG;
    delete process.env.BASE_LAT;
    delete process.env.BASE_LNG;
    expect(() => baseCoord()).toThrow();
    if (prevLat !== undefined) process.env.BASE_LAT = prevLat;
    if (prevLng !== undefined) process.env.BASE_LNG = prevLng;
  });

  it("dla współrzędnych bazy zwraca ~0 km i GRATIS", () => {
    process.env.BASE_LAT = String(BASE.lat);
    process.env.BASE_LNG = String(BASE.lng);
    const r = areaForCoord(BASE);
    expect(r.distanceKm).toBeCloseTo(0, 6);
    expect(r.zone).toBe("GRATIS");
  });
});

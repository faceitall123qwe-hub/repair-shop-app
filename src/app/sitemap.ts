import { eq } from "drizzle-orm";
import type { MetadataRoute } from "next";
import { db } from "@/db";
import { serviceAreas, services } from "@/db/schema";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const now = new Date();

  const staticPaths = [
    "",
    "/uslugi",
    "/cennik",
    "/jak-to-dziala",
    "/obszar",
    "/o-mnie",
    "/kontakt",
    "/zgloszenie",
    "/polityka-prywatnosci",
    "/regulamin",
  ];

  const [svc, areas] = await Promise.all([
    db.select({ slug: services.slug }).from(services).where(eq(services.isActive, true)),
    db.select({ slug: serviceAreas.slug }).from(serviceAreas).where(eq(serviceAreas.isActive, true)),
  ]);

  return [
    ...staticPaths.map((p) => ({ url: `${base}${p}`, lastModified: now })),
    ...svc.map((s) => ({ url: `${base}/uslugi/${s.slug}`, lastModified: now })),
    ...areas.map((a) => ({ url: `${base}/obszar/${a.slug}`, lastModified: now })),
  ];
}

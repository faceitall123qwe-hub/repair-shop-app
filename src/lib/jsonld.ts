import { company } from "@/config/company";

function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
}

export function localBusinessJsonLd() {
  const lat = Number(process.env.BASE_LAT ?? 52.321);
  const lng = Number(process.env.BASE_LNG ?? 20.9876);
  return {
    "@context": "https://schema.org",
    "@type": "ComputerRepairService",
    "@id": `${siteUrl()}/#business`,
    name: company.name,
    url: siteUrl(),
    telephone: company.phone,
    email: company.email,
    priceRange: "$$",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Warszawa",
      addressRegion: "mazowieckie",
      addressCountry: "PL",
    },
    areaServed: {
      "@type": "GeoCircle",
      geoMidpoint: { "@type": "GeoCoordinates", latitude: lat, longitude: lng },
      geoRadius: 50000,
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday",
        ],
        opens: "00:00",
        closes: "23:59",
      },
    ],
  };
}

export function serviceJsonLd(s: {
  name: string;
  shortDesc: string;
  slug: string;
  priceFromGrosze: number | null;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: s.name,
    description: s.shortDesc,
    url: `${siteUrl()}/uslugi/${s.slug}`,
    provider: { "@type": "ComputerRepairService", name: company.name },
    areaServed: "Warszawa i okolice (50 km)",
    ...(s.priceFromGrosze != null
      ? {
          offers: {
            "@type": "Offer",
            price: (s.priceFromGrosze / 100).toFixed(0),
            priceCurrency: "PLN",
          },
        }
      : {}),
  };
}

export function faqJsonLd(faq: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

export function breadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: `${siteUrl()}${it.url}`,
    })),
  };
}

import type { Metadata } from "next";
import Link from "next/link";
import { company } from "@/config/company";

export const metadata: Metadata = {
  title: "Zgłoszenie przyjęte — SerwisPod Ręką",
  robots: { index: false },
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const { code } = await searchParams;

  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <p className="text-pcb font-mono text-xs">ZGŁOSZENIE PRZYJĘTE</p>
      <h1 className="font-display mt-2 text-3xl font-semibold">
        Dziękuję, mam Twoje zgłoszenie.
      </h1>

      {code && (
        <div className="border-line bg-surface mt-6 rounded-sm border p-4">
          <p className="text-steel font-mono text-xs uppercase">Numer zlecenia</p>
          <p className="font-mono text-2xl">{code}</p>
        </div>
      )}

      <div className="mt-6 text-sm">
        <p className="mb-2">Co dalej:</p>
        <ol className="text-steel list-decimal space-y-1 pl-5">
          <li>Oddzwonię, żeby potwierdzić szczegóły i termin odbioru.</li>
          <li>Przyjadę po sprzęt w umówionym oknie czasowym.</li>
          <li>Zdiagnozuję i wyślę wycenę do akceptacji.</li>
        </ol>
      </div>

      <p className="mt-6 text-sm">
        Pilne? Zadzwoń:{" "}
        <a href={`tel:${company.phone}`} className="text-pcb font-mono">
          {company.phoneDisplay}
        </a>
      </p>

      <Link href="/" className="text-steel mt-8 inline-block text-sm underline">
        ← Wróć na stronę główną
      </Link>
    </div>
  );
}

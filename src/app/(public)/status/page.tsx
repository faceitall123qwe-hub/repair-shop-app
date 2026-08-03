import type { Metadata } from "next";
import { StatusLookupForm } from "@/components/public/StatusLookupForm";

export const metadata: Metadata = {
  title: "Sprawdź status zlecenia — SerwisPod Ręką",
  robots: { index: false },
};

export default function Page() {
  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <p className="text-pcb font-mono text-xs">ŚLEDZENIE</p>
      <h1 className="font-display mt-2 text-2xl font-semibold">Sprawdź status zlecenia</h1>
      <p className="text-steel mt-2 text-sm">
        Podaj numer zlecenia (z potwierdzenia) i 4 ostatnie cyfry telefonu.
      </p>
      <div className="mt-6">
        <StatusLookupForm />
      </div>
    </div>
  );
}

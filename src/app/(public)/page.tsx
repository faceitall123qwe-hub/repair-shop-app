// Placeholder Fazy 0. Renderuje polski pangram w trzech krojach, żeby
// potwierdzić pełne wsparcie diakrytyków (ą ć ę ł ń ó ś ź ż) przed designem.
export default function Home() {
  return (
    <main className="mx-auto max-w-2xl p-8">
      <p className="font-mono text-sm">SRV · Faza 0 · placeholder</p>
      <h1 className="font-display mt-4 text-3xl">
        Zażółć gęślą jaźń — ĄĆĘŁŃÓŚŹŻ ąćęłńóśźż
      </h1>
      <p className="font-sans mt-2">
        Tekst (Inter Tight): zażółć gęślą jaźń, przyjadę po sprzęt.
      </p>
      <p className="font-mono mt-2">Mono (JetBrains): SRV-2026-0417 · ąćęłńóśźż</p>
    </main>
  );
}

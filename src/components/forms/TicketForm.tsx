"use client";

import Script from "next/script";
import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { submitTicket, type SubmitState } from "@/app/(public)/zgloszenie/actions";
import { classifyArea, haversineKm } from "@/lib/distance";
import { formatGrosze } from "@/lib/format";
import { DEVICE_TYPE_LABELS, PICKUP_SLOT_LABELS, ZONE_LABELS } from "@/lib/labels";
import { lookupPostalCode } from "@/lib/postal-codes";
import { DEVICE_TYPES, PICKUP_SLOTS } from "@/lib/validation/ticket";
import { KartaZgloszenia } from "./KartaZgloszenia";

type ServiceLite = {
  id: string;
  name: string;
  category: string;
  priceFromGrosze: number | null;
  deviceTypes: string[] | null;
};

type Props = {
  services: ServiceLite[];
  siteKey: string;
  base: { lat: number; lng: number };
  radiusKm: number;
};

type Values = {
  deviceType: string;
  deviceBrand: string;
  deviceModel: string;
  problemDescription: string;
  serviceIds: string[];
  postalCode: string;
  city: string;
  addressLine: string;
  preferredPickupDate: string;
  preferredPickupSlot: string;
  pickupNote: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  consentRodo: boolean;
  consentMarketing: boolean;
};

const EMPTY: Values = {
  deviceType: "",
  deviceBrand: "",
  deviceModel: "",
  problemDescription: "",
  serviceIds: [],
  postalCode: "",
  city: "",
  addressLine: "",
  preferredPickupDate: "",
  preferredPickupSlot: "",
  pickupNote: "",
  customerName: "",
  customerPhone: "",
  customerEmail: "",
  consentRodo: false,
  consentMarketing: false,
};

const STORAGE_KEY = "serwis-zgloszenie";
const inputCls =
  "w-full rounded-sm border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-pcb focus:ring-2 focus:ring-pcb/25";
const labelCls = "mb-1 block text-sm font-medium";

export function TicketForm({ services, siteKey, base, radiusKm }: Props) {
  const [state, formAction, pending] = useActionState<SubmitState, FormData>(
    submitTicket,
    { ok: false },
  );
  const [jsReady, setJsReady] = useState(false);
  const [step, setStep] = useState(1);
  const [values, setValues] = useState<Values>(EMPTY);
  const formTsRef = useRef<HTMLInputElement>(null);
  const [localErr, setLocalErr] = useState<Record<string, string>>({});

  useEffect(() => {
    // Progresywne wzbogacenie: po montażu przełączamy na tryb wielokrokowy.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setJsReady(true);
    if (formTsRef.current) formTsRef.current.value = String(Date.now());
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) setValues({ ...EMPTY, ...JSON.parse(saved) });
    } catch {}
    const krok = Number(new URLSearchParams(window.location.search).get("krok"));
    if (krok >= 1 && krok <= 4) setStep(krok);
  }, []);

  useEffect(() => {
    if (!jsReady) return;
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(values));
    } catch {}
  }, [values, jsReady]);

  useEffect(() => {
    if (!jsReady) return;
    const url = new URL(window.location.href);
    url.searchParams.set("krok", String(step));
    window.history.replaceState(null, "", url);
  }, [step, jsReady]);

  const errors = { ...(state.errors ?? {}), ...localErr };

  function set<K extends keyof Values>(key: K, val: Values[K]) {
    setValues((v) => ({ ...v, [key]: val }));
    if (localErr[key]) setLocalErr((e) => ({ ...e, [key]: "" }));
  }

  const area = useMemo(() => {
    const entry = lookupPostalCode(values.postalCode);
    if (!entry) return null;
    const km = haversineKm(base, { lat: entry.lat, lng: entry.lng });
    return { ...classifyArea(km, radiusKm), city: entry.city };
  }, [values.postalCode, base, radiusKm]);

  const availableServices = useMemo(
    () =>
      services.filter(
        (s) => !values.deviceType || !s.deviceTypes || s.deviceTypes.includes(values.deviceType),
      ),
    [services, values.deviceType],
  );

  const estimate = useMemo(
    () =>
      values.serviceIds.reduce((sum, id) => {
        const s = services.find((x) => x.id === id);
        return sum + (s?.priceFromGrosze ?? 0);
      }, 0),
    [values.serviceIds, services],
  );

  function validateStep(n: number): boolean {
    const e: Record<string, string> = {};
    if (n === 1) {
      if (!values.deviceType) e.deviceType = "Wybierz typ sprzętu.";
      if (values.problemDescription.trim().length < 10)
        e.problemDescription = "Opisz problem (min. 10 znaków).";
    }
    if (n === 2) {
      if (!/^\d{2}-\d{3}$/.test(values.postalCode)) e.postalCode = "Kod w formacie 00-000.";
      if (values.addressLine.trim().length < 3) e.addressLine = "Podaj ulicę i numer.";
      if (values.city.trim().length < 2) e.city = "Podaj miejscowość.";
    }
    if (n === 3) {
      if (values.customerName.trim().length < 2) e.customerName = "Podaj imię.";
      if (!/^(\+?48)?[\s-]?(\d[\s-]?){9}$/.test(values.customerPhone))
        e.customerPhone = "Podaj numer w formacie 123 456 789.";
      if (!values.consentRodo) e.consentRodo = "Zgoda jest wymagana.";
    }
    setLocalErr((prev) => ({ ...prev, ...e }));
    return Object.keys(e).length === 0;
  }

  function next() {
    if (validateStep(step)) setStep((s) => Math.min(4, s + 1));
  }
  function back() {
    setStep((s) => Math.max(1, s - 1));
  }

  const showStep = (n: number) => !jsReady || step === n;
  const err = (f: string) => errors[f];

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <form action={formAction} className="order-2 lg:order-1">
        <input type="hidden" name="formTs" ref={formTsRef} defaultValue="0" />
        <div aria-hidden className="absolute left-[-9999px]" hidden>
          <label>
            Nie wypełniaj
            <input name="website" tabIndex={-1} autoComplete="off" />
          </label>
        </div>

        {jsReady && (
          <ol className="text-steel mb-6 flex gap-2 font-mono text-xs">
            {["Sprzęt", "Odbiór", "Kontakt", "Podsumowanie"].map((t, i) => (
              <li
                key={t}
                className={
                  step === i + 1 ? "text-ink font-medium" : step > i + 1 ? "text-pcb" : ""
                }
              >
                {String(i + 1).padStart(2, "0")} {t}
                {i < 3 ? " ·" : ""}
              </li>
            ))}
          </ol>
        )}

        {(state.formError || (state.errors && Object.keys(state.errors).length > 0)) && (
          <p
            role="alert"
            aria-live="assertive"
            className="border-alert/40 bg-alert/10 text-alert mb-4 rounded-sm border px-3 py-2 text-sm"
          >
            {state.formError ?? "Popraw zaznaczone pola i wyślij ponownie."}
          </p>
        )}

        {/* Krok 1 */}
        <fieldset hidden={!showStep(1)} className="mb-8">
          <legend className="font-display mb-4 text-lg font-semibold">
            1. Co naprawiamy?
          </legend>
          <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {DEVICE_TYPES.map((dt) => (
              <label
                key={dt}
                className={`cursor-pointer rounded-sm border p-3 text-center text-sm ${
                  values.deviceType === dt
                    ? "border-pcb bg-pcb/5 font-medium"
                    : "border-line bg-surface hover:border-steel"
                }`}
              >
                <input
                  type="radio"
                  name="deviceType"
                  value={dt}
                  checked={values.deviceType === dt}
                  onChange={() => set("deviceType", dt)}
                  className="sr-only"
                />
                {DEVICE_TYPE_LABELS[dt] ?? dt}
              </label>
            ))}
          </div>
          {err("deviceType") && <p className="text-alert mb-3 text-sm">{err("deviceType")}</p>}

          <div className="mb-4 grid gap-3 sm:grid-cols-2">
            <div>
              <label className={labelCls} htmlFor="deviceBrand">
                Marka (opcjonalnie)
              </label>
              <input
                id="deviceBrand"
                name="deviceBrand"
                value={values.deviceBrand}
                onChange={(e) => set("deviceBrand", e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls} htmlFor="deviceModel">
                Model (opcjonalnie)
              </label>
              <input
                id="deviceModel"
                name="deviceModel"
                value={values.deviceModel}
                onChange={(e) => set("deviceModel", e.target.value)}
                className={inputCls}
              />
            </div>
          </div>

          <div className="mb-4">
            <label className={labelCls} htmlFor="problemDescription">
              Co się dzieje?
            </label>
            <textarea
              id="problemDescription"
              name="problemDescription"
              rows={3}
              value={values.problemDescription}
              onChange={(e) => set("problemDescription", e.target.value)}
              onBlur={() => validateStep(1)}
              aria-invalid={!!err("problemDescription")}
              className={`${inputCls} ${err("problemDescription") ? "border-alert" : ""}`}
              placeholder="np. nie włącza się, nie ma obrazu, głośno pracuje"
            />
            {err("problemDescription") && (
              <p className="text-alert mt-1 text-sm">{err("problemDescription")}</p>
            )}
          </div>

          {availableServices.length > 0 && (
            <div>
              <p className={labelCls}>Wstępnie wybierz usługi (opcjonalnie)</p>
              <div className="grid gap-1 sm:grid-cols-2">
                {availableServices.map((s) => (
                  <label key={s.id} className="flex items-start gap-2 text-sm">
                    <input
                      type="checkbox"
                      name="serviceIds"
                      value={s.id}
                      checked={values.serviceIds.includes(s.id)}
                      onChange={(e) =>
                        set(
                          "serviceIds",
                          e.target.checked
                            ? [...values.serviceIds, s.id]
                            : values.serviceIds.filter((x) => x !== s.id),
                        )
                      }
                      className="mt-0.5"
                    />
                    <span>
                      {s.name}
                      {s.priceFromGrosze != null && (
                        <span className="text-steel"> — od {formatGrosze(s.priceFromGrosze)}</span>
                      )}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </fieldset>

        {/* Krok 2 */}
        <fieldset hidden={!showStep(2)} className="mb-8">
          <legend className="font-display mb-4 text-lg font-semibold">
            2. Gdzie i kiedy odbieram?
          </legend>
          <div className="mb-4 grid gap-3 sm:grid-cols-2">
            <div>
              <label className={labelCls} htmlFor="postalCode">
                Kod pocztowy
              </label>
              <input
                id="postalCode"
                name="postalCode"
                inputMode="numeric"
                value={values.postalCode}
                onChange={(e) => {
                  set("postalCode", e.target.value);
                  const entry = lookupPostalCode(e.target.value);
                  if (entry && !values.city) set("city", entry.city);
                }}
                onBlur={() => validateStep(2)}
                aria-invalid={!!err("postalCode")}
                className={`${inputCls} ${err("postalCode") ? "border-alert" : ""}`}
                placeholder="05-270"
              />
              {err("postalCode") && <p className="text-alert mt-1 text-sm">{err("postalCode")}</p>}
            </div>
            <div>
              <label className={labelCls} htmlFor="city">
                Miejscowość
              </label>
              <input
                id="city"
                name="city"
                value={values.city}
                onChange={(e) => set("city", e.target.value)}
                className={`${inputCls} ${err("city") ? "border-alert" : ""}`}
              />
            </div>
          </div>

          {area && (
            <p
              aria-live="polite"
              className={`mb-4 rounded-sm border px-3 py-2 text-sm ${
                area.zone === "GRATIS"
                  ? "border-pcb/40 bg-pcb/5 text-pcb"
                  : "border-signal/50 bg-signal/10 text-ink"
              }`}
            >
              {ZONE_LABELS[area.zone]} — {area.distanceKm.toFixed(0)} km od bazy.
              {area.zone !== "GRATIS" && " Wyślij zgłoszenie, odezwę się z wyceną dojazdu."}
            </p>
          )}

          <div className="mb-4">
            <label className={labelCls} htmlFor="addressLine">
              Adres odbioru (ulica i numer)
            </label>
            <input
              id="addressLine"
              name="addressLine"
              value={values.addressLine}
              onChange={(e) => set("addressLine", e.target.value)}
              className={`${inputCls} ${err("addressLine") ? "border-alert" : ""}`}
            />
            {err("addressLine") && <p className="text-alert mt-1 text-sm">{err("addressLine")}</p>}
          </div>

          <div className="mb-4 grid gap-3 sm:grid-cols-2">
            <div>
              <label className={labelCls} htmlFor="preferredPickupDate">
                Preferowana data (opcjonalnie)
              </label>
              <input
                id="preferredPickupDate"
                name="preferredPickupDate"
                type="date"
                value={values.preferredPickupDate}
                onChange={(e) => set("preferredPickupDate", e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls} htmlFor="preferredPickupSlot">
                Okno czasowe
              </label>
              <select
                id="preferredPickupSlot"
                name="preferredPickupSlot"
                value={values.preferredPickupSlot}
                onChange={(e) => set("preferredPickupSlot", e.target.value)}
                className={inputCls}
              >
                <option value="">Dowolnie</option>
                {PICKUP_SLOTS.map((s) => (
                  <option key={s} value={s}>
                    {PICKUP_SLOT_LABELS[s] ?? s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={labelCls} htmlFor="pickupNote">
              Notatka do odbioru (opcjonalnie)
            </label>
            <input
              id="pickupNote"
              name="pickupNote"
              value={values.pickupNote}
              onChange={(e) => set("pickupNote", e.target.value)}
              className={inputCls}
              placeholder="np. odbiór spod pracy, recepcja"
            />
          </div>
        </fieldset>

        {/* Krok 3 */}
        <fieldset hidden={!showStep(3)} className="mb-8">
          <legend className="font-display mb-4 text-lg font-semibold">3. Kontakt</legend>
          <div className="mb-4 grid gap-3 sm:grid-cols-2">
            <div>
              <label className={labelCls} htmlFor="customerName">
                Imię
              </label>
              <input
                id="customerName"
                name="customerName"
                value={values.customerName}
                onChange={(e) => set("customerName", e.target.value)}
                className={`${inputCls} ${err("customerName") ? "border-alert" : ""}`}
              />
              {err("customerName") && (
                <p className="text-alert mt-1 text-sm">{err("customerName")}</p>
              )}
            </div>
            <div>
              <label className={labelCls} htmlFor="customerPhone">
                Telefon
              </label>
              <input
                id="customerPhone"
                name="customerPhone"
                inputMode="tel"
                value={values.customerPhone}
                onChange={(e) => set("customerPhone", e.target.value)}
                onBlur={() => validateStep(3)}
                className={`${inputCls} ${err("customerPhone") ? "border-alert" : ""}`}
                placeholder="500 600 700"
              />
              {err("customerPhone") && (
                <p className="text-alert mt-1 text-sm">{err("customerPhone")}</p>
              )}
            </div>
          </div>

          <div className="mb-4">
            <label className={labelCls} htmlFor="customerEmail">
              E-mail (opcjonalny)
            </label>
            <input
              id="customerEmail"
              name="customerEmail"
              type="email"
              value={values.customerEmail}
              onChange={(e) => set("customerEmail", e.target.value)}
              className={inputCls}
            />
            <p className="text-steel mt-1 text-xs">
              Bez e-maila nie wyślę linku do śledzenia statusu — status sprawdzisz kodem i telefonem.
            </p>
          </div>

          <label className="mb-2 flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              name="consentRodo"
              checked={values.consentRodo}
              onChange={(e) => set("consentRodo", e.target.checked)}
              className="mt-0.5"
            />
            <span>
              Zgadzam się na przetwarzanie moich danych w celu realizacji zgłoszenia (
              <a href="/polityka-prywatnosci" className="text-pcb underline">
                polityka prywatności
              </a>
              ).
            </span>
          </label>
          {err("consentRodo") && <p className="text-alert mb-2 text-sm">{err("consentRodo")}</p>}
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              name="consentMarketing"
              checked={values.consentMarketing}
              onChange={(e) => set("consentMarketing", e.target.checked)}
              className="mt-0.5"
            />
            <span className="text-steel">
              Chcę otrzymywać informacje o promocjach (opcjonalnie).
            </span>
          </label>

          {siteKey && (
            <>
              <Script
                src="https://challenges.cloudflare.com/turnstile/v0/api.js"
                strategy="afterInteractive"
              />
              <div className="cf-turnstile mt-4" data-sitekey={siteKey} />
            </>
          )}
        </fieldset>

        {/* Krok 4 */}
        <fieldset hidden={!showStep(4)} className="mb-8">
          <legend className="font-display mb-4 text-lg font-semibold">4. Podsumowanie</legend>
          <p className="text-steel mb-4 text-sm">
            Sprawdź dane po prawej. Wstępne widełki liczone są z wybranych usług i nie są wiążące —
            ostateczna cena po diagnozie.
          </p>
          {estimate > 0 && (
            <p className="border-line bg-surface mb-4 rounded-sm border px-3 py-2 text-sm">
              Wstępnie <strong>od {formatGrosze(estimate)}</strong> + ewentualne części. Wiążąca
              wycena po diagnozie.
            </p>
          )}
          <button
            type="submit"
            disabled={pending}
            className="bg-pcb text-paper hover:bg-pcb-700 w-full rounded-sm px-5 py-3 font-medium disabled:opacity-60 sm:w-auto"
          >
            {pending ? "Wysyłam…" : "Wyślij zgłoszenie"}
          </button>
        </fieldset>

        {jsReady && (
          <div className="flex justify-between">
            <button
              type="button"
              onClick={back}
              hidden={step === 1}
              className="border-line hover:border-steel rounded-sm border px-4 py-2 text-sm"
            >
              ‹ Wstecz
            </button>
            <span />
            {step < 4 && (
              <button
                type="button"
                onClick={next}
                className="bg-ink text-paper rounded-sm px-4 py-2 text-sm hover:opacity-90"
              >
                Dalej ›
              </button>
            )}
          </div>
        )}
      </form>

      <aside className="order-1 lg:order-2">
        <div className="lg:sticky lg:top-24">
          <KartaZgloszenia
            deviceType={values.deviceType}
            deviceBrand={values.deviceBrand}
            deviceModel={values.deviceModel}
            problem={values.problemDescription}
            city={values.city}
            distanceKm={area?.distanceKm ?? null}
            pickupDate={values.preferredPickupDate}
            pickupSlot={values.preferredPickupSlot}
          />
        </div>
      </aside>
    </div>
  );
}

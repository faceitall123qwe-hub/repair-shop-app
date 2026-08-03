import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import { company } from "../config/company";
import { formatGrosze } from "../lib/format";

const main = {
  backgroundColor: "#eceeea",
  margin: 0,
  fontFamily: "Arial, Helvetica, sans-serif",
  color: "#10161c",
};
const container = { maxWidth: "560px", margin: "0 auto", padding: "24px" };
const brand = { fontFamily: "monospace", fontSize: "12px", color: "#0f5c42", margin: "0 0 16px" };
const h = { fontSize: "20px", margin: "0 0 12px" };
const p = { fontSize: "14px", lineHeight: "22px", margin: "0 0 12px" };
const codeBox = {
  fontFamily: "monospace",
  fontSize: "18px",
  backgroundColor: "#f5f6f3",
  padding: "8px 12px",
  display: "inline-block",
  border: "1px solid #d5dad6",
};
const btn = {
  backgroundColor: "#0f5c42",
  color: "#eceeea",
  padding: "10px 18px",
  textDecoration: "none",
  fontSize: "14px",
  display: "inline-block",
};
const footer = { fontSize: "11px", color: "#6b7a88", lineHeight: "16px" };

function Base({ preview, children }: { preview: string; children: React.ReactNode }) {
  return (
    <Html lang="pl">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={brand}>{company.name}</Text>
          {children}
          <Hr style={{ borderColor: "#d5dad6", margin: "24px 0 12px" }} />
          <Text style={footer}>
            {company.name} · {company.phoneDisplay} · {company.email}
            <br />
            Dane przetwarzamy wyłącznie w celu realizacji zgłoszenia (RODO). Szczegóły w polityce
            prywatności.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

function Track({ url }: { url?: string }) {
  if (!url) return null;
  return (
    <Section style={{ marginTop: "16px" }}>
      <Link style={btn} href={url}>
        Śledź status zlecenia
      </Link>
    </Section>
  );
}

export function PotwierdzenieEmail(props: {
  code: string;
  customerName: string;
  trackingUrl?: string;
}) {
  return (
    <Base preview={`Zgłoszenie ${props.code} przyjęte`}>
      <Heading style={h}>Dziękuję, mam Twoje zgłoszenie.</Heading>
      <Text style={p}>
        Cześć {props.customerName}, przyjąłem zgłoszenie. Wkrótce oddzwonię, żeby potwierdzić termin
        odbioru sprzętu.
      </Text>
      <Text style={p}>Numer zlecenia:</Text>
      <Text style={codeBox}>{props.code}</Text>
      <Track url={props.trackingUrl} />
    </Base>
  );
}

export function OdbiorEmail(props: {
  code: string;
  pickupDate?: string;
  pickupSlot?: string;
  trackingUrl?: string;
}) {
  return (
    <Base preview={`Odbiór zaplanowany — ${props.code}`}>
      <Heading style={h}>Odbiór sprzętu zaplanowany.</Heading>
      <Text style={p}>
        Zlecenie {props.code}. Przyjadę {props.pickupDate ? `${props.pickupDate}` : "w umówionym terminie"}
        {props.pickupSlot ? `, ${props.pickupSlot}` : ""}.
      </Text>
      <Text style={p}>
        Zanim przyjadę, przygotuj: hasło do systemu, kopię ważnych plików (jeśli to możliwe) i wyjmij
        kartę SIM z telefonu.
      </Text>
      <Track url={props.trackingUrl} />
    </Base>
  );
}

export function WycenaEmail(props: {
  code: string;
  min: number | null;
  max: number | null;
  final: number | null;
  trackingUrl?: string;
}) {
  const price =
    props.final != null
      ? formatGrosze(props.final)
      : props.min != null && props.max != null
        ? `${formatGrosze(props.min)} – ${formatGrosze(props.max)}`
        : "do ustalenia";
  return (
    <Base preview={`Wycena — ${props.code}`}>
      <Heading style={h}>Wycena naprawy.</Heading>
      <Text style={p}>Zlecenie {props.code}. Koszt naprawy:</Text>
      <Text style={codeBox}>{price}</Text>
      <Text style={p}>Zaakceptuj wycenę lub zrezygnuj w panelu śledzenia:</Text>
      <Track url={props.trackingUrl} />
    </Base>
  );
}

export function GotoweEmail(props: { code: string; final: number | null; trackingUrl?: string }) {
  return (
    <Base preview={`Sprzęt gotowy — ${props.code}`}>
      <Heading style={h}>Sprzęt gotowy do zwrotu.</Heading>
      <Text style={p}>
        Zlecenie {props.code} zakończone od strony warsztatu
        {props.final != null ? `. Do zapłaty: ${formatGrosze(props.final)}` : ""}. Umówmy termin
        zwrotu — oddzwonię lub napisz.
      </Text>
      <Track url={props.trackingUrl} />
    </Base>
  );
}

export function ZakonczoneEmail(props: { code: string; trackingUrl?: string }) {
  return (
    <Base preview={`Zlecenie zakończone — ${props.code}`}>
      <Heading style={h}>Zlecenie zakończone. Dziękuję!</Heading>
      <Text style={p}>
        Zlecenie {props.code} zakończone. Jeśli wszystko działa jak trzeba, będę wdzięczny za krótką
        opinię w Google — to bardzo pomaga.
      </Text>
      <Track url={props.trackingUrl} />
    </Base>
  );
}

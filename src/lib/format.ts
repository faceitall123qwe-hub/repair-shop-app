export function formatGrosze(grosze: number | null | undefined): string {
  if (grosze == null) return "";
  const zl = grosze / 100;
  const hasCents = zl % 1 !== 0;
  return `${zl.toLocaleString("pl-PL", {
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: 2,
  })} zł`;
}

export function formatPriceFrom(grosze: number | null | undefined): string {
  return grosze != null ? `od ${formatGrosze(grosze)}` : "wycena po diagnozie";
}

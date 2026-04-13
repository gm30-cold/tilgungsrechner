// Zentrale Formatierer für EUR, Prozent und Datum – damit die App konsistent aussieht.

const EUR_FORMAT = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

const EUR_FORMAT_PRECISE = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const PROZENT_FORMAT = new Intl.NumberFormat("de-DE", {
  style: "percent",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatEUR(value: number, precise = false): string {
  if (!Number.isFinite(value)) return "–";
  return precise ? EUR_FORMAT_PRECISE.format(value) : EUR_FORMAT.format(value);
}

export function formatProzent(value: number): string {
  // value ist in Prozent, nicht als Dezimalzahl (3.5 statt 0.035)
  if (!Number.isFinite(value)) return "–";
  return PROZENT_FORMAT.format(value / 100);
}

/** "2025-06" → "Juni 2025" */
export function formatMonatJahr(iso: string | null): string {
  if (!iso) return "–";
  const [y, m] = iso.split("-").map(Number);
  if (!y || !m) return iso;
  const monate = [
    "Januar", "Februar", "März", "April", "Mai", "Juni",
    "Juli", "August", "September", "Oktober", "November", "Dezember",
  ];
  return `${monate[m - 1]} ${y}`;
}

/** Addiert `months` Monate zu einem "YYYY-MM" String. */
export function addMonths(iso: string, months: number): string {
  const [y, m] = iso.split("-").map(Number);
  const total = (y * 12 + (m - 1)) + months;
  const ny = Math.floor(total / 12);
  const nm = (total % 12) + 1;
  return `${ny}-${String(nm).padStart(2, "0")}`;
}

export function jahrAus(iso: string): number {
  return Number(iso.split("-")[0]);
}

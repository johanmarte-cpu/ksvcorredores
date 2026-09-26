export function formatCurrency(amount: number | string) {
  const value = typeof amount === "string" ? Number(amount) : amount;
  return new Intl.NumberFormat("es-DO", {
    style: "currency",
    currency: "DOP",
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatDate(date: Date | string) {
  const value = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("es-DO", { dateStyle: "medium" }).format(value);
}

export function daysUntil(date: Date | string) {
  const value = typeof date === "string" ? new Date(date) : date;
  const diff = value.getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function clientDisplayName(client: { type: string; firstName?: string | null; lastName?: string | null; companyName?: string | null }) {
  if (client.type === "COMPANY") return client.companyName ?? "";
  return [client.firstName, client.lastName].filter(Boolean).join(" ");
}

const MONTH_LABELS_ES = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
];

/** Chronological list of the last `count` months (inclusive of the current one), as "YYYY-MM" keys. */
export function lastMonthKeys(count: number, from = new Date()) {
  const months: { key: string; label: string; year: number; month: number }[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(from.getFullYear(), from.getMonth() - i, 1);
    const year = d.getFullYear();
    const month = d.getMonth();
    months.push({
      key: `${year}-${String(month + 1).padStart(2, "0")}`,
      label: `${MONTH_LABELS_ES[month]} ${String(year).slice(2)}`,
      year,
      month,
    });
  }
  return months;
}

export function monthKeyOf(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

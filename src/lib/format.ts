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

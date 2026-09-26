// Colores por estado (identidad fija por valor, nunca por posición) —
// reutilizados en todas las tablas para que el mismo estado siempre lea igual.
const TONES = {
  emerald: "border-transparent bg-emerald-100 text-emerald-700",
  blue: "border-transparent bg-blue-100 text-blue-700",
  amber: "border-transparent bg-amber-100 text-amber-700",
  rose: "border-transparent bg-rose-100 text-rose-700",
  violet: "border-transparent bg-violet-100 text-violet-700",
  cyan: "border-transparent bg-cyan-100 text-cyan-700",
  slate: "border-transparent bg-slate-100 text-slate-700",
} as const;

type Tone = keyof typeof TONES;

export function toneClass(tone: Tone) {
  return TONES[tone];
}

export const POLICY_STATUS_TONE: Record<string, Tone> = {
  ACTIVE: "emerald",
  PENDING: "amber",
  EXPIRED: "slate",
  CANCELLED: "rose",
  RENEWED: "blue",
};

export const QUOTE_STATUS_TONE: Record<string, Tone> = {
  DRAFT: "slate",
  SENT: "blue",
  IN_REVIEW: "amber",
  COMPARED: "violet",
  CONVERTED: "emerald",
  CANCELLED: "rose",
};

export const QUOTE_REQUEST_STATUS_TONE: Record<string, Tone> = {
  PENDING: "amber",
  RESPONDED: "emerald",
  DECLINED: "rose",
  EXPIRED: "slate",
};

export const CLAIM_STATUS_TONE: Record<string, Tone> = {
  OPEN: "amber",
  IN_REVIEW: "blue",
  WITH_INSURER: "violet",
  APPROVED: "emerald",
  REJECTED: "rose",
  PAID: "emerald",
  CLOSED: "slate",
};

export const PAYMENT_STATUS_TONE: Record<string, Tone> = {
  PENDING: "amber",
  PAID: "emerald",
  OVERDUE: "rose",
  CANCELLED: "slate",
};

export const RENEWAL_STATUS_TONE: Record<string, Tone> = {
  PENDING: "amber",
  IN_PROGRESS: "blue",
  OFFERED: "violet",
  RENEWED: "emerald",
  LAPSED: "rose",
  DECLINED: "rose",
};

export const COMMISSION_STATUS_TONE: Record<string, Tone> = {
  EXPECTED: "amber",
  RECEIVED: "emerald",
  PARTIAL: "blue",
  DISPUTED: "rose",
};

export const RISK_LEVEL_TONE: Record<string, Tone> = {
  BAJO: "emerald",
  MEDIO: "amber",
  ALTO: "rose",
};

export const DOMAIN_STATUS_TONE: Record<string, Tone> = {
  verified: "emerald",
  pending: "amber",
  partially_verified: "amber",
  not_started: "slate",
  failed: "rose",
  partially_failed: "rose",
  temporary_failure: "rose",
};

export const ROLE_TONE: Record<string, Tone> = {
  ADMIN: "violet",
  BROKER: "blue",
  CUSTOMER_SERVICE: "cyan",
  ACCOUNTING: "emerald",
  READ_ONLY: "slate",
};

/** Looks up a status in a tone map and returns its badge classes, defaulting to slate for unknown values. */
export function statusClass(map: Record<string, Tone>, status: string) {
  return TONES[map[status] ?? "slate"];
}

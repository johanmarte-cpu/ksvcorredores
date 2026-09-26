import type { PaymentFrequency } from "@/generated/prisma/client";

export const DOWN_PAYMENT_RATE = 0.25;

const INSTALLMENTS: Record<PaymentFrequency, number> = {
  SINGLE: 1,
  ANNUAL: 1,
  SEMIANNUAL: 2,
  QUARTERLY: 4,
  MONTHLY: 12,
};

const MONTHS_BETWEEN: Record<PaymentFrequency, number> = {
  SINGLE: 1,
  ANNUAL: 1,
  SEMIANNUAL: 6,
  QUARTERLY: 3,
  MONTHLY: 1,
};

/** Splits `amount` into `count` installments, `monthsStep` months apart, starting at startDate. */
export function buildInstallments(amount: number, count: number, startDate: Date, monthsStep: number) {
  const base = Math.floor((amount / count) * 100) / 100;

  const installments: { amount: number; dueDate: Date }[] = [];
  let remaining = amount;
  for (let i = 0; i < count; i++) {
    const isLast = i === count - 1;
    const installmentAmount = isLast ? Math.round(remaining * 100) / 100 : base;
    remaining = Math.round((remaining - installmentAmount) * 100) / 100;

    const dueDate = new Date(startDate);
    dueDate.setMonth(dueDate.getMonth() + monthsStep * i);
    installments.push({ amount: installmentAmount, dueDate });
  }
  return installments;
}

/** The upfront down payment ("Inicial"): always 25% of the premium (before ITBIS). */
export function calculateDownPayment(premium: number) {
  return Math.round(premium * DOWN_PAYMENT_RATE * 100) / 100;
}

/**
 * Builds a policy's "acuerdo de pago": an upfront Inicial (25% of the premium),
 * followed by the remaining balance split across the installments implied by
 * the payment frequency.
 */
export function buildPaymentSchedule(premium: number, total: number, frequency: PaymentFrequency, startDate: Date) {
  const downPayment = calculateDownPayment(premium);
  const balance = Math.round((total - downPayment) * 100) / 100;

  const remainingCount = Math.max(INSTALLMENTS[frequency] - 1, 1);
  const step = MONTHS_BETWEEN[frequency];

  const balanceStart = new Date(startDate);
  balanceStart.setMonth(balanceStart.getMonth() + step);

  return [{ amount: downPayment, dueDate: new Date(startDate) }, ...buildInstallments(balance, remainingCount, balanceStart, step)];
}

/** Splits a remaining balance into an arbitrary number of monthly installments — used to customize an existing acuerdo de pago. */
export function buildCustomInstallments(amount: number, count: number, startDate: Date) {
  return buildInstallments(amount, count, startDate, count > 1 ? 1 : 0);
}

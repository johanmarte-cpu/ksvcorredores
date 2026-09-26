import type { PaymentFrequency } from "@/generated/prisma/client";

const INSTALLMENTS: Record<PaymentFrequency, number> = {
  SINGLE: 1,
  ANNUAL: 1,
  SEMIANNUAL: 2,
  QUARTERLY: 4,
  MONTHLY: 12,
};

const MONTHS_BETWEEN: Record<PaymentFrequency, number> = {
  SINGLE: 0,
  ANNUAL: 0,
  SEMIANNUAL: 6,
  QUARTERLY: 3,
  MONTHLY: 1,
};

/** Splits a policy's premium into an installment schedule (the "acuerdo de pago") starting at startDate. */
export function buildPaymentSchedule(premium: number, frequency: PaymentFrequency, startDate: Date) {
  const count = INSTALLMENTS[frequency];
  const step = MONTHS_BETWEEN[frequency];
  const base = Math.floor((premium / count) * 100) / 100;

  const installments: { amount: number; dueDate: Date }[] = [];
  let remaining = premium;
  for (let i = 0; i < count; i++) {
    const isLast = i === count - 1;
    const amount = isLast ? Math.round(remaining * 100) / 100 : base;
    remaining = Math.round((remaining - amount) * 100) / 100;

    const dueDate = new Date(startDate);
    dueDate.setMonth(dueDate.getMonth() + step * i);
    installments.push({ amount, dueDate });
  }
  return installments;
}

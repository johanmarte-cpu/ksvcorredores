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

/** Splits a policy's total into an installment schedule (the "acuerdo de pago") starting at startDate. */
export function buildPaymentSchedule(total: number, frequency: PaymentFrequency, startDate: Date) {
  return buildInstallments(total, INSTALLMENTS[frequency], startDate, MONTHS_BETWEEN[frequency]);
}

/** Splits a remaining balance into an arbitrary number of monthly installments — used to customize an existing acuerdo de pago. */
export function buildCustomInstallments(amount: number, count: number, startDate: Date) {
  return buildInstallments(amount, count, startDate, count > 1 ? 1 : 0);
}

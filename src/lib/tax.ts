export const ITBIS_RATE = 0.16;

export function calculateItbis(premium: number) {
  const itbisAmount = Math.round(premium * ITBIS_RATE * 100) / 100;
  const totalAmount = Math.round((premium + itbisAmount) * 100) / 100;
  return { itbisAmount, totalAmount };
}

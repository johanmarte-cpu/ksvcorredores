export const DEFAULT_ITBIS_RATE = 16;

/** ratepercent is a whole percentage (e.g. 16 for 16%), as stored in SystemSettings.itbisRate. */
export function calculateItbis(premium: number, ratePercent: number = DEFAULT_ITBIS_RATE) {
  const itbisAmount = Math.round(premium * (ratePercent / 100) * 100) / 100;
  const totalAmount = Math.round((premium + itbisAmount) * 100) / 100;
  return { itbisAmount, totalAmount };
}

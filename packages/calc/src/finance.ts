/**
 * Excel-equivalent finance functions and period helpers.
 *
 * The Excel sheet uses PMT / PPMT / IPMT with the standard "end of period" convention
 * (type=0). PMT in Excel returns a negative number for a positive PV (money owed);
 * we follow Excel exactly and let callers negate when they want positive payments.
 */

import { PERIOD_TO_ANNUAL, type Period } from '@inv/shared';

export function periodToAnnualMultiplier(p: Period): number {
  return PERIOD_TO_ANNUAL[p];
}

/** Excel PMT(rate, nper, pv) with fv=0, type=0. Returns a NEGATIVE value for positive pv. */
export function pmt(rate: number, nper: number, pv: number): number {
  if (nper === 0) return 0;
  if (rate === 0) return -pv / nper;
  const r = rate;
  return (-pv * r) / (1 - Math.pow(1 + r, -nper));
}

/** Excel IPMT(rate, per, nper, pv) — interest portion of payment `per` (1-indexed). */
export function ipmt(rate: number, per: number, nper: number, pv: number): number {
  if (per < 1 || per > nper) return 0;
  if (rate === 0) return 0;
  const payment = pmt(rate, nper, pv);
  // Remaining balance immediately before payment `per`
  const balanceBefore = pv * Math.pow(1 + rate, per - 1) + payment * ((Math.pow(1 + rate, per - 1) - 1) / rate);
  return -balanceBefore * rate;
}

/** Excel PPMT(rate, per, nper, pv) — principal portion of payment `per`. */
export function ppmt(rate: number, per: number, nper: number, pv: number): number {
  return pmt(rate, nper, pv) - ipmt(rate, per, nper, pv);
}

/** Monthly equivalent of a compound annual growth rate. */
export function monthlyFromAnnualCompound(annual: number): number {
  return Math.pow(1 + annual, 1 / 12) - 1;
}

/** Convert a fee that occurs every `period` to a per-month equivalent. */
export function feeToMonthly(amount: number, period: Period): number {
  return (amount * periodToAnnualMultiplier(period)) / 12;
}

/** Convert a fee that occurs every `period` to an annual equivalent. */
export function feeToAnnual(amount: number, period: Period): number {
  return amount * periodToAnnualMultiplier(period);
}

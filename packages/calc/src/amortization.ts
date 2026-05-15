import type { Inputs } from '@inv/shared';
import { feeToMonthly, ipmt, pmt, ppmt } from './finance.js';

export interface AmortRow {
  month: number;
  payment: number;
  principal: number;
  interest: number; // includes monthly fees
  balance: number;
}

/** Builds a P&I amortization schedule month-by-month. */
export function buildPISchedule(
  principal: number,
  annualRate: number,
  durationYears: number,
  monthlyFees: number,
): AmortRow[] {
  const rate = annualRate / 12;
  const nper = durationYears * 12;
  const rows: AmortRow[] = [];
  let balance = principal;

  for (let m = 1; m <= nper; m++) {
    if (balance <= 0.01) break;
    const interestRaw = -ipmt(rate, m, nper, principal);
    const principalPart = -ppmt(rate, m, nper, principal);
    const paymentBase = -pmt(rate, nper, principal);
    rows.push({
      month: m,
      payment: paymentBase + monthlyFees,
      principal: principalPart,
      interest: interestRaw + monthlyFees,
      balance: Math.max(0, balance - principalPart),
    });
    balance -= principalPart;
  }
  return rows;
}

/** Builds an Interest-Only schedule: IO years pay interest only; then P&I for remaining years. */
export function buildIOSchedule(
  principal: number,
  ioAnnualRate: number,
  ioYears: number,
  postIOAnnualRate: number,
  totalYears: number,
  monthlyFees: number,
): AmortRow[] {
  const rows: AmortRow[] = [];
  const ioMonths = ioYears * 12;
  const totalMonths = totalYears * 12;
  const postMonths = Math.max(0, totalMonths - ioMonths);

  // IO phase
  const ioMonthlyInterest = (ioAnnualRate * principal) / 12;
  for (let m = 1; m <= ioMonths; m++) {
    rows.push({
      month: m,
      payment: ioMonthlyInterest + monthlyFees,
      principal: 0,
      interest: ioMonthlyInterest + monthlyFees,
      balance: principal,
    });
  }

  // Post-IO P&I phase
  if (postMonths > 0) {
    const r = postIOAnnualRate / 12;
    const paymentBase = -pmt(r, postMonths, principal);
    let balance = principal;
    for (let k = 1; k <= postMonths; k++) {
      if (balance <= 0.01) break;
      const interestRaw = -ipmt(r, k, postMonths, principal);
      const principalPart = -ppmt(r, k, postMonths, principal);
      rows.push({
        month: ioMonths + k,
        payment: paymentBase + monthlyFees,
        principal: principalPart,
        interest: interestRaw + monthlyFees,
        balance: Math.max(0, balance - principalPart),
      });
      balance -= principalPart;
    }
  }
  return rows;
}

export function buildSchedulesFromInputs(inputs: Inputs, principal: number) {
  const l = inputs.loan;
  const piMonthlyFees = feeToMonthly(l.pi.fees.amount, l.pi.fees.period);
  const ioMonthlyFees = feeToMonthly(l.io.fees.amount, l.io.fees.period);
  return {
    pi: buildPISchedule(principal, l.pi.annualRate, l.pi.durationYears, piMonthlyFees),
    io: buildIOSchedule(
      principal,
      l.io.annualRate,
      l.io.ioDurationYears,
      l.io.standardRateAfterIO,
      l.io.totalDurationYears,
      ioMonthlyFees,
    ),
  };
}

/** Annual aggregation: sums of monthly amounts grouped into year buckets (1-indexed). */
export interface AmortYearRow {
  year: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number; // end-of-year balance
}

export function annualizeSchedule(monthly: AmortRow[]): AmortYearRow[] {
  if (monthly.length === 0) return [];
  const lastYear = Math.ceil(monthly[monthly.length - 1]!.month / 12);
  const out: AmortYearRow[] = [];
  for (let y = 1; y <= lastYear; y++) {
    let payment = 0, principal = 0, interest = 0, balance = 0;
    let anyInYear = false;
    for (const r of monthly) {
      const yr = Math.ceil(r.month / 12);
      if (yr === y) {
        payment += r.payment;
        principal += r.principal;
        interest += r.interest;
        balance = r.balance;
        anyInYear = true;
      }
    }
    if (anyInYear) out.push({ year: y, payment, principal, interest, balance });
  }
  return out;
}

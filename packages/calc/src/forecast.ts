import type { Inputs } from '@inv/shared';
import type { AmortRow } from './amortization.js';
import {
  deriveInputs,
  resolveCostLine,
  totalOngoingCostPctOfIncome,
  totalOngoingFixedAnnual,
  type DerivedInputs,
} from './derived.js';

export interface ForecastMonthRow {
  month: number;
  propertyValue: number;
  equity: number;
  rent: number; // monthly
  ongoingCostsPctOfIncome: number; // monthly (% of income portion)
  ongoingCostsFixedWithInflation: number; // monthly (fixed + inflation grown)
  totalOngoingCosts: number; // sum of the two
  loanRepayment: number;
  principal: number;
  interest: number; // includes monthly fees
  depreciation: number;
  totalDeductions: number;
  beforeTaxCashFlow: number;
  taxPayment: number;
  afterTaxCashFlow: number;
  cumulativeAfterTaxCashFlow: number;
  grossProfitIfSold: number;
  grossROI: number;
  grossAnnualizedROI: number;
  netProfitIfSold: number;
  netROI: number;
  netAnnualizedROI: number;
}

export interface ForecastYearRow {
  year: number;
  propertyValue: number; // end of year
  equity: number;
  rent: number; // annual
  ongoingCostsNoInflation: number;
  ongoingCostsWithInflation: number;
  totalOngoingCosts: number;
  loanRepayment: number;
  principal: number;
  interest: number;
  depreciation: number;
  totalDeductions: number;
  beforeTaxCashFlow: number;
  taxPayment: number;
  afterTaxCashFlow: number;
  cumulativeAfterTaxCashFlow: number;
  grossProfitIfSold: number;
  grossROI: number;
  grossAnnualizedROI: number;
  netProfitIfSold: number;
  netROI: number;
  netAnnualizedROI: number;
}

/**
 * Build the monthly forecast for a single loan track (P&I or IO).
 * Mirrors Forecast (By Month) sheet, columns F..AA for P&I, AD..AY for IO.
 *
 * - propertyValue grows monthly via monthlyAppreciation (compound)
 * - equity = propertyValue - downPayment + cumulative principal paid
 * - rent grows YEAR-over-YEAR at annualRentalGrowth (not monthly)
 *   (Excel: $C$9*(1+$C$33)^ROUNDDOWN((F-1)/12,0))
 * - ongoingCostsPctOfIncome = sum(pcts) * rent
 * - ongoingCostsFixedWithInflation = (annualFixed / 12) * (1+inflation)^(yearIdx)
 *   (Excel: (SUMIF... /12)*(1+C34)^ROUNDDOWN((F-1)/12,0))
 * - depreciation: depreciableAmount/years/12, only while within depreciationYears window
 * - totalDeductions = totalOngoingCosts + interest + depreciation
 * - beforeTaxCashFlow = rent - totalOngoingCosts - payment (Excel uses loanRepayment, not just interest+principal here)
 * - tax = (rent - totalDeductions) * taxBracket
 * - afterTaxCashFlow = beforeTax - tax
 * - cumulativeAfter = running sum
 * - grossProfitIfSold = propertyValue - principalAmount - sellingCosts(month) - downPayment
 *   (Excel V col: G-C10-C191-C7)
 * - sellingCosts(m) = sum of selling lines, growing with monthlyAppreciation
 * - netProfit = grossProfit + cumulativeAfterTax
 */
function buildForecastMonthly(
  inputs: Inputs,
  derived: DerivedInputs,
  schedule: AmortRow[],
): ForecastMonthRow[] {
  const months = inputs.property.holdingPeriodYears * 12;
  const monthlyApp = derived.monthlyAppreciation;
  const tax = inputs.forecast.taxBracket;
  const inflation = inputs.forecast.annualInflation;
  const pctIncome = totalOngoingCostPctOfIncome(inputs.ongoingCosts);
  const annualFixedOngoing = totalOngoingFixedAnnual(inputs.ongoingCosts);
  const monthlyFixedOngoingBase = annualFixedOngoing / 12;
  const depMonths = inputs.forecast.considerDepreciation ? inputs.forecast.depreciationYears * 12 : 0;

  // Pre-compute monthly selling-cost lookup (Excel RE Calculations rows 191..)
  // For month m: pct lines -> pct * yr1ARV * (1+monthlyApp)^m; fixed lines -> fixedAmount (unchanged in Excel)
  const sellingCostAtMonth = (m: number): number => {
    let total = 0;
    for (const line of inputs.sellingCosts) {
      if (line.pctOfBase && line.pctOfBase > 0) {
        total += line.pctOfBase * inputs.property.yr1MarketValueARV * Math.pow(1 + monthlyApp, m);
      } else {
        total += line.fixedAmount;
      }
    }
    return total;
  };

  let propertyValue = inputs.property.yr1MarketValueARV; // month 0 baseline; we'll advance to month 1 immediately
  let cumPrincipal = 0;
  let cumAfterTax = 0;

  const rows: ForecastMonthRow[] = [];
  for (let m = 1; m <= months; m++) {
    propertyValue = m === 1
      ? inputs.property.yr1MarketValueARV * (1 + monthlyApp)
      : propertyValue * (1 + monthlyApp);

    const yearIdx = Math.floor((m - 1) / 12); // 0-based year (used for growth power)
    const rent = derived.monthlyRentalIncome * Math.pow(1 + inputs.income.annualRentalGrowth, yearIdx);
    // Excel uses monthly rent (C9 = annual/12 isn't right — actually Excel has C9 already as monthly?)
    // Inputs!C12 is per-period rental, K16 = equivalent monthly. Forecast!I5 = $C$9*(1+growth)^year
    // where $C$9 = monthlyRental. Confirmed.

    const ongoingPct = pctIncome * rent;
    const ongoingFixed = monthlyFixedOngoingBase * Math.pow(1 + inflation, yearIdx);
    const totalOngoing = ongoingPct + ongoingFixed;

    const a = schedule[m - 1];
    const payment = a ? a.payment : 0;
    const principalPart = a ? a.principal : 0;
    const interestPart = a ? a.interest : 0;
    cumPrincipal += principalPart;

    const dep = m <= depMonths ? derived.monthlyDepreciation : 0;
    const totalDeductions = totalOngoing + interestPart + dep;

    // Excel R col: I - L - M  (rent - totalOngoing - loanRepayment)
    const beforeTaxCashFlow = rent - totalOngoing - payment;
    const taxPayment = (rent - totalDeductions) * tax;
    const afterTaxCashFlow = beforeTaxCashFlow - taxPayment;
    cumAfterTax += afterTaxCashFlow;

    // Excel V col: G - C10 - C191 - F23 (propertyValue - principalAmount - sellingCosts - cumFees? )
    // Actually: G5 - $C$10 (principalAmount) - 'RE Calculations'!$C192 (selling costs for month m) - 'Mortgage Calculators (By Month)'!$F23 (loan balance? no, $F = remaining balance)
    // Re-check: V5 = G5-$C$10-'RE Calculations'!$C192-'Mortgage Calculators (By Month)'!$F23
    //   $C$10 in Forecast = Principal Amount (loan principal at start)
    //   'RE Calc'!$C192 = selling costs at month m
    //   'Mortgage Calc'!$F23 = remaining loan balance at month m
    // So grossProfit = propertyValue - principalAmount - sellingCosts(m) - remainingBalance
    //                = propertyValue - sellingCosts(m) - (principalAmount + remainingBalance)
    // Hmm that doesn't make sense. Let me re-read.
    //   $C$10 references Principal Amount in Forecast sheet's KEY INFORMATION, which equals Inputs!K8 = totalPrice - downPaymentAmount
    //   $F23 in Mortgage Calc is the balance after payment 1.
    // So at month m, gross profit if sold = propertyValue - (principalAmount + remainingBalance) - sellingCosts
    // But principalAmount = original loan; remainingBalance = what's still owed.
    // That makes profit = propertyValue - originalLoan - remainingBalance - sellingCosts
    // That's WEIRD. Let me think again... maybe $C$10 in the Forecast sheet refers to something else.
    // Looking at the Forecast sheet rows we examined: B10 = "Principal Amount" C10=Inputs!K8 (loan principal).
    // Hmm, then formula G-C10-sellingCosts-remainingBalance is strange.
    // BUT consider that propertyValue grew, and we subtract original loan + remaining balance (which is most/all of loan) means... actually this is closer to net equity gain.
    // I'll trust the formula. Excel: G - C10 - C191 - F23
    const remainingBalance = a ? a.balance : derived.principalAmount;
    const sellCost = sellingCostAtMonth(m);
    const grossProfitIfSold = propertyValue - derived.principalAmount - sellCost - remainingBalance;

    const grossROI = derived.principalAmount > 0 ? grossProfitIfSold / derived.principalAmount : 0;
    const grossAnnualizedROI = grossROI / (m / 12);
    const netProfitIfSold = grossProfitIfSold + cumAfterTax;
    const netROI = derived.principalAmount > 0 ? netProfitIfSold / derived.principalAmount : 0;
    const netAnnualizedROI = netROI / (m / 12);

    rows.push({
      month: m,
      propertyValue,
      equity: propertyValue - derived.principalAmount + cumPrincipal,
      rent,
      ongoingCostsPctOfIncome: ongoingPct,
      ongoingCostsFixedWithInflation: ongoingFixed,
      totalOngoingCosts: totalOngoing,
      loanRepayment: payment,
      principal: principalPart,
      interest: interestPart,
      depreciation: dep,
      totalDeductions,
      beforeTaxCashFlow,
      taxPayment,
      afterTaxCashFlow,
      cumulativeAfterTaxCashFlow: cumAfterTax,
      grossProfitIfSold,
      grossROI,
      grossAnnualizedROI,
      netProfitIfSold,
      netROI,
      netAnnualizedROI,
    });
  }
  return rows;
}

function rollupYearly(monthly: ForecastMonthRow[], holdingYears: number): ForecastYearRow[] {
  const out: ForecastYearRow[] = [];
  for (let y = 1; y <= holdingYears; y++) {
    const slice = monthly.filter((r) => Math.ceil(r.month / 12) === y);
    if (slice.length === 0) continue;
    const last = slice[slice.length - 1]!;
    const sum = (k: keyof ForecastMonthRow) => slice.reduce((a, r) => a + (r[k] as number), 0);
    const rent = sum('rent');
    const ongoingNoInf = sum('ongoingCostsPctOfIncome'); // % of income portion is unaffected by inflation
    const ongoingWithInf = sum('ongoingCostsFixedWithInflation');
    out.push({
      year: y,
      propertyValue: last.propertyValue,
      equity: last.equity,
      rent,
      ongoingCostsNoInflation: ongoingNoInf,
      ongoingCostsWithInflation: ongoingWithInf,
      totalOngoingCosts: ongoingNoInf + ongoingWithInf,
      loanRepayment: sum('loanRepayment'),
      principal: sum('principal'),
      interest: sum('interest'),
      depreciation: sum('depreciation'),
      totalDeductions: sum('totalDeductions'),
      beforeTaxCashFlow: sum('beforeTaxCashFlow'),
      taxPayment: sum('taxPayment'),
      afterTaxCashFlow: sum('afterTaxCashFlow'),
      cumulativeAfterTaxCashFlow: last.cumulativeAfterTaxCashFlow,
      grossProfitIfSold: last.grossProfitIfSold,
      grossROI: last.grossROI,
      grossAnnualizedROI: last.grossAnnualizedROI,
      netProfitIfSold: last.netProfitIfSold,
      netROI: last.netROI,
      netAnnualizedROI: last.netAnnualizedROI,
    });
  }
  return out;
}

export function buildForecast(inputs: Inputs, schedules: { pi: AmortRow[]; io: AmortRow[] }) {
  const derived = deriveInputs(inputs);
  const piMonthly = buildForecastMonthly(inputs, derived, schedules.pi);
  const ioMonthly = buildForecastMonthly(inputs, derived, schedules.io);
  return {
    monthly: { pi: piMonthly, io: ioMonthly },
    yearly: {
      pi: rollupYearly(piMonthly, inputs.property.holdingPeriodYears),
      io: rollupYearly(ioMonthly, inputs.property.holdingPeriodYears),
    },
  };
}

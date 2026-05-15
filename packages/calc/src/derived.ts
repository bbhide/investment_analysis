import type { Inputs, CostLine, OngoingCostLine } from '@inv/shared';
import { feeToAnnual, feeToMonthly, monthlyFromAnnualCompound, pmt } from './finance.js';

/**
 * Resolves a CostLine to a lump-sum value given a base (purchase price or sale price).
 * Mirrors Excel: IF(pct=0 OR blank, fixedAmount, pct*base).
 */
export function resolveCostLine(line: CostLine, base: number): number {
  if (line.pctOfBase && line.pctOfBase > 0) return line.pctOfBase * base;
  return line.fixedAmount;
}

/** Annual equivalent of the FIXED portion of an ongoing cost line (no inflation yet). */
export function resolveOngoingCostFixedAnnual(line: OngoingCostLine): number {
  if (line.pctOfIncome && line.pctOfIncome > 0) return 0;
  return feeToAnnual(line.fixedAmount, line.period);
}

export function totalOngoingCostPctOfIncome(lines: OngoingCostLine[]): number {
  return lines.reduce((acc, l) => acc + (l.pctOfIncome || 0), 0);
}

export function totalOngoingFixedAnnual(lines: OngoingCostLine[]): number {
  return lines.reduce((acc, l) => acc + resolveOngoingCostFixedAnnual(l), 0);
}

export interface DerivedInputs {
  totalPrice: number;
  downPaymentAmount: number;
  downPaymentPct: number;
  principalAmount: number;
  monthlyAppreciation: number;
  estimatedSellingPrice: number;
  annualRentalIncome: number;
  annualOtherIncome: number;
  totalAnnualIncome: number;
  monthlyRentalIncome: number;
  monthlyOtherIncome: number;
  totalMonthlyIncome: number;
  purchasingCostsExclDownPayment: number;
  purchasingCostsInclDownPayment: number;
  taxDeductiblePurchasingCosts: number;
  monthlyPIPayment: number;
  monthlyIOPaymentDuringIO: number;
  monthlyIOPaymentAfterIO: number;
  depreciableAmount: number;
  monthlyDepreciation: number;
}

export function deriveInputs(inputs: Inputs): DerivedInputs {
  const p = inputs.property;
  const i = inputs.income;
  const l = inputs.loan;

  const totalPrice = p.totalPurchasePrice;
  const dpAmount = p.downPayment.mode === 'percent'
    ? totalPrice * p.downPayment.value
    : p.downPayment.value;
  const dpPct = totalPrice > 0 ? dpAmount / totalPrice : 0;
  const principalAmount = Math.max(0, totalPrice - dpAmount);

  const monthlyAppreciation = monthlyFromAnnualCompound(p.annualAppreciation);
  const estimatedSellingPrice = p.yr1MarketValueARV * Math.pow(1 + p.annualAppreciation, p.holdingPeriodYears);

  const annualRentalIncome = feeToAnnual(i.rentalIncome.amount, i.rentalIncome.period);
  const annualOtherIncome = feeToAnnual(i.otherIncome.amount, i.otherIncome.period);
  const totalAnnualIncome = annualRentalIncome + annualOtherIncome;
  const monthlyRentalIncome = annualRentalIncome / 12;
  const monthlyOtherIncome = annualOtherIncome / 12;
  const totalMonthlyIncome = monthlyRentalIncome + monthlyOtherIncome;

  const purchasingExcl = inputs.purchasingCosts.reduce(
    (s, line) => s + resolveCostLine(line, totalPrice),
    0,
  );
  const purchasingIncl = purchasingExcl + dpAmount;
  const taxDeductiblePurchasingCosts = inputs.purchasingCosts.reduce(
    (s, line) => (line.taxDeductible ? s + resolveCostLine(line, totalPrice) : s),
    0,
  );

  // P&I monthly = -PMT + monthly equivalent of period fees
  const piMonthlyRate = l.pi.annualRate / 12;
  const piNper = l.pi.durationYears * 12;
  const monthlyPIPayment = -pmt(piMonthlyRate, piNper, principalAmount) + feeToMonthly(l.pi.fees.amount, l.pi.fees.period);

  // IO during IO period: rate*P + fees
  const ioFeesMonthly = feeToMonthly(l.io.fees.amount, l.io.fees.period);
  const monthlyIOPaymentDuringIO = (l.io.annualRate * principalAmount) / 12 + ioFeesMonthly;

  // IO after IO period: amortize remaining over (total - IO) at standard rate
  const remMonths = Math.max(0, (l.io.totalDurationYears - l.io.ioDurationYears) * 12);
  const stdMonthlyRate = l.io.standardRateAfterIO / 12;
  const monthlyIOPaymentAfterIO = remMonths === 0
    ? ioFeesMonthly
    : -pmt(stdMonthlyRate, remMonths, principalAmount) + ioFeesMonthly;

  const depreciableAmount = inputs.forecast.considerDepreciation
    ? inputs.forecast.depreciableValue.mode === 'percent'
      ? p.yr1MarketValueARV * inputs.forecast.depreciableValue.value
      : inputs.forecast.depreciableValue.value
    : 0;
  const monthlyDepreciation = inputs.forecast.considerDepreciation && inputs.forecast.depreciationYears > 0
    ? depreciableAmount / inputs.forecast.depreciationYears / 12
    : 0;

  return {
    totalPrice,
    downPaymentAmount: dpAmount,
    downPaymentPct: dpPct,
    principalAmount,
    monthlyAppreciation,
    estimatedSellingPrice,
    annualRentalIncome,
    annualOtherIncome,
    totalAnnualIncome,
    monthlyRentalIncome,
    monthlyOtherIncome,
    totalMonthlyIncome,
    purchasingCostsExclDownPayment: purchasingExcl,
    purchasingCostsInclDownPayment: purchasingIncl,
    taxDeductiblePurchasingCosts,
    monthlyPIPayment,
    monthlyIOPaymentDuringIO,
    monthlyIOPaymentAfterIO,
    depreciableAmount,
    monthlyDepreciation,
  };
}

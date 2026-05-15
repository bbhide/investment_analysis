import type { Inputs } from '@inv/shared';
import type { AmortRow, AmortYearRow } from './amortization.js';
import type { ForecastYearRow } from './forecast.js';
import type { DerivedInputs } from './derived.js';

export interface KPIBundle {
  cashOnCashReturn: number; // BeforeTax/AfterTax variant determined by caller
  yieldOnCost: number;
  yieldOnValue: number;
}

export interface LoanTrackSummary {
  // Year 1
  year1: {
    beforeTax: KPIBundle;
    afterTax: KPIBundle;
  };
  // Year N (holding period)
  yearN: {
    beforeTax: KPIBundle;
    afterTax: KPIBundle;
  };
  // Profit / equity / property at end of holding
  endOfHolding: {
    propertyValue: number;
    equity: number;
    loanBalance: number;
    grossProfitAfterSale: number;
    netProfitAfterSale: number;
    cumulativeCashFlow: number;
    grossAnnualizedROI: number;
    netAnnualizedROI: number;
    grossAnnualizedROE: number;
    netAnnualizedROE: number;
    capitalizationRate: number;
    dscr: number;
    ltv: number;
    ltc: number;
  };
  // Amortization totals at end of holding period
  amortization: {
    annualPaymentTotal: number;
    loanBalance: number;
    cumulativePrincipal: number;
    cumulativeInterestFees: number;
  };
}

export interface SummaryDashboard {
  keyInformation: {
    address: string;
    totalPrice: number;
    downPaymentPct: number;
    downPaymentAmount: number;
    principalAmount: number;
    yr1MarketValueARV: number;
    holdingPeriodYears: number;
    annualAppreciation: number;
    monthlyAppreciation: number;
    estimatedSellingPrice: number;
    annualRentalIncome: number;
    annualOtherIncome: number;
    monthlyEquivalentIncome: number;
    annualRentalGrowth: number;
    purchasingCostsRequired: number;
    sellingCosts: number;
  };
  mortgage: {
    pi: { annualRate: number; durationYears: number; monthlyPayment: number };
    io: {
      annualRate: number;
      ioDurationYears: number;
      standardRateAfterIO: number;
      totalDurationYears: number;
      monthlyPaymentDuringIO: number;
      monthlyPaymentAfterIO: number;
    };
  };
  pi: LoanTrackSummary;
  io: LoanTrackSummary;
  simpleCashFlow: {
    totalIncomeMonthly: number;
    ongoingFeesMonthly: number;
    piPaymentMonthly: number;
    piMonthlyCashFlow: number;
    piCashOnCash: number;
    ioPaymentMonthlyDuringIO: number;
    ioMonthlyCashFlowDuringIO: number;
    ioPaymentMonthlyAfterIO: number;
    ioMonthlyCashFlowAfterIO: number;
    ioCashOnCash: number;
  };
}

function sumAt(schedule: AmortRow[], throughMonth: number, key: 'principal' | 'interest' | 'payment'): number {
  let s = 0;
  for (const r of schedule) {
    if (r.month <= throughMonth) s += r[key];
    else break;
  }
  return s;
}

function loanBalanceAt(schedule: AmortRow[], month: number): number {
  for (const r of schedule) if (r.month === month) return r.balance;
  // Beyond schedule (loan paid off) → 0
  if (schedule.length > 0 && month > schedule[schedule.length - 1]!.month) return 0;
  return schedule[0]?.balance ?? 0;
}

function buildTrackSummary(
  inputs: Inputs,
  derived: DerivedInputs,
  yearly: ForecastYearRow[],
  schedule: AmortRow[],
  monthlyAfterIOPayment?: number,
): LoanTrackSummary {
  const N = inputs.property.holdingPeriodYears;
  const y1 = yearly[0];
  const yN = yearly[N - 1];

  const purchasingCosts = derived.purchasingCostsInclDownPayment;
  const price = derived.totalPrice;
  const arv = inputs.property.yr1MarketValueARV;

  const mkKPIs = (row: ForecastYearRow | undefined, cashFlow: number): KPIBundle => ({
    cashOnCashReturn: purchasingCosts > 0 ? cashFlow / purchasingCosts : 0,
    yieldOnCost: price > 0 ? cashFlow / price : 0,
    yieldOnValue: arv > 0 ? cashFlow / arv : 0,
  });

  const y1Before = y1?.beforeTaxCashFlow ?? 0;
  const y1After = y1?.afterTaxCashFlow ?? 0;
  const yNBefore = yN?.beforeTaxCashFlow ?? 0;
  const yNAfter = yN?.afterTaxCashFlow ?? 0;

  const propertyValueEnd = yN?.propertyValue ?? 0;
  const equityEnd = yN?.equity ?? 0;
  const balanceEnd = loanBalanceAt(schedule, N * 12);
  const grossProfit = yN?.grossProfitIfSold ?? 0;
  const netProfit = yN?.netProfitIfSold ?? 0;
  const cumCash = yN?.cumulativeAfterTaxCashFlow ?? 0;
  const annualPaymentN = yN?.loanRepayment ?? 0;

  return {
    year1: { beforeTax: mkKPIs(y1, y1Before), afterTax: mkKPIs(y1, y1After) },
    yearN: { beforeTax: mkKPIs(yN, yNBefore), afterTax: mkKPIs(yN, yNAfter) },
    endOfHolding: {
      propertyValue: propertyValueEnd,
      equity: equityEnd,
      loanBalance: balanceEnd,
      grossProfitAfterSale: grossProfit,
      netProfitAfterSale: netProfit,
      cumulativeCashFlow: cumCash,
      grossAnnualizedROI: purchasingCosts > 0 ? grossProfit / purchasingCosts / N : 0,
      netAnnualizedROI: purchasingCosts > 0 ? netProfit / purchasingCosts / N : 0,
      grossAnnualizedROE: equityEnd > 0 ? grossProfit / equityEnd / N : 0,
      netAnnualizedROE: equityEnd > 0 ? netProfit / equityEnd / N : 0,
      capitalizationRate: price > 0 ? yNBefore / price : 0,
      dscr: annualPaymentN > 0 ? yNAfter / annualPaymentN : 0,
      ltv: propertyValueEnd > 0 ? balanceEnd / propertyValueEnd : 0,
      ltc: price > 0 ? balanceEnd / price : 0,
    },
    amortization: {
      annualPaymentTotal: annualPaymentN,
      loanBalance: balanceEnd,
      cumulativePrincipal: sumAt(schedule, N * 12, 'principal'),
      cumulativeInterestFees: sumAt(schedule, N * 12, 'interest'),
    },
  };
  void monthlyAfterIOPayment;
}

export function buildSummary(
  inputs: Inputs,
  derived: DerivedInputs,
  yearly: { pi: ForecastYearRow[]; io: ForecastYearRow[] },
  schedules: { pi: AmortRow[]; io: AmortRow[] },
  _amortYears: { pi: AmortYearRow[]; io: AmortYearRow[] },
): SummaryDashboard {
  const piTrack = buildTrackSummary(inputs, derived, yearly.pi, schedules.pi);
  const ioTrack = buildTrackSummary(inputs, derived, yearly.io, schedules.io);

  // Simple cash flow calculator (Inputs!K21..K31)
  const totalIncomeMonthly = derived.totalMonthlyIncome;
  const ongoingFeesMonthly = derived.annualRentalIncome === 0
    ? 0
    : 0; // computed below — we want the monthly equivalent of total ongoing
  // Closer to Excel: K23 = F79 (annual fixed total) / 12 if period 'per month'
  // For simplicity we use first-year monthly average from forecast (excludes inflation impact)
  const fy1 = yearly.pi[0];
  const ongoingMonthly = fy1 ? (fy1.totalOngoingCosts / 12) : 0;

  return {
    keyInformation: {
      address: inputs.property.address,
      totalPrice: derived.totalPrice,
      downPaymentPct: derived.downPaymentPct,
      downPaymentAmount: derived.downPaymentAmount,
      principalAmount: derived.principalAmount,
      yr1MarketValueARV: inputs.property.yr1MarketValueARV,
      holdingPeriodYears: inputs.property.holdingPeriodYears,
      annualAppreciation: inputs.property.annualAppreciation,
      monthlyAppreciation: derived.monthlyAppreciation,
      estimatedSellingPrice: derived.estimatedSellingPrice,
      annualRentalIncome: derived.annualRentalIncome,
      annualOtherIncome: derived.annualOtherIncome,
      monthlyEquivalentIncome: derived.totalMonthlyIncome,
      annualRentalGrowth: inputs.income.annualRentalGrowth,
      purchasingCostsRequired: derived.purchasingCostsInclDownPayment,
      sellingCosts: inputs.sellingCosts.reduce((s, l) => {
        if (l.pctOfBase && l.pctOfBase > 0) return s + l.pctOfBase * derived.estimatedSellingPrice;
        return s + l.fixedAmount;
      }, 0),
    },
    mortgage: {
      pi: {
        annualRate: inputs.loan.pi.annualRate,
        durationYears: inputs.loan.pi.durationYears,
        monthlyPayment: derived.monthlyPIPayment,
      },
      io: {
        annualRate: inputs.loan.io.annualRate,
        ioDurationYears: inputs.loan.io.ioDurationYears,
        standardRateAfterIO: inputs.loan.io.standardRateAfterIO,
        totalDurationYears: inputs.loan.io.totalDurationYears,
        monthlyPaymentDuringIO: derived.monthlyIOPaymentDuringIO,
        monthlyPaymentAfterIO: derived.monthlyIOPaymentAfterIO,
      },
    },
    pi: piTrack,
    io: ioTrack,
    simpleCashFlow: {
      totalIncomeMonthly,
      ongoingFeesMonthly: ongoingMonthly,
      piPaymentMonthly: derived.monthlyPIPayment,
      piMonthlyCashFlow: totalIncomeMonthly - ongoingMonthly - derived.monthlyPIPayment,
      piCashOnCash: derived.purchasingCostsInclDownPayment > 0
        ? ((totalIncomeMonthly - ongoingMonthly - derived.monthlyPIPayment) * 12) / derived.purchasingCostsInclDownPayment
        : 0,
      ioPaymentMonthlyDuringIO: derived.monthlyIOPaymentDuringIO,
      ioMonthlyCashFlowDuringIO: totalIncomeMonthly - ongoingMonthly - derived.monthlyIOPaymentDuringIO,
      ioPaymentMonthlyAfterIO: derived.monthlyIOPaymentAfterIO,
      ioMonthlyCashFlowAfterIO: totalIncomeMonthly - ongoingMonthly - derived.monthlyIOPaymentAfterIO,
      ioCashOnCash: derived.purchasingCostsInclDownPayment > 0
        ? ((totalIncomeMonthly - ongoingMonthly - derived.monthlyIOPaymentDuringIO) * 12) / derived.purchasingCostsInclDownPayment
        : 0,
    },
  };
}

import { describe, expect, it } from 'vitest';
import { calculate } from '../src/index.js';
import { inputsSchema } from '@inv/shared';
import fixture from './fixtures/the-lofts.json' assert { type: 'json' };

const TOL = 0.5; // AED — Excel rounds via display, so allow 0.5 absolute

function near(actual: number, expected: number, tol = TOL) {
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(tol);
}

describe('Golden parity — The Lofts (from xlsx)', () => {
  const inputs = inputsSchema.parse(fixture.inputs);
  const result = calculate(inputs);
  const exp = fixture.expected;

  it('derives totalPrice / principalAmount / downPayment', () => {
    near(result.derived.totalPrice, exp.derived.totalPrice);
    near(result.derived.downPaymentAmount, exp.derived.downPaymentAmount);
    near(result.derived.downPaymentPct, exp.derived.downPaymentPct, 0.0001);
    near(result.derived.principalAmount, exp.derived.principalAmount);
  });

  it('derives estimatedSellingPrice', () => {
    near(result.derived.estimatedSellingPrice, exp.derived.estimatedSellingPrice, 1);
  });

  it('derives total purchasing costs (incl. down payment)', () => {
    near(result.derived.purchasingCostsInclDownPayment, exp.derived.purchasingCostsRequired);
  });

  it('derives selling costs at end of holding period', () => {
    near(result.summary.keyInformation.sellingCosts, exp.derived.sellingCosts, 1);
  });

  it('derives monthly P&I payment (fees only when principal=0)', () => {
    // NOTE: Inputs!K39 in the source xlsx has a bug — it adds the annual fee at full value
    // to the monthly payment (missing a /12). The amortization schedule (Mortgage Calc!C23)
    // correctly divides by 12. Our engine implements the correct math, so we assert against
    // the mathematically correct value (100 AED/year → 100/12 ≈ 8.33/month) rather than the
    // buggy K39 cell value (100).
    near(result.derived.monthlyPIPayment, 100 / 12, 0.01);
  });

  it('derives monthly IO payments', () => {
    // Same bug as above in K49/K50. Correct: fee=120/year added at 10/month.
    near(result.derived.monthlyIOPaymentDuringIO, 120 / 12, 0.01);
    near(result.derived.monthlyIOPaymentAfterIO, 120 / 12, 0.01);
  });

  it('P&I year 1 rent + ongoing + cash flow match', () => {
    const y1 = result.forecastYearly.pi[0]!;
    near(y1.rent, exp.piYear1.rent, 1);
    near(y1.totalOngoingCosts, exp.piYear1.totalOngoingCosts, 1);
    near(y1.beforeTaxCashFlow, exp.piYear1.beforeTaxCashFlow, 1);
  });

  it('P&I year N property value and equity match', () => {
    const yN = result.forecastYearly.pi[inputs.property.holdingPeriodYears - 1]!;
    near(yN.propertyValue, exp.piYearN.propertyValue, 1);
    near(yN.equity, exp.piYearN.equity, 1);
    near(yN.rent, exp.piYearN.rent, 1);
    near(yN.totalOngoingCosts, exp.piYearN.totalOngoingCosts, 1);
    near(yN.beforeTaxCashFlow, exp.piYearN.beforeTaxCashFlow, 1);
  });

  it('P&I year N gross & net profit if sold match Excel', () => {
    // These flow through the Excel formula: profit = PV - purchasingCostsInclDP - sellingCosts - loanBalance.
    // Catches the bug where principalAmount was being used instead of purchasingCostsInclDP.
    const yN = result.forecastYearly.pi[inputs.property.holdingPeriodYears - 1]!;
    near(yN.grossProfitIfSold, exp.piYearN.grossProfitIfSold, 1);
    near(yN.netProfitIfSold, exp.piYearN.netProfitIfSold, 1);
  });
});

describe('Synthetic loan scenario — exercises PMT/PPMT/IPMT', () => {
  // A scenario with a real loan so amortization paths are exercised.
  const inputs = inputsSchema.parse({
    property: {
      address: 'Test Property',
      totalPurchasePrice: 1000000,
      downPayment: { mode: 'percent', value: 0.2 },
      yr1MarketValueARV: 1000000,
      holdingPeriodYears: 5,
      annualAppreciation: 0.05,
    },
    income: {
      rentalIncome: { amount: 60000, period: 'annum' },
      otherIncome: { amount: 0, period: 'annum' },
      annualRentalGrowth: 0.03,
    },
    loan: {
      type: 'PI',
      pi: { annualRate: 0.06, durationYears: 30, fees: { amount: 0, period: 'annum' } },
      io: {
        annualRate: 0.06,
        ioDurationYears: 5,
        standardRateAfterIO: 0.06,
        totalDurationYears: 30,
        fees: { amount: 0, period: 'annum' },
      },
    },
    purchasingCosts: [],
    ongoingCosts: [],
    sellingCosts: [],
    forecast: {
      annualInflation: 0,
      taxBracket: 0,
      considerDepreciation: false,
      depreciableValue: { mode: 'percent', value: 0 },
      depreciationYears: 0,
    },
  });
  const r = calculate(inputs);

  it('P&I monthly payment matches standard amortization formula (800k @ 6% / 30yr)', () => {
    // PMT(0.005, 360, 800000) = 4796.40
    near(r.derived.monthlyPIPayment, 4796.4, 0.5);
  });

  it('P&I sum of principal payments == principal amount', () => {
    const sumPrincipal = r.amortization.pi.reduce((s, row) => s + row.principal, 0);
    near(sumPrincipal, r.derived.principalAmount, 1);
  });

  it('P&I final balance ≈ 0 at end of duration', () => {
    const last = r.amortization.pi[r.amortization.pi.length - 1]!;
    near(last.balance, 0, 1);
  });

  it('IO during IO phase: principal = 0, interest = rate*P/12', () => {
    const ioMonth1 = r.amortization.io[0]!;
    expect(ioMonth1.principal).toBe(0);
    near(ioMonth1.interest, (0.06 * 800000) / 12, 0.01); // = 4000
    near(ioMonth1.payment, 4000, 0.01);
  });

  it('IO after IO phase: principal payments resume, final balance ≈ 0', () => {
    const last = r.amortization.io[r.amortization.io.length - 1]!;
    near(last.balance, 0, 1);
    const month61 = r.amortization.io.find((row) => row.month === 61)!;
    expect(month61.principal).toBeGreaterThan(0);
  });

  it('Year-1 yearly == sum of months 1-12', () => {
    const y1 = r.forecastYearly.pi[0]!;
    const sumRent = r.forecastMonthly.pi.slice(0, 12).reduce((s, m) => s + m.rent, 0);
    near(y1.rent, sumRent, 0.5);
  });
});

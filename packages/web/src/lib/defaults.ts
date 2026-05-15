import type { Inputs, Comparables } from '@inv/shared';

/** Default Inputs payload — mirrors the structure of the source spreadsheet so the form has the right line items by default. */
export function defaultInputs(): Inputs {
  return {
    property: {
      address: '',
      totalPurchasePrice: 1_000_000,
      downPayment: { mode: 'percent', value: 0.2 },
      yr1MarketValueARV: 1_050_000,
      holdingPeriodYears: 5,
      annualAppreciation: 0.05,
    },
    income: {
      rentalIncome: { amount: 60_000, period: 'annum' },
      otherIncome: { amount: 0, period: 'annum' },
      annualRentalGrowth: 0.05,
    },
    loan: {
      type: 'PI',
      pi: {
        annualRate: 0.045,
        durationYears: 30,
        fees: { amount: 0, period: 'annum' },
      },
      io: {
        annualRate: 0.0475,
        ioDurationYears: 5,
        standardRateAfterIO: 0.045,
        totalDurationYears: 30,
        fees: { amount: 0, period: 'annum' },
      },
    },
    purchasingCosts: [
      { label: 'Legal fees', pctOfBase: 0, fixedAmount: 0, taxDeductible: false },
      { label: 'Conveyancer/Solicitor fees', pctOfBase: 0, fixedAmount: 4500, taxDeductible: false },
      { label: 'Mortgage registration fee', pctOfBase: 0.0025, fixedAmount: 0, taxDeductible: false },
      { label: 'Land department transfer fee', pctOfBase: 0.04, fixedAmount: 700, taxDeductible: false },
      { label: 'NOC', pctOfBase: 0, fixedAmount: 2000, taxDeductible: false },
      { label: 'Trustee Office fee', pctOfBase: 0, fixedAmount: 4000, taxDeductible: false },
      { label: "Buyer's Agent", pctOfBase: 0.02, fixedAmount: 0, taxDeductible: false },
    ],
    ongoingCosts: [
      { label: 'Service Charges', pctOfIncome: 0, fixedAmount: 10000, period: 'annum' },
      { label: 'Utilities & Services', pctOfIncome: 0, fixedAmount: 600, period: 'month' },
      { label: 'Provision for Vacancy', pctOfIncome: 0.02, fixedAmount: 0, period: 'annum' },
      { label: 'Provision for Maintenance & Capex', pctOfIncome: 0.01, fixedAmount: 0, period: 'month' },
      { label: 'Management Fees', pctOfIncome: 0.08, fixedAmount: 0, period: 'month' },
    ],
    sellingCosts: [
      { label: 'Real Estate Agency Commission', pctOfBase: 0.02, fixedAmount: 0, taxDeductible: false },
      { label: 'Legal Fees', pctOfBase: 0, fixedAmount: 4500, taxDeductible: false },
    ],
    forecast: {
      annualInflation: 0,
      taxBracket: 0,
      considerDepreciation: false,
      depreciableValue: { mode: 'percent', value: 0.25 },
      depreciationYears: 30,
    },
  };
}

export function defaultComparables(): Comparables {
  return { areaUnit: 'sqft', listed: [], sold: [], rentals: [] };
}

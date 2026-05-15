import { z } from 'zod';
import { SUPPORTED_CURRENCIES } from './currencies.js';

export const periodSchema = z.enum(['week', 'fortnight', 'month', 'quarter', 'annum']);
export type Period = z.infer<typeof periodSchema>;

export const PERIOD_TO_ANNUAL: Record<Period, number> = {
  week: 52,
  fortnight: 26,
  month: 12,
  quarter: 4,
  annum: 1,
};

const amountWithPeriodSchema = z.object({
  amount: z.number().finite(),
  period: periodSchema,
});

const modeValueSchema = z.object({
  mode: z.enum(['percent', 'amount']),
  value: z.number().finite(),
});

export const costLineSchema = z.object({
  label: z.string(),
  pctOfBase: z.number().finite().default(0),
  fixedAmount: z.number().finite().default(0),
  taxDeductible: z.boolean().default(false),
});
export type CostLine = z.infer<typeof costLineSchema>;

export const ongoingCostLineSchema = z.object({
  label: z.string(),
  pctOfIncome: z.number().finite().default(0),
  fixedAmount: z.number().finite().default(0),
  period: periodSchema.default('annum'),
});
export type OngoingCostLine = z.infer<typeof ongoingCostLineSchema>;

export const inputsSchema = z.object({
  property: z.object({
    address: z.string().default(''),
    totalPurchasePrice: z.number().finite().nonnegative(),
    downPayment: modeValueSchema,
    yr1MarketValueARV: z.number().finite().nonnegative(),
    holdingPeriodYears: z.number().int().min(1).max(50),
    annualAppreciation: z.number().finite(),
  }),
  income: z.object({
    rentalIncome: amountWithPeriodSchema,
    otherIncome: amountWithPeriodSchema,
    annualRentalGrowth: z.number().finite(),
  }),
  loan: z.object({
    type: z.enum(['PI', 'IO']),
    pi: z.object({
      annualRate: z.number().finite().nonnegative(),
      durationYears: z.number().int().min(1).max(50),
      fees: amountWithPeriodSchema,
    }),
    io: z.object({
      annualRate: z.number().finite().nonnegative(),
      ioDurationYears: z.number().int().min(0).max(50),
      standardRateAfterIO: z.number().finite().nonnegative(),
      totalDurationYears: z.number().int().min(1).max(50),
      fees: amountWithPeriodSchema,
    }),
  }),
  purchasingCosts: z.array(costLineSchema),
  ongoingCosts: z.array(ongoingCostLineSchema),
  sellingCosts: z.array(costLineSchema),
  forecast: z.object({
    annualInflation: z.number().finite().default(0),
    taxBracket: z.number().min(0).max(1).default(0),
    considerDepreciation: z.boolean().default(false),
    depreciableValue: modeValueSchema,
    depreciationYears: z.number().int().min(0).max(50).default(0),
  }),
});
export type Inputs = z.infer<typeof inputsSchema>;

export const comparablePropertySchema = z.object({
  address: z.string().default(''),
  bedrooms: z.number().nonnegative().default(0),
  bathrooms: z.number().nonnegative().default(0),
  parking: z.number().nonnegative().default(0),
  lotArea: z.number().nonnegative().default(0),
  grossFloorArea: z.number().nonnegative().default(0),
  yearBuilt: z.number().int().nonnegative().default(0),
  lastRenovated: z.number().int().nonnegative().default(0),
  daysOnMarket: z.number().nonnegative().default(0),
  price: z.number().nonnegative().default(0),
});
export type ComparableProperty = z.infer<typeof comparablePropertySchema>;

export const comparablesSchema = z.object({
  areaUnit: z.enum(['sqft', 'sqm']).default('sqft'),
  listed: z.array(comparablePropertySchema).default([]),
  sold: z.array(comparablePropertySchema).default([]),
  rentals: z.array(comparablePropertySchema).default([]),
});
export type Comparables = z.infer<typeof comparablesSchema>;

export const currencySchema = z.enum(SUPPORTED_CURRENCIES);

export const scenarioCreateSchema = z.object({
  name: z.string().min(1).max(200),
  currency: currencySchema.default('AED'),
  inputs: inputsSchema,
  comparables: comparablesSchema.optional(),
});
export type ScenarioCreate = z.infer<typeof scenarioCreateSchema>;

export const scenarioUpdateSchema = scenarioCreateSchema.partial();
export type ScenarioUpdate = z.infer<typeof scenarioUpdateSchema>;

export interface Scenario {
  id: string;
  name: string;
  currency: string;
  inputs: Inputs;
  comparables: Comparables | null;
  shareToken: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ScenarioListItem {
  id: string;
  name: string;
  currency: string;
  address: string;
  totalPurchasePrice: number;
  holdingPeriodYears: number;
  updatedAt: string;
}

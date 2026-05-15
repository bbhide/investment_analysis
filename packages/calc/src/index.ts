import type { Inputs } from '@inv/shared';
import { deriveInputs, type DerivedInputs } from './derived.js';
import {
  annualizeSchedule,
  buildSchedulesFromInputs,
  type AmortRow,
  type AmortYearRow,
} from './amortization.js';
import { buildForecast, type ForecastMonthRow, type ForecastYearRow } from './forecast.js';
import { buildSummary, type SummaryDashboard } from './summary.js';

export * from './finance.js';
export * from './derived.js';
export * from './amortization.js';
export * from './forecast.js';
export * from './summary.js';
export * from './comparables.js';

export interface CalcResult {
  derived: DerivedInputs;
  summary: SummaryDashboard;
  amortization: {
    pi: AmortRow[];
    io: AmortRow[];
    piYearly: AmortYearRow[];
    ioYearly: AmortYearRow[];
  };
  forecastMonthly: { pi: ForecastMonthRow[]; io: ForecastMonthRow[] };
  forecastYearly: { pi: ForecastYearRow[]; io: ForecastYearRow[] };
}

export function calculate(inputs: Inputs): CalcResult {
  const derived = deriveInputs(inputs);
  const schedules = buildSchedulesFromInputs(inputs, derived.principalAmount);
  const piYearly = annualizeSchedule(schedules.pi);
  const ioYearly = annualizeSchedule(schedules.io);
  const forecast = buildForecast(inputs, schedules);
  const summary = buildSummary(inputs, derived, forecast.yearly, schedules, {
    pi: piYearly,
    io: ioYearly,
  });
  return {
    derived,
    summary,
    amortization: { pi: schedules.pi, io: schedules.io, piYearly, ioYearly },
    forecastMonthly: forecast.monthly,
    forecastYearly: forecast.yearly,
  };
}

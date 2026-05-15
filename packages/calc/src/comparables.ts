import type { Comparables, ComparableProperty } from '@inv/shared';

export interface ComparableGroupStats {
  averageBedrooms: number;
  averageBathrooms: number;
  averageParking: number;
  averageLotArea: number;
  averageGrossFloorArea: number;
  averageYearBuilt: number;
  averageLastRenovated: number;
  averageDaysOnMarket: number;
  averagePrice: number;
  averagePricePerArea: number; // price / grossFloorArea per property, averaged
}

function avg(values: number[]): number {
  const nonZero = values.filter((v) => v > 0);
  if (nonZero.length === 0) return 0;
  return nonZero.reduce((a, b) => a + b, 0) / nonZero.length;
}

export function groupStats(properties: ComparableProperty[]): ComparableGroupStats {
  return {
    averageBedrooms: avg(properties.map((p) => p.bedrooms)),
    averageBathrooms: avg(properties.map((p) => p.bathrooms)),
    averageParking: avg(properties.map((p) => p.parking)),
    averageLotArea: avg(properties.map((p) => p.lotArea)),
    averageGrossFloorArea: avg(properties.map((p) => p.grossFloorArea)),
    averageYearBuilt: avg(properties.map((p) => p.yearBuilt)),
    averageLastRenovated: avg(properties.map((p) => p.lastRenovated)),
    averageDaysOnMarket: avg(properties.map((p) => p.daysOnMarket)),
    averagePrice: avg(properties.map((p) => p.price)),
    averagePricePerArea: avg(
      properties.map((p) => (p.grossFloorArea > 0 && p.price > 0 ? p.price / p.grossFloorArea : 0)),
    ),
  };
}

export interface ComparablesAnalysis {
  listed: ComparableGroupStats;
  sold: ComparableGroupStats;
  rentals: ComparableGroupStats;
}

export function analyzeComparables(c: Comparables): ComparablesAnalysis {
  return {
    listed: groupStats(c.listed),
    sold: groupStats(c.sold),
    rentals: groupStats(c.rentals),
  };
}

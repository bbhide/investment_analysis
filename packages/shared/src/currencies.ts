export const SUPPORTED_CURRENCIES = [
  'AED',
  'USD',
  'EUR',
  'GBP',
  'INR',
  'SGD',
  'AUD',
  'CAD',
  'SAR',
] as const;

export type Currency = (typeof SUPPORTED_CURRENCIES)[number];

export const DEFAULT_CURRENCY: Currency = 'AED';

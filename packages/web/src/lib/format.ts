import { computed, ref } from 'vue';

export const currency = ref<string>('AED');

export function setCurrency(c: string) {
  currency.value = c;
}

function fmt(c: string) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: c,
    maximumFractionDigits: 0,
  });
}

const fmtCache = new Map<string, Intl.NumberFormat>();
function getFmt(c: string): Intl.NumberFormat {
  if (!fmtCache.has(c)) fmtCache.set(c, fmt(c));
  return fmtCache.get(c)!;
}

export function money(value: number, c: string = currency.value): string {
  if (!Number.isFinite(value)) return '—';
  try {
    return getFmt(c).format(value);
  } catch {
    return getFmt('USD').format(value);
  }
}

export function pct(value: number, digits = 2): string {
  if (!Number.isFinite(value)) return '—';
  return `${(value * 100).toFixed(digits)}%`;
}

export function int(value: number): string {
  if (!Number.isFinite(value)) return '—';
  return new Intl.NumberFormat().format(Math.round(value));
}

export function num(value: number, digits = 2): string {
  if (!Number.isFinite(value)) return '—';
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: digits }).format(value);
}

export const useCurrency = () => computed(() => currency.value);

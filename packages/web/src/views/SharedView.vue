<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import { api } from '../lib/api';
import { money, pct, setCurrency } from '../lib/format';
import type { CalcResult, ComparablesAnalysis } from '@inv/calc';

const route = useRoute();
const loading = ref(true);
const error = ref<string | null>(null);
const name = ref('');
const result = ref<CalcResult | null>(null);
const analysis = ref<ComparablesAnalysis | null>(null);
const currency = ref('AED');
const summary = computed(() => result.value?.summary ?? null);

onMounted(async () => {
  try {
    const token = String(route.params.token);
    const s = await api.getShared(token);
    name.value = s.name;
    currency.value = s.currency;
    setCurrency(s.currency);
    const r = await api.calculate(s.inputs, s.comparables ?? undefined);
    result.value = r.result;
    analysis.value = r.comparablesAnalysis;
  } catch (e) {
    error.value = (e as Error).message;
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <section class="mx-auto max-w-7xl px-6 py-10">
    <header class="mb-6">
      <p class="text-xs uppercase tracking-wide text-ink-muted">Shared scenario · Read-only</p>
      <h1 class="text-2xl font-semibold">{{ name }}</h1>
    </header>
    <div v-if="loading" class="text-ink-muted">Loading…</div>
    <p v-else-if="error" class="text-red-600">{{ error }}</p>
    <div v-else-if="summary" class="space-y-6">
      <section class="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div class="kpi"><div class="kpi-label">Total Price</div><div class="kpi-value">{{ money(summary.keyInformation.totalPrice) }}</div></div>
        <div class="kpi"><div class="kpi-label">Est. Sale Price</div><div class="kpi-value">{{ money(summary.keyInformation.estimatedSellingPrice) }}</div></div>
        <div class="kpi"><div class="kpi-label">Net Profit (P&amp;I)</div><div class="kpi-value">{{ money(summary.pi.endOfHolding.netProfitAfterSale) }}</div></div>
        <div class="kpi"><div class="kpi-label">Net Ann. ROI</div><div class="kpi-value">{{ pct(summary.pi.endOfHolding.netAnnualizedROI) }}</div></div>
      </section>
      <p class="text-xs text-ink-muted">Shared scenarios are read-only snapshots — the owner can revoke the link at any time.</p>
    </div>
  </section>
</template>

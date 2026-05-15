<script setup lang="ts">
import { computed } from 'vue';
import { Line } from 'vue-chartjs';
import type { ForecastYearRow } from '@inv/calc';
import './chartSetup';

const props = defineProps<{ rows: ForecastYearRow[] }>();

const data = computed(() => ({
  labels: props.rows.map((r) => `Yr ${r.year}`),
  datasets: [
    {
      label: 'Cumulative After-Tax Cash Flow',
      data: props.rows.map((r) => r.cumulativeAfterTaxCashFlow),
      borderColor: '#0f172a',
      backgroundColor: 'rgba(15,23,42,0.08)',
      fill: true,
      tension: 0.2,
    },
    {
      label: 'Annual Before-Tax Cash Flow',
      data: props.rows.map((r) => r.beforeTaxCashFlow),
      borderColor: '#ecd0a3',
      backgroundColor: 'rgba(236,208,163,0.2)',
      tension: 0.2,
    },
  ],
}));
const options = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { position: 'bottom' as const } },
};
</script>
<template>
  <div class="h-72"><Line :data="data" :options="options" /></div>
</template>

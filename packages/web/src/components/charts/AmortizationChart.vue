<script setup lang="ts">
import { computed } from 'vue';
import { Bar } from 'vue-chartjs';
import type { AmortYearRow } from '@inv/calc';
import './chartSetup';

const props = defineProps<{ rows: AmortYearRow[] }>();

const data = computed(() => ({
  labels: props.rows.map((r) => `Yr ${r.year}`),
  datasets: [
    {
      label: 'Principal',
      data: props.rows.map((r) => r.principal),
      backgroundColor: '#0f172a',
      stack: 'pmt',
    },
    {
      label: 'Interest + Fees',
      data: props.rows.map((r) => r.interest),
      backgroundColor: '#ecd0a3',
      stack: 'pmt',
    },
  ],
}));
const options = {
  responsive: true,
  maintainAspectRatio: false,
  scales: { x: { stacked: true }, y: { stacked: true } },
  plugins: { legend: { position: 'bottom' as const } },
};
</script>
<template>
  <div class="h-72"><Bar :data="data" :options="options" /></div>
</template>

<script setup lang="ts">
import type { OngoingCostLine, Period } from '@inv/shared';
import MoneyInput from './MoneyInput.vue';
import PercentInput from './PercentInput.vue';
import PeriodSelect from './PeriodSelect.vue';

defineProps<{ modelValue: OngoingCostLine[] }>();
const emit = defineEmits<{ (e: 'update:modelValue', v: OngoingCostLine[]): void }>();

function update(idx: number, patch: Partial<OngoingCostLine>, list: OngoingCostLine[]) {
  emit('update:modelValue', list.map((line, i) => (i === idx ? { ...line, ...patch } : line)));
}
function addLine(list: OngoingCostLine[]) {
  emit('update:modelValue', [...list, { label: 'New item', pctOfIncome: 0, fixedAmount: 0, period: 'annum' as Period }]);
}
function removeLine(idx: number, list: OngoingCostLine[]) {
  emit('update:modelValue', list.filter((_, i) => i !== idx));
}
</script>

<template>
  <table class="table-default">
    <thead>
      <tr>
        <th class="w-1/3">Item</th>
        <th>% of Total Income</th>
        <th>Amount</th>
        <th>Unit</th>
        <th class="w-10"></th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="(line, idx) in modelValue" :key="idx">
        <td>
          <input class="input-cell" type="text" :value="line.label"
            @input="update(idx, { label: ($event.target as HTMLInputElement).value }, modelValue)" />
        </td>
        <td>
          <PercentInput :model-value="line.pctOfIncome"
            @update:model-value="(v) => update(idx, { pctOfIncome: v }, modelValue)" />
        </td>
        <td>
          <MoneyInput :model-value="line.fixedAmount"
            @update:model-value="(v) => update(idx, { fixedAmount: v }, modelValue)" />
        </td>
        <td>
          <PeriodSelect :model-value="line.period"
            @update:model-value="(v) => update(idx, { period: v }, modelValue)" />
        </td>
        <td>
          <button class="text-red-600 text-xs hover:underline" @click="removeLine(idx, modelValue)">Remove</button>
        </td>
      </tr>
      <tr>
        <td colspan="5">
          <button class="btn text-xs" @click="addLine(modelValue)">+ Add line</button>
        </td>
      </tr>
    </tbody>
  </table>
</template>

<script setup lang="ts">
import type { CostLine } from '@inv/shared';
import MoneyInput from './MoneyInput.vue';
import PercentInput from './PercentInput.vue';

defineProps<{
  modelValue: CostLine[];
  baseLabel: string; // e.g. "% of Purchase Price"
  showTaxDeductible?: boolean;
}>();
const emit = defineEmits<{ (e: 'update:modelValue', v: CostLine[]): void }>();

function update(idx: number, patch: Partial<CostLine>, list: CostLine[]) {
  const next = list.map((line, i) => (i === idx ? { ...line, ...patch } : line));
  emit('update:modelValue', next);
}
function addLine(list: CostLine[]) {
  emit('update:modelValue', [...list, { label: 'New item', pctOfBase: 0, fixedAmount: 0, taxDeductible: false }]);
}
function removeLine(idx: number, list: CostLine[]) {
  emit('update:modelValue', list.filter((_, i) => i !== idx));
}
</script>

<template>
  <table class="table-default">
    <thead>
      <tr>
        <th class="w-1/3">Item</th>
        <th>{{ baseLabel }}</th>
        <th>One-Time Cost</th>
        <th v-if="showTaxDeductible">Tax-Deductible?</th>
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
          <PercentInput :model-value="line.pctOfBase"
            @update:model-value="(v) => update(idx, { pctOfBase: v }, modelValue)" />
        </td>
        <td>
          <MoneyInput :model-value="line.fixedAmount"
            @update:model-value="(v) => update(idx, { fixedAmount: v }, modelValue)" />
        </td>
        <td v-if="showTaxDeductible">
          <input type="checkbox" :checked="line.taxDeductible"
            @change="update(idx, { taxDeductible: ($event.target as HTMLInputElement).checked }, modelValue)" />
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

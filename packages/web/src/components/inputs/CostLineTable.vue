<script setup lang="ts">
import type { CostLine } from '@inv/shared';
import MoneyInput from './MoneyInput.vue';
import PercentInput from './PercentInput.vue';

defineProps<{
  modelValue: CostLine[];
  baseLabel: string;
  showTaxDeductible?: boolean;
}>();
const emit = defineEmits<{ (e: 'update:modelValue', v: CostLine[]): void }>();

function update(idx: number, patch: Partial<CostLine>, list: CostLine[]) {
  emit('update:modelValue', list.map((line, i) => (i === idx ? { ...line, ...patch } : line)));
}
function addLine(list: CostLine[]) {
  emit('update:modelValue', [...list, { label: 'New item', pctOfBase: 0, fixedAmount: 0, taxDeductible: false }]);
}
function removeLine(idx: number, list: CostLine[]) {
  emit('update:modelValue', list.filter((_, i) => i !== idx));
}
</script>

<template>
  <!-- Desktop / tablet: table layout -->
  <div class="hidden md:block overflow-x-auto">
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
          <td :colspan="showTaxDeductible ? 5 : 4">
            <button class="btn text-xs" @click="addLine(modelValue)">+ Add line</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- Mobile: stacked cards -->
  <div class="md:hidden space-y-3">
    <div v-for="(line, idx) in modelValue" :key="idx" class="rounded-lg border border-slate-200 p-3 space-y-2">
      <div class="flex items-center justify-between gap-2">
        <input
          class="input-cell flex-1 font-medium"
          type="text"
          :value="line.label"
          placeholder="Item"
          @input="update(idx, { label: ($event.target as HTMLInputElement).value }, modelValue)"
        />
        <button class="text-red-600 text-xs hover:underline shrink-0" @click="removeLine(idx, modelValue)">Remove</button>
      </div>
      <div class="grid grid-cols-2 gap-2">
        <label class="block">
          <span class="text-xs text-ink-muted">{{ baseLabel }}</span>
          <PercentInput class="mt-1" :model-value="line.pctOfBase"
            @update:model-value="(v) => update(idx, { pctOfBase: v }, modelValue)" />
        </label>
        <label class="block">
          <span class="text-xs text-ink-muted">One-Time Cost</span>
          <MoneyInput class="mt-1" :model-value="line.fixedAmount"
            @update:model-value="(v) => update(idx, { fixedAmount: v }, modelValue)" />
        </label>
      </div>
      <label v-if="showTaxDeductible" class="flex items-center gap-2 text-sm">
        <input type="checkbox" :checked="line.taxDeductible"
          @change="update(idx, { taxDeductible: ($event.target as HTMLInputElement).checked }, modelValue)" />
        <span>Tax-deductible</span>
      </label>
    </div>
    <button class="btn text-xs w-full" @click="addLine(modelValue)">+ Add line</button>
  </div>
</template>

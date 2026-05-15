<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{ modelValue: number; readonly?: boolean }>();
const emit = defineEmits<{ (e: 'update:modelValue', v: number): void }>();

// Store as fraction (0.045), display as 4.5
const local = computed({
  get: () => Number(((props.modelValue ?? 0) * 100).toFixed(4)),
  set: (v: number) => emit('update:modelValue', (Number.isFinite(v) ? v : 0) / 100),
});
</script>

<template>
  <div class="relative">
    <input
      type="number"
      step="any"
      :class="readonly ? 'input-cell-readonly pr-7' : 'input-cell pr-7'"
      :readonly="readonly"
      v-model.number="local"
    />
    <span class="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-ink-muted">%</span>
  </div>
</template>

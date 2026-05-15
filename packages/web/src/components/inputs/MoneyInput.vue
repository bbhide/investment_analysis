<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{ modelValue: number; min?: number; step?: number; readonly?: boolean }>();
const emit = defineEmits<{ (e: 'update:modelValue', v: number): void }>();

const local = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', Number.isFinite(v) ? v : 0),
});
</script>

<template>
  <input
    type="number"
    :class="readonly ? 'input-cell-readonly' : 'input-cell'"
    :min="min"
    :step="step ?? 'any'"
    :readonly="readonly"
    v-model.number="local"
  />
</template>

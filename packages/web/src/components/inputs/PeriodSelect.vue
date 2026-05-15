<script setup lang="ts">
import type { Period } from '@inv/shared';

defineProps<{ modelValue: Period }>();
defineEmits<{ (e: 'update:modelValue', v: Period): void }>();
</script>

<template>
  <select
    class="input-cell"
    :value="modelValue"
    @change="$emit('update:modelValue', ($event.target as HTMLSelectElement).value as Period)"
  >
    <option value="week">per week</option>
    <option value="fortnight">per fortnight</option>
    <option value="month">per month</option>
    <option value="quarter">per quarter</option>
    <option value="annum">per annum</option>
  </select>
</template>

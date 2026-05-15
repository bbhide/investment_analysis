<script setup lang="ts">
import { RouterLink, useRoute } from 'vue-router';
import { computed } from 'vue';
import { useScenarioStore } from '../stores/scenario';
import { SUPPORTED_CURRENCIES } from '@inv/shared';

const route = useRoute();
const store = useScenarioStore();
const inScenario = computed(() => typeof route.params.id === 'string');
</script>

<template>
  <header class="border-b border-slate-200 bg-white">
    <div class="mx-auto max-w-7xl px-6 py-3 flex items-center gap-6">
      <RouterLink to="/" class="flex items-center gap-2 font-semibold">
        <span class="inline-block h-7 w-7 rounded-md bg-brown-100 text-ink grid place-items-center text-sm">RE</span>
        <span>Investment Analysis</span>
      </RouterLink>

      <nav v-if="inScenario" class="flex items-center gap-1 text-sm">
        <RouterLink :to="`/scenario/${route.params.id}/inputs`" class="px-3 py-1.5 rounded-md hover:bg-slate-100"
          active-class="bg-slate-100 font-medium">Inputs</RouterLink>
        <RouterLink :to="`/scenario/${route.params.id}/summary`" class="px-3 py-1.5 rounded-md hover:bg-slate-100"
          active-class="bg-slate-100 font-medium">Summary</RouterLink>
        <RouterLink :to="`/scenario/${route.params.id}/mortgage`" class="px-3 py-1.5 rounded-md hover:bg-slate-100"
          active-class="bg-slate-100 font-medium">Mortgage</RouterLink>
        <RouterLink :to="`/scenario/${route.params.id}/forecast`" class="px-3 py-1.5 rounded-md hover:bg-slate-100"
          active-class="bg-slate-100 font-medium">Forecast</RouterLink>
        <RouterLink :to="`/scenario/${route.params.id}/comparables`" class="px-3 py-1.5 rounded-md hover:bg-slate-100"
          active-class="bg-slate-100 font-medium">Comparables</RouterLink>
      </nav>

      <div class="ml-auto flex items-center gap-3 text-sm">
        <span v-if="inScenario && store.dirty" class="text-xs text-amber-600">Saving…</span>
        <span v-else-if="inScenario && store.id && !store.dirty" class="text-xs text-slate-400">Saved</span>
        <select v-if="inScenario" v-model="store.currency" class="rounded-md border border-slate-200 px-2 py-1 text-sm">
          <option v-for="c in SUPPORTED_CURRENCIES" :key="c" :value="c">{{ c }}</option>
        </select>
        <RouterLink to="/scenario/new" class="btn btn-primary">New Scenario</RouterLink>
      </div>
    </div>
  </header>
</template>

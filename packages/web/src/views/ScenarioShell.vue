<script setup lang="ts">
import { onMounted, watch } from 'vue';
import { useRoute, RouterView } from 'vue-router';
import { useScenarioStore } from '../stores/scenario';
import { api } from '../lib/api';

const route = useRoute();
const store = useScenarioStore();

async function load(id: string) {
  const s = await api.getScenario(id);
  store.hydrate(s);
  await store.recompute();
}

onMounted(() => {
  if (typeof route.params.id === 'string') void load(route.params.id);
});
watch(
  () => route.params.id,
  (id) => {
    if (typeof id === 'string' && id !== store.id) void load(id);
  },
);
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 sm:px-6 py-4 sm:py-6">
    <header class="mb-4 flex flex-wrap items-center gap-3">
      <input
        v-model="store.name"
        class="flex-1 min-w-0 text-lg sm:text-xl font-semibold bg-transparent border-b border-transparent
               focus:border-slate-300 focus:outline-none px-1"
        aria-label="Scenario name"
      />
      <span v-if="store.calculating" class="text-xs text-ink-muted">Recalculating…</span>
      <span v-else-if="store.shareToken" class="text-xs text-emerald-700">Public link active</span>
    </header>
    <RouterView />
  </div>
</template>

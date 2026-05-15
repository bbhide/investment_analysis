<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { RouterLink } from 'vue-router';
import { api } from '../lib/api';
import { money } from '../lib/format';
import type { ScenarioListItem } from '@inv/shared';

const items = ref<ScenarioListItem[]>([]);
const loading = ref(true);

async function refresh() {
  loading.value = true;
  try {
    items.value = await api.listScenarios();
  } finally {
    loading.value = false;
  }
}

async function remove(id: string) {
  if (!confirm('Delete this scenario?')) return;
  await api.deleteScenario(id);
  await refresh();
}

onMounted(refresh);
</script>

<template>
  <section class="mx-auto max-w-7xl px-6 py-10">
    <header class="flex items-end justify-between mb-6">
      <div>
        <h1 class="text-2xl font-semibold">Your Scenarios</h1>
        <p class="text-sm text-ink-muted mt-1">
          Saved investment analyses for this workspace. Start a new one or open an existing scenario.
        </p>
      </div>
      <RouterLink to="/scenario/new" class="btn btn-primary">+ New Scenario</RouterLink>
    </header>

    <div v-if="loading" class="text-ink-muted">Loading…</div>
    <div v-else-if="items.length === 0" class="card text-center text-ink-muted">
      No scenarios yet — create your first one.
    </div>
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div v-for="s in items" :key="s.id" class="card flex flex-col">
        <div class="flex items-start justify-between gap-3">
          <div>
            <h2 class="font-semibold">{{ s.name }}</h2>
            <p v-if="s.address" class="text-xs text-ink-muted">{{ s.address }}</p>
          </div>
          <button class="text-xs text-red-600 hover:underline" @click="remove(s.id)">Delete</button>
        </div>
        <dl class="mt-4 grid grid-cols-2 gap-2 text-sm">
          <dt class="text-ink-muted">Price</dt>
          <dd class="text-right">{{ money(s.totalPurchasePrice, s.currency) }}</dd>
          <dt class="text-ink-muted">Holding</dt>
          <dd class="text-right">{{ s.holdingPeriodYears }} years</dd>
        </dl>
        <div class="mt-auto pt-4 flex gap-2">
          <RouterLink :to="`/scenario/${s.id}/summary`" class="btn flex-1">Summary</RouterLink>
          <RouterLink :to="`/scenario/${s.id}/inputs`" class="btn flex-1">Edit</RouterLink>
        </div>
      </div>
    </div>
  </section>
</template>

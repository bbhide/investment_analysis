<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { useRoute, RouterView } from 'vue-router';
import { useScenarioStore } from '../stores/scenario';
import { api } from '../lib/api';

const route = useRoute();
const store = useScenarioStore();
const sharing = ref(false);

async function load(id: string) {
  const s = await api.getScenario(id);
  store.hydrate(s);
  await store.recompute();
}

async function share() {
  if (!store.id) return;
  sharing.value = true;
  try {
    const { shareToken } = await api.share(store.id);
    store.shareToken = shareToken;
    const url = `${location.origin}/shared/${shareToken}`;
    await navigator.clipboard.writeText(url).catch(() => {});
    alert(`Share link copied to clipboard:\n${url}`);
  } finally {
    sharing.value = false;
  }
}

async function unshare() {
  if (!store.id) return;
  await api.unshare(store.id);
  store.shareToken = null;
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
  <div class="mx-auto max-w-7xl px-6 py-6">
    <header class="mb-4 flex items-center gap-3">
      <input v-model="store.name" class="text-xl font-semibold bg-transparent border-b border-transparent
                                          focus:border-slate-300 focus:outline-none px-1" />
      <span v-if="store.calculating" class="text-xs text-ink-muted">Recalculating…</span>
      <div class="ml-auto flex items-center gap-2">
        <button v-if="!store.shareToken" class="btn text-xs" :disabled="sharing" @click="share">
          {{ sharing ? 'Creating…' : 'Share link' }}
        </button>
        <template v-else>
          <span class="text-xs text-ink-muted">Public link active</span>
          <button class="btn btn-danger text-xs" @click="unshare">Revoke</button>
        </template>
      </div>
    </header>
    <RouterView />
  </div>
</template>

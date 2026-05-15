<script setup lang="ts">
import { RouterLink, useRoute, useRouter } from 'vue-router';
import { computed, ref } from 'vue';
import { useScenarioStore } from '../stores/scenario';
import { useAuthStore } from '../stores/auth';
import { SUPPORTED_CURRENCIES } from '@inv/shared';

const route = useRoute();
const router = useRouter();
const store = useScenarioStore();
const auth = useAuthStore();
const inScenario = computed(() => typeof route.params.id === 'string');

const menuOpen = ref(false);

async function logout() {
  await auth.logout();
  menuOpen.value = false;
  void router.push({ name: 'login' });
}

const navLinks = computed(() => {
  if (!inScenario.value) return [];
  const id = String(route.params.id);
  return [
    { to: `/scenario/${id}/inputs`, label: 'Inputs' },
    { to: `/scenario/${id}/summary`, label: 'Summary' },
    { to: `/scenario/${id}/mortgage`, label: 'Mortgage' },
    { to: `/scenario/${id}/forecast`, label: 'Forecast' },
    { to: `/scenario/${id}/comparables`, label: 'Comparables' },
  ];
});
</script>

<template>
  <header class="border-b border-slate-200 bg-white sticky top-0 z-30">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 py-2.5 flex items-center gap-3">
      <RouterLink to="/" class="flex items-center gap-2 font-semibold shrink-0" @click="menuOpen = false">
        <span class="inline-block h-7 w-7 rounded-md bg-brown-100 text-ink grid place-items-center text-sm">RE</span>
        <span class="hidden sm:inline">Investment Analysis</span>
      </RouterLink>

      <!-- Desktop nav -->
      <nav v-if="inScenario" class="hidden md:flex items-center gap-1 text-sm">
        <RouterLink
          v-for="link in navLinks"
          :key="link.to"
          :to="link.to"
          class="px-3 py-1.5 rounded-md hover:bg-slate-100"
          active-class="bg-slate-100 font-medium"
        >{{ link.label }}</RouterLink>
      </nav>

      <div class="ml-auto flex items-center gap-2 text-sm">
        <span v-if="inScenario && store.dirty" class="text-xs text-amber-600 hidden sm:inline">Saving…</span>
        <span v-else-if="inScenario && store.id && !store.dirty" class="text-xs text-slate-400 hidden sm:inline">Saved</span>

        <select
          v-if="inScenario"
          v-model="store.currency"
          class="rounded-md border border-slate-200 px-2 py-1 text-sm"
          aria-label="Currency"
        >
          <option v-for="c in SUPPORTED_CURRENCIES" :key="c" :value="c">{{ c }}</option>
        </select>

        <RouterLink to="/scenario/new" class="btn btn-primary hidden sm:inline-flex">New Scenario</RouterLink>
        <button class="btn text-xs hidden sm:inline-flex" @click="logout">Logout</button>

        <!-- Mobile menu toggle -->
        <button
          class="md:hidden inline-flex items-center justify-center w-9 h-9 rounded-md border border-slate-200 hover:bg-slate-100"
          aria-label="Menu"
          :aria-expanded="menuOpen"
          @click="menuOpen = !menuOpen"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path v-if="!menuOpen" d="M3 6h18M3 12h18M3 18h18" />
            <path v-else d="M6 6l12 12M18 6l-12 12" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Mobile drawer -->
    <Transition name="drawer">
      <div v-if="menuOpen" class="md:hidden border-t border-slate-200 bg-white">
        <div class="mx-auto max-w-7xl px-4 py-3 flex flex-col gap-1">
          <RouterLink
            v-for="link in navLinks"
            :key="link.to"
            :to="link.to"
            class="px-3 py-2 rounded-md text-sm hover:bg-slate-100"
            active-class="bg-slate-100 font-medium"
            @click="menuOpen = false"
          >{{ link.label }}</RouterLink>
          <div class="border-t border-slate-200 my-2"></div>
          <RouterLink
            to="/scenario/new"
            class="btn btn-primary w-full"
            @click="menuOpen = false"
          >+ New Scenario</RouterLink>
          <button class="btn w-full" @click="logout">Logout</button>
        </div>
      </div>
    </Transition>
  </header>
</template>

<style scoped>
.drawer-enter-active,
.drawer-leave-active { transition: max-height 0.2s ease, opacity 0.2s ease; overflow: hidden; }
.drawer-enter-from,
.drawer-leave-to { max-height: 0; opacity: 0; }
.drawer-enter-to,
.drawer-leave-from { max-height: 30rem; opacity: 1; }
</style>

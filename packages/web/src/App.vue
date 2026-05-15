<script setup lang="ts">
import { computed } from 'vue';
import { RouterView, useRoute } from 'vue-router';
import AppHeader from './components/AppHeader.vue';

const route = useRoute();
const fullPage = computed(() => Boolean(route.meta?.fullPage));
</script>

<template>
  <!-- Routes with meta.fullPage (e.g. /report) skip the app chrome so they print cleanly -->
  <RouterView v-if="fullPage" />
  <div v-else class="min-h-screen flex flex-col">
    <AppHeader />
    <main class="flex-1">
      <RouterView />
    </main>
    <footer class="border-t border-slate-200 py-4 text-center text-xs text-ink-muted">
      This tool built by Bhavesh Bhide <a href="mailto:bhavesh.bhide@gmail.com">bhavesh.bhide@gmail.com</a>
    </footer>
  </div>
</template>

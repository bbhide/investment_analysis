<script setup lang="ts">
import { RouterView } from 'vue-router';
import AppHeader from './components/AppHeader.vue';
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <AppHeader />
    <main class="flex-1">
      <RouterView />
    </main>
    <footer class="border-t border-slate-200 py-4 text-center text-xs text-ink-muted">
      Built from Kudrat's Investment Analysis spreadsheet · All math runs server-side via @inv/calc
    </footer>
  </div>
</template>

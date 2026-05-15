<script setup lang="ts">
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();

const password = ref('');
const submitting = ref(false);
const error = ref<string | null>(null);

async function submit() {
  if (!password.value) return;
  submitting.value = true;
  error.value = null;
  const r = await auth.login(password.value);
  submitting.value = false;
  if (r.ok) {
    const next = typeof route.query.next === 'string' && route.query.next.startsWith('/')
      ? route.query.next
      : '/';
    void router.replace(next);
  } else {
    error.value = r.error;
    password.value = '';
  }
}
</script>

<template>
  <section class="min-h-screen flex items-center justify-center bg-slate-50 px-6">
    <div class="w-full max-w-sm">
      <div class="flex items-center gap-2 mb-6 justify-center">
        <span class="inline-block h-8 w-8 rounded-md bg-brown-100 text-ink grid place-items-center text-sm font-semibold">RE</span>
        <span class="font-semibold text-lg">Investment Analysis</span>
      </div>

      <form class="card space-y-4" @submit.prevent="submit">
        <div>
          <label class="block text-sm font-medium mb-1">Password</label>
          <input
            type="password"
            class="input-cell"
            v-model="password"
            autocomplete="current-password"
            autofocus
            :disabled="submitting"
          />
        </div>
        <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
        <button class="btn btn-primary w-full" type="submit" :disabled="submitting || !password">
          {{ submitting ? 'Signing in…' : 'Sign in' }}
        </button>
        <p class="text-xs text-ink-muted text-center">
          Shared scenario links don't require a password — only the analysis app does.
        </p>
      </form>
    </div>
  </section>
</template>

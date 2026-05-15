<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { api } from '../lib/api';
import { defaultInputs, defaultComparables } from '../lib/defaults';
import { SUPPORTED_CURRENCIES } from '@inv/shared';

const router = useRouter();
const name = ref('My First Scenario');
const address = ref('');
const currency = ref('AED');
const submitting = ref(false);
const error = ref<string | null>(null);

async function create() {
  submitting.value = true;
  error.value = null;
  try {
    const inputs = defaultInputs();
    inputs.property.address = address.value;
    const created = await api.createScenario({
      name: name.value,
      currency: currency.value,
      inputs,
      comparables: defaultComparables(),
    });
    router.replace({ name: 'scenario-inputs', params: { id: created.id } });
  } catch (e) {
    error.value = (e as Error).message;
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <section class="mx-auto max-w-xl px-6 py-10">
    <h1 class="text-2xl font-semibold mb-6">New Scenario</h1>
    <form class="card space-y-4" @submit.prevent="create">
      <div>
        <label class="block text-sm font-medium mb-1">Scenario Name</label>
        <input class="input-cell" v-model="name" required />
      </div>
      <div>
        <label class="block text-sm font-medium mb-1">Property Address (optional)</label>
        <input class="input-cell" v-model="address" placeholder="e.g. The Lofts, Downtown" />
      </div>
      <div>
        <label class="block text-sm font-medium mb-1">Currency</label>
        <select v-model="currency" class="input-cell">
          <option v-for="c in SUPPORTED_CURRENCIES" :key="c" :value="c">{{ c }}</option>
        </select>
      </div>
      <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
      <div class="flex justify-end gap-2 pt-2">
        <RouterLink to="/" class="btn">Cancel</RouterLink>
        <button class="btn btn-primary" :disabled="submitting">{{ submitting ? 'Creating…' : 'Create' }}</button>
      </div>
    </form>
  </section>
</template>

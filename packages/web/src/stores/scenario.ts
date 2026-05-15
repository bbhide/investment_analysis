import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import { useDebounceFn } from '@vueuse/core';
import type { Inputs, Comparables, Scenario } from '@inv/shared';
import type { CalcResult, ComparablesAnalysis } from '@inv/calc';
import { api } from '../lib/api';
import { setCurrency } from '../lib/format';
import { defaultInputs, defaultComparables } from '../lib/defaults';

export const useScenarioStore = defineStore('scenario', () => {
  const id = ref<string | null>(null);
  const name = ref<string>('Untitled Scenario');
  const currency = ref<string>('AED');
  const inputs = ref<Inputs>(defaultInputs());
  const comparables = ref<Comparables>(defaultComparables());
  const shareToken = ref<string | null>(null);
  const result = ref<CalcResult | null>(null);
  const comparablesAnalysis = ref<ComparablesAnalysis | null>(null);
  const calculating = ref(false);
  const saving = ref(false);
  const lastError = ref<string | null>(null);
  const dirty = ref(false);

  const summary = computed(() => result.value?.summary ?? null);

  function hydrate(s: Scenario | { id: string; name: string; currency: string; inputs: Inputs; comparables: Comparables | null; shareToken?: string | null }) {
    id.value = s.id;
    name.value = s.name;
    currency.value = s.currency;
    setCurrency(s.currency);
    inputs.value = s.inputs;
    comparables.value = s.comparables ?? defaultComparables();
    shareToken.value = ('shareToken' in s ? s.shareToken : null) ?? null;
    dirty.value = false;
  }

  function reset() {
    id.value = null;
    name.value = 'Untitled Scenario';
    currency.value = 'AED';
    setCurrency('AED');
    inputs.value = defaultInputs();
    comparables.value = defaultComparables();
    shareToken.value = null;
    result.value = null;
    comparablesAnalysis.value = null;
    dirty.value = false;
  }

  async function recompute() {
    calculating.value = true;
    lastError.value = null;
    try {
      const r = await api.calculate(inputs.value, comparables.value);
      result.value = r.result;
      comparablesAnalysis.value = r.comparablesAnalysis;
    } catch (e) {
      lastError.value = (e as Error).message;
    } finally {
      calculating.value = false;
    }
  }

  const debouncedRecompute = useDebounceFn(recompute, 300);

  async function save() {
    if (!id.value) return;
    saving.value = true;
    try {
      await api.updateScenario(id.value, {
        name: name.value,
        currency: currency.value,
        inputs: inputs.value,
        comparables: comparables.value,
      });
      dirty.value = false;
    } finally {
      saving.value = false;
    }
  }

  const debouncedSave = useDebounceFn(save, 1500);

  // Autosave + recompute on any input change
  watch(
    [inputs, comparables, name, currency],
    () => {
      dirty.value = true;
      void debouncedRecompute();
      if (id.value) void debouncedSave();
    },
    { deep: true },
  );

  watch(currency, (c) => setCurrency(c));

  return {
    id,
    name,
    currency,
    inputs,
    comparables,
    shareToken,
    result,
    comparablesAnalysis,
    summary,
    calculating,
    saving,
    lastError,
    dirty,
    hydrate,
    reset,
    recompute,
    save,
  };
});

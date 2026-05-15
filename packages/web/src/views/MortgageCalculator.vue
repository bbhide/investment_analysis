<script setup lang="ts">
import { computed, ref } from 'vue';
import { useScenarioStore } from '../stores/scenario';
import { money } from '../lib/format';
import AmortizationChart from '../components/charts/AmortizationChart.vue';
import { buildPISchedule, buildIOSchedule, annualizeSchedule, feeToMonthly } from '@inv/calc';

const store = useScenarioStore();
const loanType = ref<'pi' | 'io'>('pi');
const view = ref<'month' | 'year'>('year');

const schedule = computed(() => {
  if (!store.result) return [];
  return loanType.value === 'pi' ? store.result.amortization.pi : store.result.amortization.io;
});
const annual = computed(() => annualizeSchedule(schedule.value));
const totals = computed(() => ({
  payment: schedule.value.reduce((s, r) => s + r.payment, 0),
  principal: schedule.value.reduce((s, r) => s + r.principal, 0),
  interest: schedule.value.reduce((s, r) => s + r.interest, 0),
}));

// === 2-loan comparison ===
const compA = ref({ rate: 0.045, years: 30, fees: 0 });
const compB = ref({ rate: 0.05, years: 25, fees: 0 });
const principalForCompare = computed(() => store.result?.derived.principalAmount ?? 0);

const compAResult = computed(() => {
  if (principalForCompare.value === 0) return null;
  const sched = buildPISchedule(principalForCompare.value, compA.value.rate, compA.value.years, feeToMonthly(compA.value.fees, 'annum'));
  return {
    monthlyPayment: sched[0]?.payment ?? 0,
    totalPayment: sched.reduce((s, r) => s + r.payment, 0),
    totalInterest: sched.reduce((s, r) => s + r.interest, 0),
  };
});
const compBResult = computed(() => {
  if (principalForCompare.value === 0) return null;
  const sched = buildPISchedule(principalForCompare.value, compB.value.rate, compB.value.years, feeToMonthly(compB.value.fees, 'annum'));
  return {
    monthlyPayment: sched[0]?.payment ?? 0,
    totalPayment: sched.reduce((s, r) => s + r.payment, 0),
    totalInterest: sched.reduce((s, r) => s + r.interest, 0),
  };
});

// keep the unused buildIOSchedule reachable so tree-shaking doesn't remove the import
void buildIOSchedule;
</script>

<template>
  <div v-if="store.result" class="space-y-6">
    <header class="flex flex-wrap items-end justify-between gap-3">
      <h2 class="text-lg font-semibold">Mortgage Calculator</h2>
      <div class="flex gap-2">
        <div class="inline-flex rounded-md border border-slate-200 p-1 bg-white">
          <button :class="['px-3 py-1 text-sm rounded', loanType === 'pi' ? 'bg-ink text-white' : 'text-ink-muted']"
            @click="loanType = 'pi'">P&amp;I</button>
          <button :class="['px-3 py-1 text-sm rounded', loanType === 'io' ? 'bg-ink text-white' : 'text-ink-muted']"
            @click="loanType = 'io'">Interest Only</button>
        </div>
        <div class="inline-flex rounded-md border border-slate-200 p-1 bg-white">
          <button :class="['px-3 py-1 text-sm rounded', view === 'month' ? 'bg-ink text-white' : 'text-ink-muted']"
            @click="view = 'month'">Monthly</button>
          <button :class="['px-3 py-1 text-sm rounded', view === 'year' ? 'bg-ink text-white' : 'text-ink-muted']"
            @click="view = 'year'">Yearly</button>
        </div>
      </div>
    </header>

    <section class="grid grid-cols-1 md:grid-cols-3 gap-3">
      <div class="kpi"><div class="kpi-label">Total Payment</div><div class="kpi-value">{{ money(totals.payment) }}</div></div>
      <div class="kpi"><div class="kpi-label">Total Principal</div><div class="kpi-value">{{ money(totals.principal) }}</div></div>
      <div class="kpi"><div class="kpi-label">Total Interest + Fees</div><div class="kpi-value">{{ money(totals.interest) }}</div></div>
    </section>

    <div class="card">
      <h3 class="section-title">Yearly Breakdown</h3>
      <AmortizationChart :rows="annual" />
    </div>

    <div class="card overflow-x-auto">
      <table class="table-default">
        <thead>
          <tr>
            <th>{{ view === 'month' ? 'Month' : 'Year' }}</th>
            <th class="text-right">Payment</th>
            <th class="text-right">Principal</th>
            <th class="text-right">Interest + Fees</th>
            <th class="text-right">Balance</th>
          </tr>
        </thead>
        <tbody>
          <template v-if="view === 'year'">
            <tr v-for="r in annual" :key="r.year">
              <td>{{ r.year }}</td>
              <td class="text-right">{{ money(r.payment) }}</td>
              <td class="text-right">{{ money(r.principal) }}</td>
              <td class="text-right">{{ money(r.interest) }}</td>
              <td class="text-right">{{ money(r.balance) }}</td>
            </tr>
          </template>
          <template v-else>
            <tr v-for="r in schedule" :key="r.month">
              <td>{{ r.month }}</td>
              <td class="text-right">{{ money(r.payment) }}</td>
              <td class="text-right">{{ money(r.principal) }}</td>
              <td class="text-right">{{ money(r.interest) }}</td>
              <td class="text-right">{{ money(r.balance) }}</td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>

    <section class="card">
      <h3 class="section-title">Compare Two Financing Scenarios</h3>
      <p class="text-xs text-ink-muted mb-3">Both compared against the current scenario's principal amount ({{ money(principalForCompare) }}).</p>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="space-y-2">
          <h4 class="font-medium">Option A</h4>
          <label class="block text-sm"><span class="text-ink-muted">Rate</span>
            <input class="input-cell mt-1" type="number" step="0.0001" v-model.number="compA.rate" /></label>
          <label class="block text-sm"><span class="text-ink-muted">Years</span>
            <input class="input-cell mt-1" type="number" v-model.number="compA.years" /></label>
          <label class="block text-sm"><span class="text-ink-muted">Annual Fees</span>
            <input class="input-cell mt-1" type="number" v-model.number="compA.fees" /></label>
          <div v-if="compAResult" class="mt-3 text-sm space-y-1">
            <div>Monthly Payment: <strong>{{ money(compAResult.monthlyPayment) }}</strong></div>
            <div>Total Payment: <strong>{{ money(compAResult.totalPayment) }}</strong></div>
            <div>Total Interest + Fees: <strong>{{ money(compAResult.totalInterest) }}</strong></div>
          </div>
        </div>
        <div class="space-y-2">
          <h4 class="font-medium">Option B</h4>
          <label class="block text-sm"><span class="text-ink-muted">Rate</span>
            <input class="input-cell mt-1" type="number" step="0.0001" v-model.number="compB.rate" /></label>
          <label class="block text-sm"><span class="text-ink-muted">Years</span>
            <input class="input-cell mt-1" type="number" v-model.number="compB.years" /></label>
          <label class="block text-sm"><span class="text-ink-muted">Annual Fees</span>
            <input class="input-cell mt-1" type="number" v-model.number="compB.fees" /></label>
          <div v-if="compBResult" class="mt-3 text-sm space-y-1">
            <div>Monthly Payment: <strong>{{ money(compBResult.monthlyPayment) }}</strong></div>
            <div>Total Payment: <strong>{{ money(compBResult.totalPayment) }}</strong></div>
            <div>Total Interest + Fees: <strong>{{ money(compBResult.totalInterest) }}</strong></div>
          </div>
        </div>
      </div>
    </section>
  </div>
  <div v-else class="text-ink-muted">Computing…</div>
</template>

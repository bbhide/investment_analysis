<script setup lang="ts">
import { computed, ref } from 'vue';
import { useScenarioStore } from '../stores/scenario';
import { money } from '../lib/format';
import CashFlowChart from '../components/charts/CashFlowChart.vue';
import EquityChart from '../components/charts/EquityChart.vue';

const store = useScenarioStore();
const loanType = ref<'pi' | 'io'>('pi');
const period = ref<'month' | 'year'>('year');

const yearly = computed(() => store.result?.forecastYearly[loanType.value] ?? []);
const monthly = computed(() => store.result?.forecastMonthly[loanType.value] ?? []);
</script>

<template>
  <div v-if="store.result" class="space-y-6">
    <header class="flex flex-wrap items-end justify-between gap-3">
      <h2 class="text-lg font-semibold">Forecast</h2>
      <div class="flex gap-2">
        <div class="inline-flex rounded-md border border-slate-200 p-1 bg-white">
          <button :class="['px-3 py-1 text-sm rounded', loanType === 'pi' ? 'bg-ink text-white' : 'text-ink-muted']"
            @click="loanType = 'pi'">P&amp;I</button>
          <button :class="['px-3 py-1 text-sm rounded', loanType === 'io' ? 'bg-ink text-white' : 'text-ink-muted']"
            @click="loanType = 'io'">Interest Only</button>
        </div>
        <div class="inline-flex rounded-md border border-slate-200 p-1 bg-white">
          <button :class="['px-3 py-1 text-sm rounded', period === 'month' ? 'bg-ink text-white' : 'text-ink-muted']"
            @click="period = 'month'">Monthly</button>
          <button :class="['px-3 py-1 text-sm rounded', period === 'year' ? 'bg-ink text-white' : 'text-ink-muted']"
            @click="period = 'year'">Yearly</button>
        </div>
      </div>
    </header>

    <section class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="card">
        <h3 class="section-title">Cumulative Cash Flow</h3>
        <CashFlowChart :rows="yearly" />
      </div>
      <div class="card">
        <h3 class="section-title">Property Value vs Equity</h3>
        <EquityChart :rows="yearly" />
      </div>
    </section>

    <div class="card overflow-x-auto">
      <table class="table-default whitespace-nowrap">
        <thead>
          <tr>
            <th>{{ period === 'month' ? 'Month' : 'Year' }}</th>
            <th class="text-right">Property Value</th>
            <th class="text-right">Equity</th>
            <th class="text-right">Rent</th>
            <th class="text-right">Ongoing Costs</th>
            <th class="text-right">Loan Repayment</th>
            <th class="text-right">Before-Tax CF</th>
            <th class="text-right">After-Tax CF</th>
            <th class="text-right">Cumulative ATCF</th>
            <th class="text-right">Gross Profit if Sold</th>
            <th class="text-right">Net Profit if Sold</th>
          </tr>
        </thead>
        <tbody>
          <template v-if="period === 'year'">
            <tr v-for="r in yearly" :key="r.year">
              <td>{{ r.year }}</td>
              <td class="text-right">{{ money(r.propertyValue) }}</td>
              <td class="text-right">{{ money(r.equity) }}</td>
              <td class="text-right">{{ money(r.rent) }}</td>
              <td class="text-right">{{ money(r.totalOngoingCosts) }}</td>
              <td class="text-right">{{ money(r.loanRepayment) }}</td>
              <td class="text-right">{{ money(r.beforeTaxCashFlow) }}</td>
              <td class="text-right">{{ money(r.afterTaxCashFlow) }}</td>
              <td class="text-right">{{ money(r.cumulativeAfterTaxCashFlow) }}</td>
              <td class="text-right">{{ money(r.grossProfitIfSold) }}</td>
              <td class="text-right">{{ money(r.netProfitIfSold) }}</td>
            </tr>
          </template>
          <template v-else>
            <tr v-for="r in monthly" :key="r.month">
              <td>{{ r.month }}</td>
              <td class="text-right">{{ money(r.propertyValue) }}</td>
              <td class="text-right">{{ money(r.equity) }}</td>
              <td class="text-right">{{ money(r.rent) }}</td>
              <td class="text-right">{{ money(r.totalOngoingCosts) }}</td>
              <td class="text-right">{{ money(r.loanRepayment) }}</td>
              <td class="text-right">{{ money(r.beforeTaxCashFlow) }}</td>
              <td class="text-right">{{ money(r.afterTaxCashFlow) }}</td>
              <td class="text-right">{{ money(r.cumulativeAfterTaxCashFlow) }}</td>
              <td class="text-right">{{ money(r.grossProfitIfSold) }}</td>
              <td class="text-right">{{ money(r.netProfitIfSold) }}</td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>
  </div>
  <div v-else class="text-ink-muted">Computing…</div>
</template>

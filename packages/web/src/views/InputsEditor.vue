<script setup lang="ts">
import { computed } from 'vue';
import { useScenarioStore } from '../stores/scenario';
import MoneyInput from '../components/inputs/MoneyInput.vue';
import PercentInput from '../components/inputs/PercentInput.vue';
import PeriodSelect from '../components/inputs/PeriodSelect.vue';
import CostLineTable from '../components/inputs/CostLineTable.vue';
import OngoingCostTable from '../components/inputs/OngoingCostTable.vue';
import { money, pct } from '../lib/format';

const store = useScenarioStore();
const inputs = computed(() => store.inputs);
const summary = computed(() => store.summary);
</script>

<template>
  <section class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <div class="lg:col-span-2 space-y-6">
      <div class="card">
        <h2 class="section-title">Key Information</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label class="block">
            <span class="text-sm font-medium">Address</span>
            <input class="input-cell mt-1" v-model="inputs.property.address" />
          </label>
          <label class="block">
            <span class="text-sm font-medium">Total Purchase Price</span>
            <MoneyInput class="mt-1" v-model="inputs.property.totalPurchasePrice" />
          </label>
          <label class="block">
            <span class="text-sm font-medium">Down Payment ({{ inputs.property.downPayment.mode === 'percent' ? '%' : 'amount' }})</span>
            <div class="mt-1 flex gap-2">
              <PercentInput v-if="inputs.property.downPayment.mode === 'percent'" v-model="inputs.property.downPayment.value" />
              <MoneyInput v-else v-model="inputs.property.downPayment.value" />
              <select v-model="inputs.property.downPayment.mode" class="input-cell w-32">
                <option value="percent">% of price</option>
                <option value="amount">amount</option>
              </select>
            </div>
          </label>
          <label class="block">
            <span class="text-sm font-medium">Yr 1 Market Value / ARV</span>
            <MoneyInput class="mt-1" v-model="inputs.property.yr1MarketValueARV" />
          </label>
          <label class="block">
            <span class="text-sm font-medium">Holding Period (years)</span>
            <MoneyInput class="mt-1" v-model="inputs.property.holdingPeriodYears" :min="1" />
          </label>
          <label class="block">
            <span class="text-sm font-medium">Annual Appreciation</span>
            <PercentInput class="mt-1" v-model="inputs.property.annualAppreciation" />
          </label>
          <label class="block">
            <span class="text-sm font-medium">Rental Income</span>
            <div class="mt-1 flex gap-2">
              <MoneyInput v-model="inputs.income.rentalIncome.amount" />
              <PeriodSelect v-model="inputs.income.rentalIncome.period" class="w-40" />
            </div>
          </label>
          <label class="block">
            <span class="text-sm font-medium">Other Income</span>
            <div class="mt-1 flex gap-2">
              <MoneyInput v-model="inputs.income.otherIncome.amount" />
              <PeriodSelect v-model="inputs.income.otherIncome.period" class="w-40" />
            </div>
          </label>
          <label class="block">
            <span class="text-sm font-medium">Annual Rental Growth</span>
            <PercentInput class="mt-1" v-model="inputs.income.annualRentalGrowth" />
          </label>
        </div>
      </div>

      <div class="card">
        <h2 class="section-title">Mortgage Information</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="space-y-2">
            <div class="text-sm font-semibold">Principal &amp; Interest Loan (P&amp;I)</div>
            <label class="block"><span class="text-xs">Annual Interest Rate</span>
              <PercentInput class="mt-1" v-model="inputs.loan.pi.annualRate" /></label>
            <label class="block"><span class="text-xs">Duration (years)</span>
              <MoneyInput class="mt-1" v-model="inputs.loan.pi.durationYears" /></label>
            <label class="block"><span class="text-xs">Fees</span>
              <div class="mt-1 flex gap-2">
                <MoneyInput v-model="inputs.loan.pi.fees.amount" />
                <PeriodSelect v-model="inputs.loan.pi.fees.period" class="w-40" />
              </div>
            </label>
          </div>
          <div class="space-y-2">
            <div class="text-sm font-semibold">Interest-Only Loan (IO)</div>
            <label class="block"><span class="text-xs">Annual Interest Rate</span>
              <PercentInput class="mt-1" v-model="inputs.loan.io.annualRate" /></label>
            <label class="block"><span class="text-xs">Interest-Only Duration (years)</span>
              <MoneyInput class="mt-1" v-model="inputs.loan.io.ioDurationYears" /></label>
            <label class="block"><span class="text-xs">Standard Rate after IO</span>
              <PercentInput class="mt-1" v-model="inputs.loan.io.standardRateAfterIO" /></label>
            <label class="block"><span class="text-xs">Total Duration (years)</span>
              <MoneyInput class="mt-1" v-model="inputs.loan.io.totalDurationYears" /></label>
            <label class="block"><span class="text-xs">Fees</span>
              <div class="mt-1 flex gap-2">
                <MoneyInput v-model="inputs.loan.io.fees.amount" />
                <PeriodSelect v-model="inputs.loan.io.fees.period" class="w-40" />
              </div>
            </label>
          </div>
        </div>
      </div>

      <div class="card">
        <h2 class="section-title">Purchasing Costs</h2>
        <CostLineTable v-model="inputs.purchasingCosts" base-label="% of Purchase Price" :show-tax-deductible="true" />
      </div>

      <div class="card">
        <h2 class="section-title">Ongoing Fees / Costs</h2>
        <p class="text-xs text-ink-muted mb-2">Assumed tax-deductible and distributed across the year.</p>
        <OngoingCostTable v-model="inputs.ongoingCosts" />
      </div>

      <div class="card">
        <h2 class="section-title">Selling Fees / Costs</h2>
        <CostLineTable v-model="inputs.sellingCosts" base-label="% of Sale Price" />
      </div>

      <div class="card">
        <h2 class="section-title">Forecast Assumptions</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label class="block">
            <span class="text-sm font-medium">Annual Inflation</span>
            <PercentInput class="mt-1" v-model="inputs.forecast.annualInflation" />
          </label>
          <label class="block">
            <span class="text-sm font-medium">Tax Bracket</span>
            <PercentInput class="mt-1" v-model="inputs.forecast.taxBracket" />
          </label>
          <label class="block flex items-center gap-2">
            <input type="checkbox" v-model="inputs.forecast.considerDepreciation" />
            <span class="text-sm">Consider depreciation?</span>
          </label>
          <label v-if="inputs.forecast.considerDepreciation" class="block">
            <span class="text-sm font-medium">Depreciable Value</span>
            <div class="mt-1 flex gap-2">
              <PercentInput v-if="inputs.forecast.depreciableValue.mode === 'percent'" v-model="inputs.forecast.depreciableValue.value" />
              <MoneyInput v-else v-model="inputs.forecast.depreciableValue.value" />
              <select v-model="inputs.forecast.depreciableValue.mode" class="input-cell w-32">
                <option value="percent">% of ARV</option>
                <option value="amount">amount</option>
              </select>
            </div>
          </label>
          <label v-if="inputs.forecast.considerDepreciation" class="block">
            <span class="text-sm font-medium">Depreciated over (years)</span>
            <MoneyInput class="mt-1" v-model="inputs.forecast.depreciationYears" />
          </label>
        </div>
      </div>
    </div>

    <aside class="space-y-4 lg:sticky lg:top-6 self-start">
      <div class="card">
        <h3 class="section-title">Quick Summary</h3>
        <dl class="text-sm grid grid-cols-2 gap-y-1.5" v-if="summary">
          <dt class="text-ink-muted">Total Price</dt><dd class="text-right">{{ money(summary.keyInformation.totalPrice) }}</dd>
          <dt class="text-ink-muted">Down Payment</dt><dd class="text-right">{{ money(summary.keyInformation.downPaymentAmount) }} ({{ pct(summary.keyInformation.downPaymentPct, 1) }})</dd>
          <dt class="text-ink-muted">Principal</dt><dd class="text-right">{{ money(summary.keyInformation.principalAmount) }}</dd>
          <dt class="text-ink-muted">Estimated Sale Price</dt><dd class="text-right">{{ money(summary.keyInformation.estimatedSellingPrice) }}</dd>
          <dt class="text-ink-muted">Purchasing Costs (incl. DP)</dt><dd class="text-right">{{ money(summary.keyInformation.purchasingCostsRequired) }}</dd>
          <dt class="text-ink-muted">Selling Costs</dt><dd class="text-right">{{ money(summary.keyInformation.sellingCosts) }}</dd>
          <dt class="text-ink-muted" title="Annual rent ÷ total purchase price">Gross Rental Yield</dt>
          <dd class="text-right">{{ pct(summary.keyInformation.grossRentalYieldOnCost) }}</dd>
          <dt class="text-ink-muted">P&amp;I Monthly Payment</dt><dd class="text-right">{{ money(summary.mortgage.pi.monthlyPayment) }}</dd>
          <dt class="text-ink-muted">IO Monthly (in IO)</dt><dd class="text-right">{{ money(summary.mortgage.io.monthlyPaymentDuringIO) }}</dd>
          <dt class="text-ink-muted">IO Monthly (after IO)</dt><dd class="text-right">{{ money(summary.mortgage.io.monthlyPaymentAfterIO) }}</dd>
        </dl>
        <p v-else class="text-sm text-ink-muted">Computing…</p>
      </div>
      <div class="card text-sm space-y-1.5" v-if="summary">
        <h3 class="section-title">Year 1 P&amp;I Cash Flow</h3>
        <dl class="grid grid-cols-2 gap-y-1">
          <dt class="text-ink-muted">Cash-on-Cash</dt><dd class="text-right">{{ pct(summary.pi.year1.beforeTax.cashOnCashReturn) }}</dd>
          <dt class="text-ink-muted">Yield on Cost</dt><dd class="text-right">{{ pct(summary.pi.year1.beforeTax.yieldOnCost) }}</dd>
          <dt class="text-ink-muted">Yield on Value</dt><dd class="text-right">{{ pct(summary.pi.year1.beforeTax.yieldOnValue) }}</dd>
        </dl>
      </div>
    </aside>
  </section>
</template>

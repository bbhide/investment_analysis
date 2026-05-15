<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useScenarioStore } from '../stores/scenario';
import MoneyInput from '../components/inputs/MoneyInput.vue';
import PercentInput from '../components/inputs/PercentInput.vue';
import PeriodSelect from '../components/inputs/PeriodSelect.vue';
import CostLineTable from '../components/inputs/CostLineTable.vue';
import OngoingCostTable from '../components/inputs/OngoingCostTable.vue';
import { money, pct } from '../lib/format';

const router = useRouter();
const route = useRoute();
const store = useScenarioStore();
const inputs = computed(() => store.inputs);
const summary = computed(() => store.summary);

interface Step {
  id: string;
  title: string;
  short: string;
}

const steps: Step[] = [
  { id: 'property', title: 'Property & Income', short: 'Property' },
  { id: 'mortgage', title: 'Mortgage', short: 'Mortgage' },
  { id: 'costs',    title: 'Costs',            short: 'Costs' },
  { id: 'forecast', title: 'Forecast Assumptions', short: 'Forecast' },
];

const currentStep = ref(0);
const costsTab = ref<'purchasing' | 'ongoing' | 'selling'>('purchasing');

function next() {
  if (currentStep.value < steps.length - 1) {
    currentStep.value++;
    scrollToTop();
  } else {
    goToSummary();
  }
}
function back() {
  if (currentStep.value > 0) {
    currentStep.value--;
    scrollToTop();
  }
}
function jumpTo(idx: number) {
  currentStep.value = idx;
  scrollToTop();
}
function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
function goToSummary() {
  if (typeof route.params.id === 'string') {
    void router.push({ name: 'scenario-summary', params: { id: route.params.id } });
  }
}
</script>

<template>
  <section class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <div class="lg:col-span-2 space-y-4">
      <!-- Step indicator -->
      <nav class="wizard-steps card" aria-label="Progress">
        <ol class="wizard-step-list">
          <li
            v-for="(step, idx) in steps"
            :key="step.id"
            :class="[
              'wizard-step',
              idx === currentStep ? 'is-current' : '',
              idx < currentStep ? 'is-done' : '',
            ]"
          >
            <button type="button" class="wizard-step-btn" @click="jumpTo(idx)">
              <span class="wizard-step-num">{{ idx + 1 }}</span>
              <span class="wizard-step-title">{{ step.short }}</span>
            </button>
          </li>
        </ol>
        <div class="wizard-progress">
          <div class="wizard-progress-fill" :style="{ width: `${((currentStep + 1) / steps.length) * 100}%` }" />
        </div>
      </nav>

      <!-- =========================== STEP 1: Property & Income =========================== -->
      <div v-if="currentStep === 0" class="card">
        <h2 class="section-title">{{ steps[0]?.title }}</h2>
        <p class="text-xs text-ink-muted mb-4">The basics — what you're buying, what you'll earn, and how fast it appreciates.</p>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label class="block sm:col-span-2">
            <span class="text-sm font-medium">Address</span>
            <input class="input-cell mt-1" v-model="inputs.property.address" placeholder="e.g. The Lofts, Downtown" />
          </label>
          <label class="block">
            <span class="text-sm font-medium">Total Purchase Price</span>
            <MoneyInput class="mt-1" v-model="inputs.property.totalPurchasePrice" />
          </label>
          <label class="block">
            <span class="text-sm font-medium">Down Payment</span>
            <div class="mt-1 flex flex-col sm:flex-row gap-2">
              <PercentInput v-if="inputs.property.downPayment.mode === 'percent'" v-model="inputs.property.downPayment.value" />
              <MoneyInput v-else v-model="inputs.property.downPayment.value" />
              <select v-model="inputs.property.downPayment.mode" class="input-cell sm:w-32">
                <option value="percent">% of price</option>
                <option value="amount">amount</option>
              </select>
            </div>
          </label>
          <label class="block">
            <span class="text-sm font-medium">Yr 1 Market Value (ARV)</span>
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
            <div class="mt-1 flex flex-col sm:flex-row gap-2">
              <MoneyInput v-model="inputs.income.rentalIncome.amount" />
              <PeriodSelect v-model="inputs.income.rentalIncome.period" class="sm:w-40" />
            </div>
          </label>
          <label class="block">
            <span class="text-sm font-medium">Other Income</span>
            <div class="mt-1 flex flex-col sm:flex-row gap-2">
              <MoneyInput v-model="inputs.income.otherIncome.amount" />
              <PeriodSelect v-model="inputs.income.otherIncome.period" class="sm:w-40" />
            </div>
          </label>
          <label class="block">
            <span class="text-sm font-medium">Annual Rental Growth</span>
            <PercentInput class="mt-1" v-model="inputs.income.annualRentalGrowth" />
          </label>
        </div>
      </div>

      <!-- =========================== STEP 2: Mortgage =========================== -->
      <div v-else-if="currentStep === 1" class="card">
        <h2 class="section-title">{{ steps[1]?.title }}</h2>
        <p class="text-xs text-ink-muted mb-4">Both loan structures are computed so you can compare on the Summary tab.</p>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="space-y-2 rounded-lg border border-slate-200 p-4">
            <div class="text-sm font-semibold">Principal &amp; Interest Loan (P&amp;I)</div>
            <label class="block"><span class="text-xs">Annual Interest Rate</span>
              <PercentInput class="mt-1" v-model="inputs.loan.pi.annualRate" /></label>
            <label class="block"><span class="text-xs">Duration (years)</span>
              <MoneyInput class="mt-1" v-model="inputs.loan.pi.durationYears" /></label>
            <label class="block"><span class="text-xs">Fees</span>
              <div class="mt-1 flex flex-col sm:flex-row gap-2">
                <MoneyInput v-model="inputs.loan.pi.fees.amount" />
                <PeriodSelect v-model="inputs.loan.pi.fees.period" class="sm:w-40" />
              </div>
            </label>
          </div>
          <div class="space-y-2 rounded-lg border border-slate-200 p-4">
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
              <div class="mt-1 flex flex-col sm:flex-row gap-2">
                <MoneyInput v-model="inputs.loan.io.fees.amount" />
                <PeriodSelect v-model="inputs.loan.io.fees.period" class="sm:w-40" />
              </div>
            </label>
          </div>
        </div>
      </div>

      <!-- =========================== STEP 3: Costs =========================== -->
      <div v-else-if="currentStep === 2" class="card">
        <h2 class="section-title">{{ steps[2]?.title }}</h2>
        <p class="text-xs text-ink-muted mb-4">Money in (purchasing), money out monthly (ongoing), and money out at sale (selling).</p>

        <div class="costs-tabs">
          <button :class="['costs-tab', costsTab === 'purchasing' ? 'is-active' : '']" @click="costsTab = 'purchasing'">Purchasing</button>
          <button :class="['costs-tab', costsTab === 'ongoing' ? 'is-active' : '']" @click="costsTab = 'ongoing'">Ongoing</button>
          <button :class="['costs-tab', costsTab === 'selling' ? 'is-active' : '']" @click="costsTab = 'selling'">Selling</button>
        </div>

        <div v-show="costsTab === 'purchasing'">
          <p class="text-xs text-ink-muted mb-2">One-time costs at purchase (DLD, NOC, agent commission, etc.). Each line is either a % of price OR a fixed amount.</p>
          <CostLineTable v-model="inputs.purchasingCosts" base-label="% of Purchase Price" :show-tax-deductible="true" />
        </div>
        <div v-show="costsTab === 'ongoing'">
          <p class="text-xs text-ink-muted mb-2">Recurring costs — service charges, utilities, management fees, vacancy provisions. Each line is either a % of income OR a fixed amount per period.</p>
          <OngoingCostTable v-model="inputs.ongoingCosts" />
        </div>
        <div v-show="costsTab === 'selling'">
          <p class="text-xs text-ink-muted mb-2">Costs you'll pay when you eventually sell (agency commission, legal fees, contingencies).</p>
          <CostLineTable v-model="inputs.sellingCosts" base-label="% of Sale Price" />
        </div>
      </div>

      <!-- =========================== STEP 4: Forecast Assumptions =========================== -->
      <div v-else-if="currentStep === 3" class="card">
        <h2 class="section-title">{{ steps[3]?.title }}</h2>
        <p class="text-xs text-ink-muted mb-4">Macro assumptions that drive the year-by-year projection and tax treatment.</p>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label class="block">
            <span class="text-sm font-medium">Annual Inflation</span>
            <PercentInput class="mt-1" v-model="inputs.forecast.annualInflation" />
          </label>
          <label class="block">
            <span class="text-sm font-medium">Tax Bracket</span>
            <PercentInput class="mt-1" v-model="inputs.forecast.taxBracket" />
          </label>
          <label class="block sm:col-span-2 flex items-center gap-2">
            <input type="checkbox" v-model="inputs.forecast.considerDepreciation" />
            <span class="text-sm">Consider depreciation?</span>
          </label>
          <label v-if="inputs.forecast.considerDepreciation" class="block">
            <span class="text-sm font-medium">Depreciable Value</span>
            <div class="mt-1 flex flex-col sm:flex-row gap-2">
              <PercentInput v-if="inputs.forecast.depreciableValue.mode === 'percent'" v-model="inputs.forecast.depreciableValue.value" />
              <MoneyInput v-else v-model="inputs.forecast.depreciableValue.value" />
              <select v-model="inputs.forecast.depreciableValue.mode" class="input-cell sm:w-32">
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

      <!-- =========================== Nav buttons =========================== -->
      <div class="wizard-nav">
        <button class="btn" :disabled="currentStep === 0" @click="back">← Back</button>
        <span class="text-xs text-ink-muted hidden sm:inline">Step {{ currentStep + 1 }} of {{ steps.length }}</span>
        <div class="flex gap-2">
          <button v-if="currentStep < steps.length - 1" class="btn btn-primary" @click="next">Next →</button>
          <button v-else class="btn btn-primary" @click="goToSummary">View Analysis →</button>
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
          <dt class="text-ink-muted">Est. Sale Price</dt><dd class="text-right">{{ money(summary.keyInformation.estimatedSellingPrice) }}</dd>
          <dt class="text-ink-muted">Cash to Close</dt><dd class="text-right">{{ money(summary.keyInformation.purchasingCostsRequired) }}</dd>
          <dt class="text-ink-muted">Selling Costs</dt><dd class="text-right">{{ money(summary.keyInformation.sellingCosts) }}</dd>
          <dt class="text-ink-muted" title="Annual rent ÷ total purchase price">Gross Rental Yield</dt>
          <dd class="text-right">{{ pct(summary.keyInformation.grossRentalYieldOnCost) }}</dd>
          <dt class="text-ink-muted">P&amp;I Monthly</dt><dd class="text-right">{{ money(summary.mortgage.pi.monthlyPayment) }}</dd>
        </dl>
        <p v-else class="text-sm text-ink-muted">Computing…</p>
      </div>
      <div class="card text-sm space-y-1.5" v-if="summary">
        <h3 class="section-title">Year 1 P&amp;I (Before Tax)</h3>
        <dl class="grid grid-cols-2 gap-y-1">
          <dt class="text-ink-muted">Cash-on-Cash</dt><dd class="text-right">{{ pct(summary.pi.year1.beforeTax.cashOnCashReturn) }}</dd>
          <dt class="text-ink-muted">Yield on Cost</dt><dd class="text-right">{{ pct(summary.pi.year1.beforeTax.yieldOnCost) }}</dd>
          <dt class="text-ink-muted">Yield on Value</dt><dd class="text-right">{{ pct(summary.pi.year1.beforeTax.yieldOnValue) }}</dd>
        </dl>
      </div>
    </aside>
  </section>
</template>

<style scoped>
.wizard-steps { padding: 1rem; }
.wizard-step-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.25rem;
}
.wizard-step-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.4rem 0.5rem;
  border: none;
  background: transparent;
  border-radius: 0.4rem;
  cursor: pointer;
  font-size: 0.85rem;
  text-align: left;
  color: #64748b;
}
.wizard-step-btn:hover { background: #f1f5f9; }
.wizard-step-num {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 50%;
  background: #e2e8f0;
  color: #64748b;
  font-size: 0.75rem;
  font-weight: 600;
  flex-shrink: 0;
}
.wizard-step.is-current .wizard-step-btn { color: #0f172a; font-weight: 600; }
.wizard-step.is-current .wizard-step-num { background: #0f172a; color: white; }
.wizard-step.is-done .wizard-step-num { background: #ecd0a3; color: #0f172a; }
.wizard-step-title {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.wizard-progress {
  height: 3px;
  background: #e2e8f0;
  border-radius: 999px;
  overflow: hidden;
  margin-top: 0.75rem;
}
.wizard-progress-fill {
  height: 100%;
  background: #0f172a;
  transition: width 0.25s ease;
}

.wizard-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.5rem 0.25rem;
  position: sticky;
  bottom: 0;
  background: rgb(248 250 252 / 0.95);
  backdrop-filter: blur(6px);
  border-top: 1px solid #e2e8f0;
  margin-top: 0.5rem;
  padding: 0.75rem 0.25rem;
  z-index: 10;
}

.costs-tabs {
  display: flex;
  border-bottom: 1px solid #e2e8f0;
  margin-bottom: 1rem;
  gap: 0.25rem;
}
.costs-tab {
  border: none;
  background: transparent;
  padding: 0.55rem 0.9rem;
  font-size: 0.85rem;
  color: #64748b;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
}
.costs-tab.is-active {
  color: #0f172a;
  font-weight: 600;
  border-bottom-color: #0f172a;
}

/* Mobile: step list becomes compact icons + only show current step's title */
@media (max-width: 640px) {
  .wizard-step-title { display: none; }
  .wizard-step.is-current .wizard-step-title {
    display: inline-block;
  }
  .wizard-step-list {
    grid-template-columns: repeat(4, auto) 1fr;
    align-items: center;
  }
}
</style>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';
import { useScenarioStore } from '../stores/scenario';
import { api } from '../lib/api';
import { money, pct } from '../lib/format';
import CashFlowChart from '../components/charts/CashFlowChart.vue';
import EquityChart from '../components/charts/EquityChart.vue';
import ShareReportModal from '../components/ShareReportModal.vue';

const route = useRoute();
const store = useScenarioStore();
const loanType = ref<'pi' | 'io'>('pi');
const summary = computed(() => store.summary);
const track = computed(() => (summary.value ? summary.value[loanType.value] : null));
const ki = computed(() => summary.value?.keyInformation);

function exportPdf() {
  // Open the report view in a new tab with ?print=1 so it auto-triggers
  // the browser's "Save as PDF" dialog once the report has rendered.
  const id = route.params.id;
  if (typeof id !== 'string') return;
  window.open(`/scenario/${id}/report?print=1`, '_blank', 'noopener');
}

const sharingReport = ref(false);
const shareModalOpen = ref(false);
const shareUrl = computed(() =>
  store.shareToken ? `${location.origin}/shared/${store.shareToken}/report` : '',
);

async function openShareModal() {
  if (!store.id) return;
  sharingReport.value = true;
  try {
    if (!store.shareToken) {
      const { shareToken } = await api.share(store.id);
      store.shareToken = shareToken;
    }
    shareModalOpen.value = true;
  } finally {
    sharingReport.value = false;
  }
}

async function revokeShare() {
  if (!store.id) return;
  await api.unshare(store.id);
  store.shareToken = null;
  shareModalOpen.value = false;
}
</script>

<template>
  <div v-if="summary && track && ki" class="space-y-6">
    <header class="space-y-3">
      <div class="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 class="text-lg font-semibold">Analysis Summary</h2>
          <p class="text-sm text-ink-muted">{{ ki.address || 'No address' }} · Holding {{ ki.holdingPeriodYears }} years</p>
        </div>
        <div class="inline-flex rounded-md border border-slate-200 p-1 bg-white">
          <button :class="['px-3 py-1 text-sm rounded', loanType === 'pi' ? 'bg-ink text-white' : 'text-ink-muted']"
            @click="loanType = 'pi'">P&amp;I</button>
          <button :class="['px-3 py-1 text-sm rounded', loanType === 'io' ? 'bg-ink text-white' : 'text-ink-muted']"
            @click="loanType = 'io'">Interest Only</button>
        </div>
      </div>
      <div class="flex flex-wrap gap-2">
        <button class="btn flex-1 sm:flex-none" :disabled="sharingReport" @click="openShareModal">
          {{ sharingReport ? 'Creating link…' : 'Share report link' }}
        </button>
        <button class="btn btn-primary flex-1 sm:flex-none" @click="exportPdf">Export PDF</button>
      </div>
    </header>

    <ShareReportModal
      :open="shareModalOpen"
      :url="shareUrl"
      @close="shareModalOpen = false"
      @revoke="revokeShare"
    />

    <section class="grid grid-cols-2 md:grid-cols-4 gap-3">
      <div class="kpi"><div class="kpi-label">Property Value (Yr {{ ki.holdingPeriodYears }})</div><div class="kpi-value">{{ money(track.endOfHolding.propertyValue) }}</div></div>
      <div class="kpi"><div class="kpi-label">Estimated Equity</div><div class="kpi-value">{{ money(track.endOfHolding.equity) }}</div></div>
      <div class="kpi"><div class="kpi-label">Gross Profit After Sale</div><div class="kpi-value">{{ money(track.endOfHolding.grossProfitAfterSale) }}</div></div>
      <div class="kpi"><div class="kpi-label">Net Profit After Sale</div><div class="kpi-value">{{ money(track.endOfHolding.netProfitAfterSale) }}</div></div>
    </section>

    <section class="grid grid-cols-2 md:grid-cols-4 gap-3">
      <div class="kpi"><div class="kpi-label">Gross Annualized ROI</div><div class="kpi-value">{{ pct(track.endOfHolding.grossAnnualizedROI) }}</div></div>
      <div class="kpi"><div class="kpi-label">Net Annualized ROI</div><div class="kpi-value">{{ pct(track.endOfHolding.netAnnualizedROI) }}</div></div>
      <div class="kpi"><div class="kpi-label">Gross Annualized ROE</div><div class="kpi-value">{{ pct(track.endOfHolding.grossAnnualizedROE) }}</div></div>
      <div class="kpi"><div class="kpi-label">Net Annualized ROE</div><div class="kpi-value">{{ pct(track.endOfHolding.netAnnualizedROE) }}</div></div>
    </section>

    <section class="grid grid-cols-2 md:grid-cols-4 gap-3">
      <div class="kpi" title="Annual rent ÷ total purchase price. Ignores expenses and financing.">
        <div class="kpi-label">Gross Rental Yield (Cost)</div>
        <div class="kpi-value">{{ pct(ki.grossRentalYieldOnCost) }}</div>
      </div>
      <div class="kpi" title="Annual rent ÷ Yr 1 market value (ARV). Ignores expenses and financing.">
        <div class="kpi-label">Gross Rental Yield (Value)</div>
        <div class="kpi-value">{{ pct(ki.grossRentalYieldOnValue) }}</div>
      </div>
      <div class="kpi" title="Annual cash flow ÷ total price. Includes ongoing costs.">
        <div class="kpi-label">Capitalization Rate</div>
        <div class="kpi-value">{{ pct(track.endOfHolding.capitalizationRate) }}</div>
      </div>
      <div class="kpi" title="After-tax cash flow ÷ annual debt service.">
        <div class="kpi-label">Debt Service Coverage</div>
        <div class="kpi-value">{{ track.endOfHolding.dscr.toFixed(2) }}</div>
      </div>
    </section>

    <section class="grid grid-cols-2 md:grid-cols-4 gap-3">
      <div class="kpi"><div class="kpi-label">Loan-To-Value</div><div class="kpi-value">{{ pct(track.endOfHolding.ltv) }}</div></div>
      <div class="kpi"><div class="kpi-label">Loan-To-Cost</div><div class="kpi-value">{{ pct(track.endOfHolding.ltc) }}</div></div>
    </section>

    <section class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="card">
        <h3 class="section-title">Year 1 (Before Tax)</h3>
        <dl class="grid grid-cols-2 gap-y-1 text-sm">
          <dt class="text-ink-muted">Cash-on-Cash</dt><dd class="text-right">{{ pct(track.year1.beforeTax.cashOnCashReturn) }}</dd>
          <dt class="text-ink-muted">Yield on Cost</dt><dd class="text-right">{{ pct(track.year1.beforeTax.yieldOnCost) }}</dd>
          <dt class="text-ink-muted">Yield on Value</dt><dd class="text-right">{{ pct(track.year1.beforeTax.yieldOnValue) }}</dd>
        </dl>
        <h3 class="section-title mt-4">Year 1 (After Tax)</h3>
        <dl class="grid grid-cols-2 gap-y-1 text-sm">
          <dt class="text-ink-muted">Cash-on-Cash</dt><dd class="text-right">{{ pct(track.year1.afterTax.cashOnCashReturn) }}</dd>
          <dt class="text-ink-muted">Yield on Cost</dt><dd class="text-right">{{ pct(track.year1.afterTax.yieldOnCost) }}</dd>
          <dt class="text-ink-muted">Yield on Value</dt><dd class="text-right">{{ pct(track.year1.afterTax.yieldOnValue) }}</dd>
        </dl>
      </div>
      <div class="card">
        <h3 class="section-title">Year {{ ki.holdingPeriodYears }} (Before Tax)</h3>
        <dl class="grid grid-cols-2 gap-y-1 text-sm">
          <dt class="text-ink-muted">Cash-on-Cash</dt><dd class="text-right">{{ pct(track.yearN.beforeTax.cashOnCashReturn) }}</dd>
          <dt class="text-ink-muted">Yield on Cost</dt><dd class="text-right">{{ pct(track.yearN.beforeTax.yieldOnCost) }}</dd>
          <dt class="text-ink-muted">Yield on Value</dt><dd class="text-right">{{ pct(track.yearN.beforeTax.yieldOnValue) }}</dd>
        </dl>
        <h3 class="section-title mt-4">Year {{ ki.holdingPeriodYears }} (After Tax)</h3>
        <dl class="grid grid-cols-2 gap-y-1 text-sm">
          <dt class="text-ink-muted">Cash-on-Cash</dt><dd class="text-right">{{ pct(track.yearN.afterTax.cashOnCashReturn) }}</dd>
          <dt class="text-ink-muted">Yield on Cost</dt><dd class="text-right">{{ pct(track.yearN.afterTax.yieldOnCost) }}</dd>
          <dt class="text-ink-muted">Yield on Value</dt><dd class="text-right">{{ pct(track.yearN.afterTax.yieldOnValue) }}</dd>
        </dl>
      </div>
    </section>

    <section class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="card">
        <h3 class="section-title">Cumulative Cash Flow</h3>
        <CashFlowChart :rows="store.result?.forecastYearly[loanType] ?? []" />
      </div>
      <div class="card">
        <h3 class="section-title">Property Value vs Equity</h3>
        <EquityChart :rows="store.result?.forecastYearly[loanType] ?? []" />
      </div>
    </section>
  </div>
  <div v-else class="text-ink-muted">Computing…</div>
</template>

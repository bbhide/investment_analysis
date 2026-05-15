<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import type { Inputs, Comparables } from '@inv/shared';
import type { CalcResult } from '@inv/calc';
import { api } from '../lib/api';
import { setCurrency, money, pct } from '../lib/format';
import CashFlowChart from '../components/charts/CashFlowChart.vue';
import EquityChart from '../components/charts/EquityChart.vue';
import AmortizationChart from '../components/charts/AmortizationChart.vue';

const route = useRoute();
const loading = ref(true);
const error = ref<string | null>(null);
const reportName = ref('');
const result = ref<CalcResult | null>(null);
const inputs = ref<Inputs | null>(null);
const comparables = ref<Comparables | null>(null);
const currency = ref('AED');
const generatedAt = ref(new Date());

const summary = computed(() => result.value?.summary ?? null);
const ki = computed(() => summary.value?.keyInformation ?? null);
const pi = computed(() => summary.value?.pi ?? null);
const yearly = computed(() => result.value?.forecastYearly.pi ?? []);

async function loadFromId(id: string) {
  const s = await api.getScenario(id);
  reportName.value = s.name;
  currency.value = s.currency;
  setCurrency(s.currency);
  inputs.value = s.inputs;
  comparables.value = s.comparables ?? null;
  const r = await api.calculate(s.inputs, s.comparables ?? undefined);
  result.value = r.result;
}

async function loadFromToken(token: string) {
  const s = await api.getShared(token);
  reportName.value = s.name;
  currency.value = s.currency;
  setCurrency(s.currency);
  inputs.value = s.inputs;
  comparables.value = s.comparables;
  const r = await api.calculate(s.inputs, s.comparables ?? undefined);
  result.value = r.result;
}

onMounted(async () => {
  try {
    if (typeof route.params.id === 'string') {
      await loadFromId(route.params.id);
    } else if (typeof route.params.token === 'string') {
      await loadFromToken(route.params.token);
    }
  } catch (e) {
    error.value = (e as Error).message;
    loading.value = false;
    return;
  }
  // Render the report *before* we trigger print. Setting loading=false here (not in
  // a finally block) lets Vue swap from the "Preparing report…" placeholder to the
  // real report layout before we ask the browser to print it.
  loading.value = false;
  if (route.query.print === '1') {
    // Two paint frames for the layout, then a beat for Chart.js canvases to finish drawing.
    await nextTick();
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r(null))));
    await new Promise((r) => setTimeout(r, 900));
    window.print();
  }
});

const generatedAtFmt = computed(() =>
  generatedAt.value.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }),
);

function doPrint() {
  window.print();
}
</script>

<template>
  <div v-if="loading" class="p-10 text-center text-ink-muted">Preparing report…</div>
  <div v-else-if="error" class="p-10 text-center text-red-600">{{ error }}</div>
  <article v-else-if="ki && pi && summary" class="report">
    <!-- Screen-only action bar -->
    <div class="report-actions">
      <button class="btn btn-primary" @click="doPrint">Save as PDF / Print</button>
      <span class="text-xs text-ink-muted">Use “Save as PDF” in the print dialog to get a shareable file.</span>
    </div>

    <!-- ========== PAGE 1 ========== -->
    <header class="report-header">
      <div class="brand">
        <span class="brand-mark">RE</span>
        <span class="brand-name">Investment Analysis</span>
      </div>
      <h1 class="report-title">{{ reportName }}</h1>
      <p class="report-sub">
        <span v-if="ki.address">{{ ki.address }} · </span>
        Holding period: {{ ki.holdingPeriodYears }} years · Generated {{ generatedAtFmt }}
      </p>
    </header>

    <section class="kpi-row">
      <div class="kpi-card primary">
        <div class="kpi-label">Gross Rental Yield</div>
        <div class="kpi-value">{{ pct(ki.grossRentalYieldOnCost) }}</div>
        <div class="kpi-foot">Annual rent ÷ purchase price</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Year 1 Cash-on-Cash</div>
        <div class="kpi-value">{{ pct(pi.year1.beforeTax.cashOnCashReturn) }}</div>
        <div class="kpi-foot">Before tax</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Cap Rate</div>
        <div class="kpi-value">{{ pct(pi.endOfHolding.capitalizationRate) }}</div>
        <div class="kpi-foot">Cash flow ÷ price</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Net Annualized ROI</div>
        <div class="kpi-value">{{ pct(pi.endOfHolding.netAnnualizedROI) }}</div>
        <div class="kpi-foot">Over {{ ki.holdingPeriodYears }} years</div>
      </div>
    </section>

    <section class="two-col">
      <div class="panel">
        <h2>Property</h2>
        <dl>
          <dt>Purchase Price</dt><dd>{{ money(ki.totalPrice) }}</dd>
          <dt>Down Payment</dt><dd>{{ money(ki.downPaymentAmount) }} ({{ pct(ki.downPaymentPct, 1) }})</dd>
          <dt>Yr 1 Market Value (ARV)</dt><dd>{{ money(ki.yr1MarketValueARV) }}</dd>
          <dt>Annual Appreciation</dt><dd>{{ pct(ki.annualAppreciation, 1) }}</dd>
          <dt>Annual Rental Income</dt><dd>{{ money(ki.annualRentalIncome) }}</dd>
          <dt>Annual Rental Growth</dt><dd>{{ pct(ki.annualRentalGrowth, 1) }}</dd>
          <dt>Total Cash to Close</dt><dd>{{ money(ki.purchasingCostsRequired) }}</dd>
        </dl>
      </div>
      <div class="panel">
        <h2>Financing (P&amp;I)</h2>
        <dl>
          <dt>Loan Principal</dt><dd>{{ money(ki.principalAmount) }}</dd>
          <dt>Annual Interest Rate</dt><dd>{{ pct(summary.mortgage.pi.annualRate, 2) }}</dd>
          <dt>Term</dt><dd>{{ summary.mortgage.pi.durationYears }} years</dd>
          <dt>Monthly Payment</dt><dd>{{ money(summary.mortgage.pi.monthlyPayment) }}</dd>
          <dt>Loan Balance at Sale</dt><dd>{{ money(pi.endOfHolding.loanBalance) }}</dd>
          <dt>Loan-to-Value at Sale</dt><dd>{{ pct(pi.endOfHolding.ltv, 1) }}</dd>
          <dt>Debt Service Coverage</dt><dd>{{ pi.endOfHolding.dscr.toFixed(2) }}</dd>
        </dl>
      </div>
    </section>

    <section class="panel">
      <h2>Year {{ ki.holdingPeriodYears }} — If Sold Today</h2>
      <div class="four-col">
        <div class="stat">
          <div class="stat-label">Sale Price (est.)</div>
          <div class="stat-value">{{ money(pi.endOfHolding.propertyValue) }}</div>
        </div>
        <div class="stat">
          <div class="stat-label">Equity</div>
          <div class="stat-value">{{ money(pi.endOfHolding.equity) }}</div>
        </div>
        <div class="stat">
          <div class="stat-label">Gross Profit</div>
          <div class="stat-value">{{ money(pi.endOfHolding.grossProfitAfterSale) }}</div>
        </div>
        <div class="stat">
          <div class="stat-label">Net Profit (incl. cash flows)</div>
          <div class="stat-value">{{ money(pi.endOfHolding.netProfitAfterSale) }}</div>
        </div>
      </div>
    </section>

    <section class="charts">
      <div class="panel chart-panel">
        <h2>Cumulative Cash Flow</h2>
        <CashFlowChart :rows="yearly" />
      </div>
      <div class="panel chart-panel">
        <h2>Property Value vs Equity</h2>
        <EquityChart :rows="yearly" />
      </div>
    </section>

    <!-- ========== PAGE 2 ========== -->
    <section class="page-break panel">
      <h2>Year-by-Year Forecast (P&amp;I)</h2>
      <table class="forecast-table">
        <thead>
          <tr>
            <th>Year</th>
            <th>Property Value</th>
            <th>Equity</th>
            <th>Rent</th>
            <th>Ongoing</th>
            <th>Mortgage</th>
            <th>Before-Tax CF</th>
            <th>Cumulative CF</th>
            <th>Net Profit if Sold</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in yearly" :key="r.year">
            <td>{{ r.year }}</td>
            <td>{{ money(r.propertyValue) }}</td>
            <td>{{ money(r.equity) }}</td>
            <td>{{ money(r.rent) }}</td>
            <td>{{ money(r.totalOngoingCosts) }}</td>
            <td>{{ money(r.loanRepayment) }}</td>
            <td>{{ money(r.beforeTaxCashFlow) }}</td>
            <td>{{ money(r.cumulativeAfterTaxCashFlow) }}</td>
            <td>{{ money(r.netProfitIfSold) }}</td>
          </tr>
        </tbody>
      </table>
    </section>

    <section class="panel">
      <h2>Loan Amortization Summary</h2>
      <AmortizationChart :rows="result?.amortization.piYearly ?? []" />
    </section>

    <footer class="report-footer">
      <p class="disclaimer">
        This report is generated for analytical purposes and reflects the inputs supplied. All figures are projections
        based on stated assumptions (appreciation, rental growth, interest rates, costs) and are not guarantees of future
        performance. Consult a qualified financial advisor before making investment decisions.
      </p>
      <p class="generated">
        Generated {{ generatedAtFmt }} · Currency: {{ currency }} · {{ reportName }}
      </p>
      <p class="credit">
        This Reporting tool built by Bhavesh Bhide <a href="mailto:bhavesh.bhide@gmail.com">bhavesh.bhide@gmail.com</a>
      </p>
    </footer>
  </article>
</template>

<style scoped>
.report {
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem 2.5rem;
  background: white;
  color: #0f172a;
  font-family: Inter, system-ui, sans-serif;
}

.report-actions {
  display: flex;
  gap: 1rem;
  align-items: center;
  padding: 0.75rem 0;
  margin-bottom: 1rem;
  border-bottom: 1px solid #e2e8f0;
}

.report-header {
  border-bottom: 2px solid #0f172a;
  padding-bottom: 1rem;
  margin-bottom: 1.5rem;
}
.brand {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: #64748b;
  margin-bottom: 0.75rem;
}
.brand-mark {
  display: inline-flex;
  width: 1.5rem;
  height: 1.5rem;
  align-items: center;
  justify-content: center;
  background: #f6e7d0;
  border-radius: 0.35rem;
  font-weight: 600;
  font-size: 0.7rem;
  color: #0f172a;
}
.report-title {
  font-size: 1.85rem;
  font-weight: 700;
  margin: 0;
  letter-spacing: -0.02em;
}
.report-sub {
  margin-top: 0.35rem;
  color: #475569;
  font-size: 0.9rem;
}

.kpi-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.75rem;
  margin-bottom: 1.25rem;
}
.kpi-card {
  border: 1px solid #e2e8f0;
  border-radius: 0.6rem;
  padding: 0.9rem 1rem;
  background: white;
}
.kpi-card.primary {
  background: #f6e7d0;
  border-color: #ecd0a3;
}
.kpi-label {
  font-size: 0.7rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: #64748b;
}
.kpi-value {
  font-size: 1.6rem;
  font-weight: 700;
  margin-top: 0.25rem;
  letter-spacing: -0.02em;
}
.kpi-foot {
  font-size: 0.7rem;
  color: #64748b;
  margin-top: 0.25rem;
}

.two-col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1.25rem;
}
.panel {
  border: 1px solid #e2e8f0;
  border-radius: 0.6rem;
  padding: 1rem 1.1rem;
  margin-bottom: 1.25rem;
  background: white;
}
.panel h2 {
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #64748b;
  margin: 0 0 0.75rem 0;
  font-weight: 600;
}
.panel dl {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 0.4rem 1rem;
  margin: 0;
  font-size: 0.9rem;
}
.panel dt { color: #64748b; }
.panel dd { margin: 0; font-weight: 600; }

.four-col {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
}
.stat-label {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #64748b;
}
.stat-value {
  font-size: 1.15rem;
  font-weight: 700;
  margin-top: 0.2rem;
}

.charts {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}
.chart-panel { padding: 1rem 0.5rem; }

.forecast-table {
  width: 100%;
  font-size: 0.78rem;
  border-collapse: collapse;
}
.forecast-table th,
.forecast-table td {
  border-bottom: 1px solid #e2e8f0;
  padding: 0.4rem 0.5rem;
  text-align: right;
  white-space: nowrap;
}
.forecast-table th:first-child,
.forecast-table td:first-child {
  text-align: left;
}
.forecast-table th {
  color: #64748b;
  font-weight: 500;
}

.report-footer {
  margin-top: 2rem;
  border-top: 1px solid #e2e8f0;
  padding-top: 1rem;
}
.disclaimer {
  font-size: 0.7rem;
  color: #64748b;
  line-height: 1.5;
}
.generated {
  font-size: 0.65rem;
  color: #94a3b8;
  margin-top: 0.5rem;
}
.credit {
  font-size: 0.7rem;
  color: #475569;
  margin-top: 0.5rem;
  font-weight: 500;
}
.credit a {
  color: inherit;
  text-decoration: underline;
}

/* ===== Print rules ===== */
@media print {
  @page {
    size: A4;
    margin: 12mm 14mm;
  }
  body { background: white !important; }
  .report-actions { display: none !important; }
  .report {
    max-width: none;
    padding: 0;
    margin: 0;
  }
  .panel, .kpi-card {
    box-shadow: none !important;
    break-inside: avoid;
    page-break-inside: avoid;
  }
  .page-break {
    break-before: page;
    page-break-before: always;
  }
  .charts, .two-col, .four-col, .kpi-row {
    break-inside: avoid;
  }
  /* Force background colors (kpi-card.primary highlight) to print */
  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
}
</style>

<script setup lang="ts">
import { computed } from 'vue';
import { useScenarioStore } from '../stores/scenario';
import { money, int } from '../lib/format';
import type { ComparableProperty } from '@inv/shared';

const store = useScenarioStore();
const c = computed(() => store.comparables);
const a = computed(() => store.comparablesAnalysis);

const groups = [
  { key: 'listed' as const, title: 'Currently Listed for Sale' },
  { key: 'sold' as const, title: 'Recently Sold' },
  { key: 'rentals' as const, title: 'Rental Comparables' },
];

function blank(): ComparableProperty {
  return {
    address: '',
    bedrooms: 0,
    bathrooms: 0,
    parking: 0,
    lotArea: 0,
    grossFloorArea: 0,
    yearBuilt: 0,
    lastRenovated: 0,
    daysOnMarket: 0,
    price: 0,
  };
}

function addProperty(key: 'listed' | 'sold' | 'rentals') {
  c.value[key] = [...c.value[key], blank()];
}
function removeProperty(key: 'listed' | 'sold' | 'rentals', idx: number) {
  c.value[key] = c.value[key].filter((_, i) => i !== idx);
}
</script>

<template>
  <div class="space-y-6">
    <header class="flex items-end justify-between">
      <div>
        <h2 class="text-lg font-semibold">Comparables</h2>
        <p class="text-sm text-ink-muted">Compare listed, sold, and rental properties side-by-side.</p>
      </div>
      <label class="text-sm flex items-center gap-2">
        <span>Area unit</span>
        <select v-model="c.areaUnit" class="input-cell w-32">
          <option value="sqft">Square Feet (sqft)</option>
          <option value="sqm">Square Metres (sqm)</option>
        </select>
      </label>
    </header>

    <section v-for="g in groups" :key="g.key" class="card overflow-x-auto">
      <div class="flex items-center justify-between mb-2">
        <h3 class="section-title m-0">{{ g.title }}</h3>
        <button class="btn text-xs" @click="addProperty(g.key)">+ Add property</button>
      </div>
      <table v-if="c[g.key].length > 0" class="table-default whitespace-nowrap">
        <thead>
          <tr>
            <th>Address</th>
            <th>Bed</th>
            <th>Bath</th>
            <th>Parking</th>
            <th>Lot ({{ c.areaUnit }})</th>
            <th>GFA ({{ c.areaUnit }})</th>
            <th>Year Built</th>
            <th>Last Reno</th>
            <th>Days on Market</th>
            <th>Price</th>
            <th>Price / {{ c.areaUnit }}</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(p, idx) in c[g.key]" :key="idx">
            <td><input class="input-cell w-44" v-model="p.address" /></td>
            <td><input class="input-cell w-16" type="number" v-model.number="p.bedrooms" /></td>
            <td><input class="input-cell w-16" type="number" v-model.number="p.bathrooms" /></td>
            <td><input class="input-cell w-16" type="number" v-model.number="p.parking" /></td>
            <td><input class="input-cell w-20" type="number" v-model.number="p.lotArea" /></td>
            <td><input class="input-cell w-20" type="number" v-model.number="p.grossFloorArea" /></td>
            <td><input class="input-cell w-20" type="number" v-model.number="p.yearBuilt" /></td>
            <td><input class="input-cell w-20" type="number" v-model.number="p.lastRenovated" /></td>
            <td><input class="input-cell w-20" type="number" v-model.number="p.daysOnMarket" /></td>
            <td><input class="input-cell w-28" type="number" v-model.number="p.price" /></td>
            <td class="text-right">{{ p.grossFloorArea > 0 && p.price > 0 ? money(p.price / p.grossFloorArea) : '—' }}</td>
            <td>
              <button class="text-red-600 text-xs hover:underline" @click="removeProperty(g.key, idx)">Remove</button>
            </td>
          </tr>
          <tr v-if="a" class="bg-slate-50 font-medium">
            <td>Average</td>
            <td>{{ int(a[g.key].averageBedrooms) }}</td>
            <td>{{ int(a[g.key].averageBathrooms) }}</td>
            <td>{{ int(a[g.key].averageParking) }}</td>
            <td>{{ int(a[g.key].averageLotArea) }}</td>
            <td>{{ int(a[g.key].averageGrossFloorArea) }}</td>
            <td>{{ int(a[g.key].averageYearBuilt) }}</td>
            <td>{{ int(a[g.key].averageLastRenovated) }}</td>
            <td>{{ int(a[g.key].averageDaysOnMarket) }}</td>
            <td>{{ money(a[g.key].averagePrice) }}</td>
            <td>{{ money(a[g.key].averagePricePerArea) }}</td>
            <td></td>
          </tr>
        </tbody>
      </table>
      <p v-else class="text-sm text-ink-muted">No properties yet — add one to start comparing.</p>
    </section>
  </div>
</template>

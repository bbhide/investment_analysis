import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from './stores/auth';

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('./views/Login.vue'),
      meta: { public: true, fullPage: true },
    },
    { path: '/', name: 'home', component: () => import('./views/ScenariosList.vue') },
    {
      path: '/scenario/new',
      name: 'scenario-new',
      component: () => import('./views/NewScenario.vue'),
    },
    {
      path: '/scenario/:id',
      component: () => import('./views/ScenarioShell.vue'),
      children: [
        { path: '', redirect: (to) => `/scenario/${to.params.id}/summary` },
        { path: 'inputs', name: 'scenario-inputs', component: () => import('./views/InputsEditor.vue') },
        { path: 'summary', name: 'scenario-summary', component: () => import('./views/SummaryDashboard.vue') },
        { path: 'mortgage', name: 'scenario-mortgage', component: () => import('./views/MortgageCalculator.vue') },
        { path: 'forecast', name: 'scenario-forecast', component: () => import('./views/Forecast.vue') },
        { path: 'comparables', name: 'scenario-comparables', component: () => import('./views/Comparables.vue') },
      ],
    },
    // Standalone report view — opens without the app shell so it can print/save as PDF cleanly.
    {
      path: '/scenario/:id/report',
      name: 'scenario-report',
      component: () => import('./views/ReportView.vue'),
      meta: { fullPage: true },
    },
    // Public client-facing routes — no auth required
    {
      path: '/shared/:token',
      name: 'shared',
      component: () => import('./views/SharedView.vue'),
      meta: { public: true },
    },
    {
      path: '/shared/:token/report',
      name: 'shared-report',
      component: () => import('./views/ReportView.vue'),
      meta: { public: true, fullPage: true },
    },
  ],
});

// Global guard: anything without meta.public requires an auth cookie.
// We check /api/auth/me once and cache the result in the store.
router.beforeEach(async (to) => {
  if (to.meta.public) return true;

  const auth = useAuthStore();
  if (auth.authed === undefined) await auth.check();

  if (!auth.authed) {
    return { name: 'login', query: { next: to.fullPath } };
  }
  return true;
});

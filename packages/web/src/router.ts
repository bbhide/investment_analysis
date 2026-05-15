import { createRouter, createWebHistory } from 'vue-router';

export const router = createRouter({
  history: createWebHistory(),
  routes: [
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
    {
      path: '/shared/:token',
      name: 'shared',
      component: () => import('./views/SharedView.vue'),
    },
  ],
});

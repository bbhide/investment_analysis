import type { Inputs, Scenario, ScenarioListItem, Comparables } from '@inv/shared';
import type { CalcResult } from '@inv/calc';
import type { ComparablesAnalysis } from '@inv/calc';

const BASE = '/api';

async function request<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const res = await fetch(BASE + path, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(opts.headers ?? {}) },
    ...opts,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`API ${res.status}: ${text}`);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const api = {
  listScenarios: () => request<ScenarioListItem[]>('/scenarios'),
  getScenario: (id: string) => request<Scenario>(`/scenarios/${id}`),
  createScenario: (body: { name: string; currency: string; inputs: Inputs; comparables?: Comparables }) =>
    request<Scenario>('/scenarios', { method: 'POST', body: JSON.stringify(body) }),
  updateScenario: (id: string, body: Partial<{ name: string; currency: string; inputs: Inputs; comparables: Comparables }>) =>
    request<Scenario>(`/scenarios/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteScenario: (id: string) => request<void>(`/scenarios/${id}`, { method: 'DELETE' }),
  share: (id: string) => request<{ shareToken: string }>(`/scenarios/${id}/share`, { method: 'POST' }),
  unshare: (id: string) => request<void>(`/scenarios/${id}/share`, { method: 'DELETE' }),
  getShared: (token: string) => request<{ id: string; name: string; currency: string; inputs: Inputs; comparables: Comparables | null }>(`/shared/${token}`),
  calculate: (inputs: Inputs, comparables?: Comparables) =>
    request<{ result: CalcResult; comparablesAnalysis: ComparablesAnalysis | null }>('/calculate', {
      method: 'POST',
      body: JSON.stringify({ inputs, comparables }),
    }),
};

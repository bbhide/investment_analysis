import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useAuthStore = defineStore('auth', () => {
  /** undefined = haven't checked yet; true/false = checked */
  const authed = ref<boolean | undefined>(undefined);
  const checking = ref(false);

  async function check(): Promise<boolean> {
    checking.value = true;
    try {
      const res = await fetch('/api/auth/me', { credentials: 'include' });
      authed.value = res.ok;
      return res.ok;
    } catch {
      authed.value = false;
      return false;
    } finally {
      checking.value = false;
    }
  }

  async function login(password: string): Promise<{ ok: true } | { ok: false; error: string }> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      authed.value = true;
      return { ok: true };
    }
    if (res.status === 401) return { ok: false, error: 'Wrong password.' };
    return { ok: false, error: `Login failed (${res.status})` };
  }

  async function logout(): Promise<void> {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    authed.value = false;
  }

  return { authed, checking, check, login, logout };
});

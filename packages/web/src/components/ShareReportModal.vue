<script setup lang="ts">
import { ref, nextTick, watch } from 'vue';

const props = defineProps<{ open: boolean; url: string }>();
const emit = defineEmits<{ (e: 'close'): void; (e: 'revoke'): void }>();

const urlInput = ref<HTMLInputElement | null>(null);
const copyState = ref<'idle' | 'copied' | 'failed'>('idle');
const canWebShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';
const isMac = typeof navigator !== 'undefined' && /Mac/i.test(navigator.userAgent);
const copyShortcut = isMac ? '⌘C' : 'Ctrl+C';

watch(
  () => props.open,
  async (isOpen) => {
    if (isOpen) {
      copyState.value = 'idle';
      await nextTick();
      // Pre-select the URL so the user can ctrl/cmd-C if the copy button fails
      urlInput.value?.select();
    }
  },
);

async function copyLink() {
  try {
    // navigator.clipboard.writeText is a fresh user activation right now (button click)
    await navigator.clipboard.writeText(props.url);
    copyState.value = 'copied';
    setTimeout(() => (copyState.value = 'idle'), 2500);
  } catch {
    // Fall back to the deprecated execCommand path so older / locked-down browsers still work
    try {
      urlInput.value?.select();
      const ok = document.execCommand('copy');
      copyState.value = ok ? 'copied' : 'failed';
    } catch {
      copyState.value = 'failed';
    }
    setTimeout(() => (copyState.value = 'idle'), 2500);
  }
}

async function shareNative() {
  try {
    await navigator.share({
      title: 'Investment Analysis Report',
      text: 'View this property investment analysis:',
      url: props.url,
    });
  } catch {
    // User cancelled or share failed — nothing to do
  }
}

function close() {
  emit('close');
}
</script>

<template>
  <Transition name="modal">
    <div v-if="open" class="modal-backdrop" @click.self="close">
      <div class="modal-panel" role="dialog" aria-modal="true" aria-labelledby="share-modal-title">
        <header class="modal-head">
          <h3 id="share-modal-title">Share report with client</h3>
          <button class="modal-close" aria-label="Close" @click="close">×</button>
        </header>

        <p class="modal-sub">
          Anyone with this link can view a read-only version of the report — no password needed.
        </p>

        <div class="url-row">
          <input
            ref="urlInput"
            type="text"
            :value="url"
            readonly
            spellcheck="false"
            @focus="($event.target as HTMLInputElement).select()"
          />
          <button class="btn btn-primary" @click="copyLink">
            {{ copyState === 'copied' ? '✓ Copied' : copyState === 'failed' ? 'Copy failed' : 'Copy link' }}
          </button>
        </div>

        <p v-if="copyState === 'failed'" class="copy-hint">
          Copy didn't work — select the text above and press {{ copyShortcut }} instead.
        </p>

        <div class="modal-actions">
          <button v-if="canWebShare" class="btn" @click="shareNative">Share via…</button>
          <a class="btn" :href="url" target="_blank" rel="noopener">Open report</a>
          <button class="btn btn-danger" @click="emit('revoke')">Revoke link</button>
          <button class="btn" @click="close">Close</button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  z-index: 50;
}
.modal-panel {
  background: white;
  border-radius: 0.85rem;
  width: 100%;
  max-width: 32rem;
  padding: 1.25rem 1.25rem 1.1rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}
.modal-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.3rem;
}
.modal-head h3 {
  font-size: 1.05rem;
  font-weight: 600;
  margin: 0;
}
.modal-close {
  border: none;
  background: transparent;
  font-size: 1.4rem;
  line-height: 1;
  cursor: pointer;
  color: #64748b;
  padding: 0.1rem 0.4rem;
  border-radius: 0.3rem;
}
.modal-close:hover { background: #f1f5f9; }
.modal-sub {
  font-size: 0.85rem;
  color: #64748b;
  margin: 0 0 1rem;
}
.url-row {
  display: flex;
  gap: 0.5rem;
  align-items: stretch;
}
.url-row input {
  flex: 1;
  min-width: 0;
  border: 1px solid #cbd5e1;
  border-radius: 0.4rem;
  padding: 0.55rem 0.7rem;
  font-size: 0.85rem;
  background: #f8fafc;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
}
.url-row .btn {
  flex-shrink: 0;
  white-space: nowrap;
}
.copy-hint {
  font-size: 0.75rem;
  color: #b45309;
  margin: 0.5rem 0 0;
}
.modal-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 1.1rem;
  justify-content: flex-end;
}

/* Mobile-friendly: stack the URL row on narrow screens */
@media (max-width: 480px) {
  .url-row { flex-direction: column; }
  .url-row .btn { width: 100%; }
  .modal-actions { justify-content: stretch; }
  .modal-actions .btn,
  .modal-actions a { flex: 1; min-width: 45%; }
}

/* Subtle fade-in */
.modal-enter-active,
.modal-leave-active { transition: opacity 0.15s ease; }
.modal-enter-from,
.modal-leave-to { opacity: 0; }
</style>

// @ts-check
import { ref } from 'vue';

/**
 * @typedef {{
 *   id: number,
 *   message: string,
 *   kind?: 'info' | 'success' | 'error',
 *   icon?: string,
 *   timeout?: number,
 * }} ToastEntry
 */

/** @type {import('vue').Ref<ToastEntry[]>} */
const toasts = ref([]);
let counter = 0;

/**
 * 觸發 haptic 回饋（手機才有）。
 * @param {number | number[]} pattern
 */
export function haptic(pattern = 30) {
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    try {
      navigator.vibrate(pattern);
    } catch {
      /* iOS Safari 對 vibrate 是 no-op */
    }
  }
}

export function useToast() {
  /**
   * @param {{ message: string, kind?: 'info'|'success'|'error', icon?: string, timeout?: number }} opts
   */
  function showToast(opts) {
    const id = ++counter;
    const entry = {
      id,
      message: opts.message,
      kind: opts.kind ?? 'info',
      icon: opts.icon,
      timeout: opts.timeout ?? 2400,
    };
    toasts.value = [...toasts.value, entry];
    setTimeout(() => dismiss(id), entry.timeout);
    return id;
  }

  /** @param {number} id */
  function dismiss(id) {
    toasts.value = toasts.value.filter((t) => t.id !== id);
  }

  return { toasts, showToast, dismiss, haptic };
}

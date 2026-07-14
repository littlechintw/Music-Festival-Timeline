// @ts-check
import { ref } from 'vue';

/**
 * @typedef {{
 *   title: string,
 *   message: string,
 *   confirmLabel: string,
 *   cancelLabel: string,
 *   danger: boolean,
 *   resolve: (value: boolean) => void,
 * }} ConfirmRequest
 */

/** @type {import('vue').Ref<ConfirmRequest | null>} */
const request = ref(null);

/**
 * 取代原生 window.confirm()——同樣是「確定/取消」二選一，但用站內的 MD3 對話框呈現，
 * 樣式跟深色模式才能跟其他畫面一致（原生 confirm 完全沒辦法套版）。
 */
export function useConfirm() {
  /**
   * @param {string} message
   * @param {{ title?: string, confirmLabel?: string, cancelLabel?: string, danger?: boolean }} [opts]
   * @returns {Promise<boolean>}
   */
  function confirm(message, opts = {}) {
    return new Promise((resolve) => {
      request.value = {
        title: opts.title ?? '請確認',
        message,
        confirmLabel: opts.confirmLabel ?? '確定',
        cancelLabel: opts.cancelLabel ?? '取消',
        danger: opts.danger ?? false,
        resolve,
      };
    });
  }

  /** @param {boolean} value */
  function resolve(value) {
    request.value?.resolve(value);
    request.value = null;
  }

  return { request, confirm, resolve };
}

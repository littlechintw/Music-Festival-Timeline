// @ts-check
import { registerSW } from 'virtual:pwa-register';

/**
 * 註冊 PWA service worker，並在有新版本時透過 callback 提示使用者。
 *
 * 搭配 vite.config.js 的 `registerType: 'prompt'`：
 * - 新 SW 下載完會停在 waiting state
 * - `onNeedRefresh` 觸發，UI 顯示提示
 * - 使用者按下更新 → 呼叫 `updateSW(true)` → workbox `skipWaiting` + `clientsClaim` 啟動 → 頁面自動 reload
 *
 * @param {{ onNeedRefresh?: () => void, onOfflineReady?: () => void }} hooks
 * @returns {(reloadPage?: boolean) => Promise<void>}
 */
export function registerPwa(hooks = {}) {
  if (import.meta.env.DEV) {
    // dev 模式不註冊 SW，避免 HMR 衝突
    return () => Promise.resolve();
  }
  const updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      hooks.onNeedRefresh?.();
    },
    onOfflineReady() {
      hooks.onOfflineReady?.();
    },
    onRegisterError(err) {
      console.warn('[pwa] register failed:', err);
    },
  });
  return updateSW;
}

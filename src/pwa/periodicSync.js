// @ts-check
// Periodic Background Sync 註冊（progressive enhancement）。
// 只有 Chromium 系（Chrome/Edge）且使用者把 site 設為「已安裝 PWA」+ 已授權背景使用才有效。
// 不支援的瀏覽器（Firefox / Safari）會安靜 no-op。

const SYNC_TAG = 'festival-data-sync';
const MIN_INTERVAL_MS = 6 * 60 * 60 * 1000;

/**
 * @returns {Promise<{ supported: boolean, registered: boolean, reason?: string }>}
 */
export async function registerPeriodicSync() {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    return { supported: false, registered: false, reason: 'no-sw' };
  }

  try {
    const reg = await navigator.serviceWorker.ready;
    // @ts-ignore: PeriodicSyncManager 是非標準擴充
    if (!('periodicSync' in reg)) {
      return { supported: false, registered: false, reason: 'no-periodic-sync' };
    }

    if ('permissions' in navigator) {
      try {
        // @ts-ignore: TS 內建 PermissionName 沒列這個
        const status = await navigator.permissions.query({ name: 'periodic-background-sync' });
        if (status.state !== 'granted') {
          return { supported: true, registered: false, reason: `permission-${status.state}` };
        }
      } catch {
        // permission query 失敗就直接嘗試 register
      }
    }

    // @ts-ignore
    await reg.periodicSync.register(SYNC_TAG, { minInterval: MIN_INTERVAL_MS });
    return { supported: true, registered: true };
  } catch (err) {
    return {
      supported: true,
      registered: false,
      reason: err instanceof Error ? err.message : 'unknown',
    };
  }
}

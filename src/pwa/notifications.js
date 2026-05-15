// @ts-check
// 集中處理所有 Web Notifications：權限請求 + 觸發顯示。
// 優先用 Service Worker（鎖屏 / 失焦也能彈）；失敗時 fallback 到 window.Notification。

import { useNotificationStore } from '../stores/notifications';

/**
 * @typedef {{
 *   title: string,
 *   body: string,
 *   tag: string,
 *   data?: Record<string, unknown>,
 *   recordKey?: string,
 * }} NotificationPayload
 */

/**
 * @returns {Promise<NotificationPermission | 'unsupported'>}
 */
export async function requestNotificationPermission() {
  if (typeof Notification === 'undefined') return 'unsupported';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  return Notification.requestPermission();
}

/**
 * @returns {NotificationPermission | 'unsupported'}
 */
export function getNotificationPermission() {
  if (typeof Notification === 'undefined') return 'unsupported';
  return Notification.permission;
}

/**
 * @param {NotificationPayload} payload
 * @returns {Promise<boolean>} 是否成功送出
 */
export async function showAppNotification(payload) {
  if (typeof Notification === 'undefined') return false;
  if (Notification.permission !== 'granted') return false;

  const options = {
    body: payload.body,
    tag: payload.tag,
    renotify: true,
    vibrate: [200, 100, 200],
    badge: '/icon-32.png',
    icon: '/icon-192.png',
    data: { ...(payload.data || {}), priority: 'high' },
  };

  let delivered = false;

  // SW 優先：lockscreen / background 也能彈
  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.ready;
      await reg.showNotification(payload.title, options);
      delivered = true;
    }
  } catch (err) {
    if (import.meta.env.DEV) console.warn('[notifications] SW showNotification failed:', err);
  }

  // window fallback：foreground only
  if (!delivered) {
    try {
      // eslint-disable-next-line no-new
      new Notification(payload.title, options);
      delivered = true;
    } catch (err) {
      if (import.meta.env.DEV) console.warn('[notifications] window.Notification failed:', err);
    }
  }

  if (delivered && payload.recordKey) {
    try {
      useNotificationStore().record(payload.recordKey, payload.title, payload.body);
    } catch {
      /* Pinia 未 mount（測試）— 忽略 */
    }
  }

  return delivered;
}

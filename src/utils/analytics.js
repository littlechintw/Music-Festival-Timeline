// @ts-check
// Google Analytics 是 progressive enhancement：
// - 沒有 measurement id 直接 noop
// - 使用者在設定關閉 analytics 也直接 noop
// - 離線時不送 event
const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;

let initialized = false;

function isOnline() {
  return typeof navigator === 'undefined' ? true : navigator.onLine;
}

function shouldTrack() {
  if (!GA_MEASUREMENT_ID) return false;
  try {
    if (localStorage.getItem('enableAnalytics') === 'false') return false;
  } catch {
    /* localStorage unavailable — fall through */
  }
  return isOnline();
}

export function initGA() {
  if (!shouldTrack() || initialized) return;
  initialized = true;

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  /** @type {any} */
  const gtag = function () {
    window.dataLayer.push(arguments);
  };
  window.gtag = gtag;
  gtag('js', new Date());
  gtag('config', GA_MEASUREMENT_ID);
}

/**
 * @param {string} path
 * @param {string} title
 */
export function trackPageView(path, title) {
  if (!shouldTrack() || typeof window.gtag !== 'function') return;
  window.gtag('config', GA_MEASUREMENT_ID, { page_path: path, page_title: title });
}

/**
 * @param {string} eventName
 * @param {Record<string, unknown>} [params]
 */
export function trackEvent(eventName, params = {}) {
  if (!shouldTrack() || typeof window.gtag !== 'function') return;
  window.gtag('event', eventName, params);
}

// @ts-check
import { ref, computed } from 'vue';

const DISMISS_KEY = 'install-prompt-dismissed-at';
const DISMISS_DAYS = 14;

/** @type {import('vue').Ref<any>} beforeinstallprompt 事件（Chromium 系才有） */
const deferredEvent = ref(null);
const installed = ref(false);
const dismissedAt = ref(readDismissed());

function readDismissed() {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    return raw ? Number(raw) : 0;
  } catch {
    return 0;
  }
}

export function isStandalone() {
  if (typeof window === 'undefined') return false;
  // iOS Safari 用 navigator.standalone；其他瀏覽器用 display-mode media query
  // @ts-ignore: iOS 專屬
  if (window.navigator.standalone === true) return true;
  return window.matchMedia?.('(display-mode: standalone)')?.matches ?? false;
}

export function isIos() {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  // iPadOS 13+ 的 UA 會偽裝成 Mac，補用 touch points 判斷
  return /iPhone|iPad|iPod/.test(ua) || (ua.includes('Mac') && navigator.maxTouchPoints > 1);
}

let listening = false;
function startListening() {
  if (listening || typeof window === 'undefined') return;
  listening = true;
  window.addEventListener('beforeinstallprompt', (e) => {
    // 攔下瀏覽器預設的迷你資訊列，改由我們在合適的時機顯示
    e.preventDefault();
    deferredEvent.value = e;
  });
  window.addEventListener('appinstalled', () => {
    installed.value = true;
    deferredEvent.value = null;
  });
}

/**
 * 「安裝到主畫面」提示的狀態與動作。
 * - Chromium（Android Chrome / 桌面 Chrome、Edge）：可以直接呼叫原生安裝對話框。
 * - iOS Safari：沒有 API，只能顯示「分享 → 加入主畫面」的教學。
 * - 已安裝（standalone）或使用者最近關掉過：不顯示。
 */
export function useInstallPrompt() {
  startListening();

  const standalone = computed(() => installed.value || isStandalone());
  const canPromptNatively = computed(() => !!deferredEvent.value);
  const needsIosGuide = computed(() => !canPromptNatively.value && isIos());
  const recentlyDismissed = computed(
    () => dismissedAt.value > 0 && Date.now() - dismissedAt.value < DISMISS_DAYS * 86400000
  );
  const shouldShowBanner = computed(
    () => !standalone.value && !recentlyDismissed.value && (canPromptNatively.value || needsIosGuide.value)
  );

  /** @returns {Promise<'accepted' | 'dismissed' | 'unavailable'>} */
  async function promptInstall() {
    const evt = deferredEvent.value;
    if (!evt) return 'unavailable';
    try {
      await evt.prompt();
      const choice = await evt.userChoice;
      if (choice?.outcome === 'accepted') {
        installed.value = true;
        deferredEvent.value = null;
        return 'accepted';
      }
      return 'dismissed';
    } catch {
      return 'unavailable';
    } finally {
      // 每個 beforeinstallprompt 事件只能 prompt 一次
      deferredEvent.value = null;
    }
  }

  function dismissBanner() {
    dismissedAt.value = Date.now();
    try {
      localStorage.setItem(DISMISS_KEY, String(dismissedAt.value));
    } catch {}
  }

  return {
    standalone,
    canPromptNatively,
    needsIosGuide,
    shouldShowBanner,
    promptInstall,
    dismissBanner,
  };
}

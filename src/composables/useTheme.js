// @ts-check
import { ref, watch, onMounted, onUnmounted } from 'vue';

/** @typedef {'auto' | 'light' | 'dark'} ThemePref */

const THEME_KEY = 'theme-pref-v1';

/**
 * @returns {ThemePref}
 */
function readPref() {
  try {
    const v = localStorage.getItem(THEME_KEY);
    if (v === 'light' || v === 'dark' || v === 'auto') return v;
  } catch {}
  return 'auto';
}

function applyClass(isDark) {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.toggle('dark', isDark);
}

function prefersDark() {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

// 模組級單一狀態，所有 component 共用
const pref = ref(/** @type {ThemePref} */ (readPref()));
const isDark = ref(false);
let mediaCleanup = null;

function compute() {
  if (pref.value === 'dark') return true;
  if (pref.value === 'light') return false;
  return prefersDark();
}

function recompute() {
  isDark.value = compute();
  applyClass(isDark.value);
}

watch(pref, (v) => {
  try {
    localStorage.setItem(THEME_KEY, v);
  } catch {}
  recompute();
});

function startMediaListener() {
  if (typeof window === 'undefined' || !window.matchMedia) return;
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  const handler = () => {
    if (pref.value === 'auto') recompute();
  };
  mq.addEventListener?.('change', handler);
  mediaCleanup = () => mq.removeEventListener?.('change', handler);
}

// 第一次 import 時就套上正確的 class，避免閃白
if (typeof window !== 'undefined') {
  recompute();
}

export function useTheme() {
  onMounted(() => {
    if (!mediaCleanup) startMediaListener();
    recompute();
  });
  onUnmounted(() => {
    // 不真的清掉 listener — 模組級狀態跟著 app 生命週期
  });

  /** @param {ThemePref} v */
  function setPref(v) {
    pref.value = v;
  }

  return { pref, isDark, setPref };
}

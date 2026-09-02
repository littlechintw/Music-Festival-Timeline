<template>
  <div
    class="min-h-screen flex flex-col bg-[var(--md-sys-color-background)] text-[var(--md-sys-color-on-background)]"
  >
    <OfflineBanner />

    <!-- 頂欄：手機只放 App 名稱＋連線狀態；桌面版把主導覽放在右邊 -->
    <header
      class="w-full sticky top-0 z-40 bg-[var(--md-sys-color-surface-container-highest)] text-[var(--md-sys-color-on-surface)] shadow-md pt-safe"
    >
      <nav class="max-w-5xl mx-auto px-4 h-14 flex items-center gap-1" aria-label="主要導覽">
        <router-link
          to="/"
          class="relative flex items-center gap-2 font-bold tracking-wide mr-3 shrink-0 rounded-md px-2 py-1 hover:opacity-80 transition overflow-hidden"
          aria-label="回首頁"
        >
          <md-ripple></md-ripple>
          <MdIcon name="music_note" class="text-xl" />
          <span>音樂祭行程</span>
        </router-link>

        <span
          v-if="!isOnline"
          class="md:hidden ml-auto inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-[var(--md-sys-color-tertiary-container)] text-[var(--md-sys-color-on-tertiary-container)]"
          aria-label="目前離線"
        >
          <MdIcon name="wifi_off" style="--md-icon-size: 14px" />
          離線
        </span>

        <div class="hidden md:flex items-center gap-1 ml-auto shrink-0">
          <router-link
            v-for="item in navItems"
            :key="item.to"
            :to="item.to"
            class="relative px-3 py-1.5 rounded-md text-sm font-medium transition-colors shrink-0 flex items-center gap-1 overflow-hidden"
            :class="
              isActive(item)
                ? 'bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)]'
                : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container-high)]'
            "
          >
            <md-ripple></md-ripple>
            <MdIcon :name="item.icon" />
            <span>{{ item.label }}</span>
            <span
              v-if="item.to === '/plan' && planStore.planCount > 0"
              class="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-[var(--md-sys-color-tertiary)] text-[var(--md-sys-color-on-tertiary)]"
              :aria-label="`已加入 ${planStore.planCount} 場`"
            >
              {{ planStore.planCount }}
            </span>
          </router-link>
        </div>
      </nav>
    </header>

    <!-- 手機版：內容底部留出底部導覽的高度，避免最後一張卡被蓋住 -->
    <main class="flex-1 pb-safe pb-nav md:pb-0">
      <router-view />
    </main>

    <!-- 底部導覽（手機）：拇指可及、四個主要頁面、行程數量徽章 -->
    <nav
      class="md:hidden fixed bottom-0 inset-x-0 z-40 bg-[var(--md-sys-color-surface-container)] border-t border-[var(--md-sys-color-outline-variant)] pb-safe bottom-nav"
      aria-label="底部導覽"
    >
      <ul class="grid grid-cols-4 h-16">
        <li v-for="item in navItems" :key="item.to" class="min-w-0">
          <router-link
            :to="item.to"
            class="relative h-full w-full flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors overflow-hidden"
            :class="
              isActive(item)
                ? 'text-[var(--md-sys-color-on-surface)]'
                : 'text-[var(--md-sys-color-on-surface-variant)]'
            "
            :aria-current="isActive(item) ? 'page' : undefined"
          >
            <md-ripple></md-ripple>
            <span
              class="relative flex items-center justify-center w-14 h-7 rounded-full transition-colors"
              :class="isActive(item) ? 'bg-[var(--md-sys-color-secondary-container)]' : ''"
            >
              <MdIcon :name="item.icon" style="--md-icon-size: 22px" />
              <span
                v-if="item.to === '/plan' && planStore.planCount > 0"
                class="absolute -top-1 right-1 min-w-[16px] h-4 px-1 rounded-full text-[10px] leading-4 font-bold text-center bg-[var(--md-sys-color-tertiary)] text-[var(--md-sys-color-on-tertiary)]"
                :aria-label="`已加入 ${planStore.planCount} 場`"
              >
                {{ planStore.planCount > 99 ? '99+' : planStore.planCount }}
              </span>
            </span>
            <span>{{ item.label }}</span>
          </router-link>
        </li>
      </ul>
    </nav>

    <InvalidShowsModal />
    <UpdatePrompt />
    <ToastContainer />
    <ConfirmDialog />
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useFestivalStore } from './stores/festival';
import { usePlanStore } from './stores/plan';
import { useSavedPlansStore } from './stores/savedPlans';
import { useSettingsStore } from './stores/settings';
import { startReminderService } from './utils/reminders';
import { initGA } from './utils/analytics';
import { registerPeriodicSync } from './pwa/periodicSync';
import OfflineBanner from './components/OfflineBanner.vue';
import InvalidShowsModal from './components/InvalidShowsModal.vue';
import UpdatePrompt from './components/UpdatePrompt.vue';
import ToastContainer from './components/ToastContainer.vue';
import ConfirmDialog from './components/ConfirmDialog.vue';
import MdIcon from './components/MdIcon.vue';
import { useTheme } from './composables/useTheme';
import { useOnline } from './composables/useOnline';

// 啟動 theme：監聽 prefers-color-scheme 並套上 .dark class
useTheme();

const route = useRoute();
const { isOnline } = useOnline();

// 「新增音樂祭」是貢獻者用的工具，不放在主導覽；入口在設定頁與音樂祭列表底部。
const navItems = [
  { to: '/', label: '音樂祭', icon: 'festival' },
  { to: '/plan', label: '行程', icon: 'calendar_month' },
  { to: '/artists', label: '藝人', icon: 'mic' },
  { to: '/settings', label: '設定', icon: 'settings' },
];

function isActive(item) {
  if (item.to === '/') return route.path === '/' || route.path.startsWith('/festival/');
  if (item.to === '/settings') return route.path === '/settings' || route.path === '/editor';
  return route.path === item.to || route.path.startsWith(item.to + '/');
}

const festivalStore = useFestivalStore();
const planStore = usePlanStore();
const savedPlansStore = useSavedPlansStore();
const settingsStore = useSettingsStore();

let stopReminders = null;
let refreshTimer = null;

// visibility-aware：背景時不跑，回到前景時看是不是該重抓
function scheduleRefresh() {
  clearRefresh();
  refreshTimer = setInterval(() => {
    if (document.hidden) return;
    festivalStore.ensureLoaded();
  }, festivalStore.REFRESH_INTERVAL_MS);
}

function clearRefresh() {
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }
}

function handleVisibility() {
  if (document.hidden) {
    clearRefresh();
  } else {
    // 回到前景 → 看看上次同步是不是已經過期
    festivalStore.ensureLoaded();
    scheduleRefresh();
  }
}

function handleOnline() {
  // 一上線就立刻強制檢查
  festivalStore.ensureLoaded({ force: true });
}

onMounted(async () => {
  planStore.loadFromStorage();
  savedPlansStore.loadFromStorage();
  await festivalStore.ensureLoaded();
  planStore.validatePlan(festivalStore.getFestivals);
  stopReminders = startReminderService();

  scheduleRefresh();
  document.addEventListener('visibilitychange', handleVisibility);
  window.addEventListener('online', handleOnline);

  // 嘗試註冊背景同步（Chromium PWA 使用者才會生效）
  registerPeriodicSync().then((result) => {
    if (import.meta.env.DEV) console.log('[periodic-sync]', result);
  });
});

onBeforeUnmount(() => {
  if (stopReminders) stopReminders();
  clearRefresh();
  document.removeEventListener('visibilitychange', handleVisibility);
  window.removeEventListener('online', handleOnline);
});

watch(
  () => settingsStore.enableAnalytics,
  (val) => {
    if (val) initGA();
  }
);
</script>


<style scoped>
/* 固定底欄自成一個合成圖層：捲動時不會跟內容一起重繪、也避免某些瀏覽器把它的文字殘影畫到別處 */
.bottom-nav {
  transform: translateZ(0);
}
</style>

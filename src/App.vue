<template>
  <div class="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
    <OfflineBanner />
    <header
      class="w-full sticky top-0 z-40 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 dark:from-black dark:via-slate-900 dark:to-black text-white shadow-md pt-safe"
    >
      <nav
        class="max-w-5xl mx-auto px-4 h-14 flex items-center gap-1 overflow-x-auto"
        aria-label="主要導覽"
      >
        <router-link
          to="/"
          class="flex items-center gap-2 font-bold tracking-wide mr-3 shrink-0 hover:opacity-80 transition"
          aria-label="回首頁"
        >
          <span class="text-xl" aria-hidden="true">🎵</span>
          <span class="hidden sm:inline">音樂祭行程</span>
        </router-link>

        <div class="flex items-center gap-1 ml-auto shrink-0">
          <router-link
            v-for="item in navItems"
            :key="item.to"
            :to="item.to"
            class="relative px-3 py-1.5 rounded-md text-sm font-medium transition-colors shrink-0 flex items-center gap-1"
            :class="
              isActive(item)
                ? 'bg-white/15 text-white'
                : 'text-slate-200 hover:text-white hover:bg-white/10'
            "
          >
            <span aria-hidden="true">{{ item.icon }}</span>
            <span>{{ item.label }}</span>
            <span
              v-if="item.to === '/plan' && planStore.planCount > 0"
              class="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500 text-white"
              aria-label="`已加入 ${planStore.planCount} 場`"
            >
              {{ planStore.planCount }}
            </span>
          </router-link>
        </div>
      </nav>
    </header>

    <main class="flex-1 pb-safe">
      <router-view />
    </main>

    <InvalidShowsModal />
    <UpdatePrompt />
    <ToastContainer />
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useFestivalStore } from './stores/festival';
import { usePlanStore } from './stores/plan';
import { useSettingsStore } from './stores/settings';
import { startReminderService } from './utils/reminders';
import { initGA } from './utils/analytics';
import { registerPeriodicSync } from './pwa/periodicSync';
import OfflineBanner from './components/OfflineBanner.vue';
import InvalidShowsModal from './components/InvalidShowsModal.vue';
import UpdatePrompt from './components/UpdatePrompt.vue';
import ToastContainer from './components/ToastContainer.vue';
import { useTheme } from './composables/useTheme';

// 啟動 theme：監聽 prefers-color-scheme 並套上 .dark class
useTheme();

const route = useRoute();

const navItems = [
  { to: '/', label: '音樂祭', icon: '🎪' },
  { to: '/plan', label: '行程', icon: '📅' },
  { to: '/artists', label: '藝人', icon: '🎤' },
  { to: '/settings', label: '設定', icon: '⚙️' },
  { to: '/editor', label: '新增', icon: '➕' },
];

function isActive(item) {
  if (item.to === '/') return route.path === '/' || route.path.startsWith('/festival/');
  return route.path === item.to || route.path.startsWith(item.to + '/');
}

const festivalStore = useFestivalStore();
const planStore = usePlanStore();
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


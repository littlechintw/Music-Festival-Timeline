<template>
  <div class="min-h-screen flex flex-col bg-[var(--md-sys-color-background)] text-[var(--md-sys-color-on-background)]">
    <OfflineBanner />
    <header
      class="w-full sticky top-0 z-40 bg-[var(--md-sys-color-surface-container-highest)] text-[var(--md-sys-color-on-surface)] shadow-md pt-safe"
    >
      <nav
        class="max-w-5xl mx-auto px-4 h-14 flex items-center gap-1 overflow-x-auto"
        aria-label="主要導覽"
      >
        <router-link
          to="/"
          class="relative flex items-center gap-2 font-bold tracking-wide mr-3 shrink-0 rounded-md px-2 py-1 hover:opacity-80 transition overflow-hidden"
          aria-label="回首頁"
        >
          <md-ripple></md-ripple>
          <MdIcon name="music_note" class="text-xl" />
          <span class="hidden sm:inline">音樂祭行程</span>
        </router-link>

        <div class="flex items-center gap-1 ml-auto shrink-0">
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
    <ConfirmDialog />
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
import ConfirmDialog from './components/ConfirmDialog.vue';
import MdIcon from './components/MdIcon.vue';
import { useTheme } from './composables/useTheme';

// 啟動 theme：監聽 prefers-color-scheme 並套上 .dark class
useTheme();

const route = useRoute();

const navItems = [
  { to: '/', label: '音樂祭', icon: 'festival' },
  { to: '/plan', label: '行程', icon: 'calendar_month' },
  { to: '/artists', label: '藝人', icon: 'mic' },
  { to: '/settings', label: '設定', icon: 'settings' },
  { to: '/editor', label: '新增', icon: 'add_circle' },
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


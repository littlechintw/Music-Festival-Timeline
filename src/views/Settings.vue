<template>
  <div class="p-4 max-w-2xl mx-auto">
    <h1 class="text-2xl font-bold mb-2 text-gray-900 dark:text-gray-100">設定</h1>

    <AccordionSection title="顯示設定" default-open>
      <template #icon><MdIcon name="palette" /></template>
      <div class="flex items-center justify-between mb-4">
        <div>
          <h3 class="font-medium text-gray-800 dark:text-gray-200">時間格式</h3>
          <p class="text-sm text-gray-500 dark:text-gray-400">切換 12 小時制與 24 小時制</p>
        </div>
        <div
          class="flex items-center gap-2 bg-[var(--md-sys-color-surface-container-high)] p-1 rounded-lg"
        >
          <button :class="timeBtn(settingsStore.is24Hour)" @click="settingsStore.set24Hour(true)">
            24 小時
          </button>
          <button :class="timeBtn(!settingsStore.is24Hour)" @click="settingsStore.set24Hour(false)">
            12 小時
          </button>
        </div>
      </div>

      <div class="flex items-center justify-between mb-4">
        <div>
          <h3 class="font-medium text-gray-800 dark:text-gray-200">深色模式</h3>
          <p class="text-sm text-gray-500 dark:text-gray-400">跟隨系統、或手動切換</p>
        </div>
        <div
          class="flex items-center gap-1 bg-[var(--md-sys-color-surface-container-high)] p-1 rounded-lg"
        >
          <button
            v-for="opt in themeOptions"
            :key="opt.value"
            :class="themeBtn(pref === opt.value)"
            :aria-pressed="pref === opt.value"
            @click="setPref(opt.value)"
          >
            {{ opt.label }}
          </button>
        </div>
      </div>

      <label class="flex items-center justify-between cursor-pointer group">
        <div class="pr-4">
          <h3
            class="font-medium text-gray-800 dark:text-gray-200 group-hover:text-blue-600 transition"
          >
            時間軸團名跑馬燈動畫
          </h3>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            關掉後，過長的團名會直接截斷顯示，不會左右捲動
          </p>
        </div>
        <md-switch
          :selected="settingsStore.enableMarqueeAnimation"
          @change="(e) => settingsStore.setEnableMarqueeAnimation(e.target.selected)"
        ></md-switch>
      </label>
    </AccordionSection>

    <AccordionSection title="通知設定">
      <template #icon><MdIcon name="notifications" /></template>
      <div class="flex items-center justify-between mb-4">
        <div>
          <span class="block text-gray-800 dark:text-gray-200 font-medium">
            推播權限狀態：<span :class="notifStatusClass">{{ notifStatusText }}</span>
          </span>
        </div>
        <md-filled-button type="button" v-if="notifStatus !== 'granted'" @click="requestNotif">
          請求權限
        </md-filled-button>
        <md-filled-button type="button" v-else @click="testNotification">
          測試推播
        </md-filled-button>
      </div>

      <div class="flex flex-col gap-5 mt-4">
        <label class="flex items-center justify-between cursor-pointer group">
          <div class="pr-4">
            <h3
              class="font-medium text-gray-800 dark:text-gray-200 group-hover:text-blue-600 transition"
            >
              音樂祭即將到來提醒
            </h3>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              在有加入行程的音樂祭開始前 7 天與 1 天發送通知
            </p>
          </div>
          <md-switch
            :selected="settingsStore.enableFestivalReminders"
            @change="(e) => settingsStore.setEnableFestivalReminders(e.target.selected)"
          ></md-switch>
        </label>

        <div>
          <div class="mb-2">
            <h3 class="font-medium text-gray-800 dark:text-gray-200">
              舞台演出提前通知時間（可多選）
            </h3>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              自訂您需要準備前往舞台的提醒觸發時間。（3 分鐘為最終防線）
            </p>
          </div>
          <div class="flex flex-wrap gap-2 mt-2">
            <md-filter-chip
              v-for="mins in REMINDER_OPTIONS"
              :key="mins"
              :label="`${mins} 分鐘前`"
              :selected="settingsStore.performanceReminderTimes.includes(mins)"
              @click="(e) => handleReminderTimeChange(mins, e.target.selected)"
            ></md-filter-chip>
          </div>
        </div>

        <md-text-button type="button" class="w-max" @click="showHistoryModal = true">
          查看歷史推播紀錄
        </md-text-button>
      </div>
    </AccordionSection>

    <AccordionSection title="離線資料管理">
      <template #icon><MdIcon name="wifi_tethering" /></template>
      <label class="flex items-center justify-between cursor-pointer group mb-4">
        <div class="pr-4">
          <h3 class="font-medium text-gray-800 dark:text-gray-200">自動將即將到來的活動存離線</h3>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            關掉後改成完全手動，已存的資料不會被自動移除。
          </p>
        </div>
        <md-switch
          :selected="offlineStore.mode === 'auto'"
          @change="(e) => offlineStore.setMode(e.target.selected ? 'auto' : 'manual')"
        ></md-switch>
      </label>

      <div class="text-xs text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-3 flex-wrap">
        <span v-if="usage">
          已用 {{ formatBytes(usage.usage)
          }}<span v-if="usage.quota"> / 可用 {{ formatBytes(usage.quota) }}</span>
        </span>
        <span v-if="lastSyncedLabel">最後同步 {{ lastSyncedLabel }}</span>
        <md-text-button type="button" class="ml-auto" :disabled="syncing" @click="checkNow">
          {{ syncing ? '檢查中…' : '立即檢查更新' }}
        </md-text-button>
      </div>

      <div v-if="indexEntries.length === 0" class="text-sm text-gray-400 py-4">
        尚未載入活動索引，請先連線。
      </div>
      <ul v-else class="divide-y divide-gray-100 dark:divide-gray-700 -mt-1">
        <li
          v-for="entry in indexEntries"
          :key="entry.festivalId"
          class="py-3 flex items-start justify-between gap-3"
        >
          <div class="min-w-0 flex-1">
            <div class="font-medium text-gray-800 dark:text-gray-200 truncate">
              {{ entry.name }}
            </div>
            <div
              class="text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex flex-wrap gap-x-3 gap-y-1"
            >
              <span>{{ formatDateShort(entry.startTime) }}</span>
              <span>{{ formatBytes(entry.bytes) }}</span>
              <span :class="statusInfo(entry).class">{{ statusInfo(entry).label }}</span>
              <span v-if="entry.status === 'upcoming'" class="text-blue-600">即將到來</span>
            </div>
          </div>
          <div class="flex gap-2 items-center shrink-0">
            <button
              v-if="!isCached(entry)"
              class="px-3 py-1 text-xs rounded bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] disabled:opacity-50"
              :disabled="busyIds.has(entry.festivalId) || !navigatorOnline"
              @click="onDownload(entry)"
            >
              {{ busyIds.has(entry.festivalId) ? '下載中…' : '存到離線' }}
            </button>
            <button
              v-else-if="hasUpdate(entry)"
              class="px-3 py-1 text-xs rounded bg-[var(--md-sys-color-tertiary)] text-[var(--md-sys-color-on-tertiary)] disabled:opacity-50"
              :disabled="busyIds.has(entry.festivalId) || !navigatorOnline"
              @click="onDownload(entry)"
            >
              更新
            </button>
            <button
              v-if="isCached(entry)"
              class="px-3 py-1 text-xs rounded border border-[var(--md-sys-color-outline)] text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] disabled:opacity-50"
              :disabled="busyIds.has(entry.festivalId)"
              @click="onRemove(entry)"
            >
              移除
            </button>
          </div>
        </li>
      </ul>
    </AccordionSection>

    <AccordionSection title="隱私">
      <template #icon><MdIcon name="lock" /></template>
      <label class="flex items-center justify-between cursor-pointer group">
        <div class="pr-4">
          <h3
            class="font-medium text-gray-800 dark:text-gray-200 group-hover:text-blue-600 transition"
          >
            傳送匿名使用統計
          </h3>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            開啟後會把瀏覽紀錄等匿名事件送到 Google Analytics。離線時不會傳送。
          </p>
        </div>
        <md-switch
          :selected="settingsStore.enableAnalytics"
          @change="(e) => settingsStore.setEnableAnalytics(e.target.selected)"
        ></md-switch>
      </label>
    </AccordionSection>

    <AccordionSection title="資料管理">
      <template #icon><MdIcon name="delete" /></template>
      <div class="flex flex-col gap-3">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="font-medium text-gray-800 dark:text-gray-200">重設我的行程</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400">清空所有您已經加入的演出</p>
          </div>
          <md-filled-button
            type="button"
            style="
              --md-sys-color-primary: var(--md-sys-color-error);
              --md-sys-color-on-primary: var(--md-sys-color-on-error);
            "
            @click="resetPlan"
          >
            清空行程
          </md-filled-button>
        </div>

        <div class="flex items-center justify-between">
          <div>
            <h3 class="font-medium text-gray-800 dark:text-gray-200">清除離線快取</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400">當網頁顯示異常或無法更新時使用</p>
          </div>
          <md-outlined-button type="button" @click="clearCache"> 清除快取 </md-outlined-button>
        </div>
      </div>
    </AccordionSection>

    <BaseModal v-model="showHistoryModal">
      <template #headline>
        <div class="flex items-center justify-between gap-2">
          <span class="flex items-center gap-2">
            <MdIcon name="schedule" />
            歷史推播紀錄
          </span>
          <md-icon-button aria-label="關閉" @click="showHistoryModal = false">
            <MdIcon name="close" />
          </md-icon-button>
        </div>
      </template>

      <div v-if="notificationStore.history.length > 0" class="space-y-4">
        <div
          v-for="item in notificationStore.history"
          :key="item.timestamp"
          class="border border-gray-100 dark:border-gray-700 rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors shadow-sm"
        >
          <div class="flex justify-between items-start mb-2">
            <span class="font-bold text-gray-800 dark:text-gray-100 text-sm">{{ item.title }}</span>
            <span
              class="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full whitespace-nowrap"
            >
              {{ formatTimestamp(item.timestamp) }}
            </span>
          </div>
          <p class="text-sm text-gray-600 dark:text-gray-300">{{ item.body }}</p>
        </div>
      </div>
      <div v-else class="text-center text-gray-400 py-10">尚無歷史推播紀錄</div>

      <template #actions>
        <md-filled-tonal-button
          type="button"
          style="
            --md-sys-color-secondary-container: var(--md-sys-color-error-container);
            --md-sys-color-on-secondary-container: var(--md-sys-color-on-error-container);
          "
          :disabled="notificationStore.history.length === 0"
          @click="handleClearHistory"
        >
          清除紀錄
        </md-filled-tonal-button>
        <md-filled-button type="button" @click="showHistoryModal = false">關閉</md-filled-button>
      </template>
    </BaseModal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { usePlanStore } from '../stores/plan';
import { useSettingsStore } from '../stores/settings';
import { useNotificationStore } from '../stores/notifications';
import { useFestivalStore } from '../stores/festival';
import { useOfflineStore } from '../stores/offline';
import { useOfflineActions, formatBytes } from '../composables/useOfflineActions';
import { useTheme } from '../composables/useTheme';
import { useToast } from '../composables/useToast';
import { useConfirm } from '../composables/useConfirm';
import AccordionSection from '../components/AccordionSection.vue';
import MdIcon from '../components/MdIcon.vue';
import BaseModal from '../components/BaseModal.vue';

const REMINDER_OPTIONS = [1, 3, 5, 10, 15, 30, 60];

const planStore = usePlanStore();
const settingsStore = useSettingsStore();
const notificationStore = useNotificationStore();
const festivalStore = useFestivalStore();
const offlineStore = useOfflineStore();
const { usage, refreshUsage, download, remove, getCachedHashMap } = useOfflineActions();
const { pref, setPref } = useTheme();
const { showToast } = useToast();
const { confirm } = useConfirm();

const themeOptions = [
  { value: 'auto', label: '系統' },
  { value: 'light', label: '亮色' },
  { value: 'dark', label: '深色' },
];

const showHistoryModal = ref(false);

const notifStatus = ref(typeof Notification !== 'undefined' ? Notification.permission : 'default');
const notifStatusText = computed(() => {
  if (notifStatus.value === 'granted') return '已允許';
  if (notifStatus.value === 'denied') return '已拒絕';
  return '尚未取得通知權限';
});
const notifStatusClass = computed(() => {
  if (notifStatus.value === 'granted') return 'text-green-600';
  if (notifStatus.value === 'denied') return 'text-red-600';
  return 'text-gray-500';
});

const cachedHashes = ref(getCachedHashMap());
const busyIds = ref(new Set());
const syncing = ref(false);
const navigatorOnline = ref(typeof navigator === 'undefined' ? true : navigator.onLine);

function refreshHashes() {
  cachedHashes.value = getCachedHashMap();
}

const indexEntries = computed(() => festivalStore.index?.festivals || []);

const lastSyncedLabel = computed(() => {
  if (!festivalStore.lastSyncedAt) return '';
  const diffMin = Math.round((Date.now() - festivalStore.lastSyncedAt) / 60000);
  if (diffMin < 1) return '剛剛';
  if (diffMin < 60) return `${diffMin} 分鐘前`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} 小時前`;
  return `${Math.floor(diffHr / 24)} 天前`;
});

function isCached(entry) {
  return entry.festivalId in cachedHashes.value;
}

function hasUpdate(entry) {
  return isCached(entry) && cachedHashes.value[entry.festivalId] !== entry.hash;
}

function statusInfo(entry) {
  if (!isCached(entry)) return { label: '未離線', class: 'text-gray-500' };
  if (hasUpdate(entry)) return { label: '可更新', class: 'text-amber-600 font-medium' };
  return { label: '已離線', class: 'text-green-600 font-medium' };
}

function formatDateShort(iso) {
  return new Date(iso).toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

async function onDownload(entry) {
  busyIds.value.add(entry.festivalId);
  busyIds.value = new Set(busyIds.value);
  try {
    await download(entry);
    refreshHashes();
    showToast({ message: `已存到離線：${entry.name}`, kind: 'success' });
  } catch (err) {
    console.error(err);
    showToast({ message: '下載失敗，請稍後再試', kind: 'error' });
  } finally {
    busyIds.value.delete(entry.festivalId);
    busyIds.value = new Set(busyIds.value);
  }
}

async function onRemove(entry) {
  const ok = await confirm(`確定要從離線快取中移除「${entry.name}」嗎？`, { confirmLabel: '移除' });
  if (!ok) return;
  busyIds.value.add(entry.festivalId);
  busyIds.value = new Set(busyIds.value);
  try {
    await remove(entry);
    refreshHashes();
    showToast({ message: `已從離線移除：${entry.name}` });
  } finally {
    busyIds.value.delete(entry.festivalId);
    busyIds.value = new Set(busyIds.value);
  }
}

async function checkNow() {
  syncing.value = true;
  try {
    await festivalStore.ensureLoaded({ force: true });
    refreshHashes();
    await refreshUsage();
    showToast({ message: '已檢查更新' });
  } finally {
    syncing.value = false;
  }
}

function handleOnlineChange() {
  navigatorOnline.value = navigator.onLine;
}

async function requestNotif() {
  const res = await planStore.requestNotificationPermission();
  notifStatus.value = res;
}

function testNotification() {
  planStore.sendNotification({
    title: '🎵 測試推播',
    body: '如果你看到這則通知，代表推播功能運作正常！',
    tag: 'test_notification',
  });
}

function handleReminderTimeChange(mins, selected) {
  const current = [...settingsStore.performanceReminderTimes];
  if (selected) {
    if (!current.includes(mins)) current.push(mins);
  } else {
    const idx = current.indexOf(mins);
    if (idx > -1) current.splice(idx, 1);
  }
  settingsStore.setPerformanceReminderTimes(current);
}

function formatTimestamp(ts) {
  return new Date(ts).toLocaleString('zh-TW', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: !settingsStore.is24Hour,
  });
}

async function handleClearHistory() {
  const ok = await confirm(
    '確定要清除所有通知歷史紀錄嗎？這會讓之前已推播過的通知在條件達到時重新推播。',
    { confirmLabel: '清除', danger: true }
  );
  if (ok) notificationStore.clearAll();
}

async function resetPlan() {
  const ok = await confirm('確定要重設我的行程？', {
    title: '清空行程',
    confirmLabel: '清空',
    danger: true,
  });
  if (ok) planStore.clearPlan();
}

async function clearCache() {
  if ('caches' in window) {
    const keys = await caches.keys();
    await Promise.all(keys.map((key) => caches.delete(key)));
    showToast({ message: '快取已清除', kind: 'success' });
  }
}

function timeBtn(active) {
  return [
    'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
    active
      ? 'bg-[var(--md-sys-color-surface-container-lowest)] text-[var(--md-sys-color-primary)] shadow'
      : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]',
  ];
}

function themeBtn(active) {
  return [
    'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
    active
      ? 'bg-[var(--md-sys-color-surface-container-lowest)] text-[var(--md-sys-color-primary)] shadow'
      : 'text-[var(--md-sys-color-on-surface-variant)]',
  ];
}

onMounted(() => {
  festivalStore.refreshIndex();
  window.addEventListener('online', handleOnlineChange);
  window.addEventListener('offline', handleOnlineChange);
});

onUnmounted(() => {
  window.removeEventListener('online', handleOnlineChange);
  window.removeEventListener('offline', handleOnlineChange);
});
</script>

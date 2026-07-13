<template>
  <div class="p-4 max-w-2xl mx-auto">
    <h1 class="text-2xl font-bold mb-2 text-gray-900 dark:text-gray-100">設定</h1>

    <AccordionSection title="顯示設定" icon="🎨" default-open>
      <div class="flex items-center justify-between mb-4">
        <div>
          <h3 class="font-medium text-gray-800 dark:text-gray-200">時間格式</h3>
          <p class="text-sm text-gray-500 dark:text-gray-400">切換 12 小時制與 24 小時制</p>
        </div>
        <div class="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
          <button
            :class="timeBtn(settingsStore.is24Hour)"
            @click="settingsStore.set24Hour(true)"
          >
            24 小時
          </button>
          <button
            :class="timeBtn(!settingsStore.is24Hour)"
            @click="settingsStore.set24Hour(false)"
          >
            12 小時
          </button>
        </div>
      </div>

      <div class="flex items-center justify-between mb-4">
        <div>
          <h3 class="font-medium text-gray-800 dark:text-gray-200">深色模式</h3>
          <p class="text-sm text-gray-500 dark:text-gray-400">跟隨系統、或手動切換</p>
        </div>
        <div class="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
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
          <h3 class="font-medium text-gray-800 dark:text-gray-200 group-hover:text-blue-600 transition">
            時間軸團名跑馬燈動畫
          </h3>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            關掉後，過長的團名會直接截斷顯示，不會左右捲動
          </p>
        </div>
        <div class="relative shrink-0">
          <input
            type="checkbox"
            class="peer sr-only"
            role="switch"
            :checked="settingsStore.enableMarqueeAnimation"
            :aria-checked="settingsStore.enableMarqueeAnimation"
            @change="(e) => settingsStore.setEnableMarqueeAnimation(e.target.checked)"
          />
          <div class="block bg-gray-200 dark:bg-gray-600 w-12 h-7 rounded-full transition-colors duration-300 peer-checked:bg-blue-500" />
          <div class="absolute left-1 top-1 bg-white w-5 h-5 rounded-full transition-transform duration-300 shadow-sm peer-checked:translate-x-5" />
        </div>
      </label>
    </AccordionSection>

    <AccordionSection title="通知設定" icon="🔔">
      <div class="flex items-center justify-between mb-4">
        <div>
          <span class="block text-gray-800 dark:text-gray-200 font-medium">
            推播權限狀態：<span :class="notifStatusClass">{{ notifStatusText }}</span>
          </span>
        </div>
        <button
          v-if="notifStatus !== 'granted'"
          class="px-3 py-1.5 rounded-lg bg-green-600 text-white hover:bg-green-700 transition"
          @click="requestNotif"
        >
          請求權限
        </button>
        <button
          v-else
          class="px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
          @click="testNotification"
        >
          測試推播
        </button>
      </div>

      <div class="flex flex-col gap-5 mt-4">
        <label class="flex items-center justify-between cursor-pointer group">
          <div class="pr-4">
            <h3 class="font-medium text-gray-800 dark:text-gray-200 group-hover:text-blue-600 transition">
              音樂祭即將到來提醒
            </h3>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              在有加入行程的音樂祭開始前 7 天與 1 天發送通知
            </p>
          </div>
          <div class="relative shrink-0">
            <input
              type="checkbox"
              class="peer sr-only"
              role="switch"
              :checked="settingsStore.enableFestivalReminders"
              :aria-checked="settingsStore.enableFestivalReminders"
              @change="(e) => settingsStore.setEnableFestivalReminders(e.target.checked)"
            />
            <div class="block bg-gray-200 dark:bg-gray-600 w-12 h-7 rounded-full transition-colors duration-300 peer-checked:bg-blue-500" />
            <div class="absolute left-1 top-1 bg-white w-5 h-5 rounded-full transition-transform duration-300 shadow-sm peer-checked:translate-x-5" />
          </div>
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
            <label
              v-for="mins in REMINDER_OPTIONS"
              :key="mins"
              class="relative flex items-center justify-center"
            >
              <input
                type="checkbox"
                class="peer sr-only"
                :value="mins"
                :checked="settingsStore.performanceReminderTimes.includes(mins)"
                @change="handleReminderTimeChange"
              />
              <div
                :class="[
                  'px-3 py-1.5 rounded-lg border text-sm font-medium cursor-pointer transition-all duration-200',
                  settingsStore.performanceReminderTimes.includes(mins)
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-blue-400',
                ]"
              >
                {{ mins }} 分鐘前
              </div>
            </label>
          </div>
        </div>

        <button
          class="mt-2 text-blue-600 hover:text-blue-800 underline text-left w-max font-medium"
          @click="showHistoryModal = true"
        >
          查看歷史推播紀錄
        </button>
      </div>
    </AccordionSection>

    <AccordionSection title="離線資料管理" icon="📡">
      <label class="flex items-center justify-between cursor-pointer group mb-4">
        <div class="pr-4">
          <h3 class="font-medium text-gray-800 dark:text-gray-200">
            自動將即將到來的活動存離線
          </h3>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            關掉後改成完全手動，已存的資料不會被自動移除。
          </p>
        </div>
        <div class="relative shrink-0">
          <input
            type="checkbox"
            class="peer sr-only"
            role="switch"
            :checked="offlineStore.mode === 'auto'"
            :aria-checked="offlineStore.mode === 'auto'"
            @change="(e) => offlineStore.setMode(e.target.checked ? 'auto' : 'manual')"
          />
          <div class="block bg-gray-200 dark:bg-gray-600 w-12 h-7 rounded-full transition-colors duration-300 peer-checked:bg-blue-500" />
          <div class="absolute left-1 top-1 bg-white w-5 h-5 rounded-full transition-transform duration-300 shadow-sm peer-checked:translate-x-5" />
        </div>
      </label>

      <div class="text-xs text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-3 flex-wrap">
        <span v-if="usage">
          已用 {{ formatBytes(usage.usage) }}<span v-if="usage.quota">
            / 可用 {{ formatBytes(usage.quota) }}</span>
        </span>
        <span v-if="lastSyncedLabel">最後同步 {{ lastSyncedLabel }}</span>
        <button
          class="text-blue-600 hover:text-blue-800 underline ml-auto disabled:opacity-50"
          :disabled="syncing"
          @click="checkNow"
        >
          {{ syncing ? '檢查中…' : '立即檢查更新' }}
        </button>
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
            <div class="text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex flex-wrap gap-x-3 gap-y-1">
              <span>{{ formatDateShort(entry.startTime) }}</span>
              <span>{{ formatBytes(entry.bytes) }}</span>
              <span :class="statusInfo(entry).class">{{ statusInfo(entry).label }}</span>
              <span v-if="entry.status === 'upcoming'" class="text-blue-600">即將到來</span>
            </div>
          </div>
          <div class="flex gap-2 items-center shrink-0">
            <button
              v-if="!isCached(entry)"
              class="px-3 py-1 text-xs rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
              :disabled="busyIds.has(entry.festivalId) || !navigatorOnline"
              @click="onDownload(entry)"
            >
              {{ busyIds.has(entry.festivalId) ? '下載中…' : '存到離線' }}
            </button>
            <button
              v-else-if="hasUpdate(entry)"
              class="px-3 py-1 text-xs rounded bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50"
              :disabled="busyIds.has(entry.festivalId) || !navigatorOnline"
              @click="onDownload(entry)"
            >
              更新
            </button>
            <button
              v-if="isCached(entry)"
              class="px-3 py-1 text-xs rounded border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
              :disabled="busyIds.has(entry.festivalId)"
              @click="onRemove(entry)"
            >
              移除
            </button>
          </div>
        </li>
      </ul>
    </AccordionSection>

    <AccordionSection title="隱私" icon="🔒">
      <label class="flex items-center justify-between cursor-pointer group">
        <div class="pr-4">
          <h3 class="font-medium text-gray-800 dark:text-gray-200 group-hover:text-blue-600 transition">
            傳送匿名使用統計
          </h3>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            開啟後會把瀏覽紀錄等匿名事件送到 Google Analytics。離線時不會傳送。
          </p>
        </div>
        <div class="relative shrink-0">
          <input
            type="checkbox"
            class="peer sr-only"
            role="switch"
            :checked="settingsStore.enableAnalytics"
            :aria-checked="settingsStore.enableAnalytics"
            @change="(e) => settingsStore.setEnableAnalytics(e.target.checked)"
          />
          <div class="block bg-gray-200 dark:bg-gray-600 w-12 h-7 rounded-full transition-colors duration-300 peer-checked:bg-blue-500" />
          <div class="absolute left-1 top-1 bg-white w-5 h-5 rounded-full transition-transform duration-300 shadow-sm peer-checked:translate-x-5" />
        </div>
      </label>
    </AccordionSection>

    <AccordionSection title="資料管理" icon="🗑️">
      <div class="flex flex-col gap-3">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="font-medium text-gray-800 dark:text-gray-200">重設我的行程</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400">清空所有您已經加入的演出</p>
          </div>
          <button
            class="px-3 py-1.5 rounded-lg bg-red-500 text-white hover:bg-red-600 transition"
            @click="resetPlan"
          >
            清空行程
          </button>
        </div>

        <div class="flex items-center justify-between">
          <div>
            <h3 class="font-medium text-gray-800 dark:text-gray-200">清除離線快取</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400">當網頁顯示異常或無法更新時使用</p>
          </div>
          <button
            class="px-3 py-1.5 rounded-lg bg-yellow-500 text-white hover:bg-yellow-600 transition"
            @click="clearCache"
          >
            清除快取
          </button>
        </div>
      </div>
    </AccordionSection>

    <div
      v-if="showHistoryModal"
      class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm transition-opacity"
      role="dialog"
      aria-modal="true"
      aria-labelledby="history-title"
      @click.self="showHistoryModal = false"
    >
      <div
        class="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[80vh]"
      >
        <div class="px-5 py-4 border-b dark:border-gray-700 flex justify-between items-center bg-gray-50/80 dark:bg-gray-900/40">
          <h3 id="history-title" class="font-bold text-lg text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <span aria-hidden="true">🕒</span>
            歷史推播紀錄
          </h3>
          <button
            class="text-gray-400 hover:text-gray-800 dark:hover:text-gray-100 transition-colors p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700"
            aria-label="關閉"
            @click="showHistoryModal = false"
          >
            ✕
          </button>
        </div>
        <div class="p-5 overflow-y-auto flex-1">
          <div v-if="notificationStore.history.length > 0" class="space-y-4">
            <div
              v-for="item in notificationStore.history"
              :key="item.timestamp"
              class="border border-gray-100 dark:border-gray-700 rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors shadow-sm"
            >
              <div class="flex justify-between items-start mb-2">
                <span class="font-bold text-gray-800 dark:text-gray-100 text-sm">{{ item.title }}</span>
                <span class="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full whitespace-nowrap">
                  {{ formatTimestamp(item.timestamp) }}
                </span>
              </div>
              <p class="text-sm text-gray-600 dark:text-gray-300">{{ item.body }}</p>
            </div>
          </div>
          <div v-else class="text-center text-gray-400 py-10">
            尚無歷史推播紀錄
          </div>
        </div>
        <div class="px-5 py-4 border-t dark:border-gray-700 bg-gray-50/80 dark:bg-gray-900/40 flex justify-between items-center">
          <button
            class="text-sm text-red-600 hover:text-red-700 px-4 py-2 border border-red-200 dark:border-red-900 bg-white dark:bg-gray-800 rounded-lg transition-colors hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="notificationStore.history.length === 0"
            @click="handleClearHistory"
          >
            清除紀錄
          </button>
          <button
            class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-sm font-medium"
            @click="showHistoryModal = false"
          >
            關閉
          </button>
        </div>
      </div>
    </div>
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
import { useEscapeKey } from '../composables/useEscapeKey';
import { useTheme } from '../composables/useTheme';
import { useToast } from '../composables/useToast';
import AccordionSection from '../components/AccordionSection.vue';

const REMINDER_OPTIONS = [1, 3, 5, 10, 15, 30, 60];

const planStore = usePlanStore();
const settingsStore = useSettingsStore();
const notificationStore = useNotificationStore();
const festivalStore = useFestivalStore();
const offlineStore = useOfflineStore();
const { usage, refreshUsage, download, remove, getCachedHashMap } = useOfflineActions();
const { pref, setPref } = useTheme();
const { showToast } = useToast();

const themeOptions = [
  { value: 'auto', label: '系統' },
  { value: 'light', label: '亮色' },
  { value: 'dark', label: '深色' },
];

const showHistoryModal = ref(false);
useEscapeKey(showHistoryModal, () => (showHistoryModal.value = false));

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
  return new Date(iso).toLocaleDateString('zh-TW', { year: 'numeric', month: 'short', day: 'numeric' });
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
  if (!confirm(`確定要從離線快取中移除「${entry.name}」嗎？`)) return;
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

function handleReminderTimeChange(e) {
  const val = parseInt(e.target.value, 10);
  const current = [...settingsStore.performanceReminderTimes];
  if (e.target.checked) {
    if (!current.includes(val)) current.push(val);
  } else {
    const idx = current.indexOf(val);
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

function handleClearHistory() {
  if (confirm('確定要清除所有通知歷史紀錄嗎？這會讓之前已推播過的通知在條件達到時重新推播。')) {
    notificationStore.clearAll();
  }
}

function resetPlan() {
  if (confirm('確定要重設我的行程？')) {
    planStore.clearPlan();
  }
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
      ? 'bg-white dark:bg-gray-900 text-blue-600 shadow'
      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white',
  ];
}

function themeBtn(active) {
  return [
    'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
    active
      ? 'bg-white dark:bg-gray-900 text-blue-600 shadow'
      : 'text-gray-600 dark:text-gray-300',
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

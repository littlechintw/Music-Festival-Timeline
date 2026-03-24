
<template>
  <div class="p-4 max-w-2xl mx-auto">
        <!-- 音樂祭即將到來提醒 -->
        <label class="flex items-center justify-between cursor-pointer group">
        </label> <h1 class="text-2xl font-bold mb-4">設定</h1>

    <!-- 資料來源狀態橫幅 -->
    <div :class="['flex items-center gap-2 mb-6 px-4 py-3 rounded-lg text-sm font-medium', festivalStore.usingOfflineData ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-green-50 text-green-700 border border-green-200']">
      <span v-if="festivalStore.usingOfflineData">📴 目前使用離線資料</span>
      <span v-else>🌐 目前使用即時資料</span>
    </div>
    
    <div class="mb-6 border-b pb-6">
      <h2 class="font-bold text-lg mb-3">顯示設定</h2>
      <div class="flex items-center justify-between">
        <div>
          <h3 class="font-medium text-gray-800">時間格式</h3>
          <p class="text-sm text-gray-500">切換 12 小時制與 24 小時制</p>
        </div>
        <div class="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
          <button 
            @click="settingsStore.set24Hour(true)"
            :class="['px-3 py-1.5 rounded-md text-sm font-medium transition-colors', settingsStore.is24Hour ? 'bg-white text-blue-600 shadow' : 'text-gray-600 hover:text-gray-900']"
          >
            24 小時 (14:30)
          </button>
          <button 
            @click="settingsStore.set24Hour(false)"
            :class="['px-3 py-1.5 rounded-md text-sm font-medium transition-colors', !settingsStore.is24Hour ? 'bg-white text-blue-600 shadow' : 'text-gray-600 hover:text-gray-900']"
          >
            12 小時 (下午 2:30)
          </button>
        </div>
      </div>
    </div>

    <div class="mb-6 border-b pb-6">
      <h2 class="font-bold text-lg mb-3">通知設定</h2>
      <div class="flex items-center justify-between mb-4">
        <div>
          <span class="block text-gray-800 font-medium">推播權限狀態：<span :class="notifStatusClass">{{ notifStatusText }}</span></span>
        </div>
        <button v-if="notifStatus !== 'granted'" @click="requestNotif" class="px-3 py-1.5 rounded-lg bg-green-600 text-white hover:bg-green-700 transition">請求權限</button>
        <button v-else @click="testNotification" class="px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition">測試推播</button>
      </div>
      
      <!-- 提醒進階設定 -->
      <div class="flex flex-col gap-5 mt-4">
        <!-- 音樂祭即將到來提醒 -->
        <label class="flex items-center justify-between cursor-pointer group">
          <div class="pr-4">
            <h3 class="font-medium text-gray-800 group-hover:text-blue-600 transition">音樂祭即將到來提醒</h3>
            <p class="text-sm text-gray-500">在有加入行程的音樂祭開始前 7 天與 1 天發送通知</p>
          </div>
          <div class="relative shrink-0">
            <input type="checkbox" class="peer sr-only" :checked="settingsStore.enableFestivalReminders" @change="e => settingsStore.setEnableFestivalReminders(e.target.checked)" />
            <div class="block bg-gray-200 w-12 h-7 rounded-full transition-colors duration-300 peer-checked:bg-blue-500"></div>
            <div class="absolute left-1 top-1 bg-white w-5 h-5 rounded-full transition-transform duration-300 shadow-sm peer-checked:translate-x-5"></div>
          </div>
        </label>
        
        <!-- 舞台演出提前通知設定 (多選) -->
        <div>
          <div class="mb-2">
            <h3 class="font-medium text-gray-800">舞台演出提前通知時間 (可多選)</h3>
            <p class="text-sm text-gray-500">自訂您需要準備前往舞台的提醒觸發時間。（3分鐘為最終防線）</p>
          </div>
          
          <div class="flex flex-wrap gap-2 mt-2">
            <label v-for="mins in [1, 3, 5, 10, 15, 30, 60]" :key="mins" class="relative flex items-center justify-center">
              <input type="checkbox" 
                     class="peer sr-only" 
                     :value="mins" 
                     :checked="settingsStore.performanceReminderTimes.includes(mins)"
                     @change="handleReminderTimeChange"
              />
              <div :class="['px-3 py-1.5 rounded-lg border text-sm font-medium cursor-pointer transition-all duration-200', settingsStore.performanceReminderTimes.includes(mins) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400']">
                {{ mins }} 分鐘前
              </div>
            </label>
          </div>
        </div>

        <button @click="showHistoryModal = true" class="mt-2 text-blue-600 hover:text-blue-800 underline text-left w-max font-medium">
          查看歷史推播紀錄
        </button>
      </div>
    </div>

    <!-- 離線資料管理 -->
    <div class="mb-6 border-b pb-6">
      <h2 class="font-bold text-lg mb-3">離線資料管理</h2>
      <p class="text-sm text-gray-500 mb-4">下載音樂祭資料以便在無網路環境下使用。</p>
      <div v-if="festivalStore.festivalIndex.length === 0" class="text-gray-400 text-sm">目前沒有可用的音樂祭資料</div>
      <div v-else class="flex flex-col gap-3">
        <div v-for="entry in festivalStore.festivalIndex" :key="entry.eventid"
          class="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
          <div class="flex-1 min-w-0 mr-3">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="font-medium text-gray-800 text-sm">{{ entry.name }}</span>
              <span v-if="festivalStore.isAvailableOffline(entry.eventid)"
                class="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full shrink-0">✓ 離線可用</span>
            </div>
            <div class="text-xs text-gray-500 mt-0.5">{{ formatDate(entry.startTime) }} ~ {{ formatDate(entry.endTime) }}</div>
          </div>
          <div class="flex gap-2 shrink-0">
            <button
              v-if="!festivalStore.isAvailableOffline(entry.eventid)"
              @click="downloadFestival(entry.eventid)"
              :disabled="downloading[entry.eventid]"
              class="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ downloading[entry.eventid] ? '下載中...' : '下載' }}
            </button>
            <button
              v-else
              @click="deleteFestival(entry.eventid)"
              class="px-3 py-1.5 rounded-lg bg-red-100 text-red-600 text-xs hover:bg-red-200 transition"
            >
              刪除
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <div class="mb-6 border-b pb-6">
      <h2 class="font-bold text-lg mb-3">資料管理</h2>
      <div class="flex flex-col gap-3">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="font-medium text-gray-800">重設我的行程</h3>
            <p class="text-sm text-gray-500">清空所有您已經加入的演出</p>
          </div>
          <button @click="resetPlan" class="px-3 py-1.5 rounded-lg bg-red-500 text-white hover:bg-red-600 transition">清空行程</button>
        </div>

        <div class="flex items-center justify-between">
          <div>
            <h3 class="font-medium text-gray-800">清除離線快取</h3>
            <p class="text-sm text-gray-500">當網頁顯示異常或無法更新時使用</p>
          </div>
          <button @click="clearCache" class="px-3 py-1.5 rounded-lg bg-yellow-500 text-white hover:bg-yellow-600 transition">清除快取</button>
        </div>
      </div>
    </div>

    <!-- 歷史推播紀錄 Modal -->
    <div v-if="showHistoryModal" class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm transition-opacity" @click.self="showHistoryModal = false">
      <div class="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[80vh] transform transition-transform">
        <div class="px-5 py-4 border-b flex justify-between items-center bg-gray-50/80">
          <h3 class="font-bold text-lg text-gray-800 flex items-center gap-2">
            <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            歷史推播紀錄
          </h3>
          <button @click="showHistoryModal = false" class="text-gray-400 hover:text-gray-800 transition-colors p-1 rounded-md hover:bg-gray-200">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        
        <div class="p-5 overflow-y-auto flex-1 bg-white">
          <div v-if="notificationHistory.length > 0" class="space-y-4">
            <div v-for="item in notificationHistory" :key="item.timestamp" class="border border-gray-100 rounded-lg p-3 hover:bg-gray-50 transition-colors shadow-sm">
              <div class="flex justify-between items-start mb-2 group">
                <span class="font-bold text-gray-800 text-sm">{{ item.title }}</span>
                <span class="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full whitespace-nowrap">{{ formatTimestamp(item.timestamp) }}</span>
              </div>
              <p class="text-sm text-gray-600">{{ item.body }}</p>
            </div>
          </div>
          <div v-else class="text-center text-gray-400 py-10 flex flex-col items-center gap-3">
            <svg class="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path></svg>
            <span>尚無歷史推播紀錄</span>
          </div>
        </div>
        
        <div class="px-5 py-4 border-t bg-gray-50/80 flex justify-between items-center">
          <button @click="handleClearHistory" class="text-sm text-red-600 hover:text-red-700 px-4 py-2 border border-red-200 bg-white rounded-lg transition-colors hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white flex items-center gap-1" :disabled="notificationHistory.length===0">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
            清除紀錄
          </button>
          <button @click="showHistoryModal = false" class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-sm font-medium">關閉</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, reactive } from 'vue';
import { usePlanStore } from '../stores/plan';
import { useSettingsStore } from '../stores/settings';
import { useFestivalStore } from '../stores/festival';
import { notificationHistory, clearNotificationHistory } from '../utils/notificationHistory';

const planStore = usePlanStore();
const settingsStore = useSettingsStore();
const festivalStore = useFestivalStore();

const showHistoryModal = ref(false);
const downloading = reactive({});

const notifStatus = ref(Notification?.permission || 'default');
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


async function requestNotif() {
  const res = await planStore.requestNotificationPermission();
  notifStatus.value = res;
}

function testNotification() {
  planStore.sendNotification({
    title: '🎵 測試推播',
    body: '如果你看到這則通知，代表推播功能運作正常！',
    tag: 'test_notification'
  });
}

function handleReminderTimeChange(e) {
  const val = parseInt(e.target.value);
  const currentTimes = [...settingsStore.performanceReminderTimes];
  
  if (e.target.checked) {
    if (!currentTimes.includes(val)) currentTimes.push(val);
  } else {
    const idx = currentTimes.indexOf(val);
    if (idx > -1) currentTimes.splice(idx, 1);
  }
  
  settingsStore.setPerformanceReminderTimes(currentTimes);
}

function formatDate(str) {
  return new Date(str).toLocaleString('zh-TW', { dateStyle: 'medium', timeStyle: 'short', hour12: !settingsStore.is24Hour });
}

function formatTimestamp(ts) {
  const d = new Date(ts);
  return d.toLocaleString('zh-TW', {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
    hour12: !settingsStore.is24Hour
  });
}

function handleClearHistory() {
  if (confirm('確定要清除所有通知歷史紀錄嗎？這會讓之前已推播過的通知在條件達到時重新推播。')) {
    clearNotificationHistory();
  }
}

async function downloadFestival(id) {
  downloading[id] = true;
  try {
    await festivalStore.downloadFestivalOffline(id);
  } catch {
    alert('下載失敗，請檢查網路連線後再試');
  } finally {
    downloading[id] = false;
  }
}

function deleteFestival(id) {
  if (confirm('確定要刪除此音樂祭的離線資料嗎？')) {
    festivalStore.deleteFestivalOffline(id);
  }
}

function resetPlan() {
  if (confirm('確定要重設我的行程？')) {
    planStore.myPlan = [];
    planStore.savePlan();
    location.reload();
  }
}

async function clearCache() {
  if ('caches' in window) {
    const keys = await caches.keys();
    for (const key of keys) {
      await caches.delete(key);
    }
    alert('快取已清除');
  }
}


</script>

<style scoped>
</style>


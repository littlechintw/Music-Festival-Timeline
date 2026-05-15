<template>
  <div class="flex items-center justify-center min-h-[50vh] p-4">
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 max-w-sm w-full text-center">
      <div v-if="loading">
        <div
          class="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"
        />
        <h2 class="text-xl font-bold text-gray-700 dark:text-gray-200">正在取得行程資訊...</h2>
        <p class="text-gray-500 dark:text-gray-400 mt-2">請稍候，我們正在載入您的行程</p>
      </div>

      <div v-else-if="error">
        <div class="text-5xl mb-4" aria-hidden="true">❌</div>
        <h2 class="text-xl font-bold text-red-600 dark:text-red-400 mb-2">解析失敗</h2>
        <p class="text-gray-600 dark:text-gray-300 mb-6">{{ error }}</p>
        <router-link
          to="/"
          class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          回到首頁
        </router-link>
      </div>

      <div v-else-if="isAsking">
        <div class="text-5xl mb-4" aria-hidden="true">🎵</div>
        <h2 class="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">收到分享的行程！</h2>
        <p class="text-gray-600 dark:text-gray-300 mb-4">
          來自「<span class="font-bold text-blue-600 dark:text-blue-400">{{ festivalName }}</span>」的行程
        </p>
        <div
          class="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg text-sm text-gray-600 dark:text-gray-300 mb-6 text-left max-h-40 overflow-y-auto"
        >
          <p class="font-medium mb-2 border-b border-gray-200 dark:border-gray-700 pb-1">
            包含 {{ parsedPlan.length }} 場演出：
          </p>
          <ul class="list-disc pl-4 space-y-1">
            <li v-for="perf in previewList" :key="perf.id">
              {{ perf.artist }} ({{ formatTime(perf.start, settingsStore.is24Hour) }})
            </li>
          </ul>
          <p v-if="parsedPlan.length > 5" class="text-center mt-2 text-gray-400 dark:text-gray-500">
            ... 及其他 {{ parsedPlan.length - 5 }} 場演出
          </p>
        </div>
        <p class="text-red-500 dark:text-red-400 text-sm font-medium mb-4">
          注意：匯入將會取代您原本的行程！
        </p>
        <div class="flex flex-col gap-3">
          <button
            class="w-full px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-medium"
            @click="handleImport"
          >
            取代並匯入行程
          </button>
          <router-link
            to="/"
            class="w-full px-6 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition"
          >
            不要，回到首頁
          </router-link>
        </div>
      </div>
    </div>

    <div
      v-if="invalidMessage"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      @click="invalidMessage = ''"
    >
      <div
        class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 max-w-sm w-full text-center"
        @click.stop
      >
        <div class="text-4xl mb-4" aria-hidden="true">⚠️</div>
        <h3 class="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">部分行程失效</h3>
        <p class="text-gray-600 dark:text-gray-300 mb-6 text-left leading-relaxed">
          {{ invalidMessage }}
        </p>
        <button
          class="w-full px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
          @click="invalidMessage = ''"
        >
          我知道了
        </button>
      </div>
    </div>

    <div
      v-if="showSuccessModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      @click="finishImport"
    >
      <div
        class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 max-w-sm w-full text-center"
        @click.stop
      >
        <div class="text-4xl mb-4 text-green-500 dark:text-green-400">
          <svg
            class="w-16 h-16 mx-auto"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h3 class="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">匯入成功！</h3>
        <p class="text-gray-600 dark:text-gray-300 mb-6">您的行程已成功更新</p>
        <button
          class="w-full px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
          @click="finishImport"
        >
          查看行程
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useFestivalStore } from '../stores/festival';
import { usePlanStore } from '../stores/plan';
import { useSettingsStore } from '../stores/settings';
import { decodePlanFromText } from '../utils/url';
import { formatTime } from '../utils/format';

const route = useRoute();
const router = useRouter();
const festivalStore = useFestivalStore();
const planStore = usePlanStore();
const settingsStore = useSettingsStore();

const loading = ref(true);
const error = ref('');
const isAsking = ref(false);
const festivalName = ref('');
const parsedPlan = ref([]);
const invalidMessage = ref('');
const showSuccessModal = ref(false);

const previewList = computed(() => parsedPlan.value.slice(0, 5));

function handleImport() {
  planStore.replacePlan(parsedPlan.value);
  showSuccessModal.value = true;
}

function finishImport() {
  showSuccessModal.value = false;
  router.replace({ path: '/plan' });
}

onMounted(async () => {
  const shortId = route.params.shortId;
  const gasUrl = import.meta.env.VITE_GAS_URL;

  if (!gasUrl) {
    error.value = '系統未配置短網址服務 (VITE_GAS_URL 缺失)';
    loading.value = false;
    return;
  }

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    error.value = '目前離線中，無法解析分享網址。請連線後重試。';
    loading.value = false;
    return;
  }

  try {
    await festivalStore.ensureLoaded();

    const res = await fetch(gasUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      mode: 'cors',
      body: JSON.stringify({ action: 'get', short_id: shortId }),
    });
    const data = await res.json();

    if (data.err || !data.t) {
      error.value = data.message || '找不到對應的短網址紀錄';
      return;
    }

    const decoded = decodeURIComponent(data.t);
    const result = decodePlanFromText(decoded, festivalStore.getFestivals);
    if (!result.festival) {
      error.value = '找不到對應的音樂祭資料，可能尚未上架';
      return;
    }
    if (result.plan.length === 0) {
      error.value = '行程內容為空或全部已失效';
      return;
    }
    festivalName.value = result.festival.name;
    parsedPlan.value = result.plan;
    if (result.invalidCount > 0) {
      invalidMessage.value = `有 ${result.invalidCount} 個行程已經失效，僅會匯入部分有效行程`;
    }
    isAsking.value = true;
  } catch (err) {
    console.error('取得短網址失敗:', err);
    error.value = '連線服務發生錯誤';
  } finally {
    loading.value = false;
  }
});
</script>

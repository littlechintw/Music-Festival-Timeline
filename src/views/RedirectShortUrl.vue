<template>
  <div class="p-4 max-w-full mx-auto">
    <div v-if="loading" class="flex items-center justify-center min-h-[50vh]">
      <div class="text-center">
        <div
          class="w-12 h-12 border-4 border-[var(--md-sys-color-primary-container)] border-t-[var(--md-sys-color-primary)] rounded-full animate-spin mx-auto mb-4"
        />
        <h2 class="text-xl font-bold text-gray-700 dark:text-gray-200">正在取得行程資訊...</h2>
        <p class="text-gray-500 dark:text-gray-400 mt-2">請稍候，我們正在載入您的行程</p>
      </div>
    </div>

    <div v-else-if="error" class="flex items-center justify-center min-h-[50vh]">
      <div
        class="bg-[var(--md-sys-color-surface-container)] rounded-xl shadow-lg p-8 max-w-sm w-full text-center"
      >
        <MdIcon
          name="error"
          class="text-[var(--md-sys-color-error)] mb-4"
          style="--md-icon-size: 3rem"
        />
        <h2 class="text-xl font-bold text-[var(--md-sys-color-error)] mb-2">解析失敗</h2>
        <p class="text-gray-600 dark:text-gray-300 mb-6">{{ error }}</p>
        <router-link to="/">
          <md-filled-button type="button">回到首頁</md-filled-button>
        </router-link>
      </div>
    </div>

    <SharedPlanReceiver
      v-else-if="decoded"
      :festival="decoded.festival"
      :plan="decoded.plan"
      :invalid-count="decoded.invalidCount"
      @cancel="router.replace('/')"
      @imported="router.replace('/plan')"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useFestivalStore } from '../stores/festival';
import { decodePlanFromText } from '../utils/url';
import { getShortenerUrl } from '../utils/shortener';
import MdIcon from '../components/MdIcon.vue';
import SharedPlanReceiver from '../components/SharedPlanReceiver.vue';

const route = useRoute();
const router = useRouter();
const festivalStore = useFestivalStore();

const loading = ref(true);
const error = ref('');
const decoded = ref(null);

onMounted(async () => {
  const shortId = route.params.shortId;
  const gasUrl = getShortenerUrl();

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

    const text = decodeURIComponent(data.t);
    const result = decodePlanFromText(text, festivalStore.getFestivals);
    if (!result.festival) {
      error.value = '找不到對應的音樂祭資料，可能尚未上架';
      return;
    }
    if (result.plan.length === 0) {
      error.value = '行程內容為空或全部已失效';
      return;
    }
    decoded.value = result;
  } catch (err) {
    console.error('取得短網址失敗:', err);
    error.value = '連線服務發生錯誤';
  } finally {
    loading.value = false;
  }
});
</script>

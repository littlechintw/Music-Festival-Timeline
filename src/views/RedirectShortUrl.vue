<template>
  <div class="flex items-center justify-center min-h-[50vh] p-4">
    <div class="bg-white rounded-xl shadow-lg p-8 max-w-sm w-full text-center">
      <div v-if="loading">
        <div class="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
        <h2 class="text-xl font-bold text-gray-700">正在取得行程資訊...</h2>
        <p class="text-gray-500 mt-2">請稍候，我們正在載入您的行程</p>
      </div>

      <div v-else-if="error">
        <div class="text-5xl mb-4">❌</div>
        <h2 class="text-xl font-bold text-red-600 mb-2">解析失敗</h2>
        <p class="text-gray-600 mb-6">{{ error }}</p>
        <router-link to="/" class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
          回到首頁
        </router-link>
      </div>

      <div v-else-if="isAsking">
        <div class="text-5xl mb-4">🎵</div>
        <h2 class="text-xl font-bold text-gray-800 mb-2">收到分享的行程！</h2>
        <p class="text-gray-600 mb-4">來自「<span class="font-bold text-blue-600">{{ festivalName }}</span>」的行程</p>
        <div class="bg-gray-50 p-4 rounded-lg text-sm text-gray-600 mb-6 text-left max-h-40 overflow-y-auto">
          <p class="font-medium mb-2 border-b border-gray-200 pb-1">包含 {{ parsedPlan.length }} 場演出：</p>
          <ul class="list-disc pl-4 space-y-1">
            <li v-for="perf in previewList" :key="perf.id">{{ perf.artist }} ({{ formatTime(perf.start) }})</li>
          </ul>
          <p v-if="parsedPlan.length > 5" class="text-center mt-2 text-gray-400">... 及其他 {{ parsedPlan.length - 5 }} 場演出</p>
        </div>
        <p class="text-red-500 text-sm font-medium mb-4">注意：匯入將會取代您原本的行程！</p>
        <div class="flex flex-col gap-3">
          <button @click="handleImport" class="w-full px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium">
            取代並匯入行程
          </button>
          <router-link to="/" class="w-full px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition">
            不要，回到首頁
          </router-link>
        </div>
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

const route = useRoute();
const router = useRouter();
const loading = ref(true);
const error = ref('');
const isAsking = ref(false);
const festivalName = ref('');
const parsedPlan = ref([]);

const festivalStore = useFestivalStore();
const planStore = usePlanStore();
const settingsStore = useSettingsStore();

const previewList = computed(() => {
  return parsedPlan.value.slice(0, 5);
});

function formatTime(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: !settingsStore.is24Hour });
}

async function parsePlanSharedData(rawText) {
  try {
    let newPlan = [];
    const parts = rawText.split(';');
    const festId = parts[0];
    
    // 確保有先載入音樂祭資料
    if (!Array.isArray(festivalStore.getFestivals) || festivalStore.getFestivals.length === 0) {
      const files = import.meta.glob('../../festivals/*.json');
      const loaded = [];
      for (const path in files) {
        try {
          const mod = await files[path]();
          loaded.push(mod.default);
        } catch (err) {
          console.error('載入音樂祭檔案失敗:', path, err);
        }
      }
      festivalStore.festivals = loaded;
    }

    const allFestivals = festivalStore.getFestivals || [];
    const fest = allFestivals.find(f => f.festivalId === festId);
    
    if (!fest) {
      console.error('Festivals loaded:', allFestivals.map(f => f.festivalId), 'Looking for:', festId);
      error.value = `找不到該音樂祭的資料 (${festId})，解析失敗`;
      return false;
    }
    
    festivalName.value = fest.name;
    const pad = (n) => String(n).padStart(2, '0');
    const getShortTime = (d) => `${pad(d.getMonth()+1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}`;
    
    for (let i = 1; i < parts.length; i++) {
      if (!parts[i]) continue;
      const [stageName, timesStr] = parts[i].split(':');
      if (!timesStr) continue;
      const times = timesStr.split(',');
      
      const stage = fest.stages.find(s => s.name === stageName);
      if (stage) {
        times.forEach(t => {
          const perf = stage.performances.find(p => getShortTime(new Date(p.start)) === t);
          if (perf) {
            newPlan.push({
              ...perf,
              stage: stage.name,
              festivalId: fest.festivalId,
              festivalName: fest.name,
              id: fest.festivalId + '_' + stage.name + '_' + perf.artist + '_' + perf.start,
            });
          }
        });
      }
    }

    if (!newPlan.length) {
      error.value = '無法解析行程或內容為空';
      return false;
    }

    parsedPlan.value = newPlan.sort((a, b) => new Date(a.start) - new Date(b.start));
    return true;
  } catch (e) {
    console.error(e);
    error.value = '行程資料格式有誤';
    return false;
  }
}

function handleImport() {
  planStore.myPlan = parsedPlan.value;
  planStore.savePlan();
  alert('匯入成功！');
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

  try {
    const payload = {
      action: "get",
      short_id: shortId
    };

    const response = await fetch(gasUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
      },
      mode: 'cors',
      body: JSON.stringify(payload)
    });

    const resData = await response.json();

    if (!resData.err && resData.t) {
      const planDataText = resData.t;
      // Because we decode Chinese stage names, e.g., %E5%A5%B3%E7%A5%9E%E9%BE%8D -> 女神龍
      const decodedPlanDataText = decodeURIComponent(planDataText);
      const success = await parsePlanSharedData(decodedPlanDataText);
      if (success) {
        isAsking.value = true;
      }
    } else {
      error.value = resData.message || '找不到對應的短網址紀錄';
    }
  } catch (err) {
    console.error('取得短網址失敗:', err);
    error.value = '連線服務發生錯誤';
  } finally {
    loading.value = false;
  }
});
</script>

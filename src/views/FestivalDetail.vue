<template>
  <div class="p-4 max-w-3xl mx-auto">
    <div v-if="loading">載入中...</div>
    <div v-else-if="!festival">找不到此音樂祭</div>
    <div v-else>
      <div class="mb-4 rounded-lg p-4" :style="headerStyle">
        <h1 class="text-2xl font-bold">{{ festival.name }}</h1>
        <div class="text-gray-500 text-sm">{{ formatDate(festival.startTime) }} ~ {{ formatDate(festival.endTime) }}
        </div>
        <div class="text-sm">{{ festival.location.name }}｜{{ festival.location.address }}</div>
      </div>
      <div class="flex gap-2 mb-4">
        <button @click="goTimeline" class="px-4 py-2 rounded bg-blue-600 text-white">查看全日時間軸</button>
        <button v-if="festival.map && festival.map.image" @click="goMap"
          class="px-4 py-2 rounded bg-green-600 text-white">查看場地地圖</button>
      </div>
      <div class="mb-4">
        <h2 class="font-bold mb-2">舞台與演出</h2>
        <div v-for="stage in festival.stages" :key="stage.id" class="mb-6">
          <h3 class="font-semibold text-lg mb-3">{{ stage.name }}</h3>
          <div v-for="(dayPerformances, dayKey) in groupPerformancesByDay(stage.performances)" :key="dayKey"
            class="mb-4">
            <div class="bg-gray-100 px-3 py-2 rounded-t font-medium text-sm text-gray-700">
              {{ formatDayHeader(dayKey) }}
            </div>
            <div class="border border-t-0 rounded-b p-3">
              <div v-for="perf in dayPerformances" :key="perf.artist + perf.start"
                class="flex flex-row items-center gap-2 mb-2 last:mb-0">
                <div class="flex-1 min-w-0">
                  <span class="font-mono text-sm text-gray-600">{{ formatTimeRange(perf.start, perf.end) }}</span>
                  <span class="ml-3 font-bold">{{ perf.artist }}</span>
                  <span v-if="perf.description" class="ml-2 text-gray-400 text-xs">({{ perf.description }})</span>
                </div>
                <button @click="togglePlan(stage, perf)"
                  class="ml-2 px-3 py-1 rounded text-xs shrink-0 transition-colors"
                  :class="isInPlan(stage, perf) ? 'bg-gray-500 hover:bg-gray-600 text-white' : 'bg-green-500 hover:bg-green-600 text-white'">
                  {{ isInPlan(stage, perf) ? '已加入（點擊移除）' : '加入我的行程' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div v-if="festival.map && festival.map.image">
        <h2 class="font-bold mb-2">場地地圖</h2>
        <img :src="festival.map.image" alt="map" class="w-full max-w-md rounded border" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useFestivalStore } from '../stores/festival';
import { usePlanStore } from '../stores/plan';


const route = useRoute();
const router = useRouter();
const store = useFestivalStore();
const planStore = usePlanStore();
const loading = ref(false);
const headerStyle = ref({});

const festival = computed(() => {
  const id = route.params.id;
  return (store.getFestivals || []).find(f => f.festivalId === id);
});

function formatDate(str, timeOnly = false) {
  const d = new Date(str);
  if (timeOnly) return d.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleString('zh-TW', { dateStyle: 'medium', timeStyle: 'short' });
}

function formatTimeRange(startStr, endStr) {
  const start = new Date(startStr);
  const end = new Date(endStr);
  return `${start.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}`;
}

function formatDayHeader(dateStr) {
  const date = new Date(dateStr);
  const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
  const weekday = weekdays[date.getDay()];
  return `${date.toLocaleDateString('zh-TW', { month: 'long', day: 'numeric' })} (${weekday})`;
}

function groupPerformancesByDay(performances) {
  const grouped = {};
  performances.forEach(perf => {
    const date = new Date(perf.start);
    const dateKey = date.toDateString(); // 使用日期字符串作為 key
    if (!grouped[dateKey]) {
      grouped[dateKey] = [];
    }
    grouped[dateKey].push(perf);
  });

  // 按時間排序每天的表演
  Object.keys(grouped).forEach(dateKey => {
    grouped[dateKey].sort((a, b) => new Date(a.start) - new Date(b.start));
  });

  return grouped;
}


function goTimeline() {
  router.push({ name: 'RunDownTimeline', params: { id: route.params.id } });
}

function goMap() {
  router.push({ name: 'MapView', params: { id: route.params.id } });
}

function perfKey(stage, perf) {
  return (
    (festival.value?.festivalId || '') + '_' +
    (stage?.name || '') + '_' +
    (perf?.artist || '') + '_' +
    (perf?.start || '')
  );
}

function isInPlan(stage, perf) {
  const key = perfKey(stage, perf);
  return (planStore.myPlan || []).some(
    p => perfKey({ name: p.stage }, p) === key && p.festivalId === festival.value.festivalId
  );
}

function togglePlan(stage, perf) {
  if (isInPlan(stage, perf)) {
    // 移除
    planStore.removePerformance(perfKey(stage, perf));
  } else {
    // 加入
    planStore.addPerformance({
      ...perf,
      stage: stage.name,
      festivalId: festival.value.festivalId,
      festivalName: festival.value.name,
      id: perfKey(stage, perf),
    });
  }
}



async function applyTheme() {
  // 移除 Logo 相關的主題顏色功能
  headerStyle.value = {};
}

watch(festival, () => {
  applyTheme();
});

onMounted(async () => {
  if (!Array.isArray(store.getFestivals) || store.getFestivals.length === 0) {
    loading.value = true;
    const files = import.meta.glob('../../festivals/*.json');
    const loaded = [];
    for (const path in files) {
      try {
        const mod = await files[path]();
        loaded.push(mod.default);
      } catch (e) { }
    }
    store.$patch({ festivals: loaded });
    loading.value = false;
  }
  planStore.loadPlan();
  applyTheme();
});
</script>

<style scoped></style>

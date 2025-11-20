<template>
  <div class="p-4 max-w-3xl mx-auto">
    <div v-if="loading">載入中...</div>
    <div v-else-if="!festival">找不到此音樂祭</div>
    <div v-else>
      <div class="flex items-center gap-4 mb-4 rounded-lg p-4" :style="headerStyle">
        <img v-if="festival.logo" :src="festival.logo" alt="logo" class="w-20 h-20 object-contain rounded bg-white" />
        <div>
          <h1 class="text-2xl font-bold">{{ festival.name }}</h1>
          <div class="text-gray-500 text-sm">{{ formatDate(festival.startTime) }} ~ {{ formatDate(festival.endTime) }}</div>
          <div class="text-sm">{{ festival.location.name }}｜{{ festival.location.address }}</div>
        </div>
      </div>
      <div class="flex gap-2 mb-4">
        <button @click="goTimeline" class="px-4 py-2 rounded bg-blue-600 text-white">查看全日時間軸</button>
        <button v-if="festival.map && festival.map.image" @click="goMap" class="px-4 py-2 rounded bg-green-600 text-white">查看場地地圖</button>
      </div>
      <div class="mb-4">
        <h2 class="font-bold mb-2">舞台與演出</h2>
        <div v-for="stage in festival.stages" :key="stage.id" class="mb-4">
          <div class="font-semibold">{{ stage.name }}</div>
          <ul>
            <li v-for="perf in stage.performances" :key="perf.artist + perf.start" class="ml-4 flex flex-row items-center gap-2 mb-2">
              <div class="flex-1 min-w-0">
                <span class="font-mono text-xs text-gray-500">{{ formatDate(perf.start, true) }} - {{ formatDate(perf.end, true) }}</span>
                <span class="ml-2 font-bold">{{ perf.artist }}</span>
                <span v-if="perf.description" class="ml-2 text-gray-400 text-xs">({{ perf.description }})</span>
              </div>
              <button
                @click="togglePlan(stage, perf)"
                class="ml-2 px-2 py-1 rounded text-xs shrink-0"
                :class="isInPlan(stage, perf) ? 'bg-gray-400 text-white' : 'bg-green-500 text-white'"
              >
                {{ isInPlan(stage, perf) ? '已加入（點擊移除）' : '加入我的行程' }}
              </button>
            </li>
          </ul>
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
import { extractThemeColors } from '../utils/theme';

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

// 只在 header 區塊顯示主題色，並自動判斷文字顏色
function getContrastYIQ(hexcolor) {
  let c = hexcolor.replace('#', '');
  if (c.length === 3) c = c[0]+c[0]+c[1]+c[1]+c[2]+c[2];
  const r = parseInt(c.substr(0,2),16);
  const g = parseInt(c.substr(2,2),16);
  const b = parseInt(c.substr(4,2),16);
  const yiq = ((r*299)+(g*587)+(b*114))/1000;
  return (yiq >= 128) ? '#000' : '#fff';
}

async function applyTheme() {
  if (festival.value && festival.value.logo) {
    const theme = await extractThemeColors(festival.value.logo);
    const bg = theme.primary;
    const color = getContrastYIQ(bg);
    headerStyle.value = {
      background: bg,
      color,
    };
  } else {
    headerStyle.value = {};
  }
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
      } catch (e) {}
    }
    store.$patch({ festivals: loaded });
    loading.value = false;
  }
  planStore.loadPlan();
  applyTheme();
});
</script>

<style scoped>
</style>

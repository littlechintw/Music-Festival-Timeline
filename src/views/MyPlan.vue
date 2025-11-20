<template>
  <div class="p-4 max-w-3xl mx-auto">
    <h1 class="text-2xl font-bold mb-4">我的行程</h1>
    <div class="mb-4 flex gap-2" v-if="plan.length">
      <button @click="shareUrl" class="px-3 py-1 rounded bg-purple-600 text-white">分享行程網址</button>
      <button @click="exportJson" class="px-3 py-1 rounded bg-gray-700 text-white">匯出 JSON</button>
      <label class="px-3 py-1 rounded bg-gray-400 text-white cursor-pointer">
        匯入 JSON
        <input type="file" accept="application/json" class="hidden" @change="importJson" />
      </label>
      <button @click="importFromUrl" class="px-3 py-1 rounded bg-blue-400 text-white">從網址匯入</button>
    </div>
    <div v-if="plan.length === 0" class="text-gray-400">尚未加入任何演出</div>
    <div v-else>
      <div class="font-bold text-xl mb-4">音樂祭行程總覽</div>
  <div class="relative border-l-2 border-gray-300 bg-gray-50 w-full max-w-[700px] mx-auto overflow-x-auto" :style="{height: timelineHeight + 'px', minHeight: '400px'}">
        <template v-for="(tick, i) in timelineTicks" :key="'tick'+i">
          <div class="absolute left-0 w-full" :style="{top: tick.top + 'px'}">
            <div class="text-xs text-gray-400 absolute -left-32 w-28 text-right">{{ tick.label }}</div>
            <div class="border-t border-gray-200 w-full"></div>
          </div>
        </template>
        <div v-for="(block, idx) in timelineBlocks" :key="'block'+idx"
          class="absolute flex items-center"
          :style="{ top: block.top + 'px', left: (80 + block.col * 240) + 'px', height: block.height + 'px', width: '220px', zIndex: 10 }">
          <!-- 左側時間段標籤（僅顯示在最左欄 col=0）-->
          <div v-if="block.col === 0" class="absolute -left-20 w-16 text-xs text-gray-600 text-right" :style="{top: 0}">
            {{ formatDate(block.start, true) }}
          </div>
          <div class="rounded px-3 py-2 text-xs overflow-hidden shadow w-full"
            :class="block.isPast ? 'bg-gray-400 text-white opacity-60' : 'bg-blue-500 text-white'">
            <div class="font-bold text-base truncate">{{ block.artist }}</div>
            <div class="mb-1">{{ block.time }}</div>
            <div class="text-xs text-blue-100">{{ block.stage }}</div>
            <button @click="remove(block)" class="mt-1 px-2 py-1 rounded bg-red-500 text-white text-xs">移除</button>
          </div>
        </div>
        <!-- 現在時間紅線 -->
        <div v-if="nowLinePx >= 0 && nowLinePx <= timelineHeight"
          class="absolute left-0 w-full pointer-events-none"
          :style="{top: nowLinePx + 'px'}"
        >
          <div class="absolute left-0 right-0 border-t-2 border-red-500" style="height:0"></div>
          <div class="absolute -left-32 w-28 text-xs text-red-600 text-right">現在</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { usePlanStore } from '../stores/plan';
import { generateICS } from '../utils/ics';
import { googleCalendarLinks } from '../utils/calendar';
import { compressToUrl, decompressFromUrl } from '../utils/url';
import { useFestivalStore } from '../stores/festival';

const planStore = usePlanStore();
const festivalStore = useFestivalStore();
const plan = ref([]);

onMounted(() => {
  planStore.loadPlan();
  plan.value = planStore.myPlan || [];
  setInterval(() => plan.value = planStore.myPlan || [], 30 * 1000); // 自動刷新
});

// 計算 timeline 範圍
const sortedPlan = computed(() => [...plan.value].sort((a, b) => new Date(a.start) - new Date(b.start)));
// timeline 上下各多出 30 分鐘
const minTime = computed(() => {
  if (!sortedPlan.value.length) return new Date();
  const min = new Date(Math.min(...sortedPlan.value.map(p => new Date(p.start))));
  min.setMinutes(min.getMinutes() - 30);
  return min;
});
const maxTime = computed(() => {
  if (!sortedPlan.value.length) return new Date();
  const max = new Date(Math.max(...sortedPlan.value.map(p => new Date(p.end))));
  max.setMinutes(max.getMinutes() + 30);
  return max;
});
const pxPerMin = 3;
const timelineHeight = computed(() => {
  const mins = (maxTime.value - minTime.value) / 60000;
  return Math.max(400, mins * pxPerMin);
});

// 判斷重疊
function isOverlap(a, b) {
  const sa = new Date(a.start), ea = new Date(a.end);
  const sb = new Date(b.start), eb = new Date(b.end);
  return sa < eb && ea > sb;
}

// 產生 timeline block，重疊自動分欄
const timelineBlocks = computed(() => {
  const blocks = [];
  const items = sortedPlan.value;
  for (let i = 0; i < items.length; i++) {
    const perf = items[i];
    const start = new Date(perf.start), end = new Date(perf.end);
    const top = ((start - minTime.value) / 60000) * pxPerMin;
    const height = ((end - start) / 60000) * pxPerMin;
    // 計算重疊欄位
    let col = 0, totalCols = 1;
    const overlaps = items.map((p, j) => ({p, j})).filter(({p, j}) => j !== i && isOverlap(perf, p));
    if (overlaps.length) {
      const allIdx = overlaps.map(o => o.j).concat(i).sort((a, b) => a - b);
      col = allIdx.indexOf(i);
      totalCols = allIdx.length;
    }
    blocks.push({
      ...perf,
      artist: perf.artist,
      time: formatDate(perf.start, true) + ' ~ ' + formatDate(perf.end, true),
      stage: perf.stage,
      top,
      height,
      col,
      isPast: new Date() > end
    });
  }
  return blocks;
});

// 刻度
const timelineTicks = computed(() => {
  const ticks = [];
  // 刻度從 minTime 的整點開始
  const start = new Date(minTime.value);
  start.setMinutes(0,0,0);
  for (let t = new Date(start); t <= maxTime.value; t.setMinutes(t.getMinutes() + 60)) {
    const top = ((t - minTime.value) / 60000) * pxPerMin;
    // 顯示完整日期與小時
    const label = `${t.getMonth()+1}/${t.getDate()} ${t.getHours().toString().padStart(2,'0')}:00`;
    ticks.push({ top, label });
  }
  return ticks;
});

// 現在時間紅線
const nowLinePx = computed(() => {
  const now = new Date();
  if (now < minTime.value) return -1;
  if (now > maxTime.value) return timelineHeight.value + 1;
  return ((now - minTime.value) / 60000) * pxPerMin;
});

function remove(perf) {
  planStore.removePerformance(perf.id || perf.artist + perf.start);
}

function formatDate(str, timeOnly = false) {
  const d = new Date(str);
  if (timeOnly) return d.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleString('zh-TW', { dateStyle: 'medium', timeStyle: 'short' });
}

// 分享/匯入/匯出功能
function toMinimalPlanByFestival(arr) {
  if (!arr.length) return {};
  const festId = arr[0].festivalId;
  return {
    [festId]: arr.map(p => ({
      stage: p.stage,
      artist: p.artist,
      start: p.start,
    })),
  };
}

function shareUrl() {
  if (!plan.value.length) return;
  const festId = plan.value[0].festivalId;
  if (!plan.value.every(p => p.festivalId === festId)) {
    alert('僅支援分享單一音樂祭的行程');
    return;
  }
  const data = toMinimalPlanByFestival(plan.value);
  const url = `${location.origin}${location.pathname}?plan=${encodeURIComponent(compressToUrl(data))}`;
  if (navigator.share) {
    navigator.share({ title: '我的音樂祭行程', url });
  } else {
    prompt('複製以下網址分享：', url);
  }
}

function exportJson() {
  const blob = new Blob([JSON.stringify(plan.value, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'my-festival-plan.json';
  a.click();
  URL.revokeObjectURL(url);
}

function importJson(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = evt => {
    try {
      const arr = JSON.parse(evt.target.result);
      if (Array.isArray(arr)) {
        planStore.myPlan = arr;
        planStore.savePlan();
        alert('匯入成功！');
        location.reload();
      } else {
        alert('格式錯誤');
      }
    } catch {
      alert('解析失敗');
    }
  };
  reader.readAsText(file);
}

function importFromUrl() {
  const str = prompt('請貼上分享網址：');
  if (!str) return;
  const m = str.match(/[?&]plan=([^&]+)/);
  if (!m) return alert('網址無法解析');
  try {
    const obj = decompressFromUrl(decodeURIComponent(m[1]));
    if (!obj || typeof obj !== 'object') return alert('格式錯誤');
    const festId = Object.keys(obj)[0];
    const arr = obj[festId];
    if (!Array.isArray(arr)) return alert('格式錯誤');
    const allFestivals = festivalStore.getFestivals || [];
    const fest = allFestivals.find(f => f.festivalId === festId);
    const newPlan = arr.map(item => {
      let perf = null;
      let stageName = item.stage;
      if (fest) {
        for (const stage of fest.stages) {
          if (stage.name === item.stage) {
            perf = stage.performances.find(p => p.artist === item.artist && p.start === item.start);
            if (perf) {
              return {
                ...perf,
                stage: stage.name,
                festivalId: fest.festivalId,
                festivalName: fest.name,
                id: fest.festivalId + '_' + stage.name + '_' + perf.artist + '_' + perf.start,
              };
            }
          }
        }
      }
      // 查不到時保留基本資訊
      return {
        artist: item.artist,
        stage: stageName,
        start: item.start,
        festivalId: festId,
        festivalName: fest ? fest.name : '未知音樂祭',
        id: festId + '_' + stageName + '_' + item.artist + '_' + item.start,
      };
    });
    planStore.myPlan = newPlan;
    planStore.savePlan();
    alert('匯入成功！');
    location.reload();
  } catch {
    alert('解析失敗');
  }
}

function exportICS(perfs) {
  const ics = generateICS(perfs);
  const blob = new Blob([ics], { type: 'text/calendar' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'my-festival-plan.ics';
  a.click();
  URL.revokeObjectURL(url);
}

function exportGoogle(perfs) {
  if (perfs.length === 0) return;
  const links = googleCalendarLinks(perfs);
  for (const link of links) {
    window.open(link, '_blank');
  }
}
</script>

<style scoped>
</style>

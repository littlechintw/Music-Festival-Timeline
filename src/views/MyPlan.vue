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
    </div>
    <div v-if="plan.length === 0" class="text-gray-400">尚未加入任何演出</div>
    <div v-else>
      <!-- 統計資訊 -->
      <div class="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-6 mb-6 text-white">
        <h2 class="text-2xl font-bold mb-2">我的音樂祭行程</h2>
        <div class="flex gap-6 text-sm">
          <div class="flex items-center gap-2">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                clip-rule="evenodd"></path>
            </svg>
            <span>總共 {{ plan.length }} 場演出</span>
          </div>
          <div class="flex items-center gap-2">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd"
                d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zM4 7h12v9a1 1 0 01-1 1H5a1 1 0 01-1-1V7z"
                clip-rule="evenodd"></path>
            </svg>
            <span>{{ planDays.length }} 天行程</span>
          </div>
          <div class="flex items-center gap-2">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd"
                d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                clip-rule="evenodd"></path>
            </svg>
            <span>{{ uniqueFestivals.length }} 個音樂祭</span>
          </div>
        </div>
      </div>

      <!-- 日期選擇標籤 -->
      <div v-if="planDays.length > 1" class="flex gap-2 mb-6 overflow-x-auto pb-2">
        <button v-for="day in planDays" :key="day.dateKey" @click="selectedPlanDay = day.dateKey"
          class="px-4 py-2 rounded-lg text-sm whitespace-nowrap flex-shrink-0 transition-all"
          :class="selectedPlanDay === day.dateKey ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-blue-600 border border-blue-600 hover:bg-blue-50'">
          {{ day.label }} ({{ day.count }}場)
        </button>
      </div>

      <!-- 單日時間軸 -->
      <div v-for="day in planDays" :key="day.dateKey" v-show="selectedPlanDay === day.dateKey"
        class="bg-white rounded-xl shadow-lg overflow-hidden">
        <div class="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-6">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-2xl font-bold">{{ day.label }}</h3>
              <p class="text-blue-100 mt-1">
                {{ day.count }} 場演出 • {{ day.festivalNames.join('、') }}
              </p>
            </div>
            <div v-if="day.isToday" class="text-right">
              <div class="text-yellow-300 text-sm font-medium">今天</div>
              <div class="text-yellow-100 text-xs">{{ getCurrentTimeString() }}</div>
            </div>
          </div>
        </div>

        <!-- 甘特圖式時間軸 -->
        <div class="relative overflow-x-auto" :style="{ height: getTimelineHeight(day) + 'px' }">
          <!-- 時間刻度背景 -->
          <div class="absolute left-0 top-0 w-20 h-full bg-gray-50 border-r border-gray-200 z-10">
            <!-- 時間刻度 -->
            <div v-for="tick in getTimelineTicks(day)" :key="tick.time"
              class="absolute left-0 w-full text-right pr-3 text-xs text-gray-600 font-mono"
              :style="{ top: tick.position + 'px' }">
              {{ tick.label }}
            </div>
          </div>

          <!-- 時間線網格 -->
          <div class="absolute left-20 right-0 top-0 bottom-0">
            <div v-for="tick in getTimelineTicks(day)" :key="tick.time"
              class="absolute left-0 right-0 border-t border-gray-100" :style="{ top: tick.position + 'px' }"></div>
          </div>

          <!-- 演出卡片容器 -->
          <div class="relative left-20 pr-4" :style="{ height: getTimelineHeight(day) + 'px' }">
            <!-- 演出卡片 -->
            <div v-for="block in getTimelineBlocks(day)" :key="block.id"
              class="absolute rounded-lg shadow-lg border-l-4 cursor-pointer transition-all duration-200 hover:shadow-xl hover:z-50 hover:-translate-y-1"
              :style="block.style" :class="getPerformanceCardClass(block)">

              <!-- 短演出的緊湊佈局 -->
              <div v-if="block.isShort" class="p-2 h-full flex flex-col justify-center">
                <div class="font-bold text-xs text-gray-800 leading-tight mb-1">{{ block.artist }}</div>
                <div class="flex items-center justify-between">
                  <div class="text-xs text-gray-600 font-mono">{{ formatTime(block.start) }}</div>
                  <div class="text-xs px-1 py-0.5 rounded text-white"
                    :class="`bg-${getFestivalColor(block.festivalName).primary}-500`">
                    {{ block.stage }}
                  </div>
                </div>
              </div>

              <!-- 一般演出的標準佈局 -->
              <div v-else class="p-3 h-full flex flex-col justify-between">
                <div>
                  <div class="font-bold text-sm text-gray-800 leading-tight mb-1">{{ block.artist }}</div>
                  <div class="text-xs text-gray-600 mb-1 font-mono">{{ formatTime(block.start) }} - {{
                    formatTime(block.end) }}</div>
                </div>
                <div class="mt-1">
                  <div class="text-xs font-medium px-2 py-1 rounded text-white"
                    :class="`bg-${getFestivalColor(block.festivalName).primary}-500`">
                    {{ block.stage }}
                  </div>
                </div>
              </div>

              <!-- 過去時間的覆蓋層 -->
              <div v-if="block.isPast"
                class="absolute inset-0 bg-gray-900 bg-opacity-25 rounded-lg flex items-center justify-center">
                <span
                  class="text-gray-600 text-xs font-medium bg-white bg-opacity-90 px-2 py-1 rounded shadow">已結束</span>
              </div>
            </div>
          </div>

          <!-- 當天的現在時間指示線 -->
          <div v-if="day.isToday" class="absolute left-0 right-0 z-50 pointer-events-none"
            :style="{ top: getCurrentTimeLinePosition(day) + 'px' }">
            <div class="flex items-center w-full">
              <div class="w-20 bg-red-500 text-white text-xs text-center py-1 font-bold">
                {{ getCurrentTimeString() }}
              </div>
              <div class="flex-1 border-t-2 border-red-500"></div>
              <div class="w-3 h-3 bg-red-500 rounded-full border-2 border-white shadow-lg animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { usePlanStore } from '../stores/plan';
import { generateICS } from '../utils/ics';
import { googleCalendarLinks } from '../utils/calendar';
import { compressToUrl, decompressFromUrl } from '../utils/url';
import { useFestivalStore } from '../stores/festival';

const planStore = usePlanStore();
const festivalStore = useFestivalStore();
const plan = ref([]);
const currentTime = ref(new Date()); // 響應式的當前時間
let timeUpdateInterval = null;

onMounted(() => {
  planStore.loadPlan();
  plan.value = planStore.myPlan || [];
  setInterval(() => plan.value = planStore.myPlan || [], 30 * 1000); // 自動刷新

  // 每秒更新當前時間，讓時間線動態移動
  timeUpdateInterval = setInterval(() => {
    currentTime.value = new Date();
  }, 1000);

  // 檢查 URL 參數是否有分享的行程
  checkSharedPlanInUrl();
});

onUnmounted(() => {
  if (timeUpdateInterval) {
    clearInterval(timeUpdateInterval);
  }
});

function checkSharedPlanInUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  const planParam = urlParams.get('plan');

  if (planParam) {
    const shouldImport = confirm('檢測到他人分享的行程，要匯入這個行程嗎？\n\n注意：這會取代您目前的行程設定。');

    if (shouldImport) {
      importSharedPlan(planParam);
    } else {
      // 如果不匯入，清除 URL 參數
      const newUrl = new URL(window.location);
      newUrl.searchParams.delete('plan');
      window.history.replaceState({}, '', newUrl);
    }
  }
}

function importSharedPlan(planParam) {
  try {
    const obj = decompressFromUrl(decodeURIComponent(planParam));
    if (!obj || typeof obj !== 'object') {
      alert('分享的行程格式錯誤');
      return;
    }

    const festId = Object.keys(obj)[0];
    const arr = obj[festId];
    if (!Array.isArray(arr)) {
      alert('分享的行程格式錯誤');
      return;
    }

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
        end: item.end || item.start, // 如果沒有結束時間，使用開始時間
        festivalId: festId,
        festivalName: fest ? fest.name : '未知音樂祭',
        id: festId + '_' + stageName + '_' + item.artist + '_' + item.start,
      };
    });

    planStore.myPlan = newPlan;
    planStore.savePlan();
    plan.value = newPlan;

    // 清除 URL 參數
    const newUrl = new URL(window.location);
    newUrl.searchParams.delete('plan');
    window.history.replaceState({}, '', newUrl);

    alert('匯入成功！');
  } catch (error) {
    console.error('匯入失敗:', error);
    alert('匯入失敗，請檢查分享連結是否正確');
  }
}

const selectedPlanDay = ref('');

// 統計唯一音樂祭
const uniqueFestivals = computed(() => {
  const festivalNames = [...new Set(plan.value.map(p => p.festivalName).filter(Boolean))];
  return festivalNames;
});

// 按日期分組行程
const planDays = computed(() => {
  if (!plan.value.length) return [];

  const grouped = {};
  const today = currentTime.value.toDateString();

  plan.value.forEach(perf => {
    const date = new Date(perf.start);
    const dateKey = date.toDateString();

    if (!grouped[dateKey]) {
      grouped[dateKey] = {
        dateKey,
        date,
        isToday: dateKey === today,
        performances: [],
        festivalNames: new Set()
      };
    }

    grouped[dateKey].performances.push({
      ...perf,
      isPast: currentTime.value > new Date(perf.end || perf.start)
    });

    if (perf.festivalName) {
      grouped[dateKey].festivalNames.add(perf.festivalName);
    }
  });

  // 轉換為陣列並排序
  const days = Object.values(grouped).map(day => {
    // 按時間排序當天演出
    day.performances.sort((a, b) => new Date(a.start) - new Date(b.start));

    const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    return {
      ...day,
      label: `${day.date.toLocaleDateString('zh-TW', { month: 'long', day: 'numeric' })} (${weekdays[day.date.getDay()]})`,
      count: day.performances.length,
      festivalNames: Array.from(day.festivalNames)
    };
  }).sort((a, b) => a.date - b.date);

  // 設定預設選中的日期 - 優先選今天
  if (days.length > 0 && !selectedPlanDay.value) {
    const todayPlan = days.find(day => day.isToday);
    selectedPlanDay.value = todayPlan ? todayPlan.dateKey : days[0].dateKey;
  }

  return days;
});





function formatDate(str, timeOnly = false) {
  const d = new Date(str);
  if (timeOnly) return d.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleString('zh-TW', { dateStyle: 'medium', timeStyle: 'short' });
}

function formatTime(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });
}

function formatDuration(startStr, endStr) {
  const start = new Date(startStr);
  const end = new Date(endStr || startStr);
  const duration = Math.round((end - start) / (1000 * 60));
  return duration > 0 ? `${duration}分` : '';
}

function getCurrentTimeString() {
  return currentTime.value.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });
}

// 計算時間軸高度
function getTimelineHeight(day) {
  if (!day.performances.length) return 400;

  const { minTime, maxTime } = getDayTimeRange(day);
  const durationMinutes = (maxTime - minTime) / (1000 * 60);
  const pxPerMinute = 2; // 每分鐘2像素
  return Math.max(400, durationMinutes * pxPerMinute);
}

// 獲取當天時間範圍（前後各加30分鐘）
function getDayTimeRange(day) {
  if (!day.performances.length) {
    const date = new Date(day.dateKey);
    return {
      minTime: new Date(date.setHours(0, 0, 0, 0)),
      maxTime: new Date(date.setHours(23, 59, 59, 999))
    };
  }

  const dayDate = new Date(day.dateKey);

  // 篩選屬於這一天的演出（包括跨日的演出）
  const dayPerformances = day.performances.filter(p => {
    const startDate = new Date(p.start);
    const perfDay = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const targetDay = new Date(dayDate.getFullYear(), dayDate.getMonth(), dayDate.getDate());

    // 如果演出開始時間是在目標日期，或者是跨日到目標日期的演出
    return perfDay.getTime() === targetDay.getTime() ||
      (startDate.getHours() >= 0 && startDate.getHours() < 6 &&
        perfDay.getTime() === targetDay.getTime() + 24 * 60 * 60 * 1000);
  });

  if (dayPerformances.length === 0) {
    return {
      minTime: new Date(dayDate.setHours(0, 0, 0, 0)),
      maxTime: new Date(dayDate.setHours(23, 59, 59, 999))
    };
  }

  const startTimes = dayPerformances.map(p => {
    const time = new Date(p.start);
    // 如果是凌晨時段（0-6點），視為前一天的延續
    if (time.getHours() >= 0 && time.getHours() < 6) {
      const adjustedTime = new Date(time);
      adjustedTime.setDate(adjustedTime.getDate() - 1);
      adjustedTime.setHours(adjustedTime.getHours() + 24);
      return adjustedTime;
    }
    return time;
  });

  const endTimes = dayPerformances.map(p => {
    const time = new Date(p.end || p.start);
    // 如果是凌晨時段（0-6點），視為前一天的延續
    if (time.getHours() >= 0 && time.getHours() < 6) {
      const adjustedTime = new Date(time);
      adjustedTime.setDate(adjustedTime.getDate() - 1);
      adjustedTime.setHours(adjustedTime.getHours() + 24);
      return adjustedTime;
    }
    return time;
  });

  const minTime = new Date(Math.min(...startTimes));
  const maxTime = new Date(Math.max(...endTimes));

  // 前後各加30分鐘留白
  minTime.setMinutes(minTime.getMinutes() - 30);
  maxTime.setMinutes(maxTime.getMinutes() + 30);

  return { minTime, maxTime };
}

// 生成時間刻度
function getTimelineTicks(day) {
  const { minTime, maxTime } = getDayTimeRange(day);
  const pxPerMinute = 2;
  const ticks = [];

  // 從整點開始
  const current = new Date(minTime);
  current.setMinutes(0, 0, 0);

  while (current <= maxTime) {
    const position = ((current - minTime) / (1000 * 60)) * pxPerMinute;

    // 處理跨日顯示（24點以後顯示為次日）
    let displayHour = current.getHours();
    let label = '';

    if (displayHour >= 24) {
      displayHour = displayHour - 24;
      label = `+1 ${displayHour.toString().padStart(2, '0')}:00`;
    } else {
      label = current.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });
    }

    ticks.push({
      time: current.getTime(),
      position,
      label
    });

    current.setMinutes(current.getMinutes() + 60); // 每小時一個刻度
  }

  return ticks;
}

// 判斷時間重疊
function isTimeOverlap(a, b) {
  const aStart = new Date(a.start);
  const aEnd = new Date(a.end || a.start);
  const bStart = new Date(b.start);
  const bEnd = new Date(b.end || b.start);

  return aStart < bEnd && aEnd > bStart;
}

// 生成時間軸區塊（處理重疊）
function getTimelineBlocks(day) {
  if (!day.performances.length) return [];

  const { minTime } = getDayTimeRange(day);
  const pxPerMinute = 2;
  const performances = [...day.performances];
  const blocks = [];

  // 為每個演出分配列
  performances.forEach((perf, index) => {
    const start = new Date(perf.start);
    const end = new Date(perf.end || perf.start);

    // 計算位置和大小
    const top = ((start - minTime) / (1000 * 60)) * pxPerMinute;
    const actualDuration = (end - start) / (1000 * 60);
    const calculatedHeight = actualDuration * pxPerMinute;

    // 設定最小高度為80px，確保短演出也能完整顯示內容
    const height = Math.max(calculatedHeight, 80);

    // 計算重疊
    const overlapping = performances.filter((other, otherIndex) =>
      otherIndex !== index && isTimeOverlap(perf, other)
    );

    // 計算列位置
    let column = 0;
    if (overlapping.length > 0) {
      // 找到已分配的列
      const usedColumns = blocks
        .filter(block => isTimeOverlap(perf, block))
        .map(block => block.column);

      while (usedColumns.includes(column)) {
        column++;
      }
    }

    const totalColumns = Math.max(1, overlapping.length + 1);
    const columnWidth = Math.min(300, (window.innerWidth - 150) / totalColumns);
    const left = column * (columnWidth + 8);

    blocks.push({
      ...perf,
      id: perf.id || `${perf.artist}-${perf.start}`,
      column,
      totalColumns,
      isPast: currentTime.value > end,
      isShort: actualDuration <= 30, // 標記30分鐘以下為短演出
      duration: actualDuration,
      style: {
        top: top + 'px',
        left: left + 'px',
        width: columnWidth + 'px',
        height: height + 'px',
        zIndex: perf.isPast ? 5 : 10
      }
    });
  });

  return blocks;
}

// 獲取當前時間在時間軸上的位置
function getCurrentTimeLinePosition(day) {
  if (!day.isToday) return -1;

  const now = currentTime.value;
  const { minTime } = getDayTimeRange(day);
  const pxPerMinute = 2;

  return ((now - minTime) / (1000 * 60)) * pxPerMinute;
}

function getPerformanceCardClass(perf) {
  const baseClasses = 'bg-white border-l-4';

  if (perf.isPast) {
    return baseClasses + ' border-l-gray-400 bg-gray-50';
  }

  return baseClasses + ' ' + getStageColor(perf.stage);
}

function getTimelineDotColor(stageName, festivalName) {
  const festivalColor = getFestivalColor(festivalName);
  const stageColor = getStageColorForFestival(stageName, festivalColor);
  return stageColor.dotClass;
}

// 音樂祭顏色配置
function getFestivalColor(festivalName) {
  const festivalColors = {
    '測試音樂祭 Test Music Festival 2025': {
      primary: 'orange',
      colors: ['orange-500', 'orange-400', 'orange-600', 'orange-300']
    },
    '火球祭 Fireball Festival 2025': {
      primary: 'red',
      colors: ['red-500', 'red-400', 'red-600', 'red-300']
    }
  };

  // 預設顏色系統
  const defaultColors = [
    { primary: 'blue', colors: ['blue-500', 'blue-400', 'blue-600', 'blue-300'] },
    { primary: 'purple', colors: ['purple-500', 'purple-400', 'purple-600', 'purple-300'] },
    { primary: 'green', colors: ['green-500', 'green-400', 'green-600', 'green-300'] },
    { primary: 'pink', colors: ['pink-500', 'pink-400', 'pink-600', 'pink-300'] },
    { primary: 'indigo', colors: ['indigo-500', 'indigo-400', 'indigo-600', 'indigo-300'] }
  ];

  if (festivalColors[festivalName]) {
    return festivalColors[festivalName];
  }

  // 根據音樂祭名稱hash選擇顏色
  const hash = Array.from(festivalName || '').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return defaultColors[hash % defaultColors.length];
}

// 為特定音樂祭和舞台生成顏色
function getStageColorForFestival(stageName, festivalColor) {
  const stageIndex = Math.abs((stageName?.charCodeAt(0) || 0)) % festivalColor.colors.length;
  const colorName = festivalColor.colors[stageIndex];

  return {
    borderClass: `border-l-${colorName}`,
    bgClass: `bg-${colorName.replace('-500', '-50')}`, // 使用淺色背景
    dotClass: `bg-${colorName}`
  };
}

function getStageColor(stageName) {
  const colors = {
    'border-l-blue-500': ['火舞台', 'main', 'primary'],
    'border-l-purple-500': ['球舞台', 'second', 'secondary'],
    'border-l-green-500': ['祭舞台', 'third', 'stage3'],
    'border-l-orange-500': ['火球村', 'village', 'small'],
    'border-l-pink-500': ['其他', 'other'],
  };

  for (const [colorClass, keywords] of Object.entries(colors)) {
    if (keywords.some(keyword => stageName?.toLowerCase().includes(keyword))) {
      return colorClass;
    }
  }

  // 根據舞台名稱的第一個字符決定顏色
  const colorIndex = (stageName?.charCodeAt(0) || 0) % 5;
  return ['border-l-blue-500', 'border-l-purple-500', 'border-l-green-500', 'border-l-orange-500', 'border-l-pink-500'][colorIndex];
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
  if (!plan.value.length) {
    alert('目前沒有行程可以分享');
    return;
  }

  const festId = plan.value[0].festivalId;
  if (!plan.value.every(p => p.festivalId === festId)) {
    alert('僅支援分享單一音樂祭的行程');
    return;
  }

  try {
    const data = toMinimalPlanByFestival(plan.value);
    const compressedData = compressToUrl(data);
    const url = `${location.origin}${location.pathname}?plan=${encodeURIComponent(compressedData)}`;

    if (navigator.share) {
      navigator.share({
        title: '我的音樂祭行程',
        text: '來看看我的音樂祭行程安排！',
        url
      }).catch(error => {
        console.error('分享失敗:', error);
        // 如果 navigator.share 失敗，回退到複製網址的方式
        fallbackShare(url);
      });
    } else {
      fallbackShare(url);
    }
  } catch (error) {
    console.error('生成分享網址失敗:', error);
    alert('生成分享網址失敗，請稍後再試');
  }
}

function fallbackShare(url) {
  if (navigator.clipboard && window.isSecureContext) {
    // 使用 Clipboard API
    navigator.clipboard.writeText(url).then(() => {
      alert('分享網址已複製到剪貼簿！');
    }).catch(error => {
      console.error('複製到剪貼簿失敗:', error);
      // 回退到 prompt
      prompt('複製以下網址分享：', url);
    });
  } else {
    // 回退到 prompt
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

<style scoped></style>

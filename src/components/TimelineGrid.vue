<template>
  <div class="timeline-scroll-container" ref="scrollRef">
    <div class="timeline-container" :style="gridStyle(stages.length)">
      <!-- 表頭 -->
      <div class="time-column-header" :style="{ gridColumn: 1, gridRow: 1 }">時間</div>
      <div
        v-for="(stage, index) in stages"
        :key="stage.key || stage.name"
        class="stage-column-header"
        :style="{ gridColumn: index + 2, gridRow: 1 }"
      >
        {{ stage.name }}
      </div>

      <!-- 時間欄 + 背景 -->
      <template v-for="(slot, i) in timeSlots" :key="slot.timestamp">
        <div
          class="time-cell"
          :class="{ 'row-line-minor': !slot.major }"
          :style="{ gridColumn: 1, gridRow: i + 2 }"
        >
          <span v-if="i > 0 && slot.major">{{ slot.time }}</span>
        </div>
        <div
          v-for="(_, sIdx) in stages"
          :key="`bg-${sIdx}-${i}`"
          class="grid-bg-cell"
          :class="{ 'row-line-minor': !slot.major }"
          :style="{ gridColumn: sIdx + 2, gridRow: i + 2 }"
        />
      </template>

      <!-- 目前時間指示線 -->
      <div
        v-if="showCurrentTime && currentOffset(now) !== null"
        ref="indicatorRef"
        class="flex flex-row items-start z-30 pointer-events-none w-full"
        :style="currentLineStyle(now)"
      >
        <div
          class="text-red-500 bg-red-50 px-1 text-[10px] sm:text-xs font-bold shrink-0 shadow-sm mr-1 rounded w-[var(--time-col-width,55px)] md:w-[var(--time-col-width,80px)] text-center transform -translate-y-1/2 ml-1"
        >
          {{ formatTime(now, is24Hour) }}
        </div>
        <div class="flex-1 border-t-[3px] border-red-500 relative transform -translate-y-1/2">
          <div
            class="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-red-500 absolute top-1/2 -left-1 transform -translate-y-1/2"
          />
        </div>
      </div>

      <!-- 演出區塊 -->
      <template v-for="(stage, stageIndex) in stages" :key="`perf-${stage.key || stage.name}`">
        <div
          v-for="perf in performancesByStage[stage.name] || []"
          :key="perf.id || `${perf.artist}_${perf.start}`"
          class="performance-block relative m-1 rounded p-2 text-sm shadow transition-transform hover:scale-[1.02]"
          :class="[getPerfClasses(perf), liveClasses(perf), conflictClasses(perf)]"
          :style="perfStyle(perf, stageIndex)"
          @click="$emit('perfClick', { perf, stage })"
        >
          <div class="flex items-center gap-1">
            <span v-if="isLive(perf)" class="text-[10px] font-bold bg-red-500 text-white px-1 rounded animate-pulse">
              LIVE
            </span>
            <span v-if="conflictsFor(perf)" class="text-[10px] font-bold bg-amber-500 text-white px-1 rounded" :title="conflictsFor(perf)">
              ⚠
            </span>
            <span class="font-bold truncate">{{ perf.artist }}</span>
          </div>
          <div class="text-xs opacity-80">
            {{ formatTimeRange(perf.start, perf.end, is24Hour) }}
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, nextTick, watch } from 'vue';
import { useTimelineGrid } from '../composables/useTimelineGrid';
import { formatTime, formatTimeRange } from '../utils/format';

const props = defineProps({
  // [{ name, key? }]
  stages: { type: Array, required: true },
  // 全部演出（已經帶 stage 欄位）
  performances: { type: Array, required: true },
  is24Hour: { type: Boolean, default: true },
  showCurrentTime: { type: Boolean, default: false },
  now: { type: Date, default: () => new Date() },
  // (perf) => 'bg-blue-600 text-white' 之類
  perfClassResolver: { type: Function, default: null },
  // 是否偵測跨舞台時間衝突（個人行程才需要，跑馬燈時間表不需要）
  detectConflicts: { type: Boolean, default: false },
});

defineEmits(['perfClick']);

const scrollRef = ref(null);
const indicatorRef = ref(null);

const { timeSlots, gridStyle, perfStyle, currentOffset, currentLineStyle } = useTimelineGrid(
  () => props.performances,
  () => props.is24Hour
);

const performancesByStage = computed(() => {
  /** @type {Record<string, any[]>} */
  const map = {};
  for (const perf of props.performances) {
    if (!map[perf.stage]) map[perf.stage] = [];
    map[perf.stage].push(perf);
  }
  return map;
});

function getPerfClasses(perf) {
  if (props.perfClassResolver) return props.perfClassResolver(perf);
  return 'bg-blue-600 text-white';
}

function isLive(perf) {
  if (!props.showCurrentTime) return false;
  const nowMs = props.now.getTime();
  const start = new Date(perf.start).getTime();
  const end = perf.end ? new Date(perf.end).getTime() : start + 30 * 60000;
  return nowMs >= start && nowMs <= end;
}

function liveClasses(perf) {
  return isLive(perf) ? 'ring-2 ring-red-500 ring-offset-1' : '';
}

// 衝突偵測：對每個 perf 找出時間重疊但 stage 不同的演出
const conflictMap = computed(() => {
  /** @type {Map<string, string[]>} */
  const map = new Map();
  if (!props.detectConflicts) return map;
  const list = props.performances.map((p, idx) => ({
    idx,
    p,
    start: new Date(p.start).getTime(),
    end: p.end ? new Date(p.end).getTime() : new Date(p.start).getTime() + 30 * 60000,
  }));
  for (let i = 0; i < list.length; i++) {
    for (let j = i + 1; j < list.length; j++) {
      const a = list[i];
      const b = list[j];
      if (a.p.stage === b.p.stage) continue;
      if (a.start < b.end && b.start < a.end) {
        const idA = idKey(a.p);
        const idB = idKey(b.p);
        map.set(idA, [...(map.get(idA) || []), b.p.artist]);
        map.set(idB, [...(map.get(idB) || []), a.p.artist]);
      }
    }
  }
  return map;
});

function idKey(perf) {
  return perf.id || `${perf.artist}_${perf.start}`;
}

function conflictsFor(perf) {
  const arr = conflictMap.value.get(idKey(perf));
  return arr && arr.length > 0 ? `時間衝突：${arr.join('、')}` : '';
}

function conflictClasses(perf) {
  return conflictsFor(perf) ? 'outline outline-2 outline-amber-500 outline-offset-1' : '';
}

function scrollToCurrent() {
  if (!props.showCurrentTime) return;
  nextTick(() => {
    const container = scrollRef.value;
    const indicator = indicatorRef.value;
    if (!container || !indicator) return;
    const cRect = container.getBoundingClientRect();
    const iRect = indicator.getBoundingClientRect();
    container.scrollTop = Math.max(
      0,
      container.scrollTop + iRect.top - cRect.top - container.clientHeight / 3
    );
  });
}

watch(
  () => props.showCurrentTime,
  (val) => {
    if (val) scrollToCurrent();
  },
  { immediate: true }
);

watch(timeSlots, () => {
  if (props.showCurrentTime) scrollToCurrent();
});

defineExpose({ scrollToCurrent });
</script>

<style scoped>
.timeline-scroll-container {
  overflow-x: auto;
  overflow-y: auto;
  max-height: calc(100vh - 200px);
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;
  scrollbar-color: var(--tg-border) var(--tg-header-bg);
  border: 1px solid var(--tg-border);
  border-radius: 0.5rem;
}
.timeline-scroll-container::-webkit-scrollbar {
  height: 8px;
  width: 8px;
}
.timeline-scroll-container::-webkit-scrollbar-track {
  background: var(--tg-header-bg);
  border-radius: 4px;
}
.timeline-scroll-container::-webkit-scrollbar-thumb {
  background: var(--tg-border);
  border-radius: 4px;
}
.timeline-scroll-container::-webkit-scrollbar-thumb:hover {
  background: var(--tg-border-light);
}
.timeline-container {
  background: var(--tg-border-light);
  min-width: 100%;
  color: var(--tg-text);
}
.time-column-header {
  background: var(--tg-header-bg);
  font-weight: 600;
  padding: 0.75rem;
  border-right: 1px solid var(--tg-border);
  border-bottom: 2px solid var(--tg-border);
  text-align: center;
  position: sticky;
  top: 0;
  left: 0;
  z-index: 30;
  color: var(--tg-text);
}
.stage-column-header {
  background: var(--tg-header-bg);
  font-weight: 600;
  padding: 0.75rem;
  border-right: 1px solid var(--tg-border);
  border-bottom: 2px solid var(--tg-border);
  text-align: center;
  position: sticky;
  top: 0;
  z-index: 20;
  color: var(--tg-text);
}
.time-cell {
  background: var(--tg-bg);
  padding: 0;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  font-family: 'Courier New', monospace;
  font-size: 0.8rem;
  font-weight: 500;
  border-right: 1px solid var(--tg-border-light);
  border-top: 1px solid var(--tg-border-light);
  position: sticky;
  left: 0;
  z-index: 15;
  color: var(--tg-text);
}
.time-cell span {
  transform: translateY(-50%);
  background: var(--tg-bg);
  padding: 0 4px;
}
.grid-bg-cell {
  background: var(--tg-bg);
  border-right: 1px solid var(--tg-border-light);
  border-top: 1px solid var(--tg-border-light);
}
.grid-bg-cell:nth-child(even) {
  background: var(--tg-bg-alt);
}
/* 5 分鐘的半格線：淡化成虛點，作為輔助參考，不搶走 10 分鐘整點線 */
.time-cell.row-line-minor,
.grid-bg-cell.row-line-minor {
  border-top-style: dotted;
  border-top-color: var(--tg-border-light);
}
@media (max-width: 768px) {
  .timeline-container {
    --stage-col-width: 70px;
    --time-col-width: 55px;
    font-size: 0.75rem;
  }
  .stage-column-header,
  .time-column-header {
    padding: 0.5rem 0.25rem;
    font-size: 0.7rem;
  }
  .time-cell {
    padding: 0.375rem 0.25rem;
    font-size: 0.7rem;
  }
}
@media (max-width: 480px) {
  .timeline-container {
    --stage-col-width: 80px;
    --time-col-width: 55px;
  }
}
</style>

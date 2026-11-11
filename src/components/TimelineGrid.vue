<template>
  <!-- 可捲動區域要能用鍵盤聚焦，方向鍵才捲得動 -->
  <div class="timeline-scroll-container" ref="scrollRef" tabindex="0" role="region" aria-label="時間軸，左右捲動查看舞台、上下捲動查看時間">
    <div class="timeline-container" :style="gridStyle(stages.length)">
      <!-- 表頭 -->
      <div class="time-column-header" :style="{ gridColumn: 1, gridRow: 1 }">時間</div>
      <div
        v-for="(stage, index) in stages"
        :key="stage.key || stage.name"
        class="stage-column-header"
        :style="{ gridColumn: index + 2, gridRow: 1 }"
      >
        <div class="stage-column-name">{{ stage.name }}</div>
        <!-- 同一天有多個音樂祭時，用小字標出這個舞台屬於哪一場 -->
        <div v-if="stage.group" class="stage-column-group" :title="stage.group">{{ stage.group }}</div>
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
          class="text-(--md-sys-color-on-error-container) bg-(--md-sys-color-error-container) px-1 text-[10px] sm:text-xs font-bold shrink-0 shadow-xs mr-1 rounded-sm w-(--time-col-width,55px) md:w-[var(--time-col-width,80px)] text-center transform -translate-y-1/2 ml-1"
        >
          {{ formatTime(now, is24Hour) }}
        </div>
        <div class="flex-1 border-t-[3px] border-(--md-sys-color-error) relative transform -translate-y-1/2">
          <div
            class="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-(--md-sys-color-error) absolute top-1/2 -left-1 transform -translate-y-1/2"
          />
        </div>
      </div>

      <!-- 演出區塊 -->
      <template v-for="(stage, stageIndex) in stages" :key="`perf-${stage.key || stage.name}`">
        <div
          v-for="perf in performancesByStage[stage.columnKey ?? stage.name] || []"
          :key="perf.id || `${perf.artist}_${perf.start}`"
          class="performance-block relative rounded-md shadow-xs transition-transform hover:scale-[1.02] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--md-sys-color-on-surface)"
          :class="[sizeClasses(perf), getPerfClasses(perf), liveClasses(perf), conflictClasses(perf)]"
          :style="perfStyle(perf, stageIndex)"
          :role="interactive ? 'button' : undefined"
          :tabindex="interactive ? 0 : undefined"
          :aria-pressed="interactive && selectedResolver ? !!selectedResolver(perf) : undefined"
          :aria-label="blockLabel(perf, stage)"
          @click="$emit('perfClick', { perf, stage })"
          @keydown.enter.prevent="$emit('perfClick', { perf, stage })"
          @keydown.space.prevent="$emit('perfClick', { perf, stage })"
        >
          <div class="flex items-baseline flex-wrap gap-x-2">
            <span class="flex items-start gap-1 shrink-0 max-w-full">
              <!-- 已加入的方塊多一個勾號：不能只靠顏色深淺分辨（色弱、低對比環境） -->
              <span
                v-if="selectedResolver && selectedResolver(perf)"
                class="text-[10px] font-bold leading-4 shrink-0"
                aria-hidden="true"
              >✓</span>
              <span v-if="isLive(perf)" class="text-[10px] font-bold bg-(--md-sys-color-error) text-(--md-sys-color-on-error) px-1 rounded-sm animate-pulse shrink-0">
                LIVE
              </span>
              <span v-if="conflictsFor(perf)" class="text-[10px] font-bold bg-amber-600 text-white px-1 rounded-sm shrink-0" :title="conflictsFor(perf)">
                ⚠
              </span>
              <span v-marquee="settingsStore.enableMarqueeAnimation" class="marquee-viewport min-w-0">
                <span class="marquee-track font-bold">{{ perf.artist }}</span>
              </span>
            </span>
            <span class="text-[0.85em] opacity-80 shrink-0">
              {{ formatTimeRange(perf.start, perf.end, is24Hour) }}
            </span>
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
import { useSettingsStore } from '../stores/settings';

const settingsStore = useSettingsStore();

const props = defineProps({
  // [{ name, key?, columnKey?, group? }]
  // key：只給 Vue 的 v-for 用。
  // columnKey：決定演出放進哪一欄（預設用 name）。不同音樂祭可能有同名舞台（例如都叫「主舞台」），
  //            這時要給 columnKey，並在演出上帶同樣的 columnKey，才不會被併到同一欄。
  // group：顯示在舞台名稱下方的小字（例如音樂祭名稱）。
  stages: { type: Array, required: true },
  // 全部演出（已經帶 stage 欄位）
  performances: { type: Array, required: true },
  is24Hour: { type: Boolean, default: true },
  showCurrentTime: { type: Boolean, default: false },
  now: { type: Date, default: () => new Date() },
  // (perf) => 'bg-(--md-sys-color-primary) text-(--md-sys-color-on-primary)' 之類；沒給就用主題主色
  perfClassResolver: { type: Function, default: null },
  // 是否偵測跨舞台時間衝突（個人行程才需要，跑馬燈時間表不需要）
  detectConflicts: { type: Boolean, default: false },
  // 方塊可點（加入／移除）時設 true：會變成可用鍵盤操作的 button
  interactive: { type: Boolean, default: false },
  // (perf) => boolean：這場是否已在行程裡。用來畫勾號與 aria-pressed
  selectedResolver: { type: Function, default: null },
});

defineEmits(['perfClick']);

const scrollRef = ref(null);
const indicatorRef = ref(null);

const { timeSlots, gridStyle, perfStyle, currentOffset, currentLineStyle } = useTimelineGrid(
  () => props.performances,
  () => props.is24Hour
);

/** 演出所屬欄位的 key：有 columnKey 用 columnKey，否則用舞台名稱。 */
function columnKey(perf) {
  return perf.columnKey ?? perf.stage;
}

const performancesByStage = computed(() => {
  /** @type {Record<string, any[]>} */
  const map = {};
  for (const perf of props.performances) {
    const key = columnKey(perf);
    if (!map[key]) map[key] = [];
    map[key].push(perf);
  }
  return map;
});

/** 螢幕閱讀器聽到的完整描述：藝人、舞台、時間、狀態 */
function blockLabel(perf, stage) {
  const parts = [perf.artist, stage.name, formatTimeRange(perf.start, perf.end, props.is24Hour)];
  if (isLive(perf)) parts.push('進行中');
  if (perf.isPast) parts.push('已結束');
  const conflict = conflictsFor(perf);
  if (conflict) parts.push(conflict);
  return parts.join('，');
}

function getPerfClasses(perf) {
  if (props.perfClassResolver) return props.perfClassResolver(perf);
  return 'bg-(--md-sys-color-primary) text-(--md-sys-color-on-primary)';
}

// 演出時長很短（例如開場儀式、報到）時，方塊本身的格高有限，
// 縮小內距與字級讓內容盡量塞得下，同時仍保持方塊高度對應真實時長。
function sizeClasses(perf) {
  const start = new Date(perf.start).getTime();
  const end = perf.end ? new Date(perf.end).getTime() : start + 30 * 60000;
  return end - start <= 15 * 60000 ? 'm-0.5 p-1 text-xs' : 'm-1 p-2 text-sm';
}

function isLive(perf) {
  if (!props.showCurrentTime) return false;
  const nowMs = props.now.getTime();
  const start = new Date(perf.start).getTime();
  const end = perf.end ? new Date(perf.end).getTime() : start + 30 * 60000;
  return nowMs >= start && nowMs <= end;
}

function liveClasses(perf) {
  return isLive(perf) ? 'ring-2 ring-(--md-sys-color-error) ring-offset-1' : '';
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
      if (columnKey(a.p) === columnKey(b.p)) continue;
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
  return conflictsFor(perf) ? 'outline outline-2 outline-amber-600 outline-offset-1' : '';
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

// 團名超出可用寬度（欄位太窄、或方塊太短擠不下）時，
// 讓文字左右跑馬燈捲動，而不是換行或截斷──方塊大小仍精準對應時間。
function prefersReducedMotion() {
  return typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
}

// keyframe 設計是「停頓 10% → 移動 35% → 停頓 10% → 移動 35% → 停頓 10%」，
// 真正在移動的時間只佔整個週期的 70%（每個方向各 35%），
// 算 duration 時得把這個比例算進去，不然實際捲動速度會比 PX_PER_SECOND 快上好幾倍。
const TRAVEL_FRACTION = 0.35;
const PX_PER_SECOND = 15;

function setupMarquee(el) {
  const track = el.firstElementChild;
  if (!track) return;
  const overflow = track.scrollWidth - el.clientWidth;
  const wouldOverflow = overflow > 2;

  if (el.__marqueeEnabled === false || prefersReducedMotion()) {
    el.classList.remove('is-overflowing');
    track.style.removeProperty('--marquee-shift');
    track.style.removeProperty('--marquee-duration');
    // 動畫關閉時，放不下的團名就直接用「…」截斷，而不是硬生生切字。
    el.classList.toggle('is-truncated', wouldOverflow);
    return;
  }

  el.classList.remove('is-truncated');
  if (wouldOverflow) {
    const shift = -(overflow + 8);
    const duration = Math.abs(shift) / (PX_PER_SECOND * TRAVEL_FRACTION);
    track.style.setProperty('--marquee-shift', `${shift}px`);
    track.style.setProperty('--marquee-duration', `${Math.max(4, duration)}s`);
    el.classList.add('is-overflowing');
  } else {
    el.classList.remove('is-overflowing');
    track.style.removeProperty('--marquee-shift');
  }
}

const vMarquee = {
  mounted(el, binding) {
    el.__marqueeEnabled = binding.value;
    setupMarquee(el);
    el.__marqueeResizeObserver = new ResizeObserver(() => setupMarquee(el));
    el.__marqueeResizeObserver.observe(el);
  },
  updated(el, binding) {
    el.__marqueeEnabled = binding.value;
    setupMarquee(el);
  },
  unmounted(el) {
    el.__marqueeResizeObserver?.disconnect();
  },
};
</script>

<style scoped>
.timeline-scroll-container {
  overflow-x: auto;
  overflow-y: auto;
  /* 桌面：扣掉頂欄與標題；手機另外扣掉底部導覽（見下方 media query）。dvh 會隨手機瀏覽器工具列收合而變 */
  max-height: calc(100dvh - 200px);
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
  --stage-col-width: 267px;
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
.stage-column-group {
  margin-top: 0.125rem;
  font-size: 0.7em;
  font-weight: 400;
  opacity: 0.75;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.time-cell {
  background: var(--tg-bg);
  padding: 0;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
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
.marquee-viewport {
  display: block;
  overflow: hidden;
  position: relative;
}
.marquee-track {
  display: inline-block;
  white-space: nowrap;
  will-change: transform;
}
.marquee-viewport.is-overflowing .marquee-track {
  animation: marquee-scroll var(--marquee-duration, 6s) ease-in-out infinite;
}
.marquee-viewport.is-truncated .marquee-track {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
}
@keyframes marquee-scroll {
  0%, 10% {
    transform: translateX(0);
  }
  45%, 55% {
    transform: translateX(var(--marquee-shift, 0));
  }
  90%, 100% {
    transform: translateX(0);
  }
}
@media (prefers-reduced-motion: reduce) {
  .marquee-viewport.is-overflowing .marquee-track {
    animation: none;
  }
}
/* 5 分鐘的半格線：淡化成虛點，作為輔助參考，不搶走 10 分鐘整點線 */
.time-cell.row-line-minor,
.grid-bg-cell.row-line-minor {
  border-top-style: dotted;
  border-top-color: var(--tg-border-light);
}
@media (max-width: 768px) {
  .timeline-scroll-container {
    max-height: calc(100dvh - 16rem);
  }
  .timeline-container {
    /* 手機一屏約可放 2.5 個舞台欄，團名放得下又不必捲太遠 */
    --stage-col-width: 120px;
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
    --stage-col-width: 110px;
    --time-col-width: 55px;
  }
}
</style>

<template>
  <div
    class="relative rounded-xl p-4 mb-3 cursor-pointer transition-colors overflow-hidden"
    :class="
      status.tone === 'past'
        ? 'bg-[var(--md-sys-color-surface-container-low)] hover:bg-[var(--md-sys-color-surface-container)]'
        : 'bg-[var(--md-sys-color-surface-container)] hover:bg-[var(--md-sys-color-surface-container-high)]'
    "
    role="button"
    tabindex="0"
    :aria-label="`${festival.name}，${status.label}${plannedCount ? `，已加入 ${plannedCount} 場` : ''}`"
    @click="$emit('click')"
    @keydown.enter.prevent="$emit('click')"
    @keydown.space.prevent="$emit('click')"
  >
    <md-ripple></md-ripple>
    <md-elevation style="--md-elevation-level: 1"></md-elevation>

    <!-- 活動主題色：左側細條，讓列表一眼能分辨不同活動 -->
    <span
      v-if="accent"
      class="absolute inset-y-0 left-0 w-1"
      :style="{ background: accent }"
      aria-hidden="true"
    />

    <div class="flex items-start gap-3">
      <div class="min-w-0 flex-1">
        <div class="flex items-center gap-2 flex-wrap mb-1">
          <StatusChip :label="status.label" :tone="status.tone" />
          <span
            v-if="plannedCount > 0"
            class="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)]"
          >
            <MdIcon name="check_circle" style="--md-icon-size: 14px" />
            已加入 {{ plannedCount }} 場
          </span>
        </div>
        <h3
          class="font-bold text-lg leading-snug text-[var(--md-sys-color-on-surface)]"
          :class="status.tone === 'past' ? 'opacity-80' : ''"
        >
          {{ festival.name }}
        </h3>
        <div class="text-sm text-[var(--md-sys-color-on-surface-variant)] mt-1 flex items-center gap-1">
          <MdIcon name="event" style="--md-icon-size: 16px" class="shrink-0" />
          <span>{{ formatDateRange(festival.startTime, festival.endTime) }}</span>
        </div>
        <div class="text-sm text-[var(--md-sys-color-on-surface-variant)] mt-0.5 flex items-center gap-1 min-w-0">
          <MdIcon name="location_on" style="--md-icon-size: 16px" class="shrink-0" />
          <span class="truncate">{{ festival.location?.name || '地點未提供' }}</span>
        </div>
        <div class="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-2 flex items-center gap-x-3 gap-y-1 flex-wrap">
          <span v-if="stageCount">{{ stageCount }} 個舞台</span>
          <span v-if="performanceCount">{{ performanceCount }} 場演出</span>
          <span v-if="isCached" class="inline-flex items-center gap-1">
            <MdIcon name="offline_pin" style="--md-icon-size: 14px" />
            已可離線
          </span>
        </div>
      </div>
      <MdIcon
        name="chevron_right"
        class="shrink-0 text-[var(--md-sys-color-on-surface-variant)] self-center"
      />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { usePlanStore } from '../stores/plan';
import { useFestivalStore } from '../stores/festival';
import { formatDateRange, festivalStatus } from '../utils/format';
import MdIcon from './MdIcon.vue';
import StatusChip from './StatusChip.vue';

const props = defineProps({
  festival: { type: Object, required: true },
});
defineEmits(['click']);

const planStore = usePlanStore();
const festivalStore = useFestivalStore();

const status = computed(() => festivalStatus(props.festival.startTime, props.festival.endTime));

// 可能是索引項目（stageCount / performanceCount）或完整資料（stages[]）
const stageCount = computed(() => props.festival.stageCount ?? props.festival.stages?.length ?? 0);
const performanceCount = computed(
  () =>
    props.festival.performanceCount ??
    (props.festival.stages || []).reduce((sum, s) => sum + (s.performances?.length || 0), 0)
);

const plannedCount = computed(
  () => planStore.myPlan.filter((p) => p.festivalId === props.festival.festivalId).length
);

const accent = computed(() => props.festival.themePrimary || props.festival.theme?.primary || '');

// 這份資料已在裝置上、離線可讀
const isCached = computed(() => festivalStore.isCached(props.festival.festivalId));
</script>

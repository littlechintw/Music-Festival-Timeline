<template>
  <div class="p-4 max-w-full mx-auto">
    <div v-if="festivalStore.loading && !festival" class="text-[var(--md-sys-color-on-surface-variant)]">
      載入中...
    </div>
    <div v-else-if="!festival">
      <PageHeader title="找不到此音樂祭" back="/" />
    </div>
    <div v-else>
      <PageHeader
        :title="festival.name"
        subtitle="全日時間軸"
        :back="{ name: 'FestivalDetail', params: { id: festival.festivalId } }"
      >
        <template #actions>
          <md-icon-button
            v-if="isToday"
            type="button"
            aria-label="跳到現在"
            title="跳到現在"
            @click="gridRef?.scrollToCurrent()"
          >
            <MdIcon name="my_location" />
          </md-icon-button>
          <md-icon-button
            v-if="festival.map && festival.map.image"
            type="button"
            aria-label="場地地圖"
            @click="router.push({ name: 'MapView', params: { id: festival.festivalId } })"
          >
            <MdIcon name="map" />
          </md-icon-button>
        </template>
      </PageHeader>

      <DayChips v-model="selectedDay" :days="festivalDays" class="mb-3" />

      <!-- 圖例＋操作提示，一行搞定 -->
      <div
        class="flex items-center gap-x-4 gap-y-1 flex-wrap text-xs text-[var(--md-sys-color-on-surface-variant)] mb-3"
      >
        <span class="inline-flex items-center gap-1">
          <span class="w-3 h-3 rounded-sm bg-[var(--md-sys-color-primary)] inline-block" />
          已加入
        </span>
        <span class="inline-flex items-center gap-1">
          <span class="w-3 h-3 rounded-sm bg-[var(--md-sys-color-primary-container)] border-l-2 border-[var(--md-sys-color-primary)] inline-block" />
          未加入
        </span>
        <span class="ml-auto">點方塊加入／移除・左右滑動看其他舞台</span>
      </div>

      <TimelineGrid
        ref="gridRef"
        :stages="stagesForGrid"
        :performances="performancesForDay"
        :is24-hour="settingsStore.is24Hour"
        :show-current-time="isToday"
        :now="now"
        :perf-class-resolver="resolvePerfClass"
        :selected-resolver="inPlan"
        interactive
        @perf-click="onPerfClick"
      />
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useFestivalStore } from '../stores/festival';
import { usePlanStore } from '../stores/plan';
import { useSettingsStore } from '../stores/settings';
import { useNowTicker } from '../composables/useNowTicker';
import { makePerfId } from '../utils/perfId';
import { WEEKDAYS_ZH } from '../utils/format';
import { useToast, haptic } from '../composables/useToast';
import TimelineGrid from '../components/TimelineGrid.vue';
import PageHeader from '../components/PageHeader.vue';
import DayChips from '../components/DayChips.vue';
import MdIcon from '../components/MdIcon.vue';

const route = useRoute();
const router = useRouter();
const festivalStore = useFestivalStore();
const planStore = usePlanStore();
const settingsStore = useSettingsStore();
const { now } = useNowTicker(1000);
const { showToast } = useToast();

const gridRef = ref(null);
const selectedDay = ref('');
const todayKey = new Date().toDateString();

const festival = computed(() => festivalStore.getById(route.params.id));

const festivalDays = computed(() => {
  if (!festival.value) return [];
  const set = new Set();
  for (const stage of festival.value.stages) {
    for (const perf of stage.performances) {
      set.add(new Date(perf.start).toDateString());
    }
  }
  return Array.from(set)
    .map((key) => {
      const date = new Date(key);
      return {
        key,
        date,
        isToday: key === todayKey,
        label: `${date.getMonth() + 1}/${date.getDate()} (${WEEKDAYS_ZH[date.getDay()].replace('星期', '')})`,
      };
    })
    .sort((a, b) => a.date.getTime() - b.date.getTime());
});

watch(
  festivalDays,
  (days) => {
    if (days.length === 0) return;
    if (days.some((d) => d.key === selectedDay.value)) return;
    selectedDay.value = (days.find((d) => d.isToday) || days[0]).key;
  },
  { immediate: true }
);

const stagesForGrid = computed(() => {
  if (!festival.value) return [];
  return festival.value.stages.map((s) => ({ name: s.name, key: s.id }));
});

const performancesForDay = computed(() => {
  if (!festival.value || !selectedDay.value) return [];
  const result = [];
  for (const stage of festival.value.stages) {
    for (const perf of stage.performances) {
      if (new Date(perf.start).toDateString() !== selectedDay.value) continue;
      result.push({ ...perf, stage: stage.name, _stage: stage });
    }
  }
  return result;
});

const isToday = computed(() => !!selectedDay.value && selectedDay.value === todayKey);

function inPlan(perf) {
  if (!festival.value) return false;
  const id = makePerfId(festival.value, perf._stage || { name: perf.stage }, perf);
  return planStore.myPlan.some((p) => (p.id || '') === id);
}

function resolvePerfClass(perf) {
  return inPlan(perf)
    ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] cursor-pointer'
    : 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] border-l-4 border-[var(--md-sys-color-primary)] hover:bg-[var(--md-sys-color-secondary-container)] cursor-pointer';
}

function onPerfClick({ perf }) {
  if (!festival.value) return;
  const stage = perf._stage || { name: perf.stage };
  const id = makePerfId(festival.value, stage, perf);
  if (inPlan(perf)) {
    planStore.removePerformance(id);
    haptic(15);
    showToast({ message: `已移除：${perf.artist}` });
  } else {
    planStore.addPerformance({
      ...perf,
      stage: stage.name,
      festivalId: festival.value.festivalId,
      festivalName: festival.value.name,
      id,
    });
    haptic([30, 30, 30]);
    showToast({ message: `已加入：${perf.artist}`, kind: 'success', icon: '✓' });
  }
}

onMounted(() => {
  festivalStore.ensureLoaded();
});
</script>

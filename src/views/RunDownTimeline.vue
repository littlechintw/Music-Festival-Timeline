<template>
  <div class="p-4 max-w-full mx-auto">
    <h2 class="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">
      {{ festival?.name }} - 全日時間軸
    </h2>
    <div v-if="festivalStore.loading && !festival" class="text-gray-500 dark:text-gray-400">
      載入中...
    </div>
    <div v-else-if="!festival" class="text-gray-500 dark:text-gray-400">找不到此音樂祭</div>
    <div v-else>
      <div v-if="festivalDays.length > 1" class="flex gap-2 mb-4 overflow-x-auto pb-2">
        <button
          v-for="day in festivalDays"
          :key="day.dateKey"
          class="px-3 py-1 rounded border text-sm whitespace-nowrap flex-shrink-0 transition-colors"
          :class="
            selectedDay === day.dateKey
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-300 border-blue-600 dark:border-blue-500 hover:bg-blue-50 dark:hover:bg-gray-700'
          "
          @click="selectedDay = day.dateKey"
        >
          {{ day.label }}
        </button>
      </div>

      <div
        class="mobile-scroll-hint md:hidden bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-200 text-sm px-3 py-2 rounded-lg mb-4 flex items-center gap-2"
      >
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path
            fill-rule="evenodd"
            d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
            clip-rule="evenodd"
          />
        </svg>
        左右滑動查看所有舞台
      </div>

      <TimelineGrid
        :stages="stagesForGrid"
        :performances="performancesForDay"
        :is24-hour="settingsStore.is24Hour"
        :show-current-time="isToday"
        :now="now"
        :perf-class-resolver="resolvePerfClass"
        @perf-click="onPerfClick"
      />
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useFestivalStore } from '../stores/festival';
import { usePlanStore } from '../stores/plan';
import { useSettingsStore } from '../stores/settings';
import { useNowTicker } from '../composables/useNowTicker';
import { makePerfId } from '../utils/perfId';
import { WEEKDAYS_ZH } from '../utils/format';
import { useToast, haptic } from '../composables/useToast';
import TimelineGrid from '../components/TimelineGrid.vue';

const route = useRoute();
const festivalStore = useFestivalStore();
const planStore = usePlanStore();
const settingsStore = useSettingsStore();
const { now } = useNowTicker(1000);
const { showToast } = useToast();

const selectedDay = ref('');

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
    .map((dateKey) => {
      const date = new Date(dateKey);
      return {
        dateKey,
        label: `${date.toLocaleDateString('zh-TW', { month: 'long', day: 'numeric' })} (${WEEKDAYS_ZH[date.getDay()]})`,
        date,
      };
    })
    .sort((a, b) => a.date.getTime() - b.date.getTime());
});

watch(
  festivalDays,
  (days) => {
    if (days.length > 0 && !selectedDay.value) selectedDay.value = days[0].dateKey;
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

const isToday = computed(() => {
  if (!selectedDay.value) return false;
  return new Date(selectedDay.value).toDateString() === new Date().toDateString();
});

function inPlan(perf) {
  if (!festival.value) return false;
  const id = makePerfId(festival.value, perf._stage || { name: perf.stage }, perf);
  return planStore.myPlan.some((p) => (p.id || '') === id);
}

function resolvePerfClass(perf) {
  return inPlan(perf)
    ? 'bg-blue-600 text-white cursor-pointer'
    : 'bg-blue-50 text-blue-800 border-l-4 border-blue-600 hover:bg-blue-100 cursor-pointer';
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

<style scoped>
@media (max-width: 768px) {
  .mobile-scroll-hint {
    animation: slideIn 0.3s ease-out;
  }
  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
}
</style>

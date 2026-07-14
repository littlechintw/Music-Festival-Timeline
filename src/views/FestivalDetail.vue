<template>
  <div class="p-4 max-w-3xl mx-auto">
    <div v-if="festivalStore.loading && !festival" class="text-gray-500 dark:text-gray-400">
      載入中...
    </div>
    <div v-else-if="!festival" class="text-gray-500 dark:text-gray-400">找不到此音樂祭</div>
    <div v-else>
      <div
        class="relative mb-4 rounded-lg p-4 bg-[var(--md-sys-color-surface-container)]"
        :style="headerStyle"
      >
        <md-elevation style="--md-elevation-level: 1"></md-elevation>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">{{ festival.name }}</h1>
        <div class="text-gray-600 dark:text-gray-300 text-sm">
          {{ formatDateTime(festival.startTime, settingsStore.is24Hour) }} ~
          {{ formatDateTime(festival.endTime, settingsStore.is24Hour) }}
        </div>
        <div class="text-sm text-gray-700 dark:text-gray-300">
          {{ festival.location.name }}｜{{ festival.location.address }}
        </div>
      </div>
      <div class="flex gap-2 mb-4">
        <md-filled-button type="button" @click="goTimeline">查看全日時間軸</md-filled-button>
        <md-filled-tonal-button
          type="button"
          v-if="festival.map && festival.map.image"
          @click="goMap"
        >
          查看場地地圖
        </md-filled-tonal-button>
      </div>
      <div class="mb-4">
        <h2 class="font-bold mb-2 text-gray-900 dark:text-gray-100">舞台與演出</h2>
        <div v-for="stage in festival.stages" :key="stage.id" class="mb-6">
          <h3 class="font-semibold text-lg mb-3 text-gray-900 dark:text-gray-100">
            {{ stage.name }}
          </h3>
          <div
            v-for="(dayPerformances, dayKey) in groupByDay(stage.performances)"
            :key="dayKey"
            class="mb-4"
          >
            <div
              class="bg-[var(--md-sys-color-surface-container-high)] px-3 py-2 rounded-t font-medium text-sm text-gray-700 dark:text-gray-200"
            >
              {{ formatDayHeader(dayKey) }}
            </div>
            <div class="bg-[var(--md-sys-color-surface-container-low)] rounded-b p-3">
              <div
                v-for="perf in dayPerformances"
                :key="perf.artist + perf.start"
                class="flex items-center gap-2 mb-2 last:mb-0"
              >
                <div class="flex-1 min-w-0">
                  <span class="font-mono text-sm text-gray-600 dark:text-gray-300">
                    {{ formatTimeRange(perf.start, perf.end, settingsStore.is24Hour) }}
                  </span>
                  <span class="ml-3 font-bold text-gray-900 dark:text-gray-100">
                    {{ perf.artist }}
                  </span>
                  <span
                    v-if="perf.description"
                    class="ml-2 text-gray-400 dark:text-gray-500 text-xs"
                  >
                    ({{ perf.description }})
                  </span>
                </div>
                <button
                  class="ml-2 px-3 py-1 rounded text-xs shrink-0 transition-colors"
                  :class="
                    inPlan(stage, perf)
                      ? 'bg-[var(--md-sys-color-surface-container-highest)] text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)]'
                      : 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)]'
                  "
                  @click="togglePlan(stage, perf)"
                >
                  {{ inPlan(stage, perf) ? '已加入（點擊移除）' : '加入我的行程' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div v-if="festival.map && festival.map.image">
        <h2 class="font-bold mb-2 text-gray-900 dark:text-gray-100">場地地圖</h2>
        <img
          :src="festival.map.image"
          alt="map"
          class="w-full max-w-md rounded border border-gray-200 dark:border-gray-700"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useFestivalStore } from '../stores/festival';
import { usePlanStore } from '../stores/plan';
import { useSettingsStore } from '../stores/settings';
import { formatDateTime, formatTimeRange, formatDayHeader } from '../utils/format';
import { makePerfId } from '../utils/perfId';
import { themeCssVars } from '../utils/theme';
import { trackEvent } from '../utils/analytics';
import { useToast, haptic } from '../composables/useToast';

const route = useRoute();
const router = useRouter();
const festivalStore = useFestivalStore();
const planStore = usePlanStore();
const settingsStore = useSettingsStore();
const { showToast } = useToast();

const festival = computed(() => festivalStore.getById(route.params.id));
const headerStyle = computed(() => themeCssVars(festival.value?.theme));

function groupByDay(performances) {
  const grouped = {};
  for (const perf of performances) {
    const key = new Date(perf.start).toDateString();
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(perf);
  }
  for (const key of Object.keys(grouped)) {
    grouped[key].sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
  }
  return grouped;
}

function inPlan(stage, perf) {
  const id = makePerfId(festival.value, stage, perf);
  return planStore.myPlan.some((p) => (p.id || '') === id);
}

function togglePlan(stage, perf) {
  if (!festival.value) return;
  const id = makePerfId(festival.value, stage, perf);
  if (inPlan(stage, perf)) {
    planStore.removePerformance(id);
    haptic(15);
    showToast({ message: `已移除：${perf.artist}` });
    trackEvent('remove_from_plan', { festival_id: festival.value.festivalId, artist: perf.artist });
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
    trackEvent('add_to_plan', { festival_id: festival.value.festivalId, artist: perf.artist });
  }
}

function goTimeline() {
  router.push({ name: 'RunDownTimeline', params: { id: route.params.id } });
}

function goMap() {
  router.push({ name: 'MapView', params: { id: route.params.id } });
}

watch(festival, (val) => {
  if (val) {
    trackEvent('view_festival', { festival_id: val.festivalId, festival_name: val.name });
  }
});

onMounted(() => {
  festivalStore.ensureLoaded();
});
</script>

<template>
  <div class="p-4 max-w-3xl mx-auto">
    <div v-if="festivalStore.loading && !festival" class="space-y-3" aria-busy="true">
      <div class="h-8 w-2/3 rounded bg-[var(--md-sys-color-surface-container)] animate-pulse" />
      <div class="h-24 rounded-xl bg-[var(--md-sys-color-surface-container)] animate-pulse" />
    </div>

    <div v-else-if="!festival" class="text-center py-12">
      <PageHeader title="找不到此音樂祭" back="/" />
      <p class="text-sm text-[var(--md-sys-color-on-surface-variant)]">
        可能已下架，或你還沒連線下載過這份資料。
      </p>
    </div>

    <div v-else>
      <PageHeader :title="festival.name" back="/">
        <template #actions>
          <md-icon-button
            v-if="festival.map && festival.map.image"
            type="button"
            aria-label="場地地圖"
            @click="goMap"
          >
            <MdIcon name="map" />
          </md-icon-button>
        </template>
      </PageHeader>

      <!-- 活動資訊卡 -->
      <section
        class="relative mb-4 rounded-xl p-4 bg-[var(--md-sys-color-surface-container)] overflow-hidden"
        :style="headerStyle"
      >
        <md-elevation style="--md-elevation-level: 1"></md-elevation>
        <span
          v-if="festival.theme?.primary"
          class="absolute inset-y-0 left-0 w-1"
          :style="{ background: festival.theme.primary }"
          aria-hidden="true"
        />
        <div class="flex items-center gap-2 flex-wrap mb-2">
          <StatusChip :label="status.label" :tone="status.tone" />
          <span
            v-if="plannedCount > 0"
            class="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)]"
          >
            <MdIcon name="check_circle" style="--md-icon-size: 14px" />
            已加入 {{ plannedCount }} 場
          </span>
        </div>
        <dl class="text-sm space-y-1.5 text-[var(--md-sys-color-on-surface)]">
          <div class="flex items-start gap-2">
            <MdIcon name="event" style="--md-icon-size: 18px" class="shrink-0 mt-0.5 text-[var(--md-sys-color-on-surface-variant)]" />
            <dd>
              {{ formatDateRange(festival.startTime, festival.endTime) }}
              <span class="text-[var(--md-sys-color-on-surface-variant)]">
                ・{{ formatTime(festival.startTime, settingsStore.is24Hour) }} 開始
              </span>
            </dd>
          </div>
          <div class="flex items-start gap-2">
            <MdIcon name="location_on" style="--md-icon-size: 18px" class="shrink-0 mt-0.5 text-[var(--md-sys-color-on-surface-variant)]" />
            <dd class="min-w-0">
              <div>{{ festival.location.name }}</div>
              <a
                :href="mapsUrl"
                target="_blank"
                rel="noopener"
                class="text-[var(--md-sys-color-primary)] text-xs inline-flex items-center gap-1 mt-0.5 hover:underline"
              >
                {{ festival.location.address }}
                <MdIcon name="open_in_new" style="--md-icon-size: 12px" />
              </a>
            </dd>
          </div>
          <div class="flex items-start gap-2 text-[var(--md-sys-color-on-surface-variant)]">
            <MdIcon name="stadium" style="--md-icon-size: 18px" class="shrink-0 mt-0.5" />
            <dd>{{ festival.stages.length }} 個舞台・{{ totalPerformances }} 場演出</dd>
          </div>
        </dl>
      </section>

      <div class="flex gap-2 mb-6">
        <md-filled-button type="button" class="flex-1" @click="goTimeline">
          <MdIcon name="calendar_view_month" slot="icon" />
          全日時間軸
        </md-filled-button>
        <md-filled-tonal-button
          v-if="festival.map && festival.map.image"
          type="button"
          class="flex-1"
          @click="goMap"
        >
          <MdIcon name="map" slot="icon" />
          場地地圖
        </md-filled-tonal-button>
      </div>

      <!-- 演出清單：先選日期，再依舞台列出，點整列即可加入／移除 -->
      <section aria-labelledby="lineup-heading">
        <div class="flex items-center justify-between mb-2">
          <h2 id="lineup-heading" class="font-bold text-[var(--md-sys-color-on-surface)]">
            演出陣容
          </h2>
          <span class="text-xs text-[var(--md-sys-color-on-surface-variant)]">
            點一下即可加入行程
          </span>
        </div>
        <DayChips v-model="selectedDay" :days="days" class="mb-3" />

        <div v-for="stage in stagesForDay" :key="stage.id" class="mb-5">
          <h3
            class="font-semibold text-sm text-[var(--md-sys-color-on-surface-variant)] mb-1.5 px-1 flex items-center justify-between"
          >
            <span>{{ stage.name }}</span>
            <span class="font-normal text-xs">{{ stage.performances.length }} 場</span>
          </h3>
          <ul class="rounded-xl overflow-hidden bg-[var(--md-sys-color-surface-container-low)] divide-y divide-[var(--md-sys-color-outline-variant)]">
            <li v-for="perf in stage.performances" :key="perf.artist + perf.start">
              <button
                type="button"
                class="relative w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors overflow-hidden"
                :class="
                  inPlan(stage, perf)
                    ? 'bg-[var(--md-sys-color-primary-container)]'
                    : 'hover:bg-[var(--md-sys-color-surface-container)]'
                "
                :aria-pressed="inPlan(stage, perf)"
                @click="togglePlan(stage, perf)"
              >
                <md-ripple></md-ripple>
                <span class="font-mono text-xs tabular-nums shrink-0 w-[6.5rem] whitespace-nowrap text-[var(--md-sys-color-on-surface-variant)]">
                  {{ formatTimeRange(perf.start, perf.end, settingsStore.is24Hour) }}
                </span>
                <span class="min-w-0 flex-1">
                  <span class="block font-bold text-[var(--md-sys-color-on-surface)] leading-snug">
                    {{ perf.artist }}
                  </span>
                  <span
                    v-if="perf.description"
                    class="block text-xs text-[var(--md-sys-color-on-surface-variant)] mt-0.5"
                  >
                    {{ perf.description }}
                  </span>
                </span>
                <span
                  class="shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                  :class="
                    inPlan(stage, perf)
                      ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)]'
                      : 'border border-[var(--md-sys-color-outline)] text-[var(--md-sys-color-primary)]'
                  "
                  aria-hidden="true"
                >
                  <MdIcon :name="inPlan(stage, perf) ? 'check' : 'add'" style="--md-icon-size: 18px" />
                </span>
              </button>
            </li>
          </ul>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, watch, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useFestivalStore } from '../stores/festival';
import { usePlanStore } from '../stores/plan';
import { useSettingsStore } from '../stores/settings';
import { formatTime, formatTimeRange, formatDateRange, festivalStatus, WEEKDAYS_ZH } from '../utils/format';
import { makePerfId } from '../utils/perfId';
import { themeCssVars } from '../utils/theme';
import { trackEvent } from '../utils/analytics';
import { useToast, haptic } from '../composables/useToast';
import MdIcon from '../components/MdIcon.vue';
import PageHeader from '../components/PageHeader.vue';
import DayChips from '../components/DayChips.vue';
import StatusChip from '../components/StatusChip.vue';

const route = useRoute();
const router = useRouter();
const festivalStore = useFestivalStore();
const planStore = usePlanStore();
const settingsStore = useSettingsStore();
const { showToast } = useToast();

const festival = computed(() => festivalStore.getById(route.params.id));
const headerStyle = computed(() => themeCssVars(festival.value?.theme));
const status = computed(() =>
  festival.value
    ? festivalStatus(festival.value.startTime, festival.value.endTime)
    : { label: '', tone: 'upcoming' }
);

const totalPerformances = computed(() =>
  (festival.value?.stages || []).reduce((sum, s) => sum + s.performances.length, 0)
);

const plannedCount = computed(
  () => planStore.myPlan.filter((p) => p.festivalId === festival.value?.festivalId).length
);

const mapsUrl = computed(() => {
  const loc = festival.value?.location;
  if (!loc) return '#';
  const q = loc.latitude && loc.longitude ? `${loc.latitude},${loc.longitude}` : loc.address;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
});

// 日期切換：以「演出日」為單位（跨午夜的場次歸在開始那天）
const selectedDay = ref('');
const todayKey = new Date().toDateString();

const days = computed(() => {
  if (!festival.value) return [];
  /** @type {Map<string, number>} */
  const counts = new Map();
  for (const stage of festival.value.stages) {
    for (const perf of stage.performances) {
      const key = new Date(perf.start).toDateString();
      counts.set(key, (counts.get(key) || 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([key, count]) => {
      const d = new Date(key);
      return {
        key,
        date: d,
        count,
        isToday: key === todayKey,
        label: `${d.getMonth() + 1}/${d.getDate()} (${WEEKDAYS_ZH[d.getDay()].replace('星期', '')})`,
      };
    })
    .sort((a, b) => a.date.getTime() - b.date.getTime());
});

watch(
  days,
  (list) => {
    if (list.length === 0) return;
    if (list.some((d) => d.key === selectedDay.value)) return;
    // 預設選今天（活動進行中最常用），否則第一天
    selectedDay.value = (list.find((d) => d.isToday) || list[0]).key;
  },
  { immediate: true }
);

const stagesForDay = computed(() => {
  if (!festival.value) return [];
  return festival.value.stages
    .map((stage) => ({
      ...stage,
      performances: stage.performances
        .filter((p) => new Date(p.start).toDateString() === selectedDay.value)
        .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()),
    }))
    .filter((s) => s.performances.length > 0);
});

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

watch(
  festival,
  (val) => {
    if (val) {
      document.title = `${val.name}｜音樂祭行程`;
      trackEvent('view_festival', { festival_id: val.festivalId, festival_name: val.name });
    }
  },
  { immediate: true }
);

onMounted(() => {
  festivalStore.ensureLoaded();
});
</script>

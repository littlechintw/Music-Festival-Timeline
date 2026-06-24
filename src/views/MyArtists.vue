<template>
  <div class="p-4 max-w-3xl mx-auto">
    <h1 class="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">聽過的藝人</h1>

    <!-- 空狀態 -->
    <div
      v-if="plan.length === 0"
      class="flex flex-col items-center justify-center text-center py-12 px-4"
    >
      <div class="text-5xl mb-4" aria-hidden="true">🎤</div>
      <h2 class="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">還沒有聽團紀錄</h2>
      <p class="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-xs">
        把喜歡的演出加進行程，等表演結束後，這裡就會幫你統計你聽過哪些藝人、聽了幾次。
      </p>
      <router-link
        to="/"
        class="px-5 py-2.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition font-medium shadow-sm"
      >
        瀏覽音樂祭 →
      </router-link>
    </div>

    <div v-else>
      <!-- 統計總覽 -->
      <div
        class="bg-white dark:bg-gray-800 rounded-xl p-6 mb-6 shadow-lg text-gray-800 dark:text-gray-100"
        style="box-shadow: 0 4px 24px 0 rgba(30, 64, 175, 0.1), 0 0px 8px 0 rgba(30, 64, 175, 0.1)"
      >
        <div class="flex flex-wrap gap-6 text-sm">
          <div class="flex items-center gap-2">
            <span class="text-lg" aria-hidden="true">🎤</span>
            <span class="bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-200 px-2 py-0.5 rounded font-bold">{{ seenArtists.length }}</span>
            <span>位藝人</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-lg" aria-hidden="true">🎶</span>
            <span class="bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-200 px-2 py-0.5 rounded font-bold">{{ totalSeenShows }}</span>
            <span>場演出</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-lg" aria-hidden="true">📍</span>
            <span class="bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-200 px-2 py-0.5 rounded font-bold">{{ seenFestivalCount }}</span>
            <span>個音樂祭</span>
          </div>
          <div v-if="repeatCount > 0" class="flex items-center gap-2">
            <span class="text-lg" aria-hidden="true">🔁</span>
            <span class="bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-200 px-2 py-0.5 rounded font-bold">{{ repeatCount }}</span>
            <span>位聽過不只一次</span>
          </div>
        </div>
      </div>

      <!-- 還沒有任何已結束的場次 -->
      <p
        v-if="seenArtists.length === 0"
        class="text-sm text-gray-500 dark:text-gray-400 mb-6 bg-gray-50 dark:bg-gray-800/60 rounded-lg px-4 py-3"
      >
        行程裡的演出都還沒開始。等聽完之後，這裡就會記錄你聽過的藝人 🎵
      </p>

      <!-- 聽過的藝人排行 -->
      <ul v-if="seenArtists.length > 0" class="flex flex-col gap-3 mb-8">
        <li
          v-for="(artist, idx) in seenArtists"
          :key="artist.name"
          class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 px-4 py-3 flex items-center gap-3"
        >
          <div
            class="shrink-0 w-9 text-center text-lg font-bold"
            :class="idx > 2 ? 'text-gray-400 dark:text-gray-500 text-base' : ''"
          >
            {{ rankLabel(idx) }}
          </div>
          <div class="min-w-0 flex-1">
            <div class="font-bold text-gray-900 dark:text-gray-100 truncate">{{ artist.name }}</div>
            <div class="mt-1 flex flex-wrap gap-1">
              <span
                v-for="fest in artist.seenFestivals"
                :key="fest.id"
                class="text-xs bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-200 px-2 py-0.5 rounded-full"
              >
                {{ fest.name }}<span v-if="fest.count > 1"> ×{{ fest.count }}</span>
              </span>
            </div>
            <div
              v-if="artist.upcomingCount > 0"
              class="mt-1 text-xs text-amber-600 dark:text-amber-300"
            >
              還會再看 {{ artist.upcomingCount }} 場
            </div>
          </div>
          <div class="shrink-0 text-right">
            <div class="text-xl font-bold text-blue-600 dark:text-blue-300 leading-none">
              {{ artist.seenCount }}
            </div>
            <div class="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">次</div>
          </div>
        </li>
      </ul>

      <!-- 即將第一次看到 -->
      <div v-if="upcomingArtists.length > 0">
        <h2 class="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-2">
          <span aria-hidden="true">⏳</span> 即將第一次看到（{{ upcomingArtists.length }}）
        </h2>
        <ul class="flex flex-col gap-2">
          <li
            v-for="artist in upcomingArtists"
            :key="artist.name"
            class="bg-gray-50 dark:bg-gray-800/60 rounded-lg px-4 py-2.5 flex items-center justify-between gap-3"
          >
            <span class="font-medium text-gray-700 dark:text-gray-200 truncate">{{ artist.name }}</span>
            <span class="shrink-0 text-xs text-gray-500 dark:text-gray-400">
              {{ artist.nextFestival }} · {{ artist.nextDate }}
            </span>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { usePlanStore } from '../stores/plan';
import { useNowTicker } from '../composables/useNowTicker';
import { canonicalArtist } from '../utils/artistIdentity';
import { formatDayLabel } from '../utils/format';

const planStore = usePlanStore();
const { myPlan: plan } = storeToRefs(planStore);
// 只用來判斷「已結束 / 即將」的邊界，每分鐘更新一次即可。
const { now } = useNowTicker(60000);

/**
 * 把行程依藝人（正規化後）歸納，分別累計已結束（聽過）與即將的場次。
 */
const artistGroups = computed(() => {
  const nowMs = now.value.getTime();
  /** @type {Map<string, any>} */
  const groups = new Map();

  for (const p of plan.value) {
    const name = canonicalArtist(p.artist);
    if (!name) continue;
    if (!groups.has(name)) {
      groups.set(name, {
        name,
        seenCount: 0,
        upcomingCount: 0,
        seenFests: new Map(),
        nextStart: Infinity,
        nextFestival: '',
      });
    }
    const g = groups.get(name);
    const endMs = new Date(p.end || p.start).getTime();
    const startMs = new Date(p.start).getTime();
    const isPast = Number.isFinite(endMs) && nowMs > endMs;

    if (isPast) {
      g.seenCount++;
      if (p.festivalId) {
        const fest = g.seenFests.get(p.festivalId) || {
          id: p.festivalId,
          name: p.festivalName || p.festivalId,
          count: 0,
        };
        fest.count++;
        g.seenFests.set(p.festivalId, fest);
      }
    } else {
      g.upcomingCount++;
      if (startMs < g.nextStart) {
        g.nextStart = startMs;
        g.nextFestival = p.festivalName || p.festivalId || '';
      }
    }
  }

  return [...groups.values()].map((g) => ({
    ...g,
    seenFestivals: [...g.seenFests.values()].sort((a, b) => b.count - a.count),
    seenFestivalCount: g.seenFests.size,
  }));
});

// 聽過（已結束 ≥ 1 場）的藝人排行：次數多 → 跨音樂祭多 → 名稱
const seenArtists = computed(() =>
  artistGroups.value
    .filter((a) => a.seenCount > 0)
    .sort(
      (a, b) =>
        b.seenCount - a.seenCount ||
        b.seenFestivalCount - a.seenFestivalCount ||
        a.name.localeCompare(b.name, 'zh-Hant')
    )
);

// 只有未來場次、還沒聽過的藝人，依最近一場排序
const upcomingArtists = computed(() =>
  artistGroups.value
    .filter((a) => a.seenCount === 0 && a.upcomingCount > 0)
    .sort((a, b) => a.nextStart - b.nextStart)
    .map((a) => ({
      name: a.name,
      nextFestival: a.nextFestival,
      nextDate: a.nextStart === Infinity ? '' : formatDayLabel(new Date(a.nextStart)),
    }))
);

const totalSeenShows = computed(() =>
  seenArtists.value.reduce((sum, a) => sum + a.seenCount, 0)
);

const seenFestivalCount = computed(() => {
  const ids = new Set();
  for (const a of seenArtists.value) for (const f of a.seenFestivals) ids.add(f.id);
  return ids.size;
});

const repeatCount = computed(() => seenArtists.value.filter((a) => a.seenCount > 1).length);

const MEDALS = ['🥇', '🥈', '🥉'];
/** @param {number} idx */
function rankLabel(idx) {
  return MEDALS[idx] || `#${idx + 1}`;
}
</script>

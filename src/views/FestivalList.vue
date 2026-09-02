<template>
  <div class="p-4 max-w-2xl mx-auto">
    <header class="mb-4">
      <h1 class="text-2xl font-bold text-[var(--md-sys-color-on-surface)]">音樂祭</h1>
      <p class="text-sm text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
        挑一場，把想看的演出加進你的行程。資料會存在手機裡，現場沒網路也能查。
      </p>
    </header>

    <InstallPrompt />

    <md-outlined-text-field
      class="mb-3 w-full"
      placeholder="搜尋名稱、地點"
      aria-label="搜尋音樂祭名稱或地點"
      type="search"
      :value="search"
      @input="(e) => (search = e.target.value)"
    >
      <MdIcon name="search" slot="leading-icon" />
    </md-outlined-text-field>

    <div class="mb-4 flex items-center justify-between gap-2">
      <div
        class="inline-flex items-center gap-1 bg-[var(--md-sys-color-surface-container-high)] p-1 rounded-lg"
        role="group"
        aria-label="排序"
      >
        <button type="button" :class="segmentClass(sortBy === 'date')" @click="sortBy = 'date'">
          依日期
        </button>
        <button type="button" :class="segmentClass(sortBy === 'name')" @click="sortBy = 'name'">
          依名稱
        </button>
      </div>
      <span class="text-xs text-[var(--md-sys-color-on-surface-variant)]">
        共 {{ allFestivals.length }} 場
      </span>
    </div>

    <!-- 載入中骨架 -->
    <div v-if="festivalStore.loading && allFestivals.length === 0" class="space-y-3" aria-busy="true">
      <div
        v-for="i in 3"
        :key="i"
        class="rounded-xl p-4 bg-[var(--md-sys-color-surface-container)] animate-pulse"
      >
        <div class="h-5 w-2/3 rounded bg-[var(--md-sys-color-surface-container-highest)] mb-3" />
        <div class="h-3 w-1/2 rounded bg-[var(--md-sys-color-surface-container-highest)] mb-2" />
        <div class="h-3 w-3/4 rounded bg-[var(--md-sys-color-surface-container-highest)]" />
      </div>
    </div>

    <!-- 完全沒資料（第一次開就離線） -->
    <div
      v-else-if="allFestivals.length === 0"
      class="flex flex-col items-center text-center py-12 px-4"
    >
      <MdIcon :name="isOnline ? 'festival' : 'wifi_off'" class="mb-4" style="--md-icon-size: 3rem" />
      <h2 class="text-lg font-medium text-[var(--md-sys-color-on-surface)] mb-2">
        {{ isOnline ? '目前沒有音樂祭資料' : '還沒下載過資料' }}
      </h2>
      <p class="text-sm text-[var(--md-sys-color-on-surface-variant)] max-w-xs mb-6">
        {{
          isOnline
            ? '資料庫裡還沒有活動。歡迎協助新增你關注的音樂祭。'
            : '第一次使用需要連上網路載入一次，之後就能離線瀏覽。'
        }}
      </p>
      <md-filled-button v-if="isOnline" type="button" @click="$router.push('/editor')">
        <MdIcon name="add" slot="icon" />
        新增音樂祭
      </md-filled-button>
      <md-filled-button v-else type="button" @click="retry">
        <MdIcon name="refresh" slot="icon" />
        重新載入
      </md-filled-button>
    </div>

    <template v-else>
      <!-- 進行中／即將到來 -->
      <section v-if="upcoming.length > 0" class="mb-6" aria-labelledby="upcoming-heading">
        <h2
          id="upcoming-heading"
          class="text-xs font-semibold uppercase tracking-wide text-[var(--md-sys-color-on-surface-variant)] mb-2"
        >
          進行中・即將到來
        </h2>
        <FestivalCard
          v-for="festival in upcoming"
          :key="festival.festivalId"
          :festival="festival"
          @click="goDetail(festival.festivalId)"
        />
      </section>

      <!-- 過往活動：有即將到來的活動時預設收合 -->
      <section v-if="past.length > 0" aria-labelledby="past-heading">
        <button
          v-if="upcoming.length > 0"
          id="past-heading"
          type="button"
          class="w-full flex items-center justify-between py-2 text-xs font-semibold uppercase tracking-wide text-[var(--md-sys-color-on-surface-variant)]"
          :aria-expanded="showPast"
          @click="showPast = !showPast"
        >
          <span>過往活動（{{ past.length }}）</span>
          <MdIcon :name="showPast ? 'keyboard_arrow_up' : 'keyboard_arrow_down'" />
        </button>
        <h2
          v-else
          id="past-heading"
          class="text-xs font-semibold uppercase tracking-wide text-[var(--md-sys-color-on-surface-variant)] mb-2"
        >
          過往活動
        </h2>
        <template v-if="showPast || upcoming.length === 0">
          <FestivalCard
            v-for="festival in past"
            :key="festival.festivalId"
            :festival="festival"
            @click="goDetail(festival.festivalId)"
          />
        </template>
      </section>

      <p
        v-if="upcoming.length === 0 && past.length === 0"
        class="text-[var(--md-sys-color-on-surface-variant)] text-center py-8"
      >
        找不到符合「{{ search }}」的音樂祭
      </p>

      <footer class="mt-8 text-center text-sm text-[var(--md-sys-color-on-surface-variant)]">
        找不到你要去的音樂祭？
        <router-link to="/editor" class="text-[var(--md-sys-color-primary)] font-medium underline-offset-2 hover:underline">
          協助新增時間表
        </router-link>
      </footer>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useFestivalStore } from '../stores/festival';
import { useOnline } from '../composables/useOnline';
import { festivalStatus } from '../utils/format';
import MdIcon from '../components/MdIcon.vue';
import InstallPrompt from '../components/InstallPrompt.vue';
import FestivalCard from '../components/FestivalCard.vue';

const festivalStore = useFestivalStore();
const router = useRouter();
const { isOnline } = useOnline();

const search = ref('');
const sortBy = ref('date');
const showPast = ref(false);

function segmentClass(active) {
  return [
    'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
    active
      ? 'bg-[var(--md-sys-color-surface-container-lowest)] text-[var(--md-sys-color-primary)] shadow'
      : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]',
  ];
}

function goDetail(id) {
  router.push({ name: 'FestivalDetail', params: { id } });
}

function retry() {
  festivalStore.ensureLoaded({ force: true });
}

// 列表只需要索引（名稱、日期、地點、場數），不必把每場的完整時間表都下載下來。
// 索引抓不到（第一次開就離線）時，退回用已下載的完整資料湊出同樣的欄位。
const allFestivals = computed(() => {
  const entries = festivalStore.indexEntries;
  if (entries.length > 0) return entries;
  return (festivalStore.getFestivals || []).map((f) => ({
    festivalId: f.festivalId,
    name: f.name,
    startTime: f.startTime,
    endTime: f.endTime,
    location: { name: f.location.name, address: f.location.address },
    stageCount: f.stages.length,
    performanceCount: f.stages.reduce((n, s) => n + s.performances.length, 0),
    themePrimary: f.theme?.primary || '',
    hash: '',
  }));
});

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase();
  if (!q) return allFestivals.value;
  return allFestivals.value.filter(
    (f) =>
      f.name.toLowerCase().includes(q) ||
      (f.location?.name || '').toLowerCase().includes(q) ||
      (f.location?.address || '').toLowerCase().includes(q)
  );
});

function sortFestivals(list, ascending) {
  const arr = [...list];
  arr.sort((a, b) => {
    if (sortBy.value === 'name') return a.name.localeCompare(b.name, 'zh-Hant');
    const diff = new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
    return ascending ? diff : -diff;
  });
  return arr;
}

// 即將到來：最近的排最前；過往：最近結束的排最前
const upcoming = computed(() =>
  sortFestivals(
    filtered.value.filter((f) => festivalStatus(f.startTime, f.endTime).tone !== 'past'),
    true
  )
);
const past = computed(() =>
  sortFestivals(
    filtered.value.filter((f) => festivalStatus(f.startTime, f.endTime).tone === 'past'),
    false
  )
);

onMounted(() => {
  festivalStore.ensureLoaded();
});
</script>

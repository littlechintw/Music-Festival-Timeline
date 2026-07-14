<template>
  <div class="p-4 max-w-2xl mx-auto">
    <h1 class="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">音樂祭列表</h1>
    <md-outlined-text-field
      class="mb-4 w-full"
      placeholder="搜尋名稱或地址"
      :value="search"
      @input="(e) => (search = e.target.value)"
    >
      <MdIcon name="search" slot="leading-icon" />
    </md-outlined-text-field>
    <div class="mb-4 flex gap-2">
      <button :class="btnClass('date')" @click="sortBy = 'date'">依日期排序</button>
      <button :class="btnClass('name')" @click="sortBy = 'name'">依名稱排序</button>
    </div>

    <div
      v-if="festivalStore.loading && festivalStore.getFestivals.length === 0"
      class="text-gray-500 dark:text-gray-400"
    >
      載入中...
    </div>
    <div v-else>
      <div
        v-for="festival in filteredFestivals"
        :key="festival.festivalId"
        class="relative rounded-xl p-4 mb-4 cursor-pointer transition-colors"
        :class="
          festival.isFar
            ? 'opacity-60 bg-[var(--md-sys-color-surface-container-low)] grayscale hover:bg-[var(--md-sys-color-surface-container)]'
            : 'bg-[var(--md-sys-color-surface-container)] hover:bg-[var(--md-sys-color-surface-container-high)]'
        "
        @click="goDetail(festival.festivalId)"
      >
        <md-elevation style="--md-elevation-level: 1"></md-elevation>
        <div class="font-bold text-lg text-gray-900 dark:text-gray-100">{{ festival.name }}</div>
        <div class="text-sm text-gray-500 dark:text-gray-400">
          {{ formatDateTime(festival.startTime, settingsStore.is24Hour) }} ~
          {{ formatDateTime(festival.endTime, settingsStore.is24Hour) }}
        </div>
        <div class="text-sm text-gray-700 dark:text-gray-300">
          {{ festival.location.name }}｜{{ festival.location.address }}
        </div>
      </div>
      <div
        v-if="filteredFestivals.length === 0"
        class="text-gray-400 dark:text-gray-500"
      >
        查無資料
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useFestivalStore } from '../stores/festival';
import { useSettingsStore } from '../stores/settings';
import { formatDateTime } from '../utils/format';
import MdIcon from '../components/MdIcon.vue';

const festivalStore = useFestivalStore();
const settingsStore = useSettingsStore();
const router = useRouter();

const search = ref('');
const sortBy = ref('date');

function btnClass(type) {
  return [
    'px-3 py-1 rounded border transition-colors',
    sortBy.value === type
      ? 'bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)] border-[var(--md-sys-color-secondary)]'
      : 'bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-primary)] border-[var(--md-sys-color-outline)] hover:bg-[var(--md-sys-color-surface-container-high)]',
  ].join(' ');
}

function goDetail(id) {
  router.push({ name: 'FestivalDetail', params: { id } });
}

const filteredFestivals = computed(() => {
  const now = Date.now();
  const thirtyDays = 30 * 86400000;
  let arr = (festivalStore.getFestivals || []).map((f) => {
    const start = new Date(f.startTime).getTime();
    const end = new Date(f.endTime).getTime();
    return { ...f, isFar: end < now || start - now > thirtyDays };
  });

  if (search.value) {
    const q = search.value.toLowerCase();
    arr = arr.filter(
      (f) => f.name.toLowerCase().includes(q) || f.location.address.toLowerCase().includes(q)
    );
  }

  arr.sort((a, b) => {
    if (a.isFar !== b.isFar) return a.isFar ? 1 : -1;
    if (sortBy.value === 'name') return a.name.localeCompare(b.name, 'zh-Hant');
    return Math.abs(new Date(a.startTime).getTime() - now) - Math.abs(new Date(b.startTime).getTime() - now);
  });
  return arr;
});

onMounted(() => {
  festivalStore.ensureLoaded();
});
</script>

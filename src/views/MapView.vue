<template>
  <div class="p-4 max-w-3xl mx-auto">
    <PageHeader
      title="場地地圖"
      :subtitle="festival?.name || ''"
      :back="festival ? { name: 'FestivalDetail', params: { id: festival.festivalId } } : '/'"
    >
      <template #actions>
        <template v-if="hasImage">
          <md-icon-button type="button" aria-label="縮小" :disabled="zoom <= 1" @click="zoomOut">
            <MdIcon name="zoom_out" />
          </md-icon-button>
          <md-icon-button type="button" aria-label="放大" :disabled="zoom >= MAX_ZOOM" @click="zoomIn">
            <MdIcon name="zoom_in" />
          </md-icon-button>
        </template>
      </template>
    </PageHeader>

    <div v-if="status === 'loading'" class="text-[var(--md-sys-color-on-surface-variant)]" aria-busy="true">
      載入中...
    </div>
    <FestivalUnavailable v-else-if="!festival" :status="status" @retry="retry" />
    <div v-else-if="!hasImage" class="text-center py-12">
      <MdIcon name="map" class="mb-3" style="--md-icon-size: 3rem" />
      <p class="text-[var(--md-sys-color-on-surface-variant)]">此音樂祭尚未提供場地地圖</p>
    </div>
    <div v-else>
      <!--
        地圖常常是一張細節很多的大圖，手機上一定要能放大。
        用捲動容器＋放大倍率控制，雙點圖片也能切換倍率；系統的雙指縮放仍可用。
      -->
      <div
        ref="viewportRef"
        class="map-viewport rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-white overflow-auto"
        :class="zoom > 1 ? 'cursor-grab' : ''"
      >
        <img
          :src="festival.map.image"
          :alt="`${festival.name} 場地地圖`"
          class="block max-w-none select-none"
          :style="{ width: `${zoom * 100}%` }"
          draggable="false"
          @dblclick="toggleZoom"
        />
      </div>
      <p class="mt-2 text-xs text-[var(--md-sys-color-on-surface-variant)] flex items-center gap-1">
        <MdIcon name="offline_pin" style="--md-icon-size: 14px" />
        地圖已存在裝置上，離線也能查看。雙點圖片可放大。
      </p>

      <a
        :href="mapsUrl"
        target="_blank"
        rel="noopener"
        class="mt-4 inline-flex items-center gap-2 text-sm text-[var(--md-sys-color-primary)] hover:underline"
      >
        <MdIcon name="near_me" style="--md-icon-size: 18px" />
        用 Google 地圖導航到 {{ festival.location.name }}
        <MdIcon name="open_in_new" style="--md-icon-size: 14px" />
      </a>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useFestivalPage } from '../composables/useFestivalPage';
import PageHeader from '../components/PageHeader.vue';
import MdIcon from '../components/MdIcon.vue';
import FestivalUnavailable from '../components/FestivalUnavailable.vue';

const MAX_ZOOM = 3;

const { festival, status, retry } = useFestivalPage();
const hasImage = computed(() => !!festival.value?.map?.image);

const zoom = ref(1);
const viewportRef = ref(null);

function zoomIn() {
  zoom.value = Math.min(MAX_ZOOM, zoom.value + 0.5);
}
function zoomOut() {
  zoom.value = Math.max(1, zoom.value - 0.5);
  if (zoom.value === 1 && viewportRef.value) viewportRef.value.scrollTo(0, 0);
}
function toggleZoom() {
  zoom.value = zoom.value > 1 ? 1 : 2;
}

const mapsUrl = computed(() => {
  const loc = festival.value?.location;
  if (!loc) return '#';
  const q = loc.latitude && loc.longitude ? `${loc.latitude},${loc.longitude}` : loc.address;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
});
</script>

<style scoped>
.map-viewport {
  /* 扣掉頂欄、標題、底部導覽後盡量填滿螢幕 */
  max-height: calc(100dvh - 15rem);
  -webkit-overflow-scrolling: touch;
  touch-action: pan-x pan-y pinch-zoom;
}
@media (min-width: 768px) {
  .map-viewport {
    max-height: calc(100dvh - 11rem);
  }
}
</style>

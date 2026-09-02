<template>
  <!-- 子頁面拿不到活動資料時的說明：離線沒快取 vs. 根本沒這場 -->
  <div class="text-center py-10 px-4">
    <MdIcon :name="status === 'offline' ? 'cloud_off' : 'festival'" class="mb-3" style="--md-icon-size: 3rem" />
    <h2 class="text-lg font-medium text-[var(--md-sys-color-on-surface)] mb-2">
      {{ status === 'offline' ? '這場音樂祭還沒下載到手機' : '找不到此音樂祭' }}
    </h2>
    <p class="text-sm text-[var(--md-sys-color-on-surface-variant)] max-w-xs mx-auto mb-6">
      {{
        status === 'offline'
          ? '只有近期活動會自動下載，其他活動需要在有網路時點開過一次。連上網路後會自動重試。'
          : '可能網址打錯，或這場活動已經下架。'
      }}
    </p>
    <div class="flex justify-center gap-2">
      <md-outlined-button v-if="status === 'offline'" type="button" @click="$emit('retry')">
        <MdIcon name="refresh" slot="icon" />
        重試
      </md-outlined-button>
      <md-filled-button type="button" @click="$router.replace('/')">回音樂祭列表</md-filled-button>
    </div>
  </div>
</template>

<script setup>
import MdIcon from './MdIcon.vue';

defineProps({
  // 'offline' | 'missing'
  status: { type: String, required: true },
});
defineEmits(['retry']);
</script>

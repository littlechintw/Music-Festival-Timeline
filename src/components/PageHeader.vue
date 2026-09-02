<template>
  <!--
    子頁面（音樂祭詳情、時間軸、地圖）的標題列。
    PWA 以「加入主畫面」模式開啟時沒有瀏覽器的返回鍵，所以返回箭頭是必要的，不是裝飾。
  -->
  <header class="flex items-start gap-1 mb-4 -ml-2">
    <md-icon-button
      v-if="back !== false"
      type="button"
      aria-label="返回"
      class="shrink-0 mt-0.5"
      @click="goBack"
    >
      <MdIcon name="arrow_back" />
    </md-icon-button>
    <div class="min-w-0 flex-1 pt-1.5">
      <h1 class="text-xl sm:text-2xl font-bold text-[var(--md-sys-color-on-surface)] leading-tight break-words">
        <slot name="title">{{ title }}</slot>
      </h1>
      <p
        v-if="subtitle || $slots.subtitle"
        class="text-sm text-[var(--md-sys-color-on-surface-variant)] mt-0.5"
      >
        <slot name="subtitle">{{ subtitle }}</slot>
      </p>
    </div>
    <div v-if="$slots.actions" class="shrink-0 flex items-center gap-1 pt-0.5">
      <slot name="actions" />
    </div>
  </header>
</template>

<script setup>
import { useRouter } from 'vue-router';
import MdIcon from './MdIcon.vue';

const props = defineProps({
  title: { type: String, default: '' },
  subtitle: { type: String, default: '' },
  // false 隱藏返回鍵；字串或 route object 則固定回到該處（沒有上一頁歷史時的後備）
  back: { type: [Boolean, String, Object], default: true },
});

const router = useRouter();

function goBack() {
  // 從通知、分享連結或主畫面捷徑直接進來時沒有上一頁，退到指定頁而不是卡住
  const hasHistory = typeof window !== 'undefined' && window.history.state?.back;
  if (hasHistory) {
    router.back();
  } else if (typeof props.back === 'string' || (props.back && typeof props.back === 'object')) {
    router.replace(props.back);
  } else {
    router.replace('/');
  }
}
</script>

<template>
  <div
    v-if="shouldShowBanner"
    class="relative rounded-xl p-4 mb-4 bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] flex items-start gap-3"
    role="region"
    aria-label="安裝 App"
  >
    <MdIcon name="install_desktop" class="shrink-0 mt-0.5" />
    <div class="min-w-0 flex-1">
      <div class="font-bold">把它裝到手機主畫面</div>
      <p class="text-sm opacity-90 mt-0.5">
        像 App 一樣全螢幕開啟，現場沒網路也能秒開行程與地圖。
      </p>
      <div class="flex flex-wrap gap-2 mt-3">
        <md-filled-button v-if="canPromptNatively" type="button" @click="onInstall">
          安裝
        </md-filled-button>
        <md-filled-button v-else type="button" @click="showIosGuide = true">
          看怎麼加入
        </md-filled-button>
        <md-text-button type="button" @click="dismissBanner">先不用</md-text-button>
      </div>
    </div>
  </div>

  <BaseModal v-model="showIosGuide">
    <template #headline>加入 iPhone 主畫面</template>
    <ol class="list-decimal pl-5 space-y-2 text-sm text-[var(--md-sys-color-on-surface)]">
      <li>
        用 <b>Safari</b> 開啟這個網頁（其他瀏覽器沒有這個選項）。
      </li>
      <li>
        點底部工具列的
        <span class="inline-flex items-center gap-1 align-middle font-medium">
          <MdIcon name="ios_share" style="--md-icon-size: 18px" /> 分享
        </span>
        按鈕。
      </li>
      <li>往下捲，選「<b>加入主畫面</b>」，再按右上角「新增」。</li>
    </ol>
    <p class="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-4">
      加入後從主畫面開啟會是全螢幕，第一次開啟時請先連網路一次，之後離線也能使用。
    </p>
    <template #actions>
      <md-text-button type="button" @click="dismissAndClose">之後再說</md-text-button>
      <md-filled-button type="button" @click="showIosGuide = false">知道了</md-filled-button>
    </template>
  </BaseModal>
</template>

<script setup>
import { ref } from 'vue';
import { useInstallPrompt } from '../composables/useInstallPrompt';
import { useToast } from '../composables/useToast';
import { trackEvent } from '../utils/analytics';
import BaseModal from './BaseModal.vue';
import MdIcon from './MdIcon.vue';

const { shouldShowBanner, canPromptNatively, promptInstall, dismissBanner } = useInstallPrompt();
const { showToast } = useToast();
const showIosGuide = ref(false);

async function onInstall() {
  const result = await promptInstall();
  trackEvent('pwa_install_prompt', { result });
  if (result === 'accepted') {
    showToast({ message: '已加入主畫面，之後從那裡開啟就好', kind: 'success', icon: '✓' });
  }
}

function dismissAndClose() {
  showIosGuide.value = false;
  dismissBanner();
}
</script>

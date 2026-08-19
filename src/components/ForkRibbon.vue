<template>
  <!--
    左下角的來源標示：致敬原作者，連結指向上游原專案。
    位置說明：上方兩角被 App.vue 的 sticky nav（z-40）佔住，下方置中被
    ToastContainer（z-200）與 UpdatePrompt（z-50）佔住，左下角是唯一沒有衝突的角落。

    刻意不使用 github-fork-ribbon-css 這類 CDN 樣式：本專案是 offline-first PWA，
    任何外部 stylesheet 都會在離線時失效，所以 CSS 直接寫在這裡。
  -->
  <div class="fork-ribbon">
    <a
      :href="UPSTREAM_URL"
      target="_blank"
      rel="noopener noreferrer"
      :aria-label="`本站 fork 自 ${UPSTREAM_OWNER} 的原專案，點擊前往原始 GitHub 倉庫`"
    >
      Forked from {{ UPSTREAM_OWNER }}
    </a>
  </div>
</template>

<script setup>
// 致敬原作者：ribbon 指向的是「上游原專案」，不是本 fork。
// 帶子寬度有限（220px），所以只放帳號，不放完整的 owner/repo 路徑。
const UPSTREAM_OWNER = 'littlechintw';
const UPSTREAM_URL = 'https://github.com/littlechintw/Music-Festival-Timeline';
</script>

<style scoped>
.fork-ribbon {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 200px;
  height: 200px;
  overflow: hidden;
  /* 低於 UpdatePrompt(50) 與 ToastContainer(200)，高於一般內容 */
  z-index: 30;
  /* 只有斜帶本身可點，其餘 200x200 的透明區域不擋住底下的操作 */
  pointer-events: none;
}

.fork-ribbon a {
  position: absolute;
  /*
    斜帶幾何：旋轉中心約在距角落 (80, 68)px 處，45 度切線會交於左緣 148px
    與底緣 148px，可見長度約 209px。文字約 145px，左右各留 30px 餘裕。
    width 給 300px 是刻意超出容器，讓兩端被 overflow:hidden 切齊成梯形。
  */
  bottom: 55px;
  left: -70px;
  width: 300px;
  padding: 5px 0;
  transform: rotate(45deg);
  text-align: center;
  font-size: 12px;
  line-height: 1.4;
  font-weight: 600;
  letter-spacing: 0.02em;
  text-decoration: none;
  white-space: nowrap;
  pointer-events: auto;
  background: var(--md-sys-color-primary);
  color: var(--md-sys-color-on-primary);
  box-shadow: 0 1px 4px rgb(0 0 0 / 30%);
}

.fork-ribbon a:hover,
.fork-ribbon a:focus-visible {
  opacity: 0.9;
}

.fork-ribbon a:focus-visible {
  outline: 2px solid var(--md-sys-color-on-primary);
  outline-offset: -4px;
}

/* 手機直式畫面空間有限，時間表本身就很擠，不擋使用者。 */
@media (max-width: 639px) {
  .fork-ribbon {
    display: none;
  }
}

/* 裝成 PWA 之後就不是「在逛網頁」了，角落掛個 GitHub 帶子很突兀。 */
@media (display-mode: standalone), (display-mode: minimal-ui) {
  .fork-ribbon {
    display: none;
  }
}
</style>

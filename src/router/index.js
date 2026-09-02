// @ts-check
import { createRouter, createWebHistory } from 'vue-router';
import { trackPageView } from '../utils/analytics';

const APP_TITLE = '音樂祭行程';

// 主要頁面用 lazy loading：first paint 變快、各頁面在離線時也能被 SW 個別快取
/** @type {import('vue-router').RouteRecordRaw[]} */
const routes = [
  { path: '/', name: 'Home', component: () => import('../views/FestivalList.vue'), meta: { title: '音樂祭' } },
  { path: '/festival/:id', name: 'FestivalDetail', component: () => import('../views/FestivalDetail.vue'), meta: { title: '音樂祭' } },
  { path: '/festival/:id/timeline', name: 'RunDownTimeline', component: () => import('../views/RunDownTimeline.vue'), meta: { title: '全日時間軸' } },
  { path: '/festival/:id/map', name: 'MapView', component: () => import('../views/MapView.vue'), meta: { title: '場地地圖' } },
  { path: '/plan', name: 'MyPlan', component: () => import('../views/MyPlan.vue'), meta: { title: '我的行程' } },
  { path: '/artists', name: 'MyArtists', component: () => import('../views/MyArtists.vue'), meta: { title: '聽過的藝人' } },
  { path: '/settings', name: 'Settings', component: () => import('../views/Settings.vue'), meta: { title: '設定' } },
  { path: '/editor', name: 'Editor', component: () => import('../editor/EditorView.vue'), meta: { title: '新增音樂祭' } },
  { path: '/:shortId([a-zA-Z0-9]{3})', name: 'RedirectShortUrl', component: () => import('../views/RedirectShortUrl.vue'), meta: { title: '分享的行程' } },
  // 打錯網址 / 已下架的短網址：回首頁，不要停在空白頁
  { path: '/:pathMatch(.*)*', redirect: '/' },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  // 手機上切頁要回到頂端；用瀏覽器上一頁／下一頁則還原原本的捲動位置
  scrollBehavior(_to, _from, savedPosition) {
    if (savedPosition) return savedPosition;
    return { top: 0 };
  },
});

router.afterEach((to) => {
  const pageTitle = typeof to.meta.title === 'string' ? to.meta.title : '';
  document.title = pageTitle ? `${pageTitle}｜${APP_TITLE}` : APP_TITLE;
  trackPageView(to.fullPath, String(to.name || to.fullPath));
});

export default router;

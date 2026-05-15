// @ts-check
import { createRouter, createWebHistory } from 'vue-router';
import { trackPageView } from '../utils/analytics';

// 主要頁面用 lazy loading：first paint 變快、各頁面在離線時也能被 SW 個別快取
const routes = [
  { path: '/', name: 'Home', component: () => import('../views/FestivalList.vue') },
  { path: '/festival/:id', name: 'FestivalDetail', component: () => import('../views/FestivalDetail.vue') },
  { path: '/festival/:id/timeline', name: 'RunDownTimeline', component: () => import('../views/RunDownTimeline.vue') },
  { path: '/festival/:id/map', name: 'MapView', component: () => import('../views/MapView.vue') },
  { path: '/plan', name: 'MyPlan', component: () => import('../views/MyPlan.vue') },
  { path: '/settings', name: 'Settings', component: () => import('../views/Settings.vue') },
  { path: '/editor', name: 'Editor', component: () => import('../editor/EditorView.vue') },
  { path: '/:shortId([a-zA-Z0-9]{3})', name: 'RedirectShortUrl', component: () => import('../views/RedirectShortUrl.vue') },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.afterEach((to) => {
  trackPageView(to.fullPath, String(to.name || to.fullPath));
});

export default router;

import { createRouter, createWebHistory } from 'vue-router';
import FestivalList from '../views/FestivalList.vue';
import FestivalDetail from '../views/FestivalDetail.vue';
import MyPlan from '../views/MyPlan.vue';
import Settings from '../views/Settings.vue';
import Editor from '../editor/EditorView.vue';
import RunDownTimeline from '../views/RunDownTimeline.vue';
import MapView from '../views/MapView.vue';

const routes = [
  { path: '/', name: 'Home', component: FestivalList },
  { path: '/festival/:id', name: 'FestivalDetail', component: FestivalDetail },
  { path: '/festival/:id/timeline', name: 'RunDownTimeline', component: RunDownTimeline },
  { path: '/plan', name: 'MyPlan', component: MyPlan },
  { path: '/settings', name: 'Settings', component: Settings },
  { path: '/editor', name: 'Editor', component: Editor },
  { path: '/festival/:id/map', name: 'MapView', component: MapView },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;

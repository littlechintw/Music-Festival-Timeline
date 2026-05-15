// @ts-check
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import './assets/tailwind.css';
import { initGA } from './utils/analytics';

const app = createApp(App);
app.use(createPinia());
app.use(router);

// Pinia mount 完才能用 store 內的 settings（analytics 開關）
initGA();

app.mount('#app');

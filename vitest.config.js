// @ts-check
import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  define: { __APP_VERSION__: JSON.stringify('test') },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.{test,spec}.{js,ts}'],
    setupFiles: ['./src/test/setup.js'],
    // 統一時區，避免 toLocaleTimeString 因主機時區造成測試不一致
    env: {
      TZ: 'Asia/Taipei',
    },
  },
});

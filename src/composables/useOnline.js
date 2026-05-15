// @ts-check
import { ref, onMounted, onUnmounted } from 'vue';

/**
 * 偵測是否在線上。`navigator.onLine` 只能粗略判斷網路介面狀態，
 * 不保證真的能連到 API；對 share-URL 這類功能 fallback 應該再加超時。
 */
export function useOnline() {
  const isOnline = ref(typeof navigator === 'undefined' ? true : navigator.onLine);
  const update = () => {
    isOnline.value = navigator.onLine;
  };

  onMounted(() => {
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
  });
  onUnmounted(() => {
    window.removeEventListener('online', update);
    window.removeEventListener('offline', update);
  });

  return { isOnline };
}

// @ts-check
import { ref, onMounted, onUnmounted } from 'vue';

/**
 * 每隔 intervalMs 更新一次的當下時間 ref。
 * - 視窗在背景時暫停 ticker，省電也避免無謂的 re-render。
 * - 視窗回到前景立即同步一次。
 *
 * @param {number} intervalMs
 */
export function useNowTicker(intervalMs = 1000) {
  const now = ref(new Date());
  /** @type {ReturnType<typeof setInterval> | null} */
  let timer = null;

  function start() {
    stop();
    timer = setInterval(() => {
      now.value = new Date();
    }, intervalMs);
  }

  function stop() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  function handleVisibility() {
    if (document.hidden) {
      stop();
    } else {
      now.value = new Date();
      start();
    }
  }

  onMounted(() => {
    start();
    document.addEventListener('visibilitychange', handleVisibility);
  });
  onUnmounted(() => {
    stop();
    document.removeEventListener('visibilitychange', handleVisibility);
  });

  return { now };
}

// @ts-check
import { watch, onMounted, onUnmounted } from 'vue';

/**
 * 當 isOpen 為 true 時，按 Esc 觸發 onClose。
 * 多個 modal 疊在一起時最上層先收到。
 *
 * @param {import('vue').Ref<boolean> | (() => boolean)} isOpen
 * @param {() => void} onClose
 */
export function useEscapeKey(isOpen, onClose) {
  function handler(e) {
    if (e.key !== 'Escape') return;
    const open = typeof isOpen === 'function' ? isOpen() : isOpen.value;
    if (open) {
      e.stopPropagation();
      onClose();
    }
  }

  onMounted(() => {
    window.addEventListener('keydown', handler);
  });

  onUnmounted(() => {
    window.removeEventListener('keydown', handler);
  });

  // 開啟時把 body 鎖住捲動
  if (typeof isOpen !== 'function') {
    watch(isOpen, (v) => {
      if (typeof document === 'undefined') return;
      document.body.style.overflow = v ? 'hidden' : '';
    });
  }
}

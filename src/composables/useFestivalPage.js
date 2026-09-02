// @ts-check
import { ref, computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useFestivalStore } from '../stores/festival';
import { useOnline } from './useOnline';

/**
 * 詳情／時間軸／地圖三個子頁共用的載入流程：
 * 確保索引已載入 → 記錄使用時間並按需下載這場活動 → 回報狀態。
 *
 * status:
 * - 'loading'   還在抓
 * - 'ready'     festival 可用
 * - 'offline'   索引裡有這場、但裝置上沒有資料而且現在離線
 * - 'missing'   索引裡沒有這場（網址打錯或已下架）
 */
export function useFestivalPage() {
  const route = useRoute();
  const festivalStore = useFestivalStore();
  const { isOnline } = useOnline();

  const id = computed(() => String(route.params.id || ''));
  const festival = computed(() => festivalStore.getById(id.value));
  const entry = computed(() => festivalStore.getEntry(id.value));
  const attempted = ref(false);
  const fetching = ref(false);

  const status = computed(() => {
    if (festival.value) return 'ready';
    if (fetching.value || !attempted.value) return 'loading';
    if (entry.value) return 'offline';
    return 'missing';
  });

  async function load() {
    fetching.value = true;
    try {
      await festivalStore.ensureLoaded();
      await festivalStore.ensureFestival(id.value);
    } finally {
      fetching.value = false;
      attempted.value = true;
    }
  }

  watch(id, () => load(), { immediate: true });
  // 剛好在活動頁時連上網路 → 自動補抓
  watch(isOnline, (online) => {
    if (online && status.value === 'offline') load();
  });

  return { id, festival, entry, status, isOnline, retry: load };
}

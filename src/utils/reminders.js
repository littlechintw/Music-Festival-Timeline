// @ts-check
import { watch } from 'vue';
import { usePlanStore } from '../stores/plan';
import { useFestivalStore } from '../stores/festival';
import { useSettingsStore } from '../stores/settings';
import { useNotificationStore } from '../stores/notifications';
import { showAppNotification, getNotificationPermission } from '../pwa/notifications';
import { formatTime } from './format';

// 通知觸發容差：實際 fire 點允許比 trigger 時刻晚 60 秒內仍然送出。
// 例如：使用者在演出前 4 分 30 秒打開 app，原本 5 分鐘的提醒已經錯過 30 秒，
//      只要在容差內就還是送（且記錄為已送，不會再送）。
const FIRE_WINDOW_MS = 60 * 1000;

// setTimeout 單次最長 sleep 上限（避免時鐘漂移、系統休眠 catch-up）。
// 超過這個就先到了再重新排下一次。
const MAX_TIMEOUT_MS = 15 * 60 * 1000;

// 沒任何 trigger 在排隊時的 idle 間隔
const IDLE_RECHECK_MS = 60 * 60 * 1000;

/**
 * @typedef {{
 *   at: number,
 *   key: string,
 *   build: () => { title: string, body: string, tag: string },
 * }} Trigger
 */

/**
 * 啟動提醒服務。回傳一個 cleanup 函式。
 *
 * 設計：
 * - 不再用固定 30 秒輪詢；改成「列出所有未來觸發點，排到下一個的剛好時刻」。
 * - 任何來源（plan / settings / festivals）變化都觸發重新排程。
 * - 視窗在背景時暫停定時器；回到前景時補檢查一次後再排程。
 *
 * @returns {() => void}
 */
export function startReminderService() {
  const planStore = usePlanStore();
  const festivalStore = useFestivalStore();
  const settingsStore = useSettingsStore();
  const notificationStore = useNotificationStore();

  let stopped = false;
  /** @type {ReturnType<typeof setTimeout> | null} */
  let timer = null;

  function clearTimer() {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  }

  /**
   * 從目前狀態算出所有「還沒送、未來會送」的 trigger。
   * @returns {Trigger[]}
   */
  function collectTriggers() {
    /** @type {Trigger[]} */
    const triggers = [];
    const reminderTimes = settingsStore.performanceReminderTimes?.length
      ? settingsStore.performanceReminderTimes
      : [3, 10];

    // 個人演出提醒
    for (const perf of planStore.myPlan || []) {
      const startMs = new Date(perf.start).getTime();
      if (!Number.isFinite(startMs)) continue;
      const perfId = perf.id || `${perf.artist}-${perf.start}`;
      for (const rem of reminderTimes) {
        const at = startMs - rem * 60000;
        const key = `${rem}min_${perfId}`;
        if (notificationStore.hasSent(key)) continue;
        triggers.push({
          at,
          key,
          build: () => {
            const timeStr = formatTime(perf.start, settingsStore.is24Hour);
            return rem <= 3
              ? {
                  title: `演出即將開始！快前往舞台 (${rem} 分鐘)`,
                  body: `${perf.artist} 將於 ${rem} 分鐘後在 ${perf.stage} 演出！`,
                  tag: `perf_${perfId}_${rem}`,
                }
              : {
                  title: `演出提醒：還有 ${rem} 分鐘！`,
                  body: `${perf.artist} 即將於 ${timeStr} 在 ${perf.stage} 演出`,
                  tag: `perf_${perfId}_${rem}`,
                };
          },
        });
      }
    }

    // 音樂祭即將到來
    if (settingsStore.enableFestivalReminders) {
      const plannedFestivals = new Set(
        (planStore.myPlan || []).map((p) => p.festivalId).filter(Boolean)
      );
      for (const fest of festivalStore.getFestivals || []) {
        if (!plannedFestivals.has(fest.festivalId)) continue;
        const startMs = new Date(fest.startTime).getTime();
        if (!Number.isFinite(startMs)) continue;
        for (const days of [7, 1]) {
          const at = startMs - days * 86400000;
          const key = `${days}days_${fest.festivalId}`;
          if (notificationStore.hasSent(key)) continue;
          triggers.push({
            at,
            key,
            build: () =>
              days === 1
                ? {
                    title: '🔥 就是明天！',
                    body: `${fest.name} 明天就要開始了，記得準備好你的裝備！`,
                    tag: `fest_1d_${fest.festivalId}`,
                  }
                : {
                    title: '🗓 音樂祭即將到來！',
                    body: `${fest.name} 將於 7 天後開始，快來排行程吧！`,
                    tag: `fest_7d_${fest.festivalId}`,
                  },
          });
        }
      }
    }

    return triggers.sort((a, b) => a.at - b.at);
  }

  function fire(trigger) {
    const payload = trigger.build();
    showAppNotification({ ...payload, recordKey: trigger.key });
  }

  function tick() {
    if (stopped) return;
    if (typeof document !== 'undefined' && document.hidden) return;
    if (getNotificationPermission() !== 'granted') {
      // 還沒拿到權限就慢一點重排
      timer = setTimeout(tick, IDLE_RECHECK_MS);
      return;
    }

    const triggers = collectTriggers();
    if (triggers.length === 0) {
      timer = setTimeout(tick, IDLE_RECHECK_MS);
      return;
    }

    const now = Date.now();

    // 把已經到期（在容差內）的全部送掉
    while (triggers.length > 0 && triggers[0].at <= now + FIRE_WINDOW_MS) {
      const t = /** @type {Trigger} */ (triggers.shift());
      // 太久之前的就跳過（avoid spamming 用戶 catch-up）
      if (t.at < now - FIRE_WINDOW_MS) {
        notificationStore.record(t.key, '[skipped]', '[past]'); // mark as sent 避免重複考慮
        continue;
      }
      fire(t);
    }

    // 排到下一個未來的 trigger（或 fallback idle）
    if (triggers.length === 0) {
      timer = setTimeout(tick, IDLE_RECHECK_MS);
      return;
    }
    const next = triggers[0];
    const delay = Math.max(0, Math.min(next.at - Date.now(), MAX_TIMEOUT_MS));
    timer = setTimeout(tick, delay);
  }

  function reschedule() {
    clearTimer();
    tick();
  }

  function handleVisibility() {
    if (document.hidden) {
      clearTimer();
    } else {
      reschedule();
    }
  }

  // 任何來源改變都觸發重新排程
  const stopWatchers = [
    watch(() => planStore.myPlan, reschedule, { deep: true }),
    watch(() => settingsStore.performanceReminderTimes, reschedule, { deep: true }),
    watch(() => settingsStore.enableFestivalReminders, reschedule),
    watch(() => festivalStore.getFestivals, reschedule, { deep: true }),
  ];

  document.addEventListener('visibilitychange', handleVisibility);
  reschedule();

  return () => {
    stopped = true;
    clearTimer();
    stopWatchers.forEach((stop) => stop());
    document.removeEventListener('visibilitychange', handleVisibility);
  };
}

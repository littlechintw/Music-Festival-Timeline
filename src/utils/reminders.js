import { watch } from 'vue';
import { usePlanStore } from '../stores/plan';
import { useFestivalStore } from '../stores/festival';
import { useSettingsStore } from '../stores/settings';
import { hasNotified, saveNotificationToHistory } from './notificationHistory';

export function startReminderService() {
  const planStore = usePlanStore();
  const festivalStore = useFestivalStore();
  const settingsStore = useSettingsStore();

  setInterval(() => {
    if (Notification.permission !== 'granted') return;

    const now = new Date();
    const nowMs = now.getTime();

    // Collect all festival IDs the user actually has plans for
    const plannedFestivals = new Set((planStore.myPlan || []).map(p => p.festivalId));

    // 1. Check Performances (Dynamic multi-reminders)
    if (planStore.myPlan && planStore.myPlan.length > 0) {
      planStore.myPlan.forEach(perf => {
        const startMs = new Date(perf.start).getTime();
        const diffMin = (startMs - nowMs) / 1000 / 60;
        
        const perfId = perf.id || `${perf.artist}-${perf.start}`;
        const reminderTimes = settingsStore.performanceReminderTimes || [3, 10]; // array like [1,3,5,10...]
        
        // Loop through all configured reminder times (1 min, 5 mins, 10 mins...)
        reminderTimes.forEach(remTime => {
            // Buffer interval to check: strictly within that minute.
            // i.e., 2.1 mins remaining will not trigger a 3 min alarm natively,
            // so we capture diffMin <= remTime && diffMin > (remTime - 1)
            // But if users launch app at exact boundary we might miss? 
            // the interval runs every 10 seconds, so checking between (remTime-1) and remTime is safe enough to catch it exactly once.
            if (diffMin <= remTime && diffMin > (remTime - 1)) {
              const key = `${remTime}min_${perfId}`;
              if (!hasNotified(key)) {
                const timeStr = new Date(perf.start).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: !settingsStore.is24Hour });
                
                let title, body;
                if (remTime <= 3) {
                  title = `演出即將開始！快前往舞台 (${remTime} 分鐘)`;
                  body = `${perf.artist} 將於 ${remTime} 分鐘後 在 ${perf.stage} 演出！`;
                } else {
                  title = `演出提醒：還有 ${remTime} 分鐘！`;
                  body = `${perf.artist} 即將於 ${timeStr} 在 ${perf.stage} 演出`;
                }

                planStore.sendNotification({ title, body, tag: `perf_${perfId}_${remTime}` });
                saveNotificationToHistory(key, title, body);
              }
            }
        });
      });
    }

    // 2. Check Festivals (7 days and 1 day) - ONLY for festivals in the planner
    if (settingsStore.enableFestivalReminders && festivalStore.getFestivals && festivalStore.getFestivals.length > 0) {
      festivalStore.getFestivals.forEach(fest => {
        if (!plannedFestivals.has(fest.festivalId)) return; // Skip if no performances added

        const startMs = new Date(fest.startTime).getTime();
        const diffDays = (startMs - nowMs) / 1000 / 60 / 60 / 24;
        const festId = fest.festivalId;

        if (diffDays <= 7 && diffDays > 1) {
          const key = `7days_${festId}`;
          if (!hasNotified(key)) {
            const title = `🗓 音樂祭即將到來！`;
            const body = `${fest.name} 將於 7 天後開始，快來排行程吧！`;
            planStore.sendNotification({ title, body, tag: `fest_7d_${festId}` });
            saveNotificationToHistory(key, title, body);
          }
        }

        if (diffDays <= 1 && diffDays > 0) {
          const key = `1day_${festId}`;
          if (!hasNotified(key)) {
            const title = `🔥 就是明天！`;
            const body = `${fest.name} 明天就要開始了，記得準備好你的裝備！`;
            planStore.sendNotification({ title, body, tag: `fest_1d_${festId}` });
            saveNotificationToHistory(key, title, body);
          }
        }
      });
    }
  }, 10000); // Check every 10 seconds for real-timing
}

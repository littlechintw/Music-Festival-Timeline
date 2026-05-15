// @ts-check
import { computed } from 'vue';
import { formatTime } from '../utils/format';

const SLOT_MS = 10 * 60 * 1000;

/**
 * 把演出列表轉成 gantt-grid 需要的時間槽與樣式 helper。
 *
 * @param {() => Array<{start: string, end?: string}>} performancesGetter
 * @param {() => boolean} is24HourGetter
 */
export function useTimelineGrid(performancesGetter, is24HourGetter) {
  const performances = computed(() => performancesGetter() || []);
  const is24Hour = computed(() => !!is24HourGetter());

  const range = computed(() => {
    let min = Infinity;
    let max = -Infinity;
    for (const perf of performances.value) {
      const start = new Date(perf.start).getTime();
      const end = new Date(perf.end || perf.start).getTime();
      if (Number.isFinite(start) && start < min) min = start;
      if (Number.isFinite(end) && end > max) max = end;
    }
    return Number.isFinite(min) && Number.isFinite(max) ? { min, max } : null;
  });

  const timeSlots = computed(() => {
    const r = range.value;
    if (!r) return [];
    // 上下各預留 20 分鐘
    const start = new Date(r.min);
    start.setMinutes(Math.floor(start.getMinutes() / 10) * 10 - 20, 0, 0);
    const end = new Date(r.max);
    end.setMinutes(Math.ceil(end.getMinutes() / 10) * 10 + 20, 0, 0);

    /** @type {Array<{timestamp: number, time: string}>} */
    const slots = [];
    const cursor = new Date(start);
    while (cursor.getTime() <= end.getTime()) {
      slots.push({
        timestamp: cursor.getTime(),
        time: formatTime(cursor, is24Hour.value),
      });
      cursor.setMinutes(cursor.getMinutes() + 10);
    }
    return slots;
  });

  /**
   * @param {number} stageCount
   */
  function gridStyle(stageCount) {
    const slotsCount = timeSlots.value.length;
    const gridRows =
      slotsCount > 0
        ? `auto 20px repeat(${Math.max(0, slotsCount - 1)}, 40px)`
        : 'auto';
    return {
      display: 'grid',
      gridTemplateColumns: `var(--time-col-width, 80px) repeat(${stageCount}, minmax(var(--stage-col-width, 0), 1fr))`,
      gridTemplateRows: gridRows,
      backgroundColor: '#e5e7eb',
      gap: '1px',
    };
  }

  /**
   * @param {{start: string, end?: string, isPast?: boolean}} perf
   * @param {number} stageIndex
   */
  function perfStyle(perf, stageIndex) {
    const slots = timeSlots.value;
    if (!slots.length) return {};
    const base = slots[0].timestamp;
    const start = new Date(perf.start).getTime();
    const end = new Date(perf.end || perf.start).getTime();
    const offsetRows = (start - base) / SLOT_MS;
    const startRow = Math.round(offsetRows) + 2;
    const spanRows = Math.max(1, Math.round((end - start) / SLOT_MS));
    return {
      gridColumn: stageIndex + 2,
      gridRow: `${startRow} / span ${spanRows}`,
      zIndex: perf.isPast ? 5 : 10,
      opacity: perf.isPast ? 0.6 : 1,
    };
  }

  /**
   * @param {Date} now
   * @returns {number | null}
   */
  function currentOffset(now) {
    const slots = timeSlots.value;
    if (!slots.length) return null;
    const ms = now.getTime();
    const base = slots[0].timestamp;
    const last = slots[slots.length - 1].timestamp;
    if (ms < base || ms > last + SLOT_MS) return null;
    return (ms - base) / SLOT_MS;
  }

  /**
   * @param {Date} now
   */
  function currentLineStyle(now) {
    const offset = currentOffset(now);
    if (offset === null) return { display: 'none' };
    const startRow = Math.floor(offset) + 2;
    const fraction = offset - Math.floor(offset);
    const rowHeight = startRow === 2 ? 20 : 40;
    return {
      gridColumn: '1 / -1',
      gridRow: String(startRow),
      position: 'relative',
      top: `${fraction * rowHeight}px`,
    };
  }

  return {
    timeSlots,
    gridStyle,
    perfStyle,
    currentOffset,
    currentLineStyle,
    SLOT_MS,
  };
}

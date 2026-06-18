// @ts-check
import { computed } from 'vue';
import { formatTime } from '../utils/format';

// 一格 = 5 分鐘。演出時間常落在 5 分邊界（例如 16:55、17:20），
// 用 5 分鐘的格子才能精準對齊、不必四捨五入到 10 分。
const SLOT_MS = 5 * 60 * 1000;
// 每格高度（px）。維持「10 分鐘 = 40px」的視覺密度，所以一格 5 分鐘 = 20px。
const ROW_PX = 20;
// 最上方預留的半格高度。
const FIRST_ROW_PX = ROW_PX / 2;

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

    /** @type {Array<{timestamp: number, time: string, major: boolean}>} */
    const slots = [];
    const cursor = new Date(start);
    while (cursor.getTime() <= end.getTime()) {
      // 只在 10 分鐘的整點格標時間，5 分鐘的半格不標，避免時間欄太擁擠。
      const major = cursor.getMinutes() % 10 === 0;
      slots.push({
        timestamp: cursor.getTime(),
        time: major ? formatTime(cursor, is24Hour.value) : '',
        major,
      });
      cursor.setMinutes(cursor.getMinutes() + 5);
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
        ? `auto ${FIRST_ROW_PX}px repeat(${Math.max(0, slotsCount - 1)}, ${ROW_PX}px)`
        : 'auto';
    return {
      display: 'grid',
      gridTemplateColumns: `var(--time-col-width, 80px) repeat(${stageCount}, minmax(var(--stage-col-width, 0), 1fr))`,
      gridTemplateRows: gridRows,
      backgroundColor: '#e5e7eb',
      // 只留直向（欄與欄之間）的 1px 間隙當分隔線；
      // 橫向的時間格線改由每格的 border-top 畫，才能分別控制 10 分 / 5 分線深淺。
      gap: '0 1px',
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
    // 把開始與結束分別對齊到格線，再由兩者相減算出 span。
    // 不可獨立地對「開始」與「時長」各自四捨五入——那會讓誤差疊加，
    // 造成相鄰演出（例如 16:55–17:20 接著 17:20–17:45）互相重疊。
    const startRow = Math.round((start - base) / SLOT_MS) + 2;
    const endRow = Math.round((end - base) / SLOT_MS) + 2;
    const spanRows = Math.max(1, endRow - startRow);
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
    const rowHeight = startRow === 2 ? FIRST_ROW_PX : ROW_PX;
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

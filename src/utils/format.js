// @ts-check
const WEEKDAYS_ZH = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];

/**
 * @param {Date | string | number | null | undefined} input
 * @returns {Date | null}
 */
function toDate(input) {
  if (input == null) return null;
  const d = input instanceof Date ? input : new Date(input);
  return Number.isFinite(d.getTime()) ? d : null;
}

/**
 * @param {Date | string} input
 * @param {boolean} is24Hour
 */
export function formatTime(input, is24Hour) {
  const d = toDate(input);
  if (!d) return '';
  return d.toLocaleTimeString('zh-TW', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: !is24Hour,
  });
}

/**
 * @param {Date | string} input
 * @param {boolean} is24Hour
 */
export function formatDateTime(input, is24Hour) {
  const d = toDate(input);
  if (!d) return '';
  return d.toLocaleString('zh-TW', {
    dateStyle: 'medium',
    timeStyle: 'short',
    hour12: !is24Hour,
  });
}

/**
 * @param {Date | string} start
 * @param {Date | string} end
 * @param {boolean} is24Hour
 */
export function formatTimeRange(start, end, is24Hour) {
  const s = toDate(start);
  const e = toDate(end);
  if (!s) return '';
  if (!e) return formatTime(s, is24Hour);
  return `${formatTime(s, is24Hour)} - ${formatTime(e, is24Hour)}`;
}

/**
 * @param {Date | string} input
 */
export function formatDayHeader(input) {
  const d = toDate(input);
  if (!d) return '';
  return `${d.toLocaleDateString('zh-TW', { month: 'long', day: 'numeric' })} (${WEEKDAYS_ZH[d.getDay()]})`;
}

/**
 * @param {Date | string} input
 */
export function formatDayLabel(input) {
  const d = toDate(input);
  if (!d) return '';
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}.${mm}.${dd} (${WEEKDAYS_ZH[d.getDay()]})`;
}

export { WEEKDAYS_ZH };

const WEEKDAYS_SHORT_ZH = ['日', '一', '二', '三', '四', '五', '六'];

/**
 * 給列表卡片用的精簡日期範圍：
 * - 同一天：`2026/6/27 (六)`
 * - 跨天：`2026/6/27 (六) – 6/28 (日)`（跨年才會在結束日補年份）
 * @param {Date | string} start
 * @param {Date | string} end
 */
export function formatDateRange(start, end) {
  const s = toDate(start);
  const e = toDate(end);
  if (!s) return '';
  const day = (/** @type {Date} */ d, withYear) =>
    `${withYear ? `${d.getFullYear()}/` : ''}${d.getMonth() + 1}/${d.getDate()} (${WEEKDAYS_SHORT_ZH[d.getDay()]})`;
  if (!e || s.toDateString() === e.toDateString()) return day(s, true);
  return `${day(s, true)} – ${day(e, e.getFullYear() !== s.getFullYear())}`;
}

/**
 * 活動相對於現在的狀態，給狀態徽章用。
 * @param {Date | string} start
 * @param {Date | string} end
 * @param {Date | number} [now]
 * @returns {{ label: string, tone: 'live' | 'soon' | 'upcoming' | 'past' }}
 */
export function festivalStatus(start, end, now = Date.now()) {
  const s = toDate(start);
  const e = toDate(end);
  const nowMs = typeof now === 'number' ? now : now.getTime();
  if (!s) return { label: '', tone: 'upcoming' };
  const endMs = e ? e.getTime() : s.getTime();
  if (nowMs > endMs) return { label: '已結束', tone: 'past' };
  if (nowMs >= s.getTime()) return { label: '進行中', tone: 'live' };
  // 以「日曆天」計算，避免下午看到「0 天後」
  const startDay = new Date(s);
  startDay.setHours(0, 0, 0, 0);
  const today = new Date(nowMs);
  today.setHours(0, 0, 0, 0);
  const days = Math.round((startDay.getTime() - today.getTime()) / 86400000);
  if (days <= 0) return { label: '今天開始', tone: 'soon' };
  if (days === 1) return { label: '明天', tone: 'soon' };
  if (days <= 7) return { label: `${days} 天後`, tone: 'soon' };
  if (days <= 60) return { label: `${days} 天後`, tone: 'upcoming' };
  return { label: `${Math.round(days / 30)} 個月後`, tone: 'upcoming' };
}

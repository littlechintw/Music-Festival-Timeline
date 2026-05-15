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

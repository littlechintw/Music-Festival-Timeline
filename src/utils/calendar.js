// Utility: Generate Google Calendar event link
// Single event link
export function googleCalendarLink({ summary, start, end, location, details }) {
  // Format: YYYYMMDDTHHmmssZ (UTC)
  function toGoogleDate(date) {
    const d = new Date(date);
    return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  }
  const startStr = toGoogleDate(start);
  const endStr = toGoogleDate(end);
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(summary)}&dates=${startStr}/${endStr}&location=${encodeURIComponent(location)}&details=${encodeURIComponent(details)}`;
}

// Multi-event: generate array of links (for batch add, user opens each)
export function googleCalendarLinks(perfs) {
  return perfs.map(perf => googleCalendarLink({
    summary: perf.artist + (perf.festivalName ? ' @ ' + perf.festivalName : ''),
    start: perf.start,
    end: perf.end,
    location: perf.stage,
    details: 'From Festival App',
  }));
}

// ---- iCalendar (.ics) 匯出 ----
// 加進手機／電腦行事曆後，提醒就交給系統行事曆 App，
// 瀏覽器關掉也會準時響（不需要後端或 Web Push）。

/**
 * ISO 字串 → iCalendar 的 UTC 時間格式（YYYYMMDDTHHMMSSZ）。
 * 來源帶 +08:00，會轉成等效 UTC 瞬間，行事曆再依裝置時區顯示。
 * @param {string} iso
 */
function toIcsUtc(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

/**
 * 跳脫 iCalendar 文字欄位（\\ ; , 與換行）。
 * @param {string} s
 */
function escapeText(s) {
  return String(s ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

/**
 * 依 RFC 5545 折行：每行內容 ≤ 73 bytes，續行前綴一個空白。
 * 用碼點迭代，避免把多位元組字（中文）切壞。
 * @param {string} line
 */
function foldLine(line) {
  const enc = new TextEncoder();
  if (enc.encode(line).length <= 75) return line;
  /** @type {string[]} */
  const segments = [];
  let cur = '';
  let bytes = 0;
  for (const ch of line) {
    const chBytes = enc.encode(ch).length;
    if (bytes + chBytes > 73) {
      segments.push(cur);
      cur = ch;
      bytes = chBytes;
    } else {
      cur += ch;
      bytes += chBytes;
    }
  }
  if (cur) segments.push(cur);
  return segments.join('\r\n ');
}

/**
 * 把行程清單組成 .ics 內容。
 *
 * @param {Array<{id?: string, artist: string, start: string, end?: string, stage?: string, festivalId?: string, festivalName?: string}>} plan
 * @param {{ reminderMinutes?: number[], calendarName?: string }} [options]
 * @returns {string}
 */
export function buildPlanIcs(plan, options = {}) {
  const reminders = options.reminderMinutes?.length ? options.reminderMinutes : [10];
  const calName = options.calendarName || '我的音樂祭行程';
  const stamp = toIcsUtc(new Date().toISOString());

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Music Festival Timeline//TW//',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeText(calName)}`,
  ];

  for (const p of plan || []) {
    const start = toIcsUtc(p.start);
    if (!start) continue;
    const endIso = p.end || new Date(new Date(p.start).getTime() + 60 * 60 * 1000).toISOString();
    const end = toIcsUtc(endIso) || start;
    const uid =
      String(p.id || `${p.festivalId}_${p.stage}_${p.artist}_${p.start}`).replace(/\s+/g, '-') +
      '@music-festival-timeline';
    const location = [p.stage, p.festivalName].filter(Boolean).join(' ｜ ');
    const description = [p.festivalName, p.stage ? `舞台：${p.stage}` : ''].filter(Boolean).join('\n');

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${uid}`);
    lines.push(`DTSTAMP:${stamp}`);
    lines.push(`DTSTART:${start}`);
    lines.push(`DTEND:${end}`);
    lines.push(`SUMMARY:${escapeText(p.artist)}`);
    if (location) lines.push(`LOCATION:${escapeText(location)}`);
    if (description) lines.push(`DESCRIPTION:${escapeText(description)}`);
    for (const m of reminders) {
      lines.push('BEGIN:VALARM');
      lines.push('ACTION:DISPLAY');
      lines.push(`DESCRIPTION:${escapeText(`${p.artist} 即將開始`)}`);
      lines.push(`TRIGGER:-PT${m}M`);
      lines.push('END:VALARM');
    }
    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');
  return lines.map(foldLine).join('\r\n');
}

/**
 * 觸發瀏覽器下載 .ics 檔。
 * @param {string} icsText
 * @param {string} filename
 */
export function downloadIcs(icsText, filename) {
  const blob = new Blob([icsText], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

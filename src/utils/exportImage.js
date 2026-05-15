// @ts-check
// 把行程畫成一張 PNG 圖，給使用者下載 / 分享。
// 解析度依照當下螢幕比例計算，畫面 sharp 程度跟著 DPR。
//
// 設計：1080 寬（IG / Line / Threads 都接受）× 等比例高度。
// 內容：標題（音樂祭名稱 + 日期）→ 每日 section → 演出列表 → 底部 branding。

/**
 * @typedef {import('../stores/plan').PlanEntry} PlanEntry
 */

const TARGET_WIDTH = 1080;
const PADDING = 48;
const HEADER_HEIGHT = 220;
const DAY_HEADER_HEIGHT = 80;
const PERF_ROW_HEIGHT = 110;
const FOOTER_HEIGHT = 90;
const TIME_COL_WIDTH = 220;

/**
 * 偵測螢幕比例。回傳目標 canvas 寬高與 DPR。
 * 比例上限 9:32 防止超瘦長手機畫出來太怪。
 */
export function detectExportDimensions() {
  if (typeof window === 'undefined') {
    return { width: TARGET_WIDTH, height: 1920, dpr: 2 };
  }
  const vw = window.innerWidth || 390;
  const vh = window.innerHeight || 844;
  const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 3));
  const aspectRatio = Math.min(Math.max(vh / vw, 16 / 9), 32 / 9);
  return {
    width: TARGET_WIDTH,
    height: Math.round(TARGET_WIDTH * aspectRatio),
    dpr,
  };
}

const WEEKDAYS_ZH = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];

/**
 * @param {Date} d
 */
function formatDayLabel(d) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}.${mm}.${dd} (${WEEKDAYS_ZH[d.getDay()]})`;
}

/**
 * @param {Date} d
 * @param {boolean} is24Hour
 */
function formatTime(d, is24Hour) {
  return d.toLocaleTimeString('zh-TW', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: !is24Hour,
  });
}

/**
 * @param {PlanEntry[]} perfs
 */
function groupByDay(perfs) {
  /** @type {Map<string, { date: Date, perfs: PlanEntry[] }>} */
  const map = new Map();
  for (const perf of perfs) {
    const date = new Date(perf.start);
    const key = date.toDateString();
    if (!map.has(key)) map.set(key, { date, perfs: [] });
    map.get(key).perfs.push(perf);
  }
  for (const day of map.values()) {
    day.perfs.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
  }
  return [...map.values()].sort((a, b) => a.date.getTime() - b.date.getTime());
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {string} text
 * @param {number} maxWidth
 */
function ellipsize(ctx, text, maxWidth) {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let lo = 0;
  let hi = text.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    const sub = text.slice(0, mid) + '…';
    if (ctx.measureText(sub).width <= maxWidth) lo = mid + 1;
    else hi = mid;
  }
  return text.slice(0, Math.max(0, lo - 1)) + '…';
}

/**
 * 把 hex 主色轉成 rgba（給 background tint 用）。
 * @param {string} hex
 * @param {number} alpha
 */
function hexToRgba(hex, alpha) {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  if (h.length !== 6) return `rgba(37, 99, 235, ${alpha})`;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * 把行程畫成 PNG dataURL。
 *
 * @param {{
 *   festivalName: string,
 *   primaryColor?: string,
 *   secondaryColor?: string,
 *   perfs: PlanEntry[],
 *   is24Hour: boolean,
 *   dimensions?: { width: number, height: number, dpr: number },
 * }} opts
 * @returns {string} data URL (image/png)
 */
export function renderPlanToDataUrl(opts) {
  const dims = opts.dimensions ?? detectExportDimensions();
  const { width, height, dpr } = dims;
  const days = groupByDay(opts.perfs);

  // 必要時延伸畫布高度，避免內容截斷
  const contentHeight =
    HEADER_HEIGHT +
    days.reduce((sum, d) => sum + DAY_HEADER_HEIGHT + d.perfs.length * PERF_ROW_HEIGHT, 0) +
    FOOTER_HEIGHT +
    PADDING * 2;
  const finalHeight = Math.max(height, contentHeight);

  const canvas = document.createElement('canvas');
  canvas.width = width * dpr;
  canvas.height = finalHeight * dpr;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');
  ctx.scale(dpr, dpr);
  ctx.textBaseline = 'middle';

  const primary = opts.primaryColor || '#2563eb';
  const _secondary = opts.secondaryColor || '#7c3aed';
  void _secondary;

  // 背景：白 + 上方主色漸層
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, finalHeight);

  const gradient = ctx.createLinearGradient(0, 0, 0, HEADER_HEIGHT + 40);
  gradient.addColorStop(0, primary);
  gradient.addColorStop(1, hexToRgba(primary, 0.7));
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, HEADER_HEIGHT);

  // 標題
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 56px "Helvetica Neue", "Noto Sans TC", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(ellipsize(ctx, opts.festivalName, width - PADDING * 2), PADDING, 90);

  ctx.font = '30px "Helvetica Neue", "Noto Sans TC", sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.88)';
  ctx.fillText(`我的行程・共 ${opts.perfs.length} 場演出`, PADDING, 150);

  // 由內容繪製
  let y = HEADER_HEIGHT + PADDING;

  for (const day of days) {
    // 日期 header
    ctx.fillStyle = hexToRgba(primary, 0.12);
    ctx.fillRect(PADDING, y, width - PADDING * 2, DAY_HEADER_HEIGHT - 16);

    ctx.fillStyle = '#111827';
    ctx.font = 'bold 36px "Helvetica Neue", "Noto Sans TC", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(formatDayLabel(day.date), PADDING + 24, y + (DAY_HEADER_HEIGHT - 16) / 2);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#4b5563';
    ctx.font = '26px "Helvetica Neue", "Noto Sans TC", sans-serif';
    ctx.fillText(
      `${day.perfs.length} 場`,
      width - PADDING - 24,
      y + (DAY_HEADER_HEIGHT - 16) / 2
    );

    y += DAY_HEADER_HEIGHT;

    // 每場演出
    for (const perf of day.perfs) {
      const start = new Date(perf.start);
      const end = perf.end ? new Date(perf.end) : null;
      const timeStr = end
        ? `${formatTime(start, opts.is24Hour)} - ${formatTime(end, opts.is24Hour)}`
        : formatTime(start, opts.is24Hour);

      // 左側：時間欄
      ctx.fillStyle = primary;
      ctx.font = 'bold 32px "Helvetica Neue", "Noto Sans TC", monospace';
      ctx.textAlign = 'left';
      ctx.fillText(timeStr, PADDING + 8, y + PERF_ROW_HEIGHT / 2 - 6);

      ctx.fillStyle = '#6b7280';
      ctx.font = '24px "Helvetica Neue", "Noto Sans TC", sans-serif';
      ctx.fillText(perf.stage || '', PADDING + 8, y + PERF_ROW_HEIGHT / 2 + 28);

      // 右側：演出者名稱
      ctx.fillStyle = '#111827';
      ctx.font = 'bold 40px "Helvetica Neue", "Noto Sans TC", sans-serif';
      ctx.textAlign = 'left';
      const artistText = ellipsize(
        ctx,
        perf.artist,
        width - TIME_COL_WIDTH - PADDING * 2 - 16
      );
      ctx.fillText(
        artistText,
        PADDING + TIME_COL_WIDTH,
        y + PERF_ROW_HEIGHT / 2
      );

      // 分隔線
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(PADDING, y + PERF_ROW_HEIGHT - 1);
      ctx.lineTo(width - PADDING, y + PERF_ROW_HEIGHT - 1);
      ctx.stroke();

      y += PERF_ROW_HEIGHT;
    }

    y += 24;
  }

  // Footer
  const footerY = finalHeight - FOOTER_HEIGHT;
  ctx.fillStyle = hexToRgba(primary, 0.08);
  ctx.fillRect(0, footerY, width, FOOTER_HEIGHT);

  ctx.fillStyle = '#4b5563';
  ctx.font = '24px "Helvetica Neue", "Noto Sans TC", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('🎵 音樂祭行程助手', width / 2, footerY + FOOTER_HEIGHT / 2);

  return canvas.toDataURL('image/png');
}

/**
 * 把 dataURL 觸發瀏覽器下載。
 *
 * @param {string} dataUrl
 * @param {string} filename
 */
export function downloadDataUrl(dataUrl, filename) {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

/**
 * 嘗試用 Web Share API 分享圖片（手機上會跳系統分享面板）。失敗就 fallback 到下載。
 *
 * @param {string} dataUrl
 * @param {string} filename
 * @param {string} title
 */
export async function shareOrDownload(dataUrl, filename, title) {
  try {
    if (
      typeof navigator !== 'undefined' &&
      'share' in navigator &&
      'canShare' in navigator
    ) {
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], filename, { type: 'image/png' });
      // @ts-ignore canShare 型別不認 files
      if (navigator.canShare({ files: [file] })) {
        // @ts-ignore
        await navigator.share({ title, files: [file] });
        return 'shared';
      }
    }
  } catch {
    // 使用者取消或不支援 — fall through 到下載
  }
  downloadDataUrl(dataUrl, filename);
  return 'downloaded';
}

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
const FOOTER_HEIGHT = 110;
const TIME_COL_WIDTH = 220;

// 匯出圖底下要露出來的網址，方便看到圖片的人來開應用。
// 同一份字串會在「列表」與「時間表」兩種版型的 footer 都印一次。
export const APP_PUBLIC_URL = 'https://mf.littlechin.tw/';

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

  // Footer：品牌 + 應用網址
  const footerY = finalHeight - FOOTER_HEIGHT;
  ctx.fillStyle = hexToRgba(primary, 0.08);
  ctx.fillRect(0, footerY, width, FOOTER_HEIGHT);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#4b5563';
  ctx.font = '24px "Helvetica Neue", "Noto Sans TC", sans-serif';
  ctx.fillText('🎵 音樂祭行程助手', width / 2, footerY + FOOTER_HEIGHT / 2 - 16);

  ctx.fillStyle = hexToRgba(primary, 0.95);
  ctx.font = 'bold 22px "Helvetica Neue", "SF Mono", "Menlo", monospace';
  ctx.fillText(APP_PUBLIC_URL, width / 2, footerY + FOOTER_HEIGHT / 2 + 20);

  return canvas.toDataURL('image/png');
}

/* ------------------------------------------------------------------ */
/* 時間表（timetable）匯出：每天一張，已選顯眼、未選降彩度 + 0.5 透明     */
/* ------------------------------------------------------------------ */

/**
 * @typedef {{
 *   artist: string,
 *   start: string,       // ISO datetime
 *   end?: string,        // ISO datetime
 *   selected: boolean,   // 是否在使用者行程裡
 *   description?: string,
 * }} TimetablePerf
 *
 * @typedef {{
 *   id?: string,
 *   name: string,
 *   performances: TimetablePerf[],
 * }} TimetableStage
 */

const TT_PADDING = 40;
const TT_HEADER_HEIGHT = 180;
const TT_STAGE_HEADER_HEIGHT = 60;
const TT_TIME_COL_WIDTH = 96;
const TT_FOOTER_HEIGHT = 100;
const TT_PX_PER_MIN = 3.6; // 1 小時 = 216px
const TT_MIN_STAGE_COL_WIDTH = 180;
const TT_LEGEND_HEIGHT = 56;

/**
 * 把 hex 轉成 HSL，會用來降彩度製作 "淡化" 效果。
 * @param {string} hex
 * @returns {[number, number, number]} h(0-360), s(0-100), l(0-100)
 */
function hexToHsl(hex) {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  if (h.length !== 6) return [220, 80, 55];
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let s = 0;
  let hue = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: hue = (g - b) / d + (g < b ? 6 : 0); break;
      case g: hue = (b - r) / d + 2; break;
      default: hue = (r - g) / d + 4;
    }
    hue *= 60;
  }
  return [hue, s * 100, l * 100];
}

/**
 * 把主色降彩度，保留色相但偏灰；用來畫「未選」演出。
 * @param {string} hex
 * @param {number} alpha
 */
function dimColor(hex, alpha) {
  const [h, s, l] = hexToHsl(hex);
  // 降到 30% 飽和度，亮度往中性靠
  const newS = Math.max(8, s * 0.3);
  const newL = l < 50 ? Math.min(70, l + 18) : Math.max(45, l - 8);
  return `hsla(${h.toFixed(0)}, ${newS.toFixed(0)}%, ${newL.toFixed(0)}%, ${alpha})`;
}

/**
 * @param {TimetablePerf} p
 */
function perfTimes(p) {
  const start = new Date(p.start);
  const end = p.end ? new Date(p.end) : new Date(start.getTime() + 30 * 60_000);
  return { start, end };
}

/**
 * 從所有舞台的演出中算出當天的「最早開場 ~ 最晚結束」整點對齊。
 *
 * @param {TimetableStage[]} stages
 */
function computeDayRange(stages) {
  let min = Infinity;
  let max = -Infinity;
  for (const s of stages) {
    for (const p of s.performances) {
      const { start, end } = perfTimes(p);
      if (start.getTime() < min) min = start.getTime();
      if (end.getTime() > max) max = end.getTime();
    }
  }
  if (!Number.isFinite(min) || !Number.isFinite(max)) return null;
  // 向外擴張到整 30 分鐘 + 上下各 30 分鐘留白
  const SLOT = 30 * 60_000;
  min = Math.floor(min / SLOT) * SLOT - SLOT;
  max = Math.ceil(max / SLOT) * SLOT + SLOT;
  return { start: new Date(min), end: new Date(max) };
}

/**
 * 文字換行（給標題用，含 CJK，所以以「字元」為單位 break 即可）。
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {string} text
 * @param {number} maxWidth
 * @param {number} maxLines
 */
function wrapText(ctx, text, maxWidth, maxLines) {
  const out = [];
  let cur = '';
  for (const ch of text) {
    const next = cur + ch;
    if (ctx.measureText(next).width > maxWidth) {
      if (cur) out.push(cur);
      cur = ch;
      if (out.length >= maxLines) break;
    } else {
      cur = next;
    }
  }
  if (cur && out.length < maxLines) out.push(cur);
  if (out.length === maxLines && ctx.measureText(cur).width > maxWidth) {
    out[maxLines - 1] = ellipsize(ctx, out[maxLines - 1], maxWidth);
  }
  return out;
}

/**
 * 畫一張「單一天的時間表」PNG。
 *
 * - 每個 stage 一欄；時間從上往下流。
 * - selected=true 的演出：實心主色 + 白字 + 1.5px 邊框，明顯。
 * - selected=false 的演出：用 dimColor() 把主色降彩度，再疊 0.5 透明度，淡化。
 *
 * @param {{
 *   festivalName: string,
 *   dayLabel: string,
 *   primaryColor?: string,
 *   secondaryColor?: string,
 *   stages: TimetableStage[],
 *   is24Hour: boolean,
 *   width?: number,    // 預設 1080，舞台多就會自動加寬
 *   dpr?: number,
 * }} opts
 * @returns {string} data URL (image/png)
 */
export function renderTimetableToDataUrl(opts) {
  const primary = opts.primaryColor || '#2563eb';
  const stages = opts.stages.filter((s) => s.performances.length > 0);
  const dpr = Math.max(1, Math.min(opts.dpr ?? 2, 3));

  if (stages.length === 0) {
    // 退化情況：沒有任何演出，畫一張很小的「無內容」圖
    const fallback = document.createElement('canvas');
    fallback.width = 1080;
    fallback.height = 400;
    const fctx = fallback.getContext('2d');
    if (fctx) {
      fctx.fillStyle = '#ffffff';
      fctx.fillRect(0, 0, 1080, 400);
      fctx.fillStyle = '#6b7280';
      fctx.font = '32px "Helvetica Neue", "Noto Sans TC", sans-serif';
      fctx.textAlign = 'center';
      fctx.fillText(`${opts.dayLabel}：當天沒有演出資料`, 540, 200);
    }
    return fallback.toDataURL('image/png');
  }

  const range = computeDayRange(stages);
  if (!range) throw new Error('時間範圍無法計算');

  const totalMin = (range.end.getTime() - range.start.getTime()) / 60_000;
  const gridHeight = totalMin * TT_PX_PER_MIN;

  // 計算寬度：1080 為基準，舞台多就加寬
  const baseWidth = opts.width ?? 1080;
  const availableForStages = baseWidth - TT_PADDING * 2 - TT_TIME_COL_WIDTH;
  let stageColWidth = availableForStages / stages.length;
  let width = baseWidth;
  if (stageColWidth < TT_MIN_STAGE_COL_WIDTH) {
    stageColWidth = TT_MIN_STAGE_COL_WIDTH;
    width = TT_PADDING * 2 + TT_TIME_COL_WIDTH + stageColWidth * stages.length;
  }

  const height =
    TT_HEADER_HEIGHT +
    TT_LEGEND_HEIGHT +
    TT_STAGE_HEADER_HEIGHT +
    gridHeight +
    TT_FOOTER_HEIGHT +
    TT_PADDING;

  const canvas = document.createElement('canvas');
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');
  ctx.scale(dpr, dpr);
  ctx.textBaseline = 'middle';

  // ----- 背景 -----
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  // 頂端主色 band
  const gradient = ctx.createLinearGradient(0, 0, 0, TT_HEADER_HEIGHT);
  gradient.addColorStop(0, primary);
  gradient.addColorStop(1, hexToRgba(primary, 0.78));
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, TT_HEADER_HEIGHT);

  // ----- Header 文字 -----
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'left';
  ctx.font = 'bold 48px "Helvetica Neue", "Noto Sans TC", sans-serif';
  ctx.fillText(
    ellipsize(ctx, opts.festivalName, width - TT_PADDING * 2),
    TT_PADDING,
    72
  );
  ctx.font = '28px "Helvetica Neue", "Noto Sans TC", sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.fillText(opts.dayLabel, TT_PADDING, 124);

  const selectedCount = stages.reduce(
    (acc, s) => acc + s.performances.filter((p) => p.selected).length,
    0
  );
  const totalCount = stages.reduce((acc, s) => acc + s.performances.length, 0);
  ctx.font = '22px "Helvetica Neue", "Noto Sans TC", sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.82)';
  ctx.textAlign = 'right';
  ctx.fillText(`已選 ${selectedCount} / 共 ${totalCount} 場`, width - TT_PADDING, 124);
  ctx.textAlign = 'left';

  // ----- Legend -----
  const legendY = TT_HEADER_HEIGHT + 12;
  // 已選 sample
  ctx.fillStyle = primary;
  ctx.fillRect(TT_PADDING, legendY, 28, 20);
  ctx.fillStyle = '#374151';
  ctx.font = '20px "Helvetica Neue", "Noto Sans TC", sans-serif';
  ctx.fillText('已加入行程', TT_PADDING + 36, legendY + 10);
  // 未選 sample
  const legendDimX = TT_PADDING + 220;
  ctx.fillStyle = dimColor(primary, 0.5);
  ctx.fillRect(legendDimX, legendY, 28, 20);
  ctx.fillStyle = '#6b7280';
  ctx.font = '20px "Helvetica Neue", "Noto Sans TC", sans-serif';
  ctx.fillText('其他場次（未選）', legendDimX + 36, legendY + 10);

  // ----- 表頭：舞台名 -----
  const gridX = TT_PADDING + TT_TIME_COL_WIDTH;
  const stageHeaderY = TT_HEADER_HEIGHT + TT_LEGEND_HEIGHT;
  ctx.fillStyle = hexToRgba(primary, 0.12);
  ctx.fillRect(TT_PADDING, stageHeaderY, width - TT_PADDING * 2, TT_STAGE_HEADER_HEIGHT);
  ctx.fillStyle = '#111827';
  ctx.font = 'bold 22px "Helvetica Neue", "Noto Sans TC", sans-serif';
  ctx.textAlign = 'center';
  for (let i = 0; i < stages.length; i++) {
    const cx = gridX + stageColWidth * i + stageColWidth / 2;
    ctx.fillText(
      ellipsize(ctx, stages[i].name, stageColWidth - 16),
      cx,
      stageHeaderY + TT_STAGE_HEADER_HEIGHT / 2
    );
  }

  // 時間欄表頭
  ctx.fillStyle = '#374151';
  ctx.font = 'bold 20px "Helvetica Neue", "Noto Sans TC", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('時間', TT_PADDING + TT_TIME_COL_WIDTH / 2, stageHeaderY + TT_STAGE_HEADER_HEIGHT / 2);

  // ----- 時間網格 -----
  const gridY = stageHeaderY + TT_STAGE_HEADER_HEIGHT;
  const SLOT_MIN = 30;
  ctx.strokeStyle = '#e5e7eb';
  ctx.lineWidth = 1;

  // 30 分鐘 dashed 線 + 整點實線 + 時間 label
  for (let t = range.start.getTime(); t <= range.end.getTime(); t += SLOT_MIN * 60_000) {
    const offsetMin = (t - range.start.getTime()) / 60_000;
    const y = gridY + offsetMin * TT_PX_PER_MIN;
    const isHour = new Date(t).getMinutes() === 0;
    ctx.beginPath();
    if (isHour) {
      ctx.setLineDash([]);
      ctx.strokeStyle = '#d1d5db';
    } else {
      ctx.setLineDash([4, 6]);
      ctx.strokeStyle = '#e5e7eb';
    }
    ctx.moveTo(TT_PADDING + TT_TIME_COL_WIDTH, y);
    ctx.lineTo(width - TT_PADDING, y);
    ctx.stroke();
    if (isHour) {
      ctx.fillStyle = '#4b5563';
      ctx.font = 'bold 18px "Helvetica Neue", "Noto Sans TC", monospace';
      ctx.textAlign = 'right';
      ctx.fillText(
        formatTime(new Date(t), opts.is24Hour),
        TT_PADDING + TT_TIME_COL_WIDTH - 10,
        y
      );
    }
  }
  ctx.setLineDash([]);

  // 舞台分隔線
  ctx.strokeStyle = '#e5e7eb';
  for (let i = 0; i <= stages.length; i++) {
    const x = gridX + stageColWidth * i;
    ctx.beginPath();
    ctx.moveTo(x, gridY);
    ctx.lineTo(x, gridY + gridHeight);
    ctx.stroke();
  }
  // 外框
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(TT_PADDING + TT_TIME_COL_WIDTH, gridY, width - TT_PADDING * 2 - TT_TIME_COL_WIDTH, gridHeight);

  // ----- 演出 block：先畫「未選」再畫「已選」，讓已選蓋在上面 -----
  /** @type {Array<{ stage: TimetableStage, perf: TimetablePerf, stageIdx: number }>} */
  const flat = [];
  stages.forEach((s, idx) => {
    for (const p of s.performances) flat.push({ stage: s, perf: p, stageIdx: idx });
  });
  flat.sort((a, b) => Number(a.perf.selected) - Number(b.perf.selected));

  for (const item of flat) {
    const { perf, stageIdx } = item;
    const { start, end } = perfTimes(perf);
    const offMin = (start.getTime() - range.start.getTime()) / 60_000;
    const durMin = Math.max(15, (end.getTime() - start.getTime()) / 60_000);
    const x = gridX + stageColWidth * stageIdx + 4;
    const w = stageColWidth - 8;
    const y = gridY + offMin * TT_PX_PER_MIN + 2;
    const h = durMin * TT_PX_PER_MIN - 4;

    if (perf.selected) {
      // 主色實心 + 邊框
      ctx.fillStyle = primary;
      roundRect(ctx, x, y, w, h, 8, true, false);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      roundRect(ctx, x, y, w, h, 8, false, true);
      ctx.fillStyle = '#ffffff';
      drawPerfText(ctx, perf, opts.is24Hour, x, y, w, h, true);
    } else {
      ctx.save();
      ctx.fillStyle = dimColor(primary, 0.5);
      roundRect(ctx, x, y, w, h, 8, true, false);
      // 細邊框（同色系，深一點）
      ctx.strokeStyle = dimColor(primary, 0.7);
      ctx.lineWidth = 1;
      roundRect(ctx, x, y, w, h, 8, false, true);
      ctx.fillStyle = 'rgba(31, 41, 55, 0.75)'; // 深灰字
      drawPerfText(ctx, perf, opts.is24Hour, x, y, w, h, false);
      ctx.restore();
    }
  }

  // ----- Footer：品牌 + 應用網址 -----
  const footerY = height - TT_FOOTER_HEIGHT;
  ctx.fillStyle = hexToRgba(primary, 0.08);
  ctx.fillRect(0, footerY, width, TT_FOOTER_HEIGHT);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#4b5563';
  ctx.font = '22px "Helvetica Neue", "Noto Sans TC", sans-serif';
  ctx.fillText('🎵 音樂祭行程助手 · 時間表', width / 2, footerY + TT_FOOTER_HEIGHT / 2 - 14);

  ctx.fillStyle = hexToRgba(primary, 0.95);
  ctx.font = 'bold 20px "Helvetica Neue", "SF Mono", "Menlo", monospace';
  ctx.fillText(APP_PUBLIC_URL, width / 2, footerY + TT_FOOTER_HEIGHT / 2 + 18);

  return canvas.toDataURL('image/png');
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {TimetablePerf} perf
 * @param {boolean} is24Hour
 * @param {number} x
 * @param {number} y
 * @param {number} w
 * @param {number} h
 * @param {boolean} selected
 */
function drawPerfText(ctx, perf, is24Hour, x, y, w, h, selected) {
  const padX = 10;
  const innerW = w - padX * 2;
  const { start, end } = perfTimes(perf);
  const timeStr = `${formatTime(start, is24Hour)}–${formatTime(end, is24Hour)}`;

  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';

  // artist 名字（最多 2 行）
  ctx.font = selected
    ? 'bold 22px "Helvetica Neue", "Noto Sans TC", sans-serif'
    : '600 21px "Helvetica Neue", "Noto Sans TC", sans-serif';
  const lines = wrapText(ctx, perf.artist, innerW, h > 80 ? 2 : 1);
  let textY = y + 10;
  for (const line of lines) {
    ctx.fillText(line, x + padX, textY);
    textY += 26;
  }

  if (h - (textY - y) > 26) {
    ctx.font = '16px "Helvetica Neue", "Noto Sans TC", monospace';
    ctx.fillStyle = selected ? 'rgba(255,255,255,0.92)' : 'rgba(55,65,81,0.7)';
    ctx.fillText(ellipsize(ctx, timeStr, innerW), x + padX, textY + 2);
  }

  ctx.textBaseline = 'middle';
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x
 * @param {number} y
 * @param {number} w
 * @param {number} h
 * @param {number} r
 * @param {boolean} fill
 * @param {boolean} stroke
 */
function roundRect(ctx, x, y, w, h, r, fill, stroke) {
  const radius = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  if (fill) ctx.fill();
  if (stroke) ctx.stroke();
}

/**
 * 從 festival 資料 + 使用者行程，建出「某一天的 timetable stages」資料。
 *
 * @param {{
 *   festival: { festivalId: string, stages: Array<{ id?: string, name: string, performances: Array<{ artist: string, start: string, end?: string, description?: string }> }> },
 *   dayKey: string,     // Date.toDateString() — 用來篩當天演出
 *   selectedKeys: Set<string>,   // 使用者已選的 perf composite key
 * }} opts
 * @returns {TimetableStage[]}
 */
export function buildTimetableStagesForDay(opts) {
  /** @type {TimetableStage[]} */
  const out = [];
  for (const stage of opts.festival.stages) {
    /** @type {TimetablePerf[]} */
    const perfs = [];
    for (const p of stage.performances) {
      const d = new Date(p.start);
      if (d.toDateString() !== opts.dayKey) continue;
      const key = `${opts.festival.festivalId}_${stage.name}_${p.artist}_${p.start}`;
      perfs.push({
        artist: p.artist,
        start: p.start,
        end: p.end,
        selected: opts.selectedKeys.has(key),
        description: p.description,
      });
    }
    perfs.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
    out.push({
      id: stage.id,
      name: stage.name,
      performances: perfs,
    });
  }
  return out;
}

/**
 * 從 festival 資料找出有演出的日期清單（toDateString key + Date）。
 *
 * @param {{ stages: Array<{ performances: Array<{ start: string }> }> }} festival
 */
export function listFestivalDays(festival) {
  /** @type {Map<string, Date>} */
  const map = new Map();
  for (const s of festival.stages) {
    for (const p of s.performances) {
      const d = new Date(p.start);
      const k = d.toDateString();
      if (!map.has(k)) map.set(k, new Date(d.getFullYear(), d.getMonth(), d.getDate()));
    }
  }
  return [...map.entries()]
    .map(([key, date]) => ({ key, date, label: formatDayLabel(date) }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());
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

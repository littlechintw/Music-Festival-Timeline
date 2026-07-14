// @ts-check
// 行程分享編碼。
// 格式：`[n=<uri-encoded name>|]<festivalId>;<stageName>:<MMDDHHmm>[,<MMDDHHmm>]*[;...]`
// 例：n=%E9%80%B1%E6%9C%AB%E5%A0%B4%E6%AC%A1|fireball-2025;火舞台:03211200,03211400;球舞台:03221530
// 開頭的 `n=...|` 是選填的分享名稱，舊格式（沒有這段）一樣能正確解析——
// festivalId 只會是 [a-z0-9-]+（schema 限制），不可能以 `n=` 開頭，所以不會誤判。
import { makePerfId } from './perfId';

/** @typedef {import('../stores/plan').PlanEntry} PlanEntry */
/** @typedef {import('../pwa/schema').Festival} Festival */

/** @param {number} n */
const pad = (n) => String(n).padStart(2, '0');

/** @param {Date} d */
function shortTime(d) {
  return `${pad(d.getMonth() + 1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}`;
}

/**
 * @param {PlanEntry[]} planArray
 * @param {string} [name] 分享行程的選填名稱
 */
export function encodePlanToText(planArray, name = '') {
  if (!planArray.length) return '';
  const festId = planArray[0].festivalId;
  /** @type {Record<string, string[]>} */
  const stages = {};
  for (const p of planArray) {
    if (!stages[p.stage]) stages[p.stage] = [];
    stages[p.stage].push(shortTime(new Date(p.start)));
  }
  const stageStrings = Object.entries(stages).map(([stage, times]) => `${stage}:${times.join(',')}`);
  const base = `${festId};${stageStrings.join(';')}`;
  const trimmedName = name.trim();
  return trimmedName ? `n=${encodeURIComponent(trimmedName)}|${base}` : base;
}

/**
 * @param {string} rawText
 * @param {Festival[]} festivals
 * @returns {{festival: Festival | null, plan: PlanEntry[], invalidCount: number, name: string}}
 */
export function decodePlanFromText(rawText, festivals) {
  let name = '';
  let rest = rawText;
  if (rawText.startsWith('n=')) {
    const sep = rawText.indexOf('|');
    if (sep !== -1) {
      name = decodeURIComponent(rawText.slice(2, sep));
      rest = rawText.slice(sep + 1);
    }
  }

  const parts = rest.split(';');
  const festId = parts[0];
  const festival = festivals.find((f) => f.festivalId === festId) || null;
  if (!festival) return { festival: null, plan: [], invalidCount: 0, name };

  /** @type {PlanEntry[]} */
  const plan = [];
  let invalidCount = 0;
  for (let i = 1; i < parts.length; i++) {
    if (!parts[i]) continue;
    const [stageName, timesStr] = parts[i].split(':');
    if (!timesStr) continue;
    const times = timesStr.split(',');
    const stage = festival.stages.find((s) => s.name === stageName);
    if (!stage) {
      invalidCount += times.length;
      continue;
    }
    for (const t of times) {
      const perf = stage.performances.find((p) => shortTime(new Date(p.start)) === t);
      if (!perf) {
        invalidCount++;
        continue;
      }
      plan.push(/** @type {PlanEntry} */ ({
        ...perf,
        stage: stage.name,
        festivalId: festival.festivalId,
        festivalName: festival.name,
        id: makePerfId(festival, stage, perf),
      }));
    }
  }
  plan.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
  return { festival, plan, invalidCount, name };
}

// @ts-check
// 行程分享編碼。
// 格式：`<festivalId>;<stageName>:<MMDDHHmm>[,<MMDDHHmm>]*[;...]`
// 例：fireball-2025;火舞台:03211200,03211400;球舞台:03221530
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
 */
export function encodePlanToText(planArray) {
  if (!planArray.length) return '';
  const festId = planArray[0].festivalId;
  /** @type {Record<string, string[]>} */
  const stages = {};
  for (const p of planArray) {
    if (!stages[p.stage]) stages[p.stage] = [];
    stages[p.stage].push(shortTime(new Date(p.start)));
  }
  const stageStrings = Object.entries(stages).map(([stage, times]) => `${stage}:${times.join(',')}`);
  return `${festId};${stageStrings.join(';')}`;
}

/**
 * @param {string} rawText
 * @param {Festival[]} festivals
 * @returns {{festival: Festival | null, plan: PlanEntry[], invalidCount: number}}
 */
export function decodePlanFromText(rawText, festivals) {
  const parts = rawText.split(';');
  const festId = parts[0];
  const festival = festivals.find((f) => f.festivalId === festId) || null;
  if (!festival) return { festival: null, plan: [], invalidCount: 0 };

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
  return { festival, plan, invalidCount };
}

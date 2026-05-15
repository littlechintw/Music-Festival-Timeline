// @ts-check
// 演出 ID 的單一公式：festivalId + stage + artist + start。
// 所有頁面、所有 store 都應該用這個。

/**
 * @param {{festivalId?: string}} festival
 * @param {{name?: string}} stage
 * @param {{artist?: string, start?: string}} perf
 * @returns {string}
 */
export function makePerfId(festival, stage, perf) {
  return [festival?.festivalId ?? '', stage?.name ?? '', perf?.artist ?? '', perf?.start ?? ''].join('_');
}

/**
 * 用「已扁平化」的 perf 物件還原 id（plan store 裡的格式）。
 *
 * @param {{festivalId?: string, stage?: string, artist?: string, start?: string, id?: string}} flatPerf
 * @returns {string}
 */
export function flatPerfId(flatPerf) {
  return flatPerf?.id || [
    flatPerf?.festivalId ?? '',
    flatPerf?.stage ?? '',
    flatPerf?.artist ?? '',
    flatPerf?.start ?? '',
  ].join('_');
}

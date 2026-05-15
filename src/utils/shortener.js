// @ts-check
// 短網址服務 (Google Apps Script web app) 設定。
//
// 預設 URL 寫死在這裡——這支 GAS 是公開部署 (Anyone)，沒有 secret，
// 寫進 git 沒有安全顧慮。
//
// 想換到備援部署 / 自架 server 時，在 .env.local 或 GitHub Actions secret 設
// `VITE_GAS_URL=...` 就會覆寫掉，不用改 code。

const DEFAULT_GAS_URL =
  'https://script.google.com/macros/s/AKfycbz3m78hNNwjK3Hj1I9WZuwzjLPxlVGqFoir4uhC6qkVhlWADHhumGexHDR9XoT5pM-7/exec';

/**
 * 取得目前要打的短網址 endpoint。
 * @returns {string}
 */
export function getShortenerUrl() {
  const override = import.meta?.env?.VITE_GAS_URL;
  if (typeof override === 'string' && override.trim()) return override.trim();
  return DEFAULT_GAS_URL;
}

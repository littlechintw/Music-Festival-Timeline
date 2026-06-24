// @ts-check
import { ARTIST_ALIASES } from '../data/artistAliases';

// 結尾的地區標籤：大寫 2~3 個字母包在 []、() 或全形（）裡，
// 例如 "milet [JP]"、"Se So Neon (KR)"、"While She Sleeps (UK)"。
// 限定大寫是為了避免誤刪像 "(live)" 這種非地區的括號。
const COUNTRY_TAG_RE = /\s*[[(（]\s*[A-Z]{2,3}\s*[)）\]]\s*$/;

/**
 * 去掉結尾地區標籤並收合空白。
 * @param {string} name
 */
export function stripCountryTag(name) {
  if (!name) return '';
  return String(name).replace(COUNTRY_TAG_RE, '').replace(/\s+/g, ' ').trim();
}

/**
 * 比對用的 key：去地區標籤 + 收合空白 + 轉小寫。
 * @param {string} name
 */
function aliasKey(name) {
  return stripCountryTag(name).toLowerCase();
}

// 反查表：任何別名（正規化後）→ canonical 顯示名稱。
const ALIAS_INDEX = (() => {
  /** @type {Map<string, string>} */
  const map = new Map();
  for (const group of ARTIST_ALIASES) {
    for (const n of [group.canonical, ...(group.aliases || [])]) {
      const k = aliasKey(n);
      if (k) map.set(k, group.canonical);
    }
  }
  return map;
})();

/**
 * 取得藝人的正式顯示名稱：合併別名、去地區標籤。
 * 找不到對應別名時，回傳去標籤後的乾淨名稱。
 *
 * @param {string} name
 * @returns {string}
 */
export function canonicalArtist(name) {
  const clean = stripCountryTag(name);
  return ALIAS_INDEX.get(clean.toLowerCase()) || clean;
}

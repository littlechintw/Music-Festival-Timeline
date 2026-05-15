// @ts-check
// 集中色彩決策。
// - 預設用 festival 提供的 primary 色當主題色
// - 對特定知名 festival 可硬編配色（小寫 id 比對）
// - 其他用名稱字串 hash 挑色（穩定）

const PALETTES = ['blue', 'purple', 'green', 'pink', 'indigo'];

const FESTIVAL_OVERRIDES = /** @type {Record<string, string>} */ ({
  'fireball-festival-2025': 'red',
  'megaport-festival-2026': 'orange',
});

/**
 * @param {string} name
 */
function hashName(name) {
  let h = 0;
  for (let i = 0; i < name.length; i++) {
    h = (h * 31 + name.charCodeAt(i)) >>> 0;
  }
  return h;
}

/**
 * @param {{festivalId?: string, name?: string} | null | undefined} festival
 */
export function festivalPalette(festival) {
  if (!festival) return PALETTES[0];
  const id = (festival.festivalId || '').toLowerCase();
  if (FESTIVAL_OVERRIDES[id]) return FESTIVAL_OVERRIDES[id];
  const key = festival.name || festival.festivalId || 'default';
  return PALETTES[hashName(key) % PALETTES.length];
}

/**
 * 從 festival.theme.primary 推出 CSS variable 套用值。
 * @param {{primary?: string, secondary?: string} | null | undefined} theme
 */
export function themeCssVars(theme) {
  /** @type {Record<string, string>} */
  const result = {};
  if (theme?.primary) result['--theme-primary'] = theme.primary;
  if (theme?.secondary) result['--theme-secondary'] = theme.secondary;
  return result;
}

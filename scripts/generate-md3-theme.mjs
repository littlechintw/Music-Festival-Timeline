// 從品牌色（現有 Tailwind theme.primary 預設值 #2563eb）產生一份 MD3 亮/暗色 token，
// 寫死成靜態 CSS（不在執行期動態產生），因為這個 App 不需要 Material You 那種
// 依裝置桌布動態換色的功能。改品牌色時手動重跑這支腳本即可：
//   node scripts/generate-md3-theme.mjs
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import {
  Hct,
  SchemeTonalSpot,
  MaterialDynamicColors,
  hexFromArgb,
  argbFromHex,
} from '@material/material-color-utilities';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_PATH = resolve(__dirname, '../src/assets/md3-tokens.css');

const SEED_COLOR = '#2563eb';

// @material/material-color-utilities@0.3.x 用 static 屬性（每個都是一個
// DynamicColor 實例）而不是 instance method，這裡明列 @material/web 元件
// 實際會吃的 token 名單（camelCase，會轉成 --md-sys-color-kebab-case）。
const TOKEN_NAMES = [
  'primary', 'onPrimary', 'primaryContainer', 'onPrimaryContainer',
  'primaryFixed', 'primaryFixedDim', 'onPrimaryFixed', 'onPrimaryFixedVariant',
  'inversePrimary',
  'secondary', 'onSecondary', 'secondaryContainer', 'onSecondaryContainer',
  'secondaryFixed', 'secondaryFixedDim', 'onSecondaryFixed', 'onSecondaryFixedVariant',
  'tertiary', 'onTertiary', 'tertiaryContainer', 'onTertiaryContainer',
  'tertiaryFixed', 'tertiaryFixedDim', 'onTertiaryFixed', 'onTertiaryFixedVariant',
  'error', 'onError', 'errorContainer', 'onErrorContainer',
  'background', 'onBackground',
  'surface', 'onSurface', 'surfaceVariant', 'onSurfaceVariant',
  'surfaceDim', 'surfaceBright',
  'surfaceContainerLowest', 'surfaceContainerLow', 'surfaceContainer',
  'surfaceContainerHigh', 'surfaceContainerHighest',
  'inverseSurface', 'inverseOnSurface',
  'outline', 'outlineVariant',
  'shadow', 'scrim', 'surfaceTint',
];

function camelToKebab(name) {
  return name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

function buildTokens(isDark) {
  const scheme = new SchemeTonalSpot(Hct.fromInt(argbFromHex(SEED_COLOR)), isDark, 0.0);
  const lines = [];
  for (const name of TOKEN_NAMES) {
    const dynamicColor = MaterialDynamicColors[name];
    const hex = hexFromArgb(dynamicColor.getArgb(scheme));
    lines.push(`  --md-sys-color-${camelToKebab(name)}: ${hex};`);
  }
  return lines.join('\n');
}

const css = `/* 由 scripts/generate-md3-theme.mjs 產生，請勿手動編輯。
   seed color: ${SEED_COLOR} */
:root {
${buildTokens(false)}
}
.dark {
${buildTokens(true)}
}
`;

writeFileSync(OUT_PATH, css, 'utf-8');
console.log(`[md3] wrote ${OUT_PATH}`);

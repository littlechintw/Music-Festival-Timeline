/**
 * generate-festival-index.mjs
 *
 * Build-time script: reads all festival JSONs from /festivals/,
 * computes a SHA-256 hash for each, extracts basic metadata, and writes:
 *   - public/festival-index.json  (hash index + basic info)
 *   - public/festivals/<id>.json  (individual festival JSON files for static serving)
 */

import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync, readdirSync, copyFileSync } from 'node:fs';
import { resolve, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');
const festivalsDir = resolve(rootDir, 'festivals');
const publicDir = resolve(rootDir, 'public');
const publicFestivalsDir = resolve(publicDir, 'festivals');

// Ensure output directories exist
mkdirSync(publicFestivalsDir, { recursive: true });

const files = readdirSync(festivalsDir).filter(f => f.endsWith('.json'));

const index = files.map(filename => {
  const filePath = resolve(festivalsDir, filename);
  const content = readFileSync(filePath, 'utf-8');
  const hash = createHash('sha256').update(content).digest('hex').slice(0, 16);
  const data = JSON.parse(content);

  // Copy individual festival JSON to public/festivals/
  copyFileSync(filePath, resolve(publicFestivalsDir, filename));

  return {
    eventid: data.festivalId,
    name: data.name,
    startTime: data.startTime,
    endTime: data.endTime,
    location: data.location,
    theme: data.theme,
    filename,
    filehash: hash,
  };
});

// Sort by startTime ascending
index.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

const outPath = resolve(publicDir, 'festival-index.json');
writeFileSync(outPath, JSON.stringify(index, null, 2));

console.log(`[festival-index] Generated ${index.length} entries → ${outPath}`);
index.forEach(e => console.log(`  ${e.eventid}  hash=${e.filehash}`));

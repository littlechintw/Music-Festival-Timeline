#!/usr/bin/env node
// @ts-check
// 用 Zod 驗證所有 festivals/*.json，過濾出進行中或即將開始的活動成 filtered-festivals.json。
// 也會更新 public/festivals/。
import { readdir, readFile, writeFile, mkdir, copyFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { festivalSchema } from '../src/pwa/schema.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SOURCE_DIR = resolve(__dirname, '../festivals');
const TARGET_DIR = resolve(__dirname, '../public/festivals');
const OUT_FILE = resolve(__dirname, '../filtered-festivals.json');

const STALE_WINDOW_MS = 3 * 24 * 60 * 60 * 1000;

async function main() {
  if (!existsSync(SOURCE_DIR)) {
    console.error(`Festival source not found: ${SOURCE_DIR}`);
    process.exit(1);
  }
  await mkdir(TARGET_DIR, { recursive: true });

  const now = Date.now();
  const files = (await readdir(SOURCE_DIR)).filter((f) => f.endsWith('.json'));
  const valid = [];
  let invalidCount = 0;

  for (const file of files) {
    const filePath = join(SOURCE_DIR, file);
    const raw = await readFile(filePath, 'utf-8');
    /** @type {unknown} */
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      console.error(`JSON parse failed: ${file}`, err);
      invalidCount++;
      continue;
    }
    const result = festivalSchema.safeParse(parsed);
    if (!result.success) {
      console.error(`Schema invalid: ${file}`);
      console.error(JSON.stringify(result.error.format(), null, 2));
      invalidCount++;
      continue;
    }
    const data = result.data;
    await copyFile(filePath, join(TARGET_DIR, file));

    const start = new Date(data.startTime).getTime();
    const end = new Date(data.endTime).getTime();
    if (start >= now || end >= now - STALE_WINDOW_MS) {
      valid.push(data);
    }
  }

  const index = valid.map((f) => ({
    festivalId: f.festivalId,
    name: f.name,
    startTime: f.startTime,
    endTime: f.endTime,
    file: `${f.festivalId}.json`,
  }));
  index.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  await writeFile(
    join(TARGET_DIR, 'index.json'),
    JSON.stringify({ version: 1, festivals: index }, null, 2)
  );
  await writeFile(OUT_FILE, JSON.stringify(valid, null, 2));

  console.log(`Validated ${files.length} files. Valid: ${valid.length}, Invalid: ${invalidCount}.`);
  if (invalidCount > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

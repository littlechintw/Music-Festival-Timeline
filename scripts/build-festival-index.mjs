#!/usr/bin/env node
// @ts-check
// 把 festivals/*.json 同步到 public/festivals/，並產出 index.json v2。
//
// index.json v2 新增的欄位：
//   - hash:    每個 JSON 內容的 SHA-256 前 12 碼。客戶端用它判斷是否需要重新下載。
//   - bytes:   檔案位元組大小，UI 顯示「這個活動要佔 4.2 MB 離線空間」。
//   - status:  'upcoming' 或 'archived'（end > now - STALE_DAYS）。
//              Workbox 只 precache upcoming 的；archived 走 runtime cache（user 手動存）。
//   - indexHash: 索引本身的 hash，作為 SW 對 index.json 的 precache revision。
//
import { readdir, readFile, writeFile, mkdir, copyFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SOURCE_DIR = resolve(__dirname, '../festivals');
const TARGET_DIR = resolve(__dirname, '../public/festivals');
const STALE_DAYS = 3;

/** @param {Buffer | string} buf */
function sha(buf) {
  return createHash('sha256').update(buf).digest('hex').slice(0, 12);
}

async function main() {
  if (!existsSync(SOURCE_DIR)) {
    console.error(`Festival source not found: ${SOURCE_DIR}`);
    process.exit(1);
  }
  await mkdir(TARGET_DIR, { recursive: true });

  const files = (await readdir(SOURCE_DIR)).filter((f) => f.endsWith('.json'));
  const now = Date.now();
  const cutoff = now - STALE_DAYS * 86400e3;

  /** @type {Array<{festivalId:string, name:string, startTime:string, endTime:string, file:string, hash:string, bytes:number, status:'upcoming'|'archived'}>} */
  const index = [];

  for (const file of files) {
    const src = join(SOURCE_DIR, file);
    const raw = await readFile(src);
    /** @type {{festivalId:string, name:string, startTime:string, endTime:string}} */
    const data = JSON.parse(raw.toString('utf-8'));

    await copyFile(src, join(TARGET_DIR, file));

    const endMs = new Date(data.endTime).getTime();
    const status = Number.isFinite(endMs) && endMs > cutoff ? 'upcoming' : 'archived';

    index.push({
      festivalId: data.festivalId,
      name: data.name,
      startTime: data.startTime,
      endTime: data.endTime,
      file,
      hash: sha(raw),
      bytes: raw.byteLength,
      status,
    });
  }

  index.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  // indexHash 算法：對 festivals 內容（不含 indexHash 與 generatedAt）做 hash，
  // 這樣同樣的活動資料每次 build 都會得到一樣的 indexHash —— 對 SW autoUpdate 比較友善。
  const indexBodyForHash = JSON.stringify({ version: 2, festivals: index });
  const indexHash = sha(indexBodyForHash);

  const final = {
    version: 2,
    generatedAt: new Date().toISOString(),
    indexHash,
    festivals: index,
  };

  await writeFile(join(TARGET_DIR, 'index.json'), JSON.stringify(final, null, 2));

  const upcoming = index.filter((f) => f.status === 'upcoming').length;
  console.log(
    `Built festival index (v2): ${index.length} total, ${upcoming} upcoming, ${index.length - upcoming} archived`
  );
  console.log(`indexHash=${indexHash}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

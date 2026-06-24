<template>
  <div class="max-w-2xl mx-auto p-4 text-gray-900 dark:text-gray-100 dark:[color-scheme:dark]">
    <h1 class="text-2xl font-bold mb-4">新增音樂祭</h1>

    <!-- 推薦做法說明 -->
    <div
      class="mb-4 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/30 p-4 text-sm text-gray-700 dark:text-gray-200"
    >
      <p class="font-bold mb-1 flex items-center gap-2">
        <span aria-hidden="true">🤖</span> 最快的方式：用 AI 讀時間表圖片
      </p>
      <p class="leading-relaxed">
        手動一場一場填很累。建議直接把音樂祭的<b>時間表／卡司圖片</b>，連同我們準備好的 Prompt
        一起貼給 ChatGPT、Claude 等支援圖片的 AI，它就會幫你產生符合格式的 JSON。產生後存成
        <span class="font-mono">.json</span> 檔，再依「如何新增音樂祭」送出 PR 即可；當然你也可以在下方手動填寫。
      </p>
    </div>

    <div class="mb-4 flex flex-wrap gap-2">
      <button
        type="button"
        class="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-600 text-white rounded font-medium shadow-sm inline-flex items-center gap-1"
        @click="showAiPrompt = true"
      >
        <span aria-hidden="true">🤖</span> 顯示 AI Prompt
      </button>
      <button
        type="button"
        class="px-3 py-1.5 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white rounded font-medium shadow-sm"
        @click="showGuide = true"
      >
        如何新增音樂祭
      </button>
    </div>

    <div class="mb-4">
      <label class="block font-bold mb-1">貢獻者（GitHub 帳號，可多人）</label>
      <div class="flex flex-wrap gap-2 mb-2">
        <span
          v-for="(c, idx) in festival.contributors"
          :key="c + '-' + idx"
          class="flex items-center bg-gray-200 dark:bg-gray-700 rounded px-2 py-1 text-sm"
        >
          <a
            :href="`https://github.com/${c}`"
            target="_blank"
            rel="noopener noreferrer"
            class="text-blue-600 dark:text-blue-300 hover:underline mr-1"
          >
            {{ c }}
          </a>
          <button
            type="button"
            class="ml-1 text-xs text-red-500 dark:text-red-400"
            @click="festival.contributors.splice(idx, 1)"
          >
            ✕
          </button>
        </span>
      </div>
      <div class="flex gap-2">
        <input
          v-model="newContributor"
          :class="[inputClass, 'flex-1']"
          placeholder="輸入 GitHub 帳號後按新增"
          @keyup.enter="addContributor"
        />
        <button
          type="button"
          class="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded"
          @click="addContributor"
        >
          新增
        </button>
      </div>
    </div>

    <form class="space-y-4" @submit.prevent="handleExport">
      <div>
        <label class="block font-bold mb-1"
          >音樂祭 ID <span class="text-red-500">*</span></label
        >
        <input
          v-model="festival.festivalId"
          :class="[inputClass, 'w-full']"
          required
          pattern="[a-z0-9-]+"
          @input="validateId"
        />
        <div class="text-xs mt-1 text-gray-500 dark:text-gray-400">
          僅限小寫英文、數字、-，建議格式如
          <span class="font-mono">taipei-music-{{ currentYear }}</span
          >，請包含年份避免重複。
        </div>
        <div v-if="idError" class="text-xs text-red-600 dark:text-red-400 mt-1">{{ idError }}</div>
      </div>

      <div>
        <label class="block font-bold mb-1">名稱 <span class="text-red-500">*</span></label>
        <input v-model="festival.name" :class="[inputClass, 'w-full']" required />
      </div>

      <div class="flex gap-2">
        <div class="flex-1">
          <label class="block font-bold mb-1"
            >開始時間 (UTC+8) <span class="text-red-500">*</span></label
          >
          <input
            :value="toLocalInput(festival.startTime)"
            type="datetime-local"
            :class="[inputClass, 'w-full']"
            required
            @input="festival.startTime = toIso($event.target.value)"
          />
        </div>
        <div class="flex-1">
          <label class="block font-bold mb-1"
            >結束時間 (UTC+8) <span class="text-red-500">*</span></label
          >
          <input
            :value="toLocalInput(festival.endTime)"
            type="datetime-local"
            :class="[inputClass, 'w-full']"
            required
            @input="festival.endTime = toIso($event.target.value)"
          />
        </div>
      </div>

      <div>
        <label class="block font-bold mb-1">主題色</label>
        <input
          v-model="festival.theme.primary"
          :class="[inputClass, 'mr-2']"
          placeholder="#主色"
        />
        <input
          v-model="festival.theme.secondary"
          :class="inputClass"
          placeholder="#副色"
        />
      </div>

      <div>
        <label class="block font-bold mb-1">地點名稱 <span class="text-red-500">*</span></label>
        <input
          v-model="festival.location.name"
          :class="[inputClass, 'w-full']"
          required
        />
      </div>
      <div>
        <label class="block font-bold mb-1">地點地址 <span class="text-red-500">*</span></label>
        <input
          v-model="festival.location.address"
          :class="[inputClass, 'w-full']"
          required
        />
      </div>
      <div class="flex gap-2">
        <div class="flex-1">
          <label class="block font-bold mb-1">緯度</label>
          <input
            v-model.number="festival.location.latitude"
            type="number"
            step="any"
            :class="[inputClass, 'w-full']"
          />
        </div>
        <div class="flex-1">
          <label class="block font-bold mb-1">經度</label>
          <input
            v-model.number="festival.location.longitude"
            type="number"
            step="any"
            :class="[inputClass, 'w-full']"
          />
        </div>
      </div>

      <div>
        <label class="block font-bold mb-1">地圖圖片（網址或上傳 PNG/JPG/WebP）</label>
        <input
          v-model="festival.map.image"
          :class="[inputClass, 'w-full', 'mb-2']"
          placeholder="可貼上網址或 base64"
        />
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          class="text-sm text-gray-600 dark:text-gray-300"
          @change="onMapUpload"
        />
      </div>

      <div class="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
        <div class="flex items-center mb-2">
          <span class="font-bold">舞台列表</span>
          <button
            type="button"
            class="ml-2 px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs"
            @click="addStage"
          >
            新增舞台
          </button>
        </div>
        <div
          v-for="(stage, sidx) in festival.stages"
          :key="stage.id || sidx"
          class="border border-gray-300 dark:border-gray-600 rounded p-2 mb-4"
        >
          <div class="flex items-center mb-2">
            <input
              v-model="stage.name"
              :class="[inputClass, 'flex-1']"
              placeholder="舞台名稱"
            />
            <button
              type="button"
              class="ml-2 px-2 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-xs"
              @click="removeStage(sidx)"
            >
              移除
            </button>
          </div>
          <div class="flex items-center mb-1">
            <span class="font-bold text-sm">表演</span>
            <button
              type="button"
              class="ml-2 px-2 py-1 bg-green-500 hover:bg-green-600 text-white rounded text-xs"
              @click="addPerformance(sidx)"
            >
              新增表演
            </button>
          </div>
          <div
            v-for="(perf, pidx) in stage.performances"
            :key="pidx"
            class="border-2 border-gray-300 dark:border-gray-600 rounded p-2 mb-2 bg-gray-50 dark:bg-gray-900/40"
          >
            <div class="flex gap-2 mb-2">
              <input
                v-model="perf.artist"
                :class="[inputClass, 'flex-1']"
                placeholder="演出者"
              />
              <input
                v-model="perf.description"
                :class="[inputClass, 'flex-1']"
                placeholder="備註"
              />
              <button
                type="button"
                class="px-2 py-1 bg-red-400 hover:bg-red-500 text-white rounded text-xs"
                @click="removePerformance(sidx, pidx)"
              >
                移除
              </button>
            </div>
            <div class="flex gap-2">
              <input
                :value="toLocalInput(perf.start)"
                type="datetime-local"
                :class="[inputClass, 'flex-1']"
                @input="perf.start = toIso($event.target.value)"
              />
              <input
                :value="toLocalInput(perf.end)"
                type="datetime-local"
                :class="[inputClass, 'flex-1']"
                @input="perf.end = toIso($event.target.value)"
              />
            </div>
          </div>
        </div>
      </div>

      <button
        type="submit"
        class="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded font-medium"
      >
        匯出 JSON
      </button>
      <div
        v-if="validationError"
        class="mt-2 text-red-600 dark:text-red-400 text-sm whitespace-pre-line"
      >
        {{ validationError }}
      </div>
    </form>

    <div v-if="jsonPreview" class="mt-6">
      <h2 class="font-bold mb-2">JSON 預覽</h2>
      <pre
        class="bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 p-3 rounded text-xs overflow-x-auto"
      >{{ jsonPreview }}</pre>
    </div>

    <!-- AI Prompt 彈窗 -->
    <div
      v-if="showAiPrompt"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      @click.self="showAiPrompt = false"
    >
      <div
        class="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg shadow-2xl max-w-lg w-full p-6 relative max-h-[90vh] overflow-y-auto"
      >
        <button
          class="absolute top-2 right-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          @click="showAiPrompt = false"
        >
          ✕
        </button>
        <h2 class="text-lg font-bold mb-2 flex items-center gap-2">
          <span aria-hidden="true">🤖</span> 用 AI 把時間表圖片變成 JSON
        </h2>
        <ol
          class="list-decimal pl-5 space-y-1.5 text-sm text-gray-700 dark:text-gray-200 mb-4"
        >
          <li>準備一張時間表圖片（官方卡司圖、時刻表截圖都可以）。</li>
          <li>按下方「複製 Prompt」。</li>
          <li>打開 ChatGPT、Claude 等支援圖片的 AI，貼上 Prompt <b>並附上那張圖片</b>。</li>
          <li>AI 會回傳一段 JSON，存成 <span class="font-mono">你的-festivalId.json</span>。</li>
          <li>依「如何新增音樂祭」把檔案放進 <span class="font-mono">festivals/</span> 送出 PR。</li>
        </ol>

        <div class="flex items-center justify-between mb-1">
          <span class="font-bold text-sm">Prompt（含範例 JSON 格式）</span>
          <button
            type="button"
            class="px-2 py-1 text-xs rounded bg-purple-600 hover:bg-purple-700 text-white"
            @click="copyToClipboard(aiPrompt, 'prompt')"
          >
            {{ copied === 'prompt' ? '已複製 ✓' : '複製 Prompt' }}
          </button>
        </div>
        <pre
          class="bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 p-3 rounded text-xs overflow-x-auto whitespace-pre-wrap max-h-[40vh]"
        >{{ aiPrompt }}</pre>
        <p class="text-xs text-gray-500 dark:text-gray-400 mt-2">
          小提醒：AI 偶爾會看錯時間或漏團，貼回來後請大致對一下；不確定的欄位（座標、主題色）留空即可。
        </p>

        <!-- 把 AI 產生的 JSON 貼回來匯入檢查 -->
        <div class="border-t border-gray-200 dark:border-gray-700 mt-4 pt-4">
          <p class="font-bold text-sm mb-2">產生好 JSON 了嗎？貼回來檢查</p>
          <div class="flex flex-wrap gap-2">
            <button
              type="button"
              class="px-3 py-1.5 text-sm rounded bg-blue-600 hover:bg-blue-700 text-white inline-flex items-center gap-1"
              @click="showPasteArea = !showPasteArea"
            >
              <span aria-hidden="true">📋</span> 貼上文字
            </button>
            <button
              type="button"
              class="px-3 py-1.5 text-sm rounded bg-blue-600 hover:bg-blue-700 text-white inline-flex items-center gap-1"
              @click="jsonFileInput?.click()"
            >
              <span aria-hidden="true">📄</span> 貼上 JSON 檔案
            </button>
            <input
              ref="jsonFileInput"
              type="file"
              accept="application/json,.json"
              class="hidden"
              @change="onJsonUpload"
            />
          </div>

          <div v-if="showPasteArea" class="mt-2">
            <textarea
              v-model="importText"
              rows="6"
              :class="[inputClass, 'w-full', 'font-mono', 'text-xs']"
              placeholder="把 AI 產生的 JSON 整段貼在這裡…"
            />
            <button
              type="button"
              class="mt-2 px-3 py-1.5 text-sm rounded bg-purple-600 hover:bg-purple-700 text-white"
              @click="applyImport(importText)"
            >
              匯入並檢查
            </button>
          </div>

          <div
            v-if="importMessage"
            class="mt-3 rounded-lg px-3 py-2 text-sm whitespace-pre-line"
            :class="{
              'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-200 border border-green-200 dark:border-green-800':
                importMessage.kind === 'success',
              'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-200 border border-amber-200 dark:border-amber-800':
                importMessage.kind === 'warn',
              'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-200 border border-red-200 dark:border-red-800':
                importMessage.kind === 'error',
            }"
          >
            {{ importMessage.text }}
          </div>
        </div>
      </div>
    </div>

    <!-- PR 教學彈窗 -->
    <div
      v-if="showGuide"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      @click.self="showGuide = false"
    >
      <div
        class="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg shadow-2xl max-w-md w-full p-6 relative"
      >
        <button
          class="absolute top-2 right-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          @click="showGuide = false"
        >
          ✕
        </button>
        <h2 class="text-lg font-bold mb-2">如何送出音樂祭 PR？</h2>
        <ol class="list-decimal pl-5 space-y-2 text-sm text-gray-700 dark:text-gray-200">
          <li>
            前往
            <a
              href="https://github.com/littlechintw/Music-Festival-Timeline"
              target="_blank"
              rel="noopener noreferrer"
              class="text-blue-600 dark:text-blue-300 underline"
              >littlechintw/Music-Festival-Timeline</a
            >
            並點選右上角 <b>Fork</b>，將專案複製到自己的 GitHub 帳號。
          </li>
          <li>
            在自己的 Fork 倉庫中，將剛剛匯出的 JSON 檔案放到
            <code>festivals/</code> 目錄下（build 時會自動同步到 <code>public/festivals/</code>），
            並 <b>Commit</b>（請填寫上方的提交說明）。
          </li>
          <li>
            回到 GitHub，點選 <b>Pull requests</b> → <b>New pull request</b>，選擇你的分支，送出
            PR。
          </li>
          <li>等待專案管理員審核通過，即可在主站看到你的音樂祭！</li>
        </ol>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue';
import { saveFestivalDraft, loadFestivalDraft, clearFestivalDraft } from './draft';
import { festivalSchema } from '../pwa/schema';

const currentYear = new Date().getFullYear();

// 表單輸入框共用樣式（含黑暗模式對比）
const inputClass =
  'border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded px-2 py-1';

const emptyFestival = () => ({
  festivalId: '',
  name: '',
  startTime: '',
  endTime: '',
  theme: { primary: '', secondary: '', generated: false },
  location: { name: '', address: '', latitude: 0, longitude: 0 },
  stages: [],
  map: { image: '', notes: [] },
  contributors: [],
});

const festival = reactive(emptyFestival());

// 這個專案的時間一律以 UTC+8 的「牆上時間」表示。
const TZ = '+08:00';

/**
 * ISO 字串（含時區）→ datetime-local 輸入框要的值（YYYY-MM-DDTHH:mm）。
 * 直接取字面上的年月日時分，不做時區換算，避免非 +08 使用者看到偏移的時間。
 * @param {string} iso
 */
function toLocalInput(iso) {
  if (!iso) return '';
  const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  return m ? `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}` : '';
}

/**
 * datetime-local 的值 → 補上秒數與 +08:00 的 ISO 字串。
 * @param {string} local
 */
function toIso(local) {
  if (!local) return '';
  const m = String(local).match(/^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/);
  if (!m) return local;
  return `${m[1]}T${m[2]}:${m[3]}:${m[4] || '00'}${TZ}`;
}

/**
 * 確保時間是含時區的 ISO；已經有時區就原樣保留，沒有才補 +08:00。
 * @param {string} v
 */
function ensureIso(v) {
  if (!v) return v;
  return /([+-]\d{2}:?\d{2}|Z)$/.test(v) ? v : toIso(v);
}

// 把整個 festival 的時間欄位都正規化成含時區的 ISO。
function normalizeTimes() {
  festival.startTime = ensureIso(festival.startTime);
  festival.endTime = ensureIso(festival.endTime);
  for (const stage of festival.stages || []) {
    for (const perf of stage.performances || []) {
      perf.start = ensureIso(perf.start);
      perf.end = ensureIso(perf.end);
    }
  }
}

const draft = loadFestivalDraft();
if (draft) Object.assign(festival, { ...emptyFestival(), ...draft });
// 舊草稿或匯入資料可能缺時區，先正規化一次。
normalizeTimes();

watch(festival, (val) => saveFestivalDraft(val), { deep: true });

const newContributor = ref('');
const showGuide = ref(false);
const showAiPrompt = ref(false);
const copied = ref('');
const idError = ref('');
const validationError = ref('');

// 匯入 AI 產生的 JSON
const showPasteArea = ref(false);
const importText = ref('');
const jsonFileInput = ref(null);
/** @type {import('vue').Ref<{kind: 'success'|'warn'|'error', text: string} | null>} */
const importMessage = ref(null);

// 給 AI 看的輕量範例 JSON（格式參考，1 個舞台 2 場演出）
const exampleJson = `{
  "festivalId": "example-fest-2026",
  "name": "範例音樂祭 Example Festival",
  "startTime": "2026-03-21T12:00:00+08:00",
  "endTime": "2026-03-21T22:00:00+08:00",
  "theme": { "primary": "#FF6600", "secondary": "#000000" },
  "location": { "name": "範例場地", "address": "台北市中正區…", "latitude": 0, "longitude": 0 },
  "stages": [
    {
      "id": "main-stage",
      "name": "主舞台",
      "performances": [
        { "artist": "藝人 A", "start": "2026-03-21T12:30:00+08:00", "end": "2026-03-21T13:10:00+08:00" },
        { "artist": "藝人 B", "start": "2026-03-21T13:40:00+08:00", "end": "2026-03-21T14:20:00+08:00" }
      ]
    }
  ],
  "contributors": []
}`;

const aiPrompt = `你是一個把「音樂祭時間表圖片」轉成 JSON 的助手。
我會附上一張時間表（卡司／時刻表）圖片，請讀出每個舞台、每位表演者與起訖時間，
輸出一份「只有 JSON、沒有任何其他文字」的結果，格式完全比照下面這個範例：

${exampleJson}

請遵守以下規則：
1. 時間一律用 ISO 8601 並帶 +08:00 時區，例如 2026-03-21T12:30:00+08:00。
2. festivalId 只能用小寫英文、數字與 -，且包含年份，例如 taipei-music-2026。
3. 每個 stage 都要有唯一的 id（小寫英文與 -）與 name；至少要有 1 個 stage。
4. 每位表演者一筆 performance，至少要有 artist、start、end。
5. 看不出來的欄位（座標 latitude/longitude、主題色、地址）就留空字串或 0，不要亂編。
6. 同一位表演者若圖片標了不同名稱（中英並列等），以圖片上最完整的寫法為準。
7. 最後「只回傳 JSON」，不要加任何說明文字或 markdown 的 \`\`\` 標記。`;

async function copyToClipboard(text, tag) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
    } else {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
    copied.value = tag;
    setTimeout(() => {
      if (copied.value === tag) copied.value = '';
    }, 2000);
  } catch {
    alert('複製失敗，請手動選取複製');
  }
}

/**
 * 把貼上的 JSON 文字載入表單，並用 schema 檢查格式是否正確。
 * @param {string} text
 */
function applyImport(text) {
  importMessage.value = null;
  const trimmed = (text || '').trim();
  if (!trimmed) {
    importMessage.value = { kind: 'error', text: '請先貼上 JSON 內容。' };
    return;
  }

  let parsed;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    importMessage.value = {
      kind: 'error',
      text: 'JSON 無法解析，請確認貼上的是完整、沒有多餘文字的 JSON。',
    };
    return;
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    importMessage.value = { kind: 'error', text: 'JSON 結構不正確，預期是一個音樂祭物件。' };
    return;
  }

  // 載入表單（巢狀物件也補上預設值，避免缺欄位）
  const base = emptyFestival();
  Object.assign(festival, base, parsed, {
    theme: { ...base.theme, ...(parsed.theme || {}) },
    location: { ...base.location, ...(parsed.location || {}) },
    map: { ...base.map, ...(parsed.map || {}) },
  });
  // 補上缺時區的時間，讓表格能顯示、匯出也合法。
  normalizeTimes();

  const result = festivalSchema.safeParse(festival);
  if (result.success) {
    importMessage.value = {
      kind: 'success',
      text: '匯入成功，格式正確！已載入下方表單與 JSON 預覽，可再微調後匯出。',
    };
  } else {
    importMessage.value = {
      kind: 'warn',
      text:
        '已載入，但有些欄位還需要修正：\n' +
        result.error.errors.map((err) => `• ${err.path.join('.')}: ${err.message}`).join('\n'),
    };
  }
}

function onJsonUpload(e) {
  const file = e.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (evt) => {
    showPasteArea.value = false;
    applyImport(String(evt.target?.result || ''));
  };
  reader.onerror = () => {
    importMessage.value = { kind: 'error', text: '讀取檔案失敗，請再試一次。' };
  };
  reader.readAsText(file);
  // 清掉 value，讓同一個檔案能再次選取觸發
  e.target.value = '';
}

function addContributor() {
  const val = newContributor.value.trim();
  if (!val) return;
  if (!festival.contributors) festival.contributors = [];
  if (!festival.contributors.includes(val)) festival.contributors.push(val);
  newContributor.value = '';
}

function validateId() {
  idError.value = /^[a-z0-9-]+$/.test(festival.festivalId)
    ? ''
    : 'ID 僅能包含小寫英文、數字與 -';
}

function slugify(input) {
  return (input || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function addStage() {
  const id = `stage-${festival.stages.length + 1}-${Math.random().toString(36).slice(2, 6)}`;
  festival.stages.push({ id, name: '', performances: [] });
}

function removeStage(idx) {
  festival.stages.splice(idx, 1);
}

function addPerformance(stageIdx) {
  festival.stages[stageIdx].performances.push({
    artist: '',
    start: '',
    end: '',
    description: '',
  });
}

function removePerformance(stageIdx, perfIdx) {
  festival.stages[stageIdx].performances.splice(perfIdx, 1);
}

const jsonPreview = computed(() => {
  try {
    return JSON.stringify(festival, null, 2);
  } catch {
    return '';
  }
});

function onMapUpload(e) {
  const file = e.target.files?.[0];
  if (!file) return;
  if (!/^image\/(png|jpeg|webp)$/.test(file.type)) {
    alert('只支援 PNG / JPEG / WebP 圖片');
    return;
  }
  const reader = new FileReader();
  reader.onload = (evt) => {
    festival.map.image = String(evt.target?.result || '');
  };
  reader.readAsDataURL(file);
}

async function handleExport() {
  validationError.value = '';
  normalizeTimes();
  // 自動補 stage id（schema 要求）
  for (const stage of festival.stages) {
    if (!stage.id) stage.id = slugify(stage.name) || `stage-${Math.random().toString(36).slice(2, 6)}`;
  }

  const result = festivalSchema.safeParse(festival);
  if (!result.success) {
    validationError.value = result.error.errors
      .map((err) => `${err.path.join('.')}: ${err.message}`)
      .join('\n');
    return;
  }

  const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = (festival.festivalId || 'festival') + '.json';
  a.click();
  URL.revokeObjectURL(url);
  clearFestivalDraft();
}
</script>

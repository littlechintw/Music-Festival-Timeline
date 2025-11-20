<template>
  <div class="max-w-2xl mx-auto p-4">
    <h1 class="text-2xl font-bold mb-4">新增音樂祭</h1>

  <!-- 教學彈窗按鈕 -->
  <button type="button" class="mb-4 px-3 py-1 bg-green-600 text-white rounded" @click="showGuide = true">如何新增音樂祭</button>


    <!-- 貢獻者 (GitHub 帳號) -->
    <div class="mb-4">
      <label class="block font-bold mb-1">貢獻者（GitHub 帳號，可多人）</label>
      <div class="flex flex-wrap gap-2 mb-2">
        <span v-for="(c, idx) in festival.contributors" :key="idx" class="flex items-center bg-gray-200 rounded px-2 py-1 text-sm">
          <a :href="`https://github.com/${c}`" target="_blank" class="text-blue-600 hover:underline mr-1">{{ c }}</a>
          <button type="button" @click="festival.contributors.splice(idx,1)" class="ml-1 text-xs text-red-500">✕</button>
        </span>
      </div>
      <div class="flex gap-2">
        <input v-model="newContributor" class="border rounded px-2 py-1 flex-1" placeholder="輸入 GitHub 帳號後按新增" @keyup.enter="addContributor" />
        <button type="button" @click="addContributor" class="px-3 py-1 bg-blue-500 text-white rounded">新增</button>
      </div>
    </div>

  <form @submit.prevent="handleExport" class="space-y-4">
      <div>
        <label class="block font-bold mb-1">音樂祭 ID <span class="text-red-500">*</span></label>
        <input v-model="festival.festivalId" class="border rounded px-2 py-1 w-full" required pattern="[a-z0-9\-]+" @input="validateId" />
        <div class="text-xs mt-1 text-gray-500">
          僅限小寫英文、數字、-，建議格式如 <span class="font-mono">taipei-music-{{ currentYear }}</span>，請包含年份避免重複。
        </div>
        <div v-if="idError" class="text-xs text-red-600 mt-1">{{ idError }}</div>
        <div v-if="idSyncMsg" class="text-xs text-blue-600 mt-1">{{ idSyncMsg }}</div>
      </div>
      <div>
        <label class="block font-bold mb-1">名稱 <span class="text-red-500">*</span></label>
        <input v-model="festival.name" class="border rounded px-2 py-1 w-full" required />
      </div>
      <div class="flex gap-2">
        <div class="flex-1">
          <label class="block font-bold mb-1">開始時間 (UTC+8) <span class="text-red-500">*</span></label>
          <input v-model="festival.startTime" type="datetime-local" class="border rounded px-2 py-1 w-full" required />
        </div>
        <div class="flex-1">
          <label class="block font-bold mb-1">結束時間 (UTC+8) <span class="text-red-500">*</span></label>
          <input v-model="festival.endTime" type="datetime-local" class="border rounded px-2 py-1 w-full" required />
        </div>
      </div>

      <div>
        <label class="block font-bold mb-1">主題色</label>
        <input v-model="festival.theme.primary" class="border rounded px-2 py-1 mr-2" placeholder="#主色" />
        <input v-model="festival.theme.secondary" class="border rounded px-2 py-1" placeholder="#副色" />
      </div>
      <div>
        <label class="block font-bold mb-1">地點名稱 <span class="text-red-500">*</span></label>
        <input v-model="festival.location.name" class="border rounded px-2 py-1 w-full" required />
      </div>
      <div>
        <label class="block font-bold mb-1">地點地址 <span class="text-red-500">*</span></label>
        <input v-model="festival.location.address" class="border rounded px-2 py-1 w-full" required />
      </div>
      <div class="flex gap-2">
        <div class="flex-1">
          <label class="block font-bold mb-1">緯度</label>
          <input v-model.number="festival.location.latitude" type="number" step="any" class="border rounded px-2 py-1 w-full" />
        </div>
        <div class="flex-1">
          <label class="block font-bold mb-1">經度</label>
          <input v-model.number="festival.location.longitude" type="number" step="any" class="border rounded px-2 py-1 w-full" />
        </div>
      </div>
      <div>
        <label class="block font-bold mb-1">地圖圖片（Base64 或網址）</label>
        <input v-model="festival.map.image" class="border rounded px-2 py-1 w-full mb-2" placeholder="可貼上網址或 base64" />
        <input type="file" accept="image/*" @change="onMapUpload" />
      </div>
      <div class="border-t pt-4 mt-4">
        <div class="flex items-center mb-2">
          <span class="font-bold">舞台列表</span>
          <button type="button" @click="addStage" class="ml-2 px-2 py-1 bg-blue-500 text-white rounded text-xs">新增舞台</button>
        </div>
        <div v-for="(stage, sidx) in festival.stages" :key="sidx" class="border rounded p-2 mb-4">
          <div class="flex items-center mb-2">
            <input v-model="stage.name" class="border rounded px-2 py-1 flex-1" placeholder="舞台名稱" />
            <button type="button" @click="removeStage(sidx)" class="ml-2 px-2 py-1 bg-red-500 text-white rounded text-xs">移除</button>
          </div>
          <div class="flex items-center mb-1">
            <span class="font-bold text-sm">表演</span>
            <button type="button" @click="addPerformance(sidx)" class="ml-2 px-2 py-1 bg-green-500 text-white rounded text-xs">新增表演</button>
          </div>
          <div v-for="(perf, pidx) in stage.performances" :key="pidx" class="border-2 border-gray-300 rounded p-2 mb-2 bg-gray-50">
            <div class="flex gap-2 mb-2">
              <input v-model="perf.artist" class="border rounded px-2 py-1 flex-1" placeholder="演出者" />
              <input v-model="perf.description" class="border rounded px-2 py-1 flex-1" placeholder="備註" />
              <button type="button" @click="removePerformance(sidx, pidx)" class="px-2 py-1 bg-red-400 text-white rounded text-xs">移除</button>
            </div>
            <div class="flex gap-2">
              <input v-model="perf.start" type="datetime-local" class="border rounded px-2 py-1 flex-1" placeholder="開始時間 (UTC+8)" />
              <input v-model="perf.end" type="datetime-local" class="border rounded px-2 py-1 flex-1" placeholder="結束時間 (UTC+8)" />
            </div>
          </div>
        </div>
      </div>
  <button type="submit" class="px-4 py-2 bg-blue-700 text-white rounded">匯出 JSON</button>
  <div v-if="validationError" class="mt-2 text-red-600 text-sm whitespace-pre-line">{{ validationError }}</div>
    </form>
  <div v-if="jsonPreview" class="mt-6">
      <h2 class="font-bold mb-2">JSON 預覽</h2>
      <pre class="bg-gray-100 p-2 rounded text-xs overflow-x-auto">{{ jsonPreview }}</pre>
    </div>
    <!-- 教學彈窗 -->
    <div v-if="showGuide" class="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg shadow-lg max-w-md w-full p-6 relative">
        <button class="absolute top-2 right-2 text-gray-400 hover:text-gray-700" @click="showGuide = false">✕</button>
        <h2 class="text-lg font-bold mb-2">如何送出音樂祭 PR？</h2>
        <ol class="list-decimal pl-5 space-y-2 text-sm">
          <li>前往 <a href="https://github.com/doggy8088/music_time" target="_blank" class="text-blue-600 underline">doggy8088/music_time</a> 並點選右上角 <b>Fork</b>，將專案複製到自己的 GitHub 帳號。</li>
          <li>在自己的 Fork 倉庫中，將剛剛匯出的 JSON 檔案放到 <code>/public/festivals/</code> 目錄下，並 <b>Commit</b>（請填寫上方的提交說明）。</li>
          <li>回到 GitHub，點選 <b>Pull requests</b> → <b>New pull request</b>，選擇你的分支，送出 PR。</li>
          <li>等待專案管理員審核通過，即可在主站看到你的音樂祭！</li>
        </ol>
        <div class="mt-4 text-xs text-gray-500">如有問題歡迎在 PR 留言或聯絡管理員。</div>
      </div>
    </div>
  </div>
</template>
<script setup>
import { saveFestivalDraft, loadFestivalDraft, clearFestivalDraft } from './draft';
import { festivalSchema } from '../pwa/schema';
// 欄位驗證錯誤
const validationError = ref('');

// 上傳地圖圖片
function onMapUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = evt => {
    festival.map.image = evt.target.result;
  };
  reader.readAsDataURL(file);
}
const currentYear = new Date().getFullYear();
const idError = ref('');
const idSyncMsg = ref('');

// 貢獻者欄位
const newContributor = ref('');
function addContributor() {
  const val = newContributor.value.trim();
  if (val && !festival.contributors?.includes(val)) {
    if (!festival.contributors) festival.contributors = [];
    festival.contributors.push(val);
  }
  newContributor.value = '';
}
const showGuide = ref(false);

function validateId() {
  const val = festival.festivalId;
  if (!/^[a-z0-9\-]+$/.test(val)) {
    idError.value = 'ID 僅能包含小寫英文、數字與 -';
  } else {
    idError.value = '';
  }
  // 檢查同步（與現有 JSON 比對，這裡僅示範，實際可串接 API 或 local list）
  // 範例：如有重複可提示
  // idSyncMsg.value = '';
  // if (existingIds.includes(val)) idSyncMsg.value = '此 ID 已存在，請換一個';
}
import { ref, reactive, computed, watch } from 'vue';

const emptyFestival = () => ({
  festivalId: '',
  name: '',
  startTime: '',
  endTime: '',
  theme: { primary: '', secondary: '', generated: false },
  location: { name: '', address: '', latitude: 0, longitude: 0 },
  stages: [],
  map: { image: '', notes: [] },
});

const festival = reactive(emptyFestival());

// 嘗試載入 localStorage 草稿
const draft = loadFestivalDraft();
if (draft) {
  Object.assign(festival, draft);
}

// 自動儲存草稿
watch(
  festival,
  (val) => {
    saveFestivalDraft(val);
  },
  { deep: true }
);

function addStage() {
  festival.stages.push({ id: '', name: '', performances: [] });
}
function removeStage(idx) {
  festival.stages.splice(idx, 1);
}
function addPerformance(stageIdx) {
  festival.stages[stageIdx].performances.push({ artist: '', start: '', end: '', description: '' });
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


async function handleExport() {
  // 驗證 schema
  try {
    validationError.value = '';
    await festivalSchema.parseAsync(festival);
  } catch (e) {
    if (e.errors) {
      validationError.value = e.errors.map(err => err.path.join('.') + ': ' + err.message).join('\n');
    } else {
      validationError.value = e.message || '未知錯誤';
    }
    return;
  }
  // 匯出 JSON
  const blob = new Blob([JSON.stringify(festival, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = (festival.festivalId || 'festival') + '.json';
  a.click();
  URL.revokeObjectURL(url);
  clearFestivalDraft();
}
</script>

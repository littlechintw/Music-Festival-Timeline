<template>
  <div class="p-4 max-w-3xl mx-auto">
    <h2 class="text-xl font-bold mb-4">全日多舞台時間軸</h2>
    <div v-if="!festival">找不到音樂祭</div>
    <div v-else>
      <div class="overflow-x-auto">
        <table class="min-w-full border">
          <thead>
            <tr>
              <th class="border px-2 py-1">舞台</th>
              <th class="border px-2 py-1">演出</th>
              <th class="border px-2 py-1">開始</th>
              <th class="border px-2 py-1">結束</th>
              <th class="border px-2 py-1">衝突</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in timelineRows" :key="row.key" :class="row.conflict ? 'bg-red-100' : ''">
              <td class="border px-2 py-1">{{ row.stage }}</td>
              <td class="border px-2 py-1">{{ row.artist }}</td>
              <td class="border px-2 py-1">{{ row.start }}</td>
              <td class="border px-2 py-1">{{ row.end }}</td>
              <td class="border px-2 py-1 text-red-600">
                <span v-if="row.conflict">⚠️ 與 {{ row.conflictWith.join('、') }} 衝突</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useFestivalStore } from '../stores/festival';

const route = useRoute();
const store = useFestivalStore();

const festival = computed(() => {
  const id = route.params.id;
  return (store.getFestivals || []).find(f => f.festivalId === id);
});

function toTimeString(str) {
  const d = new Date(str);
  return d.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });
}

const timelineRows = computed(() => {
  if (!festival.value) return [];
  const rows = [];
  const all = [];
  for (const stage of festival.value.stages) {
    for (const perf of stage.performances) {
      all.push({
        key: stage.id + perf.artist + perf.start,
        stage: stage.name,
        artist: perf.artist,
        start: toTimeString(perf.start),
        end: toTimeString(perf.end),
        rawStart: new Date(perf.start),
        rawEnd: new Date(perf.end),
        stageId: stage.id,
      });
    }
  }
  // 檢查衝突，並標明與誰衝突
  for (const row of all) {
    const conflicts = all.filter(other =>
      other !== row &&
      row.stageId !== other.stageId &&
      ((row.rawStart < other.rawEnd && row.rawEnd > other.rawStart))
    );
    row.conflict = conflicts.length > 0;
    row.conflictWith = conflicts.map(c => c.artist + '（' + c.stage + '）');
    rows.push(row);
  }
  return rows;
});
</script>

<style scoped>
</style>

<template>
  <div>
    <div class="text-center mb-4">
      <MdIcon name="festival" class="mb-2" style="--md-icon-size: 3rem" />
      <h2 class="text-xl font-bold text-gray-800 dark:text-gray-100 mb-1">收到分享的行程！</h2>
      <p class="text-gray-600 dark:text-gray-300">
        來自「<span class="font-bold text-[var(--md-sys-color-primary)]">{{ festival.name }}</span
        >」的行程，共 {{ plan.length }} 場演出
      </p>
    </div>

    <div
      class="flex items-center justify-center gap-4 text-xs text-[var(--md-sys-color-on-surface-variant)] mb-3"
    >
      <span class="flex items-center gap-1">
        <span class="w-3 h-3 rounded-sm bg-[var(--md-sys-color-primary)] inline-block"></span>
        朋友已選擇
      </span>
      <span class="flex items-center gap-1">
        <span
          class="w-3 h-3 rounded-sm bg-[var(--md-sys-color-surface-container-high)] inline-block"
        ></span>
        未選擇
      </span>
    </div>

    <div v-if="festivalDays.length > 1" class="flex gap-2 mb-4 overflow-x-auto pb-2">
      <button
        v-for="day in festivalDays"
        :key="day.dateKey"
        type="button"
        class="px-3 py-1 rounded border text-sm whitespace-nowrap flex-shrink-0 transition-colors"
        :class="
          selectedDay === day.dateKey
            ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] border-[var(--md-sys-color-primary)]'
            : 'bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-primary)] border-[var(--md-sys-color-outline)] hover:bg-[var(--md-sys-color-surface-container-high)]'
        "
        @click="selectedDay = day.dateKey"
      >
        {{ day.label }}
      </button>
    </div>

    <div
      class="mobile-scroll-hint md:hidden bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)] text-sm px-3 py-2 rounded-lg mb-4 flex items-center gap-2"
    >
      <MdIcon name="arrow_forward" style="--md-icon-size: 16px" />
      左右滑動查看所有舞台
    </div>

    <TimelineGrid
      :stages="stagesForGrid"
      :performances="performancesForDay"
      :is24-hour="settingsStore.is24Hour"
      :perf-class-resolver="resolvePerfClass"
    />

    <div class="max-w-sm mx-auto mt-6">
      <div v-if="!showSaveForm" class="flex flex-col gap-3">
        <p class="text-[var(--md-sys-color-error)] text-sm font-medium text-center">
          注意：「取代目前行程」將會覆蓋您原本的行程！
        </p>
        <md-filled-button type="button" class="w-full" @click="handleReplace">
          <MdIcon name="sync" slot="icon" />
          取代目前行程
        </md-filled-button>
        <md-outlined-button type="button" class="w-full" @click="showSaveForm = true">
          <MdIcon name="bookmark_add" slot="icon" />
          另存為新行程
        </md-outlined-button>
        <button
          type="button"
          class="text-sm text-[var(--md-sys-color-on-surface-variant)] hover:underline text-center mt-1"
          @click="$emit('cancel')"
        >
          不要，回到首頁
        </button>
      </div>

      <div v-else class="flex flex-col gap-3 text-left">
        <label class="block font-bold text-sm text-gray-700 dark:text-gray-200">行程名稱</label>
        <md-outlined-text-field
          class="w-full"
          :value="saveName"
          @input="(e) => (saveName = e.target.value)"
        ></md-outlined-text-field>
        <p class="text-xs text-[var(--md-sys-color-on-surface-variant)] flex items-center gap-1">
          <MdIcon name="info" style="--md-icon-size: 14px" />
          只會存在這台裝置的瀏覽器裡，不會同步到雲端或其他裝置。
        </p>
        <div class="flex gap-3">
          <md-outlined-button type="button" class="flex-1" @click="showSaveForm = false">
            取消
          </md-outlined-button>
          <md-filled-button type="button" class="flex-1" @click="handleSave"> 儲存 </md-filled-button>
        </div>
      </div>
    </div>

    <BaseModal :model-value="!!invalidMessage" @update:model-value="invalidMessage = ''">
      <template #headline>
        <div class="flex items-center gap-2">
          <MdIcon name="warning" class="text-[var(--md-sys-color-error)]" />
          部分行程失效
        </div>
      </template>
      <p class="text-gray-600 dark:text-gray-300 text-left leading-relaxed">
        {{ invalidMessage }}
      </p>
      <template #actions>
        <md-filled-button type="button" @click="invalidMessage = ''">我知道了</md-filled-button>
      </template>
    </BaseModal>

    <BaseModal :model-value="showSuccessModal" @update:model-value="finishSuccess">
      <template #headline>{{ successKind === 'save' ? '已儲存！' : '匯入成功！' }}</template>
      <div class="text-center">
        <MdIcon
          name="check_circle"
          class="text-[var(--md-sys-color-primary)] mb-2"
          style="--md-icon-size: 3rem"
        />
        <p class="text-gray-600 dark:text-gray-300">
          {{
            successKind === 'save'
              ? '行程已另存，可以在「行程」頁面的已儲存清單中查看。'
              : '您的行程已成功更新'
          }}
        </p>
      </div>
      <template #actions>
        <md-filled-button type="button" @click="finishSuccess">前往我的行程</md-filled-button>
      </template>
    </BaseModal>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { usePlanStore } from '../stores/plan';
import { useSavedPlansStore } from '../stores/savedPlans';
import { useSettingsStore } from '../stores/settings';
import { makePerfId } from '../utils/perfId';
import { WEEKDAYS_ZH } from '../utils/format';
import BaseModal from './BaseModal.vue';
import MdIcon from './MdIcon.vue';
import TimelineGrid from './TimelineGrid.vue';

const props = defineProps({
  festival: { type: Object, required: true },
  plan: { type: Array, required: true },
  invalidCount: { type: Number, default: 0 },
});

const emit = defineEmits(['cancel', 'imported']);

const planStore = usePlanStore();
const savedPlansStore = useSavedPlansStore();
const settingsStore = useSettingsStore();

const showSuccessModal = ref(false);
const successKind = ref('replace');
const showSaveForm = ref(false);
const saveName = ref(formatDefaultSaveName(new Date(), props.festival.name));
const selectedDay = ref(new Date(props.plan[0]?.start).toDateString());
const invalidMessage = ref(
  props.invalidCount > 0 ? `有 ${props.invalidCount} 個行程已經失效，僅會匯入部分有效行程` : ''
);

const sharedIds = computed(() => new Set(props.plan.map((p) => p.id || '')));

const festivalDays = computed(() => {
  const set = new Set();
  for (const stage of props.festival.stages) {
    for (const perf of stage.performances) {
      set.add(new Date(perf.start).toDateString());
    }
  }
  return Array.from(set)
    .map((dateKey) => {
      const date = new Date(dateKey);
      return {
        dateKey,
        label: `${date.toLocaleDateString('zh-TW', { month: 'long', day: 'numeric' })} (${WEEKDAYS_ZH[date.getDay()]})`,
        date,
      };
    })
    .sort((a, b) => a.date.getTime() - b.date.getTime());
});

const stagesForGrid = computed(() => props.festival.stages.map((s) => ({ name: s.name, key: s.id })));

const performancesForDay = computed(() => {
  if (!selectedDay.value) return [];
  const result = [];
  for (const stage of props.festival.stages) {
    for (const perf of stage.performances) {
      if (new Date(perf.start).toDateString() !== selectedDay.value) continue;
      result.push({ ...perf, stage: stage.name, _stage: stage });
    }
  }
  return result;
});

function isShared(perf) {
  const id = makePerfId(props.festival, perf._stage || { name: perf.stage }, perf);
  return sharedIds.value.has(id);
}

function resolvePerfClass(perf) {
  return isShared(perf)
    ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] font-medium'
    : 'bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)] opacity-60 pointer-events-none';
}

function formatDefaultSaveName(date, name) {
  const pad = (n) => String(n).padStart(2, '0');
  const y = date.getFullYear();
  const mo = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  const h = pad(date.getHours());
  const mi = pad(date.getMinutes());
  const s = pad(date.getSeconds());
  return `${y}/${mo}/${d} ${h}:${mi}:${s} ${name}`;
}

function handleReplace() {
  planStore.replacePlan(props.plan);
  successKind.value = 'replace';
  showSuccessModal.value = true;
}

function handleSave() {
  const name = saveName.value.trim() || formatDefaultSaveName(new Date(), props.festival.name);
  savedPlansStore.addSavedPlan({
    name,
    festivalId: props.festival.festivalId,
    festivalName: props.festival.name,
    performances: props.plan,
  });
  showSaveForm.value = false;
  successKind.value = 'save';
  showSuccessModal.value = true;
}

function finishSuccess() {
  showSuccessModal.value = false;
  emit('imported');
}
</script>

<style scoped>
@media (max-width: 768px) {
  .mobile-scroll-hint {
    animation: slideIn 0.3s ease-out;
  }
  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
}
</style>

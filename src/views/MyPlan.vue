<template>
  <div class="p-4 max-w-3xl mx-auto relative">
    <h1 class="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">我的行程</h1>

    <!-- 朋友的分享：掃描離線分享 + 已儲存的分享行程，合併成一個預設收合的區塊 -->
    <div class="bg-[var(--md-sys-color-surface-container)] rounded-xl px-6 mb-6">
      <AccordionSection :title="savedPlansTitle">
        <template #icon><MdIcon name="bookmark" /></template>

        <div class="pb-4 mb-4 border-b border-gray-100 dark:border-gray-700">
          <md-outlined-button type="button" @click="showScanModal = true">
            <MdIcon name="qr_code_scanner" slot="icon" />
            掃描離線分享
          </md-outlined-button>
          <p class="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-1.5">
            朋友沒有網路嗎？請他分享時選「離線分享」產生 QR Code，這裡掃描即可讀取，雙方都不需要連網路。
          </p>
        </div>

        <p
          class="text-xs text-[var(--md-sys-color-on-surface-variant)] mb-3 flex items-center gap-1"
        >
          <MdIcon name="info" style="--md-icon-size: 14px" />
          已儲存的行程只存在這台裝置的瀏覽器裡，不會同步到雲端或其他裝置。
        </p>
        <div v-if="savedPlans.length === 0" class="text-sm text-gray-400 py-2">
          收到朋友分享的行程連結或掃描 QR Code 時，可以另存成一份獨立命名的行程，之後會列在這裡。
        </div>
        <ul v-else class="divide-y divide-gray-100 dark:divide-gray-700 -mt-1">
          <li
            v-for="savedPlan in savedPlans"
            :key="savedPlan.id"
            class="py-3 flex items-start justify-between gap-3"
          >
            <div
              class="min-w-0 flex-1 cursor-pointer"
              role="button"
              tabindex="0"
              @click="onViewSavedPlan(savedPlan)"
              @keyup.enter="onViewSavedPlan(savedPlan)"
            >
              <div class="font-medium text-gray-800 dark:text-gray-200 truncate">
                {{ savedPlan.name }}
              </div>
              <div
                class="text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex flex-wrap gap-x-3 gap-y-1"
              >
                <span>{{ savedPlan.festivalName }}</span>
                <span>{{ savedPlan.performances.length }} 場</span>
                <span>存於 {{ formatDayLabel(savedPlan.savedAt) }}</span>
              </div>
            </div>
            <div class="flex gap-2 items-center shrink-0">
              <button
                type="button"
                class="px-3 py-1 text-xs rounded border border-[var(--md-sys-color-outline)] text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)]"
                @click="onViewSavedPlan(savedPlan)"
              >
                檢視
              </button>
              <button
                type="button"
                class="px-3 py-1 text-xs rounded bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)]"
                @click="onApplySavedPlan(savedPlan)"
              >
                套用
              </button>
              <button
                type="button"
                class="px-3 py-1 text-xs rounded border border-[var(--md-sys-color-outline)] text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)]"
                @click="onRemoveSavedPlan(savedPlan)"
              >
                刪除
              </button>
            </div>
          </li>
        </ul>
      </AccordionSection>
    </div>

    <!-- 檢視已儲存的分享行程 -->
    <BaseModal :model-value="!!viewingSavedPlan" @update:model-value="closeViewSavedPlan">
      <template #headline>{{ viewingSavedPlan?.name }}</template>
      <div v-if="viewingSavedPlan">
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-3">
          {{ viewingSavedPlan.festivalName }} • {{ viewingSavedPlan.performances.length }} 場演出
        </p>
        <div v-if="viewingDays.length > 1" class="flex gap-2 mb-3 overflow-x-auto pb-1">
          <button
            v-for="day in viewingDays"
            :key="day.dateKey"
            type="button"
            class="px-3 py-1 rounded text-sm whitespace-nowrap flex-shrink-0 transition-colors"
            :class="
              viewingSelectedDay === day.dateKey
                ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)]'
                : 'bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-highest)]'
            "
            @click="viewingSelectedDay = day.dateKey"
          >
            {{ day.label }}
          </button>
        </div>
        <TimelineGrid
          :stages="viewingStages"
          :performances="viewingPerformances"
          :is24-hour="settingsStore.is24Hour"
        />
      </div>
      <template #actions>
        <md-text-button type="button" @click="closeViewSavedPlan">關閉</md-text-button>
        <md-filled-button type="button" @click="onApplyFromView">套用此行程</md-filled-button>
      </template>
    </BaseModal>

    <ScanOfflineShareModal v-if="showScanModal" @close="showScanModal = false" />

    <div
      v-if="plan.length === 0"
      class="flex flex-col items-center justify-center text-center py-12 px-4"
    >
      <MdIcon name="music_note" class="mb-4" style="--md-icon-size: 3rem" />
      <h2 class="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">還沒有行程</h2>
      <p class="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-xs">
        去音樂祭列表挑幾場喜歡的演出加入吧！你的行程會自動快取，現場沒網路也能查。
      </p>
      <router-link to="/">
        <md-filled-button type="button">
          瀏覽音樂祭
          <MdIcon name="arrow_forward" slot="icon" />
        </md-filled-button>
      </router-link>
    </div>

    <div v-else>
      <NextUpCard :plan="plan" :now="now" :is24-hour="settingsStore.is24Hour" />
      <!-- 統計卡 -->
      <div
        class="relative bg-[var(--md-sys-color-surface-container)] rounded-xl p-6 mb-6 text-gray-800 dark:text-gray-100"
      >
        <md-elevation style="--md-elevation-level: 1"></md-elevation>

        <div
          class="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-[var(--md-sys-color-on-surface-variant)] mb-4"
        >
          <span
            ><strong class="text-[var(--md-sys-color-on-surface)]">{{ plan.length }}</strong>
            場演出</span
          >
          <span aria-hidden="true" class="opacity-40">•</span>
          <span
            ><strong class="text-[var(--md-sys-color-on-surface)]">{{ planDays.length }}</strong>
            天行程</span
          >
          <span aria-hidden="true" class="opacity-40">•</span>
          <span
            ><strong class="text-[var(--md-sys-color-on-surface)]">{{
              uniqueFestivals.length
            }}</strong>
            個音樂祭</span
          >
        </div>

        <div class="flex flex-wrap gap-2">
          <md-outlined-button type="button" :disabled="isSharing" @click="openShareModal">
            <span
              v-if="isSharing"
              slot="icon"
              class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"
            />
            <MdIcon v-else name="ios_share" slot="icon" />
            {{ shareButtonLabel }}
          </md-outlined-button>
          <md-outlined-button type="button" @click="showExportImageModal = true">
            <MdIcon name="photo_camera" slot="icon" />
            匯出行程圖
          </md-outlined-button>
          <md-outlined-button type="button" @click="addToCalendar">
            <MdIcon name="event" slot="icon" />
            加入行事曆
          </md-outlined-button>
        </div>
      </div>

      <!-- 日期 tabs -->
      <div
        v-if="planDays.length > 1 || pastDays.length"
        class="flex gap-2 mb-6 overflow-x-auto pb-2 items-center"
      >
        <button
          v-for="day in upcomingDays"
          :key="day.dateKey"
          class="px-4 py-2 rounded-lg text-sm whitespace-nowrap flex-shrink-0 transition-all font-medium flex items-center gap-2"
          :class="
            selectedPlanDay === day.dateKey
              ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)]'
              : 'bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-primary)] border border-[var(--md-sys-color-outline)] hover:bg-[var(--md-sys-color-surface-container-high)]'
          "
          @click="selectedPlanDay = day.dateKey"
        >
          <span>{{ day.label }}</span>
          <span
            class="inline-flex items-center justify-center text-xs font-bold min-w-[1.25rem] h-5 px-1 rounded-full"
            :class="
              selectedPlanDay === day.dateKey
                ? 'text-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-surface)]'
                : 'text-[var(--md-sys-color-on-primary)] bg-[var(--md-sys-color-primary)]'
            "
          >
            {{ day.count }}
          </span>
        </button>

        <!-- 過往活動切換 -->
        <button
          v-if="pastDays.length"
          type="button"
          class="px-4 py-2 rounded-lg text-sm whitespace-nowrap flex-shrink-0 transition-all font-medium flex items-center gap-2 border border-dashed border-[var(--md-sys-color-outline)] text-[var(--md-sys-color-on-surface-variant)] bg-[var(--md-sys-color-surface-container-low)] hover:bg-[var(--md-sys-color-surface-container-high)]"
          @click="showPast = !showPast"
        >
          <span>過往活動</span>
          <span
            class="inline-flex items-center justify-center text-xs font-bold min-w-[1.25rem] h-5 px-1 rounded-full text-[var(--md-sys-color-on-surface-variant)] bg-[var(--md-sys-color-surface-container-highest)]"
          >
            {{ pastDays.length }}
          </span>
          <MdIcon
            :name="showPast ? 'keyboard_arrow_up' : 'keyboard_arrow_down'"
            style="--md-icon-size: 16px"
          />
        </button>

        <!-- 過往活動日期 -->
        <template v-if="showPast">
          <button
            v-for="day in pastDays"
            :key="day.dateKey"
            class="px-4 py-2 rounded-lg text-sm whitespace-nowrap flex-shrink-0 transition-all font-medium flex items-center gap-2"
            :class="
              selectedPlanDay === day.dateKey
                ? 'bg-[var(--md-sys-color-secondary)] text-[var(--md-sys-color-on-secondary)]'
                : 'bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface-variant)] border border-[var(--md-sys-color-outline-variant)] hover:bg-[var(--md-sys-color-surface-container-high)]'
            "
            @click="selectedPlanDay = day.dateKey"
          >
            <span>{{ day.label }}</span>
            <span
              class="inline-flex items-center justify-center text-xs font-bold min-w-[1.25rem] h-5 px-1 rounded-full"
              :class="
                selectedPlanDay === day.dateKey
                  ? 'text-[var(--md-sys-color-secondary)] bg-[var(--md-sys-color-surface)]'
                  : 'text-[var(--md-sys-color-on-surface-variant)] bg-[var(--md-sys-color-surface-container-highest)]'
              "
            >
              {{ day.count }}
            </span>
          </button>
        </template>
      </div>

      <!-- 單日時間軸 -->
      <div
        v-for="day in planDays"
        v-show="selectedPlanDay === day.dateKey"
        :key="day.dateKey"
        class="relative bg-[var(--md-sys-color-surface-container)] rounded-xl overflow-hidden"
      >
        <md-elevation style="--md-elevation-level: 1"></md-elevation>
        <div
          class="bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] px-6 py-6"
        >
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-2xl font-bold">{{ day.label }}</h3>
              <p class="mt-1 opacity-90">
                {{ day.count }} 場演出 • {{ day.festivalNames.join('、') }}
              </p>
            </div>
            <div class="flex flex-col items-end gap-2">
              <div v-if="day.isToday" class="text-right">
                <div class="text-[var(--md-sys-color-tertiary-container)] text-sm font-medium">
                  今天
                </div>
                <div class="opacity-90 text-xs">{{ formatTime(now, settingsStore.is24Hour) }}</div>
              </div>
              <div
                v-if="dayFestivalsWithMap(day).length > 0"
                class="flex flex-wrap gap-1 justify-end"
              >
                <button
                  v-for="fest in dayFestivalsWithMap(day)"
                  :key="fest.id"
                  class="text-xs bg-white bg-opacity-20 hover:bg-opacity-30 rounded px-2 py-1 transition-colors flex items-center gap-1"
                  @click="goToMap(fest.id)"
                >
                  <MdIcon name="location_on" style="--md-icon-size: 14px" />
                  {{ dayFestivalsWithMap(day).length > 1 ? fest.name + ' ' : '' }}場地地圖
                </button>
              </div>
            </div>
          </div>
        </div>

        <TimelineGrid
          :stages="day.stages.map((s) => ({ name: s }))"
          :performances="day.performances"
          :is24-hour="settingsStore.is24Hour"
          :show-current-time="day.isToday"
          :now="now"
          :detect-conflicts="true"
        />
      </div>
    </div>

    <!-- 分享 Modal -->
    <BaseModal v-model="showShareModal">
      <template v-if="!hasShareResult" #headline>選擇要分享的音樂祭</template>
      <template v-else-if="shareMode === 'cloud'" #headline>網址產生成功！</template>
      <template v-else #headline>QR Code 已產生！</template>

      <div class="relative">
        <div
          v-if="isSharing"
          class="absolute inset-0 bg-white/90 dark:bg-gray-800/90 rounded-xl flex flex-col items-center justify-center z-10"
        >
          <div
            class="w-12 h-12 border-4 border-purple-200 dark:border-purple-800 border-t-purple-600 rounded-full animate-spin mb-4"
          />
          <h3 class="text-lg font-bold text-gray-800 dark:text-gray-100">請稍候...</h3>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">
            {{ shareMode === 'cloud' ? '正在產生分享網址' : '正在產生 QR Code' }}
          </p>
        </div>

        <template v-if="!hasShareResult">
          <div
            class="flex items-center gap-2 bg-[var(--md-sys-color-surface-container-high)] p-1 rounded-lg mb-2"
          >
            <button
              type="button"
              class="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
              :class="shareModeBtn(shareMode === 'cloud')"
              @click="shareMode = 'cloud'"
            >
              <MdIcon name="cloud" style="--md-icon-size: 16px" />
              雲端分享
            </button>
            <button
              type="button"
              class="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
              :class="shareModeBtn(shareMode === 'offline')"
              @click="shareMode = 'offline'"
            >
              <MdIcon name="qr_code" style="--md-icon-size: 16px" />
              離線分享
            </button>
          </div>
          <p class="text-xs text-[var(--md-sys-color-on-surface-variant)] mb-4">
            {{
              shareMode === 'cloud'
                ? '雙方都需要連網路。產生一個短網址，複製後傳給朋友，對方點開即可匯入。'
                : '雙方都不需要連網路。產生一個 QR Code，讓朋友在「行程」頁面用「掃描離線分享」讀取。'
            }}
          </p>

          <div
            v-if="shareError"
            class="mb-4 rounded-lg border border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-900/30 px-3 py-2 text-sm text-red-700 dark:text-red-200 flex items-start gap-2"
            role="alert"
          >
            <MdIcon name="warning" class="text-[var(--md-sys-color-error)] shrink-0" />
            <div class="flex-1">
              <p class="font-medium">產生失敗</p>
              <p class="mt-0.5 text-xs opacity-90">{{ shareError }}</p>
              <button
                type="button"
                class="mt-1 text-xs underline opacity-80 hover:opacity-100"
                @click="resetShareModal"
              >
                清除
              </button>
            </div>
          </div>
          <div v-if="!selectedShareFestival" class="flex flex-col gap-3 max-h-[60vh] overflow-y-auto">
            <button
              v-for="fest in shareableFestivals"
              :key="fest.id"
              class="px-4 py-3 rounded-lg border border-purple-200 dark:border-purple-700 bg-purple-50 dark:bg-purple-900/30 hover:bg-purple-100 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-200 font-medium text-left flex justify-between items-center transition-colors disabled:opacity-50"
              :disabled="isSharing"
              @click="pickShareFestival(fest)"
            >
              <span class="truncate pr-2">{{ fest.name }}</span>
              <span
                class="text-sm bg-purple-200 dark:bg-purple-800 text-purple-800 dark:text-purple-100 px-2 py-1 rounded-full whitespace-nowrap"
              >
                {{ fest.count }} 場
              </span>
            </button>
          </div>

          <div v-else class="flex flex-col gap-3">
            <p class="text-sm text-gray-600 dark:text-gray-300">
              分享「<span class="font-bold text-[var(--md-sys-color-primary)]">{{
                selectedShareFestival.name
              }}</span
              >」的 {{ selectedShareFestival.count }} 場行程
            </p>
          </div>
        </template>

        <template v-else-if="shareMode === 'cloud'">
          <div class="flex justify-center mb-4 text-green-500 dark:text-green-400">
            <svg class="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <p class="text-sm text-gray-600 dark:text-gray-300 mb-4 text-center">
            可以複製以下連結分享給朋友
          </p>
          <div class="relative">
            <input
              type="text"
              readonly
              :value="generatedLink"
              class="w-full pr-10 pl-3 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-200 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
              @click="$event.target.select()"
            />
          </div>
        </template>

        <template v-else>
          <p class="text-sm text-gray-600 dark:text-gray-300 mb-4 text-center">
            請朋友在「行程」頁面點選「掃描離線分享」，對準這個 QR Code
          </p>
          <img :src="qrDataUrl" alt="離線分享 QR Code" class="mx-auto rounded-lg" width="280" height="280" />
        </template>
      </div>

      <template #actions>
        <template v-if="!hasShareResult">
          <template v-if="!selectedShareFestival">
            <md-text-button type="button" :disabled="isSharing" @click="showShareModal = false">
              取消
            </md-text-button>
          </template>
          <template v-else>
            <md-text-button
              type="button"
              :disabled="isSharing"
              @click="selectedShareFestival = null"
            >
              返回
            </md-text-button>
            <md-filled-button type="button" :disabled="isSharing" @click="confirmShare">
              {{ shareMode === 'cloud' ? '產生連結' : '產生 QR Code' }}
            </md-filled-button>
          </template>
        </template>
        <template v-else-if="shareMode === 'cloud'">
          <md-text-button type="button" @click="showShareModal = false">關閉</md-text-button>
          <md-filled-button type="button" @click="copyGeneratedLink">複製網址</md-filled-button>
        </template>
        <template v-else>
          <md-filled-button type="button" @click="showShareModal = false">關閉</md-filled-button>
        </template>
      </template>
    </BaseModal>

    <!-- 加入行事曆 Modal：選擇音樂祭 -->
    <BaseModal v-model="showCalendarModal">
      <template #headline>加入行事曆</template>

      <p class="text-sm text-gray-500 dark:text-gray-400 mb-4 text-center">
        選擇要匯出的範圍，會依你的提醒設定加上演出前提醒。
      </p>
      <div class="flex flex-col gap-3 max-h-[60vh] overflow-y-auto">
        <button
          v-if="shareableFestivals.length > 1"
          class="px-4 py-3 rounded-lg border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-200 font-medium text-left flex justify-between items-center transition-colors"
          @click="executeCalendarExport('all')"
        >
          <span class="truncate pr-2">全部行程</span>
          <span
            class="text-sm bg-emerald-200 dark:bg-emerald-800 text-emerald-800 dark:text-emerald-100 px-2 py-1 rounded-full whitespace-nowrap"
          >
            {{ plan.length }} 場
          </span>
        </button>
        <button
          v-for="fest in shareableFestivals"
          :key="fest.id"
          class="px-4 py-3 rounded-lg border border-emerald-200 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-200 font-medium text-left flex justify-between items-center transition-colors"
          @click="executeCalendarExport(fest.id)"
        >
          <span class="truncate pr-2">{{ fest.name }}</span>
          <span
            class="text-sm bg-emerald-200 dark:bg-emerald-800 text-emerald-800 dark:text-emerald-100 px-2 py-1 rounded-full whitespace-nowrap"
          >
            {{ fest.count }} 場
          </span>
        </button>
      </div>

      <template #actions>
        <md-text-button type="button" @click="showCalendarModal = false">取消</md-text-button>
      </template>
    </BaseModal>

    <ExportImageModal
      :open="showExportImageModal"
      :plan="plan"
      :festivals="shareableFestivals"
      @close="showExportImageModal = false"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, defineAsyncComponent } from 'vue';
import { storeToRefs } from 'pinia';
import { useRouter } from 'vue-router';
import { usePlanStore } from '../stores/plan';
import { useSavedPlansStore } from '../stores/savedPlans';
import { useFestivalStore } from '../stores/festival';
import { useSettingsStore } from '../stores/settings';
import { useNowTicker } from '../composables/useNowTicker';
import { useOnline } from '../composables/useOnline';
import { encodePlanToText } from '../utils/url';
import { getShortenerUrl } from '../utils/shortener';
import { formatTime, formatDayLabel } from '../utils/format';
import { trackEvent } from '../utils/analytics';
import { buildPlanIcs, downloadIcs } from '../utils/calendar';
import { useToast } from '../composables/useToast';
import { useConfirm } from '../composables/useConfirm';
import TimelineGrid from '../components/TimelineGrid.vue';
import NextUpCard from '../components/NextUpCard.vue';
import ExportImageModal from '../components/ExportImageModal.vue';
import BaseModal from '../components/BaseModal.vue';
import MdIcon from '../components/MdIcon.vue';
import AccordionSection from '../components/AccordionSection.vue';
// jsQR/相機掃描邏輯只有點開這個 modal 才需要，動態載入避免拖大 /plan 的主要 bundle
// （這台 PWA 會把所有 JS 都放進離線 precache，要盡量避免不必要的東西被一起載入）。
const ScanOfflineShareModal = defineAsyncComponent(
  () => import('../components/ScanOfflineShareModal.vue')
);

const planStore = usePlanStore();
const savedPlansStore = useSavedPlansStore();
const festivalStore = useFestivalStore();
const settingsStore = useSettingsStore();
const router = useRouter();
const { now } = useNowTicker(1000);
const { isOnline } = useOnline();
const { showToast } = useToast();
const { confirm } = useConfirm();

const { myPlan: plan } = storeToRefs(planStore);
const { savedPlans } = storeToRefs(savedPlansStore);
const selectedPlanDay = ref('');
const showScanModal = ref(false);

const uniqueFestivals = computed(() => [
  ...new Set(plan.value.map((p) => p.festivalName).filter(Boolean)),
]);

const festivalMap = computed(
  () => new Map((festivalStore.getFestivals || []).map((f) => [f.festivalId, f]))
);

const planDays = computed(() => {
  if (!plan.value.length) return [];

  const todayKey = now.value.toDateString();
  const startOfToday = new Date(now.value);
  startOfToday.setHours(0, 0, 0, 0);
  const startOfTodayMs = startOfToday.getTime();
  const grouped = new Map();

  for (const perf of plan.value) {
    const date = new Date(perf.start);
    const key = date.toDateString();
    if (!grouped.has(key)) {
      grouped.set(key, {
        dateKey: key,
        date,
        isToday: key === todayKey,
        performances: [],
        festivalNames: new Set(),
      });
    }
    const entry = grouped.get(key);
    entry.performances.push({
      ...perf,
      isPast: now.value > new Date(perf.end || perf.start),
    });
    if (perf.festivalName) entry.festivalNames.add(perf.festivalName);
  }

  const result = Array.from(grouped.values()).map((day) => {
    day.performances.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

    const festivalIds = [...new Set(day.performances.map((p) => p.festivalId).filter(Boolean))];
    const stageOrder = new Set();
    for (const id of festivalIds) {
      const fest = festivalMap.value.get(id);
      if (fest?.stages) for (const s of fest.stages) stageOrder.add(s.name);
    }
    const indexMap = new Map([...stageOrder].map((name, i) => [name, i]));
    const stages = [...new Set(day.performances.map((p) => p.stage).filter(Boolean))].sort(
      (a, b) => (indexMap.get(a) ?? Infinity) - (indexMap.get(b) ?? Infinity)
    );

    const entries = festivalIds.map((id) => ({
      id,
      name: day.performances.find((p) => p.festivalId === id)?.festivalName || id,
    }));

    return {
      ...day,
      isPast: day.date.getTime() < startOfTodayMs,
      label: formatDayLabel(day.date),
      count: day.performances.length,
      festivalNames: [...day.festivalNames],
      festivalEntries: entries,
      stages,
    };
  });

  result.sort((a, b) => a.date.getTime() - b.date.getTime());
  return result;
});

// 即將到來（含今天）的行程，依日期由近到遠排序
const upcomingDays = computed(() => planDays.value.filter((d) => !d.isPast));
// 過往行程，最近結束的排在最前面
const pastDays = computed(() =>
  planDays.value
    .filter((d) => d.isPast)
    .slice()
    .reverse()
);
// 過往活動預設收合，避免干擾
const showPast = ref(false);

// 把預設選擇日的副作用從 computed 拉出來，避免 vue/no-side-effects-in-computed-properties
watch(
  planDays,
  (days) => {
    if (days.length === 0) {
      selectedPlanDay.value = '';
      return;
    }
    if (!selectedPlanDay.value || !days.some((d) => d.dateKey === selectedPlanDay.value)) {
      const today = days.find((d) => d.isToday);
      const firstUpcoming = upcomingDays.value[0];
      if (today) {
        selectedPlanDay.value = today.dateKey;
      } else if (firstUpcoming) {
        selectedPlanDay.value = firstUpcoming.dateKey;
      } else {
        // 全部都是過往行程：選最近的一場並展開過往區塊
        selectedPlanDay.value = pastDays.value[0]?.dateKey || days[0].dateKey;
        showPast.value = true;
      }
    }
  },
  { immediate: true }
);

// ---- 已儲存的分享行程 ----
const savedPlansTitle = computed(() =>
  savedPlans.value.length ? `朋友的分享 (${savedPlans.value.length})` : '朋友的分享'
);

const viewingSavedPlan = ref(null);
const viewingSelectedDay = ref('');

const viewingDays = computed(() => {
  if (!viewingSavedPlan.value) return [];
  const set = new Set();
  for (const p of viewingSavedPlan.value.performances) {
    set.add(new Date(p.start).toDateString());
  }
  return Array.from(set)
    .map((dateKey) => ({ dateKey, date: new Date(dateKey), label: formatDayLabel(dateKey) }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());
});

const viewingStages = computed(() => {
  if (!viewingSavedPlan.value) return [];
  return [...new Set(viewingSavedPlan.value.performances.map((p) => p.stage))].map((name) => ({
    name,
  }));
});

const viewingPerformances = computed(() => {
  if (!viewingSavedPlan.value || !viewingSelectedDay.value) return [];
  return viewingSavedPlan.value.performances.filter(
    (p) => new Date(p.start).toDateString() === viewingSelectedDay.value
  );
});

function onViewSavedPlan(savedPlan) {
  viewingSavedPlan.value = savedPlan;
  viewingSelectedDay.value = viewingDays.value[0]?.dateKey || '';
}

function closeViewSavedPlan() {
  viewingSavedPlan.value = null;
}

async function onApplyFromView() {
  if (!viewingSavedPlan.value) return;
  await onApplySavedPlan(viewingSavedPlan.value);
  closeViewSavedPlan();
}

async function onApplySavedPlan(savedPlan) {
  const ok = await confirm(`確定要用「${savedPlan.name}」取代目前的行程嗎？`, {
    confirmLabel: '套用',
  });
  if (!ok) return;
  planStore.replacePlan(savedPlan.performances);
  showToast({ message: `已套用：${savedPlan.name}`, kind: 'success', icon: '✓' });
}

async function onRemoveSavedPlan(savedPlan) {
  const ok = await confirm(`確定要刪除已儲存的行程「${savedPlan.name}」嗎？`, {
    confirmLabel: '刪除',
    danger: true,
  });
  if (!ok) return;
  savedPlansStore.removeSavedPlan(savedPlan.id);
  showToast({ message: `已刪除：${savedPlan.name}` });
}

function dayFestivalsWithMap(day) {
  return (day.festivalEntries || []).filter((f) => !!festivalMap.value.get(f.id)?.map?.image);
}

function goToMap(festivalId) {
  router.push({ name: 'MapView', params: { id: festivalId } });
}

// ---- 加入行事曆（匯出 .ics）----
const showCalendarModal = ref(false);

function addToCalendar() {
  if (!plan.value.length) {
    showToast({ message: '目前沒有行程可以加入行事曆', kind: 'error' });
    return;
  }
  showCalendarModal.value = true;
}

/** @param {string} festivalId 'all' 代表整份行程 */
function executeCalendarExport(festivalId) {
  const subset =
    festivalId === 'all' ? plan.value : plan.value.filter((p) => p.festivalId === festivalId);
  if (!subset.length) {
    showToast({ message: '這個音樂祭沒有可加入的行程', kind: 'error' });
    return;
  }
  const reminderMinutes = settingsStore.performanceReminderTimes?.length
    ? settingsStore.performanceReminderTimes
    : [10];
  const fest = shareableFestivals.value.find((f) => f.id === festivalId);
  const calName = festivalId === 'all' ? '我的音樂祭行程' : fest?.name || '音樂祭行程';
  const ics = buildPlanIcs(subset, { reminderMinutes, calendarName: calName });
  const filename =
    festivalId === 'all' ? 'my-festival-plan.ics' : `${festivalId || 'festival'}.ics`;
  downloadIcs(ics, filename);
  trackEvent('export_calendar', { festival_id: festivalId, count: subset.length });
  showToast({ message: '已下載行事曆檔，開啟它即可加入行事曆並收到提醒' });
  showCalendarModal.value = false;
}

// ---- 分享 ----
const showShareModal = ref(false);
const shareError = ref('');
const showExportImageModal = ref(false);
const isSharing = ref(false);
const generatedLink = ref('');
const qrDataUrl = ref('');
const selectedShareFestival = ref(null);
// 'cloud' 需要雙方連網（透過短網址服務）；'offline' 產生 QR code，雙方都不需要連網。
const shareMode = ref('cloud');

const hasShareResult = computed(() => !!generatedLink.value || !!qrDataUrl.value);

const shareButtonLabel = computed(() => (isSharing.value ? '產生中...' : '分享行程'));

function shareModeBtn(active) {
  return active
    ? 'bg-[var(--md-sys-color-surface-container-lowest)] text-[var(--md-sys-color-primary)] shadow'
    : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]';
}

const shareableFestivals = computed(() => {
  const nowMs = now.value.getTime();
  const fests = {};
  for (const p of plan.value) {
    if (!fests[p.festivalId]) {
      fests[p.festivalId] = {
        id: p.festivalId,
        name: p.festivalName,
        count: 0,
        // 還沒結束（進行中或未來）演出中最早的開始時間
        nextStart: Infinity,
        // 全部演出中最晚的結束時間，用來排序純過往的音樂祭
        lastEnd: -Infinity,
      };
    }
    const fest = fests[p.festivalId];
    fest.count++;
    const startMs = new Date(p.start).getTime();
    const endMs = new Date(p.end || p.start).getTime();
    if (endMs >= nowMs && startMs < fest.nextStart) fest.nextStart = startMs;
    if (endMs > fest.lastEnd) fest.lastEnd = endMs;
  }
  // 時間最靠近現在的排最上面：
  //   先列還沒結束的（即將開始的最前面），再列已經結束的（最近結束的在前）。
  return Object.values(fests).sort((a, b) => {
    const aUpcoming = a.nextStart !== Infinity;
    const bUpcoming = b.nextStart !== Infinity;
    if (aUpcoming !== bUpcoming) return aUpcoming ? -1 : 1;
    if (aUpcoming) return a.nextStart - b.nextStart;
    return b.lastEnd - a.lastEnd;
  });
});

function openShareModal() {
  if (!plan.value.length) {
    alert('目前沒有行程可以分享');
    return;
  }
  generatedLink.value = '';
  qrDataUrl.value = '';
  shareError.value = '';
  selectedShareFestival.value = null;
  shareMode.value = isOnline.value ? 'cloud' : 'offline';
  showShareModal.value = true;
}

function pickShareFestival(fest) {
  selectedShareFestival.value = fest;
}

function confirmShare() {
  if (!selectedShareFestival.value) return;
  if (shareMode.value === 'offline') {
    executeShareOffline(selectedShareFestival.value.id);
  } else {
    executeShare(selectedShareFestival.value.id);
  }
}

async function executeShareOffline(festivalId) {
  isSharing.value = true;
  qrDataUrl.value = '';
  shareError.value = '';
  const subset = plan.value.filter((p) => p.festivalId === festivalId);

  try {
    if (!subset.length) throw new Error('這個音樂祭沒有可分享的行程');
    const text = encodePlanToText(subset);
    // qrcode 套件只有實際切到離線分享才需要，動態載入避免拖大主要 bundle
    const { generateQrDataUrl } = await import('../utils/qr');
    qrDataUrl.value = await generateQrDataUrl(text);
    trackEvent('generate_share_qr', { festival_id: festivalId });
  } catch (err) {
    console.error('[share-offline] generate failed:', err);
    shareError.value = '行程資料過大，無法產生 QR Code，請改用雲端分享。';
    trackEvent('generate_share_qr_error', { festival_id: festivalId });
  } finally {
    isSharing.value = false;
  }
}

async function executeShare(festivalId) {
  isSharing.value = true;
  generatedLink.value = '';
  shareError.value = '';
  const subset = plan.value.filter((p) => p.festivalId === festivalId);

  try {
    if (!subset.length) throw new Error('這個音樂祭沒有可分享的行程');

    const compressedData = encodePlanToText(subset);
    const gasUrl = getShortenerUrl();

    // 跟另一個 short-url 專案的合約一致：
    //   POST text/plain (避免 CORS preflight) + JSON.stringify({action,content})
    //   GAS 回 { err: false, s: <shortId>, t: <content> } 或 { err: true, message }
    const res = await fetch(gasUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      mode: 'cors',
      body: JSON.stringify({ action: 'create', content: compressedData }),
    });
    if (!res.ok) {
      throw new Error(`短網址服務回應 HTTP ${res.status}`);
    }
    /** @type {{ err: boolean, s?: string, message?: string }} */
    const data = await res.json().catch(() => {
      throw new Error('短網址服務回傳格式錯誤（非 JSON）');
    });
    if (data.err !== false || typeof data.s !== 'string' || !data.s) {
      throw new Error(data.message || '短網址服務未正確回傳短碼');
    }

    generatedLink.value = `${window.location.origin}/${data.s}`;
    trackEvent('generate_share_link', { festival_id: festivalId });
  } catch (err) {
    console.error('[share] generate failed:', err);
    shareError.value = err instanceof Error ? err.message : '生成分享網址失敗，請稍後再試';
    trackEvent('generate_share_link_error', {
      festival_id: festivalId,
      reason: shareError.value.slice(0, 80),
    });
  } finally {
    isSharing.value = false;
  }
}

function resetShareModal() {
  shareError.value = '';
  generatedLink.value = '';
  qrDataUrl.value = '';
}

function copyGeneratedLink() {
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard
      .writeText(generatedLink.value)
      .then(() => alert('分享網址已複製到剪貼簿！'))
      .catch(() => prompt('複製以下網址分享：', generatedLink.value));
  } else {
    prompt('複製以下網址分享：', generatedLink.value);
  }
  trackEvent('copy_share_link');
}

onMounted(() => {
  festivalStore.ensureLoaded();
});
</script>

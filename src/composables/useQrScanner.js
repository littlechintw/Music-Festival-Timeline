// @ts-check
import { ref, onBeforeUnmount } from 'vue';
import jsQR from 'jsqr';

const SCAN_INTERVAL_MS = 250;

/**
 * 相機掃描 QR code 的 composable：拿到相機畫面後，定期把影格畫到 canvas 上跑 jsQR 解碼。
 * 只有偵測到「跟上次不同」的內容才會呼叫 onResult——避免同一個（可能無法辨識的）
 * QR code 停在鏡頭前時每 250ms 就重複觸發一次。
 */
export function useQrScanner() {
  /** @type {import('vue').Ref<HTMLVideoElement | null>} */
  const videoEl = ref(null);
  const active = ref(false);
  const error = ref('');

  /** @type {MediaStream | null} */
  let stream = null;
  /** @type {ReturnType<typeof setInterval> | null} */
  let intervalId = null;
  /** @type {HTMLCanvasElement | null} */
  let canvas = null;
  /** @type {CanvasRenderingContext2D | null} */
  let ctx = null;
  let lastText = '';

  /** @param {(text: string) => void} onResult */
  function tick(onResult) {
    const video = videoEl.value;
    if (!video || !ctx || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height);
    if (code?.data && code.data !== lastText) {
      lastText = code.data;
      onResult(code.data);
    }
  }

  /** @param {(text: string) => void} onResult */
  async function start(onResult) {
    error.value = '';
    lastText = '';
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      error.value = '此瀏覽器不支援相機掃描功能';
      return;
    }
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      });
    } catch {
      error.value = '無法存取相機，請確認已允許相機權限';
      return;
    }
    if (!videoEl.value) {
      stream.getTracks().forEach((t) => t.stop());
      stream = null;
      return;
    }
    videoEl.value.srcObject = stream;
    try {
      await videoEl.value.play();
    } catch {
      /* 部分瀏覽器 autoplay 政策下 play() 會 reject，但串流仍會顯示 */
    }
    canvas = document.createElement('canvas');
    ctx = canvas.getContext('2d', { willReadFrequently: true });
    active.value = true;
    intervalId = setInterval(() => tick(onResult), SCAN_INTERVAL_MS);
  }

  function stop() {
    active.value = false;
    if (intervalId) clearInterval(intervalId);
    intervalId = null;
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      stream = null;
    }
    if (videoEl.value) videoEl.value.srcObject = null;
  }

  onBeforeUnmount(stop);

  return { videoEl, active, error, start, stop };
}

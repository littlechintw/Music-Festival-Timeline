// @ts-check
import QRCode from 'qrcode';

// 'L' 容錯率最低、但可容納的資料量最大——這裡的 QR code 是螢幕對螢幕掃描，
// 不會印出來或有實體磨損風險，優先讓容量大一點比較重要。
/**
 * @param {string} text
 * @returns {Promise<string>} PNG data URL
 */
export function generateQrDataUrl(text) {
  return QRCode.toDataURL(text, { errorCorrectionLevel: 'L', margin: 2, width: 280 });
}

// Utility: Compress/encode plan/settings into URL
export function compressToUrl(data) {
  try {
    const jsonString = JSON.stringify(data);
    // 使用 encodeURIComponent 來處理 UTF-8 字符，然後轉換為 base64
    const utf8Bytes = encodeURIComponent(jsonString);
    return btoa(utf8Bytes);
  } catch (error) {
    console.error('compressToUrl 錯誤:', error);
    throw new Error('壓縮數據失敗');
  }
}

export function decompressFromUrl(str) {
  try {
    // 解碼 base64，然後使用 decodeURIComponent 來處理 UTF-8 字符
    const utf8Bytes = atob(str);
    const jsonString = decodeURIComponent(utf8Bytes);
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('decompressFromUrl 錯誤:', error);
    throw new Error('解壓縮數據失敗');
  }
}

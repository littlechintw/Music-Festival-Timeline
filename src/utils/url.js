// Utility: Compress/encode plan/settings into URL
export function compressToUrl(data) {
  // TODO: implement compression
  return btoa(JSON.stringify(data));
}
export function decompressFromUrl(str) {
  // TODO: implement decompression
  return JSON.parse(atob(str));
}

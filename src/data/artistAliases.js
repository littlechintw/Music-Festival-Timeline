// @ts-check
/**
 * 藝人別名歸納表。
 *
 * 同一位藝人在不同音樂祭可能寫成不同名稱（中英並列、加團名後綴、標點差異…），
 * 這個檔案把它們歸納成同一位，讓「藝人統計」能正確累計次數。
 *
 * 每一組：
 *   - canonical：要顯示出來的正式名稱（通常挑資訊最完整的那個）。
 *   - aliases：其他會出現的寫法。
 *
 * 比對前系統會自動處理掉這些差異，所以「不用」列進來：
 *   - 頭尾／多餘空白
 *   - 結尾的地區標籤，例如 "milet [JP]"、"Se So Neon (KR)"（會被視為同一位）
 *
 * 注意：合作場次（含 "ft." / "feat."）刻意「不」歸併到主團，
 * 因為那通常是不同的演出組合；若要視為同一位再自行加入。
 *
 * @typedef {{ canonical: string, aliases: string[] }} ArtistAliasGroup
 * @type {ArtistAliasGroup[]}
 */
export const ARTIST_ALIASES = [
  { canonical: '康士坦的變化球 KST', aliases: ['康士坦的變化球'] },
  { canonical: '椅子樂團 The Chairs', aliases: ['椅子樂團'] },
  { canonical: '馬克 SAVAGE.M', aliases: ['馬克'] },
  { canonical: '忘憂水 WonderWater', aliases: ['忘憂水'] },
];

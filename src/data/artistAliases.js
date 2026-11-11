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
  { canonical: 'Crispy脆樂團', aliases: ['Crispy 脆樂團', '脆樂團'] },
  { canonical: '庸俗救星 Vulgar Savior', aliases: ['庸俗救星'] },
  { canonical: '芒果醬 Mango Jump', aliases: ['芒果醬'] },
  { canonical: '甜約翰 Sweet John', aliases: ['甜約翰'] },
  { canonical: '怕胖團 PAPUN BAND', aliases: ['怕胖團'] },
  { canonical: '滅火器 Fire EX.', aliases: ['滅火器'] },
  { canonical: '美秀集團 Amazing Show', aliases: ['美秀集團'] },
  { canonical: '公館青少年GGteens', aliases: ['公館青少年'] },
  { canonical: '普通隊長 Captain Ordinary', aliases: ['普通隊長'] },
  { canonical: '鄭宜農 Enno Cheng', aliases: ['鄭宜農'] },
  { canonical: '隨性 Random', aliases: ['隨性Random', '隨性'] },
  { canonical: '黃宇寒 Han', aliases: ['黃宇寒'] },
];

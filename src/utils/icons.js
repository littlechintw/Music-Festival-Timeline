// @ts-check
// 用 @material-symbols/svg-400 個別 icon 的 raw SVG，而不是整包 4MB 的變體字型——
// 每個 icon 只有幾百 bytes，對離線 PWA 的 precache 預算友善很多。
// 新增 icon 時在這裡加一行 import + 對應到 icons 物件即可。
import music_note from '@material-symbols/svg-400/outlined/music_note.svg?raw';
import festival from '@material-symbols/svg-400/outlined/festival.svg?raw';
import calendar_month from '@material-symbols/svg-400/outlined/calendar_month.svg?raw';
import mic from '@material-symbols/svg-400/outlined/mic.svg?raw';
import settings from '@material-symbols/svg-400/outlined/settings.svg?raw';
import add_circle from '@material-symbols/svg-400/outlined/add_circle.svg?raw';
import palette from '@material-symbols/svg-400/outlined/palette.svg?raw';
import notifications from '@material-symbols/svg-400/outlined/notifications.svg?raw';
import wifi_tethering from '@material-symbols/svg-400/outlined/wifi_tethering.svg?raw';
import lock from '@material-symbols/svg-400/outlined/lock.svg?raw';
import delete_ from '@material-symbols/svg-400/outlined/delete.svg?raw';
import schedule from '@material-symbols/svg-400/outlined/schedule.svg?raw';
import close from '@material-symbols/svg-400/outlined/close.svg?raw';
import warning from '@material-symbols/svg-400/outlined/warning.svg?raw';
import keyboard_arrow_down from '@material-symbols/svg-400/outlined/keyboard_arrow_down.svg?raw';
import format_list_bulleted from '@material-symbols/svg-400/outlined/format_list_bulleted.svg?raw';
import calendar_view_month from '@material-symbols/svg-400/outlined/calendar_view_month.svg?raw';
import ios_share from '@material-symbols/svg-400/outlined/ios_share.svg?raw';
import download from '@material-symbols/svg-400/outlined/download.svg?raw';
import smart_toy from '@material-symbols/svg-400/outlined/smart_toy.svg?raw';
import content_paste from '@material-symbols/svg-400/outlined/content_paste.svg?raw';
import upload_file from '@material-symbols/svg-400/outlined/upload_file.svg?raw';
import add from '@material-symbols/svg-400/outlined/add.svg?raw';
import menu_book from '@material-symbols/svg-400/outlined/menu_book.svg?raw';
import search from '@material-symbols/svg-400/outlined/search.svg?raw';
import wifi_off from '@material-symbols/svg-400/outlined/wifi_off.svg?raw';
import queue_music from '@material-symbols/svg-400/outlined/queue_music.svg?raw';
import location_on from '@material-symbols/svg-400/outlined/location_on.svg?raw';
import repeat from '@material-symbols/svg-400/outlined/repeat.svg?raw';
import hourglass_top from '@material-symbols/svg-400/outlined/hourglass_top.svg?raw';
import arrow_forward from '@material-symbols/svg-400/outlined/arrow_forward.svg?raw';
import photo_camera from '@material-symbols/svg-400/outlined/photo_camera.svg?raw';
import keyboard_arrow_up from '@material-symbols/svg-400/outlined/keyboard_arrow_up.svg?raw';
import event from '@material-symbols/svg-400/outlined/event.svg?raw';
import bookmark from '@material-symbols/svg-400/outlined/bookmark.svg?raw';
import bookmark_add from '@material-symbols/svg-400/outlined/bookmark_add.svg?raw';
import sync from '@material-symbols/svg-400/outlined/sync.svg?raw';
import check_circle from '@material-symbols/svg-400/outlined/check_circle.svg?raw';
import error from '@material-symbols/svg-400/outlined/error.svg?raw';
import info from '@material-symbols/svg-400/outlined/info.svg?raw';

/** @type {Record<string, string>} */
export const icons = {
  music_note,
  festival,
  calendar_month,
  mic,
  settings,
  add_circle,
  palette,
  notifications,
  wifi_tethering,
  lock,
  delete: delete_,
  schedule,
  close,
  warning,
  keyboard_arrow_down,
  format_list_bulleted,
  calendar_view_month,
  ios_share,
  download,
  smart_toy,
  content_paste,
  upload_file,
  add,
  menu_book,
  search,
  wifi_off,
  queue_music,
  location_on,
  repeat,
  hourglass_top,
  arrow_forward,
  photo_camera,
  keyboard_arrow_up,
  event,
  bookmark,
  bookmark_add,
  sync,
  check_circle,
  error,
  info,
};

/**
 * offlineStorage.js
 * Utilities for managing offline festival data in localStorage.
 */

const PREFIX = 'offline_festival_';
const INDEX_KEY = 'festival_index_cache';

export function getStoredFestivalIndex() {
  try {
    const raw = localStorage.getItem(INDEX_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setStoredFestivalIndex(index) {
  try {
    localStorage.setItem(INDEX_KEY, JSON.stringify(index));
  } catch {}
}

export function getOfflineHash(id) {
  return localStorage.getItem(`${PREFIX}hash_${id}`) || null;
}

export function setOfflineFestival(id, data) {
  try {
    localStorage.setItem(`${PREFIX}data_${id}`, JSON.stringify(data));
    localStorage.setItem(`${PREFIX}hash_${id}`, data._filehash || '');
  } catch {}
}

export function getOfflineFestival(id) {
  try {
    const raw = localStorage.getItem(`${PREFIX}data_${id}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function deleteOfflineFestival(id) {
  localStorage.removeItem(`${PREFIX}data_${id}`);
  localStorage.removeItem(`${PREFIX}hash_${id}`);
}

export function getOfflineFestivalIds() {
  const ids = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(`${PREFIX}data_`)) {
      ids.push(key.slice(`${PREFIX}data_`.length));
    }
  }
  return ids;
}

// Utility for saving/loading festival draft in localStorage

const DRAFT_KEY = 'festival-draft-v1';

export function saveFestivalDraft(festival) {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(festival));
  } catch {}
}

export function loadFestivalDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearFestivalDraft() {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {}
}

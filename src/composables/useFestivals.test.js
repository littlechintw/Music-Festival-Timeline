// @ts-check
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  loadLocalHashes,
  syncFestivals,
  isInAutoWindow,
  AUTO_FUTURE_DAYS,
  AUTO_PAST_DAYS,
} from './useFestivals';

const VALID_FESTIVAL = {
  festivalId: 'mega-2026',
  name: '大港',
  startTime: '2026-03-21T12:30:00+08:00',
  endTime: '2026-03-22T21:50:00+08:00',
  location: { name: '高雄', address: '...', latitude: 0, longitude: 0 },
  stages: [
    {
      id: 's',
      name: '南霸天',
      performances: [
        { artist: '滅火器', start: '2026-03-21T15:00:00+08:00', end: '2026-03-21T15:40:00+08:00' },
      ],
    },
  ],
};

const ENTRY = {
  festivalId: 'mega-2026',
  name: '大港',
  startTime: VALID_FESTIVAL.startTime,
  endTime: VALID_FESTIVAL.endTime,
  file: 'mega-2026.json',
  hash: 'h1',
  bytes: 1000,
  status: /** @type {const} */ ('upcoming'),
};

const INDEX = { version: 2, generatedAt: 'x', indexHash: 'i', festivals: [ENTRY] };

function mockFetch(routes) {
  // @ts-ignore
  globalThis.fetch = vi.fn(async (url) => {
    const key = String(url);
    if (key in routes) {
      const value = routes[key];
      if (value === 'fail') throw new Error('network');
      return new Response(JSON.stringify(value), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response('', { status: 404 });
  });
}

function fetchedUrls() {
  // @ts-ignore
  return globalThis.fetch.mock.calls.map((c) => c[0]);
}

describe('isInAutoWindow', () => {
  const now = new Date('2026-06-01T00:00:00+08:00').getTime();
  const day = 86400000;
  const entry = (startOffsetDays, durationDays = 1) => ({
    startTime: new Date(now + startOffsetDays * day).toISOString(),
    endTime: new Date(now + (startOffsetDays + durationDays) * day).toISOString(),
  });

  it('includes festivals starting within the next month', () => {
    expect(isInAutoWindow(entry(AUTO_FUTURE_DAYS - 1), now)).toBe(true);
    expect(isInAutoWindow(entry(AUTO_FUTURE_DAYS + 1), now)).toBe(false);
  });

  it('includes festivals that ended within the past two weeks', () => {
    expect(isInAutoWindow(entry(-(AUTO_PAST_DAYS - 1) - 1), now)).toBe(true);
    expect(isInAutoWindow(entry(-(AUTO_PAST_DAYS + 2) - 1), now)).toBe(false);
  });

  it('includes festivals happening right now', () => {
    expect(isInAutoWindow(entry(-1, 3), now)).toBe(true);
  });

  it('rejects invalid dates', () => {
    expect(isInAutoWindow({ startTime: 'nope', endTime: 'nope' }, now)).toBe(false);
  });
});

describe('syncFestivals', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('downloads festivals that should be kept and stores their hashes', async () => {
    mockFetch({ '/festivals/index.json': INDEX, '/festivals/mega-2026.json': VALID_FESTIVAL });

    const result = await syncFestivals({ shouldKeep: () => true, getCached: () => undefined });

    expect(result.festivals).toHaveLength(1);
    expect(result.festivals[0].festivalId).toBe('mega-2026');
    expect(loadLocalHashes()['mega-2026']).toBe('h1');
    expect(result.evicted).toEqual([]);
  });

  it('skips the network when the local hash matches and data is in memory', async () => {
    localStorage.setItem('festival_hashes_v1', JSON.stringify({ 'mega-2026': 'h1' }));
    mockFetch({ '/festivals/index.json': INDEX });

    const cachedCopy = VALID_FESTIVAL;
    const result = await syncFestivals({ shouldKeep: () => true, getCached: () => cachedCopy });

    expect(result.festivals[0]).toBe(cachedCopy);
    expect(fetchedUrls()).not.toContain('/festivals/mega-2026.json');
  });

  it('re-downloads when the index hash changed', async () => {
    localStorage.setItem('festival_hashes_v1', JSON.stringify({ 'mega-2026': 'old' }));
    mockFetch({ '/festivals/index.json': INDEX, '/festivals/mega-2026.json': VALID_FESTIVAL });

    await syncFestivals({ shouldKeep: () => true, getCached: () => VALID_FESTIVAL });

    expect(fetchedUrls()).toContain('/festivals/mega-2026.json');
    expect(loadLocalHashes()['mega-2026']).toBe('h1');
  });

  it('does not download festivals that should not be kept', async () => {
    mockFetch({ '/festivals/index.json': INDEX, '/festivals/mega-2026.json': VALID_FESTIVAL });

    const result = await syncFestivals({ shouldKeep: () => false, getCached: () => undefined });

    expect(result.festivals).toHaveLength(0);
    expect(fetchedUrls()).not.toContain('/festivals/mega-2026.json');
    expect(loadLocalHashes()).toEqual({});
  });

  it('evicts previously downloaded festivals that should no longer be kept', async () => {
    localStorage.setItem('festival_hashes_v1', JSON.stringify({ 'mega-2026': 'h1' }));
    mockFetch({ '/festivals/index.json': INDEX });

    const result = await syncFestivals({ shouldKeep: () => false, getCached: () => VALID_FESTIVAL });

    expect(result.festivals).toHaveLength(0);
    expect(result.evicted).toEqual(['mega-2026']);
    expect(loadLocalHashes()).toEqual({});
  });

  it('keeps the in-memory copy when a refresh fails', async () => {
    localStorage.setItem('festival_hashes_v1', JSON.stringify({ 'mega-2026': 'old' }));
    mockFetch({ '/festivals/index.json': INDEX, '/festivals/mega-2026.json': 'fail' });

    const result = await syncFestivals({ shouldKeep: () => true, getCached: () => VALID_FESTIVAL });

    expect(result.festivals).toHaveLength(1);
    expect(result.errors).toContain('fetch:mega-2026.json');
  });

  it('returns errors when index fetch fails', async () => {
    mockFetch({ '/festivals/index.json': 'fail' });
    const result = await syncFestivals({ shouldKeep: () => true, getCached: () => undefined });
    expect(result.index).toBeNull();
    expect(result.errors).toContain('index-unavailable');
  });
});

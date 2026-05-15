// @ts-check
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadLocalHashes, syncFestivals } from './useFestivals';

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

describe('syncFestivals', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('fetches all upcoming festivals in auto mode and stores their hashes', async () => {
    mockFetch({
      '/festivals/index.json': {
        version: 2,
        generatedAt: 'x',
        indexHash: 'i',
        festivals: [
          {
            festivalId: 'mega-2026',
            name: '大港',
            startTime: VALID_FESTIVAL.startTime,
            endTime: VALID_FESTIVAL.endTime,
            file: 'mega-2026.json',
            hash: 'h1',
            bytes: 1000,
            status: 'upcoming',
          },
        ],
      },
      '/festivals/mega-2026.json': VALID_FESTIVAL,
    });

    const result = await syncFestivals({
      mode: 'auto',
      pinnedIds: new Set(),
      getCached: () => undefined,
    });

    expect(result.festivals).toHaveLength(1);
    expect(result.festivals[0].festivalId).toBe('mega-2026');
    expect(loadLocalHashes()['mega-2026']).toBe('h1');
  });

  it('skips fetch when local hash matches', async () => {
    localStorage.setItem('festival_hashes_v1', JSON.stringify({ 'mega-2026': 'h1' }));
    mockFetch({
      '/festivals/index.json': {
        version: 2,
        generatedAt: 'x',
        indexHash: 'i',
        festivals: [
          {
            festivalId: 'mega-2026',
            name: '大港',
            startTime: VALID_FESTIVAL.startTime,
            endTime: VALID_FESTIVAL.endTime,
            file: 'mega-2026.json',
            hash: 'h1',
            bytes: 1000,
            status: 'upcoming',
          },
        ],
      },
    });

    const cachedCopy = VALID_FESTIVAL;
    const result = await syncFestivals({
      mode: 'auto',
      pinnedIds: new Set(),
      getCached: () => cachedCopy,
    });

    expect(result.festivals[0]).toBe(cachedCopy);
    // 不應該 fetch festival JSON
    // @ts-ignore
    const calls = globalThis.fetch.mock.calls.map((c) => c[0]);
    expect(calls).not.toContain('/festivals/mega-2026.json');
  });

  it('auto mode still fetches archived festivals (so list can show past ones)', async () => {
    const archived = {
      ...VALID_FESTIVAL,
      festivalId: 'old-2024',
      name: '過去活動',
      startTime: '2024-01-01T00:00:00+08:00',
      endTime: '2024-01-02T00:00:00+08:00',
    };
    mockFetch({
      '/festivals/index.json': {
        version: 2,
        generatedAt: 'x',
        indexHash: 'i',
        festivals: [
          {
            festivalId: 'old-2024',
            name: '過去活動',
            startTime: '2024-01-01T00:00:00+08:00',
            endTime: '2024-01-02T00:00:00+08:00',
            file: 'old-2024.json',
            hash: 'h0',
            bytes: 100,
            status: 'archived',
          },
        ],
      },
      '/festivals/old-2024.json': archived,
    });

    const result = await syncFestivals({
      mode: 'auto',
      pinnedIds: new Set(),
      getCached: () => undefined,
    });

    expect(result.festivals).toHaveLength(1);
    expect(result.festivals[0].festivalId).toBe('old-2024');
  });

  it('manual mode skips archived festivals not in pinned set', async () => {
    mockFetch({
      '/festivals/index.json': {
        version: 2,
        generatedAt: 'x',
        indexHash: 'i',
        festivals: [
          {
            festivalId: 'old-2024',
            name: '過去活動',
            startTime: '2024-01-01T00:00:00+08:00',
            endTime: '2024-01-02T00:00:00+08:00',
            file: 'old-2024.json',
            hash: 'h0',
            bytes: 100,
            status: 'archived',
          },
        ],
      },
    });

    const result = await syncFestivals({
      mode: 'manual',
      pinnedIds: new Set(),
      getCached: () => undefined,
    });

    expect(result.festivals).toHaveLength(0);
  });

  it('downloads archived festivals when pinned in manual mode', async () => {
    mockFetch({
      '/festivals/index.json': {
        version: 2,
        generatedAt: 'x',
        indexHash: 'i',
        festivals: [
          {
            festivalId: 'mega-2026',
            name: '大港',
            startTime: VALID_FESTIVAL.startTime,
            endTime: VALID_FESTIVAL.endTime,
            file: 'mega-2026.json',
            hash: 'h1',
            bytes: 1000,
            status: 'archived',
          },
        ],
      },
      '/festivals/mega-2026.json': VALID_FESTIVAL,
    });

    const result = await syncFestivals({
      mode: 'manual',
      pinnedIds: new Set(['mega-2026']),
      getCached: () => undefined,
    });

    expect(result.festivals).toHaveLength(1);
    expect(loadLocalHashes()['mega-2026']).toBe('h1');
  });

  it('returns errors when index fetch fails', async () => {
    mockFetch({ '/festivals/index.json': 'fail' });
    const result = await syncFestivals({
      mode: 'auto',
      pinnedIds: new Set(),
      getCached: () => undefined,
    });
    expect(result.index).toBeNull();
    expect(result.errors).toContain('index-unavailable');
  });
});

// @ts-check
import { describe, it, expect } from 'vitest';
import { makePerfId, flatPerfId } from './perfId';

describe('makePerfId', () => {
  it('combines festivalId + stage + artist + start with underscores', () => {
    const id = makePerfId(
      { festivalId: 'megaport-2026' },
      { name: '南霸天' },
      { artist: '滅火器', start: '2026-03-21T15:00:00+08:00' }
    );
    expect(id).toBe('megaport-2026_南霸天_滅火器_2026-03-21T15:00:00+08:00');
  });

  it('uses empty string for missing fields', () => {
    expect(makePerfId({}, {}, {})).toBe('___');
    expect(makePerfId({ festivalId: 'a' }, {}, {})).toBe('a___');
  });

  it('is deterministic across calls', () => {
    const args = [
      { festivalId: 'a' },
      { name: 'b' },
      { artist: 'c', start: 'd' },
    ];
    // @ts-ignore
    expect(makePerfId(...args)).toBe(makePerfId(...args));
  });
});

describe('flatPerfId', () => {
  it('returns existing id when present', () => {
    expect(flatPerfId({ id: 'precomputed', festivalId: 'x' })).toBe('precomputed');
  });

  it('reconstructs id from flat fields', () => {
    expect(
      flatPerfId({
        festivalId: 'megaport-2026',
        stage: '南霸天',
        artist: '滅火器',
        start: '2026-03-21T15:00:00+08:00',
      })
    ).toBe('megaport-2026_南霸天_滅火器_2026-03-21T15:00:00+08:00');
  });

  it('handles missing perf gracefully', () => {
    expect(flatPerfId(/** @type {any} */ (null))).toBe('___');
  });
});

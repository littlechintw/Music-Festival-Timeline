// @ts-check
import { describe, it, expect } from 'vitest';
import { encodePlanToText, decodePlanFromText } from './url';

const festival = {
  festivalId: 'megaport-2026',
  name: '大港',
  startTime: '2026-03-21T12:30:00+08:00',
  endTime: '2026-03-22T21:50:00+08:00',
  theme: { primary: '', secondary: '', generated: false },
  location: { name: '高雄', address: '...', latitude: 0, longitude: 0 },
  map: { image: '', notes: [] },
  contributors: [],
  stages: [
    {
      id: 'south',
      name: '南霸天',
      performances: [
        { artist: '滅火器', start: '2026-03-21T15:00:00+08:00', end: '2026-03-21T15:40:00+08:00' },
        { artist: '美秀集團', start: '2026-03-22T17:00:00+08:00', end: '2026-03-22T17:40:00+08:00' },
      ],
    },
    {
      id: 'north',
      name: '北霸天',
      performances: [
        { artist: 'YOUR SONG IS GOOD', start: '2026-03-22T19:00:00+08:00', end: '2026-03-22T19:40:00+08:00' },
      ],
    },
  ],
};

describe('encodePlanToText / decodePlanFromText', () => {
  it('encodes a plan to compact text format', () => {
    const text = encodePlanToText([
      { festivalId: 'megaport-2026', stage: '南霸天', artist: '滅火器', start: '2026-03-21T15:00:00+08:00' },
      { festivalId: 'megaport-2026', stage: '南霸天', artist: '美秀集團', start: '2026-03-22T17:00:00+08:00' },
      { festivalId: 'megaport-2026', stage: '北霸天', artist: 'YOUR SONG IS GOOD', start: '2026-03-22T19:00:00+08:00' },
    ]);
    // local-time MMDDHHmm 表示法
    expect(text.startsWith('megaport-2026;')).toBe(true);
    expect(text).toContain('南霸天:');
    expect(text).toContain('北霸天:');
  });

  it('returns empty string for empty plan', () => {
    expect(encodePlanToText([])).toBe('');
  });

  it('decodes back to the original plan entries', () => {
    const original = [
      { festivalId: 'megaport-2026', stage: '南霸天', artist: '滅火器', start: '2026-03-21T15:00:00+08:00', end: '2026-03-21T15:40:00+08:00' },
      { festivalId: 'megaport-2026', stage: '北霸天', artist: 'YOUR SONG IS GOOD', start: '2026-03-22T19:00:00+08:00', end: '2026-03-22T19:40:00+08:00' },
    ];
    const text = encodePlanToText(original);
    const result = decodePlanFromText(text, [festival]);
    expect(result.festival?.festivalId).toBe('megaport-2026');
    expect(result.plan).toHaveLength(2);
    expect(result.plan.map((p) => p.artist).sort()).toEqual(['YOUR SONG IS GOOD', '滅火器']);
    expect(result.invalidCount).toBe(0);
  });

  it('returns null festival when ID not found', () => {
    const result = decodePlanFromText('unknown-festival;南霸天:03211500', [festival]);
    expect(result.festival).toBeNull();
    expect(result.plan).toHaveLength(0);
  });

  it('counts invalid entries when stage or perf missing', () => {
    const result = decodePlanFromText('megaport-2026;不存在的舞台:03211500,03211600', [festival]);
    expect(result.invalidCount).toBe(2);
    expect(result.plan).toHaveLength(0);
  });

  it('encodes and decodes an optional plan name', () => {
    const original = [
      { festivalId: 'megaport-2026', stage: '南霸天', artist: '滅火器', start: '2026-03-21T15:00:00+08:00', end: '2026-03-21T15:40:00+08:00' },
    ];
    const text = encodePlanToText(original, '週末場次');
    expect(text.startsWith('n=')).toBe(true);
    const result = decodePlanFromText(text, [festival]);
    expect(result.name).toBe('週末場次');
    expect(result.plan).toHaveLength(1);
  });

  it('omits the name segment when name is blank/whitespace', () => {
    const original = [
      { festivalId: 'megaport-2026', stage: '南霸天', artist: '滅火器', start: '2026-03-21T15:00:00+08:00', end: '2026-03-21T15:40:00+08:00' },
    ];
    const text = encodePlanToText(original, '   ');
    expect(text.startsWith('megaport-2026;')).toBe(true);
    const result = decodePlanFromText(text, [festival]);
    expect(result.name).toBe('');
  });

  it('still decodes old-format links (no name segment) with empty name', () => {
    const result = decodePlanFromText('megaport-2026;南霸天:03211500', [festival]);
    expect(result.name).toBe('');
    expect(result.plan).toHaveLength(1);
  });
});


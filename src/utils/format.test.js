// @ts-check
import { describe, it, expect } from 'vitest';
import { formatTime, formatTimeRange, formatDayLabel, formatDayHeader } from './format';

describe('formatTime', () => {
  it('returns 24-hour format when is24Hour=true', () => {
    const d = new Date('2026-03-21T15:30:00+08:00');
    expect(formatTime(d, true)).toMatch(/15[:：]30/);
  });

  it('handles invalid input gracefully', () => {
    expect(formatTime('not-a-date', true)).toBe('');
    expect(formatTime(null, true)).toBe('');
  });
});

describe('formatTimeRange', () => {
  it('formats two endpoints with hyphen', () => {
    const out = formatTimeRange('2026-03-21T15:00:00+08:00', '2026-03-21T16:00:00+08:00', true);
    expect(out).toMatch(/15[:：]00 - 16[:：]00/);
  });

  it('returns only start when end is missing', () => {
    const out = formatTimeRange('2026-03-21T15:00:00+08:00', '', true);
    expect(out).toMatch(/15[:：]00/);
    expect(out).not.toContain('-');
  });
});

describe('formatDayLabel', () => {
  it('formats YYYY.MM.DD with weekday', () => {
    // 2026-03-21 是星期六
    const label = formatDayLabel('2026-03-21T12:30:00+08:00');
    expect(label.startsWith('2026.03.21')).toBe(true);
    expect(label).toContain('星期六');
  });
});

describe('formatDayHeader', () => {
  it('formats Chinese long-form date with weekday', () => {
    const header = formatDayHeader('2026-03-21T12:30:00+08:00');
    expect(header).toContain('3');
    expect(header).toContain('21');
    expect(header).toContain('星期六');
  });
});

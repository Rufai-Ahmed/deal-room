import { describe, expect, it } from 'vitest';
import { formatBytes, formatDuration } from './format';

describe('formatDuration', () => {
  it('reads in seconds under a minute', () => {
    expect(formatDuration(8_400)).toBe('8s');
  });

  it('splits minutes and seconds', () => {
    expect(formatDuration(486_000)).toBe('8m 6s');
  });

  it('splits hours and minutes', () => {
    expect(formatDuration(3_900_000)).toBe('1h 5m');
  });

  it('shows nothing rather than a negative for an unrecorded view', () => {
    expect(formatDuration(0)).toBe('0s');
    expect(formatDuration(-100)).toBe('0s');
  });
});

describe('formatBytes', () => {
  it('keeps small files in bytes', () => {
    expect(formatBytes(512)).toBe('512 B');
  });

  it('drops the decimal once the number is large enough to not need it', () => {
    expect(formatBytes(1_048_576)).toBe('1.0 MB');
    expect(formatBytes(15 * 1_048_576)).toBe('15 MB');
  });
});

import { describe, it, expect } from 'vitest';
import {
  BT_DRAWDOWN,
  BT_NEGATIVE,
  BT_POSITIVE,
  coreMetricTone,
  deltaVsMini,
  fmtCoreMetric,
  fmtDuration,
  fmtNum,
  percentileTone,
  resilienceTone,
} from './format';

describe('deltaVsMini', () => {
  it('computes a signed relative change', () => {
    expect(deltaVsMini(110, 100)).toBeCloseTo(10);
    expect(deltaVsMini(90, 100)).toBeCloseTo(-10);
  });

  it('uses the absolute base so the sign is the direction of change', () => {
    expect(deltaVsMini(-5, -10)).toBeCloseTo(50);
  });

  it('returns null when the reference is ≈ 0', () => {
    expect(deltaVsMini(5, 0)).toBeNull();
    expect(deltaVsMini(5, 1e-12)).toBeNull();
  });

  it('returns null for missing inputs', () => {
    expect(deltaVsMini(null, 10)).toBeNull();
    expect(deltaVsMini(10, undefined)).toBeNull();
  });
});

describe('fmtNum / fmtCoreMetric', () => {
  it('renders infinities and gaps explicitly', () => {
    expect(fmtNum(Infinity)).toBe('∞');
    expect(fmtNum(-Infinity)).toBe('−∞');
    expect(fmtNum(null)).toBe('—');
  });

  it('uses the unit and precision of each core metric', () => {
    expect(fmtCoreMetric('roi', 12.345)).toBe('12.35%');
    expect(fmtCoreMetric('winrate', 55.56)).toBe('55.6%');
    expect(fmtCoreMetric('trades', 1200)).toBe('1,200');
  });
});

describe('coreMetricTone', () => {
  it('paints drawdown amber even though the value is positive', () => {
    expect(coreMetricTone('maxdd', 12)).toBe(BT_DRAWDOWN);
  });

  it('uses metric-specific thresholds', () => {
    expect(coreMetricTone('pf', 1.2)).toBe(BT_POSITIVE);
    expect(coreMetricTone('pf', 0.8)).toBe(BT_NEGATIVE);
    expect(coreMetricTone('winrate', 51)).toBe(BT_POSITIVE);
    expect(coreMetricTone('winrate', 49)).toBe(BT_NEGATIVE);
  });

  it('keeps counters neutral', () => {
    expect(coreMetricTone('trades', 100)).not.toBe(BT_POSITIVE);
  });
});

describe('percentileTone', () => {
  it('follows the 40-60 / 25-75 zones', () => {
    expect(percentileTone(50)).toBe(BT_POSITIVE);
    expect(percentileTone(30)).toBe('text-amber-300');
    expect(percentileTone(10)).toBe(BT_NEGATIVE);
    expect(percentileTone(90)).toBe(BT_NEGATIVE);
  });
});

describe('resilienceTone', () => {
  it('splits at 80 and 50', () => {
    expect(resilienceTone(85)).toBe(BT_POSITIVE);
    expect(resilienceTone(60)).not.toBe(BT_POSITIVE);
    expect(resilienceTone(40)).toBe(BT_NEGATIVE);
  });
});

describe('fmtDuration', () => {
  it('formats a duration as 3d 5h 30m', () => {
    expect(fmtDuration(24 * 3 + 5.5)).toBe('3d 5h 30m');
    expect(fmtDuration(0.5)).toBe('30m');
    expect(fmtDuration(5.5)).toBe('5h 30m');
  });
});

import { describe, it, expect } from 'vitest';
import {
  COMPARATIVE_METRICS,
  aggregateMetricComparison,
  computeBoxplotStats,
  computeImprovementDomain,
  computeImprovementPct,
  computeOutcomes,
  formatImprovementPct,
  formatMetricValue,
  getComparativeMetric,
  percentileCont,
} from './comparativeWidgetStats';

describe('COMPARATIVE_METRICS', () => {
  it('keeps the fixed order of the 10 supported metrics', () => {
    expect(COMPARATIVE_METRICS.map((m) => m.label)).toEqual([
      'Cycle Count',
      'Median MFE',
      'Median MAE',
      'Median AIR',
      'Hit Rate',
      'Profit Factor',
      'MaxDD',
      'PnL',
      'ROI',
      'Profit Factor cycle adjusted',
    ]);
  });

  it('assigns MaxDD lower_is_better and Median MAE lower_magnitude_is_better', () => {
    expect(getComparativeMetric('max_dd').direction).toBe('lower_is_better');
    expect(getComparativeMetric('median_mae').direction).toBe('lower_magnitude_is_better');
  });
});

describe('computeImprovementPct', () => {
  it('treats growth as improvement for higher_is_better', () => {
    expect(computeImprovementPct('higher_is_better', 100, 110)).toBeCloseTo(10);
    expect(computeImprovementPct('higher_is_better', 100, 90)).toBeCloseTo(-10);
  });

  it('normalizes by the baseline magnitude for negative baselines', () => {
    expect(computeImprovementPct('higher_is_better', -50, -25)).toBeCloseTo(50);
  });

  it('treats a drop as improvement for lower_is_better (MaxDD)', () => {
    expect(computeImprovementPct('lower_is_better', 20, 15)).toBeCloseTo(25);
    expect(computeImprovementPct('lower_is_better', 20, 25)).toBeCloseTo(-25);
  });

  it('compares magnitudes for lower_magnitude_is_better (negative MAE)', () => {
    // AC9: smaller magnitude of a negative MAE is an improvement.
    expect(computeImprovementPct('lower_magnitude_is_better', -4, -3)).toBeCloseTo(25);
    expect(computeImprovementPct('lower_magnitude_is_better', -4, -5)).toBeCloseTo(-25);
  });

  it('returns 0 when both baseline and current are 0', () => {
    expect(computeImprovementPct('higher_is_better', 0, 0)).toBe(0);
  });

  it('reports zero_baseline when only the baseline is 0', () => {
    expect(computeImprovementPct('higher_is_better', 0, 5)).toEqual({
      status: 'not_calculable',
      reason: 'zero_baseline',
    });
  });

  it('reports missing_value for non-finite input', () => {
    expect(computeImprovementPct('higher_is_better', null, 5).reason).toBe('missing_value');
    expect(computeImprovementPct('higher_is_better', 5, undefined).reason).toBe('missing_value');
  });
});

describe('percentileCont', () => {
  it('interpolates linearly between neighbours', () => {
    expect(percentileCont([1, 2, 3, 4], 0.5)).toBeCloseTo(2.5);
    expect(percentileCont([1, 2, 3, 4], 0.25)).toBeCloseTo(1.75);
    expect(percentileCont([1, 2, 3, 4], 0.75)).toBeCloseTo(3.25);
  });

  it('returns exact values at the boundaries and for odd counts', () => {
    expect(percentileCont([5, 1, 3], 0.5)).toBe(3);
    expect(percentileCont([5, 1, 3], 0)).toBe(1);
    expect(percentileCont([5, 1, 3], 1)).toBe(5);
  });

  it('handles single-value and empty input', () => {
    expect(percentileCont([7], 0.25)).toBe(7);
    expect(percentileCont([], 0.5)).toBeNull();
  });
});

describe('computeBoxplotStats', () => {
  it('computes quartiles, IQR and fences', () => {
    const stats = computeBoxplotStats([1, 2, 3, 4]);
    expect(stats.q1).toBeCloseTo(1.75);
    expect(stats.median).toBeCloseTo(2.5);
    expect(stats.q3).toBeCloseTo(3.25);
    expect(stats.iqr).toBeCloseTo(1.5);
    expect(stats.lowerFence).toBeCloseTo(-0.5);
    expect(stats.upperFence).toBeCloseTo(5.5);
  });

  it('keeps whiskers inside the fences, excluding outliers', () => {
    const stats = computeBoxplotStats([1, 2, 3, 4, 100]);
    expect(stats.whiskerMax).toBe(4);
    expect(stats.whiskerMin).toBe(1);
  });

  it('collapses to a single point when all values are equal', () => {
    const stats = computeBoxplotStats([0, 0, 0]);
    expect(stats).toMatchObject({ median: 0, q1: 0, q3: 0, whiskerMin: 0, whiskerMax: 0 });
  });

  it('spans both sides when the distribution crosses zero', () => {
    const stats = computeBoxplotStats([-10, -5, 5, 10]);
    expect(stats.whiskerMin).toBeLessThan(0);
    expect(stats.whiskerMax).toBeGreaterThan(0);
  });

  it('returns null for empty input', () => {
    expect(computeBoxplotStats([])).toBeNull();
  });
});

describe('computeOutcomes', () => {
  it('splits values into improved, worsened and unchanged', () => {
    const outcomes = computeOutcomes([5, -5, 0, 0]);
    expect(outcomes.improvedCount).toBe(1);
    expect(outcomes.worsenedCount).toBe(1);
    expect(outcomes.unchangedCount).toBe(2);
    expect(outcomes.eligibleEpochCount).toBe(4);
  });

  it('produces shares that sum to 100', () => {
    const outcomes = computeOutcomes([1, 2, -3, 0, 0, 0, 4]);
    const sum = outcomes.improvedShare + outcomes.worsenedShare + outcomes.unchangedShare;
    expect(sum).toBeCloseTo(100);
  });

  it('reports zero shares for empty input', () => {
    expect(computeOutcomes([])).toMatchObject({ eligibleEpochCount: 0, improvedShare: 0 });
  });
});

describe('aggregateMetricComparison', () => {
  const higher = getComparativeMetric('pnl');

  it('aggregates boxplot stats and outcomes', () => {
    const result = aggregateMetricComparison({
      metric: higher,
      baselineValue: 100,
      currentValues: [90, 100, 110, 120],
    });

    expect(result.status).toBe('available');
    expect(result.eligibleEpochCount).toBe(4);
    expect(result.medianImprovementPct).toBeCloseTo(5);
    expect(result.medianCurrentValue).toBeCloseTo(105);
    expect(result.improvedCount).toBe(2);
    expect(result.worsenedCount).toBe(1);
    expect(result.unchangedCount).toBe(1);
  });

  it('marks the metric not_calculable with zero_baseline (AC11)', () => {
    const result = aggregateMetricComparison({
      metric: higher,
      baselineValue: 0,
      currentValues: [1, 2, 3],
    });

    expect(result.status).toBe('not_calculable');
    expect(result.reason).toBe('zero_baseline');
    expect(result.eligibleEpochCount).toBe(0);
    expect(result.medianImprovementPct).toBeUndefined();
  });

  it('reports 100% unchanged when every epoch equals the baseline (AC12)', () => {
    const result = aggregateMetricComparison({
      metric: higher,
      baselineValue: 42,
      currentValues: [42, 42, 42],
    });

    expect(result.medianImprovementPct).toBe(0);
    expect(result.q1ImprovementPct).toBe(0);
    expect(result.q3ImprovementPct).toBe(0);
    expect(result.whiskerMinImprovementPct).toBe(0);
    expect(result.whiskerMaxImprovementPct).toBe(0);
    expect(result.unchangedShare).toBeCloseTo(100);
  });

  it('skips epochs with missing values but keeps the rest eligible', () => {
    const result = aggregateMetricComparison({
      metric: higher,
      baselineValue: 100,
      currentValues: [110, null, undefined, 120],
    });

    expect(result.status).toBe('available');
    expect(result.eligibleEpochCount).toBe(2);
  });

  it('is not_calculable when the baseline value is missing', () => {
    const result = aggregateMetricComparison({
      metric: higher,
      baselineValue: null,
      currentValues: [110, 120],
    });

    expect(result.status).toBe('not_calculable');
    expect(result.reason).toBe('missing_baseline_value');
  });
});

describe('computeImprovementDomain', () => {
  it('always includes 0 and pads the extremes', () => {
    const domain = computeImprovementDomain([
      { status: 'available', whiskerMinImprovementPct: 2, whiskerMaxImprovementPct: 10 },
    ]);
    expect(domain.min).toBeLessThan(0);
    expect(domain.max).toBeGreaterThan(10);
  });

  it('spans both sides for distributions crossing zero', () => {
    const domain = computeImprovementDomain([
      { status: 'available', whiskerMinImprovementPct: -8, whiskerMaxImprovementPct: 4 },
      { status: 'available', whiskerMinImprovementPct: -2, whiskerMaxImprovementPct: 12 },
    ]);
    expect(domain.min).toBeLessThan(-8);
    expect(domain.max).toBeGreaterThan(12);
  });

  it('ignores metrics that are not calculable', () => {
    const domain = computeImprovementDomain([
      { status: 'not_calculable', whiskerMinImprovementPct: -500, whiskerMaxImprovementPct: 500 },
    ]);
    expect(domain).toEqual({ min: -1, max: 1 });
  });
});

describe('formatters', () => {
  it('formats values by unit', () => {
    expect(formatMetricValue(582.4, 'integer')).toBe('582');
    expect(formatMetricValue(12.3456, 'percentage')).toBe('12.35%');
    expect(formatMetricValue(0.0037324, 'percentage')).toBe('0.0037%');
    expect(formatMetricValue(1.239, 'decimal')).toBe('1.24');
    expect(formatMetricValue(1234567.891, 'number')).toBe('1,234,567.89');
    expect(formatMetricValue(null, 'decimal')).toBe('—');
  });

  it('formats improvement with an explicit sign', () => {
    expect(formatImprovementPct(6.244)).toBe('+6.24%');
    expect(formatImprovementPct(-6.244)).toBe('−6.24%');
    expect(formatImprovementPct(0)).toBe('0.00%');
    expect(formatImprovementPct(null)).toBe('—');
  });
});

import { describe, it, expect } from 'vitest';
import { buildComparativeWidgetResponse } from './comparativeWidgetMock';

const RUN_ID = 'hr1::hr1-1';

describe('buildComparativeWidgetResponse', () => {
  it('returns no comparisons for Stage 1', () => {
    const res = buildComparativeWidgetResponse({ runId: RUN_ID, currentStage: 1 });
    expect(res.comparisons).toEqual([]);
  });

  it('returns one block per previous stage, ordered by ascending baseline stage', () => {
    expect(
      buildComparativeWidgetResponse({ runId: RUN_ID, currentStage: 2 }).comparisons.map((c) => c.baselineStage),
    ).toEqual([1]);
    expect(
      buildComparativeWidgetResponse({ runId: RUN_ID, currentStage: 3 }).comparisons.map((c) => c.baselineStage),
    ).toEqual([1, 2]);
    expect(
      buildComparativeWidgetResponse({ runId: RUN_ID, currentStage: 4 }).comparisons.map((c) => c.baselineStage),
    ).toEqual([1, 2, 3]);
  });

  it('is deterministic for the same run and stage', () => {
    const a = buildComparativeWidgetResponse({ runId: RUN_ID, currentStage: 3 });
    const b = buildComparativeWidgetResponse({ runId: RUN_ID, currentStage: 3 });
    expect(a).toEqual(b);
  });

  it('reuses the same current-stage epoch set across all comparison blocks', () => {
    const res = buildComparativeWidgetResponse({ runId: RUN_ID, currentStage: 4 });
    const available = res.comparisons.filter((c) => c.baselineStatus === 'available');
    const medians = available.map((c) => c.metrics.find((m) => m.metric === 'hit_rate').medianCurrentValue);
    medians.forEach((value) => expect(value).toBeCloseTo(medians[0], 10));
  });

  it('carries all 10 metrics with boxplot stats and outcomes per available block', () => {
    const res = buildComparativeWidgetResponse({ runId: RUN_ID, currentStage: 3 });
    const block = res.comparisons.find((c) => c.baselineStage === 1);

    expect(block.metrics).toHaveLength(10);
    expect(block.baselineEpochId).toBe(2);

    const mfe = block.metrics.find((m) => m.metric === 'median_mfe');
    expect(mfe.status).toBe('available');
    expect(mfe.eligibleEpochCount).toBe(100);
    expect(mfe.q1ImprovementPct).toBeLessThanOrEqual(mfe.medianImprovementPct);
    expect(mfe.medianImprovementPct).toBeLessThanOrEqual(mfe.q3ImprovementPct);
    expect(mfe.whiskerMinImprovementPct).toBeLessThanOrEqual(mfe.q1ImprovementPct);
    expect(mfe.whiskerMaxImprovementPct).toBeGreaterThanOrEqual(mfe.q3ImprovementPct);
    expect(mfe.improvedShare + mfe.worsenedShare + mfe.unchangedShare).toBeCloseTo(100);
  });

  it('exposes a zero_baseline metric without blocking the other metrics', () => {
    const res = buildComparativeWidgetResponse({ runId: RUN_ID, currentStage: 4 });
    const block = res.comparisons.find((c) => c.baselineStage === 3);
    const zero = block.metrics.find((m) => m.metric === 'profit_factor_cycle_adjusted');

    expect(zero.status).toBe('not_calculable');
    expect(zero.reason).toBe('zero_baseline');
    expect(block.metrics.filter((m) => m.status === 'available')).toHaveLength(9);
  });

  it('narrows the epoch cloud when the entry was created with filters', () => {
    const filters = {
      logic: 'and',
      groups: [
        {
          logic: 'and',
          conditions: [
            { field: 'Final Score', op: 'GT', value: '0.6' },
            { field: 'median_AIR', op: 'GT', value: '1' },
          ],
        },
      ],
    };
    const unfiltered = buildComparativeWidgetResponse({ runId: RUN_ID, currentStage: 3 });
    const filtered = buildComparativeWidgetResponse({ runId: RUN_ID, currentStage: 3, filters });

    expect(unfiltered.filtersApplied).toBe(0);
    expect(filtered.filtersApplied).toBe(2);
    expect(filtered.currentEpochCount).toBeLessThan(unfiltered.currentEpochCount);
    expect(filtered.comparisons[0].metrics[0].eligibleEpochCount).toBe(filtered.currentEpochCount);
    expect(filtered).toEqual(buildComparativeWidgetResponse({ runId: RUN_ID, currentStage: 3, filters }));
  });

  it('ignores a filters config without conditions', () => {
    const empty = buildComparativeWidgetResponse({
      runId: RUN_ID,
      currentStage: 3,
      filters: { logic: 'and', groups: [{ logic: 'and', conditions: [] }] },
    });
    expect(empty).toEqual(buildComparativeWidgetResponse({ runId: RUN_ID, currentStage: 3 }));
  });

  it('can report an unavailable selected baseline for a single block only', () => {
    const stage4Runs = ['run-a', 'run-b', 'run-c', 'run-d'].map((runId) =>
      buildComparativeWidgetResponse({ runId, currentStage: 4 }),
    );
    const withUnavailable = stage4Runs.find((res) =>
      res.comparisons.some((c) => c.baselineStatus === 'unavailable'),
    );

    expect(withUnavailable).toBeDefined();
    const unavailable = withUnavailable.comparisons.filter((c) => c.baselineStatus === 'unavailable');
    expect(unavailable).toHaveLength(1);
    expect(unavailable[0].baselineStage).toBe(2);
    expect(
      withUnavailable.comparisons.filter((c) => c.baselineStatus === 'available'),
    ).toHaveLength(2);
  });
});

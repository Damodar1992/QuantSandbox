import { describe, it, expect } from 'vitest';
import {
  COMPARISON_WIDGET_ITEM_TYPE,
  RANGE_NARROWING_ITEM_TYPE,
  buildDefaultComparisonWidgetSeedItem,
  countFilterConditions,
  createComparisonWidgetAnalyticsItem,
  filterAnalyticsItemsForStage,
} from './analyticsItems';

const ITEMS = [
  { id: 'h1', type: 'Heatmap' },
  { id: 'r1', type: 'Report' },
  { id: 'rn1', type: RANGE_NARROWING_ITEM_TYPE },
  { id: 'cw1', type: COMPARISON_WIDGET_ITEM_TYPE },
];

describe('filterAnalyticsItemsForStage', () => {
  it('hides the Comparison Widget on Signal (stage 1)', () => {
    const ids = filterAnalyticsItemsForStage(ITEMS, 1).map((i) => i.id);
    expect(ids).toEqual(['h1', 'r1', 'rn1']);
  });

  it('shows the Comparison Widget on stages 2-4', () => {
    [2, 3, 4].forEach((stage) => {
      const types = filterAnalyticsItemsForStage(ITEMS, stage).map((i) => i.type);
      expect(types).toContain(COMPARISON_WIDGET_ITEM_TYPE);
    });
  });

  it('hides Range Narrowing on Risk (stage 4)', () => {
    const types = filterAnalyticsItemsForStage(ITEMS, 4).map((i) => i.type);
    expect(types).not.toContain(RANGE_NARROWING_ITEM_TYPE);
  });

  it('returns the list untouched without a stage', () => {
    expect(filterAnalyticsItemsForStage(ITEMS)).toBe(ITEMS);
  });

  it('handles missing input', () => {
    expect(filterAnalyticsItemsForStage(null, 2)).toEqual([]);
  });
});

describe('countFilterConditions', () => {
  it('sums conditions across groups', () => {
    const filters = {
      logic: 'and',
      groups: [
        { logic: 'and', conditions: [{ field: 'Final Score', op: 'GT', value: '1' }] },
        { logic: 'or', conditions: [{ field: 'median_AIR', op: 'GT' }, { field: 'Hit_Rate', op: 'LT' }] },
      ],
    };
    expect(countFilterConditions(filters)).toBe(3);
  });

  it('returns 0 for empty or missing filters', () => {
    expect(countFilterConditions(null)).toBe(0);
    expect(countFilterConditions({ logic: 'and', groups: [] })).toBe(0);
    expect(countFilterConditions({ logic: 'and', groups: [{ logic: 'and' }] })).toBe(0);
  });
});

describe('createComparisonWidgetAnalyticsItem', () => {
  it('builds an Analytics entry carrying the confirmed filters', () => {
    const filters = { logic: 'or', groups: [{ logic: 'and', conditions: [{ field: 'Hit_Rate', op: 'GT', value: '50' }] }] };
    const item = createComparisonWidgetAnalyticsItem({
      subId: 'hr1-1',
      filters,
      filterPreset: 'Super filter',
      date: '2024-02-01',
    });

    expect(item.type).toBe(COMPARISON_WIDGET_ITEM_TYPE);
    expect(item.status).toBe('Completed');
    expect(item.date).toBe('2024-02-01');
    expect(item.id).toContain('hr1-1-cw-');
    expect(item.runConfig.filters).toEqual(filters);
    expect(item.runConfig.filterPreset).toBe('Super filter');
  });

  it('falls back to empty filters and today for missing input', () => {
    const item = createComparisonWidgetAnalyticsItem({ subId: 'hr2-1' });
    expect(item.runConfig.filters).toEqual({ logic: 'and', groups: [] });
    expect(item.runConfig.filterPreset).toBe('');
    expect(item.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('buildDefaultComparisonWidgetSeedItem', () => {
  it('produces a stable seed entry with filters to inspect', () => {
    const item = buildDefaultComparisonWidgetSeedItem('hr1-1', '2024-01-15');
    expect(item).toMatchObject({
      id: 'hr1-1-cw1',
      date: '2024-01-15',
      type: COMPARISON_WIDGET_ITEM_TYPE,
      status: 'Completed',
    });
    expect(countFilterConditions(item.runConfig.filters)).toBe(3);
  });

  it('is visible on stages 2-4 but not on stage 1', () => {
    const seed = buildDefaultComparisonWidgetSeedItem('hr1-1');
    expect(filterAnalyticsItemsForStage([seed], 1)).toEqual([]);
    expect(filterAnalyticsItemsForStage([seed], 2)).toEqual([seed]);
    expect(filterAnalyticsItemsForStage([seed], 3)).toEqual([seed]);
    expect(filterAnalyticsItemsForStage([seed], 4)).toEqual([seed]);
  });
});

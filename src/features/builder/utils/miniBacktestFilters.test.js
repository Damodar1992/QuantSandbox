import { describe, it, expect } from 'vitest';
import {
  filterMiniBacktestResults,
  countActiveMiniBacktestFilters,
  EMPTY_MINI_BACKTEST_FILTERS,
} from './miniBacktestFilters';

const mockResults = [
  { id: '1', stageId: 1, stageVersionLabel: 'v1', status: 'finished' },
  { id: '2', stageId: 2, stageVersionLabel: 'v2', status: 'in_progress' },
  { id: '3', stageId: 1, stageVersionLabel: 'v1', status: 'finished' },
];

describe('filterMiniBacktestResults', () => {
  it('returns all results with empty filters', () => {
    expect(filterMiniBacktestResults(mockResults, EMPTY_MINI_BACKTEST_FILTERS)).toHaveLength(3);
  });

  it('filters by stage key', () => {
    const result = filterMiniBacktestResults(mockResults, {
      ...EMPTY_MINI_BACKTEST_FILTERS,
      stage: '1',
    });
    expect(result.every((r) => r.stageId === 1)).toBe(true);
  });

  it('filters by version', () => {
    const result = filterMiniBacktestResults(mockResults, {
      ...EMPTY_MINI_BACKTEST_FILTERS,
      version: 'v2',
    });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('2');
  });

  it('returns empty array when no match', () => {
    const result = filterMiniBacktestResults(mockResults, {
      ...EMPTY_MINI_BACKTEST_FILTERS,
      stage: '99',
    });
    expect(result).toHaveLength(0);
  });
});

describe('countActiveMiniBacktestFilters', () => {
  it('returns 0 for empty filters', () => {
    expect(countActiveMiniBacktestFilters(EMPTY_MINI_BACKTEST_FILTERS)).toBe(0);
  });

  it('counts individual active filters', () => {
    expect(countActiveMiniBacktestFilters({ stage: '1', version: '', status: '', tags: [] })).toBe(1);
    expect(countActiveMiniBacktestFilters({ stage: '1', version: 'v1', status: '', tags: [] })).toBe(2);
  });

  it('counts tags as one filter unit regardless of count', () => {
    expect(countActiveMiniBacktestFilters({ stage: '', version: '', status: '', tags: ['t1', 't2'] })).toBe(1);
  });
});

import { describe, it, expect } from 'vitest';
import { normalizeMiniBacktestParams, dedupeMiniBacktestResultIds, epochMetrics } from './miniBacktestEngine';

describe('normalizeMiniBacktestParams', () => {
  it('returns sensible defaults for empty input', () => {
    const cfg = normalizeMiniBacktestParams({});
    expect(cfg.initialBalance).toBe(10000);
    expect(cfg.orderType).toBe('taker');
    expect(cfg.futures).toBe(false);
    expect(cfg.leverage).toBe(1);
  });

  it('converts fee pct to decimal', () => {
    const cfg = normalizeMiniBacktestParams({ feeTaker: 0.1 });
    expect(cfg.feeTaker).toBeCloseTo(0.001);
  });

  it('applies futures leverage correctly', () => {
    const cfg = normalizeMiniBacktestParams({ marketType: 'futures', leverage: 10 });
    expect(cfg.futures).toBe(true);
    expect(cfg.leverage).toBe(10);
  });

  it('computes stopout from pct', () => {
    const cfg = normalizeMiniBacktestParams({ initialBalance: 1000, stopout: 50, stopoutMode: 'pct' });
    expect(cfg.stopout).toBe(500);
  });

  it('handles absolute stopout mode', () => {
    const cfg = normalizeMiniBacktestParams({ initialBalance: 1000, stopout: 200, stopoutMode: 'abs' });
    expect(cfg.stopout).toBe(200);
  });
});

describe('dedupeMiniBacktestResultIds', () => {
  it('returns same array if no duplicates', () => {
    const data = [{ id: 'a' }, { id: 'b' }];
    expect(dedupeMiniBacktestResultIds(data)).toBe(data);
  });

  it('renames duplicate ids', () => {
    const data = [{ id: 'a' }, { id: 'a', paramsHash: 'hash1' }];
    const result = dedupeMiniBacktestResultIds(data);
    expect(result[0].id).toBe('a');
    expect(result[1].id).toBe('a::hash1');
  });

  it('handles empty array', () => {
    expect(dedupeMiniBacktestResultIds([])).toEqual([]);
  });
});

describe('epochMetrics', () => {
  it('returns zero values for empty cycles', () => {
    const m = epochMetrics([]);
    expect(m.N).toBe(0);
    expect(m.hitRate).toBe(0);
  });

  it('computes hitRate correctly', () => {
    const cycles = [
      { P0: 100, P_exit: 110, mfe_pct: 12, mae_pct: 2, duration_candles: 5, idx_mfe: 3, idx_mae: 1 },
      { P0: 100, P_exit: 95, mfe_pct: 5, mae_pct: 6, duration_candles: 3, idx_mfe: 2, idx_mae: 2 },
    ];
    const m = epochMetrics(cycles);
    expect(m.N).toBe(2);
    expect(m.hitRate).toBe(50);
  });
});

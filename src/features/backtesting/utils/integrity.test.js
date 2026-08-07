import { describe, it, expect } from 'vitest';
import { BT_INTEGRITY_LEVEL } from '@/constants/backtesting';
import {
  checkIntegrity,
  combinationCompleteness,
  isCombinationComplete,
  saveBlockers,
} from './integrity';

const backtest = {
  epochLabel: 'Epoch #126',
  params: {
    pair: 'BTC/USDT',
    timeframe: '1h',
    exchange: 'binance',
    stakeMode: 'fixed',
    profitReserving: null,
    startingCapital: 10000,
    periodFrom: '2023-01-01',
    periodTo: '2023-06-30',
  },
};

const child = (overrides = {}) => ({
  epochLabel: 'Epoch #126',
  inherited: {
    pair: 'BTC/USDT',
    timeframe: '1h',
    exchange: 'binance',
    stakeMode: 'fixed',
    profitReserving: null,
    startingCapital: 10000,
    ...overrides,
  },
  config: {},
});

describe('checkIntegrity', () => {
  it('returns ok when every line matches', () => {
    const result = checkIntegrity({
      backtest,
      shufflerRun: child(),
      syntheticRun: child(),
    });
    expect(result.level).toBe(BT_INTEGRITY_LEVEL.OK);
    expect(result.items).toEqual([]);
  });

  it('blocks on a critical mismatch', () => {
    const result = checkIntegrity({
      backtest,
      shufflerRun: child({ timeframe: '4h' }),
      syntheticRun: child(),
    });
    expect(result.level).toBe(BT_INTEGRITY_LEVEL.BLOCK);
    expect(result.items.map((i) => i.field)).toContain('timeframe');
  });

  it('only warns on a conditional mismatch', () => {
    const result = checkIntegrity({
      backtest,
      shufflerRun: child({ startingCapital: 25000 }),
      syntheticRun: child(),
    });
    expect(result.level).toBe(BT_INTEGRITY_LEVEL.WARN);
  });

  it('warns about a synthetic run built on a custom period', () => {
    const synthetic = child();
    synthetic.config = { source: 'custom' };
    const result = checkIntegrity({ backtest, shufflerRun: child(), syntheticRun: synthetic });
    expect(result.level).toBe(BT_INTEGRITY_LEVEL.WARN);
    expect(result.customPeriod).toBe(true);
  });

  it('does not complain about missing lines', () => {
    const result = checkIntegrity({ backtest, shufflerRun: null, syntheticRun: null });
    expect(result.level).toBe(BT_INTEGRITY_LEVEL.OK);
  });
});

describe('combinationCompleteness', () => {
  it('counts the always-present backtest line', () => {
    expect(combinationCompleteness({})).toBe(1);
    expect(combinationCompleteness({ shufflerRunId: 'a' })).toBe(2);
    expect(isCombinationComplete({ shufflerRunId: 'a', syntheticRunId: 'b' })).toBe(true);
  });
});

describe('saveBlockers', () => {
  it('lists every reason Save is disabled', () => {
    const blockers = saveBlockers({
      analytics: {},
      integrityLevel: BT_INTEGRITY_LEVEL.BLOCK,
      duplicate: true,
    });
    expect(blockers).toHaveLength(4);
  });

  it('is empty for a complete, comparable, unique combination', () => {
    const blockers = saveBlockers({
      analytics: { shufflerRunId: 'a', syntheticRunId: 'b' },
      integrityLevel: BT_INTEGRITY_LEVEL.OK,
      duplicate: false,
    });
    expect(blockers).toEqual([]);
  });
});

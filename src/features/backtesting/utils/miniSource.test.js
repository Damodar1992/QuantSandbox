import { describe, it, expect } from 'vitest';
import { deriveMiniOptions, diffAgainstMini, miniToBacktestParams } from './miniSource';

const entry = (overrides = {}) => ({
  id: 'mbt-1',
  epochId: 'favorite-risk-epoch-1',
  epochNumber: 126,
  pairs: 'BTC/USDT',
  timeframe: '1h',
  exchange: 'binance',
  tradingMode: 'spot',
  timeFrameStart: '2023-01-01',
  timeFrameEnd: '2023-06-30',
  createdAt: '2026-07-01T10:00:00.000Z',
  params: {
    initialBalance: 10000,
    stakeMode: 'fixed',
    fixedStakeAmount: 100,
    relativeStakeAmount: 10,
    reservedPct: 0,
    feeMaker: 0.05,
    feeTaker: 0.05,
    leverage: 5,
    marketType: 'spot',
  },
  result: { summary: { roiTotal: 12.5, pnlNet: 1250, maxDDTradIntra: 8.2, pfNet: 1.6, winRate: 55, execCount: 120 } },
  ...overrides,
});

describe('miniToBacktestParams', () => {
  it('forces leverage to 1 on spot', () => {
    expect(miniToBacktestParams(entry()).leverage).toBe(1);
  });

  it('keeps the mini leverage on futures', () => {
    const params = miniToBacktestParams(entry({ tradingMode: 'futures' }));
    expect(params.leverage).toBe(5);
  });

  it('turns a zero reserve into off (null)', () => {
    expect(miniToBacktestParams(entry()).profitReserving).toBeNull();
  });

  it('reads the relative stake when the mode is relative', () => {
    const e = entry();
    e.params.stakeMode = 'relative';
    expect(miniToBacktestParams(e).stakeValue).toBe(10);
  });

  it('parses the period out of a dash-joined time range', () => {
    const e = entry({ timeFrameStart: undefined, timeFrameEnd: undefined, timeRange: '2020-01-01 – 2023-06-01' });
    const params = miniToBacktestParams(e);
    expect(params.periodFrom).toBe('2020-01-01');
    expect(params.periodTo).toBe('2023-06-01');
  });
});

describe('deriveMiniOptions', () => {
  it('numbers finished minis of the epoch by creation time', () => {
    const older = entry({ id: 'mbt-old', createdAt: '2026-06-01T10:00:00.000Z' });
    const newer = entry({ id: 'mbt-new', createdAt: '2026-08-01T10:00:00.000Z' });
    const options = deriveMiniOptions([newer, older], 'favorite-risk-epoch-1');
    expect(options.map((o) => o.name)).toEqual(['Mini#1', 'Mini#2']);
    expect(options[0].id).toBe('mbt-old');
  });

  it('skips minis of other epochs and unfinished runs', () => {
    const other = entry({ id: 'mbt-other', epochId: 'another-epoch' });
    const unfinished = entry({ id: 'mbt-run', result: null });
    const options = deriveMiniOptions([other, unfinished, entry()], 'favorite-risk-epoch-1');
    expect(options).toHaveLength(1);
    expect(options[0].id).toBe('mbt-1');
  });

  it('exposes the manual mini fees next to the derived exchange fees', () => {
    const [option] = deriveMiniOptions([entry()], 'favorite-risk-epoch-1');
    expect(option.manualFees).toEqual({ maker: 0.05, taker: 0.05, funding: false });
    expect(option.derivedFees.maker).toBe(0.1);
  });
});

describe('diffAgainstMini', () => {
  it('returns an empty list for an untouched copy', () => {
    const params = miniToBacktestParams(entry());
    expect(diffAgainstMini(params, params)).toEqual([]);
  });

  it('reports exactly the changed fields', () => {
    const base = miniToBacktestParams(entry());
    const edited = { ...base, pair: 'ETH/USDT', startingCapital: 20000 };
    expect(diffAgainstMini(edited, base).sort()).toEqual(['pair', 'startingCapital']);
  });

  it('treats null and empty reserve as equal', () => {
    const base = miniToBacktestParams(entry());
    expect(diffAgainstMini({ ...base, profitReserving: null }, base)).toEqual([]);
  });
});

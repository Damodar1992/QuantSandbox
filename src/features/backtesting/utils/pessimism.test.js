import { describe, it, expect } from 'vitest';
import {
  btRound,
  computePessimismGrid,
  createDefaultPessimismLevels,
  formatPessimismSummary,
  levelTargets,
} from './pessimism';

const ORIGINAL = { mcl: 5, mcw: 8, acl: 2, acw: 2.5, wins: 120, losses: 80 };

describe('btRound', () => {
  it('rounds half up as floor(x + 0.5)', () => {
    expect(btRound(2.5)).toBe(3);
    expect(btRound(2.49)).toBe(2);
    expect(btRound(-2.5)).toBe(-2);
  });
});

describe('levelTargets', () => {
  it('makes loss streaks longer and win streaks shorter as the level grows', () => {
    const l2 = levelTargets('L2', ORIGINAL);
    const l5 = levelTargets('L5', ORIGINAL);
    expect(l5.mcl).toBeGreaterThan(l2.mcl);
    expect(l5.mcw).toBeLessThan(l2.mcw);
  });
});

describe('computePessimismGrid', () => {
  it('computes runs as floor(share × shuffles) for enabled levels only', () => {
    const levels = [
      { level: 'L2', enabled: true, sharePct: 25 },
      { level: 'L3', enabled: false, sharePct: 20 },
    ];
    const grid = computePessimismGrid(levels, 500, ORIGINAL);
    expect(grid.rows[0].runsN).toBe(125);
    expect(grid.rows[1].runsN).toBe(0);
  });

  it('sends the remainder to the random section', () => {
    const levels = [{ level: 'L2', enabled: true, sharePct: 40 }];
    const grid = computePessimismGrid(levels, 1000, ORIGINAL);
    expect(grid.randomSharePct).toBe(60);
    expect(grid.randomRunsN).toBe(600);
  });

  it('reports an error when enabled shares exceed 100%', () => {
    const levels = [
      { level: 'L2', enabled: true, sharePct: 70 },
      { level: 'L3', enabled: true, sharePct: 45 },
    ];
    const grid = computePessimismGrid(levels, 100, ORIGINAL);
    expect(grid.error).toBeTruthy();
  });

  it('caps an unreachable MCL target at the number of losing trades', () => {
    const levels = [{ level: 'L5', enabled: true, sharePct: 100 }];
    const grid = computePessimismGrid(levels, 100, { ...ORIGINAL, mcl: 40, losses: 12 });
    expect(grid.rows[0].achievable.mcl).toBe(12);
  });

  it('leaves MCL achievable empty when the MCL target is reachable', () => {
    const levels = [{ level: 'L1', enabled: true, sharePct: 10 }];
    const grid = computePessimismGrid(levels, 100, ORIGINAL);
    expect(grid.rows[0].achievable.mcl).toBeUndefined();
  });

  it('marks L4 MCL unreachable when target exceeds losses (10 → 8)', () => {
    const levels = [{ level: 'L4', enabled: true, sharePct: 10 }];
    const grid = computePessimismGrid(levels, 100, {
      mcl: 5,
      mcw: 8,
      acl: 2.38,
      acw: 2.71,
      wins: 120,
      losses: 8,
    });
    expect(grid.rows[0].targets.mcl).toBe(10);
    expect(grid.rows[0].achievable.mcl).toBe(8);
  });

  it('marks L1/L2 ACL unreachable at the soft ceiling (→ 3.07 / 3.08)', () => {
    const bag = { mcl: 5, mcw: 8, acl: 2.38, acw: 2.71, wins: 120, losses: 8 };
    const l1 = computePessimismGrid([{ level: 'L1', enabled: true, sharePct: 10 }], 100, bag).rows[0];
    const l2 = computePessimismGrid([{ level: 'L2', enabled: true, sharePct: 10 }], 100, bag).rows[0];
    expect(l1.targets.aclRange).toBe('2-3');
    expect(l1.achievable.acl).toBe(3.07);
    expect(l2.targets.aclRange).toBe('2-3');
    expect(l2.achievable.acl).toBe(3.08);
  });
});

describe('formatPessimismSummary', () => {
  it('returns off when the stress-test is disabled', () => {
    expect(formatPessimismSummary({ stressTestEnabled: false })).toBe('off');
  });

  it('lists enabled levels with their run counts', () => {
    const summary = formatPessimismSummary({
      stressTestEnabled: true,
      shufflesN: 500,
      original: ORIGINAL,
      pessimismLevels: createDefaultPessimismLevels(),
    });
    expect(summary).toContain('L2 125');
    expect(summary).not.toContain('L1 ');
  });
});

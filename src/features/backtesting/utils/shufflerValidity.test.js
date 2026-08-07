import { describe, it, expect } from 'vitest';
import { isMetricValid, metricValidity, validityTag } from './shufflerValidity';

describe('metricValidity', () => {
  it('keeps Max Drawdown valid in every mode', () => {
    expect(isMetricValid('maxdd', { simulationMode: 'static' })).toBe(true);
    expect(isMetricValid('maxdd', { simulationMode: 'dynamic' })).toBe(true);
  });

  it('invalidates ROI, PnL and PF under STATIC without a stop-out', () => {
    ['roi', 'pnl', 'pf'].forEach((key) => {
      expect(isMetricValid(key, { simulationMode: 'static' })).toBe(false);
    });
  });

  it('validates ROI, PnL and PF under DYNAMIC', () => {
    ['roi', 'pnl', 'pf'].forEach((key) => {
      expect(isMetricValid(key, { simulationMode: 'dynamic' })).toBe(true);
    });
  });

  it('re-validates STATIC metrics when a run stopped out', () => {
    expect(isMetricValid('roi', { simulationMode: 'static', hasStopOut: true })).toBe(true);
  });

  it('keeps Win Rate and Total Trades invalid under DYNAMIC without a stop-out', () => {
    expect(isMetricValid('winrate', { simulationMode: 'dynamic' })).toBe(false);
    expect(isMetricValid('trades', { simulationMode: 'dynamic' })).toBe(false);
  });

  it('validates Win Rate and Total Trades only with a stop-out', () => {
    expect(isMetricValid('winrate', { simulationMode: 'static', hasStopOut: true })).toBe(true);
    expect(isMetricValid('trades', { simulationMode: 'dynamic', hasStopOut: true })).toBe(true);
  });

  it('always explains why a metric is N/A', () => {
    const { valid, reason } = metricValidity('roi', { simulationMode: 'static' });
    expect(valid).toBe(false);
    expect(typeof reason).toBe('string');
    expect(reason.length).toBeGreaterThan(0);
  });
});

describe('validityTag', () => {
  it('tags valid and invalid metrics differently', () => {
    expect(validityTag('maxdd', { simulationMode: 'static' })).toBe('Valid');
    expect(validityTag('pf', { simulationMode: 'static' })).toBe('N/A · Shuffler');
  });
});

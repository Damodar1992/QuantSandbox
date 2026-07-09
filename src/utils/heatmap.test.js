import { describe, it, expect } from 'vitest';
import { clamp, quantile, normalizeParam, buildHeatMap } from './heatmap';

describe('clamp', () => {
  it('clamps below minimum', () => {
    expect(clamp(-0.5)).toBe(0);
  });

  it('clamps above maximum', () => {
    expect(clamp(1.5)).toBe(1);
  });

  it('passes through value within range', () => {
    expect(clamp(0.5)).toBe(0.5);
  });

  it('respects custom bounds', () => {
    expect(clamp(5, 1, 10)).toBe(5);
    expect(clamp(0, 1, 10)).toBe(1);
    expect(clamp(15, 1, 10)).toBe(10);
  });
});

describe('quantile', () => {
  it('returns 0 for empty array', () => {
    expect(quantile([], 0.5)).toBe(0);
  });

  it('returns median for q=0.5', () => {
    expect(quantile([1, 2, 3, 4, 5], 0.5)).toBe(3);
  });

  it('returns minimum for q=0', () => {
    expect(quantile([1, 2, 3], 0)).toBe(1);
  });

  it('returns maximum for q=1', () => {
    expect(quantile([1, 2, 3], 1)).toBe(3);
  });
});

describe('normalizeParam', () => {
  it('returns 0.5 when min equals max', () => {
    expect(normalizeParam(5, 5, 5)).toBe(0.5);
  });

  it('returns 0 at min boundary', () => {
    expect(normalizeParam(0, 0, 10)).toBe(0);
  });

  it('returns 1 at max boundary', () => {
    expect(normalizeParam(10, 0, 10)).toBe(1);
  });

  it('clamps values outside range', () => {
    expect(normalizeParam(-5, 0, 10)).toBe(0);
    expect(normalizeParam(15, 0, 10)).toBe(1);
  });
});

describe('buildHeatMap', () => {
  const makeItems = (count) =>
    Array.from({ length: count }, (_, i) => ({
      params: { x: i, y: i % 5 },
      score: i / count,
    }));

  it('returns null for empty items', () => {
    expect(buildHeatMap([], { xAxis: ['x'], yAxis: ['y'] })).toBeNull();
  });

  it('returns a grid object for valid input', () => {
    const items = makeItems(50);
    const result = buildHeatMap(items, { xAxis: ['x'], yAxis: ['y'] });
    expect(result).not.toBeNull();
    expect(result).toHaveProperty('N');
    expect(result).toHaveProperty('W');
    expect(result).toHaveProperty('H');
  });

  it('filters by fixedParams', () => {
    const items = [
      { params: { x: 1, y: 1, z: 0 }, score: 0.5 },
      { params: { x: 2, y: 2, z: 1 }, score: 0.7 },
    ];
    const result = buildHeatMap(items, {
      xAxis: ['x'],
      yAxis: ['y'],
      fixedParams: { z: 0 },
    });
    expect(result).not.toBeNull();
  });
});

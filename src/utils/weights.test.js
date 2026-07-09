import { describe, it, expect, vi } from 'vitest';
import { setWeightCapped } from './weights';

describe('setWeightCapped', () => {
  it('calls setter with the raw value when there is room', () => {
    const setter = vi.fn();
    setWeightCapped(setter, 30, 50);
    expect(setter).toHaveBeenCalledWith(30);
  });

  it('caps value when others sum + value would exceed 100', () => {
    const setter = vi.fn();
    setWeightCapped(setter, 60, 70);
    expect(setter).toHaveBeenCalledWith(30); // 100 - 70
  });

  it('clamps negative input to 0', () => {
    const setter = vi.fn();
    setWeightCapped(setter, -10, 50);
    expect(setter).toHaveBeenCalledWith(0);
  });

  it('passes through exactly 100 when othersSum is 0', () => {
    const setter = vi.fn();
    setWeightCapped(setter, 100, 0);
    expect(setter).toHaveBeenCalledWith(100);
  });

  it('returns 0 when others already occupy 100', () => {
    const setter = vi.fn();
    setWeightCapped(setter, 50, 100);
    expect(setter).toHaveBeenCalledWith(0);
  });
});

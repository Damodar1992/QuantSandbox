/**
 * Generate synthetic cycle data from epoch metrics.
 * Each cycle simulates a trade with OHLC data derived from
 * the epoch's MFE, MAE, AIR, HitRate.
 *
 * @param {Object} epoch - { mfe, mae, air, hitRate, score, params }
 * @param {number} count - number of cycles to generate
 * @returns {Array} [{ id, open, close, high, low, duration, direction, mfe, mae }]
 */
export function generateCycleDataForEpoch(epoch, count = 24) {
  const mfe = epoch.mfe || 0.12;
  const mae = epoch.mae != null ? epoch.mae : -0.08;
  const hitRate = epoch.hitRate != null ? epoch.hitRate : 60;

  const cycles = [];
  for (let i = 0; i < count; i++) {
    const isWin = Math.random() < hitRate / 100;
    const basePrice = 100 + Math.random() * 90;
    const direction = Math.random() > 0.5 ? 1 : -1;

    const movePct = isWin
      ? mfe * (0.5 + Math.random() * 0.5)
      : mae * (0.5 + Math.random() * 0.5);

    const open = basePrice;
    const close = open * (1 + movePct * direction);
    const high = Math.max(open, close) * (1 + Math.random() * mfe * 0.3);
    const low = Math.min(open, close) * (1 - Math.random() * Math.abs(mae) * 0.3);

    cycles.push({
      id: `cycle-${i + 1}`,
      open: +open.toFixed(2),
      close: +close.toFixed(2),
      high: +high.toFixed(2),
      low: +low.toFixed(2),
      duration: Math.floor(10 + Math.random() * 90),
      direction,
      mfe: +Math.abs(movePct).toFixed(4),
      mae: +Math.abs(Math.min(0, movePct)).toFixed(4),
    });
  }
  return cycles;
}

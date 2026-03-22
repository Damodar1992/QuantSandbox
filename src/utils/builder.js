/**
 * Build a serializable snapshot of an indicator (for Best result).
 * @param {object} indicator - Indicator object with id, type, params, etc.
 * @returns {object} Snapshot with id, type, displayName, paramsSnapshot
 */
export function buildIndicatorSnapshot(indicator) {
  const paramsSnapshot = {};
  if (Array.isArray(indicator.params)) {
    indicator.params.forEach((param) => {
      const key = param.key || param.name || param.label;
      if (!key) return;
      let value = null;
      if (param.value !== undefined) {
        value = param.value;
      } else if (Array.isArray(param.values) && param.values.length > 0) {
        const idx = Math.floor(Math.random() * param.values.length);
        value = param.values[idx];
      } else if (param.min !== undefined && param.max !== undefined) {
        const min = Number(param.min);
        const max = Number(param.max);
        if (Number.isFinite(min) && Number.isFinite(max) && max > min) {
          value = min + Math.random() * (max - min);
        }
      }
      if (value === null && param.defaultValue !== undefined) {
        value = param.defaultValue;
      }
      paramsSnapshot[key] = value;
    });
  }
  return {
    id: indicator.id,
    type: indicator.type,
    displayName: indicator.displayName || indicator.name || String(indicator.type || ""),
    paramsSnapshot,
  };
}

/**
 * Build a Signal Best result object from params and context.
 * @param {object} params - { label, source, scores, meta, timeRangeOverride }
 * @param {object} context - { signalIndicators, pairs, timeRange, signalHyperoptType }
 * @returns {object} Best result object
 */
export function buildSignalBestResult(
  { label, source, scores, meta, timeRangeOverride },
  { signalIndicators, pairs, timeRange, signalHyperoptType }
) {
  const indicatorSnapshots = signalIndicators.map((ind) => buildIndicatorSnapshot(ind));
  const indicatorsRaw = signalIndicators.map((ind) => ({ ...ind }));
  const numericScoreBase =
    scores && scores.avg != null ? Number(scores.avg) : scores && scores.max != null ? Number(scores.max) : 0.5;
  const randomAround = (base, spread = 0.15) => {
    const v = base + (Math.random() * 2 - 1) * spread;
    return Math.max(-1, Math.min(1, v));
  };
  const score = randomAround(Number.isFinite(numericScoreBase) ? numericScoreBase : 0.5, 0.1);
  const mfe = randomAround(score, 0.2);
  const mae = randomAround(-Math.abs(score), 0.2);
  const air = randomAround(score, 0.25);
  const stability = randomAround(0.5, 0.3);
  return {
    id: `signal-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    source,
    label,
    timestamp: new Date().toISOString(),
    score,
    mfe,
    mae,
    air,
    stability,
    indicators: indicatorSnapshots,
    indicatorsRaw,
    pairs,
    timeRange: timeRangeOverride != null ? timeRangeOverride : timeRange,
    hyperoptType: signalHyperoptType,
    meta,
  };
}

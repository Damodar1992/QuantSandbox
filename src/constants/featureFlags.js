const STORAGE_KEY = "featureFlags";
const DEFAULTS = { miniBacktest: true, formulas: false, backtesting: true };
const ALWAYS_ON = ["miniBacktest", "backtesting"];

function withLockedFlags(flags) {
  const next = { ...flags };
  for (const key of ALWAYS_ON) next[key] = true;
  return next;
}

export function getFeatureFlags() {
  if (typeof window !== "undefined") {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return withLockedFlags({ ...DEFAULTS, ...parsed });
      }
    } catch {
      /* ignore */
    }
  }
  return withLockedFlags({ ...DEFAULTS });
}

export function setFeatureFlag(key, value) {
  const flags = getFeatureFlags();
  flags[key] = value;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(flags));
  } catch {
    /* ignore */
  }
}

export function isMiniBacktestEnabled() {
  return true;
}

export function isFormulasEnabled() {
  return getFeatureFlags().formulas;
}

/** Stage 5 — Backtesting. Always available. */
export function isBacktestingEnabled() {
  return true;
}

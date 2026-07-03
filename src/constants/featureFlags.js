const STORAGE_KEY = "featureFlags";
const DEFAULTS = { miniBacktest: true, formulas: false };

export function getFeatureFlags() {
  if (typeof window !== "undefined") {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...DEFAULTS, ...parsed };
      }
    } catch {
      /* ignore */
    }
  }
  return { ...DEFAULTS };
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
  return getFeatureFlags().miniBacktest;
}

export function isFormulasEnabled() {
  return getFeatureFlags().formulas;
}

/**
 * Default display name for indicator type (used in formulas).
 */
export function getDefaultDisplayName(type) {
  const nameMap = {
    RSI: "rsi",
    EMA: "ema",
    MACD: "macd",
    BBANDS: "bb",
    GC_DW: "gc",
    CUSTOM_FORMULA: "custom",
  };
  return nameMap[type] || type?.toLowerCase() || "";
}

export function prettifyIndicatorParamName(raw) {
  const s = String(raw || "").trim();
  if (!s) return "";
  const lower = s.toLowerCase();
  const m = lower.match(/^(fast|slow|signal)(?:_|-)?period$/);
  if (m) return `${m[1][0].toUpperCase()}${m[1].slice(1)}Period`;
  if (lower === "stddev" || lower === "std_dev" || lower === "std-dev") return "StdDev";
  if (lower === "timeframe" || lower === "time_frame" || lower === "time-frame") return "TimeFrame";
  if (lower === "gc_mult" || lower === "gc-mult") return "Mult";
  const chunks = s.split(/[_-]+/g).filter(Boolean);
  const title = (w) => (w ? `${w[0].toUpperCase()}${w.slice(1)}` : w);
  return chunks.map((c) => title(String(c))).join("") || s;
}

export function formatIndicatorParamValue(key, v) {
  if (v == null) return "-";
  if (typeof v !== "number" || !Number.isFinite(v)) return String(v);
  const k = String(key || "").toLowerCase();
  const wantsInt =
    k.includes("period") ||
    k === "length" ||
    k === "poles" ||
    k.endsWith(".length") ||
    k.endsWith(".poles") ||
    k.endsWith(".fastperiod") ||
    k.endsWith(".slowperiod") ||
    k.endsWith(".signalperiod");
  if (wantsInt) return String(Math.round(v));
  if (k.includes("mult") || k.includes("std") || k.includes("dev")) return v.toFixed(2);
  return Math.abs(v) >= 10 ? String(Math.round(v)) : v.toFixed(2);
}

export function formatIndicatorSnapshot(ind) {
  const prefix = ind?.displayName || getDefaultDisplayName(ind?.type || "");
  const snap = ind?.paramsSnapshot && typeof ind.paramsSnapshot === "object" ? ind.paramsSnapshot : null;
  if (!snap) return "";
  return Object.entries(snap)
    .map(([k, v]) => {
      const name = prettifyIndicatorParamName(k) || String(k);
      const fullKey = `${prefix}.${name}`;
      return `${fullKey}=${formatIndicatorParamValue(fullKey, v)}`;
    })
    .join(", ");
}

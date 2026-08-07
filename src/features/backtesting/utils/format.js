// Stage 5 · formatters and the shared colour semantics (§8.7).
//
// Colour rules:
//   red     — negative values (loss, cost) and unfavourable extremes
//   green   — positive values (profit) and favourable extremes
//   amber   — drawdown magnitudes (written positive, always a loss) and warnings
//   neutral — counters, durations, sizes, dates
//
// `green-*` / `red-*` on purpose: the prod theme remaps `emerald-*` to violet,
// which would erase the profit/loss distinction.

import { BT_CORE_METRIC_BY_KEY, BT_PERCENTILE_ZONES } from "@/constants/backtesting";

export const BT_NEUTRAL = "text-[#d9d9d9]";
export const BT_MUTED = "text-[#8c8c8c]";
export const BT_POSITIVE = "text-green-400";
export const BT_NEGATIVE = "text-red-400";
export const BT_DRAWDOWN = "text-amber-300";

const DASH = "—";

export function isMissing(value) {
  return value === null || value === undefined || value === "" || Number.isNaN(value);
}

/** Fixed-decimal number with ∞ / N/A handling. */
export function fmtNum(value, decimals = 2) {
  if (isMissing(value)) return DASH;
  if (value === Infinity) return "∞";
  if (value === -Infinity) return "−∞";
  const num = Number(value);
  if (!Number.isFinite(num)) return DASH;
  return num.toFixed(decimals);
}

export function fmtPct(value, decimals = 2, signed = false) {
  if (isMissing(value)) return DASH;
  const num = Number(value);
  if (!Number.isFinite(num)) return DASH;
  const sign = signed && num > 0 ? "+" : "";
  return `${sign}${num.toFixed(decimals)}%`;
}

export function fmtMoney(value, decimals = 2, signed = true) {
  if (isMissing(value)) return DASH;
  const num = Number(value);
  if (!Number.isFinite(num)) return DASH;
  const sign = signed && num > 0 ? "+" : "";
  return `${sign}${num.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

export function fmtInt(value) {
  if (isMissing(value)) return DASH;
  const num = Number(value);
  if (!Number.isFinite(num)) return DASH;
  return num.toLocaleString("en-US");
}

/** `2023-01-01 → 2023-06-30` */
export function fmtPeriod(from, to) {
  if (!from && !to) return DASH;
  return `${from || "?"} → ${to || "?"}`;
}

/** `15.01.2026 16:09` */
export function fmtDateTime(iso) {
  if (!iso) return DASH;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(
    d.getMinutes(),
  )}`;
}

/** Formats a core metric value using its own unit and precision. */
export function fmtCoreMetric(metricKey, value) {
  const def = BT_CORE_METRIC_BY_KEY[metricKey];
  if (!def) return fmtNum(value);
  if (isMissing(value)) return DASH;
  if (def.key === "trades") return fmtInt(value);
  if (def.unit === "%") return fmtPct(value, def.decimals);
  if (def.unit === "USDT") return fmtMoney(value, def.decimals, false);
  return fmtNum(value, def.decimals);
}

/** Colour class for a core metric value. */
export function coreMetricTone(metricKey, value) {
  const def = BT_CORE_METRIC_BY_KEY[metricKey];
  if (isMissing(value) || !def) return BT_MUTED;
  if (def.kind === "drawdown") return BT_DRAWDOWN;
  if (def.dir === "neutral") return BT_NEUTRAL;
  const num = Number(value);
  if (!Number.isFinite(num)) return num === Infinity ? BT_POSITIVE : BT_MUTED;
  if (def.key === "pf") return num >= 1 ? BT_POSITIVE : BT_NEGATIVE;
  if (def.key === "winrate") return num >= 50 ? BT_POSITIVE : BT_NEGATIVE;
  return num >= 0 ? BT_POSITIVE : BT_NEGATIVE;
}

/** Colour class for a plain signed number (Δ, PnL, …). */
export function signedTone(value) {
  if (isMissing(value)) return BT_MUTED;
  const num = Number(value);
  if (!Number.isFinite(num)) return BT_MUTED;
  if (num === 0) return BT_NEUTRAL;
  return num > 0 ? BT_POSITIVE : BT_NEGATIVE;
}

/** Percentile zone colour — 40–60 green, 25–75 yellow, outside red. */
export function percentileTone(pct) {
  if (isMissing(pct)) return BT_MUTED;
  const num = Number(pct);
  if (!Number.isFinite(num)) return BT_MUTED;
  const [gLo, gHi] = BT_PERCENTILE_ZONES.green;
  const [yLo, yHi] = BT_PERCENTILE_ZONES.yellow;
  if (num >= gLo && num <= gHi) return BT_POSITIVE;
  if (num >= yLo && num <= yHi) return BT_DRAWDOWN;
  return BT_NEGATIVE;
}

/** Resilience score colouring — ≥80 green · 50–79 neutral · <50 red. */
export function resilienceTone(score) {
  if (isMissing(score)) return BT_MUTED;
  const num = Number(score);
  if (num >= 80) return BT_POSITIVE;
  if (num >= 50) return BT_NEUTRAL;
  return BT_NEGATIVE;
}

/**
 * Δ% against the mini. Returns null when the reference is ≈ 0 —
 * the caller renders N/A with the reason tooltip.
 */
export function deltaVsMini(backtestValue, miniValue) {
  if (isMissing(backtestValue) || isMissing(miniValue)) return null;
  const base = Number(miniValue);
  const value = Number(backtestValue);
  if (!Number.isFinite(base) || !Number.isFinite(value)) return null;
  if (Math.abs(base) < 1e-9) return null;
  return ((value - base) / Math.abs(base)) * 100;
}

/** `3d 5h 30m` */
export function fmtDuration(hours) {
  if (isMissing(hours)) return DASH;
  const total = Math.max(0, Math.round(Number(hours) * 60));
  const d = Math.floor(total / (60 * 24));
  const h = Math.floor((total - d * 60 * 24) / 60);
  const m = total - d * 60 * 24 - h * 60;
  const parts = [];
  if (d) parts.push(`${d}d`);
  if (h || d) parts.push(`${h}h`);
  parts.push(`${m}m`);
  return parts.join(" ");
}

export { DASH };

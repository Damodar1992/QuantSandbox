import React from "react";
import { cx } from "@/constants/ui";
import {
  BT_DRAWDOWN,
  BT_MUTED,
  BT_NEGATIVE,
  BT_POSITIVE,
  fmtInt,
  fmtNum,
  percentileTone,
} from "../utils/format";

export function formatRailValue(value, format, { signed = true } = {}) {
  if (value == null || value === "") return "—";
  if (format === "text") return String(value);
  const num = Number(value);
  if (!Number.isFinite(num)) {
    return compactRailLabel(value);
  }
  const sign = signed && num > 0 ? "+" : "";
  if (format === "pct") return `${sign}${num.toFixed(2)}`;
  if (format === "money") {
    return `${sign}${num.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }
  if (format === "int") return fmtInt(num);
  return fmtNum(num, 2);
}

export function compactRailLabel(value) {
  if (value == null || value === "") return "—";
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return "—";
    const sign = value > 0 ? "+" : "";
    return `${sign}${value.toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })}`;
  }
  return String(value).replace(/%/g, "").replace(/\s*USDT/gi, "").trim() || "—";
}

export function parseNumeric(value) {
  if (value == null || value === "") return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const match = String(value).replace(/,/g, "").match(/[+-]?\d+(?:\.\d+)?/);
  if (!match) return null;
  const num = Number(match[0]);
  return Number.isFinite(num) ? num : null;
}

export function ordinalPct(value) {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n)) return null;
  const mod10 = n % 10;
  const mod100 = n % 100;
  const suffix =
    mod10 === 1 && mod100 !== 11
      ? "st"
      : mod10 === 2 && mod100 !== 12
        ? "nd"
        : mod10 === 3 && mod100 !== 13
          ? "rd"
          : "th";
  return `${n}${suffix} pct`;
}

export function rangePos(value, min, max) {
  const v = parseNumeric(value);
  const a = parseNumeric(min);
  const b = parseNumeric(max);
  if (v == null || a == null || b == null) return 50;
  if (b === a) return 50;
  return Math.max(0, Math.min(100, ((v - a) / (b - a)) * 100));
}

export function distributionDotClass(tone) {
  if (tone === BT_POSITIVE) {
    return "bg-[#34d399] shadow-[0_0_0_3px_rgba(52,211,153,0.18),0_0_14px_rgba(52,211,153,0.85)]";
  }
  if (tone === BT_DRAWDOWN) {
    return "bg-amber-300 shadow-[0_0_0_3px_rgba(252,211,77,0.16),0_0_14px_rgba(252,211,77,0.7)]";
  }
  if (tone === BT_NEGATIVE) {
    return "bg-red-400 shadow-[0_0_0_3px_rgba(248,113,113,0.16),0_0_14px_rgba(248,113,113,0.7)]";
  }
  return "bg-violet-300 shadow-[0_0_0_3px_rgba(196,181,253,0.16),0_0_14px_rgba(167,139,250,0.7)]";
}

export function pctBadgeClass(pct) {
  if (pct == null) return "bg-[#1a1624] text-[#8c8c8c]";
  const tone = percentileTone(pct);
  if (tone === BT_POSITIVE) return "bg-[#10261c] text-[#34d399]";
  if (tone === BT_DRAWDOWN) return "bg-[#241c10] text-[#e8c547]";
  if (tone === BT_NEGATIVE) return "bg-[#261014] text-red-300";
  return "bg-[#241c10] text-[#e8c547]";
}

export const DISTRIBUTION_HEADER_CLASS =
  "flex w-full items-center justify-between gap-2 border-b border-[rgba(60,40,80,0.22)] px-4 py-3 text-left hover:bg-white/[0.03]";
export const DISTRIBUTION_TITLE_CLASS =
  "text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9bb0e8]";
export const DISTRIBUTION_META_CLASS = "text-[11px] normal-case tracking-normal text-[#7a7488]";

export function distributionHeaderMeta(nRuns, enabledCount, totalCount) {
  return `original vs ${fmtInt(nRuns)} runs · ${enabledCount}/${totalCount}`;
}

/** Value + percentile badge + min/med/mean/max rail. */
export function DistributionMetricRow({
  label,
  value,
  valueClassName = BT_MUTED,
  percentile,
  original,
  min,
  median,
  mean,
  max,
  formatRail,
  hideRail = false,
  sub,
}) {
  const origPos = rangePos(original, min, max);
  const medPos = rangePos(median, min, max);
  const meanPos = rangePos(mean, min, max);
  const pctLabel = ordinalPct(percentile);
  const rail = (fieldValue) => (formatRail ? formatRail(fieldValue) : compactRailLabel(fieldValue));

  return (
    <div className="flex min-w-0 flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:gap-5">
      <div className={cx("min-w-0", hideRail ? "w-full" : "sm:w-[42%] sm:shrink-0")}>
        <div className="text-[11px] leading-snug text-[#b8b0c8]">{label}</div>
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          <span className={cx("text-[22px] font-semibold tabular-nums leading-none tracking-tight", valueClassName)}>
            {value}
          </span>
          <span
            className={cx(
              "rounded px-1.5 py-0.5 text-[10px] font-medium tabular-nums",
              pctBadgeClass(hideRail ? null : percentile),
            )}
          >
            {hideRail ? "N/A" : pctLabel || "N/A"}
          </span>
        </div>
        {sub ? <div className="mt-1.5 text-[10px] leading-snug text-[#8c8c8c]">{sub}</div> : null}
      </div>

      {hideRail ? null : (
        <div className="min-w-0 flex-1">
          <div className="relative h-5">
            <div className="absolute inset-x-0 top-1/2 h-[2px] -translate-y-1/2 rounded-full bg-[#2a2040]" />
            <div className="absolute top-1/2 h-2.5 w-px -translate-y-1/2 bg-[#6e6682]" style={{ left: 0 }} />
            <div className="absolute top-1/2 h-2.5 w-px -translate-x-full -translate-y-1/2 bg-[#6e6682]" style={{ left: "100%" }} />
            <div
              className="absolute top-1/2 h-3.5 w-px -translate-x-1/2 -translate-y-1/2 bg-[#faf7fd]/90"
              style={{ left: `${medPos}%` }}
              title={`Median ${rail(median)}`}
            />
            {Math.abs(meanPos - medPos) > 3 ? (
              <div
                className="absolute top-1/2 h-2.5 w-px -translate-x-1/2 -translate-y-1/2 bg-[#c8c0d4]/55"
                style={{ left: `${meanPos}%` }}
                title={`Mean ${rail(mean)}`}
              />
            ) : null}
            <div
              className={cx(
                "absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full",
                distributionDotClass(valueClassName),
              )}
              style={{ left: `${origPos}%` }}
              title={`Original ${value}`}
            />
          </div>
          <div className="mt-1.5 grid grid-cols-4 gap-1 text-[10px] tabular-nums text-[#faf7fd]">
            <span className="truncate text-left">min {rail(min)}</span>
            <span className="truncate text-center">med {rail(median)}</span>
            <span className="truncate text-center">mean {rail(mean)}</span>
            <span className="truncate text-right">max {rail(max)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

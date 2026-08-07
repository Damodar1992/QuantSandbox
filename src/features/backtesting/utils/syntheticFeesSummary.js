// Synthetic info → Fees: metric rows with Original / Percentile / Min / Median / Mean / Max.

import { buildFeesSummary, fmtMoneyUsdt } from "./feesSettingsSummary";

function strHash(str) {
  let h = 2166136261;
  for (let i = 0; i < String(str).length; i += 1) {
    h ^= String(str).charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const round = (v, d = 2) => Math.round(Number(v) * 10 ** d) / 10 ** d;
const between = (rnd, lo, hi) => lo + rnd() * (hi - lo);

function distAround(rnd, original) {
  if (original == null || !Number.isFinite(Number(original))) {
    return { mean: null, median: null, min: null, max: null, percentile: null };
  }
  const v = Number(original);
  const spread = Math.abs(v) * between(rnd, 0.08, 0.18);
  const mean = round(v * between(rnd, 0.98, 1.02), 2);
  const median = round(mean * between(rnd, 0.995, 1.005), 2);
  // Fees are negative: min = more negative, max = less negative
  const min = round(Math.min(v, mean) - spread, 2);
  const max = round(Math.max(v, mean) + spread * 0.35, 2);
  return {
    mean,
    median,
    min,
    max,
    percentile: Math.round(between(rnd, 35, 70)),
  };
}

function metricRow(key, label, tipKey, original, rnd) {
  const na = original == null;
  const stats = na ? null : distAround(rnd, original);
  return {
    key,
    label,
    tipKey,
    original: na ? null : original,
    percentile: na ? null : stats.percentile,
    min: na ? null : stats.min,
    median: na ? null : stats.median,
    mean: na ? null : stats.mean,
    max: na ? null : stats.max,
    na,
  };
}

/**
 * Synthetic fees summary — 6 metric rows matching the reference layout.
 * Maker fees are typically N/A (market orders), matching the demo screenshot.
 */
export function buildSyntheticFeesSummary(run, parent) {
  if (run?.result?.syntheticFees?.rows?.length) {
    return run.result.syntheticFees;
  }

  const adapted = {
    id: run?.id,
    params: {
      ...(parent?.params || {}),
      ...(run?.inherited || {}),
    },
  };

  const base = buildFeesSummary(adapted);
  const total = base.total || base.rows?.[0] || {};
  const rnd = mulberry32(strHash(`sy-fees|${run?.id || "demo"}`));

  // Force maker N/A for synthetic demo (aligned with reference); keep taker + totals.
  const openTaker = total.openTaker ?? null;
  const closeTaker = total.closeTaker ?? null;
  const openMaker = null;
  const closeMaker = null;
  const totalOpen = openTaker;
  const totalClose = closeTaker;

  const rows = [
    metricRow("openTaker", "Open taker fee", "openTaker", openTaker, rnd),
    metricRow("openMaker", "Open maker fee", "openMaker", openMaker, rnd),
    metricRow("totalOpen", "Total open fee", null, totalOpen, rnd),
    metricRow("closeTaker", "Close taker fee", "closeTaker", closeTaker, rnd),
    metricRow("closeMaker", "Close maker fee", "closeMaker", closeMaker, rnd),
    metricRow("totalClose", "Total close fee", null, totalClose, rnd),
  ];

  return {
    title: "Fees for open and closed orders",
    subtitle:
      base.subtitle ||
      "Entry and exit costs split by order type. The totals match Maker fee and Taker fee in the performance summary.",
    rows,
    formatMoney: fmtMoneyUsdt,
  };
}

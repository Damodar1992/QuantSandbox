// Synthetic info → Temporal: period pills + Original/Percentile/Min/Median/Mean/Max.

import { buildTemporalSummary } from "./temporalSummary";
import { fmtInt } from "./format";

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

function fmtPct(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  return `${n.toFixed(2)}%`;
}

function fmtAbs(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Parse backtest temporal cell strings into structured values. */
function parseTotal(total) {
  const raw = String(total ?? "").trim();
  if (!raw || raw === "—") return { kind: "empty" };

  const pair = raw.match(/^([+-]?\d+(?:\.\d+)?)%\s*\|\s*([+-]?[\d,]+(?:\.\d+)?)$/);
  if (pair) {
    return {
      kind: "pctAbs",
      pct: Number(pair[1]),
      abs: Number(pair[2].replace(/,/g, "")),
    };
  }

  const pctOnly = raw.match(/^([+-]?\d+(?:\.\d+)?)%$/);
  if (pctOnly) {
    return { kind: "pct", pct: Number(pctOnly[1]) };
  }

  const absOnly = raw.match(/^([+-]?[\d,]+(?:\.\d+)?)$/);
  if (absOnly) {
    return { kind: "abs", abs: Number(absOnly[1].replace(/,/g, "")) };
  }

  return { kind: "text", text: raw };
}

function formatParsed(parsed) {
  if (!parsed || parsed.kind === "empty") return "—";
  if (parsed.kind === "text") return parsed.text;
  if (parsed.kind === "pct") return fmtPct(parsed.pct);
  if (parsed.kind === "abs") return fmtAbs(parsed.abs);
  if (parsed.kind === "pctAbs") {
    const pct = Number(parsed.pct);
    const pctStr = Number.isFinite(pct) ? `${pct.toFixed(2)}%` : "—";
    return `${pctStr} | ${fmtAbs(parsed.abs)}`;
  }
  return "—";
}

function distNumber(rnd, value, decimals = 2) {
  if (value == null || !Number.isFinite(Number(value))) return null;
  const v = Number(value);
  const spread = Math.abs(v) < 1e-9 ? between(rnd, 1, 20) : Math.abs(v) * between(rnd, 0.12, 0.4);
  return round(v + (rnd() * 2 - 1) * spread, decimals);
}

function expandParsed(rnd, parsed) {
  if (!parsed || parsed.kind === "empty" || parsed.kind === "text") {
    return { mean: null, median: null, min: null, max: null, percentile: null };
  }

  if (parsed.kind === "pct") {
    const mean = distNumber(rnd, parsed.pct);
    const median = distNumber(rnd, mean);
    const a = distNumber(rnd, parsed.pct);
    const b = distNumber(rnd, parsed.pct);
    return {
      mean: { kind: "pct", pct: mean },
      median: { kind: "pct", pct: median },
      min: { kind: "pct", pct: Math.min(a, b, mean, parsed.pct) },
      max: { kind: "pct", pct: Math.max(a, b, mean, parsed.pct) },
      percentile: Math.round(between(rnd, 8, 92)),
    };
  }

  if (parsed.kind === "abs") {
    const mean = distNumber(rnd, parsed.abs);
    const median = distNumber(rnd, mean);
    const a = distNumber(rnd, parsed.abs);
    const b = distNumber(rnd, parsed.abs);
    return {
      mean: { kind: "abs", abs: mean },
      median: { kind: "abs", abs: median },
      min: { kind: "abs", abs: Math.min(a, b, mean, parsed.abs) },
      max: { kind: "abs", abs: Math.max(a, b, mean, parsed.abs) },
      percentile: Math.round(between(rnd, 8, 92)),
    };
  }

  // pctAbs
  const meanPct = distNumber(rnd, parsed.pct);
  const meanAbs = distNumber(rnd, parsed.abs);
  const medPct = distNumber(rnd, meanPct);
  const medAbs = distNumber(rnd, meanAbs);
  const minPct = distNumber(rnd, parsed.pct);
  const maxPct = distNumber(rnd, parsed.pct);
  const minAbs = distNumber(rnd, parsed.abs);
  const maxAbs = distNumber(rnd, parsed.abs);
  const loPct = Math.min(minPct, maxPct, meanPct, parsed.pct);
  const hiPct = Math.max(minPct, maxPct, meanPct, parsed.pct);
  const loAbs = Math.min(minAbs, maxAbs, meanAbs, parsed.abs);
  const hiAbs = Math.max(minAbs, maxAbs, meanAbs, parsed.abs);
  return {
    mean: { kind: "pctAbs", pct: meanPct, abs: meanAbs },
    median: { kind: "pctAbs", pct: medPct, abs: medAbs },
    min: { kind: "pctAbs", pct: loPct, abs: loAbs },
    max: { kind: "pctAbs", pct: hiPct, abs: hiAbs },
    percentile: Math.round(between(rnd, 8, 92)),
  };
}

const STAR_KEYS = new Set(["relMaxDdTradable", "relMaxDdEquity"]);

function expandRow(row, rnd) {
  const parsed = parseTotal(row.total);
  const stats = expandParsed(rnd, parsed);
  const textOnly = parsed.kind === "empty" || parsed.kind === "text" || !stats.percentile;

  return {
    key: row.key,
    label: row.label,
    tone: row.tone,
    star: STAR_KEYS.has(row.key),
    original: formatParsed(parsed),
    percentile: textOnly ? null : stats.percentile,
    min: textOnly ? null : formatParsed(stats.min),
    median: textOnly ? null : formatParsed(stats.median),
    mean: textOnly ? null : formatParsed(stats.mean),
    max: textOnly ? null : formatParsed(stats.max),
    textOnly,
  };
}

function expandSections(sections, rnd) {
  return (sections || []).map((section) => ({
    key: section.key,
    title: section.key === "costs" ? "PERIOD COSTS" : section.title,
    hint: section.hint,
    rows: (section.rows || []).map((row) => expandRow(row, rnd)),
  }));
}

/**
 * Synthetic temporal summary — same period groups as backtest Temporal,
 * each metric expanded to Original / Percentile / Min / Median / Mean / Max.
 */
export function buildSyntheticTemporalSummary(run, parent) {
  if (run?.result?.syntheticTemporal?.periods?.length) {
    return run.result.syntheticTemporal;
  }

  const adapted = {
    id: run?.id,
    params: {
      ...(parent?.params || {}),
      ...(run?.inherited || {}),
      periodFrom: run?.inherited?.periodFrom || parent?.params?.periodFrom,
      periodTo: run?.inherited?.periodTo || parent?.params?.periodTo,
      startingCapital:
        run?.inherited?.startingCapital || parent?.params?.startingCapital || 10000,
    },
    result: {
      core: parent?.result?.core || {
        roi: 8.19,
        pnl: 819,
        maxdd: 21.69,
        pf: 1.1,
        winrate: 43,
        trades: 1400,
      },
    },
  };

  const base = buildTemporalSummary(adapted);
  const byPeriod = {};
  let metricCount = 0;
  let groupCount = 0;

  for (const period of base.periods) {
    const rnd = mulberry32(strHash(["sy-temporal", run?.id || "demo", period.id].join("|")));
    const sections = expandSections(base.byPeriod?.[period.id]?.sections, rnd);
    byPeriod[period.id] = { sections };
    if (period.id === (base.defaultPeriodId || "all") || !groupCount) {
      groupCount = sections.length;
      metricCount = sections.reduce((n, s) => n + s.rows.length, 0);
    }
  }

  const nRuns = Number(run?.config?.nRuns) || Number(run?.result?.nValid) || 1000;

  return {
    periods: base.periods,
    defaultPeriodId: "all",
    byPeriod,
    groupCount,
    metricCount,
    nRuns,
    subtitle: `${fmtInt(groupCount)} groups — ${fmtInt(metricCount)} metrics — By period`,
  };
}

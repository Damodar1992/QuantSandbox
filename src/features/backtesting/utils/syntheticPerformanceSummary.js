// Synthetic info → Performance: distribution columns over the usual summary metrics.

import { buildPerformanceSummary } from "./mockResults";

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

const TEXT_TONES = new Set(["neutral-text", "drawdown-text", "pos-text", "neg-text"]);

function pad2(n) {
  return String(Math.max(0, Math.floor(n))).padStart(2, "0");
}

function fmtHms(totalSec) {
  const s = Math.max(0, Math.floor(totalSec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${h}:${pad2(m)}:${pad2(sec)}`;
}

function fmtDaysHms(totalSec) {
  const s = Math.max(0, Math.floor(totalSec));
  const d = Math.floor(s / 86400);
  const rem = s % 86400;
  const h = Math.floor(rem / 3600);
  const m = Math.floor((rem % 3600) / 60);
  const sec = rem % 60;
  return `${d} days ${pad2(h)}:${pad2(m)}:${pad2(sec)}`;
}

function fmtNumLocal(value, decimals = 2) {
  const num = Number(value);
  if (!Number.isFinite(num)) return "—";
  return num.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function signedPct(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return "—";
  const sign = num > 0 ? "+" : "";
  return `${sign}${num.toFixed(2)}%`;
}

function signedMoney(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return "—";
  const sign = num > 0 ? "+" : "";
  return `${sign}${num.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function distNumber(rnd, value, decimals = 2) {
  if (value == null || !Number.isFinite(Number(value))) return null;
  const v = Number(value);
  const spread = Math.abs(v) < 1e-9 ? between(rnd, 0.5, 2) : Math.abs(v) * between(rnd, 0.12, 0.45);
  return round(v + (rnd() * 2 - 1) * spread, decimals);
}

function distAround(rnd, original, { decimals = 2, invert = false } = {}) {
  if (original == null || typeof original !== "number" || !Number.isFinite(original)) {
    return { mean: null, median: null, min: null, max: null, percentile: null };
  }
  const spread =
    Math.abs(original) < 1e-9 ? between(rnd, 0.5, 2) : Math.abs(original) * between(rnd, 0.12, 0.45);
  const mean = round(original * between(rnd, 0.92, 1.08), decimals);
  const median = round(mean * between(rnd, 0.96, 1.04), decimals);
  let max = round(Math.max(mean, original) + spread * between(rnd, 0.4, 1.2), decimals);
  let min = round(Math.min(mean, original) - spread * between(rnd, 0.4, 1.2), decimals);
  if (min > max) {
    const t = min;
    min = max;
    max = t;
  }
  let percentile = Math.round(between(rnd, 8, 92));
  if (invert && original > mean) percentile = Math.min(95, percentile + 10);
  if (invert && original < mean) percentile = Math.max(5, percentile - 10);
  if (!invert && original > mean) percentile = Math.min(95, percentile + 8);
  if (!invert && original < mean) percentile = Math.max(5, percentile - 8);
  return { mean, median, min, max, percentile };
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatOrdinalDate({ day, month, year }) {
  const monthName = MONTHS[Math.max(0, Math.min(11, month - 1))];
  return `${Math.max(1, Math.round(day))} ${monthName} ${Math.round(year)}`;
}

/** Parse formatted performance cell strings into a typed payload we can jitter. */
function parseMetricText(raw) {
  const text = String(raw ?? "").trim();
  if (!text || text === "—") return { kind: "empty" };

  // "43.10% / 56.90%" or "1.2% / 98.8%"
  let m = text.match(
    /^([+-]?\d+(?:\.\d+)?)%\s*\/\s*([+-]?\d+(?:\.\d+)?)%$/,
  );
  if (m) {
    return { kind: "pctPair", a: Number(m[1]), b: Number(m[2]) };
  }

  // "+9.02% / +902.00 USDT" or "-12.5% / -100.00 USDT"
  m = text.match(
    /^([+-]?\d+(?:\.\d+)?)%\s*\/\s*([+-]?[\d,]+(?:\.\d+)?)\s*USDT$/i,
  );
  if (m) {
    return {
      kind: "pctMoney",
      pct: Number(m[1]),
      money: Number(m[2].replace(/,/g, "")),
    };
  }

  // "-2.64 / -2,314.07 USDT" drawdown high | low
  m = text.match(/^([+-]?[\d,]+(?:\.\d+)?)\s*\/\s*([+-]?[\d,]+(?:\.\d+)?)\s*USDT$/i);
  if (m) {
    return {
      kind: "moneyPair",
      a: Number(m[1].replace(/,/g, "")),
      b: Number(m[2].replace(/,/g, "")),
    };
  }

  // "1,234.56 / 789.00" (drawdown high|low balances)
  m = text.match(/^([\d,]+(?:\.\d+)?)\s*\/\s*([\d,]+(?:\.\d+)?)$/);
  if (m) {
    return {
      kind: "numPair",
      a: Number(m[1].replace(/,/g, "")),
      b: Number(m[2].replace(/,/g, "")),
    };
  }

  // "1,234 / 0 / 567" counts
  m = text.match(/^([\d,]+)\s*\/\s*([\d,]+)\s*\/\s*([\d,]+)$/);
  if (m) {
    return {
      kind: "countTriple",
      a: Number(m[1].replace(/,/g, "")),
      b: Number(m[2].replace(/,/g, "")),
      c: Number(m[3].replace(/,/g, "")),
    };
  }

  // "120 / —" long count when short is off
  m = text.match(/^([\d,]+)\s*\/\s*—$/);
  if (m) {
    return {
      kind: "countSingle",
      a: Number(m[1].replace(/,/g, "")),
    };
  }

  // "800 / 625" long/short counts
  m = text.match(/^([\d,]+)\s*\/\s*([\d,]+)$/);
  if (m) {
    return {
      kind: "countPair",
      a: Number(m[1].replace(/,/g, "")),
      b: Number(m[2].replace(/,/g, "")),
    };
  }

  // "11 trades" / "2.58 trades"
  m = text.match(/^([\d,]+(?:\.\d+)?)\s+trades$/i);
  if (m) {
    const rawCount = m[1].replace(/,/g, "");
    return {
      kind: "tradeCount",
      count: Number(rawCount),
      decimals: rawCount.includes(".") ? 2 : 0,
    };
  }

  // "49 min"
  m = text.match(/^([\d,]+(?:\.\d+)?)\s+min$/i);
  if (m) {
    return { kind: "durationMin", min: Number(m[1].replace(/,/g, "")) };
  }

  // "5 Mar 2022"
  m = text.match(/^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})$/);
  if (m) {
    const monthIdx = MONTHS.findIndex((name) => name.toLowerCase() === m[2].toLowerCase());
    if (monthIdx >= 0) {
      return {
        kind: "ordinalDate",
        day: Number(m[1]),
        month: monthIdx + 1,
        year: Number(m[3]),
      };
    }
  }

  // "0 days 00:12:30"
  m = text.match(/^(\d+)\s+days?\s+(\d+):(\d{2}):(\d{2})$/i);
  if (m) {
    const sec =
      Number(m[1]) * 86400 + Number(m[2]) * 3600 + Number(m[3]) * 60 + Number(m[4]);
    return { kind: "daysHms", sec };
  }

  // "1:05:30"
  m = text.match(/^(\d+):(\d{2}):(\d{2})$/);
  if (m) {
    const sec = Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]);
    return { kind: "hms", sec };
  }

  // "35m"
  m = text.match(/^(\d+)\s*m$/i);
  if (m) return { kind: "minutes", min: Number(m[1]) };

  // "+12.34%" / "-5%"
  m = text.match(/^([+-]?\d+(?:\.\d+)?)%$/);
  if (m) return { kind: "pct", pct: Number(m[1]) };

  // "1,234.56 USDT"
  m = text.match(/^([+-]?[\d,]+(?:\.\d+)?)\s*USDT$/i);
  if (m) return { kind: "money", money: Number(m[1].replace(/,/g, "")) };

  // "-0.70 (-0.48)" expectancy primary + alt
  m = text.match(/^([+-]?[\d,]+(?:\.\d+)?)\s*\(([+-]?[\d,]+(?:\.\d+)?)\)$/);
  if (m) {
    return {
      kind: "numParen",
      a: Number(m[1].replace(/,/g, "")),
      b: Number(m[2].replace(/,/g, "")),
    };
  }

  // bare number
  m = text.match(/^([+-]?[\d,]+(?:\.\d+)?)$/);
  if (m) return { kind: "num", value: Number(m[1].replace(/,/g, "")) };

  // timestamps like "2019 03 12 14:22:00" — leave as text
  return { kind: "text", text };
}

function formatParsed(parsed) {
  if (!parsed || parsed.kind === "empty") return "—";
  if (parsed.kind === "text") return parsed.text;
  if (parsed.kind === "pct") return signedPct(parsed.pct);
  if (parsed.kind === "money") return `${fmtNumLocal(parsed.money)} USDT`;
  if (parsed.kind === "num") return fmtNumLocal(parsed.value);
  if (parsed.kind === "hms") return fmtHms(parsed.sec);
  if (parsed.kind === "daysHms") return fmtDaysHms(parsed.sec);
  if (parsed.kind === "minutes") return `${Math.max(0, Math.round(parsed.min))}m`;
  if (parsed.kind === "pctPair") {
    return `${fmtNumLocal(parsed.a)}% / ${fmtNumLocal(parsed.b)}%`;
  }
  if (parsed.kind === "pctMoney") {
    return `${signedPct(parsed.pct)} / ${signedMoney(parsed.money)} USDT`;
  }
  if (parsed.kind === "moneyPair") {
    return `${signedMoney(parsed.a)} / ${signedMoney(parsed.b)} USDT`;
  }
  if (parsed.kind === "numPair") {
    return `${fmtNumLocal(parsed.a)} / ${fmtNumLocal(parsed.b)}`;
  }
  if (parsed.kind === "numParen") {
    return `${fmtNumLocal(parsed.a)} (${fmtNumLocal(parsed.b)})`;
  }
  if (parsed.kind === "tradeCount") {
    const value = round(parsed.count, parsed.decimals ?? 0);
    return parsed.decimals > 0
      ? `${fmtNumLocal(value, parsed.decimals)} trades`
      : `${Math.round(value).toLocaleString("en-US")} trades`;
  }
  if (parsed.kind === "durationMin") {
    return `${Math.max(0, Math.round(parsed.min))} min`;
  }
  if (parsed.kind === "ordinalDate") {
    return formatOrdinalDate(parsed);
  }
  if (parsed.kind === "countSingle") {
    return `${Math.round(parsed.a).toLocaleString("en-US")} / —`;
  }
  if (parsed.kind === "countPair") {
    return `${Math.round(parsed.a).toLocaleString("en-US")} / ${Math.round(parsed.b).toLocaleString("en-US")}`;
  }
  if (parsed.kind === "countTriple") {
    return `${Math.round(parsed.a).toLocaleString("en-US")} / ${Math.round(parsed.b).toLocaleString("en-US")} / ${Math.round(parsed.c).toLocaleString("en-US")}`;
  }
  return "—";
}

function jitterSec(rnd, sec) {
  const base = Math.max(1, Number(sec) || 1);
  const next = Math.round(base * between(rnd, 0.75, 1.35));
  return Math.max(1, next);
}

function expandParsed(rnd, parsed) {
  if (!parsed || parsed.kind === "empty" || parsed.kind === "text") {
    return { mean: null, median: null, min: null, max: null, percentile: null };
  }

  const pctile = () => Math.round(between(rnd, 8, 92));

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
      percentile: pctile(),
    };
  }

  if (parsed.kind === "money") {
    const mean = distNumber(rnd, parsed.money);
    const median = distNumber(rnd, mean);
    const a = distNumber(rnd, parsed.money);
    const b = distNumber(rnd, parsed.money);
    return {
      mean: { kind: "money", money: mean },
      median: { kind: "money", money: median },
      min: { kind: "money", money: Math.min(a, b, mean, parsed.money) },
      max: { kind: "money", money: Math.max(a, b, mean, parsed.money) },
      percentile: pctile(),
    };
  }

  if (parsed.kind === "num") {
    const mean = distNumber(rnd, parsed.value);
    const median = distNumber(rnd, mean);
    const a = distNumber(rnd, parsed.value);
    const b = distNumber(rnd, parsed.value);
    return {
      mean: { kind: "num", value: mean },
      median: { kind: "num", value: median },
      min: { kind: "num", value: Math.min(a, b, mean, parsed.value) },
      max: { kind: "num", value: Math.max(a, b, mean, parsed.value) },
      percentile: pctile(),
    };
  }

  if (parsed.kind === "hms" || parsed.kind === "daysHms") {
    const kind = parsed.kind;
    const mean = jitterSec(rnd, parsed.sec);
    const median = jitterSec(rnd, mean);
    const a = jitterSec(rnd, parsed.sec);
    const b = jitterSec(rnd, parsed.sec);
    return {
      mean: { kind, sec: mean },
      median: { kind, sec: median },
      min: { kind, sec: Math.min(a, b, mean, parsed.sec) },
      max: { kind, sec: Math.max(a, b, mean, parsed.sec) },
      percentile: pctile(),
    };
  }

  if (parsed.kind === "minutes") {
    const mean = Math.max(1, Math.round(distNumber(rnd, parsed.min, 0)));
    const median = Math.max(1, Math.round(distNumber(rnd, mean, 0)));
    const a = Math.max(1, Math.round(distNumber(rnd, parsed.min, 0)));
    const b = Math.max(1, Math.round(distNumber(rnd, parsed.min, 0)));
    return {
      mean: { kind: "minutes", min: mean },
      median: { kind: "minutes", min: median },
      min: { kind: "minutes", min: Math.min(a, b, mean, parsed.min) },
      max: { kind: "minutes", min: Math.max(a, b, mean, parsed.min) },
      percentile: pctile(),
    };
  }

  if (parsed.kind === "durationMin") {
    const mean = Math.max(1, Math.round(distNumber(rnd, parsed.min, 0)));
    const median = Math.max(1, Math.round(distNumber(rnd, mean, 0)));
    const a = Math.max(1, Math.round(distNumber(rnd, parsed.min, 0)));
    const b = Math.max(1, Math.round(distNumber(rnd, parsed.min, 0)));
    return {
      mean: { kind: "durationMin", min: mean },
      median: { kind: "durationMin", min: median },
      min: { kind: "durationMin", min: Math.min(a, b, mean, parsed.min) },
      max: { kind: "durationMin", min: Math.max(a, b, mean, parsed.min) },
      percentile: pctile(),
    };
  }

  if (parsed.kind === "tradeCount") {
    const decimals = parsed.decimals ?? 0;
    const mean = distNumber(rnd, parsed.count, decimals);
    const median = distNumber(rnd, mean, decimals);
    const a = distNumber(rnd, parsed.count, decimals);
    const b = distNumber(rnd, parsed.count, decimals);
    const lo = decimals > 0
      ? Math.min(a, b, mean, parsed.count)
      : Math.max(1, Math.round(Math.min(a, b, mean, parsed.count)));
    const hi = decimals > 0
      ? Math.max(a, b, mean, parsed.count)
      : Math.max(1, Math.round(Math.max(a, b, mean, parsed.count)));
    return {
      mean: { kind: "tradeCount", count: mean, decimals },
      median: { kind: "tradeCount", count: median, decimals },
      min: { kind: "tradeCount", count: lo, decimals },
      max: { kind: "tradeCount", count: hi, decimals },
      percentile: pctile(),
    };
  }

  if (parsed.kind === "ordinalDate") {
    const jitterDay = (day) => Math.max(1, Math.min(28, Math.round(day * between(rnd, 0.85, 1.15))));
    const jitterYear = (year) => Math.max(1970, year + Math.round(between(rnd, -1, 1)));
    const mean = {
      kind: "ordinalDate",
      day: jitterDay(parsed.day),
      month: parsed.month,
      year: jitterYear(parsed.year),
    };
    const median = {
      kind: "ordinalDate",
      day: jitterDay(mean.day),
      month: parsed.month,
      year: jitterYear(parsed.year),
    };
    const min = {
      kind: "ordinalDate",
      day: Math.min(jitterDay(parsed.day), mean.day, parsed.day),
      month: parsed.month,
      year: Math.min(jitterYear(parsed.year), parsed.year),
    };
    const max = {
      kind: "ordinalDate",
      day: Math.max(jitterDay(parsed.day), mean.day, parsed.day),
      month: parsed.month,
      year: Math.max(jitterYear(parsed.year), parsed.year),
    };
    return { mean, median, min, max, percentile: pctile() };
  }

  if (parsed.kind === "moneyPair") {
    const meanA = distNumber(rnd, parsed.a);
    const meanB = distNumber(rnd, parsed.b);
    const medA = distNumber(rnd, meanA);
    const medB = distNumber(rnd, meanB);
    const a1 = distNumber(rnd, parsed.a);
    const a2 = distNumber(rnd, parsed.a);
    const b1 = distNumber(rnd, parsed.b);
    const b2 = distNumber(rnd, parsed.b);
    return {
      mean: { kind: "moneyPair", a: meanA, b: meanB },
      median: { kind: "moneyPair", a: medA, b: medB },
      min: {
        kind: "moneyPair",
        a: Math.min(a1, a2, meanA, parsed.a),
        b: Math.min(b1, b2, meanB, parsed.b),
      },
      max: {
        kind: "moneyPair",
        a: Math.max(a1, a2, meanA, parsed.a),
        b: Math.max(b1, b2, meanB, parsed.b),
      },
      percentile: pctile(),
    };
  }

  if (parsed.kind === "countSingle") {
    const jitter = (v) => Math.max(0, Math.round(Number(v) * between(rnd, 0.85, 1.15)));
    const mean = jitter(parsed.a);
    const median = jitter(mean);
    const a1 = jitter(parsed.a);
    const a2 = jitter(parsed.a);
    return {
      mean: { kind: "countSingle", a: mean },
      median: { kind: "countSingle", a: median },
      min: { kind: "countSingle", a: Math.min(a1, a2, mean, parsed.a) },
      max: { kind: "countSingle", a: Math.max(a1, a2, mean, parsed.a) },
      percentile: pctile(),
    };
  }

  if (parsed.kind === "pctPair") {
    const meanA = distNumber(rnd, parsed.a);
    const meanB = round(100 - meanA, 2);
    const medA = distNumber(rnd, meanA);
    const medB = round(100 - medA, 2);
    const minA = distNumber(rnd, parsed.a);
    const maxA = distNumber(rnd, parsed.a);
    const lo = Math.min(minA, maxA, meanA, parsed.a);
    const hi = Math.max(minA, maxA, meanA, parsed.a);
    return {
      mean: { kind: "pctPair", a: meanA, b: meanB },
      median: { kind: "pctPair", a: medA, b: medB },
      min: { kind: "pctPair", a: lo, b: round(100 - lo, 2) },
      max: { kind: "pctPair", a: hi, b: round(100 - hi, 2) },
      percentile: pctile(),
    };
  }

  if (parsed.kind === "pctMoney") {
    const meanPct = distNumber(rnd, parsed.pct);
    const meanMoney = distNumber(rnd, parsed.money);
    const medPct = distNumber(rnd, meanPct);
    const medMoney = distNumber(rnd, meanMoney);
    const aPct = distNumber(rnd, parsed.pct);
    const bPct = distNumber(rnd, parsed.pct);
    const aMoney = distNumber(rnd, parsed.money);
    const bMoney = distNumber(rnd, parsed.money);
    return {
      mean: { kind: "pctMoney", pct: meanPct, money: meanMoney },
      median: { kind: "pctMoney", pct: medPct, money: medMoney },
      min: {
        kind: "pctMoney",
        pct: Math.min(aPct, bPct, meanPct, parsed.pct),
        money: Math.min(aMoney, bMoney, meanMoney, parsed.money),
      },
      max: {
        kind: "pctMoney",
        pct: Math.max(aPct, bPct, meanPct, parsed.pct),
        money: Math.max(aMoney, bMoney, meanMoney, parsed.money),
      },
      percentile: pctile(),
    };
  }

  if (parsed.kind === "numPair") {
    const meanA = distNumber(rnd, parsed.a);
    const meanB = distNumber(rnd, parsed.b);
    const medA = distNumber(rnd, meanA);
    const medB = distNumber(rnd, meanB);
    const a1 = distNumber(rnd, parsed.a);
    const a2 = distNumber(rnd, parsed.a);
    const b1 = distNumber(rnd, parsed.b);
    const b2 = distNumber(rnd, parsed.b);
    return {
      mean: { kind: "numPair", a: meanA, b: meanB },
      median: { kind: "numPair", a: medA, b: medB },
      min: {
        kind: "numPair",
        a: Math.min(a1, a2, meanA, parsed.a),
        b: Math.min(b1, b2, meanB, parsed.b),
      },
      max: {
        kind: "numPair",
        a: Math.max(a1, a2, meanA, parsed.a),
        b: Math.max(b1, b2, meanB, parsed.b),
      },
      percentile: pctile(),
    };
  }

  if (parsed.kind === "numParen") {
    const meanA = distNumber(rnd, parsed.a);
    const meanB = distNumber(rnd, parsed.b);
    const medA = distNumber(rnd, meanA);
    const medB = distNumber(rnd, meanB);
    const a1 = distNumber(rnd, parsed.a);
    const a2 = distNumber(rnd, parsed.a);
    const b1 = distNumber(rnd, parsed.b);
    const b2 = distNumber(rnd, parsed.b);
    return {
      mean: { kind: "numParen", a: meanA, b: meanB },
      median: { kind: "numParen", a: medA, b: medB },
      min: {
        kind: "numParen",
        a: Math.min(a1, a2, meanA, parsed.a),
        b: Math.min(b1, b2, meanB, parsed.b),
      },
      max: {
        kind: "numParen",
        a: Math.max(a1, a2, meanA, parsed.a),
        b: Math.max(b1, b2, meanB, parsed.b),
      },
      percentile: pctile(),
    };
  }

  if (parsed.kind === "countPair") {
    const jitter = (v) => Math.max(0, Math.round(Number(v) * between(rnd, 0.85, 1.15)));
    const meanA = jitter(parsed.a);
    const meanB = jitter(parsed.b);
    const medA = jitter(meanA);
    const medB = jitter(meanB);
    const a1 = jitter(parsed.a);
    const a2 = jitter(parsed.a);
    const b1 = jitter(parsed.b);
    const b2 = jitter(parsed.b);
    return {
      mean: { kind: "countPair", a: meanA, b: meanB },
      median: { kind: "countPair", a: medA, b: medB },
      min: {
        kind: "countPair",
        a: Math.min(a1, a2, meanA, parsed.a),
        b: Math.min(b1, b2, meanB, parsed.b),
      },
      max: {
        kind: "countPair",
        a: Math.max(a1, a2, meanA, parsed.a),
        b: Math.max(b1, b2, meanB, parsed.b),
      },
      percentile: pctile(),
    };
  }

  if (parsed.kind === "countTriple") {
    const jitter = (v) => Math.max(0, Math.round(Number(v) * between(rnd, 0.85, 1.15)));
    const mean = { a: jitter(parsed.a), b: jitter(parsed.b), c: jitter(parsed.c) };
    const median = { a: jitter(mean.a), b: jitter(mean.b), c: jitter(mean.c) };
    const a1 = jitter(parsed.a);
    const a2 = jitter(parsed.a);
    const b1 = jitter(parsed.b);
    const b2 = jitter(parsed.b);
    const c1 = jitter(parsed.c);
    const c2 = jitter(parsed.c);
    return {
      mean: { kind: "countTriple", ...mean },
      median: { kind: "countTriple", ...median },
      min: {
        kind: "countTriple",
        a: Math.min(a1, a2, mean.a, parsed.a),
        b: Math.min(b1, b2, mean.b, parsed.b),
        c: Math.min(c1, c2, mean.c, parsed.c),
      },
      max: {
        kind: "countTriple",
        a: Math.max(a1, a2, mean.a, parsed.a),
        b: Math.max(b1, b2, mean.b, parsed.b),
        c: Math.max(c1, c2, mean.c, parsed.c),
      },
      percentile: pctile(),
    };
  }

  return { mean: null, median: null, min: null, max: null, percentile: null };
}

function expandTextMetric(row, original, rnd) {
  const parsed = parseMetricText(original);
  const stats = expandParsed(rnd, parsed);
  const textOnly = parsed.kind === "empty" || parsed.kind === "text" || stats.percentile == null;

  return {
    key: row.key,
    label: row.label,
    tone: row.tone || "neutral-text",
    unit: row.unit,
    sub: row.sub ?? null,
    original: textOnly ? String(original ?? "—") : formatParsed(parsed),
    percentile: textOnly ? null : stats.percentile,
    min: textOnly ? null : formatParsed(stats.min),
    median: textOnly ? null : formatParsed(stats.median),
    mean: textOnly ? null : formatParsed(stats.mean),
    max: textOnly ? null : formatParsed(stats.max),
    textOnly,
  };
}

function expandRow(row, rnd) {
  const original = row.total;
  const tone = row.tone || "num";

  if (TEXT_TONES.has(tone) || typeof original === "string") {
    return expandTextMetric(row, original, rnd);
  }

  const decimals =
    tone === "int" || tone === "int-neg" || tone === "int-pos" ? 0 : 2;
  const invert =
    tone === "drawdown-pct" ||
    tone === "drawdown-money" ||
    (tone === "money" && Number(original) < 0);
  const stats = distAround(rnd, Number(original), { decimals, invert });

  return {
    key: row.key,
    label: row.label,
    tone,
    unit: row.unit,
    sub: row.sub ?? null,
    original: Number(original),
    ...stats,
    textOnly: false,
  };
}

function expandCardRow(row, rnd) {
  if (row.text != null || TEXT_TONES.has(row.tone)) {
    return expandTextMetric(row, row.text ?? row.value, rnd);
  }
  const tone = row.tone === "signed" && row.suffix === "%" ? "signed" : row.tone || "num";
  const decimals = 2;
  const stats = distAround(rnd, Number(row.value), { decimals });
  return {
    key: row.key,
    label: row.label,
    tone,
    unit: row.suffix === "%" ? null : row.unit,
    sub: row.sub ?? null,
    original: Number(row.value),
    ...stats,
    textOnly: false,
  };
}

function coreFromSynthetic(run, parent) {
  const metrics = {};
  (run?.result?.core || []).forEach((row) => {
    if (!row?.metric) return;
    metrics[row.metric] = row.real ?? row.mean ?? null;
  });
  const parentCore = parent?.result?.core || {};
  return {
    roi: metrics.roi ?? parentCore.roi ?? 8.19,
    pnl: metrics.pnl ?? parentCore.pnl ?? 819.38,
    maxdd: metrics.maxdd ?? parentCore.maxdd ?? 21.69,
    pf: metrics.pf ?? parentCore.pf ?? 1.12,
    winrate: metrics.winrate ?? parentCore.winrate ?? 43.1,
    trades: metrics.trades ?? parentCore.trades ?? 1425,
  };
}

/**
 * Performance summary for Synthetic info — same sections as backtest,
 * each metric expanded to Original / Percentile / Min / Median / Mean / Max.
 */
export function buildSyntheticPerformanceSummary(run, parent) {
  if (run?.result?.syntheticPerformance?.sections?.length) {
    return run.result.syntheticPerformance;
  }

  const core = coreFromSynthetic(run, parent);
  const streaks = parent?.result?.streaks || {};
  const wins =
    streaks.wins ?? Math.max(1, Math.round((core.trades * core.winrate) / 100));
  const losses = streaks.losses ?? Math.max(1, core.trades - wins);
  const startingCapital =
    Number(run?.inherited?.startingCapital) ||
    Number(parent?.params?.startingCapital) ||
    10000;

  let h = 2166136261;
  const seed = `synthetic-perf|${run?.id || "demo"}`;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  let a = h >>> 0;
  const rnd = () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const adapted = {
    id: run?.id,
    params: {
      ...(parent?.params || {}),
      ...(run?.inherited || {}),
    },
  };

  const base = buildPerformanceSummary(adapted, {
    rnd,
    roi: core.roi,
    pnl: core.pnl,
    maxdd: core.maxdd,
    pf: core.pf,
    winrate: core.winrate,
    trades: core.trades,
    wins,
    losses,
    startingCapital,
  });

  const rowRnd = mulberry32(strHash(`sy-perf-rows|${run?.id || "demo"}`));

  const rowDefs = base.syntheticRows?.length ? base.syntheticRows : base.sections.flatMap((s) => s.rows || []);

  const sections = [
    {
      key: "synthetic-performance",
      title: "PERFORMANCE SUMMARY",
      hint: "Distribution stats over synthetic runs.",
      rows: rowDefs.map((row) => expandRow(row, rowRnd)),
    },
  ];

  return {
    sections,
    pairLabel: base.pairLabel,
    nRuns: Number(run?.config?.nRuns) || 1000,
  };
}

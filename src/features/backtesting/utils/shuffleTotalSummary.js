// Deterministic Total Summary payload for Shuffle info → Total Summary.

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

function dist(rnd, original, { spread = 0.15, decimals = 2, invariant = false } = {}) {
  if (invariant || original == null) {
    const v = original;
    return { mean: v, median: v, max: v, min: v };
  }
  const mean = round(original * between(rnd, 1 - spread, 1 + spread), decimals);
  const median = round(mean * between(rnd, 0.96, 1.04), decimals);
  let max = round(Math.max(mean, original) * between(rnd, 1.05, 1 + spread * 2.2), decimals);
  let min = round(Math.min(mean, original) * between(rnd, 1 - spread * 1.4, 0.98), decimals);
  if (min > max) {
    const t = min;
    min = max;
    max = t;
  }
  return { mean, median, max, min };
}

function pctOrNa(rnd, invariant, base) {
  if (invariant) return null;
  if (base != null) return Math.max(0, Math.min(100, Math.round(base + between(rnd, -3, 3))));
  return Math.round(between(rnd, 5, 95));
}

function row(key, label, original, stats, originalPct, format = "num", pctTone = null) {
  return {
    key,
    label,
    original,
    originalPct,
    mean: stats.mean,
    median: stats.median,
    max: stats.max,
    min: stats.min,
    format,
    pctTone,
  };
}

/**
 * @param {object} run Shuffler run
 * @param {{ sectionKey?: string }} [opts] — when set, summary is scoped to that section (not Total)
 */
export function buildShuffleTotalSummary(run, opts = {}) {
  const sectionKey = opts.sectionKey || "total";
  const rnd = mulberry32(
    strHash(["shuffle-total", run?.id || "demo", sectionKey].join("|")),
  );
  const dynamic = run?.config?.simulationMode === "dynamic";

  const fromResult = (run?.result?.sections || []).find((s) => s.key === sectionKey);
  const simulations =
    sectionKey === "total"
      ? Number(run?.config?.shufflesN) || 500
      : Number(fromResult?.n) ||
        Math.max(1, Math.floor((Number(run?.config?.shufflesN) || 500) * 0.45));
  const stopped =
    sectionKey === "total"
      ? Math.floor(simulations * between(rnd, 0, 0.02))
      : Number(fromResult?.stoppedN) || Math.floor(simulations * between(rnd, 0, 0.03));

  // Pessimism levels pull distributions toward worse drawdowns / longer recoveries.
  const stress =
    sectionKey === "L5"
      ? 1.35
      : sectionKey === "L4"
        ? 1.28
        : sectionKey === "L3"
          ? 1.18
          : sectionKey === "L2"
            ? 1.1
            : sectionKey === "L1"
              ? 1.04
              : 1;

  const streaks = run?.config?.original || {};
  const finalPnl = 1011.21;
  const roi = 0.9;
  const pf = 1.04;
  const winrate = 47.37;
  const maxDdInit = 10.8;
  const ddPeak = 7.71;
  const mcl = Number(streaks.mcl) || 5;
  const mcw = Number(streaks.mcw) || 8;
  const acl = Number(streaks.acl) || 2.38;
  const acw = Number(streaks.acw) || 2.71;

  // STATIC: PnL-like metrics are order-invariant → N/A pct + flat distribution.
  const inv = !dynamic;

  const general = [
    row("finalPnl", "Final PnL", finalPnl, dist(rnd, finalPnl, { invariant: inv }), pctOrNa(rnd, inv), "money"),
    row("roi", "ROI", roi, dist(rnd, roi, { invariant: inv, decimals: 2 }), pctOrNa(rnd, inv), "pct"),
    row("pf", "Profit Factor", pf, dist(rnd, pf, { invariant: inv, decimals: 2 }), pctOrNa(rnd, inv), "num"),
    row(
      "winrate",
      "Hit / Win Rate",
      winrate,
      dist(rnd, winrate, { invariant: inv, decimals: 2 }),
      pctOrNa(rnd, inv),
      "pct",
    ),
    row(
      "ddPeak",
      "Max Drawdown",
      ddPeak,
      {
        mean: round(7.13 * stress, 2),
        median: round(4.93 * stress, 2),
        max: round(21.68 * stress, 2),
        min: 0,
      },
      pctOrNa(rnd, false, 42),
      "pct",
      "bad",
    ),
    row(
      "maxDdInit",
      "Max Drawdown from initial balance",
      maxDdInit,
      {
        mean: round(9.55 * stress, 2),
        median: round(9.72 * stress, 2),
        max: round(21.45 * stress, 2),
        min: 0,
      },
      pctOrNa(rnd, false, 45),
      "pct",
      "bad",
    ),
    row(
      "mcl",
      "MCL (Max Consec. Losses)",
      mcl,
      {
        mean: round(6.45 * stress, 2),
        median: round(6.25 * stress, 2),
        max: Math.min(12, Math.round(10 * stress)),
        min: 2,
      },
      pctOrNa(rnd, false, 65),
      "num",
      "good",
    ),
    row(
      "mcw",
      "MCW (Max Consec. Wins)",
      mcw,
      {
        mean: round(5.64 / stress, 2),
        median: round(5.29 / stress, 2),
        max: 10,
        min: 2,
      },
      pctOrNa(rnd, false, 79),
      "num",
      "good",
    ),
    row(
      "acl",
      "ACL (Avg Consec. Losses)",
      acl,
      {
        mean: round(2.52 * stress, 2),
        median: round(2.54 * stress, 2),
        max: round(3.8 * stress, 2),
        min: round(1.36, 2),
      },
      pctOrNa(rnd, false, 57),
      "num",
      "good",
    ),
    row(
      "acw",
      "ACW (Avg Consec. Wins)",
      acw,
      {
        mean: round(2.51 / Math.sqrt(stress), 2),
        median: round(2.54 / Math.sqrt(stress), 2),
        max: round(3.8, 2),
        min: round(1.36, 2),
      },
      pctOrNa(rnd, false, 57),
      "num",
      "good",
    ),
  ];

  const recoveryPeriods = [
    row(
      "maxRecInit",
      "Max Recovery Period from initial balance",
      2,
      { mean: 3, median: 3, max: 8, min: 1 },
      pctOrNa(rnd, false, 33),
      "int",
    ),
    row(
      "recPeak",
      "Recovery Period from Peak",
      14,
      { mean: 9, median: 8, max: 30, min: 2 },
      pctOrNa(rnd, false, 64),
      "int",
    ),
  ];

  const macro = [
    row("recN", "Number of recoveries", 2, { mean: 2.0, median: 2, max: 4, min: 1 }, pctOrNa(rnd, false, 50), "int"),
    row("minTradesRec", "Min trades in recovery", 16, { mean: 11.2, median: 11, max: 33, min: 4 }, pctOrNa(rnd, false, 65), "int"),
    row("maxTradesRec", "Max trades in recovery", 28, { mean: 22.4, median: 22, max: 37, min: 8 }, pctOrNa(rnd, false, 72), "int"),
    row("avgTradesRec", "Avg trades in recovery", 22.0, { mean: 16.8, median: 16.2, max: 36.0, min: 6.5 }, pctOrNa(rnd, false, 67), "num"),
    row(
      "minRecTime",
      "Min recovery time",
      "3d 5h 30m",
      { mean: "2d 4h", median: "2d 1h", max: "11d 6h", min: "14h" },
      pctOrNa(rnd, false, 57),
      "text",
    ),
    row(
      "maxRecTime",
      "Max recovery time",
      "12d 7h 30m",
      { mean: "9d 1h", median: "8d 12h", max: "28d 2h", min: "2d 4h" },
      pctOrNa(rnd, false, 67),
      "text",
    ),
    row(
      "avgRecTime",
      "Avg recovery time",
      "7d 18h 30m",
      { mean: "6d 2h", median: "5d 20h", max: "17d 6h", min: "1d 8h" },
      pctOrNa(rnd, false, 59),
      "text",
    ),
    row(
      "unclosed",
      "Unclosed phases at end of dataset",
      0,
      { mean: 0.51, median: 0, max: 1, min: 0 },
      pctOrNa(rnd, false, 0),
      "num",
    ),
  ];

  const micro = [
    row("lossStreaks", "Total loss streaks", 10, { mean: 9.6, median: 10, max: 14, min: 6 }, pctOrNa(rnd, false, 50), "int"),
    row("lossRecovered", "Loss streaks recovered", 5, { mean: 4.1, median: 4, max: 9, min: 1 }, pctOrNa(rnd, false, 60), "int"),
    row(
      "lossRecRate",
      "Loss streak recovery rate",
      50.0,
      { mean: 42.1, median: 41.5, max: 72.7, min: 18.2 },
      pctOrNa(rnd, false, 62),
      "pct",
    ),
    row("winStreaks", "Total win streaks", 9, { mean: 8.9, median: 9, max: 13, min: 5 }, pctOrNa(rnd, false, 50), "int"),
    row(
      "winToRec",
      "Win streaks that led to recovery",
      5,
      { mean: 4.1, median: 4, max: 9, min: 1 },
      pctOrNa(rnd, false, 60),
      "int",
    ),
    row(
      "winRecRate",
      "Recovering win streak rate",
      55.6,
      { mean: 45.4, median: 44.8, max: 81.8, min: 20.0 },
      pctOrNa(rnd, false, 65),
      "pct",
    ),
  ];

  return {
    simulations,
    stopped,
    generalSections: [{ key: "general", title: "GENERAL", variant: "distribution", rows: general }],
    recoverySections: [
      { key: "recoveryPeriods", title: "RECOVERY PERIODS", variant: "distribution", rows: recoveryPeriods },
      { key: "macro", title: "MACRO RECOVERY", variant: "distribution", rows: macro },
      { key: "micro", title: "MICRO RECOVERY", variant: "distribution", rows: micro },
    ],
    sections: [
      { key: "general", title: "GENERAL", rows: general },
      { key: "recoveryPeriods", title: "RECOVERY PERIODS", rows: recoveryPeriods },
      { key: "macro", title: "MACRO RECOVERY", rows: macro },
      { key: "micro", title: "MICRO RECOVERY", rows: micro },
    ],
  };
}

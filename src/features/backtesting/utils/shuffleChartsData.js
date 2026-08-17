// Deterministic Shuffle-info chart payloads (Balance / Drawdown / MaxDD density).

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

const round = (v, d = 2) => Math.round(v * 10 ** d) / 10 ** d;

export const SHUFFLE_CHART_COLORS = {
  original: "#3b82f6",
  random: "#9ca3af",
  L2: "#f59e0b",
  L3: "#a855f7",
  L4: "#22d3ee",
  L1: "#34d399",
  L5: "#f472b6",
};

export const SHUFFLE_CHART_FILTERS = [
  { id: "ALL", label: "ALL" },
  { id: "random", label: "Shuffle" },
  { id: "L2", label: "L2" },
  { id: "L3", label: "L3" },
  { id: "L4", label: "L4" },
];

const STEPS = 37;
const START = 1000;

/** Reference max drawdown labels for Shuffle-info drawdown chart. */
const DD_SECTION_MAX = {
  original: 10.57,
  random: 15.9,
  L2: 20.02,
  L3: 23.41,
  L4: 23.3,
};

function scaleDrawdownPath(ddPts, targetMax) {
  const curMax = Math.max(...ddPts.map((p) => p.y), 0);
  if (curMax <= 0 || targetMax == null) return ddPts;
  const scale = targetMax / curMax;
  return ddPts.map((p) => ({ ...p, y: round(p.y * scale, 2) }));
}

function scaleSectionSeriesDrawdown(sectionSeries, targetMax) {
  if (!sectionSeries.length || targetMax == null) return;
  const worst = sectionSeries.reduce((best, s) => (s.maxDd > best.maxDd ? s : best), sectionSeries[0]);
  if (worst.maxDd <= 0) return;
  const scale = targetMax / worst.maxDd;
  for (const s of sectionSeries) {
    s.drawdown = s.drawdown.map((p) => ({ ...p, y: round(p.y * scale, 2) }));
    s.maxDd = round(s.maxDd * scale, 2);
  }
}

function maxBySection(series) {
  const buckets = {};
  for (const s of series) {
    buckets[s.section] = Math.max(buckets[s.section] ?? 0, s.maxDd);
  }
  return buckets;
}

function walkBalance(rnd, { steps, start, drift, vol }) {
  const pts = [{ x: 0, y: start }];
  let bal = start;
  for (let i = 1; i < steps; i += 1) {
    const shock = (rnd() - 0.48) * vol;
    bal = Math.max(start * 0.55, bal * (1 + drift + shock));
    pts.push({ x: i, y: round(bal, 2) });
  }
  return pts;
}

function toDrawdown(balancePts, start) {
  return balancePts.map((p) => ({
    x: p.x,
    y: round(Math.max(0, ((start - p.y) / start) * 100), 2),
  }));
}

function maxDrawdownPct(balancePts, start) {
  let peak = start;
  let maxDd = 0;
  for (const p of balancePts) {
    if (p.y > peak) peak = p.y;
    const dd = ((peak - p.y) / peak) * 100;
    if (dd > maxDd) maxDd = dd;
  }
  // Also track from initial (matches chart title)
  let fromInitial = 0;
  for (const p of balancePts) {
    const dd = ((start - p.y) / start) * 100;
    if (dd > fromInitial) fromInitial = dd;
  }
  return round(Math.max(maxDd, fromInitial), 2);
}

function gaussianKde(samples, grid, bandwidth) {
  if (!samples.length) return grid.map((x) => ({ x, y: 0 }));
  const inv = 1 / (bandwidth * Math.sqrt(2 * Math.PI));
  return grid.map((x) => {
    let sum = 0;
    for (const s of samples) {
      const z = (x - s) / bandwidth;
      sum += Math.exp(-0.5 * z * z);
    }
    return { x, y: round((sum / samples.length) * inv, 5) };
  });
}

function seriesCountFor(sectionKey, enabledN) {
  if (sectionKey === "random") return Math.min(14, Math.max(6, Math.floor(enabledN / 40) || 10));
  return Math.min(8, Math.max(4, Math.floor(enabledN / 30) || 5));
}

/**
 * Build chart model for Shuffle info → Charts.
 * @param {object} run Shuffler run
 */
export function buildShuffleChartsModel(run) {
  const rnd = mulberry32(strHash(["shuffle-charts", run?.id || "demo"].join("|")));
  const start = START;
  const steps = STEPS;

  const originalBal = walkBalance(rnd, {
    steps,
    start,
    drift: 0.0032,
    vol: 0.018,
  });
  // Nudge final toward ~1011 like the reference
  const last = originalBal[originalBal.length - 1];
  const targetFinal = 1011.21;
  const scale = targetFinal / last.y;
  for (let i = 1; i < originalBal.length; i += 1) {
    const t = i / (originalBal.length - 1);
    originalBal[i].y = round(originalBal[i].y * (1 + (scale - 1) * t), 2);
  }
  const originalDdRaw = toDrawdown(originalBal, start);
  const originalDd = scaleDrawdownPath(originalDdRaw, DD_SECTION_MAX.original);
  const originalMaxDd = DD_SECTION_MAX.original;
  const originalMaxDdPoint = originalDd.reduce(
    (best, p) => (p.y > best.y ? p : best),
    originalDd[0],
  );

  const enabledLevels = (run?.config?.pessimismLevels || [])
    .filter((l) => l.enabled)
    .map((l) => l.level);
  const sectionKeys = ["random", ...enabledLevels.filter((l) => l !== "random")];
  // Ensure L2/L3/L4 appear in demo even if shares differ
  for (const key of ["L2", "L3", "L4"]) {
    if (!sectionKeys.includes(key) && enabledLevels.includes(key)) sectionKeys.push(key);
  }
  if (!sectionKeys.includes("random")) sectionKeys.unshift("random");

  const drifts = {
    random: 0.0015,
    L1: 0.0008,
    L2: -0.0012,
    L3: -0.002,
    L4: -0.0035,
    L5: -0.0045,
  };
  const vols = {
    random: 0.022,
    L1: 0.024,
    L2: 0.028,
    L3: 0.032,
    L4: 0.038,
    L5: 0.042,
  };

  const shufflesN = Number(run?.config?.shufflesN) || 500;
  const series = [];
  for (const key of sectionKeys) {
    const n = seriesCountFor(key, shufflesN);
    for (let i = 0; i < n; i += 1) {
      const sRnd = mulberry32(strHash(["series", run?.id, key, i].join("|")));
      const bal = walkBalance(sRnd, {
        steps,
        start,
        drift: drifts[key] ?? 0,
        vol: vols[key] ?? 0.025,
      });
      const dd = toDrawdown(bal, start);
      series.push({
        id: `${key}-${i}`,
        section: key,
        label: key === "random" ? "Shuffle" : key,
        balance: bal,
        drawdown: dd,
        maxDd: maxDrawdownPct(bal, start),
        final: bal[bal.length - 1].y,
      });
    }
  }

  for (const key of sectionKeys) {
    scaleSectionSeriesDrawdown(
      series.filter((s) => s.section === key),
      DD_SECTION_MAX[key],
    );
  }

  const sectionMaxDd = maxBySection(series);

  const densityGrid = [];
  for (let x = 0; x <= 32; x += 0.5) densityGrid.push(x);

  const densityBySection = {};
  const means = {};
  for (const key of sectionKeys) {
    const samples = series.filter((s) => s.section === key).map((s) => s.maxDd);
    means[key] = samples.length
      ? round(samples.reduce((a, b) => a + b, 0) / samples.length, 2)
      : 0;
    densityBySection[key] = gaussianKde(samples, densityGrid, 2.2);
  }

  // Negative % — mirror onto [-32, 0] (left = more negative drawdown)
  const densityNegative = {};
  for (const key of sectionKeys) {
    densityNegative[key] = (densityBySection[key] || [])
      .map((p) => ({
        x: -p.x,
        y: round(p.y * (0.85 + (strHash(`${key}-neg`) % 20) / 100), 5),
      }))
      .sort((a, b) => a.x - b.x);
  }

  return {
    start,
    steps,
    original: {
      balance: originalBal,
      drawdown: originalDd,
      maxDd: originalMaxDd,
      maxDdPoint: originalMaxDdPoint,
      final: originalBal[originalBal.length - 1].y,
    },
    series,
    sectionKeys,
    sectionMaxDd,
    densityPositive: densityBySection,
    densityNegative,
    means,
  };
}

/** Wide table for multi-line Recharts: { x, original, s0, s1, ... } */
export function wideSeriesTable(paths, originalPath, keyPrefix = "s") {
  const n = originalPath.length;
  const rows = [];
  for (let i = 0; i < n; i += 1) {
    const row = { x: originalPath[i].x, original: originalPath[i].y };
    paths.forEach((path, idx) => {
      row[`${keyPrefix}${idx}`] = path[i]?.y ?? null;
    });
    rows.push(row);
  }
  return rows;
}

/** Wide density table for Area/Line: { x, random, L2, ... } */
export function wideDensityTable(densityBySection, sectionKeys) {
  const first = densityBySection[sectionKeys[0]] || [];
  return first.map((pt, i) => {
    const row = { x: pt.x };
    for (const key of sectionKeys) {
      row[key] = densityBySection[key]?.[i]?.y ?? 0;
    }
    return row;
  });
}

/**
 * Cycle data adapter — deterministic synthetic cycles from epoch metrics.
 * Contract: { id, P0, P_exit, duration_candles, mfe_pct, mae_pct, idx_mfe, idx_mae }
 */

const PAIRS = ["BTC/USDT", "ETH/USDT", "SOL/USDT", "BNB/USDT", "XRP/USDT"];
const TFS = [
  ["15m", 0.25],
  ["1h", 1],
  ["4h", 4],
];

const STAGE_PROFILES = {
  1: { win: 0.55, capLo: 0.25, capHi: 0.65, maeMu: -0.015, mfeMu: 0.025, lossHi: 0.7 },
  2: { win: 0.6, capLo: 0.32, capHi: 0.72, maeMu: -0.013, mfeMu: 0.027, lossHi: 0.6 },
  3: { win: 0.63, capLo: 0.48, capHi: 0.86, maeMu: -0.012, mfeMu: 0.028, lossHi: 0.52 },
  4: { win: 0.62, capLo: 0.45, capHi: 0.8, maeMu: -0.008, mfeMu: 0.026, lossHi: 0.4 },
};

export function mulberry32(a) {
  return function rng() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function strHash(s) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function gauss(rng, mu, sd) {
  let u = 0;
  let v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  return mu + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

export function median(a) {
  if (!a.length) return null;
  const s = [...a].sort((x, y) => x - y);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

export function getTfHours(timeframe) {
  const found = TFS.find(([tf]) => tf === timeframe);
  if (found) return found[1];
  if (typeof timeframe === "string") {
    const m = timeframe.match(/^(\d+)(m|h|d)$/i);
    if (m) {
      const n = Number(m[1]);
      const unit = m[2].toLowerCase();
      if (unit === "m") return n / 60;
      if (unit === "h") return n;
      if (unit === "d") return n * 24;
    }
  }
  return 1;
}

function resolveStageId(epoch, stageId) {
  if (stageId != null) return stageId;
  if (epoch?.stageId != null) return epoch.stageId;
  const stage = String(epoch?.stage || "").toLowerCase();
  if (stage.includes("4") || stage === "exit") return 4;
  if (stage.includes("3")) return 3;
  if (stage.includes("2")) return 2;
  return 1;
}

function resolveMeta(epoch, hoId, stageId) {
  const pairFromEpoch = epoch?.pairs || epoch?.pair || null;
  const tfFromEpoch = epoch?.timeframe || epoch?.timeRange || null;

  if (pairFromEpoch && tfFromEpoch) {
    return {
      pair: pairFromEpoch,
      timeframe: typeof tfFromEpoch === "string" && tfFromEpoch.includes("m") ? tfFromEpoch : String(tfFromEpoch),
      tfHours: getTfHours(tfFromEpoch),
    };
  }

  const h = strHash(hoId || "HO-0");
  const t = TFS[(h >>> 3) % TFS.length];
  return { pair: PAIRS[h % PAIRS.length], timeframe: t[0], tfHours: t[1] };
}

function stageProfile(stageId) {
  return STAGE_PROFILES[stageId] || STAGE_PROFILES[1];
}

/**
 * Generate synthetic POC-style cycles for an epoch.
 * @returns {{ meta: { pair, timeframe, tfHours }, cycles: Array }}
 */
export function generateCycleDataForEpoch(epoch, count = 50, options = {}) {
  const hoId = options.hyperoptId || epoch?.meta?.rowId || epoch?.hyperoptId || epoch?.id || "HO-0";
  const stageId = resolveStageId(epoch, options.stageId);
  const epochNum = options.epochNumber ?? epoch?.epochNumber ?? 1;
  const stageIdForSeed = stageId;
  const pr = stageProfile(stageIdForSeed);

  const hitRate = epoch?.hitRate != null ? epoch.hitRate / 100 : pr.win;
  const mfeMu = epoch?.mfe != null ? Math.abs(epoch.mfe) : pr.mfeMu;
  const maeMu = epoch?.mae != null ? epoch.mae : pr.maeMu;

  const meta = resolveMeta(epoch, hoId, stageId);
  const rng = mulberry32((strHash(hoId) ^ ((stageIdForSeed * 97 + epochNum) * 1000003)) >>> 0);
  const P0 = 40000;
  const cycles = [];

  for (let i = 0; i < count; i++) {
    const durC = Math.max(2, Math.round(Math.exp(gauss(rng, Math.log(12), 0.6))));
    const mfe = Math.max(0.003, gauss(rng, mfeMu, 0.012));
    const mae = Math.min(-0.002, gauss(rng, maeMu, 0.008));
    const isWin = rng() < hitRate;
    const exitR = isWin
      ? mfe * (pr.capLo + rng() * (pr.capHi - pr.capLo))
      : mae * (0.2 + rng() * pr.lossHi);
    const idxMfe = 1 + Math.floor(rng() * durC);
    const idxMae = 1 + Math.floor(rng() * durC);

    cycles.push({
      id: i + 1,
      P0,
      P_exit: P0 * (1 + exitR),
      duration_candles: durC,
      mfe_pct: mfe * 100,
      mae_pct: mae * 100,
      idx_mfe: idxMfe,
      idx_mae: idxMae,
    });
  }

  return { meta, cycles };
}

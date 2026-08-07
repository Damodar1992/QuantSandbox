// Stage 5 · Pessimism Stress-Test grid maths (§5.2, section 3).

import {
  BT_PESSIMISM_DEFAULT_ENABLED,
  BT_PESSIMISM_DEFAULT_SHARES,
  BT_PESSIMISM_LEVEL_FACTORS,
  BT_PESSIMISM_LEVELS,
} from "@/constants/backtesting";

/** Spec rounding: round(x) = floor(x + 0.5). */
export function btRound(x) {
  return Math.floor(Number(x) + 0.5);
}

export function createDefaultPessimismLevels() {
  return BT_PESSIMISM_LEVELS.map((level) => ({
    level,
    enabled: BT_PESSIMISM_DEFAULT_ENABLED[level] ?? false,
    sharePct: BT_PESSIMISM_DEFAULT_SHARES[level] ?? 0,
  }));
}

/**
 * Targets derived from the Original streaks of the parent backtest.
 * @param {{mcl:number, mcw:number, acl:number, acw:number}} original
 */
export function levelTargets(level, original) {
  const factors = BT_PESSIMISM_LEVEL_FACTORS[level] || { loss: 1, win: 1 };
  const rawAcl = (original?.acl ?? 0) * factors.loss;
  const rawAcw = (original?.acw ?? 0) * factors.win;
  return {
    mcl: btRound((original?.mcl ?? 0) * factors.loss),
    mcw: btRound((original?.mcw ?? 0) * factors.win),
    acl: btRound(rawAcl * 100) / 100,
    acw: btRound(rawAcw * 100) / 100,
    aclRange: `${Math.floor(rawAcl)}-${Math.ceil(rawAcl)}`,
    acwRange: `${Math.floor(rawAcw)}-${Math.ceil(rawAcw)}`,
  };
}

/**
 * What the engine can actually reach given the trade bag of the parent run.
 *
 * - MCL / MCW are hard-capped by the number of losing / winning trades.
 * - ACL settles near a soft ceiling slightly above the Original ACL when the
 *   engine tries to build a loss-stress level — if that differs from the
 *   target, the cell is marked unreachable (red).
 *
 * @returns {{mcl?:number, mcw?:number, acl?:number}} only the unreachable metrics
 */
export function achievableTargets(targets, bag, level) {
  const out = {};
  const losses = Number(bag?.losses ?? NaN);
  const wins = Number(bag?.wins ?? NaN);
  if (Number.isFinite(losses) && targets.mcl > losses) {
    out.mcl = losses;
  }
  if (Number.isFinite(wins) && targets.mcw > wins) {
    out.mcw = wins;
  }

  const aclCeiling = softAclCeiling(bag, level);
  if (
    Number.isFinite(aclCeiling) &&
    Number.isFinite(targets.acl) &&
    Math.abs(targets.acl - aclCeiling) > 0.02
  ) {
    out.acl = aclCeiling;
  }

  return out;
}

/** Soft ACL ceiling the engine lands on when forcing loss-stress levels. */
function softAclCeiling(bag, level) {
  const base = Number(bag?.acl);
  if (!Number.isFinite(base)) return NaN;
  const bumps = { L1: 0.69, L2: 0.7, L3: 0.7, L4: 0.74, L5: 0.74 };
  return Math.round((base + (bumps[level] ?? 0.69)) * 100) / 100;
}

/**
 * Recomputes the whole grid: runs per level, targets, achievable overrides,
 * the random remainder and the validation error.
 *
 * @param {Array<{level:string, enabled:boolean, sharePct:number}>} levels
 * @param {number} shufflesN
 * @param {{mcl:number,mcw:number,acl:number,acw:number,wins:number,losses:number}} original
 */
export function computePessimismGrid(levels, shufflesN, original) {
  const total = Number(shufflesN) || 0;
  const rows = (levels || []).map((row) => {
    const share = Number(row.sharePct) || 0;
    const runsN = row.enabled ? Math.floor((share / 100) * total) : 0;
    const targets = levelTargets(row.level, original);
    return {
      ...row,
      sharePct: share,
      runsN,
      targets,
      achievable: achievableTargets(targets, original, row.level),
    };
  });

  const enabledShare = rows
    .filter((r) => r.enabled)
    .reduce((sum, r) => sum + (Number(r.sharePct) || 0), 0);
  const enabledRuns = rows.reduce((sum, r) => sum + r.runsN, 0);

  const randomSharePct = Math.max(0, 100 - enabledShare);
  const randomRunsN = Math.max(0, total - enabledRuns);

  return {
    rows,
    enabledShare,
    randomSharePct,
    randomRunsN,
    error:
      enabledShare > 100
        ? `Enabled levels take ${enabledShare}% — the sum must not exceed 100%.`
        : null,
  };
}

/** Sections present in the result of a shuffler run, in display order. */
export function shufflerSections(config) {
  const sections = [{ key: "total", label: "Total" }];
  if (config?.stressTestEnabled) {
    sections.push({ key: "random", label: "Random Shuffle" });
    (config.pessimismLevels || [])
      .filter((l) => l.enabled)
      .forEach((l) => sections.push({ key: l.level, label: l.level }));
  }
  return sections;
}

/** `L2 126 · L3 101 · L4 51` or `off`. */
export function formatPessimismSummary(config) {
  if (!config?.stressTestEnabled) return "off";
  const grid = computePessimismGrid(
    config.pessimismLevels,
    config.shufflesN,
    config.original || {},
  );
  const parts = grid.rows.filter((r) => r.enabled).map((r) => `${r.level} ${r.runsN}`);
  return parts.length ? parts.join(" · ") : "off";
}

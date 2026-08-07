// Resolve the read-only Stage 1–4 configuration for a Stage 4 favorite epoch.
// Frozen snapshots on the risk favorite win; otherwise we walk the live
// source-chain (Signal ← Entry ← Exit ← Risk).

import {
  RISK_LOSS_STREAK_KEYS,
  RISK_STOPLOSS_KEYS,
} from "@/constants/risk";

const RISK_PARAM_KEYS = [...RISK_STOPLOSS_KEYS, ...RISK_LOSS_STREAK_KEYS];

function pickById(list, id) {
  if (!Array.isArray(list) || !list.length) return null;
  if (id == null || id === "") return list[0] || null;
  return list.find((item) => String(item.id) === String(id)) || list[0] || null;
}

/** Pull concrete risk hyperparams from a heatmap cell / midpoints bag. */
export function riskParamsFromHeatmap(heatmapParams) {
  if (!heatmapParams || typeof heatmapParams !== "object") return null;
  const out = {};
  let found = false;
  for (const key of RISK_PARAM_KEYS) {
    if (heatmapParams[key] === undefined || heatmapParams[key] === null) continue;
    const n = Number(heatmapParams[key]);
    if (!Number.isFinite(n)) continue;
    out[key] = n;
    found = true;
  }
  return found ? out : null;
}

function normalizeFrozen(block) {
  if (!block) return { label: null, indicators: [] };
  if (Array.isArray(block)) return { label: null, indicators: block };
  return {
    label: block.label ?? null,
    indicators: Array.isArray(block.indicators) ? block.indicators : [],
  };
}

function stageBlock(favorite, fallbackLabel) {
  if (!favorite) {
    return { label: null, indicators: [] };
  }
  return {
    label: favorite.label || fallbackLabel || null,
    indicators: Array.isArray(favorite.indicators) ? favorite.indicators : [],
  };
}

function hasFrozenStages(frozen) {
  if (!frozen || typeof frozen !== "object") return false;
  return Boolean(frozen.signal || frozen.entry || frozen.exit);
}

/**
 * @param {object|null} epoch — Stage 4 favorite epoch
 * @param {object} ctx
 * @returns {{
 *   stage1: { label: string|null, indicators: Array },
 *   stage2: { label: string|null, indicators: Array },
 *   stage3: { label: string|null, indicators: Array },
 *   stage4: { riskParams: object|null },
 *   lineage: { signalId: string|null, entryId: string|null, exitId: string|null },
 * }}
 */
export function resolveEpochStageConfig(epoch, ctx = {}) {
  const {
    signalBestResults = [],
    entryBestResults = [],
    exitBestResults = [],
    entryBestSourceId = "",
    exitBestSourceId = "",
    riskBestSourceId = "",
  } = ctx;

  const frozen = epoch?.indicatorsByStage;
  const frozenLineage = epoch?.lineage || null;

  const riskParams =
    epoch?.riskParams ||
    riskParamsFromHeatmap(epoch?.meta?.heatmapParams) ||
    null;

  if (hasFrozenStages(frozen)) {
    return {
      stage1: normalizeFrozen(frozen.signal),
      stage2: normalizeFrozen(frozen.entry),
      stage3: normalizeFrozen(frozen.exit),
      stage4: { riskParams },
      lineage: {
        signalId: frozenLineage?.signalId ?? null,
        entryId: frozenLineage?.entryId ?? null,
        exitId: frozenLineage?.exitId ?? null,
      },
    };
  }

  const exitFavorite = pickById(exitBestResults, frozenLineage?.exitId || riskBestSourceId);
  const entryFavorite = pickById(
    entryBestResults,
    frozenLineage?.entryId || exitBestSourceId,
  );
  const signalFavorite = pickById(
    signalBestResults,
    frozenLineage?.signalId || entryBestSourceId,
  );

  return {
    stage1: stageBlock(signalFavorite, "Signal"),
    stage2: stageBlock(entryFavorite, "Entry"),
    stage3: stageBlock(exitFavorite, "Exit"),
    stage4: { riskParams },
    lineage: {
      signalId: signalFavorite?.id ?? null,
      entryId: entryFavorite?.id ?? null,
      exitId: exitFavorite?.id ?? null,
    },
  };
}

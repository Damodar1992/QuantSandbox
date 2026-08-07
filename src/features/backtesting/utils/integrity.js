// Stage 5 · Comparability check (C6) for a validation-analytics combination.
//
// Lineage (C7) is not checked: the hierarchy guarantees it — every child keeps
// an immutable FK to its parent backtest, so a "chain broken" state cannot exist.

import { BT_INTEGRITY_FIELDS, BT_INTEGRITY_LEVEL } from "@/constants/backtesting";

const DASH = "—";

/** Projects a run onto the flat set of comparable fields. */
function lineValues(source) {
  if (!source) return null;
  const p = source.params || source.inherited || {};
  return {
    strategyEpoch: source.epochLabel ?? p.epochLabel ?? null,
    pair: p.pair ?? null,
    timeframe: p.timeframe ?? null,
    exchange: p.exchange ?? null,
    stakeMode: p.stakeMode ?? null,
    profitReserving: p.profitReserving ?? null,
    startingCapital: p.startingCapital ?? null,
  };
}

function sameValue(a, b) {
  if (a === null || a === undefined) return true; // nothing to compare against
  if (b === null || b === undefined) return true;
  if (typeof a === "number" && typeof b === "number") return Math.abs(a - b) < 1e-9;
  return String(a) === String(b);
}

function display(value) {
  if (value === null || value === undefined || value === "") return DASH;
  if (value === false) return "off";
  return String(value);
}

/**
 * @param {object} args
 * @param {object} args.backtest  parent backtest run
 * @param {object|null} args.shufflerRun
 * @param {object|null} args.syntheticRun
 * @returns {{level: string, items: Array, customPeriod: boolean}}
 */
export function checkIntegrity({ backtest, shufflerRun, syntheticRun } = {}) {
  const lines = {
    backtest: lineValues(backtest),
    shuffler: lineValues(shufflerRun),
    synthetic: lineValues(syntheticRun),
  };

  const items = [];
  let level = BT_INTEGRITY_LEVEL.OK;

  BT_INTEGRITY_FIELDS.forEach((field) => {
    const base = lines.backtest ? lines.backtest[field.key] : null;
    const mismatched = ["shuffler", "synthetic"].some((lineKey) => {
      const line = lines[lineKey];
      if (!line) return false;
      return !sameValue(base, line[field.key]);
    });
    if (!mismatched) return;
    items.push({
      field: field.key,
      label: field.label,
      critical: field.critical,
      valuesByLine: {
        backtest: display(base),
        shuffler: lines.shuffler ? display(lines.shuffler[field.key]) : DASH,
        synthetic: lines.synthetic ? display(lines.synthetic[field.key]) : DASH,
      },
    });
    if (field.critical) level = BT_INTEGRITY_LEVEL.BLOCK;
    else if (level === BT_INTEGRITY_LEVEL.OK) level = BT_INTEGRITY_LEVEL.WARN;
  });

  const customPeriod = Boolean(syntheticRun?.config?.source === "custom");
  if (customPeriod) {
    items.push({
      field: "customPeriod",
      label: "Synthetic period",
      critical: false,
      valuesByLine: {
        backtest: display(backtest?.params?.periodFrom && `${backtest.params.periodFrom} → ${backtest.params.periodTo}`),
        shuffler: "inherited",
        synthetic: "custom period",
      },
    });
    if (level === BT_INTEGRITY_LEVEL.OK) level = BT_INTEGRITY_LEVEL.WARN;
  }

  return { level, items, customPeriod };
}

export function integrityLabel(level) {
  if (level === BT_INTEGRITY_LEVEL.BLOCK) return "⛔ not comparable";
  if (level === BT_INTEGRITY_LEVEL.WARN) return "⚠ partly";
  return "✓ comparable";
}

export function integrityTone(level) {
  if (level === BT_INTEGRITY_LEVEL.BLOCK) return "text-red-400";
  if (level === BT_INTEGRITY_LEVEL.WARN) return "text-amber-300";
  return "text-green-400";
}

/** How many of the three lines are filled in. */
export function combinationCompleteness(analytics) {
  let filled = 1; // the Backtest line is always present
  if (analytics?.shufflerRunId) filled += 1;
  if (analytics?.syntheticRunId) filled += 1;
  return filled;
}

export function isCombinationComplete(analytics) {
  return combinationCompleteness(analytics) === 3;
}

/**
 * Reasons that block Save, in the order they should be listed in the title.
 */
export function saveBlockers({ analytics, integrityLevel, duplicate }) {
  const blockers = [];
  if (!analytics?.shufflerRunId) blockers.push("pick a Shuffler run");
  if (!analytics?.syntheticRunId) blockers.push("pick a Synthetic run");
  if (integrityLevel === BT_INTEGRITY_LEVEL.BLOCK) blockers.push("lines are not comparable");
  if (duplicate) blockers.push("this combination is already saved");
  return blockers;
}

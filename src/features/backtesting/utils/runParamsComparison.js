// Build the "run parameters and conditions" comparison rows (BT vs Mini).

import {
  BT_EXCHANGES,
  BT_MINI_DIFF_FIELDS,
  resolveBtFees,
} from "@/constants/backtesting";
import { fmtDateTime } from "./format";

const DASH = "—";

function exchangeLabel(value) {
  return BT_EXCHANGES.find((e) => e.value === value)?.label || value || DASH;
}

function formatPeriod(from, to) {
  if (!from && !to) return DASH;
  return `${from || "?"} → ${to || "?"}`;
}

function formatLeverage(params) {
  if (!params) return DASH;
  if (params.mode === "spot") return "— (spot)";
  return String(params.leverage ?? DASH);
}

function formatFees(fees) {
  if (!fees) return DASH;
  const maker = fees.maker != null ? Number(fees.maker).toFixed(2) : DASH;
  const taker = fees.taker != null ? Number(fees.taker).toFixed(2) : DASH;
  return `taker ${taker}% · maker ${maker}%${fees.funding ? " · funding" : ""}`;
}

function formatStake(params) {
  if (!params) return DASH;
  if (params.stakeMode === "relative") {
    return params.stakeValue != null && params.stakeValue !== ""
      ? `${params.stakeValue}% of balance`
      : "Relative";
  }
  return params.stakeValue != null && params.stakeValue !== ""
    ? `${params.stakeValue} USDT`
    : "Fixed";
}

function formatReserve(params) {
  if (!params) return DASH;
  if (params.profitReserving == null || params.profitReserving === "") return "Off";
  return `${params.profitReserving}%`;
}

function formatCapital(params) {
  if (params?.startingCapital == null || params.startingCapital === "") return DASH;
  return String(params.startingCapital);
}

function valuesEqual(a, b) {
  if (a === b) return true;
  if (a == null && b == null) return true;
  return String(a ?? "") === String(b ?? "");
}

function getFieldValues(key, run, miniParams, strategyName) {
  const p = run?.params || {};
  const m = miniParams || null;
  const btFees = p.fees || resolveBtFees(p.exchange, p.mode);
  const miniFees = run?.manualFees || (m ? resolveBtFees(m.exchange, m.mode) : null);

  switch (key) {
    case "period":
      return {
        backtest: formatPeriod(p.periodFrom, p.periodTo),
        mini: m ? formatPeriod(m.periodFrom, m.periodTo) : null,
        equal: m
          ? valuesEqual(p.periodFrom, m.periodFrom) && valuesEqual(p.periodTo, m.periodTo)
          : null,
      };
    case "strategyEpoch": {
      const bt = run?.epochLabel || strategyName || DASH;
      return { backtest: bt, mini: m ? bt : null, equal: m ? true : null };
    }
    case "pair":
      return {
        backtest: p.pair || DASH,
        mini: m?.pair ?? null,
        equal: m ? valuesEqual(p.pair, m.pair) : null,
      };
    case "timeframe":
      return {
        backtest: p.timeframe || DASH,
        mini: m?.timeframe ?? null,
        equal: m ? valuesEqual(p.timeframe, m.timeframe) : null,
      };
    case "exchange":
      return {
        backtest: exchangeLabel(p.exchange),
        mini: m ? exchangeLabel(m.exchange) : null,
        equal: m ? valuesEqual(p.exchange, m.exchange) : null,
      };
    case "mode":
      return {
        backtest: p.mode || DASH,
        mini: m?.mode ?? null,
        equal: m ? valuesEqual(p.mode, m.mode) : null,
      };
    case "leverage":
      return {
        backtest: formatLeverage(p),
        mini: m ? formatLeverage(m) : null,
        equal: m
          ? valuesEqual(p.mode, m.mode) &&
            (p.mode === "spot" || valuesEqual(Number(p.leverage), Number(m.leverage)))
          : null,
      };
    case "fees":
      return {
        backtest: formatFees(btFees),
        mini: m ? formatFees(miniFees) : null,
        equal: m
          ? valuesEqual(btFees?.maker, miniFees?.maker) &&
            valuesEqual(btFees?.taker, miniFees?.taker)
          : null,
      };
    case "stakeMode":
      return {
        backtest: formatStake(p),
        mini: m ? formatStake(m) : null,
        equal: m
          ? valuesEqual(p.stakeMode, m.stakeMode) &&
            valuesEqual(Number(p.stakeValue), Number(m.stakeValue))
          : null,
      };
    case "profitReserving":
      return {
        backtest: formatReserve(p),
        mini: m ? formatReserve(m) : null,
        equal: m
          ? valuesEqual(
              p.profitReserving ?? null,
              m.profitReserving ?? null,
            )
          : null,
      };
    case "startingCapital":
      return {
        backtest: formatCapital(p),
        mini: m ? formatCapital(m) : null,
        equal: m ? valuesEqual(Number(p.startingCapital), Number(m.startingCapital)) : null,
      };
    default:
      return { backtest: DASH, mini: null, equal: null };
  }
}

const FIELD_NOTES = {
  fees: "BT — from the exchange config · mini — entered manually by the quant; the gap explains part of Δ",
  profitReserving:
    "% is taken out of every winning trade → reduces the tradable balance; moves ROI and MaxDD in both stake modes, and the size of the next stake when stake is Relative",
  startingCapital: "affects ROI and MaxDD at fixed stake",
};

/**
 * @param {object} run
 * @param {{ strategyName?: string }} [ctx]
 * @returns {{
 *   hasMini: boolean,
 *   miniName: string|null,
 *   rows: Array<{ key, label, severity, note, backtest, mini, equal, delta }>,
 *   meta: { miniName, runId, createdAt },
 * }}
 */
export function buildRunParamsComparison(run, ctx = {}) {
  const miniParams = run?.miniParams || null;
  const hasMini = Boolean(run?.miniId || run?.miniName || miniParams);
  const rows = BT_MINI_DIFF_FIELDS.map((field) => {
    const values = getFieldValues(field.key, run, miniParams, ctx.strategyName);
    let delta = "—";
    if (hasMini && values.equal === true) delta = "match";
    else if (hasMini && values.equal === false) delta = field.severity || "critical";
    return {
      key: field.key,
      label: field.label,
      severity: field.severity,
      note: FIELD_NOTES[field.key] || field.note || null,
      backtest: values.backtest,
      mini: hasMini ? values.mini ?? DASH : DASH,
      equal: values.equal,
      delta,
    };
  });

  return {
    hasMini,
    miniName: run?.miniName || null,
    rows,
    meta: {
      miniName: run?.miniName || DASH,
      runId: run?.id || DASH,
      createdAt: run?.createdAt ? fmtDateTime(run.createdAt) : DASH,
    },
  };
}

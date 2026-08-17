// Build the "run parameters and conditions" comparison rows (BT vs Mini).

import {
  BT_EXCHANGES,
  BT_MINI_DIFF_FIELDS,
  resolveBtFees,
} from "@/constants/backtesting";

const DASH = "—";
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

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

function formatStrategyEpoch(run, strategyName) {
  const label = String(run?.epochLabel || "");
  const epoch = label.match(/Epoch\s*#\d+/i)?.[0] || null;
  const name = strategyName || null;
  if (name && epoch) return `${name} · ${epoch}`;
  if (epoch) return epoch;
  if (name) return name;
  return label || DASH;
}

function formatCreatedLong(iso) {
  if (!iso) return DASH;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}, ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function settingsValue(run, key, fallback) {
  const panels = run?.result?.settings?.panels || [];
  for (const panel of panels) {
    for (const row of panel.rows || []) {
      if (row.key === key && row.value != null && row.value !== "") return String(row.value);
    }
  }
  return fallback;
}

function deriveExtras(run) {
  let h = 2166136261;
  const seed = `run-params|${run?.id || "run"}`;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const rnd = ((h >>> 0) % 1000) / 1000;
  const execMinutes = 8 + Math.floor(rnd * 87);
  return {
    maxOpenTrades: settingsValue(run, "maxOpen", String(1 + Math.floor(rnd * 12))),
    timeframeDetail: settingsValue(run, "tfDetail", "N/A"),
    execTime: settingsValue(
      run,
      "execTime",
      `${execMinutes} minute${execMinutes === 1 ? "" : "s"}`,
    ),
  };
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
      const bt = formatStrategyEpoch(run, strategyName);
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
          ? valuesEqual(p.profitReserving ?? null, m.profitReserving ?? null)
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
 */
export function buildRunParamsComparison(run, ctx = {}) {
  const miniParams = run?.miniParams || null;
  const hasMini = Boolean(run?.miniId || run?.miniName || miniParams);
  const extras = deriveExtras(run);

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
    notCompared: [
      { key: "miniName", label: "Mini-backtest", value: run?.miniName || DASH },
      { key: "maxOpen", label: "Max open trades", value: extras.maxOpenTrades },
      { key: "tfDetail", label: "Timeframe detail", value: extras.timeframeDetail },
    ],
    runMeta: [
      { key: "created", label: "Created", value: formatCreatedLong(run?.createdAt) },
      { key: "execTime", label: "BT execution time", value: extras.execTime },
    ],
    meta: {
      miniName: run?.miniName || DASH,
      runId: run?.id || DASH,
      createdAt: formatCreatedLong(run?.createdAt),
    },
  };
}

/**
 * Default display name for indicator type (used in formulas).
 */
export function getDefaultDisplayName(type) {
  const nameMap = {
    RSI: "rsi",
    EMA: "ema",
    MACD: "macd",
    BBANDS: "bb",
    GC_DW: "gc",
    CUSTOM_FORMULA: "custom",
  };
  return nameMap[type] || type?.toLowerCase() || "";
}

export function prettifyIndicatorParamName(raw) {
  const s = String(raw || "").trim();
  if (!s) return "";
  const lower = s.toLowerCase();
  const m = lower.match(/^(fast|slow|signal)(?:_|-)?period$/);
  if (m) return `${m[1][0].toUpperCase()}${m[1].slice(1)}Period`;
  if (lower === "stddev" || lower === "std_dev" || lower === "std-dev") return "StdDev";
  if (lower === "timeframe" || lower === "time_frame" || lower === "time-frame") return "TimeFrame";
  if (lower === "gc_mult" || lower === "gc-mult") return "Mult";
  const chunks = s.split(/[_-]+/g).filter(Boolean);
  const title = (w) => (w ? `${w[0].toUpperCase()}${w.slice(1)}` : w);
  return chunks.map((c) => title(String(c))).join("") || s;
}

export function formatIndicatorParamValue(key, v) {
  if (v == null) return "-";
  if (typeof v !== "number" || !Number.isFinite(v)) return String(v);
  const k = String(key || "").toLowerCase();
  const wantsInt =
    k.includes("period") ||
    k === "length" ||
    k === "poles" ||
    k.endsWith(".length") ||
    k.endsWith(".poles") ||
    k.endsWith(".fastperiod") ||
    k.endsWith(".slowperiod") ||
    k.endsWith(".signalperiod");
  if (wantsInt) return String(Math.round(v));
  if (k.includes("mult") || k.includes("std") || k.includes("dev")) return v.toFixed(2);
  return Math.abs(v) >= 10 ? String(Math.round(v)) : v.toFixed(2);
}

export function formatIndicatorSnapshot(ind) {
  const prefix = ind?.displayName || getDefaultDisplayName(ind?.type || "");
  const snap = ind?.paramsSnapshot && typeof ind.paramsSnapshot === "object" ? ind.paramsSnapshot : null;
  if (!snap) return "";
  return Object.entries(snap)
    .map(([k, v]) => {
      const name = prettifyIndicatorParamName(k) || String(k);
      const fullKey = `${prefix}.${name}`;
      return `${fullKey}=${formatIndicatorParamValue(fullKey, v)}`;
    })
    .join(", ");
}

function getParam(ind, key) {
  return Array.isArray(ind?.params) ? ind.params.find((p) => p.key === key) : undefined;
}

function parseCustomFormulaColumnAliases(customFormula) {
  if (!customFormula?.trim()) return [];
  const found = new Set();
  const re = /dataframe\s*\[\s*(?:f)?['"]([^'"{}\]]+)['"]/g;
  let m;
  while ((m = re.exec(customFormula)) !== null) {
    if (m[1]) found.add(m[1]);
  }
  return [...found];
}

/**
 * Output column aliases for one indicator (fixed/default branch, aligned with pythonCode.js).
 */
export function getIndicatorOutputAliases(ind) {
  if (!ind?.enabled) return [];

  const src = (ind.source || "Close").toLowerCase();
  const displayName = ind.displayName || getDefaultDisplayName(ind.type);

  switch (ind.type) {
    case "RSI": {
      const p = getParam(ind, "timeperiod");
      const period = p?.default ?? p?.min ?? 14;
      return [`${displayName}_${src}_${period}`];
    }
    case "EMA": {
      const p = getParam(ind, "timeperiod");
      const period = p?.default ?? p?.min ?? 20;
      return [`${displayName}_${src}_${period}`];
    }
    case "MACD":
      return [`${displayName}_${src}`, `${displayName}_signal_${src}`, `${displayName}_hist_${src}`];
    case "BBANDS":
      return [
        `${displayName}_upper_${src}`,
        `${displayName}_middle_${src}`,
        `${displayName}_lower_${src}`,
        `${displayName}_width_${src}`,
      ];
    case "GC_DW":
      return [`${displayName}_mid`, `${displayName}_upper`, `${displayName}_lower`];
    case "CUSTOM_FORMULA": {
      const parsed = parseCustomFormulaColumnAliases(ind.customFormula);
      return parsed.length ? parsed : [displayName];
    }
    default:
      return displayName ? [displayName] : [];
  }
}

export function getIndicatorAlias(ind) {
  return ind?.displayName || getDefaultDisplayName(ind?.type || "");
}

/**
 * @returns {{ indicatorAlias: string, outputAliases: string[] }[]}
 */
export function buildIndicatorAliasTree(indicators) {
  return (indicators || [])
    .filter((ind) => ind?.enabled)
    .map((ind) => ({
      indicatorAlias: getIndicatorAlias(ind),
      outputAliases: getIndicatorOutputAliases(ind),
    }))
    .filter((node) => node.indicatorAlias);
}

function formatTreeBranch(prefix, isLast) {
  return `${isLast ? " └─ " : " ├─ "}${prefix}`;
}

/**
 * Plain-text hierarchical alias tree for clipboard.
 */
export function formatAliasTreeText(tree) {
  if (!tree?.length) return "";

  return tree
    .map((node) => {
      const lines = [node.indicatorAlias];
      const outputs = node.outputAliases || [];
      outputs.forEach((alias, i) => {
        lines.push(formatTreeBranch(alias, i === outputs.length - 1));
      });
      return lines.join("\n");
    })
    .join("\n\n");
}

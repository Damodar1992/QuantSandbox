import { RISK_STOPLOSS_KEYS, RISK_STOPLOSS_PREVIEW_DEFAULTS } from "../constants/risk";
import { generatePythonCode } from "./pythonCode";

function indentBlock(code, spaces = 8) {
  const pad = " ".repeat(spaces);
  return (code || "")
    .split("\n")
    .map((line) => (line.length ? pad + line : line))
    .join("\n");
}

function formatRiskParametersDict(ranges) {
  const lines = ["    risk_parameters = {"];
  for (const key of RISK_STOPLOSS_KEYS) {
    const r = ranges?.[key];
    const def = RISK_STOPLOSS_PREVIEW_DEFAULTS[key];
    if (!r) continue;
    lines.push(`        "${key}": {`);
    lines.push(`            "default": ${def},`);
    lines.push(`            "min": ${r.min},`);
    lines.push(`            "max": ${r.max},`);
    lines.push(`            "step": ${r.step},`);
    lines.push(`        },`);
  }
  lines.push("    }");
  return lines.join("\n");
}

function embedFormulaAsMethodBody(formula, methodName) {
  const trimmed = (formula || "").trim();
  if (!trimmed) {
    return [
      `    def ${methodName}(self, dataframe: pd.DataFrame, metadata: dict) -> pd.DataFrame:`,
      `        """Stage formula not configured."""`,
      `        return dataframe`,
      "",
    ].join("\n");
  }

  const lines = trimmed.split("\n");
  const looksLikePython = lines.some(
    (l) =>
      l.trim().startsWith("def ") ||
      l.trim().startsWith("dataframe") ||
      l.trim().startsWith("return ") ||
      l.includes("dataframe["),
  );

  if (looksLikePython && lines[0].trim().startsWith("def ")) {
    return indentBlock(trimmed, 4);
  }

  if (looksLikePython) {
    return [
      `    def ${methodName}(self, dataframe: pd.DataFrame, metadata: dict) -> pd.DataFrame:`,
      indentBlock(trimmed, 8),
      "",
    ].join("\n");
  }

  const commented = lines.map((l) => (l.trim() ? `        # ${l}` : "        #")).join("\n");
  return [
    `    def ${methodName}(self, dataframe: pd.DataFrame, metadata: dict) -> pd.DataFrame:`,
    `        """Logic from Builder (pseudo-code)."""`,
    commented,
    `        return dataframe`,
    "",
  ].join("\n");
}

/**
 * Build read-only strategy class preview for Stage 4 Risk.
 */
export function buildStrategyTemplatePreview({
  signalIndicators = [],
  entryFormula = "",
  exitFormula = "",
  riskRanges = {},
  timeframe = "5m",
}) {
  const indicatorCode = generatePythonCode(signalIndicators);
  const indicatorLines = indicatorCode.split("\n");
  const bodyStart = indicatorLines[0]?.trim().startsWith("def ") ? 1 : 0;
  const indicatorBody = indicatorLines
    .slice(bodyStart)
    .map((line) => {
      if (line.startsWith("    ")) return "        " + line.slice(4);
      if (line.trim()) return "        " + line;
      return "";
    })
    .join("\n");

  const parts = [
    "import pandas as pd",
    "",
    "",
    "class SimpleStrategyTemplate:",
    '    """',
    "    Strategy preview: Signal + Entry + Exit + Risk / Stoplosses",
    '    """',
    "",
    "    # =========================",
    "    # General",
    "    # =========================",
    "",
    `    timeframe = "${timeframe}"`,
    "    can_short = False",
    "",
    "    # =========================",
    "    # Risks / Stoplosses",
    "    # =========================",
    "",
    formatRiskParametersDict(riskRanges),
    "",
    "    # =========================",
    "    # Indicators (Stage 1 — Signal)",
    "    # =========================",
    "",
    "    def populate_indicators(self, dataframe: pd.DataFrame, metadata: dict) -> pd.DataFrame:",
    '        """',
    "        Indicators from Stage 1.",
    '        """',
    "",
    indicatorBody.trimEnd() || "        return dataframe",
    "",
    "    # =========================",
    "    # Entry (Stage 2)",
    "    # =========================",
    "",
    embedFormulaAsMethodBody(entryFormula, "populate_entry_trend"),
    "    # =========================",
    "    # Exit (Stage 3)",
    "    # =========================",
    "",
    embedFormulaAsMethodBody(exitFormula, "populate_exit_trend"),
  ];

  return parts.join("\n");
}

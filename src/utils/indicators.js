import { BASE_INDICATORS } from "../constants/indicators";

export function getParamValuesFromDef(param) {
  if (!param || param.min == null || param.max == null) return [param?.default ?? 0];
  const step = param.step ?? 1;
  const out = [];
  for (let v = param.min; v <= param.max; v += step) out.push(v);
  return out.length ? out : [param.default ?? param.min];
}

export function getParamDefForCompositeKey(indicators, compositeKey) {
  const idx = compositeKey.indexOf("_");
  if (idx <= 0 || idx === compositeKey.length - 1) return null;
  const indId = compositeKey.slice(0, idx);
  const key = compositeKey.slice(idx + 1);
  const ind = indicators.find((i) => String(i.id) === String(indId));
  if (!ind) return null;
  const userParam = Array.isArray(ind.params) ? ind.params.find((p) => p.key === key) : null;
  const baseDef = ind.type && BASE_INDICATORS[ind.type];
  const baseParam = baseDef?.params?.find((p) => p.key === key);
  const param = { ...baseParam, ...userParam, key, compositeKey };
  if (param.min == null || param.max == null) {
    param.min = param.min ?? param.default ?? 0;
    param.max = param.max ?? param.min ?? 10;
    if (param.min === param.max) param.max = param.min + (param.step ?? 1);
  }
  return param;
}

export function getParamLabel(ind, param) {
  const displayName = ind.displayName || (ind.type === "RSI" ? "rsi" : ind.type === "EMA" ? "ema" : ind.type === "MACD" ? "macd" : ind.type === "BBANDS" ? "bb" : ind.type === "GC_DW" ? "gc" : ind.type.toLowerCase());
  if (ind.type === "RSI" || ind.type === "EMA") return `${displayName}_period`;
  if (ind.type === "MACD") {
    if (param.key === "fastperiod") return `${displayName}_fast`;
    if (param.key === "slowperiod") return `${displayName}_slow`;
    if (param.key === "signalperiod") return `${displayName}_signal`;
  }
  if (ind.type === "BBANDS") {
    if (param.key === "timeperiod") return `${displayName}_period`;
    if (param.key === "nbdevup") return `${displayName}_devup`;
    if (param.key === "nbdevdn") return `${displayName}_devdn`;
    if (param.key === "matype") return `${displayName}_matype`;
  }
  if (ind.type === "GC_DW") {
    if (param.key === "length") return `${displayName}_length`;
    if (param.key === "poles") return `${displayName}_poles`;
    if (param.key === "mult") return `${displayName}_mult`;
  }
  return param.label;
}

export function getReportParamLabel(ind, param) {
  const displayName = ind.displayName || (ind.type === "RSI" ? "rsi" : ind.type === "EMA" ? "ema" : ind.type === "MACD" ? "macd" : ind.type === "BBANDS" ? "bb" : ind.type === "GC_DW" ? "gc" : ind.type.toLowerCase());
  if (ind.type === "RSI" || ind.type === "EMA") return `${displayName}_period`;
  if (ind.type === "MACD") {
    if (param.key === "fastperiod") return `${displayName}_fast`;
    if (param.key === "slowperiod") return `${displayName}_slow`;
    if (param.key === "signalperiod") return `${displayName}_signal`;
  }
  if (ind.type === "BBANDS") {
    if (param.key === "timeperiod") return `${displayName}_period`;
    if (param.key === "nbdevup") return `${displayName}_devup`;
    if (param.key === "nbdevdn") return `${displayName}_devdn`;
    if (param.key === "matype") return `${displayName}_matype`;
  }
  if (ind.type === "GC_DW") {
    if (param.key === "length") return `${displayName}_length`;
    if (param.key === "poles") return `${displayName}_poles`;
    if (param.key === "mult") return `${displayName}_mult`;
  }
  return param.label;
}

export function getIndicatorTemplate(key) {
  const base = BASE_INDICATORS[key];
  if (!base) return null;
  const codeByKey = {
    RSI: "import pandas as pd\n\ndef run(df: pd.DataFrame, timeperiod: int = 14):\n    close = df['close']\n    delta = close.diff()\n    up = delta.clip(lower=0)\n    down = (-delta).clip(lower=0)\n    rs = up.rolling(timeperiod).mean() / down.rolling(timeperiod).mean()\n    rsi = 100 - (100 / (1 + rs))\n    return {\"value\": rsi}\n",
  };
  const code = codeByKey[key] || "import pandas as pd\n\ndef run(df: pd.DataFrame, **kwargs):\n    # Indicator implementation\n    return {}";
  const parameters = (base.params || []).map((p) => ({
    name: p.key,
    type: p.key === "matype" ? "Enum" : (Number.isInteger(p.step) && p.step >= 1 ? "int" : "Float"),
    default_value: p.default,
    min: p.min,
    max: p.max,
    step: p.step,
  }));
  return { name: base.name, description: base.description || "", code, parameters, group: base.group };
}

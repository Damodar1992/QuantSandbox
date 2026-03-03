export function getDefaultDisplayName(type) {
  const nameMap = {
    RSI: "rsi",
    EMA: "ema",
    MACD: "macd",
    BBANDS: "bb",
    GC_DW: "gc",
    CUSTOM_FORMULA: "custom"
  };
  return nameMap[type] || type.toLowerCase();
}

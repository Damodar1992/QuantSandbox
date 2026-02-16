// Source options for indicators (TA-Lib compatible)
export const SOURCE_OPTIONS = ["Close", "Open", "High", "Low", "HL/2", "HLC/3", "OHLC/4"];

// MA Types (for indicators that support different MA calculations)
export const MA_TYPES = {
  0: "SMA - Simple Moving Average",
  1: "EMA - Exponential Moving Average",
  2: "WMA - Weighted Moving Average",
  3: "DEMA - Double Exponential Moving Average",
  4: "TEMA - Triple Exponential Moving Average",
  5: "TRIMA - Triangular Moving Average",
  6: "KAMA - Kaufman Adaptive Moving Average",
  7: "MAMA - MESA Adaptive Moving Average",
  8: "T3 - Triple Exponential Moving Average"
};

// Indicator groups for filtering
export const INDICATOR_GROUPS = ["All", "Trend", "Momentum", "Volatility", "Custom"];

// Base indicators with TA-Lib compliant parameters
export const BASE_INDICATORS = {
  "GC_DW": {
    group: "Trend",
    name: "CG [DW] - Gaussian Channel",
    talib: "Custom",
    params: [
      { key: "length", label: "Period", default: 20, min: 5, max: 300, step: 5 },
      { key: "poles", label: "Poles", default: 4, min: 1, max: 4, step: 1 },
      { key: "mult", label: "Band Multiplier", default: 1.5, min: 0.5, max: 5, step: 0.1 }
    ],
    metrics: ["Trend Smoothness", "Band Width", "Noise Reduction"],
    defaultSource: "Close",
    description: "Gaussian Channel with mid/upper/lower bands for trend following"
  },
  "EMA": {
    group: "Trend",
    name: "EMA - Exponential Moving Average",
    talib: "EMA",
    params: [
      { key: "timeperiod", label: "Time Period", default: 20, min: 2, max: 200, step: 1 }
    ],
    metrics: ["Trend Direction", "Support/Resistance", "Lag Reduction"],
    defaultSource: "Close",
    description: "Moving average giving more weight to recent prices"
  },
  "RSI": {
    group: "Momentum",
    name: "RSI - Relative Strength Index",
    talib: "RSI",
    params: [
      { key: "timeperiod", label: "Time Period", default: 14, min: 2, max: 100, step: 1 }
    ],
    metrics: ["Overbought/Oversold Detection", "Divergence Quality", "Momentum Strength"],
    defaultSource: "Close",
    description: "Momentum oscillator measuring speed and magnitude of price changes"
  },
  "MACD": {
    group: "Momentum",
    name: "MACD - Moving Average Convergence/Divergence",
    talib: "MACD",
    params: [
      { key: "fastperiod", label: "Fast Period", default: 12, min: 2, max: 50, step: 1 },
      { key: "slowperiod", label: "Slow Period", default: 26, min: 5, max: 100, step: 1 },
      { key: "signalperiod", label: "Signal Period", default: 9, min: 2, max: 50, step: 1 }
    ],
    metrics: ["Trend Momentum", "Crossover Signals", "Divergence Detection"],
    defaultSource: "Close",
    description: "Trend-following momentum indicator showing relationship between two MAs"
  },
  "BBANDS": {
    group: "Volatility",
    name: "BB - Bollinger Bands",
    talib: "BBANDS",
    params: [
      { key: "timeperiod", label: "Time Period", default: 20, min: 2, max: 100, step: 1 },
      { key: "nbdevup", label: "Deviations Up", default: 2, min: 0.5, max: 5, step: 0.1 },
      { key: "nbdevdn", label: "Deviations Down", default: 2, min: 0.5, max: 5, step: 0.1 },
      { key: "matype", label: "MA Type", default: 0, min: 0, max: 8, step: 1 }
    ],
    metrics: ["Volatility", "Overbought/Oversold", "Price Breakouts"],
    defaultSource: "Close",
    description: "Volatility bands placed above and below a moving average"
  },
  "CUSTOM_FORMULA": {
    group: "Custom",
    name: "Custom Formula",
    talib: "Custom",
    params: [],
    metrics: ["Custom Calculation", "Feature Engineering"],
    defaultSource: "Close",
    description: "Create custom Python formulas for indicators (e.g., dataframe['ema_slope'] = dataframe['ema'].diff(1))"
  }
};

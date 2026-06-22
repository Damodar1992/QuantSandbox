/**
 * Mini Backtest Analyzer — constants, defaults, labels, units.
 */

export const MINI_BACKTEST_DEFAULTS = {
  initialBalance: 10000,
  fixedStakeAmount: 100,
  relativeStakeAmount: 10, // %
  reservedAmount: 0,
  fees: 0.1, // %
  cycleCount: 50,
  stopout: 20, // % drawdown
};

export const MINI_BACKTEST_LABELS = {
  initialBalance: "Initial Balance",
  fixedStakeAmount: "Fixed Stake Amount",
  relativeStakeAmount: "Relative Stake Amount",
  reservedAmount: "Reserved Amount",
  fees: "Fees",
  cycleCount: "Cycle Count (max)",
  stopout: "Stopout (drawdown)",
};

export const MINI_BACKTEST_UNITS = {
  initialBalance: "USDT",
  fixedStakeAmount: "USDT",
  relativeStakeAmount: "%",
  reservedAmount: "USDT",
  fees: "%",
  cycleCount: "",
  stopout: "%",
};

/** Parameter keys in iteration order */
export const MINI_BACKTEST_PARAM_KEYS = [
  "initialBalance",
  "fixedStakeAmount",
  "relativeStakeAmount",
  "reservedAmount",
  "fees",
  "cycleCount",
  "stopout",
];

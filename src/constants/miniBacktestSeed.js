import { MINI_BACKTEST_RUN_STATUSES } from "./miniBacktest";

const now = Date.now();

/** Default demo rows shown in Mini Backtest sidebar (In Progress + Fail). */
export const INITIAL_MINI_BACKTEST_DEMO_RESULTS = [
  {
    id: "mbt-demo-in-progress",
    isDemo: true,
    runStatus: MINI_BACKTEST_RUN_STATUSES.IN_PROGRESS,
    epochId: "demo-epoch-in-progress",
    stageId: 3,
    stage: "Risk",
    stageVersionLineage: "1.1",
    hyperoptNumber: 2,
    analyzerNumber: 2,
    epochNumber: 2,
    epochLabel: "Epoch #2",
    tradingMode: "futures",
    exchange: "binance",
    pairs: "BTC/USDT",
    timeframe: "15m",
    timeRange: "2020-01-01 – 2023-06-01",
    knowRange: "2020-01-01 – 2023-06-01",
    createdAt: new Date(now - 8 * 60 * 1000).toISOString(),
  },
  {
    id: "mbt-demo-fail",
    isDemo: true,
    runStatus: MINI_BACKTEST_RUN_STATUSES.FAIL,
    epochId: "demo-epoch-fail",
    stageId: 4,
    stage: "Exit",
    stageVersionLineage: "1.2",
    hyperoptNumber: 2,
    analyzerNumber: 1,
    epochNumber: 4,
    epochLabel: "Epoch #4",
    tradingMode: "spot",
    exchange: "htx",
    pairs: "ETH/USDT",
    timeframe: "4h",
    timeRange: "2021-01-01 – 2023-09-01",
    knowRange: "2021-01-01 – 2023-09-01",
    failReason: "Cycle data could not be loaded for this epoch.",
    createdAt: new Date(now - 22 * 60 * 1000).toISOString(),
  },
];

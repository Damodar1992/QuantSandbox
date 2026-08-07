import { MINI_BACKTEST_DEFAULTS, MINI_BACKTEST_RUN_STATUSES } from "./miniBacktest";
import { BT_DEMO_EPOCH_ID } from "./backtesting";
import { MOCK_CURRENT_USER } from "./tags";
import { generateCycleDataForEpoch } from "../features/builder/utils/miniBacktestData";
import { hashParams, runMiniBacktest } from "../features/builder/utils/miniBacktestEngine";

const now = Date.now();

function buildFinishedDemoEntry({
  id = "mbt-demo-finished",
  epochId = "demo-epoch-finished",
  epochNumber = 7,
  stageId = 2,
  stage = "Entry",
  hyperoptId = "HO-demo-finished",
  analyzerId = "AN-demo-finished",
  createdOffsetMs = 2 * 60 * 1000,
} = {}) {
  const mockEpoch = {
    id: epochId,
    stageId,
    epochNumber,
    hyperoptNumber: 1,
    analyzerNumber: 3,
    hyperoptId,
    analyzerId,
    pairs: "BTC/USDT",
    timeframe: "1h",
    hitRate: 58.5,
    mfe: 3.2,
    mae: -2.1,
    air: 1.45,
    score: 0.78,
    stability: 0.82,
    label: `Epoch #${epochNumber}`,
    knowRange: "2019-06-01 – 2024-03-15",
  };

  const params = {
    ...MINI_BACKTEST_DEFAULTS,
    initialBalance: 10000,
    stakeMode: "fixed",
    fixedStakeAmount: 150,
    reservedPct: 15,
    orderType: "taker",
    marketType: "futures",
    leverage: 5,
    stopoutMode: "pct",
    stopout: 15,
    cycleCount: 50,
  };

  const { meta, cycles } = generateCycleDataForEpoch(mockEpoch, params.cycleCount, {
    stageId: mockEpoch.stageId,
    hyperoptId: mockEpoch.hyperoptId,
    epochNumber: mockEpoch.epochNumber,
  });
  const backtestResult = runMiniBacktest(cycles, params, meta);
  // Demo targets for Before/After compare tab (realistic epoch → replay survival)
  backtestResult.summary.winRate = 70;
  backtestResult.summary.pfNet = 3.02;
  backtestResult.summary.profitFactor = 3.02;
  backtestResult.epoch = {
    ...backtestResult.epoch,
    roiOHLC: 16, // $1,600 PnL on $10k start
    cagr: 2.47,
    calmar: 8.59,
  };
  const paramsHash = hashParams(params);

  return {
    id,
    isDemo: true,
    runStatus: MINI_BACKTEST_RUN_STATUSES.FINISHED,
    epochId: mockEpoch.id,
    stageId: mockEpoch.stageId,
    stage,
    stageVersionLineage: "1.3.2",
    hyperoptNumber: mockEpoch.hyperoptNumber,
    analyzerNumber: mockEpoch.analyzerNumber,
    hyperoptId: mockEpoch.hyperoptId,
    analyzerId: mockEpoch.analyzerId,
    epochNumber: mockEpoch.epochNumber,
    epochLabel: mockEpoch.label,
    epochParams: {
      mfe: mockEpoch.mfe,
      mae: mockEpoch.mae,
      air: mockEpoch.air,
      hitRate: mockEpoch.hitRate,
      score: mockEpoch.score,
      stability: mockEpoch.stability,
    },
    tradingMode: "futures",
    exchange: "binance",
    pairs: mockEpoch.pairs,
    timeframe: mockEpoch.timeframe,
    timeRange: mockEpoch.knowRange,
    knowRange: mockEpoch.knowRange,
    timeFrameStart: "2019-06-01",
    timeFrameEnd: "2024-03-15",
    cycleMeta: meta,
    cycleData: cycles,
    params,
    paramsHash,
    result: backtestResult,
    createdAt: new Date(now - createdOffsetMs).toISOString(),
  };
}

/** Default demo rows shown in Mini Backtest sidebar (Finished + In Progress + Fail). */
export const INITIAL_MINI_BACKTEST_DEMO_RESULTS = [
  buildFinishedDemoEntry(),
  // Linked to Stage 5 seeded favorite so Run Backtest can inherit Mini#N.
  buildFinishedDemoEntry({
    id: "mbt-demo-stage5-finished",
    epochId: BT_DEMO_EPOCH_ID,
    epochNumber: 126,
    stageId: 4,
    stage: "Risk",
    hyperoptId: "HO-demo-stage5",
    analyzerId: "AN-demo-stage5",
    createdOffsetMs: 3 * 60 * 1000,
  }),
  {
    id: "mbt-demo-in-progress",
    isDemo: true,
    runStatus: MINI_BACKTEST_RUN_STATUSES.IN_PROGRESS,
    epochId: "demo-epoch-in-progress",
    stageId: 3,
    stage: "Exit",
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
    stage: "Risk",
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

/** Seed global registry: demo runs across multiple strategies. */
export function buildInitialGlobalMiniBacktestResults() {
  const [finished, stage5Finished, inProgress, failed] = INITIAL_MINI_BACKTEST_DEMO_RESULTS;
  const owner = MOCK_CURRENT_USER.login;
  return [
    { ...finished, strategyId: 1, strategyName: "EMA Bounce", owner },
    { ...stage5Finished, strategyId: 1, strategyName: "EMA Bounce", owner },
    { ...inProgress, strategyId: 1, strategyName: "EMA Bounce", owner },
    { ...failed, strategyId: 2, strategyName: "RSI Mean Reversion", owner },
  ];
}

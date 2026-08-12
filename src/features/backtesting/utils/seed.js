// Stage 5 · demo branches for the seeded favorite epoch.
// Everything here is mock data: shapes match §4 of the tech spec exactly so the
// same components will work once a real API is wired in.

import {
  BT_ANALYTICS_STATUS,
  BT_DEMO_EPOCH_ID,
  BT_ERROR_CODES,
  BT_RUN_STATUS,
  BT_VOLATILITY_DEFAULT,
  resolveBtFees,
} from "@/constants/backtesting";
import { checkIntegrity } from "./integrity";
import { createDefaultPessimismLevels } from "./pessimism";
import { buildBacktestResult, buildShufflerResult, buildSyntheticResult } from "./mockResults";

const AUTHOR = "bogdan@grogubrains.io";
const EPOCH_LABEL = "Epoch #126 · BTC/USDT · 1h · Full data";

function baseParams(overrides = {}) {
  const exchange = overrides.exchange || "binance";
  const mode = overrides.mode || "spot";
  return {
    periodFrom: "2023-01-01",
    periodTo: "2023-06-30",
    pair: "BTC/USDT",
    timeframe: "1h",
    exchange,
    mode,
    leverage: mode === "spot" ? 1 : 5,
    startingCapital: 10000,
    stakeMode: "fixed",
    stakeValue: 100,
    profitReserving: null,
    fees: resolveBtFees(exchange, mode),
    ...overrides,
  };
}

function inheritedFromBacktest(run) {
  const p = run.params;
  const streaks = run.result?.streaks || {};
  return {
    startingCapital: p.startingCapital,
    stakeMode: p.stakeMode,
    stakeValue: p.stakeValue,
    profitReserving: p.profitReserving,
    mode: p.mode,
    leverage: p.leverage,
    exchange: p.exchange,
    pair: p.pair,
    timeframe: p.timeframe,
    feeMaker: p.fees?.maker ?? null,
    feeTaker: p.fees?.taker ?? null,
    funding: Boolean(p.fees?.funding),
    slippage: run.result?.slippagePct ?? null,
    stopOut: false,
    trades: run.result?.core?.trades ?? null,
    wins: streaks.wins ?? null,
    losses: streaks.losses ?? null,
    periodFrom: p.periodFrom,
    periodTo: p.periodTo,
  };
}

function makeBacktest({ id, miniName, miniId, createdAt, status, error, params }) {
  const run = {
    id,
    epochId: BT_DEMO_EPOCH_ID,
    epochLabel: EPOCH_LABEL,
    miniId: miniId ?? null,
    miniName: miniName ?? null,
    miniParams: null,
    miniCore: null,
    manualFees: null,
    params: baseParams(params),
    editedFields: [],
    status,
    progress: { pct: status === BT_RUN_STATUS.DONE ? 100 : 0 },
    error: error ?? null,
    result: null,
    shufflerRuns: [],
    syntheticRuns: [],
    analytics: [],
    createdAt,
    createdBy: AUTHOR,
  };
  if (status === BT_RUN_STATUS.DONE) run.result = buildBacktestResult(run);
  return run;
}

function makeShuffler({ id, parent, simulationMode, shufflesN, approach, stressTestEnabled, createdAt }) {
  const levels = createDefaultPessimismLevels();
  const run = {
    id,
    backtestId: parent.id,
    epochLabel: parent.epochLabel,
    config: {
      simulationMode,
      shufflesN,
      approach,
      stressTestEnabled,
      pessimismLevels: levels,
      exportRepresentatives: false,
      original: parent.result?.streaks || {},
    },
    inherited: inheritedFromBacktest(parent),
    status: BT_RUN_STATUS.DONE,
    progress: { doneN: shufflesN, totalN: shufflesN },
    error: null,
    result: null,
    selectedForValidation: false,
    createdAt,
    createdBy: AUTHOR,
  };
  run.result = buildShufflerResult(run, parent);
  return run;
}

function makeSynthetic({ id, parent, method, volatility, nRuns, source, customPeriod, createdAt }) {
  const run = {
    id,
    backtestId: parent.id,
    epochLabel: parent.epochLabel,
    config: {
      source: source || "inherited",
      customPeriod: customPeriod || null,
      method,
      volatility,
      nRuns,
    },
    inherited: inheritedFromBacktest(parent),
    status: BT_RUN_STATUS.DONE,
    progress: { generationPct: 100, backtestsDoneN: nRuns, totalN: nRuns },
    error: null,
    result: null,
    selectedForValidation: false,
    createdAt,
    createdBy: AUTHOR,
  };
  run.result = buildSyntheticResult(run, parent);
  return run;
}

function makeAnalytics({ id, parent, shufflerRunId, syntheticRunId, status, note, promoted, savedAt }) {
  const shufflerRun = parent.shufflerRuns.find((r) => r.id === shufflerRunId) || null;
  const syntheticRun = parent.syntheticRuns.find((r) => r.id === syntheticRunId) || null;
  const integrity = checkIntegrity({ backtest: parent, shufflerRun, syntheticRun });
  return {
    id,
    backtestId: parent.id,
    shufflerRunId: shufflerRunId ?? null,
    syntheticRunId: syntheticRunId ?? null,
    status,
    integrity,
    matrix: null,
    promoted: Boolean(promoted),
    author: status === BT_ANALYTICS_STATUS.SAVED ? AUTHOR : null,
    savedAt: status === BT_ANALYTICS_STATUS.SAVED ? savedAt : null,
    note: note ?? null,
    archived: false,
    createdAt: savedAt,
    createdBy: AUTHOR,
  };
}

/** @returns {{ [epochId: string]: { runs: Array, archive: Array } }} */
export function createBacktestingSeed() {
  const bt1 = makeBacktest({
    id: "oos-4f2a9c71b83d",
    miniId: null,
    miniName: "Mini#1",
    createdAt: "2026-07-28T09:14:00.000Z",
    status: BT_RUN_STATUS.DONE,
  });
  bt1.miniParams = { ...bt1.params };
  bt1.miniCore = {
    roi: (bt1.result.core.roi ?? 0) * 1.08,
    pnl: (bt1.result.core.pnl ?? 0) * 1.08,
    maxdd: (bt1.result.core.maxdd ?? 0) * 0.94,
    pf: (bt1.result.core.pf ?? 0) * 1.05,
    winrate: (bt1.result.core.winrate ?? 0) * 1.01,
    trades: bt1.result.core.trades,
  };
  bt1.manualFees = { maker: 0.05, taker: 0.05, funding: false };

  const sh1 = makeShuffler({
    id: "a91c47f2e0",
    parent: bt1,
    simulationMode: "static",
    shufflesN: 500,
    approach: "full",
    stressTestEnabled: true,
    createdAt: "2026-07-28T10:02:00.000Z",
  });
  const sh2 = makeShuffler({
    id: "5be03d1a7c",
    parent: bt1,
    simulationMode: "dynamic",
    shufflesN: 1000,
    approach: "block_by_streak",
    stressTestEnabled: false,
    createdAt: "2026-07-29T08:41:00.000Z",
  });
  bt1.shufflerRuns = [sh2, sh1];
  sh1.selectedForValidation = true;

  const sy1 = makeSynthetic({
    id: "soc-7d10bc94a2",
    parent: bt1,
    method: "metric_generator",
    volatility: BT_VOLATILITY_DEFAULT,
    nRuns: 1000,
    createdAt: "2026-07-28T11:20:00.000Z",
  });
  bt1.syntheticRuns = [sy1];
  sy1.selectedForValidation = true;

  const a1 = makeAnalytics({
    id: "A-1",
    parent: bt1,
    shufflerRunId: sh1.id,
    syntheticRunId: sy1.id,
    status: BT_ANALYTICS_STATUS.SAVED,
    note: "STATIC line only proves MaxDD stability; Synthetic percentile on MaxDD is acceptable.",
    promoted: true,
    savedAt: "2026-07-29T12:05:00.000Z",
  });
  const a2 = makeAnalytics({
    id: "A-2",
    parent: bt1,
    shufflerRunId: sh2.id,
    syntheticRunId: null,
    status: BT_ANALYTICS_STATUS.DRAFT,
    note: null,
    savedAt: "2026-07-30T07:15:00.000Z",
  });
  bt1.analytics = [a1, a2];

  const bt2 = makeBacktest({
    id: "oos-b7e1d05a9f34",
    miniId: null,
    miniName: null,
    createdAt: "2026-08-02T15:47:00.000Z",
    status: BT_RUN_STATUS.FAILED,
    error: BT_ERROR_CODES.NO_DATA_FOR_PERIOD,
    params: { pair: "SOL/USDT", mode: "futures", exchange: "htx", periodFrom: "2019-01-01", periodTo: "2019-03-01" },
  });

  const archived = makeAnalytics({
    id: "A-1",
    parent: bt1,
    shufflerRunId: sh1.id,
    syntheticRunId: sy1.id,
    status: BT_ANALYTICS_STATUS.SAVED,
    note: "Earlier branch (deleted): kept for the record.",
    savedAt: "2026-07-12T16:30:00.000Z",
  });
  archived.archived = true;
  archived.backtestId = "oos-1c0d55ab7e21";

  return {
    [BT_DEMO_EPOCH_ID]: {
      runs: [bt2, bt1],
      archive: [archived],
    },
  };
}

export const BT_SEED_AUTHOR = AUTHOR;

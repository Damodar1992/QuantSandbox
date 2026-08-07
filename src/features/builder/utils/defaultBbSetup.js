import { BT_DEMO_EPOCH_ID } from "../../../constants/backtesting";
import { BASE_INDICATORS } from "../../../constants/indicators";
import { FILTER_PRESET_BUILTIN } from "../../../components/heatmap/heatmapFilterPresets";
import { buildIndicatorSnapshot } from "../../../utils/builder";

export const DEFAULT_BB_INDICATOR_IDS = {
  signal: 1001,
  entry: 1002,
  exit: 1003,
};

export const DEFAULT_FAVORITE_EPOCH_IDS = {
  signal: "favorite-signal-epoch-1",
  entry: "favorite-entry-epoch-1",
  exit: "favorite-exit-epoch-1",
  risk: BT_DEMO_EPOCH_ID,
};

/** @deprecated use DEFAULT_BB_INDICATOR_IDS */
export const DEFAULT_BB_INDICATOR_ID = DEFAULT_BB_INDICATOR_IDS.entry;

export function createDefaultBbIndicator(id = DEFAULT_BB_INDICATOR_IDS.entry) {
  const base = BASE_INDICATORS.BBANDS;
  return {
    id,
    type: "BBANDS",
    name: base.name,
    displayName: "bb",
    source: base.defaultSource,
    params: base.params.map((p) => ({ ...p })),
    metrics: [...(base.metrics || [])],
    enabled: true,
  };
}

export function getBbHeatmapAxisKeys(indicatorId = DEFAULT_BB_INDICATOR_IDS.entry) {
  return {
    xAxis: [`${indicatorId}_timeperiod`, `${indicatorId}_nbdevup`],
    yAxis: [`${indicatorId}_nbdevdn`, `${indicatorId}_matype`],
  };
}

export function buildDefaultBbHeatmapConfig(indicators) {
  const bb = indicators.find((i) => i.type === "BBANDS") || indicators[0];
  if (!bb) return null;

  const { xAxis, yAxis } = getBbHeatmapAxisKeys(bb.id);
  const filterRoot = FILTER_PRESET_BUILTIN["Super filter"]();

  return {
    indicators: [bb],
    xAxis,
    yAxis,
    fixedParams: {},
    filters: {
      logic: filterRoot.rootLogic,
      groups: filterRoot.groups.map((g) => ({
        logic: g.logic,
        conditions: g.conditions.map((c) => ({ field: c.field, op: c.op, value: c.value })),
      })),
    },
    filterPreset: "Super filter",
  };
}

function snapshotWithParams(indicatorId, displayName, paramsSnapshot) {
  const bb = createDefaultBbIndicator(indicatorId);
  bb.displayName = displayName;
  const snapshot = buildIndicatorSnapshot(bb);
  snapshot.displayName = displayName;
  snapshot.paramsSnapshot = { ...paramsSnapshot };
  return { bb, snapshot };
}

function createDefaultFavoriteEpoch({ id, indicatorId, label, epochNumber, displayName, paramsSnapshot }) {
  const { bb, snapshot } = snapshotWithParams(
    indicatorId,
    displayName || "bb",
    paramsSnapshot || {
      timeperiod: 20,
      nbdevup: 2,
      nbdevdn: 2,
      matype: 0,
    },
  );

  return {
    id,
    source: "heatmap",
    label,
    timestamp: "2024-01-15T12:04:00.000Z",
    score: 0.782,
    mfe: 0.652,
    mae: -0.418,
    air: 1.452,
    stability: 0.714,
    indicators: [snapshot],
    indicatorsRaw: [{ ...bb }],
    pairs: "BTC/USDT",
    timeRange: "2020-01-01 – 2023-06-01",
    hyperoptType: "Brute Force",
    epochNumber,
    hyperoptNumber: 1,
    analyzerNumber: 1,
    meta: {
      rowId: "hr1",
      subId: "hr1-1",
      detailId: "hr1-1-full",
      detailLabel: "Full data (from HeatMap)",
      date: "2024-01-15T12:04:00",
      hyperoptNumber: 1,
      analyzerNumber: 1,
    },
  };
}

export function createDefaultSignalFavoriteEpoch() {
  return createDefaultFavoriteEpoch({
    id: DEFAULT_FAVORITE_EPOCH_IDS.signal,
    indicatorId: DEFAULT_BB_INDICATOR_IDS.signal,
    label: "Epoch #1 · BTC/USDT · 1h · Full data · Signal",
    epochNumber: 1,
    displayName: "bb-signal",
    paramsSnapshot: { timeperiod: 20, nbdevup: 2, nbdevdn: 2, matype: 0 },
  });
}

export function createDefaultEntryFavoriteEpoch() {
  return createDefaultFavoriteEpoch({
    id: DEFAULT_FAVORITE_EPOCH_IDS.entry,
    indicatorId: DEFAULT_BB_INDICATOR_IDS.entry,
    label: "Epoch #1 · BTC/USDT · 1h · Full data · Entry",
    epochNumber: 1,
    displayName: "bb-entry",
    paramsSnapshot: { timeperiod: 14, nbdevup: 2.2, nbdevdn: 2.2, matype: 0 },
  });
}

export function createDefaultExitFavoriteEpoch() {
  return createDefaultFavoriteEpoch({
    id: DEFAULT_FAVORITE_EPOCH_IDS.exit,
    indicatorId: DEFAULT_BB_INDICATOR_IDS.exit,
    label: "Epoch #1 · BTC/USDT · 1h · Full data · Exit",
    epochNumber: 1,
    displayName: "bb-exit",
    paramsSnapshot: { timeperiod: 10, nbdevup: 1.8, nbdevdn: 1.8, matype: 1 },
  });
}

/**
 * Favorite epoch promoted out of Stage 4 — the only input Stage 5 validates.
 * Carries frozen Stage 1–3 indicator snapshots + resolved risk hyperparameters.
 */
export function createDefaultRiskFavoriteEpoch() {
  const signal = createDefaultSignalFavoriteEpoch();
  const entry = createDefaultEntryFavoriteEpoch();
  const exit = createDefaultExitFavoriteEpoch();

  const epoch = createDefaultFavoriteEpoch({
    id: DEFAULT_FAVORITE_EPOCH_IDS.risk,
    indicatorId: DEFAULT_BB_INDICATOR_IDS.exit,
    label: "Epoch #126 · BTC/USDT · 1h · Full data · Final",
    epochNumber: 126,
    displayName: "bb-exit",
    paramsSnapshot: { ...exit.indicators[0].paramsSnapshot },
  });
  epoch.timeframe = "1h";
  epoch.riskParams = {
    stoploss: -0.035,
    trailing_activation: 0.03,
    trailing_distance: 0.015,
    loss_streak_threshold: 3,
    post_loss_cooldown_candles: 2,
  };
  epoch.lineage = {
    signalId: signal.id,
    entryId: entry.id,
    exitId: exit.id,
  };
  epoch.indicatorsByStage = {
    signal: { label: signal.label, indicators: signal.indicators.map((s) => ({ ...s, paramsSnapshot: { ...s.paramsSnapshot } })) },
    entry: { label: entry.label, indicators: entry.indicators.map((s) => ({ ...s, paramsSnapshot: { ...s.paramsSnapshot } })) },
    exit: { label: exit.label, indicators: exit.indicators.map((s) => ({ ...s, paramsSnapshot: { ...s.paramsSnapshot } })) },
  };
  return epoch;
}

import { BASE_INDICATORS } from "../../../constants/indicators";
import { FILTER_PRESET_BUILTIN } from "../../../components/heatmap/heatmapFilterPresets";
import { buildIndicatorSnapshot } from "../../../utils/builder";

export const DEFAULT_BB_INDICATOR_IDS = {
  signal: 1001,
  entry: 1002,
  exit: 1003,
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

function createDefaultFavoriteEpoch({ id, indicatorId, label, epochNumber }) {
  const bb = createDefaultBbIndicator(indicatorId);
  const snapshot = buildIndicatorSnapshot(bb);
  snapshot.paramsSnapshot = {
    timeperiod: 20,
    nbdevup: 2,
    nbdevdn: 2,
    matype: 0,
  };

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
    id: "favorite-signal-epoch-1",
    indicatorId: DEFAULT_BB_INDICATOR_IDS.signal,
    label: "Epoch #1 · BTC/USDT · 1h · Full data",
    epochNumber: 1,
  });
}

export function createDefaultEntryFavoriteEpoch() {
  return createDefaultFavoriteEpoch({
    id: "favorite-entry-epoch-1",
    indicatorId: DEFAULT_BB_INDICATOR_IDS.entry,
    label: "Epoch #1 · BTC/USDT · 1h · Full data",
    epochNumber: 1,
  });
}

export function createDefaultExitFavoriteEpoch() {
  return createDefaultFavoriteEpoch({
    id: "favorite-exit-epoch-1",
    indicatorId: DEFAULT_BB_INDICATOR_IDS.exit,
    label: "Epoch #1 · BTC/USDT · 1h · Full data",
    epochNumber: 1,
  });
}

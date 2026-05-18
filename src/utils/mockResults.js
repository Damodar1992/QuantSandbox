import { RISK_HEATMAP_METRIC_BY_KEY } from "../constants/risk";

const MOCK_HEATMAP_SIZE = 900;
const MOCK_GRID_SIDE = Math.round(Math.sqrt(MOCK_HEATMAP_SIZE));

function axisValueAt(metric, index, side) {
  if (!metric) return index + 1;
  if (side <= 1) return metric.min;
  const t = index / (side - 1);
  return metric.min + (metric.max - metric.min) * t;
}

function normalize01(value, metric) {
  if (!metric || metric.max === metric.min) return 0.5;
  return (value - metric.min) / (metric.max - metric.min);
}

export function generateMockRiskHeatmapResults(config, runId) {
  const xAxis = config.xAxis?.length ? config.xAxis : ["profit_factor"];
  const yAxis = config.yAxis?.length ? config.yAxis : ["drawdown"];
  const xKey = xAxis[0];
  const yKey = yAxis[0];
  const fixed = config.fixedParams || {};

  const xMetric = RISK_HEATMAP_METRIC_BY_KEY[xKey];
  const yMetric = RISK_HEATMAP_METRIC_BY_KEY[yKey];
  const side = MOCK_GRID_SIDE;
  const results = [];
  const centerI = (side - 1) / 2;
  const centerJ = (side - 1) / 2;
  const radius = Math.max(0.1, Math.min(centerI, centerJ) * 1.2);
  const runSeed = Number(String(runId).replace(/\D/g, "") || 0);

  for (let i = 0; i < side; i++) {
    for (let j = 0; j < side; j++) {
      const xVal = axisValueAt(xMetric, i, side);
      const yVal = axisValueAt(yMetric, j, side);
      const pf = xKey === "profit_factor" ? xVal : yVal;
      const dd = xKey === "drawdown" ? xVal : yVal;
      const params = {
        ...fixed,
        [xKey]: xVal,
        [yKey]: yVal,
        profit_factor: pf,
        drawdown: dd,
      };
      const pfNorm = normalize01(pf, RISK_HEATMAP_METRIC_BY_KEY.profit_factor);
      const ddNorm = normalize01(dd, RISK_HEATMAP_METRIC_BY_KEY.drawdown);
      const quality = pfNorm * (1 - ddNorm);

      const dist = Math.sqrt((i - centerI) ** 2 + (j - centerJ) ** 2);
      const radial = radius > 0 ? Math.max(0, 1 - dist / radius) : 1;
      const u = (i * 17 + j * 31 + runSeed) % 997 / 997;
      const score = Math.max(
        0.001,
        Math.min(1, quality * 0.55 + radial * radial * 0.35 + 0.05 + (u * 0.06 - 0.03)),
      );

      const v = (i * 41 + j * 13) % 991 / 991;
      results.push({
        id: `res-${runId}-${i * side + j}`,
        params,
        score,
        profit_factor: pf,
        drawdown: dd,
        mfe: 0.12 + u * 0.23,
        mae: -0.08 + v * 0.06,
        air: 1.4 + u * 0.7,
        hitRate: 56.5 + v * 5.8,
      });
    }
  }
  return results;
}

export function generateMockResults(config, runId) {
  if (config?.heatmapVariant === "risk") {
    return generateMockRiskHeatmapResults(config, runId);
  }

  const xAxis = config.xAxis && config.xAxis.length ? config.xAxis : ["x"];
  const yAxis = config.yAxis && config.yAxis.length ? config.yAxis : ["y"];
  const xKey = xAxis[0];
  const yKey = yAxis[0];
  const fixed = config.fixedParams || {};

  const side = MOCK_GRID_SIDE;
  const results = [];
  const centerI = (side - 1) / 2;
  const centerJ = (side - 1) / 2;
  const radius = Math.max(0.1, Math.min(centerI, centerJ) * 1.2);

  for (let i = 0; i < side; i++) {
    for (let j = 0; j < side; j++) {
      const params = { ...fixed };
      params[xKey] = 1 + i;
      params[yKey] = 1 + j;
      const dist = Math.sqrt((i - centerI) ** 2 + (j - centerJ) ** 2);
      const t = radius > 0 ? Math.max(0, 1 - dist / radius) : 1;
      const score = Math.max(0.001, Math.min(1, t * t * 0.95 + 0.05 + (Math.random() * 0.06 - 0.03)));
      const u = (i * 17 + j * 31 + Number(String(runId).replace(/\D/g, "") || 0)) % 997 / 997;
      const v = (i * 41 + j * 13) % 991 / 991;
      const mfe = 0.12 + u * 0.23;
      const mae = -0.08 + v * 0.06;
      const air = 1.4 + u * 0.7;
      const hitRate = 56.5 + v * 5.8;
      results.push({
        id: `res-${runId}-${i * side + j}`,
        params,
        score,
        mfe,
        mae,
        air,
        hitRate,
      });
    }
  }
  return results;
}

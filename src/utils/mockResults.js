import { RISK_HEATMAP_METRIC_BY_KEY } from "../constants/risk";

const MOCK_SIDE = 25;

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

/**
 * Deterministic seeded pseudo-random from two integers.
 */
function seedRng(a, b, seed) {
  return ((a * 17 + b * 31 + seed) % 997) / 997;
}

/**
 * Sparse mock matching the reference: ~252 records, cluster on the right half,
 * empty cells on the left, scores in range [-0.07, 0.30].
 */
export function generateMockResults(config, runId) {
  if (config?.heatmapVariant === "risk") {
    return generateMockRiskHeatmapResults(config, runId);
  }

  const xAxis = config.xAxis && config.xAxis.length ? config.xAxis : ["x"];
  const yAxis = config.yAxis && config.yAxis.length ? config.yAxis : ["y"];
  const xKey = xAxis[0];
  const yKey = yAxis[0];
  const fixed = config.fixedParams || {};
  const runSeed = Number(String(runId).replace(/\D/g, "") || 0);

  const side = MOCK_SIDE;
  const results = [];

  // Cluster centre: right-centre of the 25x25 grid
  const clusterCi = side - 1;
  const clusterCj = (side - 1) / 2;
  const clusterRadius = side * 0.55;

  for (let i = 0; i < side; i++) {
    for (let j = 0; j < side; j++) {
      const u = seedRng(i, j, runSeed);
      const v = seedRng(i * 3, j * 7 + 1, runSeed + 11);

      // Only emit a result with probability that rises towards cluster centre
      const dist = Math.sqrt((i - clusterCi) ** 2 + (j - clusterCj) ** 2);
      const density = Math.max(0, 1 - dist / clusterRadius);
      if (u > density * 0.9 + 0.05) continue;

      // Score: Gaussian-ish around cluster centre, allow slightly negative
      const t = Math.max(0, 1 - dist / clusterRadius);
      const baseScore = t * t * 0.37 - 0.07;
      const noise = v * 0.06 - 0.03;
      const score = Math.min(0.30, baseScore + noise);

      const params = { ...fixed };
      params[xKey] = 1 + i;
      params[yKey] = 1 + j;

      const mfe = 0.05 + u * 0.12;
      const mae = -(0.03 + v * 0.05);
      const air = 1.4 + u * 0.9;
      const hitRate = 50 + v * 10;

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

export function generateMockRiskHeatmapResults(config, runId) {
  const xAxis = config.xAxis?.length ? config.xAxis : ["profit_factor"];
  const yAxis = config.yAxis?.length ? config.yAxis : ["drawdown"];
  const xKey = xAxis[0];
  const yKey = yAxis[0];
  const fixed = config.fixedParams || {};

  const xMetric = RISK_HEATMAP_METRIC_BY_KEY[xKey];
  const yMetric = RISK_HEATMAP_METRIC_BY_KEY[yKey];
  const side = MOCK_SIDE;
  const results = [];
  const runSeed = Number(String(runId).replace(/\D/g, "") || 0);

  // Same sparse-cluster approach: cluster in right half, empty left
  const clusterCi = side - 1;
  const clusterCj = (side - 1) / 2;
  const clusterRadius = side * 0.55;

  for (let i = 0; i < side; i++) {
    for (let j = 0; j < side; j++) {
      const u = seedRng(i, j, runSeed);
      const v = seedRng(i * 3, j * 7 + 1, runSeed + 11);

      const dist = Math.sqrt((i - clusterCi) ** 2 + (j - clusterCj) ** 2);
      const density = Math.max(0, 1 - dist / clusterRadius);
      if (u > density * 0.9 + 0.05) continue;

      const xVal = axisValueAt(xMetric, i, side);
      const yVal = axisValueAt(yMetric, j, side);
      const pf = xKey === "profit_factor" ? xVal : yVal;
      const dd = xKey === "drawdown" ? xVal : yVal;
      const params = { ...fixed, [xKey]: xVal, [yKey]: yVal, profit_factor: pf, drawdown: dd };

      const pfNorm = normalize01(pf, RISK_HEATMAP_METRIC_BY_KEY.profit_factor);
      const ddNorm = normalize01(dd, RISK_HEATMAP_METRIC_BY_KEY.drawdown);
      const quality = pfNorm * (1 - ddNorm);
      const t = Math.max(0, 1 - dist / clusterRadius);
      const score = Math.min(0.30, quality * 0.25 + t * t * 0.12 - 0.07 + (u * 0.06 - 0.03));

      results.push({
        id: `res-${runId}-${i * side + j}`,
        params,
        score,
        profit_factor: pf,
        drawdown: dd,
        mfe: 0.05 + u * 0.12,
        mae: -(0.03 + v * 0.05),
        air: 1.4 + u * 0.7,
        hitRate: 50 + v * 10,
      });
    }
  }
  return results;
}

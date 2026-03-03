const MOCK_HEATMAP_SIZE = 900;
const MOCK_GRID_SIDE = Math.round(Math.sqrt(MOCK_HEATMAP_SIZE));

export function generateMockResults(config, runId) {
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
      results.push({ id: `res-${runId}-${i * side + j}`, params, score });
    }
  }
  return results;
}

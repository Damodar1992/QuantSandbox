/**
 * Build a Favorite-Epoch-shaped object from hyperopt row/sub + heatmap epoch index.
 */
export function buildEpochFromHyperoptContext({
  row,
  sub,
  heatMapId,
  epochNum,
  generatedHeatMap,
  buildBestResult,
  pairs,
  timeRange,
}) {
  const heatmapResults =
    generatedHeatMap?.runId === heatMapId ? generatedHeatMap.fullResults : null;
  const heatmapResult = heatmapResults?.[epochNum - 1];

  const best = buildBestResult({
    label: `Epoch #${epochNum}`,
    source: "mini-backtest-hyperopt",
    scores: heatmapResult
      ? { avg: heatmapResult.score, min: heatmapResult.score, max: heatmapResult.score }
      : { min: sub.minScore, avg: sub.avgScore, max: sub.maxScore },
    meta: {
      rowId: row.id,
      subId: sub.id,
      detailId: `epoch-${epochNum}`,
      detailLabel: `Epoch #${epochNum}`,
      date: sub.date || row.date,
      hyperoptNumber: row.hyperoptNumber,
      analyzerNumber: sub.analyzerNumber,
      heatmapParams: heatmapResult?.params,
    },
    timeRangeOverride: row.timeFrame,
  });

  return {
    ...best,
    ...(heatmapResult && {
      score: heatmapResult.score,
      mfe: heatmapResult.mfe ?? best.mfe,
      mae: heatmapResult.mae ?? best.mae,
      air: heatmapResult.air ?? best.air,
      hitRate: heatmapResult.hitRate,
    }),
    epochNumber: epochNum,
    hyperoptNumber: row.hyperoptNumber,
    analyzerNumber: sub.analyzerNumber,
    pairs: row.pairs ?? pairs,
    timeframe: row.timeFrame ?? timeRange,
    timeRange: row.knowRange ?? row.timeFrame ?? timeRange,
    knowRange: row.knowRange,
    foldSize: sub.foldSize,
  };
}

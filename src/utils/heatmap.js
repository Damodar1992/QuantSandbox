const HEATMAP_MAX_SIZE = 15;

export function clamp(v, a = 0, b = 1) {
  return Math.max(a, Math.min(b, v));
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function quantile(sortedArr, q) {
  if (!sortedArr.length) return 0;
  const pos = (sortedArr.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  if (sortedArr[base + 1] === undefined) return sortedArr[base];
  return sortedArr[base] + rest * (sortedArr[base + 1] - sortedArr[base]);
}

export function computeRanges(items, keys) {
  const out = {};
  for (const k of keys) {
    let min = Infinity;
    let max = -Infinity;
    for (const it of items) {
      const v = it.params?.[k];
      if (v != null && v < min) min = v;
      if (v != null && v > max) max = v;
    }
    out[k] = { min: min === Infinity ? null : min, max: max === -Infinity ? null : max };
  }
  return out;
}

export function normalizeParam(v, min, max) {
  if (min === null || max === null || max === min) return 0.5;
  return clamp((v - min) / (max - min));
}

export function buildHeatMap(items, config, zoomRanges = null) {
  if (!items || items.length === 0) return null;
  const xParams = config.xAxis && config.xAxis.length ? config.xAxis : ["x"];
  const yParams = config.yAxis && config.yAxis.length ? config.yAxis : ["y"];
  const fixedParams = config.fixedParams || {};
  const scoreDirection = config.scoreDirection || "max";
  const axisKeys = new Set([...xParams, ...yParams]);

  let filtered = items;
  if (Object.keys(fixedParams).length) {
    filtered = filtered.filter((it) => {
      for (const [k, v] of Object.entries(fixedParams)) {
        if (axisKeys.has(k)) continue;
        if (it.params?.[k] !== v) return false;
      }
      return true;
    });
  }
  if (zoomRanges) {
    const allKeys = [...xParams, ...yParams];
    filtered = filtered.filter((it) => {
      for (const k of allKeys) {
        const r = zoomRanges[k];
        if (!r || r.min == null || r.max == null) continue;
        const v = it.params?.[k];
        if (v == null || v < r.min || v > r.max) return false;
      }
      return true;
    });
  }
  const N = filtered.length;
  if (N === 0) return null;

  const desiredMin = 9;
  const desiredMax = Math.min(HEATMAP_MAX_SIZE, 13);
  const base = Math.round(clamp(Math.sqrt(Math.max(N, 1)) / 6, 0, 1) * (desiredMax - desiredMin) + desiredMin);
  const X = clamp(base, desiredMin, desiredMax);
  const Y = clamp(base, desiredMin, desiredMax);

  const allKeys = [...new Set([...xParams, ...yParams])];
  const ranges = computeRanges(filtered, allKeys);

  const xRangeValid = xParams.some((k) => {
    const r = ranges[k];
    return r && r.min != null && r.max != null && r.max !== r.min;
  });
  const yRangeValid = yParams.some((k) => {
    const r = ranges[k];
    return r && r.min != null && r.max != null && r.max !== r.min;
  });
  const useIndexCoords = !xRangeValid || !yRangeValid || filtered.length >= 100;

  const withCoords = filtered.map((it, index) => {
    let xCoord;
    let yCoord;
    if (useIndexCoords) {
      const n = filtered.length;
      const cols = Math.max(1, Math.ceil(Math.sqrt(n)));
      const rows = Math.max(1, Math.ceil(n / cols));
      const col = index % cols;
      const row = Math.floor(index / cols);
      xCoord = cols > 1 ? col / (cols - 1) : 0.5;
      yCoord = rows > 1 ? row / (rows - 1) : 0.5;
      xCoord = clamp(xCoord);
      yCoord = clamp(yCoord);
    } else {
      const xVals = xParams.map((k) => normalizeParam(it.params?.[k], ranges[k]?.min, ranges[k]?.max));
      const yVals = yParams.map((k) => normalizeParam(it.params?.[k], ranges[k]?.min, ranges[k]?.max));
      xCoord = xVals.reduce((a, b) => a + b, 0) / Math.max(1, xVals.length);
      yCoord = yVals.reduce((a, b) => a + b, 0) / Math.max(1, yVals.length);
    }
    return { ...it, xCoord, yCoord };
  });

  const skipCentering = useIndexCoords;
  let centerX = 0.5;
  let centerY = 0.5;
  if (!skipCentering) {
    const sorted = [...withCoords].sort((a, b) =>
      scoreDirection === "min" ? a.score - b.score : b.score - a.score
    );
    const k = Math.max(10, Math.min(sorted.length, Math.floor(sorted.length * 0.06)));
    const top = sorted.slice(0, k);
    const topX = top.map((t) => t.xCoord).sort((a, b) => a - b);
    const topY = top.map((t) => t.yCoord).sort((a, b) => a - b);
    centerX = quantile(topX, 0.5);
    centerY = quantile(topY, 0.5);
  }

  const centered = withCoords.map((it) => {
    const x = skipCentering ? it.xCoord : clamp(it.xCoord - centerX + 0.5);
    const y = skipCentering ? it.yCoord : clamp(it.yCoord - centerY + 0.5);
    return { ...it, xCentered: x, yCentered: y };
  });

  const cells = Array.from({ length: Y }, () => Array.from({ length: X }, () => []));
  for (const it of centered) {
    const xi = Math.min(X - 1, Math.max(0, Math.floor(it.xCentered * X)));
    const yi = Math.min(Y - 1, Math.max(0, Math.floor(it.yCentered * Y)));
    cells[yi][xi].push(it);
  }

  const allScores = centered.map((d) => d.score);
  const sMin = allScores.length ? Math.min(...allScores) : 0;
  const sMax = allScores.length ? Math.max(...allScores) : 1;

  const matrix = cells.map((row, yi) =>
    row.map((bucket, xi) => {
      if (!bucket.length) {
        return {
          xi,
          yi,
          count: 0,
          avgScore: null,
          minScore: null,
          maxScore: null,
          paramRanges: { x: computeRanges([], xParams), y: computeRanges([], yParams) },
          results: [],
          zoomRanges: null,
        };
      }
      let sum = 0;
      let min = Infinity;
      let max = -Infinity;
      for (const b of bucket) {
        sum += b.score;
        if (b.score < min) min = b.score;
        if (b.score > max) max = b.score;
      }
      const avg = sum / bucket.length;
      const xRanges = computeRanges(bucket, xParams);
      const yRanges = computeRanges(bucket, yParams);
      const zoomRangesForCell = { ...computeRanges(bucket, [...xParams, ...yParams]) };
      for (const key of Object.keys(zoomRangesForCell)) {
        if (zoomRangesForCell[key].min === null) delete zoomRangesForCell[key];
      }
      return {
        xi,
        yi,
        count: bucket.length,
        avgScore: avg,
        minScore: min,
        maxScore: max,
        paramRanges: { x: xRanges, y: yRanges },
        results: bucket,
        zoomRanges: Object.keys(zoomRangesForCell).length ? zoomRangesForCell : null,
      };
    })
  );

  return {
    N,
    W: X,
    H: Y,
    scoreMin: sMin,
    scoreMax: sMax,
    centerX,
    centerY,
    cells: matrix,
    xKeys: xParams,
    yKeys: yParams,
  };
}

export function formatScore(v) {
  if (v == null || Number.isNaN(v)) return "—";
  const n = Number(v);
  if (n >= 1) return "1";
  return n.toFixed(3);
}

export function heatmapScoreToColor(t01) {
  const t = clamp(t01);
  const hue = lerp(8, 130, t);
  const sat = lerp(78, 65, t);
  const light = lerp(32, 45, t);
  return `hsl(${hue}, ${sat}%, ${light}%)`;
}

export const HEATMAP_LEGEND_STOPS = 9;
export const HEATMAP_CELL_PX = 28;
export const HEATMAP_GAP_PX = 4;
export const EMPTY_CELL_BG = "rgba(255,255,255,0.04)";

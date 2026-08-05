import React, { memo, useMemo } from "react";
import { cx, ui } from "../../../../constants/ui";
import { crmSurface } from "../../../../constants/crmAccent";
import { computeImprovementDomain, formatImprovementPct } from "../../utils/comparativeWidgetStats";
import { MetricBoxplotRow } from "./MetricBoxplotRow";

function AxisLegend({ domain }) {
  const span = domain.max - domain.min;
  const zeroPct = span ? ((0 - domain.min) / span) * 100 : 50;

  return (
    <div className="mt-2 grid grid-cols-[minmax(120px,150px)_minmax(0,1fr)_72px] items-center gap-3 border-t border-[#303030] px-2 pt-2.5">
      <span className="text-[11px] font-medium uppercase tracking-wide text-[#a6a6a6]">Metric</span>
      <div className="relative h-5 min-w-0">
        <span className="absolute left-0 top-0 text-[11px] font-medium tabular-nums text-[#d9d9d9]">
          {formatImprovementPct(domain.min)}
        </span>
        <span
          className="absolute top-0 -translate-x-1/2 text-[11px] font-semibold text-[#faf7fd]"
          style={{ left: `${zeroPct}%` }}
        >
          0%
        </span>
        <span className="absolute right-0 top-0 text-[11px] font-medium tabular-nums text-[#d9d9d9]">
          {formatImprovementPct(domain.max)}
        </span>
      </div>
      <span className="text-right text-[11px] font-medium uppercase tracking-wide text-[#a6a6a6]">Median</span>
    </div>
  );
}

/**
 * One "Stage {baseline} vs Stage {current}" block: all selected metrics of the
 * same current-stage epoch set compared against a single previous-stage
 * baseline epoch.
 */
export const ComparisonBlock = memo(function ComparisonBlock({
  comparison,
  currentEpochCount,
  selectedMetricKeys,
}) {
  const { baselineStage, currentStage, baselineEpochId, baselineStatus } = comparison;

  const visibleMetrics = useMemo(
    () => (comparison.metrics || []).filter((m) => selectedMetricKeys.includes(m.metric)),
    [comparison.metrics, selectedMetricKeys],
  );

  const domain = useMemo(() => computeImprovementDomain(visibleMetrics), [visibleMetrics]);

  const baselineUnavailable = baselineStatus === "unavailable";

  return (
    <section
      className={cx(
        ui.radius,
        "w-full border border-l-4 border-l-violet-500 p-3",
        crmSurface.border,
        "bg-[#0f0f0f]",
      )}
    >
      <header className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-[12px] font-semibold text-violet-200">
          Stage {baselineStage} vs Stage {currentStage}
        </h3>
        <div className="text-[10px] text-[#8c8c8c]">
          {baselineUnavailable ? (
            <span>Baseline: —</span>
          ) : (
            <span>Baseline: selected epoch {baselineEpochId}</span>
          )}
          <span className="mx-1.5 text-[#3a3350]">|</span>
          <span>{currentEpochCount} current-stage epochs</span>
        </div>
      </header>

      {baselineUnavailable ? (
        <div className="rounded border border-amber-500/40 bg-amber-500/5 px-3 py-2.5 text-[11px] text-amber-100/90">
          Selected epoch for Stage {baselineStage} is unavailable
        </div>
      ) : (
        <div className="min-w-0">
          <div className="flex flex-col">
            {visibleMetrics.map((metric) => (
              <MetricBoxplotRow
                key={metric.metric}
                metric={metric}
                domain={domain}
              />
            ))}
          </div>
          <AxisLegend domain={domain} />
        </div>
      )}
    </section>
  );
});

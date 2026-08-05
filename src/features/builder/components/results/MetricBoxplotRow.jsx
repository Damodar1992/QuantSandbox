import React, { memo, useMemo } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cx } from "../../../../constants/ui";
import { crmSurface } from "../../../../constants/crmAccent";
import {
  METRIC_DIRECTION_LABELS,
  ZERO_BASELINE_REASON,
  formatImprovementPct,
  formatMetricValue,
  formatOutcomeShare,
} from "../../utils/comparativeWidgetStats";

// green-* (not emerald-*): the dual theme remaps emerald accents to violet,
// which would erase the improved/worsened distinction.
const OUTCOME_TONE = {
  improved: { dot: "bg-green-400", text: "text-green-400", bar: "bg-green-500/70" },
  worsened: { dot: "bg-red-400", text: "text-red-300", bar: "bg-red-500/70" },
  unchanged: { dot: "bg-[#8c8c8c]", text: "text-[#a6a6a6]", bar: "bg-[#595959]" },
};

function toPercentPosition(value, domain) {
  const span = domain.max - domain.min;
  if (!span) return 50;
  const pct = ((value - domain.min) / span) * 100;
  return Math.min(100, Math.max(0, pct));
}

function medianTone(median) {
  if (typeof median !== "number" || !Number.isFinite(median)) return "neutral";
  if (median > 0) return "positive";
  if (median < 0) return "negative";
  return "neutral";
}

const TONE_STYLES = {
  positive: { box: "bg-green-500/25 border-green-400/70", median: "bg-green-300", whisker: "bg-green-400/60", value: "text-green-400" },
  negative: { box: "bg-red-500/25 border-red-400/70", median: "bg-red-300", whisker: "bg-red-400/60", value: "text-red-300" },
  neutral: { box: "bg-[#3a3350]/60 border-[#6e6682]", median: "bg-[#d9d9d9]", whisker: "bg-[#6e6682]", value: "text-[#a6a6a6]" },
};

function Boxplot({ metric, domain }) {
  const tone = TONE_STYLES[medianTone(metric.medianImprovementPct)];

  const zeroPos = toPercentPosition(0, domain);
  const q1Pos = toPercentPosition(metric.q1ImprovementPct, domain);
  const q3Pos = toPercentPosition(metric.q3ImprovementPct, domain);
  const medianPos = toPercentPosition(metric.medianImprovementPct, domain);
  const minPos = toPercentPosition(metric.whiskerMinImprovementPct, domain);
  const maxPos = toPercentPosition(metric.whiskerMaxImprovementPct, domain);
  const boxWidth = Math.max(q3Pos - q1Pos, 0.6);

  return (
    <div className="relative h-7 w-full min-w-0" aria-hidden>
      {/* baseline (0%) reference */}
      <div
        className="absolute inset-y-0 w-px bg-[#8c8c8c]"
        style={{ left: `${zeroPos}%` }}
      />

      {/* whiskers */}
      <div
        className={cx("absolute top-1/2 h-px -translate-y-1/2", tone.whisker)}
        style={{ left: `${minPos}%`, width: `${Math.max(maxPos - minPos, 0.2)}%` }}
      />
      <div
        className={cx("absolute top-1/2 h-3 w-px -translate-y-1/2", tone.whisker)}
        style={{ left: `${minPos}%` }}
      />
      <div
        className={cx("absolute top-1/2 h-3 w-px -translate-y-1/2", tone.whisker)}
        style={{ left: `${maxPos}%` }}
      />

      {/* box Q1 → Q3 */}
      <div
        className={cx("absolute top-1/2 h-4 -translate-y-1/2 rounded-[2px] border", tone.box)}
        style={{ left: `${q1Pos}%`, width: `${boxWidth}%` }}
      />

      {/* median marker */}
      <div
        className={cx("absolute top-1/2 h-5 w-[2px] -translate-y-1/2 rounded-full", tone.median)}
        style={{ left: `${medianPos}%` }}
      />
    </div>
  );
}

function OutcomesBar({ metric }) {
  const segments = [
    { key: "improved", share: metric.improvedShare },
    { key: "worsened", share: metric.worsenedShare },
    { key: "unchanged", share: metric.unchangedShare },
  ];

  return (
    <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-[#1a1a1a]">
      {segments.map((segment) =>
        segment.share > 0 ? (
          <div
            key={segment.key}
            className={OUTCOME_TONE[segment.key].bar}
            style={{ width: `${segment.share}%` }}
          />
        ) : null,
      )}
    </div>
  );
}

function TooltipRow({ label, value, valueClassName }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className="text-[#8c8c8c]">{label}</span>
      <span className={cx("tabular-nums text-[#d9d9d9]", valueClassName)}>{value}</span>
    </div>
  );
}

function MetricTooltipContent({ metric }) {
  const unit = metric.unit;
  const notCalculable = metric.status !== "available";

  return (
    <div className="w-[290px] space-y-2 p-1">
      <div>
        <div className="text-[12px] font-medium text-[#faf7fd]">{metric.label}</div>
        <div className="text-[10px] text-[#8c8c8c]">{METRIC_DIRECTION_LABELS[metric.direction]}</div>
      </div>

      {notCalculable ? (
        <div className="space-y-1 text-[11px]">
          <div className="text-amber-300">Percentage comparison unavailable</div>
          <div className="text-[10px] text-[#8c8c8c]">
            {metric.reason === ZERO_BASELINE_REASON
              ? "Baseline value is 0"
              : metric.reason === "missing_baseline_value"
                ? "Baseline value is missing"
                : "No eligible epochs for this metric"}
          </div>
        </div>
      ) : (
        <>
          <div className="space-y-1 text-[11px]">
            <div className="text-[10px] font-medium uppercase tracking-wide text-[#6e6682]">Comparison</div>
            <TooltipRow label="Baseline Value" value={formatMetricValue(metric.baselineValue, unit)} />
            <TooltipRow label="Median Epoch Value" value={formatMetricValue(metric.medianCurrentValue, unit)} />
            <TooltipRow
              label="Median Improvement"
              value={formatImprovementPct(metric.medianImprovementPct)}
              valueClassName={TONE_STYLES[medianTone(metric.medianImprovementPct)].value}
            />
          </div>

          <div className="space-y-1 text-[11px]">
            <div className="text-[10px] font-medium uppercase tracking-wide text-[#6e6682]">Distribution</div>
            <TooltipRow
              label="Middle 50% (IQR)"
              value={`${formatImprovementPct(metric.q1ImprovementPct)} → ${formatImprovementPct(metric.q3ImprovementPct)}`}
            />
            <TooltipRow
              label="Typical Range"
              value={`${formatImprovementPct(metric.whiskerMinImprovementPct)} → ${formatImprovementPct(metric.whiskerMaxImprovementPct)}`}
            />
          </div>

          <div className="space-y-1 text-[11px]">
            <div className="text-[10px] font-medium uppercase tracking-wide text-[#6e6682]">Epoch outcomes</div>
            {[
              { key: "improved", label: "Improved", share: metric.improvedShare, count: metric.improvedCount },
              { key: "worsened", label: "Worsened", share: metric.worsenedShare, count: metric.worsenedCount },
              { key: "unchanged", label: "Unchanged", share: metric.unchangedShare, count: metric.unchangedCount },
            ].map((outcome) => (
              <div key={outcome.key} className="flex items-baseline justify-between gap-4">
                <span className="flex items-center gap-1.5 text-[#8c8c8c]">
                  <span className={cx("h-1.5 w-1.5 rounded-full", OUTCOME_TONE[outcome.key].dot)} />
                  {outcome.label}
                </span>
                <span className={cx("tabular-nums", OUTCOME_TONE[outcome.key].text)}>
                  {formatOutcomeShare(outcome.share, outcome.count, metric.eligibleEpochCount)}
                </span>
              </div>
            ))}
            <OutcomesBar metric={metric} />
          </div>
        </>
      )}
    </div>
  );
}

/**
 * One metric of one comparison block: label, horizontal boxplot of the
 * normalized Improvement % and the tooltip with the full breakdown.
 */
export const MetricBoxplotRow = memo(function MetricBoxplotRow({
  metric,
  domain,
}) {
  const available = metric.status === "available";
  const tone = TONE_STYLES[medianTone(metric.medianImprovementPct)];

  const summary = useMemo(() => {
    if (!available) return "n/a";
    return formatImprovementPct(metric.medianImprovementPct);
  }, [available, metric.medianImprovementPct]);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          tabIndex={0}
          className={cx(
            "grid grid-cols-[minmax(120px,150px)_minmax(0,1fr)_72px] items-center gap-3 rounded px-2 py-1 outline-none",
            "hover:bg-[rgba(168,96,240,0.08)] focus-visible:bg-[rgba(168,96,240,0.12)] focus-visible:ring-1 focus-visible:ring-violet-500/50",
          )}
        >
          <span className="truncate text-[11px] text-[#d9d9d9]">{metric.label}</span>

          {available ? (
            <Boxplot metric={metric} domain={domain} />
          ) : (
            <span className="text-[10px] text-amber-300/90">
              {metric.reason === ZERO_BASELINE_REASON
                ? "Percentage comparison unavailable · Baseline value is 0"
                : "Comparison is unavailable for this metric"}
            </span>
          )}

          <span
            className={cx(
              "text-right text-[11px] tabular-nums",
              available ? tone.value : "text-[#6e6682]",
            )}
          >
            {summary}
          </span>
        </div>
      </TooltipTrigger>
      <TooltipContent
        // The trigger spans the full row width, so a side placement cannot fit
        // horizontally; top/bottom lets Radix shift the tooltip into the viewport.
        side="top"
        align="start"
        sideOffset={8}
        collisionPadding={12}
        avoidCollisions
        className={cx("max-w-none border p-2", crmSurface.border, "bg-[#1f1f1f]")}
      >
        <MetricTooltipContent metric={metric} />
      </TooltipContent>
    </Tooltip>
  );
});

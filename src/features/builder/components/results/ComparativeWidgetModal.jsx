import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
import { CircleHelp } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cx } from "../../../../constants/ui";
import { crmSurface } from "../../../../constants/crmAccent";
import { AppButton } from "../../../../components/common/AppButton";
import { AppDialog } from "../../../../components/common/AppDialog";
import { HeatmapFiltersEditor } from "../../../../components/heatmap";
import {
  filterRootToFiltersConfig,
  filtersConfigToFilterRoot,
} from "../../../../components/heatmap/heatmapFilterPresets";
import { COMPARATIVE_METRICS } from "../../utils/comparativeWidgetStats";
import { fetchComparativeWidgetData } from "../../utils/comparativeWidgetMock";
import { ComparisonBlock } from "./ComparisonBlock";

const ALL_METRIC_KEYS = COMPARATIVE_METRICS.map((m) => m.key);

const TOOLTIP_FIELD_HELP = [
  {
    label: "Baseline Value",
    text: "Absolute value of this metric for the quant-selected epoch of the previous stage. This is the comparison point — never Best Epoch or Rank 1.",
  },
  {
    label: "Median Epoch Value",
    text: "Median of the absolute values of this metric across all eligible epochs of the current stage — the typical raw reading before normalization.",
  },
  {
    label: "Median Improvement",
    text: "Median of the normalized Improvement % across eligible current-stage epochs. Positive means better than baseline, negative means worse, zero means unchanged. This is the value shown by the boxplot median marker.",
  },
  {
    label: "Middle 50% (IQR)",
    text: "Interquartile range of Improvement %: from the 25th to the 75th percentile. Half of the eligible epochs fall in this band. Drawn as the box on the chart.",
  },
  {
    label: "Typical Range",
    text: "Whisker min → max: the extreme actual Improvement % values that still lie inside the 1.5×IQR fences. Outliers beyond the fences are excluded from the whiskers in MVP.",
  },
  {
    label: "Improved",
    text: "Share and count of eligible epochs whose unrounded Improvement % is greater than zero (better than baseline for this metric).",
  },
  {
    label: "Worsened",
    text: "Share and count of eligible epochs whose unrounded Improvement % is less than zero (worse than baseline for this metric).",
  },
  {
    label: "Unchanged",
    text: "Share and count of eligible epochs whose Improvement % is exactly zero (identical to baseline for this metric).",
  },
];

function countAppliedFilters(filters) {
  if (!filters?.groups?.length) return 0;
  let count = 0;
  for (const group of filters.groups) {
    for (const cond of group.conditions || []) {
      if (cond.value !== "" && cond.value != null) count += 1;
    }
  }
  return count;
}

function MetricsFilter({ selectedKeys, onChange }) {
  const toggle = (key) => {
    onChange(
      selectedKeys.includes(key)
        ? selectedKeys.filter((k) => k !== key)
        : ALL_METRIC_KEYS.filter((k) => k === key || selectedKeys.includes(k)),
    );
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <AppButton type="button" variant="outline" size="sm" className="whitespace-nowrap">
          Metrics · {selectedKeys.length}/{ALL_METRIC_KEYS.length}
        </AppButton>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[240px] gap-0.5 p-1.5">
        <div className="flex items-center justify-between gap-2 px-2 pb-1 pt-0.5">
          <span className="text-[10px] uppercase tracking-wide text-[#6e6682]">Metrics</span>
          <button
            type="button"
            onClick={() => onChange(ALL_METRIC_KEYS)}
            className="rounded px-1.5 py-0.5 text-[10px] text-violet-300 hover:bg-[#1a1a1a]"
          >
            Select all
          </button>
        </div>
        <div className="flex max-h-64 flex-col gap-0.5 overflow-y-auto">
          {COMPARATIVE_METRICS.map((metric) => {
            const checked = selectedKeys.includes(metric.key);
            return (
              <label
                key={metric.key}
                className={cx(
                  "flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-[11px] text-[#d9d9d9] hover:bg-[#1a1a1a]",
                  checked && "bg-violet-500/10 text-violet-200",
                )}
              >
                <Checkbox
                  checked={checked}
                  onCheckedChange={() => toggle(metric.key)}
                  className="size-3.5 border-[#505050]"
                />
                <span className="truncate">{metric.label}</span>
              </label>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function EpochFiltersControl({ filters, filterPreset, onApply }) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filterDraft, setFilterDraft] = useState(() => filtersConfigToFilterRoot(filters));
  const [filterPresetDraft, setFilterPresetDraft] = useState(filterPreset || "");

  useEffect(() => {
    if (filtersOpen) {
      setFilterDraft(filtersConfigToFilterRoot(filters));
      setFilterPresetDraft(filterPreset || "");
    }
  }, [filtersOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtersApplied = useMemo(() => countAppliedFilters(filters), [filters]);

  const handleApply = useCallback(() => {
    onApply?.({
      filters: filterRootToFiltersConfig(filterDraft),
      filterPreset: filterPresetDraft || "",
    });
    setFiltersOpen(false);
  }, [filterDraft, filterPresetDraft, onApply]);

  return (
    <Popover open={filtersOpen} onOpenChange={setFiltersOpen}>
      <PopoverTrigger asChild>
        <AppButton type="button" variant="outline" size="sm" className="whitespace-nowrap gap-1.5">
          <span
            className={cx(
              "h-1.5 w-1.5 rounded-full",
              filtersApplied > 0 ? "bg-violet-400" : "bg-[#8c8c8c]",
            )}
          />
          {filtersApplied} filters applied
        </AppButton>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        side="bottom"
        className="w-[360px] p-0 border-[rgba(60,40,80,0.45)] bg-[#170f29] shadow-[0_16px_40px_rgba(6,3,20,0.55)]"
      >
        <HeatmapFiltersEditor
          filterRoot={filterDraft}
          onFilterRootChange={setFilterDraft}
          filterPreset={filterPresetDraft}
          onFilterPresetChange={setFilterPresetDraft}
          onApply={handleApply}
          applyLabel="Apply"
        />
      </PopoverContent>
    </Popover>
  );
}

function MetricsLegendInfo() {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <AppButton
          type="button"
          variant="outline"
          size="icon-xs"
          aria-label="Tooltip field legend"
          title="Tooltip field legend"
        >
          <CircleHelp className="h-3.5 w-3.5" />
        </AppButton>
      </TooltipTrigger>
      <TooltipContent
        side="bottom"
        align="end"
        sideOffset={8}
        collisionPadding={12}
        className="max-w-[360px] space-y-2 p-3 text-left"
      >
        <div className="text-[11px] font-medium text-[#faf7fd]">Metric tooltip fields</div>
        <div className="space-y-2">
          {TOOLTIP_FIELD_HELP.map((entry) => (
            <div key={entry.label} className="space-y-0.5">
              <div className="text-[11px] font-medium text-violet-200">{entry.label}</div>
              <div className="text-[10px] leading-snug text-[#a6a6a6]">{entry.text}</div>
            </div>
          ))}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

function SkeletonBar({ className }) {
  return <div className={cx("animate-pulse rounded bg-[#241a38]", className)} />;
}

function LoadingSkeleton({ blockCount }) {
  return (
    <div className="space-y-3">
      <SkeletonBar className="h-4 w-2/5" />
      {Array.from({ length: Math.max(1, blockCount) }).map((_, blockIndex) => (
        <div
          key={`skeleton-block-${blockIndex}`}
          className={cx("space-y-2 rounded-md border border-l-4 border-l-violet-500/40 p-3", crmSurface.border)}
        >
          <SkeletonBar className="h-3.5 w-40" />
          {Array.from({ length: 5 }).map((__, rowIndex) => (
            <div
              key={`skeleton-row-${blockIndex}-${rowIndex}`}
              className="grid grid-cols-[minmax(120px,150px)_minmax(0,1fr)_72px] items-center gap-3"
            >
              <SkeletonBar className="h-3 w-24" />
              <SkeletonBar className="h-4 w-full" />
              <SkeletonBar className="h-3 w-12" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function EmptyState({ children }) {
  return (
    <div
      className={cx(
        "rounded-md border px-3 py-6 text-center text-[11px] text-[#8c8c8c]",
        crmSurface.border,
      )}
    >
      {children}
    </div>
  );
}

/**
 * Comparative Widget — distribution of all current-stage epochs against the
 * quant-selected baseline epoch of every previous stage of the same lineage.
 * The current stage comes from the Post-processing result context; there is no
 * stage selector. Epoch filters can be edited live (same editor as HeatMap)
 * and rebuild the comparison without leaving the widget.
 */
export const ComparativeWidgetModal = memo(function ComparativeWidgetModal({
  open,
  context,
  onClose,
  onFiltersChange,
}) {
  const [selectedMetricKeys, setSelectedMetricKeys] = useState(ALL_METRIC_KEYS);
  const [activeFilters, setActiveFilters] = useState(null);
  const [activeFilterPreset, setActiveFilterPreset] = useState("");
  const [status, setStatus] = useState("idle");
  const [data, setData] = useState(null);
  const [reloadToken, setReloadToken] = useState(0);

  const currentStage = context?.currentStage ?? null;
  const expectedBlockCount = Math.max(0, (currentStage ?? 1) - 1);

  useEffect(() => {
    if (!open) {
      setActiveFilters(null);
      setActiveFilterPreset("");
      return;
    }
    setSelectedMetricKeys(ALL_METRIC_KEYS);
    setActiveFilters(context?.filters ?? { logic: "and", groups: [] });
    setActiveFilterPreset(context?.filterPreset ?? "");
  }, [open, context?.runId, context?.itemId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open || !context?.runId || !currentStage || activeFilters == null) return undefined;

    let cancelled = false;
    setStatus("loading");
    setData(null);

    fetchComparativeWidgetData({
      runId: context.runId,
      strategyName: context.strategyName,
      timeframe: context.timeframe,
      period: context.period,
      currentStage,
      filters: activeFilters,
    })
      .then((response) => {
        if (cancelled) return;
        setData(response);
        setStatus("ready");
      })
      .catch(() => {
        if (cancelled) return;
        setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [
    open,
    context?.runId,
    context?.strategyName,
    context?.timeframe,
    context?.period,
    activeFilters,
    currentStage,
    reloadToken,
  ]);

  const retry = useCallback(() => setReloadToken((v) => v + 1), []);

  const handleApplyFilters = useCallback(
    ({ filters, filterPreset }) => {
      setActiveFilters(filters);
      setActiveFilterPreset(filterPreset || "");
      onFiltersChange?.({ filters, filterPreset: filterPreset || "" });
    },
    [onFiltersChange],
  );

  const comparisons = data?.comparisons ?? [];
  const hasCurrentStageData = comparisons.length > 0;

  return (
    <AppDialog
      open={!!open}
      onOpenChange={(next) => {
        if (!next) onClose?.();
      }}
      title="Comparison widget"
      className="max-w-[1100px] max-h-[90vh] overflow-hidden flex flex-col"
    >
      <div className="flex flex-wrap items-center justify-end gap-2 border-b border-[rgba(60,40,80,0.35)] pb-2 text-[11px]">
        <MetricsLegendInfo />
        <EpochFiltersControl
          filters={activeFilters}
          filterPreset={activeFilterPreset}
          onApply={handleApplyFilters}
        />
        <MetricsFilter selectedKeys={selectedMetricKeys} onChange={setSelectedMetricKeys} />
      </div>

      <div className="min-h-0 flex-1 overflow-auto pt-2.5">
        {status === "loading" || status === "idle" ? (
          <LoadingSkeleton blockCount={expectedBlockCount} />
        ) : status === "error" ? (
          <div
            className={cx(
              "flex flex-col items-center gap-2 rounded-md border px-3 py-6 text-[11px] text-[#a6a6a6]",
              crmSurface.border,
            )}
          >
            <span>Unable to load stage comparison</span>
            <AppButton type="button" variant="outline" size="sm" onClick={retry}>
              Retry
            </AppButton>
          </div>
        ) : !hasCurrentStageData ? (
          <EmptyState>No epochs are available for Stage {currentStage}</EmptyState>
        ) : selectedMetricKeys.length === 0 ? (
          <EmptyState>Select at least one metric to display comparisons</EmptyState>
        ) : (
          <div className="flex flex-col gap-3">
            {comparisons.map((comparison) => (
              <ComparisonBlock
                key={`${comparison.baselineStage}-${comparison.currentStage}`}
                comparison={comparison}
                currentEpochCount={data?.currentEpochCount ?? 0}
                selectedMetricKeys={selectedMetricKeys}
              />
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end pt-2">
        <AppButton type="button" variant="outline" size="sm" onClick={onClose}>
          Close
        </AppButton>
      </div>
    </AppDialog>
  );
});

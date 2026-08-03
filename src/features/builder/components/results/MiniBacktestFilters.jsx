import React, { memo, useMemo } from "react";
import { TagMultiSelect } from "@/components/common/TagMultiSelect";
import { AppSelect } from "@/components/common/AppSelect";
import { EMPTY_MINI_BACKTEST_FILTERS } from "../../utils/miniBacktestFilters";

function FilterField({ label, children, className }) {
  return (
    <label className={`flex flex-col gap-1 min-w-0 ${className ?? ""}`}>
      <span className="text-[10px] text-[#8c8c8c] whitespace-nowrap">{label}</span>
      {children}
    </label>
  );
}

export const MiniBacktestFilters = memo(function MiniBacktestFilters({
  filters,
  onFiltersChange,
  options,
}) {
  const setFilter = (key, value) => {
    onFiltersChange?.({ ...filters, [key]: value });
  };

  const tagOptions = useMemo(
    () => (options.tags ?? []).map((tag) => ({ value: tag.id, label: tag.name })),
    [options.tags],
  );

  const stageOptions = useMemo(
    () => [
      { value: "", label: "All stages" },
      ...(options.stages ?? []).map((stage) => ({ value: stage.value, label: stage.label })),
    ],
    [options.stages],
  );

  const versionOptions = useMemo(
    () => [
      { value: "", label: "All versions" },
      ...(options.versions ?? []).map((version) => ({ value: version.value, label: version.label })),
    ],
    [options.versions],
  );

  const statusOptions = useMemo(
    () => [
      { value: "", label: "All statuses" },
      ...(options.statuses ?? []).map((status) => ({ value: status, label: status })),
    ],
    [options.statuses],
  );

  const hasActiveFilters =
    filters.stage ||
    filters.version ||
    filters.status ||
    filters.tags.length > 0;

  return (
    <div className="flex flex-wrap items-end gap-x-3 gap-y-2">
      <FilterField label="Stage">
        <AppSelect
          value={filters.stage}
          onValueChange={(v) => setFilter("stage", v)}
          options={stageOptions}
          triggerClassName="h-8 min-w-[120px] text-[11px] px-2"
        />
      </FilterField>

      <FilterField label="Stage version">
        <AppSelect
          value={filters.version}
          onValueChange={(v) => setFilter("version", v)}
          options={versionOptions}
          triggerClassName="h-8 min-w-[120px] text-[11px] px-2"
        />
      </FilterField>

      <FilterField label="Status">
        <AppSelect
          value={filters.status}
          onValueChange={(v) => setFilter("status", v)}
          options={statusOptions}
          triggerClassName="h-8 min-w-[120px] text-[11px] px-2"
        />
      </FilterField>

      <FilterField label="Tags" className="min-w-[160px]">
        <TagMultiSelect
          options={tagOptions}
          value={filters.tags}
          onChange={(next) => setFilter("tags", next)}
          align="start"
          clearLabel="All tags"
          emptySummary="All tags"
          summaryPrefix="Tags"
          triggerClassName="h-8 min-w-[160px] w-full text-[11px] px-2"
          contentClassName="w-[220px]"
        />
      </FilterField>

      {hasActiveFilters ? (
        <button
          type="button"
          onClick={() => onFiltersChange?.({ ...EMPTY_MINI_BACKTEST_FILTERS })}
          className="h-8 px-2 text-[10px] text-violet-300 hover:text-violet-200 whitespace-nowrap"
        >
          Clear filters
        </button>
      ) : null}
    </div>
  );
});

/** @deprecated Use MiniBacktestFilters */
export const MiniBacktestSidebarFilters = MiniBacktestFilters;

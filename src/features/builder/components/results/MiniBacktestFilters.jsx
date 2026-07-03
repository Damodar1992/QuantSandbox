import React, { memo, useState } from "react";
import { cx, ui } from "../../../../constants/ui";
import { useOutsideClose } from "../../../../hooks/useOutsideClose";
import { EMPTY_MINI_BACKTEST_FILTERS } from "../../utils/miniBacktestFilters";

const selectClass = cx(ui.input, "h-8 min-w-[120px] text-[11px] px-2");

function FilterField({ label, children, className }) {
  return (
    <label className={cx("flex flex-col gap-1 min-w-0", className)}>
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
  const [tagsOpen, setTagsOpen] = useState(false);
  const tagsRef = useOutsideClose(tagsOpen, () => setTagsOpen(false));

  const setFilter = (key, value) => {
    onFiltersChange?.({ ...filters, [key]: value });
  };

  const tagsLabel =
    filters.tags.length === 0
      ? "All tags"
      : options.tags
          .filter((tag) => filters.tags.includes(tag.id))
          .map((tag) => tag.name)
          .join(", ");

  const hasActiveFilters =
    filters.stage ||
    filters.version ||
    filters.status ||
    filters.tags.length > 0;

  return (
    <div className="flex flex-wrap items-end gap-x-3 gap-y-2">
      <FilterField label="Stage">
        <select
          value={filters.stage}
          onChange={(e) => setFilter("stage", e.target.value)}
          className={selectClass}
        >
          <option value="">All stages</option>
          {options.stages.map((stage) => (
            <option key={stage.value} value={stage.value}>
              {stage.label}
            </option>
          ))}
        </select>
      </FilterField>

      <FilterField label="Stage version">
        <select
          value={filters.version}
          onChange={(e) => setFilter("version", e.target.value)}
          className={selectClass}
        >
          <option value="">All versions</option>
          {options.versions.map((version) => (
            <option key={version.value} value={version.value}>
              {version.label}
            </option>
          ))}
        </select>
      </FilterField>

      <FilterField label="Status">
        <select
          value={filters.status}
          onChange={(e) => setFilter("status", e.target.value)}
          className={selectClass}
        >
          <option value="">All statuses</option>
          {options.statuses.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </FilterField>

      <FilterField label="Tags" className="min-w-[160px]">
        <div className="relative" ref={tagsRef}>
          <button
            type="button"
            onClick={() => setTagsOpen((open) => !open)}
            className={cx(selectClass, "w-full min-w-[160px] inline-flex items-center justify-between gap-2")}
            aria-expanded={tagsOpen}
          >
            <span className="truncate text-left">{tagsLabel}</span>
            <span className="text-[#8c8c8c] shrink-0">{tagsOpen ? "▲" : "▼"}</span>
          </button>
          {tagsOpen ? (
            <div className="absolute left-0 z-30 mt-1 w-[220px] max-h-[200px] overflow-y-auto rounded-md border border-[#303030] bg-[#0f0f0f] shadow-lg p-1.5 space-y-1">
              <button
                type="button"
                onClick={() => setFilter("tags", [])}
                className="w-full h-7 px-2 rounded text-left text-[10px] text-[#d9d9d9] hover:bg-[#1a1a1a]"
              >
                All tags
              </button>
              {options.tags.map((tag) => {
                const checked = filters.tags.includes(tag.id);
                return (
                  <label
                    key={tag.id}
                    className="flex items-center gap-2 h-7 px-2 rounded text-[10px] text-[#d9d9d9] hover:bg-[#1a1a1a] cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() =>
                        setFilter(
                          "tags",
                          checked
                            ? filters.tags.filter((id) => id !== tag.id)
                            : [...filters.tags, tag.id],
                        )
                      }
                      className="h-3 w-3 accent-violet-500"
                    />
                    <span className="truncate">{tag.name}</span>
                  </label>
                );
              })}
            </div>
          ) : null}
        </div>
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

import React, { memo, useEffect, useMemo, useState } from "react";
import { cx, ui } from "../../../../constants/ui";
import { MiniBacktestResultCard } from "./MiniBacktestResultCard";
import { MiniBacktestRunDetail } from "./MiniBacktestRunDetail";
import { MiniBacktestFilters } from "./MiniBacktestFilters";
import {
  EMPTY_MINI_BACKTEST_FILTERS,
  filterMiniBacktestResults,
  getMiniBacktestFilterOptions,
} from "../../utils/miniBacktestFilters";

function resultKey(entry) {
  return `${entry.id}::${entry.paramsHash ?? entry.createdAt ?? ""}`;
}

export const MiniBacktestPage = memo(function MiniBacktestPage({
  results = [],
  selectedId,
  onSelectId,
  onDelete,
  onEditTags,
  tagsRegistry = [],
}) {
  const [filters, setFilters] = useState(EMPTY_MINI_BACKTEST_FILTERS);

  const sortedResults = useMemo(
    () => [...results].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)),
    [results],
  );

  const filterOptions = useMemo(() => getMiniBacktestFilterOptions(sortedResults), [sortedResults]);

  const filteredResults = useMemo(
    () => filterMiniBacktestResults(sortedResults, filters),
    [sortedResults, filters],
  );

  const selectedEntry = filteredResults.find((r) => r.id === selectedId) ?? null;

  useEffect(() => {
    if (filteredResults.length === 0) {
      if (selectedId != null) onSelectId?.(null);
      return;
    }
    if (!selectedId || !filteredResults.some((r) => r.id === selectedId)) {
      onSelectId?.(filteredResults[0].id);
    }
  }, [filteredResults, selectedId, onSelectId]);

  const handleSelect = (id) => {
    onSelectId?.(id);
  };

  if (sortedResults.length === 0) {
    return (
      <div className={cx(ui.radius, ui.panel, "overflow-hidden")}>
        <div className="px-4 py-3 border-b border-[#303030]">
          <div className="text-[14px] font-medium text-[#f5f5f5]">Mini Backtest Summary</div>
          <div className={cx("mt-0.5 text-[11px]", ui.textMuted)}>
            Overview of all Mini Backtest runs across epochs for this strategy
          </div>
        </div>
        <div className={cx(ui.radius, ui.panelMuted, "m-4 p-8 text-[11px] text-center", ui.textMuted)}>
          No Mini Backtest results yet. Enable Mini Backtest in Favorite Epochs and run from an epoch card.
        </div>
      </div>
    );
  }

  return (
    <div className={cx(ui.radius, ui.panel, "overflow-hidden min-h-[520px] flex flex-col")}>
      <div className="px-4 py-3 border-b border-[#303030] shrink-0">
        <div className="text-[14px] font-medium text-[#f5f5f5]">Mini Backtest Summary</div>
        <div className={cx("mt-0.5 text-[11px]", ui.textMuted)}>
          Overview of all Mini Backtest runs across epochs for this strategy
        </div>
      </div>

      <div className="px-4 py-2.5 border-b border-[#303030] shrink-0 bg-[#19102b]/30">
        <MiniBacktestFilters
          filters={filters}
          onFiltersChange={setFilters}
          options={filterOptions}
        />
      </div>

      <div className="flex flex-1 flex-col md:flex-row min-h-0">
        <aside
          className={cx(
            "shrink-0 border-b md:border-b-0 md:border-r md:w-[280px] flex flex-col min-h-0",
            ui.divider,
            "bg-[#19102b]/50",
          )}
        >
          <div className="flex-1 min-h-0 max-h-[320px] md:max-h-[calc(100vh-280px)] overflow-y-auto p-2 space-y-1">
            {filteredResults.length === 0 ? (
              <div className={cx("rounded-md border border-dashed px-3 py-6 text-center text-[10px]", ui.textMuted, ui.divider)}>
                No runs match the current filters.
              </div>
            ) : (
              filteredResults.map((entry) => (
                <MiniBacktestResultCard
                  key={resultKey(entry)}
                  entry={entry}
                  active={entry.id === selectedId}
                  onSelect={handleSelect}
                />
              ))
            )}
          </div>
        </aside>

        <div className="flex-1 min-w-0 p-4 md:p-5 overflow-y-auto">
          <MiniBacktestRunDetail
            entry={selectedEntry}
            onDelete={onDelete}
            onEditTags={onEditTags}
            tagsRegistry={tagsRegistry}
          />
        </div>
      </div>
    </div>
  );
});

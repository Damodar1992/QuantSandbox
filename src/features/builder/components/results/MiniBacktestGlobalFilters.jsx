import React, { memo, useMemo } from "react";

import { AppSelect } from "@/components/common/AppSelect";
import { AppButton } from "@/components/common/AppButton";
import { EMPTY_GLOBAL_MINI_BACKTEST_FILTERS } from "../../utils/miniBacktestFilters";

export const MiniBacktestGlobalFilters = memo(function MiniBacktestGlobalFilters({
  filters,
  onFiltersChange,
  options,
}) {
  const setFilter = (key, value) => {
    onFiltersChange?.({ ...filters, [key]: value });
  };

  const hasActiveFilters = Object.values(filters).some(Boolean);

  const strategyOptions = useMemo(
    () => [
      { value: "", label: "All strategies" },
      ...(options.strategies ?? []).map((item) => ({ value: item.value, label: item.label })),
    ],
    [options.strategies],
  );

  const stageOptions = useMemo(
    () => [
      { value: "", label: "All stages" },
      ...(options.stages ?? []).map((stage) => ({ value: stage.value, label: stage.label })),
    ],
    [options.stages],
  );

  const tradingModeOptions = useMemo(
    () => [
      { value: "", label: "All modes" },
      ...(options.tradingModes ?? []).map((item) => ({ value: item.value, label: item.label })),
    ],
    [options.tradingModes],
  );

  const exchangeOptions = useMemo(
    () => [
      { value: "", label: "All exchanges" },
      ...(options.exchanges ?? []).map((item) => ({ value: item.value, label: item.label })),
    ],
    [options.exchanges],
  );

  const pairsOptions = useMemo(
    () => [
      { value: "", label: "All pairs" },
      ...(options.pairs ?? []).map((item) => ({ value: item.value, label: item.label })),
    ],
    [options.pairs],
  );

  const statusOptions = useMemo(
    () => [
      { value: "", label: "All statuses" },
      ...(options.statuses ?? []).map((status) => ({ value: status, label: status })),
    ],
    [options.statuses],
  );

  return (
    <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
      <AppSelect
        value={filters.strategy}
        onValueChange={(v) => setFilter("strategy", v)}
        options={strategyOptions}
        className="w-[132px] shrink-0"
        triggerClassName="h-8"
        aria-label="Filter by strategy"
      />

      <AppSelect
        value={filters.stage}
        onValueChange={(v) => setFilter("stage", v)}
        options={stageOptions}
        className="w-[132px] shrink-0"
        triggerClassName="h-8"
        aria-label="Filter by stage"
      />

      <AppSelect
        value={filters.tradingMode}
        onValueChange={(v) => setFilter("tradingMode", v)}
        options={tradingModeOptions}
        className="w-[132px] shrink-0"
        triggerClassName="h-8"
        aria-label="Filter by trading mode"
      />

      <AppSelect
        value={filters.exchange}
        onValueChange={(v) => setFilter("exchange", v)}
        options={exchangeOptions}
        className="w-[132px] shrink-0"
        triggerClassName="h-8"
        aria-label="Filter by exchange"
      />

      <AppSelect
        value={filters.pairs}
        onValueChange={(v) => setFilter("pairs", v)}
        options={pairsOptions}
        className="w-[132px] shrink-0"
        triggerClassName="h-8"
        aria-label="Filter by pairs"
      />

      <AppSelect
        value={filters.status}
        onValueChange={(v) => setFilter("status", v)}
        options={statusOptions}
        className="w-[132px] shrink-0"
        triggerClassName="h-8"
        aria-label="Filter by status"
      />

      {hasActiveFilters ? (
        <AppButton
          type="button"
          variant="outline"
          onClick={() => onFiltersChange?.({ ...EMPTY_GLOBAL_MINI_BACKTEST_FILTERS })}
          className="h-8 px-2 text-[12px] whitespace-nowrap"
        >
          Clear filters
        </AppButton>
      ) : null}
    </div>
  );
});

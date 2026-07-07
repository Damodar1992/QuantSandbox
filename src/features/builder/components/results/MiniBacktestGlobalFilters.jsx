import React, { memo } from "react";

import { cx, ui } from "../../../../constants/ui";

import { EMPTY_GLOBAL_MINI_BACKTEST_FILTERS } from "../../utils/miniBacktestFilters";



const selectClass = cx(ui.select, "h-8 w-[132px] shrink-0");



export const MiniBacktestGlobalFilters = memo(function MiniBacktestGlobalFilters({

  filters,

  onFiltersChange,

  options,

}) {

  const setFilter = (key, value) => {

    onFiltersChange?.({ ...filters, [key]: value });

  };



  const hasActiveFilters = Object.values(filters).some(Boolean);



  return (

    <div className="ml-auto flex flex-wrap items-center justify-end gap-2">

      <select

        value={filters.strategy}

        onChange={(e) => setFilter("strategy", e.target.value)}

        className={selectClass}

        aria-label="Filter by strategy"

      >

        <option value="">All strategies</option>

        {options.strategies.map((item) => (

          <option key={item.value} value={item.value}>

            {item.label}

          </option>

        ))}

      </select>



      <select

        value={filters.stage}

        onChange={(e) => setFilter("stage", e.target.value)}

        className={selectClass}

        aria-label="Filter by stage"

      >

        <option value="">All stages</option>

        {options.stages.map((stage) => (

          <option key={stage.value} value={stage.value}>

            {stage.label}

          </option>

        ))}

      </select>



      <select

        value={filters.tradingMode}

        onChange={(e) => setFilter("tradingMode", e.target.value)}

        className={selectClass}

        aria-label="Filter by trading mode"

      >

        <option value="">All modes</option>

        {options.tradingModes.map((item) => (

          <option key={item.value} value={item.value}>

            {item.label}

          </option>

        ))}

      </select>



      <select

        value={filters.exchange}

        onChange={(e) => setFilter("exchange", e.target.value)}

        className={selectClass}

        aria-label="Filter by exchange"

      >

        <option value="">All exchanges</option>

        {options.exchanges.map((item) => (

          <option key={item.value} value={item.value}>

            {item.label}

          </option>

        ))}

      </select>



      <select

        value={filters.pairs}

        onChange={(e) => setFilter("pairs", e.target.value)}

        className={selectClass}

        aria-label="Filter by pairs"

      >

        <option value="">All pairs</option>

        {options.pairs.map((item) => (

          <option key={item.value} value={item.value}>

            {item.label}

          </option>

        ))}

      </select>



      <select

        value={filters.status}

        onChange={(e) => setFilter("status", e.target.value)}

        className={selectClass}

        aria-label="Filter by status"

      >

        <option value="">All statuses</option>

        {options.statuses.map((status) => (

          <option key={status} value={status}>

            {status}

          </option>

        ))}

      </select>



      {hasActiveFilters ? (

        <button

          type="button"

          onClick={() => onFiltersChange?.({ ...EMPTY_GLOBAL_MINI_BACKTEST_FILTERS })}

          className={cx(ui.btn, "h-8 px-2 text-[12px] whitespace-nowrap")}

        >

          Clear filters

        </button>

      ) : null}

    </div>

  );

});



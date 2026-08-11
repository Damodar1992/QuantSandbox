import React, { memo, useMemo, useState } from "react";
import { cx, ui } from "../../../../constants/ui";
import { crmSurface } from "../../../../constants/crmAccent";
import { EyeIcon } from "../../../../components/common";
import { TrashIcon } from "../../../../components/shared";
import { RunStatusBadge } from "./RunStatusBadge";
import { MiniBacktestRunDetail } from "./MiniBacktestRunDetail";
import { MiniBacktestGlobalFilters } from "./MiniBacktestGlobalFilters";
import { buildMiniBacktestTableRow } from "../../utils/miniBacktestTable";
import {
  EMPTY_GLOBAL_MINI_BACKTEST_FILTERS,
  filterGlobalMiniBacktestResults,
  getGlobalMiniBacktestFilterOptions,
} from "../../utils/miniBacktestFilters";
const TABLE_HEADERS = [
  "",
  "Date",
  "Strategy",
  "Stage + version",
  "Epoch",
  "Trading mode",
  "Exchange",
  "Pairs",
  "Time frame",
  "Time range",
  "Sizing",
  "Leverage",
  "Reserve",
  "Fee",
  "ROI %",
  "Total balance",
  "Max DD",
  "Win Rate",
  "Executed",
  "Total cycles",
  "Status",
  "Owner",
  "Actions",
];

export const MiniBacktestGlobalPage = memo(function MiniBacktestGlobalPage({
  results = [],
  detailId = null,
  onDetailIdChange,
  onDelete,
  onOpenStrategy,
  onEditTags,
  tagsRegistry = [],
}) {
  const [filters, setFilters] = useState(EMPTY_GLOBAL_MINI_BACKTEST_FILTERS);

  const filterOptions = useMemo(() => getGlobalMiniBacktestFilterOptions(results), [results]);

  const filteredResults = useMemo(
    () => filterGlobalMiniBacktestResults(results, filters),
    [results, filters],
  );

  const rows = useMemo(
    () =>
      [...filteredResults]
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
        .map(buildMiniBacktestTableRow),
    [filteredResults],
  );

  const detailEntry = detailId ? results.find((r) => r.id === detailId) ?? null : null;

  if (detailEntry) {
    return (
      <div className={cx(ui.radius, ui.panel, "overflow-hidden min-h-[520px] flex flex-col")}>
        <div className={cx("px-4 py-3 border-b shrink-0 flex items-center justify-between gap-3", ui.divider)}>
          <div className="min-w-0">
            <button
              type="button"
              onClick={() => onDetailIdChange?.(null)}
              className="text-[11px] text-violet-300 hover:text-violet-200 transition-colors"
            >
              ← Back to all runs
            </button>
            <div className="text-[14px] font-medium text-[#f5f5f5] mt-1 truncate">
              {detailEntry.strategyId != null ? (
                <button
                  type="button"
                  onClick={() => onOpenStrategy?.(detailEntry.strategyId, detailEntry.id)}
                  className="text-violet-300 hover:text-violet-200 underline decoration-dotted underline-offset-2 transition-colors"
                >
                  {detailEntry.strategyName || "Strategy"}
                </button>
              ) : (
                detailEntry.strategyName || "Strategy"
              )}
              {" · "}
              {detailEntry.stage || "Stage"}
              {detailEntry.epochNumber != null ? ` (Epoch #${detailEntry.epochNumber})` : ""}
            </div>
          </div>
          <RunStatusBadge status={detailEntry.runStatus || "Finished"} />
        </div>
        <div className="flex-1 min-w-0 p-4 md:p-5 overflow-y-auto">
          <MiniBacktestRunDetail
            entry={detailEntry}
            onDelete={onDelete}
            onEditTags={onEditTags}
            tagsRegistry={tagsRegistry}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={cx(ui.radius, ui.panel, "overflow-hidden")}>
      <div className={cx("flex min-w-0 items-center gap-3 px-4 py-3", ui.panelMuted, "border-0 border-b", ui.divider)}>
        <div className={cx("shrink-0 text-[12px]", ui.textSubtle)}>
          {rows.length}
          {rows.length !== results.length ? ` / ${results.length}` : ""} runs
        </div>
        <MiniBacktestGlobalFilters
          filters={filters}
          onFiltersChange={setFilters}
          options={filterOptions}
        />
      </div>

      {results.length === 0 ? (
        <div className="px-4 py-12 text-center text-[12px] text-[#8c8c8c]">
          No mini backtest runs yet. Run a mini backtest from a strategy&apos;s Favorite Epochs.
        </div>
      ) : rows.length === 0 ? (
        <div className="px-4 py-12 text-center text-[12px] text-[#8c8c8c]">
          No runs match the current filters.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[12px] min-w-[1900px]">
            <thead className="bg-[#1f1f1f] text-left text-[12px] text-[#8c8c8c]">
              <tr>
                {TABLE_HEADERS.map((header, index) => (
                  <th
                    key={header || "view"}
                    className={cx(
                      "border-b border-[#303030] font-medium whitespace-nowrap",
                      index === 0 ? "px-4 py-3 w-8" : "px-2 py-3",
                    )}
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className={cx(crmSurface.panel, "hover:bg-secondary transition-colors")}>
                  <td className={cx("px-4 py-2 border-b align-middle", crmSurface.border)}>
                    <button
                      type="button"
                      onClick={() => onDetailIdChange?.(row.id)}
                      title="View details"
                      aria-label="View details"
                      className={cx(
                        "inline-flex h-8 w-8 items-center justify-center rounded-md border text-muted-foreground hover:bg-secondary",
                        crmSurface.border,
                        crmSurface.input,
                      )}
                    >
                      <EyeIcon />
                    </button>
                  </td>
                  <td className={cx("px-2 py-2 border-b whitespace-nowrap text-[12px] text-muted-foreground", crmSurface.border)}>
                    {row.date}
                  </td>
                  <td className={cx("px-2 py-2 border-b whitespace-nowrap text-[12px]", crmSurface.border, crmSurface.text)}>
                    {row.strategyId != null ? (
                      <button
                        type="button"
                        onClick={() => onOpenStrategy?.(row.strategyId, row.id)}
                        className="text-violet-300 hover:text-violet-200 underline decoration-dotted underline-offset-2"
                      >
                        {row.strategyName}
                      </button>
                    ) : (
                      row.strategyName
                    )}
                  </td>
                  <td className={cx("px-2 py-2 border-b whitespace-nowrap text-[12px] text-muted-foreground", crmSurface.border)}>
                    {row.stageVersion}
                  </td>
                  <td className={cx("px-2 py-2 border-b whitespace-nowrap text-[12px] text-muted-foreground font-mono", crmSurface.border)}>
                    {row.epoch}
                  </td>
                  <td className={cx("px-2 py-2 border-b whitespace-nowrap text-[12px] text-muted-foreground", crmSurface.border)}>
                    {row.tradingMode}
                  </td>
                  <td className={cx("px-2 py-2 border-b whitespace-nowrap text-[12px] text-muted-foreground", crmSurface.border)}>
                    {row.exchange}
                  </td>
                  <td className={cx("px-2 py-2 border-b whitespace-nowrap text-[12px] text-muted-foreground", crmSurface.border)}>
                    {row.pairs}
                  </td>
                  <td className={cx("px-2 py-2 border-b whitespace-nowrap text-[12px] text-muted-foreground font-mono", crmSurface.border)}>
                    {row.timeframe}
                  </td>
                  <td className={cx("px-2 py-2 border-b whitespace-nowrap text-[12px] text-muted-foreground", crmSurface.border)}>
                    {row.timeRange}
                  </td>
                  <td className={cx("px-2 py-2 border-b whitespace-nowrap text-[12px] text-muted-foreground", crmSurface.border)}>
                    {row.sizing}
                  </td>
                  <td className={cx("px-2 py-2 border-b whitespace-nowrap text-[12px] text-muted-foreground font-mono", crmSurface.border)}>
                    {row.leverage}
                  </td>
                  <td className={cx("px-2 py-2 border-b whitespace-nowrap text-[12px] text-muted-foreground font-mono", crmSurface.border)}>
                    {row.reserve}
                  </td>
                  <td className={cx("px-2 py-2 border-b whitespace-nowrap text-[12px] text-muted-foreground", crmSurface.border)}>
                    {row.fee}
                  </td>
                  <td className={cx("px-2 py-2 border-b whitespace-nowrap text-[12px] text-muted-foreground font-mono", crmSurface.border)}>
                    {row.roi}
                  </td>
                  <td className={cx("px-2 py-2 border-b whitespace-nowrap text-[12px] text-muted-foreground font-mono", crmSurface.border)}>
                    {row.totalBalance}
                  </td>
                  <td className={cx("px-2 py-2 border-b whitespace-nowrap text-[12px] text-muted-foreground font-mono", crmSurface.border)}>
                    {row.maxDd}
                  </td>
                  <td className={cx("px-2 py-2 border-b whitespace-nowrap text-[12px] text-muted-foreground font-mono", crmSurface.border)}>
                    {row.winRate}
                  </td>
                  <td className={cx("px-2 py-2 border-b whitespace-nowrap text-[12px] text-muted-foreground font-mono text-center", crmSurface.border)}>
                    {row.executed}
                  </td>
                  <td className={cx("px-2 py-2 border-b whitespace-nowrap text-[12px] text-muted-foreground font-mono text-center", crmSurface.border)}>
                    {row.totalCycles}
                  </td>
                  <td className={cx("px-2 py-2 border-b whitespace-nowrap", crmSurface.border)}>
                    <RunStatusBadge status={row.status} />
                  </td>
                  <td className={cx("px-2 py-2 border-b whitespace-nowrap text-[12px] text-muted-foreground", crmSurface.border)}>
                    {row.owner}
                  </td>
                  <td className={cx("px-2 py-2 border-b", crmSurface.border)}>
                    <button
                      type="button"
                      onClick={() => onDelete?.(row.id)}
                      title="Delete"
                      aria-label="Delete"
                      className={cx(
                        "inline-flex h-8 w-8 items-center justify-center rounded-md border text-red-400/90 hover:text-red-300 hover:bg-red-500/10",
                        crmSurface.border,
                      )}
                    >
                      <TrashIcon />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
});

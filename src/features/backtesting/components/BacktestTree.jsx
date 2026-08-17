import React, { memo, useCallback, useState } from "react";
import { Copy, Check, MoreHorizontal, Info, Eye } from "lucide-react";
import { cx, ui } from "@/constants/ui";
import { AppButton } from "@/components/common/AppButton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BT_COPY, BT_RUN_STATUS } from "@/constants/backtesting";
import { BT_MUTED, fmtDateTime, fmtPeriod } from "../utils/format";
import { BtStatusCell } from "./BtStatusCell";
import { BranchPanel } from "./BranchPanel";

/** Expand + ID + Epoch + Pairs + Timeframe + TimeRange + Status + Created + Actions */
const LEVEL0_COLS = 9;

const TH =
  "px-3 py-2 text-left font-medium border-b border-[rgba(60,40,80,0.35)] whitespace-nowrap";
const TD = "px-3 py-2 align-middle";

function CopyIdButton({ id }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(
    async (e) => {
      e.stopPropagation();
      if (!id) return;
      try {
        await navigator.clipboard.writeText(String(id));
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1500);
      } catch {
        /* ignore */
      }
    },
    [id],
  );

  return (
    <AppButton
      type="button"
      variant="outline"
      size="icon-xs"
      onClick={handleCopy}
      title={copied ? "Copied" : `Copy ID ${id}`}
      aria-label={copied ? "Copied" : "Copy run ID"}
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 shrink-0 text-green-400" />
      ) : (
        <Copy className="h-3.5 w-3.5 shrink-0" />
      )}
    </AppButton>
  );
}

export const BacktestTree = memo(function BacktestTree({
  runs,
  expandedRuns,
  onToggleRun,
  onOpenInfo,
  onOpenRunParams,
  onRunShuffler,
  onRunSynthetic,
  onDeleteBacktest,
  onOpenChildResult,
  onDeleteChild,
  onOpenShuffleInfo,
  onOpenShufflerParams,
  onOpenSyntheticInfo,
  onOpenSyntheticParams,
}) {
  if (!runs || runs.length === 0) {
    return (
      <div className={cx(ui.radius, ui.panelMuted, "px-4 py-8 text-center text-[12px]", ui.textSubtle)}>
        {BT_COPY.emptyTree}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-[rgba(60,40,80,0.35)] bg-[#120b20]">
      <table className="w-full border-collapse text-[11px]">
        <thead className="bg-[#19102b] text-[#8c8c8c]">
          <tr>
            <th className={cx(TH, "w-8")} aria-label="Expand" />
            <th className={cx(TH, "w-12")}>ID</th>
            <th className={TH}>Epoch</th>
            <th className={TH}>Pairs</th>
            <th className={TH}>Timeframe</th>
            <th className={TH}>Time Range</th>
            <th className={TH}>Status</th>
            <th className={TH}>Created</th>
            <th className={TH}>Action</th>
          </tr>
        </thead>
        <tbody className="text-[#d9d9d9]">
          {runs.map((run) => {
            const isFailed = run.status === BT_RUN_STATUS.FAILED;
            const isDone = run.status === BT_RUN_STATUS.DONE;
            const isOpen = !isFailed && expandedRuns.has(run.id);
            const p = run.params || {};

            return (
              <React.Fragment key={run.id}>
                <tr className="border-b border-[rgba(60,40,80,0.22)] bg-[#140f23] transition-colors hover:bg-[#1a1430]">
                  <td className="px-2 py-2 align-middle">
                    <button
                      type="button"
                      disabled={isFailed}
                      onClick={() => {
                        if (!isFailed) onToggleRun(run.id);
                      }}
                      className={cx(
                        "rounded p-0.5",
                        isFailed
                          ? "cursor-not-allowed text-[#4a4458]"
                          : "text-[#8c8c8c] hover:text-[#d9d9d9]",
                      )}
                      title={isFailed ? "Failed runs have no branch to expand" : undefined}
                      aria-label={isFailed ? "Expand unavailable" : isOpen ? "Collapse" : "Expand"}
                    >
                      {isOpen ? "▼" : "▶"}
                    </button>
                  </td>

                  <td className={TD}>
                    <div className="inline-flex items-center gap-1">
                      <CopyIdButton id={run.id} />
                      <AppButton
                        type="button"
                        variant="outline"
                        size="icon-xs"
                        disabled={isFailed}
                        title={isFailed ? "Unavailable for failed runs" : "Backtesting info"}
                        aria-label={isFailed ? "Unavailable for failed runs" : "Backtesting info"}
                        onClick={() => onOpenInfo?.(run)}
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </AppButton>
                    </div>
                  </td>

                  <td className={cx(TD, "whitespace-nowrap text-[#faf7fd]")}>
                    {run.epochLabel || <span className={BT_MUTED}>—</span>}
                  </td>

                  <td className={cx(TD, "whitespace-nowrap font-mono text-[#faf7fd]")}>
                    {p.pair || <span className={BT_MUTED}>—</span>}
                  </td>

                  <td className={cx(TD, "whitespace-nowrap font-mono text-[#b8aecc]")}>
                    {p.timeframe || <span className={BT_MUTED}>—</span>}
                  </td>

                  <td className={cx(TD, "whitespace-nowrap font-mono tabular-nums text-[#b8aecc]")}>
                    {fmtPeriod(p.periodFrom, p.periodTo)}
                  </td>

                  <td className={TD}>
                    <BtStatusCell
                      status={run.status}
                      pct={run.progress?.pct}
                      error={run.error}
                    />
                  </td>

                  <td className={cx(TD, "whitespace-nowrap tabular-nums text-[#b8aecc]")}>
                    {fmtDateTime(run.createdAt)}
                  </td>

                  <td className={TD}>
                    <div className="inline-flex items-center gap-1">
                      <AppButton
                        type="button"
                        variant="outline"
                        size="icon-xs"
                        title="Run parameters and conditions"
                        aria-label="Run parameters and conditions"
                        onClick={() => onOpenRunParams?.(run)}
                      >
                        <Info className="h-3.5 w-3.5" />
                      </AppButton>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <AppButton
                            type="button"
                            variant="outline"
                            size="icon-xs"
                            title="Actions"
                            aria-label="Actions"
                          >
                            <MoreHorizontal className="h-3.5 w-3.5" />
                          </AppButton>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="min-w-[220px]">
                          <DropdownMenuItem
                            disabled={!isDone}
                            title={isDone ? undefined : BT_COPY.childrenLocked}
                            onSelect={() => onRunShuffler?.(run)}
                          >
                            Run Shuffler
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            disabled={!isDone}
                            title={isDone ? undefined : BT_COPY.childrenLocked}
                            onSelect={() => onRunSynthetic?.(run)}
                          >
                            Run Synthetic
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            variant="destructive"
                            onSelect={() => onDeleteBacktest?.(run)}
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </td>
                </tr>

                {isOpen ? (
                  <tr>
                    <td colSpan={LEVEL0_COLS} className="p-0 align-top bg-[#100a1a]">
                      <BranchPanel
                        run={run}
                        onDeleteChild={onDeleteChild}
                        onRunShuffler={onRunShuffler}
                        onRunSynthetic={onRunSynthetic}
                        onOpenShuffleInfo={onOpenShuffleInfo}
                        onOpenShufflerParams={onOpenShufflerParams}
                        onOpenSyntheticInfo={onOpenSyntheticInfo}
                        onOpenSyntheticParams={onOpenSyntheticParams}
                      />
                    </td>
                  </tr>
                ) : null}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
});

export { LEVEL0_COLS };

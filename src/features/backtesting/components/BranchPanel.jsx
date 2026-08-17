import React, { memo, useCallback, useMemo, useState } from "react";
import { Check, ChevronDown, Copy, Eye, Info, Trash2 } from "lucide-react";
import { cx, ui } from "@/constants/ui";
import { AppButton } from "@/components/common/AppButton";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  BT_CHILD_TYPE,
  BT_COPY,
  BT_RUN_STATUS,
} from "@/constants/backtesting";
import {
  BT_MUTED,
  fmtDateTime,
  fmtInt,
  fmtPct,
} from "../utils/format";
import { computePessimismGrid } from "../utils/pessimism";
import { BtFailureBlock, BtStatusCell } from "./BtStatusCell";
import { CoreMetricsCompareTable } from "./CoreMetricsCompareTable";
import { SyntheticCoreResultsPanel } from "./SyntheticCoreResultsPanel";

const CARD =
  "mx-4 mt-3 mb-3 overflow-hidden rounded-xl border border-[rgba(60,40,80,0.35)] bg-[#110b1d] " +
  "shadow-[0_10px_24px_rgba(6,3,20,0.24)]";
const STRIP =
  "flex w-full items-center justify-between gap-2 border-b border-[rgba(60,40,80,0.3)] px-3 py-2 text-left text-[11px] font-medium hover:bg-white/[0.03] transition-colors";
const TH = "px-3 py-1.5 text-left font-medium border-b border-[rgba(60,40,80,0.3)] whitespace-nowrap";
const TD = "px-3 py-2 align-middle";
const ROW = "border-b border-[rgba(60,40,80,0.22)] hover:bg-[#1a1430]";

const TONES = {
  core: {
    strip: "bg-violet-500/10 text-violet-200",
    pill: "border-violet-500/25 bg-violet-500/10 text-violet-100",
  },
  [BT_CHILD_TYPE.SHUFFLER]: {
    strip: "bg-sky-500/10 text-sky-200",
    pill: "border-sky-500/25 bg-sky-500/10 text-sky-100",
  },
  [BT_CHILD_TYPE.SYNTHETIC]: {
    strip: "bg-teal-500/10 text-teal-200",
    pill: "border-teal-500/25 bg-teal-500/10 text-teal-100",
  },
  [BT_CHILD_TYPE.ANALYTICS]: {
    strip: "bg-amber-500/10 text-amber-200",
    pill: "border-amber-500/25 bg-amber-500/10 text-amber-100",
  },
};

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

function CollapsibleLevel({ toneKey, title, count, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);
  const tone = TONES[toneKey] || TONES.core;
  return (
    <Collapsible open={open} onOpenChange={setOpen} className={CARD}>
      <CollapsibleTrigger type="button" className={cx(STRIP, tone.strip)}>
        <span className="inline-flex items-center gap-2">
          <ChevronDown
            className={cx(
              "h-3.5 w-3.5 shrink-0 opacity-70 transition-transform duration-200",
              open && "rotate-180",
            )}
            aria-hidden
          />
          {title}
        </span>
        {count != null ? (
          <span className={cx("rounded-md border px-1.5 py-0.5 text-[9px]", tone.pill)}>{count}</span>
        ) : null}
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="overflow-x-auto">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function EmptyLevel({ children }) {
  return <div className={cx("px-3 py-4 text-center text-[11px]", ui.textSubtle)}>{children}</div>;
}

/** Expanded branch of a Level 0 backtest: actions bar + collapsible levels. */
export const BranchPanel = memo(function BranchPanel({
  run,
  onDeleteChild,
  onRunShuffler,
  onRunSynthetic,
  onOpenShuffleInfo,
  onOpenShufflerParams,
  onOpenSyntheticInfo,
  onOpenSyntheticParams,
}) {
  const isDone = run.status === BT_RUN_STATUS.DONE;

  const shufflerRuns = useMemo(
    () => (run.shufflerRuns || []).slice().sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))),
    [run.shufflerRuns],
  );
  const syntheticRuns = useMemo(
    () => (run.syntheticRuns || []).slice().sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))),
    [run.syntheticRuns],
  );

  return (
    <div className="pb-1">
      {run.error ? (
        <div className="mx-4 mt-3">
          <BtFailureBlock error={run.error} />
        </div>
      ) : null}

      <CollapsibleLevel
        toneKey="core"
        title="Core metrics"
        count={run.result?.core ? "6 metrics" : "—"}
      >
        <CoreMetricsCompareTable core={run.result?.core} miniCore={run.miniCore} />
      </CollapsibleLevel>

      <CollapsibleLevel
        toneKey={BT_CHILD_TYPE.SHUFFLER}
        title="Shuffler runs"
        count={`${shufflerRuns.length} runs`}
      >
        {shufflerRuns.length === 0 ? (
          <EmptyLevel>
            {isDone ? (
              <div className="flex flex-col items-center gap-3">
                <span>No Shuffler runs yet.</span>
                <AppButton
                  type="button"
                  variant="default"
                  size="sm"
                  onClick={() => onRunShuffler?.(run)}
                >
                  ▶ Run Shuffler
                </AppButton>
              </div>
            ) : (
              BT_COPY.childrenLocked
            )}
          </EmptyLevel>
        ) : (
          <ShufflerTable
            runs={shufflerRuns}
            parent={run}
            onOpenShuffleInfo={onOpenShuffleInfo}
            onOpenShufflerParams={onOpenShufflerParams}
            onDeleteChild={onDeleteChild}
          />
        )}
      </CollapsibleLevel>

      <CollapsibleLevel
        toneKey={BT_CHILD_TYPE.SYNTHETIC}
        title="Synthetic backtest runs"
        count={`${syntheticRuns.length} runs`}
      >
        {syntheticRuns.length === 0 ? (
          <EmptyLevel>
            {isDone ? (
              <div className="flex flex-col items-center gap-3">
                <span>No Synthetic runs yet.</span>
                <AppButton
                  type="button"
                  variant="default"
                  size="sm"
                  onClick={() => onRunSynthetic?.(run)}
                >
                  ▶ Run Synthetic Backtest
                </AppButton>
              </div>
            ) : (
              BT_COPY.childrenLocked
            )}
          </EmptyLevel>
        ) : (
          <SyntheticTable
            runs={syntheticRuns}
            parent={run}
            onOpenSyntheticInfo={onOpenSyntheticInfo}
            onOpenSyntheticParams={onOpenSyntheticParams}
            onDeleteChild={onDeleteChild}
          />
        )}
      </CollapsibleLevel>
    </div>
  );
});

function LevelsTags({ config }) {
  if (!config?.stressTestEnabled) {
    return (
      <span className="rounded border border-[rgba(60,40,80,0.45)] bg-[#0f0a1b] px-1.5 py-0.5 text-[9px] font-medium text-[#8c8c8c]">
        off
      </span>
    );
  }
  const grid = computePessimismGrid(
    config.pessimismLevels,
    config.shufflesN,
    config.original || {},
  );
  const parts = grid.rows.filter((r) => r.enabled);
  if (!parts.length) {
    return (
      <span className="rounded border border-[rgba(60,40,80,0.45)] bg-[#0f0a1b] px-1.5 py-0.5 text-[9px] font-medium text-[#8c8c8c]">
        off
      </span>
    );
  }
  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      {parts.map((r) => (
        <span
          key={r.level}
          className="rounded border border-sky-500/40 bg-sky-500/10 px-1.5 py-0.5 font-mono text-[9px] font-medium tabular-nums text-sky-100"
        >
          {r.level} {r.runsN}
        </span>
      ))}
    </span>
  );
}

function ShufflerTable({
  runs,
  parent,
  onOpenShuffleInfo,
  onOpenShufflerParams,
  onDeleteChild,
}) {
  const [expanded, setExpanded] = useState(() => new Set());

  const toggleExpanded = (id) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <table className="w-full border-collapse text-[11px]">
      <thead className="bg-[#19102b] text-[#8c8c8c]">
        <tr>
          <th className={cx(TH, "w-8")} aria-label="Expand" />
          <th className={cx(TH, "w-12")}>ID</th>
          <th className={TH}>Mode</th>
          <th className={TH}>Shuffle</th>
          <th className={TH}>Levels</th>
          <th className={TH}>Max DD mean</th>
          <th className={TH}>Status</th>
          <th className={TH}>Created</th>
          <th className={TH}>Actions</th>
        </tr>
      </thead>
      <tbody className="text-[#d9d9d9]">
        {runs.map((child) => {
          const childDone = child.status === BT_RUN_STATUS.DONE;
          const dynamic = child.config?.simulationMode === "dynamic";
          const isOpen = expanded.has(child.id);
          return (
            <React.Fragment key={child.id}>
              <tr className={ROW}>
                <td className={TD}>
                  <button
                    type="button"
                    disabled={!childDone}
                    onClick={() => toggleExpanded(child.id)}
                    className={cx(
                      "rounded p-0.5 text-[#8c8c8c] hover:text-[#d9d9d9]",
                      !childDone && "cursor-not-allowed opacity-40",
                    )}
                    title={childDone ? (isOpen ? "Collapse" : "Expand") : "Run in progress"}
                    aria-label={childDone ? (isOpen ? "Collapse" : "Expand") : "Expand unavailable"}
                    aria-expanded={isOpen}
                  >
                    <ChevronDown
                      className={cx("h-3.5 w-3.5 transition-transform", isOpen && "rotate-180")}
                    />
                  </button>
                </td>
                <td className={TD}>
                  <div className="inline-flex items-center gap-1">
                    <CopyIdButton id={child.id} />
                    <AppButton
                      type="button"
                      variant="outline"
                      size="icon-xs"
                      disabled={!childDone}
                      title={childDone ? "Shuffle info" : "Run in progress"}
                      aria-label={childDone ? "Shuffle info" : "Run in progress"}
                      onClick={() => onOpenShuffleInfo?.(child, parent)}
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </AppButton>
                  </div>
                </td>
                <td className={TD}>
                  <span
                    className={cx(
                      "rounded border px-1.5 py-0.5 text-[9px] font-medium",
                      dynamic
                        ? "border-violet-500/45 bg-[rgba(168,96,240,0.16)] text-[#ddd6fe]"
                        : "border-[rgba(60,40,80,0.45)] bg-[#0f0a1b] text-[#b8aecc]",
                    )}
                  >
                    {dynamic ? "DYNAMIC" : "STATIC"}
                  </span>
                </td>
                <td className={cx(TD, "whitespace-nowrap font-mono tabular-nums")}>
                  {child.config?.approach === "block_by_streak"
                    ? "block"
                    : child.config?.approach === "levels"
                      ? "levels"
                      : "full"}{" "}
                  ({fmtInt(child.config?.shufflesN)})
                </td>
                <td className={TD}>
                  <LevelsTags config={child.config} />
                </td>
                <td className={cx(TD, "font-mono tabular-nums text-amber-300")}>
                  {fmtPct(child.result?.maxddMean)}
                </td>
                <td className={TD}>
                  <BtStatusCell
                    status={child.status}
                    pct={
                      child.progress?.totalN
                        ? ((child.progress?.doneN ?? 0) / child.progress.totalN) * 100
                        : 0
                    }
                    progressLabel={`Shuffling ${fmtInt(child.progress?.doneN)} / ${fmtInt(
                      child.progress?.totalN,
                    )}`}
                    error={child.error}
                  />
                </td>
                <td className={cx(TD, "whitespace-nowrap tabular-nums text-[#b8aecc]")}>
                  {fmtDateTime(child.createdAt)}
                </td>
                <td className={TD}>
                  <div className="inline-flex items-center gap-1">
                    <AppButton
                      type="button"
                      variant="outline"
                      size="icon-xs"
                      disabled={!childDone}
                      title="Run Shuffler parameters"
                      aria-label="Run Shuffler parameters"
                      onClick={() => onOpenShufflerParams?.(child, parent)}
                    >
                      <Info className="h-3.5 w-3.5" />
                    </AppButton>
                    <AppButton
                      type="button"
                      variant="outline"
                      size="icon-xs"
                      title="Delete Shuffler run"
                      aria-label="Delete Shuffler run"
                      className="border-red-500/60 text-red-400 hover:bg-red-500/10"
                      onClick={() => onDeleteChild?.(BT_CHILD_TYPE.SHUFFLER, child, parent)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </AppButton>
                  </div>
                </td>
              </tr>
              {isOpen && childDone ? (
                <tr className="border-b border-[rgba(60,40,80,0.22)] bg-[#0d0818]">
                  <td colSpan={9} className="px-3 py-2 align-top">
                    <SyntheticCoreResultsPanel run={child} />
                  </td>
                </tr>
              ) : null}
            </React.Fragment>
          );
        })}
      </tbody>
    </table>
  );
}

function SyntheticTable({
  runs,
  parent,
  onOpenSyntheticInfo,
  onOpenSyntheticParams,
  onDeleteChild,
}) {
  const cell = "px-3 py-2 align-middle";
  const [expanded, setExpanded] = useState(() => new Set());

  const toggleExpanded = (id) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <table className="w-full border-collapse text-[11px]">
      <thead className="bg-[#19102b] text-[#8c8c8c]">
        <tr>
          <th className={cx(TH, "w-8")} aria-label="Expand" />
          <th className={cx(TH, "w-12")}>ID</th>
          <th className={TH}>Runs</th>
          <th className={TH}>Status</th>
          <th className={TH}>Created</th>
          <th className={TH}>Actions</th>
        </tr>
      </thead>
      <tbody className="text-[#d9d9d9]">
        {runs.map((child) => {
          const childDone = child.status === BT_RUN_STATUS.DONE;
          const isOpen = expanded.has(child.id);
          const progressLabel =
            (child.progress?.generationPct ?? 0) < 100
              ? `Series generation ${Math.round(child.progress?.generationPct ?? 0)}%`
              : `Synthetic backtests ${fmtInt(child.progress?.backtestsDoneN)} / ${fmtInt(
                  child.progress?.totalN,
                )}`;
          return (
            <React.Fragment key={child.id}>
              <tr className={ROW}>
                <td className={cell}>
                  <button
                    type="button"
                    disabled={!childDone}
                    onClick={() => toggleExpanded(child.id)}
                    className={cx(
                      "rounded p-0.5 text-[#8c8c8c] hover:text-[#d9d9d9]",
                      !childDone && "cursor-not-allowed opacity-40",
                    )}
                    title={childDone ? (isOpen ? "Collapse" : "Expand") : "Run in progress"}
                    aria-label={childDone ? (isOpen ? "Collapse" : "Expand") : "Expand unavailable"}
                    aria-expanded={isOpen}
                  >
                    <ChevronDown
                      className={cx("h-3.5 w-3.5 transition-transform", isOpen && "rotate-180")}
                    />
                  </button>
                </td>
                <td className={cell}>
                  <div className="inline-flex items-center gap-1">
                    <CopyIdButton id={child.id} />
                    <AppButton
                      type="button"
                      variant="outline"
                      size="icon-xs"
                      disabled={!childDone}
                      title={childDone ? "Synthetic backtest info" : "Run in progress"}
                      aria-label={childDone ? "Synthetic backtest info" : "Run in progress"}
                      onClick={() => onOpenSyntheticInfo?.(child, parent)}
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </AppButton>
                  </div>
                </td>
                <td className={cx(cell, "font-mono tabular-nums")}>{fmtInt(child.config?.nRuns)}</td>
                <td className={cell}>
                  <BtStatusCell
                    status={child.status}
                    pct={
                      (child.progress?.generationPct ?? 0) < 100
                        ? child.progress?.generationPct ?? 0
                        : child.progress?.totalN
                          ? ((child.progress?.backtestsDoneN ?? 0) / child.progress.totalN) * 100
                          : 0
                    }
                    progressLabel={progressLabel}
                    error={child.error}
                  />
                </td>
                <td className={cx(cell, "whitespace-nowrap tabular-nums text-[#b8aecc]")}>
                  {fmtDateTime(child.createdAt)}
                </td>
                <td className={cell}>
                  <div className="inline-flex items-center gap-1">
                    <AppButton
                      type="button"
                      variant="outline"
                      size="icon-xs"
                      disabled={!childDone}
                      title="Run Synthetic backtest parameters"
                      aria-label="Run Synthetic backtest parameters"
                      onClick={() => onOpenSyntheticParams?.(child, parent)}
                    >
                      <Info className="h-3.5 w-3.5" />
                    </AppButton>
                    <AppButton
                      type="button"
                      variant="outline"
                      size="icon-xs"
                      title="Delete Synthetic run"
                      aria-label="Delete Synthetic run"
                      className="border-red-500/60 text-red-400 hover:bg-red-500/10"
                      onClick={() => onDeleteChild?.(BT_CHILD_TYPE.SYNTHETIC, child, parent)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </AppButton>
                  </div>
                </td>
              </tr>
              {isOpen && childDone ? (
                <tr className="border-b border-[rgba(60,40,80,0.22)] bg-[#0d0818]">
                  <td colSpan={6} className="px-3 py-2 align-top">
                    <SyntheticCoreResultsPanel run={child} />
                  </td>
                </tr>
              ) : null}
            </React.Fragment>
          );
        })}
      </tbody>
    </table>
  );
}

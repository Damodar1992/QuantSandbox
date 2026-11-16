import React, { memo, useMemo, useRef } from "react";
import { ChevronDown } from "lucide-react";
import { cx, ui } from "@/constants/ui";
import { AppButton } from "@/components/common/AppButton";
import { AppDialog } from "@/components/common/AppDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  COMPARE_METRICS,
  compareCells,
  groupStressBatches,
  readParentStake,
  runStakeOnParent,
  stakeShareOf,
} from "../utils/stakeStress";
import { stakeText } from "./forms/RunStakeStressModal";

const GROUPS = [
  { title: "Money", keys: ["roi", "pnl", "pnlPerStake"] },
  { title: "Drawdowns", keys: ["maxDdPct", "ddInStakes", "minTradable"] },
  { title: "Trades", keys: ["executed", "winRate", "profitFactor", "retained"] },
];

const SKIP_LABEL = {
  opened: "Opened",
  no_money: "Skip · no money",
  below_min: "Skip · below pair minimum",
  zero_amount: "Skip · amount 0",
  no_slot: "Skip · no slot",
};

const TRADE_COLUMNS = ["#", "Pair", "Side", "Open", "Status", "Stake", "Min", "Amount", "Stake real", "Gross", "Fee in", "Fee out", "Funding", "Net", "Reserve", "Tradable", "Total", "Note"];

function fmtMain(metric, value) {
  if (value == null || Number.isNaN(Number(value))) return "—";
  if (metric.format === "pct") return `${Number(value).toFixed(1)} %`;
  if (metric.format === "money") {
    return Number(value).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  if (metric.format === "count") return String(Math.round(Number(value)));
  return Number(value).toFixed(2);
}

function fmtDelta(metric, delta) {
  if (delta == null) return null;
  const sign = delta > 0 ? "+" : "";
  if (metric.format === "pct") return `${sign}${delta.toFixed(1)} pp`;
  if (metric.format === "money") {
    return `${sign}${delta.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return `${sign}${Number(delta).toFixed(2)}`;
}

function toneClass(tone) {
  if (tone === "bad") return "bg-red-500/25";
  if (tone === "warn") return "bg-amber-400/20";
  return "";
}

function statusTone(tone) {
  if (tone === "bad") return "text-red-400";
  if (tone === "warn") return "text-amber-300";
  return "text-green-400";
}

function columnStake(mode, value) {
  if (mode === "percent") return `percent ${Number(value)}%`;
  return `fixed ${Number(value).toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
}

function headerStatus(summary) {
  if (!summary) return { tone: "ok", text: "—" };
  if (!summary.tradedToEnd) {
    return { tone: "bad", text: `${summary.executed} / ${summary.totalTrades} · stopped at #${summary.stopAt}` };
  }
  const below = summary.skips?.below_min || 0;
  if (below > 0) {
    return { tone: "warn", text: `${summary.executed} / ${summary.totalTrades} · ${below} below pair min` };
  }
  return { tone: "ok", text: `${summary.executed} / ${summary.totalTrades} executed` };
}

function runNote(summary) {
  if (!summary) return "";
  if (!summary.tradedToEnd) {
    return `The balance fell below the stake and the run stopped at trade #${summary.stopAt}. ${summary.afterStop} later trade(s) were not opened.`;
  }
  const below = (summary.skips?.below_min || 0) + (summary.skips?.zero_amount || 0);
  if (below > 0) {
    return `${below} of ${summary.totalTrades} trades were skipped because the stake was below the pair minimum. ${summary.executed} trades executed.`;
  }
  return `All ${summary.totalTrades} trades executed.`;
}

function downloadCsv(filename, content) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function csvValue(value) {
  const text = value == null ? "" : String(value);
  if (/[",\n]/.test(text)) return `"${text.replaceAll('"', '""')}"`;
  return text;
}

function tradeCells(row) {
  return [
    row.index + 1,
    row.pair,
    row.isShort ? "Short" : "Long",
    row.openRate,
    SKIP_LABEL[row.status] || row.status,
    row.targetStake ?? "",
    row.minStake ?? "",
    row.amountNew || "",
    row.stakeReal || "",
    row.gross ?? "",
    row.feeIn ?? "",
    row.feeOut ?? "",
    row.funding ?? "",
    row.net ?? "",
    row.reserve ?? "",
    row.tradableAfter ?? "",
    row.totalAfter ?? "",
    row.byCoefficient ? "By coefficient" : "",
  ];
}

function cellMap(summary, baselineSummary) {
  return Object.fromEntries(compareCells(summary, baselineSummary).map((cell) => [cell.key, cell]));
}

export const StakeStressResultsModal = memo(function StakeStressResultsModal({
  open,
  parent,
  batchId,
  onClose,
}) {
  const held = useRef(parent);
  if (parent) held.current = parent;
  const view = parent || held.current;
  const info = useMemo(() => (view ? readParentStake(view) : null), [view]);
  const baseline = useMemo(() => {
    if (!view || !info) return null;
    return runStakeOnParent(view, { mode: info.mode, value: info.value });
  }, [view, info]);
  const runs = useMemo(() => {
    const groups = groupStressBatches(view?.stressRuns || []);
    if (!batchId) return groups.flatMap((group) => group.runs);
    return groups.find((group) => group.id === batchId)?.runs || [];
  }, [view, batchId]);
  const columns = useMemo(() => {
    if (!baseline || !info) return [];
    const base = {
      id: "backtest",
      kind: "backtest",
      title: `Backtest · ${columnStake(info.mode, info.value)}`,
      summary: baseline.summary,
      trades: baseline.trades,
      cells: cellMap(baseline.summary, null),
    };
    const rest = runs.filter((run) => run.result?.summary).map((run, index) => ({
      id: run.id,
      kind: "run",
      index,
      title: `Run ${index + 1} · ${columnStake(run.config?.mode, run.config?.value)}`,
      summary: run.result.summary,
      trades: run.result.trades || [],
      cells: cellMap(run.result.summary, baseline.summary),
    }));
    return [base, ...rest];
  }, [baseline, info, runs]);

  const metricByKey = useMemo(
    () => Object.fromEntries(COMPARE_METRICS.map((metric) => [metric.key, metric])),
    [],
  );

  const exportTrades = (column) => {
    const lines = [
      TRADE_COLUMNS.map(csvValue).join(","),
      ...(column.trades || []).map((row) => tradeCells(row).map(csvValue).join(",")),
    ];
    downloadCsv(`stake-stress-${column.id}.csv`, lines.join("\n"));
  };

  return (
    <AppDialog
      open={open}
      onOpenChange={(next) => { if (!next) onClose?.(); }}
      title={`Stake Stress-Test · ${runs.length} ${runs.length === 1 ? "run" : "runs"} vs backtest`}
      description={info ? `Backtest stake ${stakeText(info.mode, info.value)} · balance ${Number(info.capital).toLocaleString("en-US")} USDT` : ""}
      className="max-w-[1200px] sm:max-w-[1200px]"
      headerAction={(
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <AppButton type="button" variant="outline" size="sm" disabled={!columns.length}>
              Export CSV
              <ChevronDown className="h-3.5 w-3.5" />
            </AppButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {columns.map((column) => (
              <DropdownMenuItem key={column.id} onSelect={() => exportTrades(column)}>
                {column.kind === "backtest" ? "Backtest" : `Run ${column.index + 1}`}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    >
      <div className="overflow-x-auto rounded-lg border border-[rgba(60,40,80,0.35)]">
        <table className="w-full border-collapse text-[11px]">
          <thead className="bg-[#19102b] text-[#d9d9d9]">
            <tr>
              <th className="sticky left-0 z-10 bg-[#19102b] px-2 py-2 text-left font-medium text-[#8c8c8c]">Metric</th>
              {columns.map((column) => {
                const status = headerStatus(column.summary);
                return (
                  <th key={column.id} className="min-w-[150px] px-2 py-2 text-left font-medium">
                    <div className="whitespace-nowrap">{column.title}</div>
                    <div className={cx("mt-0.5 text-[10px] font-normal", statusTone(status.tone))}>{status.text}</div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {GROUPS.map((group) => (
              <React.Fragment key={group.title}>
                <tr className="border-t border-[rgba(60,40,80,0.22)] bg-[#140c22]">
                  <td colSpan={columns.length + 1} className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#8c8c8c]">
                    {group.title}
                  </td>
                </tr>
                {group.keys.map((key) => {
                  const metric = metricByKey[key];
                  return (
                    <tr key={key} className="border-t border-[rgba(60,40,80,0.22)]">
                      <td className="sticky left-0 bg-[#120b20] px-2 py-1.5 text-[#b8aecc]">{metric?.label || key}</td>
                      {columns.map((column) => {
                        const shown = shownValue(column, metric, baseline?.summary);
                        const cell = column.cells[key];
                        return (
                          <td key={column.id} className={cx("px-2 py-1.5 align-top", column.kind === "run" ? toneClass(cell?.tone) : "")}>
                            <div className="tabular-nums">{shown.main}</div>
                            {shown.sub ? <div className="text-[10px] text-[#8c8c8c] tabular-nums">{shown.sub}</div> : null}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </React.Fragment>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-[rgba(60,40,80,0.35)]">
              <td className="sticky left-0 bg-[#120b20]" />
              {columns.map((column) => (
                <td key={column.id} className="px-2 py-2 align-top">
                  {column.kind === "run" ? (
                    <p className={cx("text-[10px] leading-snug", ui.textSubtle)}>{runNote(column.summary)}</p>
                  ) : null}
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="flex flex-wrap gap-2 text-[10px]">
        <span className="rounded bg-amber-400/20 px-2 py-1">Yellow · the metric left the stake share</span>
        <span className="rounded bg-red-500/25 px-2 py-1">Red · the run stopped and that cell left the stake share</span>
      </div>

    </AppDialog>
  );
});

function shownValue(column, metric, baselineSummary) {
  const cell = column.cells?.[metric?.key];
  if (!cell) return { main: "—", sub: null };
  const stopped = column.kind === "run" && column.summary?.tradedToEnd === false;
  if (metric.key === "retained" && stopped) return { main: "n/a", sub: "stopped" };
  let main = fmtMain(metric, cell.value);
  if (column.kind !== "run") return { main, sub: null };
  if (metric.key === "retained") {
    const share = stakeShareOf(column.summary, baselineSummary);
    if (share != null) main = `${main} (linear ${(share * 100).toFixed(1)} %)`;
  }
  return { main, sub: fmtDelta(metric, cell.delta) };
}

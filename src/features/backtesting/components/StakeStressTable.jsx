import { memo, useCallback, useState } from "react";
import { Check, Copy, Eye, Info, Trash2 } from "lucide-react";
import { cx } from "@/constants/ui";
import { AppButton } from "@/components/common/AppButton";
import { BT_CHILD_TYPE, BT_RUN_STATUS } from "@/constants/backtesting";
import { fmtDateTime } from "../utils/format";
import { groupStressBatches } from "../utils/stakeStress";
import { BtStatusCell } from "./BtStatusCell";

const TH = "px-3 py-1.5 text-left font-medium border-b border-[rgba(60,40,80,0.3)] whitespace-nowrap";
const TD = "px-3 py-2 align-middle";
const ROW = "border-b border-[rgba(60,40,80,0.22)] hover:bg-[#1a1430]";

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

function filledText(batch) {
  const summaries = batch.runs.map((run) => run.result?.summary).filter(Boolean);
  if (batch.runs.length === 1) {
    const summary = summaries[0];
    if (!summary) return "—";
    return `${summary.executed} / ${summary.totalTrades}${summary.tradedToEnd ? "" : ` · stop #${summary.stopAt}`}`;
  }
  const stopped = summaries.filter((summary) => !summary.tradedToEnd).length;
  const below = summaries.reduce((sum, summary) => sum + (summary.skips?.below_min || 0), 0);
  if (stopped) return `${stopped} stopped`;
  if (below) return `${below} below pair min`;
  return "All executed";
}

export const StakeStressTable = memo(function StakeStressTable({
  runs,
  parent,
  onOpenStressInfo,
  onOpenStressParams,
  onDeleteChild,
}) {
  const batches = groupStressBatches(runs);
  return (
    <table className="w-full border-collapse text-[11px]">
      <thead className="bg-[#19102b] text-[#8c8c8c]">
        <tr>
          <th className={cx(TH, "w-12")}>ID</th>
          <th className={TH}>Stress test runs</th>
          <th className={TH}>Filled</th>
          <th className={TH}>Status</th>
          <th className={TH}>Created</th>
          <th className={TH}>Actions</th>
        </tr>
      </thead>
      <tbody className="text-[#d9d9d9]">
        {batches.map((batch) => {
          const head = batch.runs[0];
          const childDone = batch.runs.every((run) => run.status === BT_RUN_STATUS.DONE);
          const several = batch.runs.length > 1;
          return (
            <tr key={batch.id} className={ROW}>
              <td className={TD}>
                <div className="inline-flex items-center gap-1">
                  <CopyIdButton id={batch.id} />
                  <AppButton
                    type="button"
                    variant="outline"
                    size="icon-xs"
                    disabled={!childDone}
                    title={childDone ? "Stake stress-test results" : "Run in progress"}
                    aria-label={childDone ? "Stake stress-test results" : "Run in progress"}
                    onClick={() => onOpenStressInfo?.(head, parent)}
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </AppButton>
                </div>
              </td>
              <td className={cx(TD, "tabular-nums")}>{batch.runs.length}</td>
              <td className={cx(TD, "tabular-nums whitespace-nowrap")}>{filledText(batch)}</td>
              <td className={TD}>
                <BtStatusCell status={head?.status} pct={childDone ? 100 : 0} error={head?.error} />
              </td>
              <td className={cx(TD, "whitespace-nowrap tabular-nums text-[#b8aecc]")}>{fmtDateTime(batch.runs[0]?.createdAt)}</td>
              <td className={TD}>
                <div className="inline-flex items-center gap-1">
                  <AppButton
                    type="button"
                    variant="outline"
                    size="icon-xs"
                    disabled={!childDone}
                    title="Stake stress-test parameters"
                    aria-label="Stake stress-test parameters"
                    onClick={() => onOpenStressParams?.(head, parent)}
                  >
                    <Info className="h-3.5 w-3.5" />
                  </AppButton>
                  <AppButton
                    type="button"
                    variant="outline"
                    size="icon-xs"
                    title={several ? "Delete stake stress-test batch" : "Delete stake stress-test"}
                    aria-label={several ? "Delete stake stress-test batch" : "Delete stake stress-test"}
                    className="border-red-500/60 text-red-400 hover:bg-red-500/10"
                    onClick={() => onDeleteChild?.(BT_CHILD_TYPE.STRESS, {
                      id: batch.id,
                      batchId: batch.id,
                      runCount: batch.runs.length,
                    }, parent)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </AppButton>
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
});

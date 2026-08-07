import React, { memo, useMemo } from "react";
import { Check } from "lucide-react";
import { cx, ui } from "@/constants/ui";
import { AppDialog } from "@/components/common/AppDialog";
import { buildRunParamsComparison } from "../utils/runParamsComparison";

const TH =
  "px-3 py-2 text-left text-[10px] font-medium uppercase tracking-wide border-b border-[rgba(60,40,80,0.35)] text-[#8c8c8c]";
const TD = "px-3 py-2 align-top text-[11px]";
const ROW = "border-b border-[rgba(60,40,80,0.22)] last:border-b-0";

function DeltaCell({ delta }) {
  if (delta === "match") {
    return (
      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-green-500/15 text-green-400">
        <Check className="h-3 w-3" aria-label="match" />
      </span>
    );
  }
  if (delta === "critical" || delta === "premise") {
    return (
      <span
        className="inline-flex h-2.5 w-2.5 rounded-full bg-red-400"
        title="Critical difference — the comparison is invalid"
        aria-label="critical difference"
      />
    );
  }
  if (delta === "conditional") {
    return (
      <span
        className="inline-flex h-2.5 w-2.5 rounded-full bg-violet-400"
        title="Conditional — affects some metrics only"
        aria-label="conditional difference"
      />
    );
  }
  return <span className="text-[#6e6682]">—</span>;
}

function RunParametersBody({ run, strategyName }) {
  const comparison = useMemo(
    () => buildRunParamsComparison(run, { strategyName }),
    [run, strategyName],
  );

  const title = comparison.hasMini
    ? `Comparison with the mini · ${comparison.miniName || "mini"}`
    : "Run parameters · standalone (no mini)";

  return (
    <div className="space-y-4">
      <div>
        <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#d9d9d9]">
          {title}
        </div>
        <div className="overflow-x-auto rounded-lg border border-[rgba(60,40,80,0.35)]">
          <table className="w-full border-collapse">
            <thead className="bg-[#19102b]">
              <tr>
                <th className={TH}>Field</th>
                <th className={TH}>Backtest</th>
                <th className={TH}>Mini</th>
                <th className={cx(TH, "w-14 text-center")}>Δ?</th>
              </tr>
            </thead>
            <tbody className="text-[#d9d9d9]">
              {comparison.rows.map((row) => (
                <tr key={row.key} className={ROW}>
                  <td className={TD}>
                    <div className="font-medium text-[#faf7fd]">{row.label}</div>
                    {row.note ? (
                      <div className={cx("mt-0.5 max-w-[280px] text-[10px] leading-snug", ui.textSubtle)}>
                        {row.note}
                      </div>
                    ) : null}
                  </td>
                  <td className={cx(TD, "font-mono tabular-nums")}>{row.backtest}</td>
                  <td className={cx(TD, "font-mono tabular-nums text-[#b8aecc]")}>{row.mini}</td>
                  <td className={cx(TD, "text-center")}>
                    <DeltaCell delta={row.delta} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {comparison.hasMini ? (
          <div className="mt-2 flex flex-wrap items-center gap-4 text-[10px] text-[#8c8c8c]">
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-flex h-2.5 w-2.5 rounded-full bg-red-400" />
              critical difference — the comparison is invalid
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-flex h-2.5 w-2.5 rounded-full bg-violet-400" />
              conditional · affects some metrics only · part of Δ can be explained by config differences
            </span>
          </div>
        ) : (
          <div className={cx("mt-2 text-[10px]", ui.textSubtle)}>
            No mini linked — Mini and Δ columns are empty.
          </div>
        )}
      </div>

      <div className={cx(ui.radius, ui.panelMuted, "p-3 space-y-2")}>
        <div className="text-[10px] font-semibold uppercase tracking-wide text-[#8c8c8c]">
          Not part of the comparison
        </div>
        <div className="grid gap-2 sm:grid-cols-3 text-[11px]">
          <div>
            <div className="text-[10px] text-[#6e6682]">Mini-backtest</div>
            <div className="font-mono text-[#faf7fd]">{comparison.meta.miniName}</div>
          </div>
          <div>
            <div className="text-[10px] text-[#6e6682]">Run ID</div>
            <div className="font-mono text-[#faf7fd]">{comparison.meta.runId}</div>
          </div>
          <div>
            <div className="text-[10px] text-[#6e6682]">Created</div>
            <div className="font-mono text-[#faf7fd]">{comparison.meta.createdAt}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Info-style modal: Run parameters and conditions (BT vs Mini comparison). */
export const BacktestingRunParamsModal = memo(function BacktestingRunParamsModal({
  open,
  run,
  strategyName,
  onClose,
}) {
  return (
    <AppDialog
      open={!!open && Boolean(run)}
      onOpenChange={(next) => {
        if (!next) onClose?.();
      }}
      title="Run parameters and conditions"
      description={run?.epochLabel || run?.id || "Backtest run"}
      className="max-w-[960px] max-h-[90vh] overflow-hidden flex flex-col"
    >
      <div className="min-h-0 max-h-[min(70vh,720px)] overflow-y-auto pr-1">
        {run ? <RunParametersBody run={run} strategyName={strategyName} /> : null}
      </div>
    </AppDialog>
  );
});

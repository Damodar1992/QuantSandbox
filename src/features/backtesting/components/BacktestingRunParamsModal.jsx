import React, { memo, useMemo } from "react";
import { Check } from "lucide-react";
import { cx, ui } from "@/constants/ui";
import { AppDialog } from "@/components/common/AppDialog";
import { buildRunParamsComparison } from "../utils/runParamsComparison";
import { BtValueTooltip } from "./BtInfoTooltip";

const TH =
  "px-3 py-2.5 text-left text-[10px] font-medium uppercase tracking-wide border-b border-[rgba(60,40,80,0.35)] text-[#8c8c8c]";
const TD = "px-3 py-2.5 align-top text-[12px]";
const ROW = "border-b border-[rgba(60,40,80,0.18)] last:border-b-0";
const CARD = cx(ui.radius, "border border-[rgba(60,40,80,0.35)] bg-[#120b20] p-3 space-y-2.5");

function DeltaCell({ delta }) {
  if (delta === "match") {
    return (
      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-green-500/15 text-green-400">
        <Check className="h-3.5 w-3.5" strokeWidth={3} aria-label="match" />
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
        className="inline-flex h-2.5 w-2.5 rounded-full bg-violet-300"
        title="Conditional — affects some metrics only"
        aria-label="conditional difference"
      />
    );
  }
  return <span className="text-[#6e6682]">—</span>;
}

function MetaRow({ label, value, dotted = false }) {
  return (
    <div className="flex items-baseline gap-2 text-[12px]">
      <span className="shrink-0 text-[#8c8c8c]">{label}</span>
      {dotted ? (
        <span
          className="min-w-[1.5rem] flex-1 border-b border-dotted border-[rgba(120,100,150,0.35)] translate-y-[-0.2em]"
          aria-hidden
        />
      ) : (
        <span className="flex-1" />
      )}
      <span className="shrink-0 font-mono tabular-nums text-[#faf7fd]">{value}</span>
    </div>
  );
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
        <div className="overflow-x-auto rounded-lg border border-[rgba(60,40,80,0.35)] bg-[#100a1a]">
          <table className="w-full border-collapse">
            <thead className="bg-[#19102b]">
              <tr>
                <th className={cx(TH, "min-w-[200px]")}>Field</th>
                <th className={cx(TH, "min-w-[160px]")}>Backtest</th>
                <th className={cx(TH, "min-w-[160px]")}>Mini</th>
                <th className={cx(TH, "w-14 text-center")}>Δ?</th>
              </tr>
            </thead>
            <tbody>
              {comparison.rows.map((row) => (
                <tr key={row.key} className={ROW}>
                  <td className={TD}>
                    {row.note ? (
                      <BtValueTooltip text={row.note}>
                        <span className="font-medium text-[#c8c0d4] underline decoration-dotted underline-offset-2 decoration-[#6e6682]">
                          {row.label}
                        </span>
                      </BtValueTooltip>
                    ) : (
                      <div className="font-medium text-[#c8c0d4]">{row.label}</div>
                    )}
                  </td>
                  <td className={cx(TD, "font-mono tabular-nums text-[#faf7fd]")}>{row.backtest}</td>
                  <td className={cx(TD, "font-mono tabular-nums text-[#faf7fd]")}>{row.mini}</td>
                  <td className={cx(TD, "text-center")}>
                    <div className="flex justify-center pt-0.5">
                      <DeltaCell delta={row.delta} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {comparison.hasMini ? (
          <div className="mt-2.5 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[10px] text-[#8c8c8c]">
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-flex h-2.5 w-2.5 rounded-full bg-red-400" />
              critical difference — the comparison is invalid
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-flex h-2.5 w-2.5 rounded-full bg-violet-300" />
              conditional — affects some metrics only · part of Δ can be explained by config
              differences
            </span>
          </div>
        ) : (
          <div className={cx("mt-2 text-[10px]", ui.textSubtle)}>
            No mini linked — Mini and Δ columns are empty.
          </div>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className={CARD}>
          <div className="text-[10px] font-semibold uppercase tracking-wide text-[#9b8ec4]">
            Not part of the comparison
          </div>
          <div className="space-y-2">
            {(comparison.notCompared || []).map((row) => (
              <MetaRow key={row.key} label={row.label} value={row.value} />
            ))}
          </div>
        </div>

        <div className={CARD}>
          <div className="text-[10px] font-semibold uppercase tracking-wide text-[#9b8ec4]">
            Run metadata
          </div>
          <div className="space-y-2">
            {(comparison.runMeta || []).map((row) => (
              <MetaRow key={row.key} label={row.label} value={row.value} dotted />
            ))}
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

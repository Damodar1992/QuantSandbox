import React, { memo, useMemo } from "react";
import { cx, ui } from "@/constants/ui";
import { AppButton } from "@/components/common/AppButton";
import { AppDialog } from "@/components/common/AppDialog";
import { BT_CHILD_TYPE, BT_CORE_METRICS, BT_COPY, BT_TOOLTIPS } from "@/constants/backtesting";
import {
  BT_MUTED,
  coreMetricTone,
  deltaVsMini,
  fmtCoreMetric,
  fmtDateTime,
  fmtInt,
  fmtPct,
  percentileTone,
  signedTone,
} from "../utils/format";
import { simulationModeNote } from "../utils/shufflerValidity";
import { BtValueTooltip, BtHeaderWithHelp } from "./BtInfoTooltip";

const TH = "px-3 py-2 text-left font-medium border-b border-[rgba(60,40,80,0.35)] whitespace-nowrap";
const TD = "px-3 py-2 whitespace-nowrap font-mono tabular-nums";
const ROW = "border-b border-[rgba(60,40,80,0.22)]";

function Shell({ children }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-[rgba(60,40,80,0.35)]">
      <table className="w-full border-collapse text-[11px]">{children}</table>
    </div>
  );
}

function BacktestBody({ run }) {
  const hasMini = Boolean(run.miniCore);
  return (
    <div className="space-y-3">
      <div className={cx(ui.radius, ui.panelMuted, "px-3 py-2 text-[11px]")}>
        {run.params?.periodFrom} → {run.params?.periodTo} ·{" "}
        {run.miniName ? `from ${run.miniName}` : "standalone"} · {fmtDateTime(run.createdAt)} ·{" "}
        {run.createdBy}
      </div>
      <Shell>
        <thead className="bg-[#19102b] text-[#8c8c8c]">
          <tr>
            <th className={TH}>Metric</th>
            <th className={TH}>Backtest</th>
            {hasMini ? <th className={TH}>Mini-backtest</th> : null}
            {hasMini ? (
              <th className={TH}>
                <BtHeaderWithHelp label="Δ" text={BT_TOOLTIPS.delta}>
                  Δ (BT vs mini)
                </BtHeaderWithHelp>
              </th>
            ) : null}
          </tr>
        </thead>
        <tbody className="text-[#d9d9d9]">
          {BT_CORE_METRICS.map((metric) => {
            const value = run.result?.core?.[metric.key];
            const miniValue = hasMini ? run.miniCore[metric.key] : null;
            const delta = hasMini ? deltaVsMini(value, miniValue) : null;
            return (
              <tr key={metric.key} className={ROW}>
                <td className="px-3 py-2">
                  <BtValueTooltip text={metric.description} formula={metric.formula}>
                    <span>{metric.label}</span>
                  </BtValueTooltip>
                </td>
                <td className={cx(TD, coreMetricTone(metric.key, value))}>
                  {fmtCoreMetric(metric.key, value)}
                </td>
                {hasMini ? (
                  <td className={cx(TD, "text-[#b8aecc]")}>{fmtCoreMetric(metric.key, miniValue)}</td>
                ) : null}
                {hasMini ? (
                  <td className={cx(TD, delta === null ? BT_MUTED : signedTone(delta))}>
                    {delta === null ? "N/A" : fmtPct(delta, 2, true)}
                  </td>
                ) : null}
              </tr>
            );
          })}
        </tbody>
      </Shell>
      <div className={cx("text-[10px]", ui.textSubtle)}>
        {hasMini ? BT_COPY.noThresholds : BT_COPY.standalone}
      </div>
    </div>
  );
}

function ShufflerBody({ run }) {
  return (
    <div className="space-y-3">
      <div className={cx(ui.radius, ui.panelMuted, "px-3 py-2 text-[11px]")}>
        Showing run <span className="font-mono">{run.id}</span> · {fmtInt(run.config?.shufflesN)}{" "}
        shuffles · {run.config?.simulationMode === "dynamic" ? "DYNAMIC" : "STATIC"} ·{" "}
        {fmtDateTime(run.createdAt)}
      </div>
      <div
        className={cx(
          "rounded-lg border px-3 py-2 text-[11px]",
          run.config?.simulationMode === "dynamic"
            ? "border-green-500/40 bg-green-500/5 text-green-200"
            : "border-amber-500/40 bg-amber-500/5 text-amber-100/90",
        )}
      >
        {simulationModeNote(run.config?.simulationMode)}
      </div>
      <Shell>
        <thead className="bg-[#19102b] text-[#8c8c8c]">
          <tr>
            <th className={TH}>Metric</th>
            <th className={TH}>Original</th>
            <th className={TH}>Mean</th>
            <th className={TH}>Median</th>
            <th className={TH}>
              <BtHeaderWithHelp label="Percentile" text={BT_TOOLTIPS.percentile}>
                Percentile
              </BtHeaderWithHelp>
            </th>
            <th className={TH}>Validity</th>
          </tr>
        </thead>
        <tbody className="text-[#d9d9d9]">
          {(run.result?.core || []).map((row) => (
            <tr key={row.metric} className={ROW}>
              <td className="px-3 py-2">
                {BT_CORE_METRICS.find((m) => m.key === row.metric)?.label ?? row.metric}
              </td>
              <td className={cx(TD, coreMetricTone(row.metric, row.original))}>
                {fmtCoreMetric(row.metric, row.original)}
              </td>
              <td className={cx(TD, coreMetricTone(row.metric, row.mean))}>
                {fmtCoreMetric(row.metric, row.mean)}
              </td>
              <td className={cx(TD, coreMetricTone(row.metric, row.median))}>
                {fmtCoreMetric(row.metric, row.median)}
              </td>
              <td className={cx(TD, row.valid ? percentileTone(row.percentile) : BT_MUTED)}>
                {row.valid ? fmtPct(row.percentile, 1) : "N/A"}
              </td>
              <td className="px-3 py-2">
                {row.valid ? (
                  <span className="rounded border border-green-500/40 bg-green-500/10 px-1.5 py-0.5 text-[9px] text-green-300">
                    Valid
                  </span>
                ) : (
                  <BtValueTooltip text={row.reason || BT_TOOLTIPS.naOrderInvariant}>
                    <span className="rounded border border-[rgba(60,40,80,0.45)] bg-[#0f0a1b] px-1.5 py-0.5 text-[9px] text-[#8c8c8c]">
                      N/A · Shuffler
                    </span>
                  </BtValueTooltip>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </Shell>
      <div className="grid gap-2 sm:grid-cols-3">
        {(run.result?.sections || []).map((section) => (
          <div key={section.key} className={cx(ui.radius, ui.panelMuted, "px-3 py-2 text-[11px]")}>
            <div className="font-medium text-[#faf7fd]">{section.label}</div>
            <div className={cx("text-[10px]", ui.textSubtle)}>
              {fmtInt(section.n)} simulations · {fmtInt(section.stoppedN)} stopped ·{" "}
              {fmtInt(section.warningsN)} warnings
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SyntheticBody({ run }) {
  return (
    <div className="space-y-3">
      <div className={cx(ui.radius, ui.panelMuted, "px-3 py-2 text-[11px]")}>
        Showing run <span className="font-mono">{run.id}</span> ·{" "}
        {run.config?.source === "custom" ? "custom period" : "inherited period"} ·{" "}
        {run.config?.method} · N={fmtInt(run.config?.nRuns)} · {fmtDateTime(run.createdAt)}
      </div>
      <Shell>
        <thead className="bg-[#19102b] text-[#8c8c8c]">
          <tr>
            <th className={TH}>Metric</th>
            <th className={TH}>Real historical</th>
            <th className={TH}>
              <BtHeaderWithHelp label="Percentile" text={BT_TOOLTIPS.percentile}>
                Percentile
              </BtHeaderWithHelp>
            </th>
            <th className={TH}>Min</th>
            <th className={TH}>Median</th>
            <th className={TH}>Mean</th>
            <th className={TH}>Max</th>
          </tr>
        </thead>
        <tbody className="text-[#d9d9d9]">
          {(run.result?.core || []).map((row) => (
            <tr key={row.metric} className={ROW}>
              <td className="px-3 py-2">
                {BT_CORE_METRICS.find((m) => m.key === row.metric)?.label ?? row.metric}
              </td>
              <td className={cx(TD, coreMetricTone(row.metric, row.real))}>
                {fmtCoreMetric(row.metric, row.real)}
              </td>
              <td className={cx(TD, percentileTone(row.percentile))}>{fmtPct(row.percentile, 1)}</td>
              <td className={cx(TD, "text-[#b8aecc]")}>{fmtCoreMetric(row.metric, row.min)}</td>
              <td className={cx(TD, "text-[#b8aecc]")}>{fmtCoreMetric(row.metric, row.median)}</td>
              <td className={cx(TD, "text-[#b8aecc]")}>{fmtCoreMetric(row.metric, row.mean)}</td>
              <td className={cx(TD, "text-[#b8aecc]")}>{fmtCoreMetric(row.metric, row.max)}</td>
            </tr>
          ))}
        </tbody>
      </Shell>
      <div className={cx("text-[10px]", ui.textSubtle)}>
        N counts valid runs only ({fmtInt(run.result?.nValid)} of {fmtInt(run.config?.nRuns)});
        stopped-out / ruined are excluded, and for PF also ∞ and null. All 6 core metrics are valid on
        Synthetic — every series produces its own trade count.
      </div>
    </div>
  );
}

const TITLES = {
  backtest: "Backtest result",
  [BT_CHILD_TYPE.SHUFFLER]: "Shuffler result",
  [BT_CHILD_TYPE.SYNTHETIC]: "Synthetic backtest result",
};

/**
 * Core result view. The full §6 modals (additional metrics, charts, pessimism
 * diagnostics, exports) land in the next iteration; the core tables and the
 * validity / percentile semantics are already final here.
 */
export const RunResultPreviewModal = memo(function RunResultPreviewModal({
  open,
  kind,
  run,
  onClose,
}) {
  const body = useMemo(() => {
    if (!run) return null;
    if (kind === BT_CHILD_TYPE.SHUFFLER) return <ShufflerBody run={run} />;
    if (kind === BT_CHILD_TYPE.SYNTHETIC) return <SyntheticBody run={run} />;
    return <BacktestBody run={run} />;
  }, [kind, run]);

  return (
    <AppDialog
      open={!!open}
      onOpenChange={(next) => {
        if (!next) onClose?.();
      }}
      title={TITLES[kind] || "Result"}
      description={run?.id}
      className="max-w-[1120px] max-h-[90vh] overflow-hidden flex flex-col"
    >
      <div className="min-h-0 flex-1 overflow-auto">{body}</div>
      <div className="flex items-center justify-between gap-2 pt-2">
        <span className={cx("text-[10px]", ui.textSubtle)}>
          Additional metrics, charts and exports arrive with the full result views.
        </span>
        <AppButton type="button" variant="outline" size="sm" onClick={onClose}>
          Close
        </AppButton>
      </div>
    </AppDialog>
  );
});

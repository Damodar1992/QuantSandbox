import React, { memo, useState } from "react";
import { cx, ui } from "../../../../constants/ui";
import { AppButton } from "../../../../components/common/AppButton";
import { MiniBacktestBalanceChart } from "./MiniBacktestBalanceChart";
import { MiniBacktestRunStatus } from "./MiniBacktestRunStatus";
import { MiniBacktestWaterfall } from "./MiniBacktestWaterfall";
import { MiniBacktestComparePairs } from "./MiniBacktestComparePairs";
import { MiniBacktestCycleChart } from "./MiniBacktestCycleChart";
import { MiniBacktestCycleTable } from "./MiniBacktestCycleTable";
import { MiniBacktestExportButton } from "./MiniBacktestExportButton";
import { getStageLabel } from "../../utils/stageSelect";
import {
  formatMiniBacktestStageVersion,
  getMiniBacktestContextChips,
  isFullMiniBacktestResult,
  formatMbMoney,
  formatMbPct,
  formatMbNum,
} from "../../utils/miniBacktestDisplay";
import {
  MINI_BACKTEST_LABELS,
  MINI_BACKTEST_UNITS,
  MINI_BACKTEST_DASHBOARD_TABS,
} from "../../../../constants/miniBacktest";

function resolveEpochNumber(entry) {
  if (entry.epochNumber != null) return entry.epochNumber;
  const label = entry.epochLabel || "";
  const match = label.match(/#(\d+)/);
  return match ? Number(match[1]) : null;
}

function MetricCard({ label, value, valueClassName, detail }) {
  return (
    <div className="rounded-lg border border-[rgba(60,40,80,0.35)] bg-[#120a20] px-3 py-2.5 min-w-0">
      <div className="text-[9px] font-medium uppercase tracking-wide text-[#8c8c8c]">{label}</div>
      <div className={cx("mt-1 text-[18px] font-semibold font-mono leading-tight", valueClassName || "text-[#f5f5f5]")}>
        {value}
      </div>
      {detail && <div className="text-[9px] text-[#6b6b6b] mt-1">{detail}</div>}
    </div>
  );
}

function ContextChip({ label, value }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-[rgba(60,40,80,0.45)] bg-[#19102b] px-2 py-1 text-[10px] text-[#b8aecc] whitespace-nowrap">
      <span className="text-[#8c8c8c]">{label}:</span>
      <span>{value}</span>
    </span>
  );
}

function formatParamValue(key, value, params) {
  if (value == null || value === "") return "—";
  if (key === "stakeMode") return value === "fixed" ? "Fixed $" : "Relative %";
  if (key === "orderType") return value === "maker" ? "Maker" : "Taker";
  if (key === "marketType") return value === "futures" ? "Futures" : "Spot";
  if (key === "stopoutMode") return value === "amount" ? "Fixed $" : "% of Start";
  if (key === "stopout") {
    return params.stopoutMode === "pct" ? `${value}%` : `$${value}`;
  }
  return typeof value === "number" ? value.toLocaleString() : String(value);
}

const DISPLAY_PARAM_KEYS = [
  "initialBalance",
  "stakeMode",
  "fixedStakeAmount",
  "relativeStakeAmount",
  "reservedPct",
  "orderType",
  "feeTaker",
  "feeMaker",
  "slippage",
  "marketType",
  "leverage",
  "maintMargin",
  "fundRate",
  "stopoutMode",
  "stopout",
  "cycleCount",
];

function RunParametersPanel({ runParams }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="rounded-lg border border-[rgba(60,40,80,0.35)] bg-[#120a20] overflow-hidden">
      <button
        type="button"
        onClick={() => setCollapsed((v) => !v)}
        className="w-full flex items-center justify-between gap-2 px-4 py-2.5 text-left hover:bg-[#1a1028]/60 transition-colors"
        aria-expanded={!collapsed}
      >
        <span className="text-[11px] font-medium text-[#d9d9d9]">Run parameters</span>
        <span className="text-[10px] text-[#8c8c8c] shrink-0">{collapsed ? "▶" : "▼"}</span>
      </button>
      {collapsed ? null : (
        <div className="px-4 pb-3 pt-0 border-t border-[rgba(60,40,80,0.25)]">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-2 pt-2">
            {DISPLAY_PARAM_KEYS.map((key) => {
              if (key === "fixedStakeAmount" && runParams.stakeMode === "relative") return null;
              if (key === "relativeStakeAmount" && runParams.stakeMode !== "relative") return null;
              if ((key === "feeTaker" || key === "slippage") && runParams.orderType === "maker") return null;
              if (key === "feeMaker" && runParams.orderType !== "maker") return null;
              if ((key === "leverage" || key === "maintMargin" || key === "fundRate") && runParams.marketType !== "futures") {
                return null;
              }
              const val = runParams[key];
              if (val == null && key !== "stopout") return null;
              return (
                <div key={key} className="min-w-0">
                  <div className="text-[10px] text-[#8c8c8c]">
                    {MINI_BACKTEST_LABELS[key] || key}
                    {MINI_BACKTEST_UNITS[key] ? ` (${MINI_BACKTEST_UNITS[key]})` : ""}
                  </div>
                  <div className="text-[12px] font-mono text-[#f5f5f5] mt-0.5">
                    {formatParamValue(key, val, runParams)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export const MiniBacktestDashboard = memo(function MiniBacktestDashboard({
  entry,
  onRemoveResult,
}) {
  const [activeTab, setActiveTab] = useState("backtest");

  if (!entry?.result?.summary) {
    return (
      <div className="flex items-center justify-center min-h-[320px] text-[12px] text-[#8c8c8c]">
        Select a mini backtest run
      </div>
    );
  }

  const s = entry.result.summary;
  const em = entry.result.epoch;
  const fullResult = isFullMiniBacktestResult(entry);
  const epochNumber = resolveEpochNumber(entry);
  const stageLabel = entry.stageId != null ? getStageLabel(entry.stageId) : entry.stage || "—";
  const stageVersionLabel = formatMiniBacktestStageVersion(entry);
  const runParams = entry.params || {};
  const futures = runParams.marketType === "futures";
  const leverage = runParams.leverage ?? 1;
  const roi = s.roiTotal ?? s.roi ?? 0;
  const equity = s.equity ?? s.finalBalance ?? 0;
  const reserve = s.reserve ?? 0;
  const maxDDTrad = s.maxDDTradIntra ?? s.maxDrawdown ?? 0;
  const maxDDTotal = s.maxDDIntra ?? s.maxDD ?? 0;
  const pf = s.pfNet ?? s.profitFactor ?? 0;
  const contextChips = getMiniBacktestContextChips(entry);

  const hyperoptIdDisplay = entry.hyperoptId || (entry.hyperoptNumber != null ? String(entry.hyperoptNumber) : null);
  const analyzerIdDisplay = entry.analyzerId || (entry.analyzerNumber != null ? String(entry.analyzerNumber) : null);
  const stageWithVersion = stageVersionLabel ? `${stageLabel} · ${stageVersionLabel}` : stageLabel;
  const epochSuffix = epochNumber != null ? ` (Epoch #${epochNumber})` : "";
  const title = `${stageWithVersion}${epochSuffix}`;

  const kpiSixthLabel = futures && leverage > 1 ? "Liquidations" : "Win Rate";
  const kpiSixthValue =
    futures && leverage > 1
      ? `${s.liqCount ?? 0} / ${s.execCount ?? s.cyclesExecuted ?? 0}`
      : `${s.winRate.toFixed(1)}%`;
  const kpiSixthDetail =
    futures && leverage > 1
      ? `@ ${leverage}× lev`
      : em?.hitRate != null
        ? `vs hit ${em.hitRate.toFixed(0)}%`
        : undefined;

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold text-[#faf7fd] truncate">{title}</h2>
          <p className={cx("text-[11px] mt-0.5", ui.textMuted)}>
            Hyperopt ID {hyperoptIdDisplay ?? "—"}
            {" · "}
            Analyzer ID {analyzerIdDisplay ?? "—"}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {fullResult && <MiniBacktestExportButton entry={entry} />}
          {onRemoveResult && (
            <AppButton
              type="button"
              variant="outline"
              size="xs"
              onClick={() => onRemoveResult(entry.id)}
              className="text-red-400 border-red-500/60 hover:bg-red-500/10"
            >
              Remove
            </AppButton>
          )}
        </div>
      </div>

      {!fullResult && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-200">
          Legacy run — re-run from Favorite Epochs to see full Before/After and Cycle Reports.
        </div>
      )}

      <div className="flex flex-wrap gap-1.5 text-[11px] text-[#b8aecc] rounded-lg border border-[rgba(60,40,80,0.35)] bg-[#1a1028] px-3 py-2">
        {contextChips.map((chip) => (
          <ContextChip key={chip.key} label={chip.label} value={chip.value} />
        ))}
      </div>

      <RunParametersPanel runParams={runParams} />

      <div className="flex flex-wrap justify-center gap-2 border-b border-[rgba(60,40,80,0.35)] pb-3">
        {MINI_BACKTEST_DASHBOARD_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            disabled={tab.id !== "backtest" && !fullResult}
            className={cx(
              "px-4 py-1.5 rounded-full text-[12px] font-medium border transition-colors",
              activeTab === tab.id
                ? "bg-violet-500/15 border-violet-500/40 text-violet-200"
                : "border-[rgba(60,40,80,0.35)] text-[#8c8c8c] hover:text-[#d9d9d9]",
              tab.id !== "backtest" && !fullResult && "opacity-40 cursor-not-allowed",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "backtest" && (
        <>
          <MiniBacktestRunStatus result={entry.result} params={runParams} />

          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2">
            <MetricCard
              label="ROI Total"
              value={formatMbPct(roi)}
              valueClassName={roi >= 0 ? "text-emerald-400" : "text-red-400"}
              detail="balance / start"
            />
            <MetricCard label="Total Balance" value={formatMbMoney(equity)} detail={`from ${formatMbMoney(s.initialBalance)}`} />
            <MetricCard label="Reserve" value={formatMbMoney(reserve)} valueClassName="text-teal-400" detail="locked profit" />
            <MetricCard
              label="Max DD · tradable"
              value={`${maxDDTrad.toFixed(2)}%`}
              valueClassName="text-orange-400"
              detail={`total (incl. reserve) ${maxDDTotal.toFixed(2)}%`}
            />
            <MetricCard
              label="Profit Factor"
              value={formatMbNum(pf)}
              valueClassName={pf >= 1 ? "text-emerald-400" : "text-red-400"}
              detail="net"
            />
            <MetricCard
              label={kpiSixthLabel}
              value={kpiSixthValue}
              valueClassName={
                futures && leverage > 1 && (s.liqCount ?? 0) > 0
                  ? "text-red-400"
                  : s.winRate >= 50
                    ? "text-emerald-400"
                    : "text-red-400"
              }
              detail={kpiSixthDetail}
            />
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-[13px] font-medium text-[#f5f5f5]">Balance Curve</h3>
              <span className="rounded-md border border-violet-500/40 bg-violet-500/10 px-2 py-0.5 text-[10px] text-violet-200">
                AFTER · realized
              </span>
            </div>
            <p className={cx("text-[10px] mb-2", ui.textMuted)}>
              Total, tradable, and reserve pots across executed cycles.
            </p>
            <MiniBacktestBalanceChart
              trades={entry.result.trades}
              initialBalance={s.initialBalance}
              halted={s.halted || s.stoppedOut}
              haltReason={s.haltReason}
              haltAt={s.haltAt}
            />
          </div>
        </>
      )}

      {activeTab === "compare" && fullResult && (
        <div className="space-y-3">
          <MiniBacktestWaterfall result={entry.result} params={runParams} />
          <MiniBacktestComparePairs result={entry.result} epochParams={entry.epochParams} />
        </div>
      )}

      {activeTab === "cycles" && fullResult && (
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[13px] font-medium text-[#f5f5f5]">Cycle Chart</h3>
              <MiniBacktestExportButton entry={entry} />
            </div>
            <MiniBacktestCycleChart rows={entry.result.rows} />
          </div>
          <div>
            <h3 className="text-[13px] font-medium text-[#f5f5f5] mb-2">Per-Cycle Table</h3>
            <MiniBacktestCycleTable rows={entry.result.rows} futures={futures} />
          </div>
        </div>
      )}
    </div>
  );
});

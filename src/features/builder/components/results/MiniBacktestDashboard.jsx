import React, { memo, useState } from "react";
import { LayoutDashboard, ArrowLeftRight, Table2, FunctionSquare } from "lucide-react";
import { cx, ui } from "../../../../constants/ui";
import { AppButton } from "../../../../components/common/AppButton";
import { TrashIcon } from "../../../../components/shared";
import { MiniBacktestBalanceChart } from "./MiniBacktestBalanceChart";
import { MiniBacktestRunStatus } from "./MiniBacktestRunStatus";
import { MiniBacktestComparePairs } from "./MiniBacktestComparePairs";
import { MiniBacktestCycleChart } from "./MiniBacktestCycleChart";
import { MiniBacktestCycleTable } from "./MiniBacktestCycleTable";
import { MiniBacktestExportButton } from "./MiniBacktestExportButton";
import { MiniBacktestFormulaReference } from "./MiniBacktestFormulaReference";
import { getStageLabel } from "../../utils/stageSelect";
import {
  formatMiniBacktestStageVersion,
  getMiniBacktestContextChips,
  isFullMiniBacktestResult,
  formatMbMoney,
  formatMbPct,
  formatMbNum,
  getMiniBacktestBalanceGrowth,
} from "../../utils/miniBacktestDisplay";
import { resolveTagNames } from "../../../../features/tags/utils/tagStore";
import {
  MINI_BACKTEST_LABELS,
  MINI_BACKTEST_UNITS,
  MINI_BACKTEST_DASHBOARD_TABS,
} from "../../../../constants/miniBacktest";

const DASHBOARD_TAB_ICONS = {
  backtest: LayoutDashboard,
  compare: ArrowLeftRight,
  cycles: Table2,
  formula: FunctionSquare,
};

function resolveEpochNumber(entry) {
  if (entry.epochNumber != null) return entry.epochNumber;
  const label = entry.epochLabel || "";
  const match = label.match(/#(\d+)/);
  return match ? Number(match[1]) : null;
}

/* ─── KPI card with optional formula link ─────────────────────────────── */
function MetricCard({ label, value, valueClassName, detail, onFormulaClick }) {
  return (
    <div className="rounded-lg border border-[rgba(60,40,80,0.35)] bg-[#120a20] px-3 py-2.5 min-w-0">
      <div className="text-[9px] font-medium uppercase tracking-wide text-[#8c8c8c]">
        {onFormulaClick ? (
          <button
            type="button"
            onClick={onFormulaClick}
            className="hover:text-violet-300 transition-colors cursor-pointer underline decoration-dotted underline-offset-2"
          >
            {label}
          </button>
        ) : (
          label
        )}
      </div>
      <div className={cx("mt-1 text-[18px] font-semibold font-mono leading-tight", valueClassName || "text-[#f5f5f5]")}>
        {value}
      </div>
      {detail && <div className="text-[9px] text-[#6b6b6b] mt-1">{detail}</div>}
    </div>
  );
}

function BalanceMetricCard({ label, value, growth, valueClassName }) {
  const growthClassName =
    growth == null || Number.isNaN(growth)
      ? "text-[#6b6b6b]"
      : growth >= 0
        ? "text-emerald-400"
        : "text-red-400";

  return (
    <div className="rounded-lg border border-[rgba(60,40,80,0.35)] bg-[#120a20] px-3 py-2.5 min-w-0">
      <div className="text-[9px] font-medium uppercase tracking-wide text-[#8c8c8c]">{label}</div>
      <div className={cx("mt-1 text-[18px] font-semibold font-mono leading-tight", valueClassName || "text-[#f5f5f5]")}>
        {value}
      </div>
      {growth != null && !Number.isNaN(growth) && (
        <div className={cx("mt-0.5 text-[11px] font-mono font-medium", growthClassName)}>
          {formatMbPct(growth)}
        </div>
      )}
    </div>
  );
}

function ContextChip({ label, value }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-[rgba(60,40,80,0.45)] bg-[#19102b] px-2 py-1 text-[10px] text-[#b8aecc] whitespace-nowrap">
      {label ? <span className="text-[#8c8c8c]">{label}:</span> : null}
      <span>{value}</span>
    </span>
  );
}

/* ─── Flow panel ──────────────────────────────────────────────────────── */
const FLOW_STEPS = [
  { label: "Epoch cycle (price)",               formulaId: 4  },
  { label: "Sizing: stake × leverage = notional", formulaId: 21 },
  { label: "Execution: slippage → fill",         formulaId: 22 },
  { label: "Gross PnL",                           formulaId: 24 },
  { label: "− Fees − Funding",                    formulaId: 25 },
  { label: "Net PnL",                             formulaId: 28 },
  { label: "Reserve split",                       formulaId: 29 },
  { label: "Balance updated",                     formulaId: 30 },
];

function FlowPanel({ onGotoFormula }) {
  return (
    <div className="rounded-xl border border-[rgba(60,40,80,0.35)] bg-[#120a20] px-3 py-3">
      <p className="text-[10px] text-[#8c8c8c] mb-2.5 leading-relaxed">
        <strong className="text-[#d9d9d9]">How a run works:</strong> the mini backtest replays the epoch
        cycle by cycle, turning each price move into real money — size the position, apply execution costs,
        take profit/loss, skim reserve, update balances, repeat. Click any step for its formula.
      </p>
      <div className="flex flex-wrap items-center gap-1.5">
        {FLOW_STEPS.map((step, i) => (
          <React.Fragment key={step.formulaId}>
            <button
              type="button"
              onClick={() => onGotoFormula(step.formulaId)}
              className="rounded-md border border-violet-500/30 bg-[#1a1028] hover:bg-violet-500/10 px-2.5 py-1 text-[11px] font-medium text-[#d9d9d9] hover:text-violet-200 transition-colors"
            >
              {step.label}
            </button>
            {i < FLOW_STEPS.length - 1 && (
              <span className="text-violet-400 font-bold text-[11px]">→</span>
            )}
          </React.Fragment>
        ))}
        <span className="text-violet-400 font-bold text-[11px]">↺ per cycle</span>
        <span className="text-violet-400 font-bold text-[11px]">→</span>
        <button
          type="button"
          onClick={() => onGotoFormula(32)}
          className="rounded-md border border-violet-500/30 bg-[#1a1028] hover:bg-violet-500/10 px-2.5 py-1 text-[11px] font-medium text-[#d9d9d9] hover:text-violet-200 transition-colors"
        >
          Final balances
        </button>
      </div>
    </div>
  );
}

function formatParamValue(key, value, params) {
  if (value == null || value === "") return "—";
  if (key === "stakeMode") return value === "fixed" ? "Fixed" : "Relative";
  if (key === "orderType") return value === "maker" ? "Maker" : "Taker";
  if (key === "marketType") return value === "futures" ? "Futures" : "Spot";
  if (key === "stopoutMode") return value === "amount" ? "Amount" : "% of Start";
  if (key === "stopout") {
    if (!value) return "Off";
    return params.stopoutMode === "pct" ? `${value}%` : `$${value.toLocaleString()}`;
  }
  return typeof value === "number" ? value.toLocaleString() : String(value);
}

function ParamTag({ label, value }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-[rgba(60,40,80,0.45)] bg-[#19102b] px-2 py-1 text-[10px] whitespace-nowrap">
      <span className="text-[#8c8c8c]">{label}</span>
      <span className="font-mono font-medium text-[#faf7fd] tabular-nums">{value}</span>
    </span>
  );
}

function ParamTagFromKey({ paramKey, runParams, label, unit }) {
  const val = runParams[paramKey];
  if (val == null && paramKey !== "stopout") return null;
  const unitSuffix = unit ?? MINI_BACKTEST_UNITS[paramKey];
  const displayLabel = label || MINI_BACKTEST_LABELS[paramKey] || paramKey;
  const fullLabel = unitSuffix ? `${displayLabel} (${unitSuffix})` : displayLabel;
  return (
    <ParamTag
      label={fullLabel}
      value={formatParamValue(paramKey, val, runParams)}
    />
  );
}

function ParamTagRow({ title, children }) {
  const items = React.Children.toArray(children).filter(Boolean);
  if (items.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 min-h-[28px]">
      <span className="w-[8.5rem] shrink-0 text-[9px] font-bold uppercase tracking-wide text-violet-300/75 leading-tight">
        {title}
      </span>
      <div className="flex flex-wrap items-center gap-1.5 min-w-0 flex-1">{items}</div>
    </div>
  );
}

function RunParametersPanel({ runParams }) {
  const [collapsed, setCollapsed] = useState(true);
  const isFutures = runParams.marketType === "futures";
  const isTaker = runParams.orderType !== "maker";
  const isFixedStake = runParams.stakeMode !== "relative";

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
        <div className="px-3 py-2 border-t border-[rgba(60,40,80,0.25)]">
          <div className="space-y-1.5 text-[10px] leading-snug">
            <ParamTagRow title="Account & Reserve">
              <ParamTagFromKey paramKey="initialBalance" runParams={runParams} />
              <ParamTagFromKey paramKey="reservedPct" runParams={runParams} />
            </ParamTagRow>

            <ParamTagRow title="Position Sizing">
              <ParamTagFromKey paramKey="stakeMode" runParams={runParams} />
              {isFixedStake ? (
                <ParamTagFromKey paramKey="fixedStakeAmount" runParams={runParams} />
              ) : (
                <ParamTagFromKey paramKey="relativeStakeAmount" runParams={runParams} />
              )}
            </ParamTagRow>

            <ParamTagRow title="Fee Type">
              <ParamTagFromKey paramKey="orderType" runParams={runParams} />
              {isTaker ? (
                <>
                  <ParamTagFromKey paramKey="feeTaker" runParams={runParams} unit="% / side" />
                  <ParamTagFromKey paramKey="slippage" runParams={runParams} unit="% / side" />
                </>
              ) : (
                <ParamTagFromKey paramKey="feeMaker" runParams={runParams} unit="% / side" />
              )}
            </ParamTagRow>

            <ParamTagRow title="Risk Control">
              <ParamTagFromKey paramKey="stopoutMode" runParams={runParams} />
              <ParamTagFromKey paramKey="stopout" runParams={runParams} />
            </ParamTagRow>

            {isFutures ? (
              <ParamTagRow title="Futures conditions">
                <ParamTagFromKey paramKey="leverage" runParams={runParams} />
                <ParamTagFromKey paramKey="maintMargin" runParams={runParams} />
                <ParamTag
                  label="Funding (% / 8h, signed)"
                  value={formatParamValue("fundRate", runParams.fundRate, runParams)}
                />
              </ParamTagRow>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Main Dashboard ──────────────────────────────────────────────────── */
export const MiniBacktestDashboard = memo(function MiniBacktestDashboard({
  entry,
  onDelete,
  onEditTags,
  tagsRegistry = [],
}) {
  const [activeTab, setActiveTab] = useState("backtest");
  const [formulaTarget, setFormulaTarget] = useState(null);

  const gotoFormula = (id) => {
    setFormulaTarget(id);
    setActiveTab("formula");
  };

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
  const roi = s.roiTotal ?? s.roi ?? 0;
  const equity = s.equity ?? s.finalBalance ?? 0;
  const tradable = s.tradable ?? equity - (s.reserve ?? 0);
  const reserve = s.reserve ?? 0;
  const maxDDIntra = s.maxDDIntra ?? s.maxDD ?? 0;
  const pf = s.pfNet ?? s.profitFactor ?? 0;
  const netPnl = s.pnlNet ?? s.totalPnL ?? 0;
  const calmar = s.calmar;
  const cagrPct = s.annual != null ? s.annual * 100 : null;
  const balanceGrowth = getMiniBacktestBalanceGrowth(s, runParams.initialBalance);
  const contextChips = getMiniBacktestContextChips(entry);
  const tagNames = resolveTagNames(entry.tagIds, tagsRegistry);

  const hyperoptIdDisplay = entry.hyperoptId || (entry.hyperoptNumber != null ? String(entry.hyperoptNumber) : null);
  const analyzerIdDisplay = entry.analyzerId || (entry.analyzerNumber != null ? String(entry.analyzerNumber) : null);
  const stageWithVersion = stageVersionLabel ? `${stageLabel} · ${stageVersionLabel}` : stageLabel;
  const title = stageWithVersion;

  const formatCalmar = (val) => {
    if (val == null || Number.isNaN(val)) return "—";
    if (val === Infinity) return "∞";
    if (val === -Infinity) return "−∞";
    return formatMbNum(val);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3 min-w-0">
        <div className="min-w-0 flex-1">
          <h2 className="text-[15px] font-semibold text-[#faf7fd] truncate">{title}</h2>
          <div className="mt-1.5 flex flex-wrap gap-1.5 rounded-lg border border-[rgba(60,40,80,0.35)] bg-[#1a1028] px-3 py-2">
            <ContextChip label="Hyperopt" value={hyperoptIdDisplay ?? "—"} />
            <ContextChip label="Analyzer" value={analyzerIdDisplay ?? "—"} />
            <ContextChip label="Epoch" value={epochNumber != null ? `#${epochNumber}` : "—"} />
            {contextChips.map((chip) => (
              <ContextChip key={chip.key} label={chip.label} value={chip.value} />
            ))}
            {tagNames.map((name) => (
              <ContextChip key={name} value={name} />
            ))}
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {onEditTags && (
            <AppButton
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onEditTags(entry)}
              title="Add tag"
              aria-label="Add tag"
            >
              Add tag
            </AppButton>
          )}
          {onDelete && (
            <AppButton
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onDelete(entry.id)}
              title="Delete mini backtest"
              aria-label="Delete mini backtest"
              className="text-red-400/90 hover:text-red-300"
            >
              <TrashIcon />
              Delete
            </AppButton>
          )}
        </div>
      </div>

      {!fullResult && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-200">
          Legacy run — re-run from Favorite Epochs to see full Before/After and Cycle Reports.
        </div>
      )}

      <RunParametersPanel runParams={runParams} />

      {/* Tab bar */}
      <div className="flex flex-wrap justify-start gap-2 border-b border-[rgba(60,40,80,0.35)] pb-3">
        {MINI_BACKTEST_DASHBOARD_TABS.map((tab) => {
          const isFormula = tab.id === "formula";
          const disabled = !isFormula && tab.id !== "backtest" && !fullResult;
          const TabIcon = DASHBOARD_TAB_ICONS[tab.id];
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                if (!disabled) {
                  setActiveTab(tab.id);
                  if (!isFormula) setFormulaTarget(null);
                }
              }}
              disabled={disabled}
              className={cx(
                "inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[12px] font-medium border transition-colors",
                activeTab === tab.id
                  ? "bg-violet-500/15 border-violet-500/40 text-violet-200"
                  : "border-[rgba(60,40,80,0.35)] text-[#8c8c8c] hover:text-[#d9d9d9]",
                disabled && "opacity-40 cursor-not-allowed",
              )}
            >
              {TabIcon ? <TabIcon className="h-3.5 w-3.5 shrink-0" aria-hidden /> : null}
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── Overview tab ─────────────────────────────────────────────── */}
      {activeTab === "backtest" && (
        <>
          <MiniBacktestRunStatus result={entry.result} params={runParams} />

          <FlowPanel onGotoFormula={gotoFormula} />

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-2">
            <MetricCard
              label="ROI (Total)"
              value={formatMbPct(roi)}
              valueClassName={roi >= 0 ? "text-emerald-400" : "text-red-400"}
              onFormulaClick={() => gotoFormula(32)}
            />
            <MetricCard
              label="Net PnL"
              value={formatMbMoney(netPnl)}
              valueClassName={netPnl >= 0 ? "text-emerald-400" : "text-red-400"}
              onFormulaClick={() => gotoFormula(28)}
            />
            <MetricCard
              label="Max DD (intra-cycle)"
              value={`${Number(maxDDIntra).toFixed(2)}%`}
              valueClassName="text-orange-400"
              onFormulaClick={() => gotoFormula(36)}
            />
            <MetricCard
              label="Calmar"
              value={formatCalmar(calmar)}
              onFormulaClick={() => gotoFormula(38)}
            />
            <MetricCard
              label="Win Rate"
              value={`${s.winRate.toFixed(1)}%`}
              valueClassName={s.winRate >= 50 ? "text-emerald-400" : "text-red-400"}
              detail={em?.hitRate != null ? `vs hit ${em.hitRate.toFixed(0)}%` : undefined}
              onFormulaClick={() => gotoFormula(39)}
            />
            <MetricCard
              label="Profit Factor (net)"
              value={formatMbNum(pf)}
              valueClassName={pf >= 1 ? "text-emerald-400" : "text-red-400"}
              onFormulaClick={() => gotoFormula(40)}
            />
            <MetricCard
              label="CAGR"
              value={cagrPct != null ? formatMbPct(cagrPct) : "—"}
              valueClassName={cagrPct != null && cagrPct >= 0 ? "text-emerald-400" : "text-red-400"}
              onFormulaClick={() => gotoFormula(37)}
            />
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-[13px] font-medium text-[#f5f5f5]">Balance Curve</h3>
              <span className="rounded-md border border-violet-500/40 bg-violet-500/10 px-2 py-0.5 text-[10px] text-violet-200">
                AFTER · realized
              </span>
            </div>
            <p className={cx("text-[10px] mb-3", ui.textMuted)}>
              Total, tradable, and reserve pots across executed cycles.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
              <BalanceMetricCard
                label="Total balance"
                value={formatMbMoney(equity)}
                growth={balanceGrowth.total}
              />
              <BalanceMetricCard
                label="Tradable balance"
                value={formatMbMoney(tradable)}
                growth={balanceGrowth.tradable}
              />
              <BalanceMetricCard
                label="Reserved balance"
                value={formatMbMoney(reserve)}
                growth={balanceGrowth.reserve}
                valueClassName="text-teal-400"
              />
            </div>
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

      {/* ── Before / After tab ───────────────────────────────────────── */}
      {activeTab === "compare" && fullResult && (
        <div className="space-y-3">
          <MiniBacktestComparePairs
            result={entry.result}
            epochParams={entry.epochParams}
            onGotoFormula={gotoFormula}
          />
        </div>
      )}

      {/* ── Cycle Reports tab ────────────────────────────────────────── */}
      {activeTab === "cycles" && fullResult && (
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-[13px] font-medium text-[#f5f5f5]">Cycle Construction</h3>
                <p className="text-[10px] text-[#8c8c8c] mt-0.5">
                  Each bar is one cycle — height = executed Return%:{" "}
                  <span className="text-emerald-400 font-semibold">green = win</span>,{" "}
                  <span className="text-red-400 font-semibold">red = loss</span>,{" "}
                  <span className="text-amber-400 font-semibold">amber = liquidated</span>.{" "}
                  The thin wick spans MFE (top) to MAE (bottom).
                </p>
              </div>
            </div>
            <MiniBacktestCycleChart rows={entry.result.rows} />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-[13px] font-medium text-[#f5f5f5]">Per-Cycle Table</h3>
                <p className="text-[10px] text-[#8c8c8c] mt-0.5">
                  Entry/Exit include slippage when set; Return% is the executed return.{" "}
                  <button
                    type="button"
                    onClick={() => gotoFormula(23)}
                    className="text-violet-400 hover:text-violet-300 underline decoration-dotted underline-offset-2 transition-colors"
                  >
                    Qty formula
                  </button>
                  {" · "}
                  <button
                    type="button"
                    onClick={() => gotoFormula(24)}
                    className="text-violet-400 hover:text-violet-300 underline decoration-dotted underline-offset-2 transition-colors"
                  >
                    Gross
                  </button>
                  {" · "}
                  <button
                    type="button"
                    onClick={() => gotoFormula(28)}
                    className="text-violet-400 hover:text-violet-300 underline decoration-dotted underline-offset-2 transition-colors"
                  >
                    Net PnL
                  </button>
                  {futures && (
                    <>
                      {" · "}
                      <button
                        type="button"
                        onClick={() => gotoFormula(26)}
                        className="text-violet-400 hover:text-violet-300 underline decoration-dotted underline-offset-2 transition-colors"
                      >
                        Funding
                      </button>
                      {" · "}
                      <button
                        type="button"
                        onClick={() => gotoFormula(27)}
                        className="text-violet-400 hover:text-violet-300 underline decoration-dotted underline-offset-2 transition-colors"
                      >
                        Liquidation
                      </button>
                    </>
                  )}
                </p>
              </div>
              <MiniBacktestExportButton entry={entry} />
            </div>
            <MiniBacktestCycleTable rows={entry.result.rows} futures={futures} />
          </div>
        </div>
      )}

      {/* ── Formula Reference tab ─────────────────────────────────────── */}
      {activeTab === "formula" && (
        <MiniBacktestFormulaReference targetId={formulaTarget} />
      )}
    </div>
  );
});

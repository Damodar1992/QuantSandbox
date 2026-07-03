import React, { memo, useState, useCallback, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { cx, ui } from "../../../../constants/ui";
import { crmSurface } from "../../../../constants/crmAccent";
import {
  MINI_BACKTEST_DEFAULTS,
  MINI_BACKTEST_LABELS,
  MINI_BACKTEST_UNITS,
  MINI_BACKTEST_STAKE_MODES,
  MINI_BACKTEST_ORDER_TYPES,
  MINI_BACKTEST_MARKET_TYPES,
  MINI_BACKTEST_STOPOUT_MODES,
} from "../../../../constants/miniBacktest";
import { generateCycleDataForEpoch } from "../../utils/miniBacktestData";
import { runMiniBacktest, hashParams } from "../../utils/miniBacktestEngine";
import { getStageLabel } from "../../utils/stageSelect";
import { buildMiniBacktestLaunchContext } from "../../utils/miniBacktestDisplay";
import { AppButton } from "../../../../components/common/AppButton";

const INPUT_CLS = cx(ui.input, "h-7 px-2 text-[11px] w-full min-w-0");
const LABEL_CLS = "text-[9px] text-[#8c8c8c] leading-none truncate block h-[14px]";

function FieldLabel({ label, unit, className }) {
  return (
    <span className={cx(LABEL_CLS, className)}>
      {label}
      {unit ? <span className="text-[#595959]"> ({unit})</span> : null}
    </span>
  );
}

function RadioGroup({ options, value, onChange, name, layout = "col", className }) {
  return (
    <div
      className={cx(
        layout === "col"
          ? "flex flex-col justify-center gap-0.5 min-h-[36px]"
          : "flex items-center gap-2.5 h-7",
        className,
      )}
    >
      {options.map((opt) => (
        <label
          key={opt.value}
          className={cx(
            "inline-flex items-center gap-1.5 cursor-pointer text-[10px] font-medium leading-none whitespace-nowrap",
            value === opt.value ? "text-violet-300" : "text-[#8c8c8c] hover:text-[#d9d9d9]",
          )}
        >
          <input
            type="radio"
            name={name}
            value={opt.value}
            checked={value === opt.value}
            onChange={() => onChange(opt.value)}
            className="h-3 w-3 shrink-0 accent-violet-400 cursor-pointer"
          />
          {opt.label}
        </label>
      ))}
    </div>
  );
}

function ModeRow({ modeLabel, name, options, value, onChange, fields = [], radioLayout = "col" }) {
  const colsClass = fields.length === 3 ? "grid-cols-3" : fields.length === 2 ? "grid-cols-2" : "grid-cols-1";

  return (
    <div className="grid grid-cols-[118px_minmax(0,1fr)] gap-x-3 gap-y-0.5 w-full">
      <FieldLabel label={modeLabel} />
      {fields.length > 0 ? (
        <div className={cx("grid gap-x-1.5 min-w-0", colsClass)}>
          {fields.map((field) => (
            <FieldLabel key={`${field.key}-label`} label={field.label} unit={field.unit} />
          ))}
        </div>
      ) : (
        <div aria-hidden />
      )}

      <RadioGroup
        name={name}
        options={options}
        value={value}
        onChange={onChange}
        layout={radioLayout}
        className={radioLayout === "col" ? "self-center" : undefined}
      />
      {fields.length > 0 ? (
        <div className={cx("grid gap-x-1.5 min-w-0 self-center", colsClass)}>
          {fields.map((field) => (
            <NumberInput
              key={field.key}
              value={field.value}
              onChange={field.onChange}
              min={field.min}
              step={field.step}
            />
          ))}
        </div>
      ) : (
        <div aria-hidden />
      )}
    </div>
  );
}

function FieldsRow({ fields }) {
  const colsClass = fields.length === 2 ? "grid-cols-2" : "grid-cols-1";

  return (
    <div className={cx("grid gap-x-1.5 gap-y-0.5 w-full", colsClass)}>
      {fields.map((field) => (
        <FieldLabel key={`${field.key}-label`} label={field.label} unit={field.unit} />
      ))}
      {fields.map((field) => (
        <NumberInput
          key={field.key}
          value={field.value}
          onChange={field.onChange}
          min={field.min}
          step={field.step}
        />
      ))}
    </div>
  );
}

function SectionGroup({ title, children, className }) {
  return (
    <div className={cx("rounded border border-[#303030]/60 overflow-hidden", className)}>
      <div className="px-2 py-1 text-[9px] font-semibold uppercase tracking-wide text-[#8c8c8c] bg-[#19102b]/40 border-b border-[#303030]/40">
        {title}
      </div>
      <div className="p-2 min-h-[58px] flex items-center w-full">{children}</div>
    </div>
  );
}

function NumberInput({ value, onChange, min, step }) {
  const safeValue = Number.isFinite(value) ? value : "";
  return (
    <input
      type="number"
      value={safeValue}
      onChange={(e) => {
        const raw = e.target.value;
        if (raw === "") {
          onChange(0);
          return;
        }
        const next = Number(raw);
        onChange(Number.isFinite(next) ? next : 0);
      }}
      className={INPUT_CLS}
      min={min}
      step={step}
    />
  );
}

export const MiniBacktestModal = memo(function MiniBacktestModal({
  epoch,
  existingResult,
  open,
  onClose,
  onSaveResult,
  launchStageId = 1,
  launchStageVersion = null,
  launchContext = null,
}) {
  const [params, setParams] = useState(() =>
    existingResult ? { ...MINI_BACKTEST_DEFAULTS, ...existingResult.params } : { ...MINI_BACKTEST_DEFAULTS },
  );
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (open) {
      setParams(existingResult ? { ...MINI_BACKTEST_DEFAULTS, ...existingResult.params } : { ...MINI_BACKTEST_DEFAULTS });
    }
  }, [open, existingResult]);

  const updateParam = useCallback((key, value) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  }, []);

  const pairLabel = epoch?.pairs || epoch?.pair || "—";
  const tfLabel = epoch?.timeframe || epoch?.timeRange || "—";
  const epochNumber = epoch?.epochNumber ?? epoch?.meta?.epochNumber ?? null;
  const resolvedCycleCount = useMemo(() => {
    const raw =
      epoch?.foldSize ??
      epoch?.meta?.foldSize ??
      epoch?.cycleCount ??
      params.cycleCount ??
      MINI_BACKTEST_DEFAULTS.cycleCount;
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : MINI_BACKTEST_DEFAULTS.cycleCount;
  }, [epoch, params.cycleCount]);

  const handleRun = useCallback(() => {
    if (!epoch?.id) return;

    setRunning(true);
    try {
      const { meta, cycles } = generateCycleDataForEpoch(epoch, resolvedCycleCount, {
        stageId: launchStageId,
        hyperoptId: epoch?.meta?.rowId || epoch?.hyperoptId || epoch?.id,
        epochNumber: epoch?.epochNumber ?? 1,
      });
      const backtestResult = runMiniBacktest(cycles, params, meta);

      const runParams = { ...params, cycleCount: resolvedCycleCount };
      const paramsHash = hashParams(runParams);
      const matchedExisting = existingResult?.paramsHash === paramsHash ? existingResult : null;

      const resolvedLaunch = launchContext || buildMiniBacktestLaunchContext({
        pairs: pairLabel !== "—" ? pairLabel : meta.pair,
        timeframe: tfLabel !== "—" ? tfLabel : meta.timeframe,
        knowRange: epoch.knowRange ?? epoch.timeRange,
      });

      const entry = {
        id: matchedExisting?.id || `mbt-${epoch.id}-${Date.now()}`,
        epochId: epoch.id,
        stageId: launchStageId,
        stage: getStageLabel(launchStageId),
        stageVersionId: launchStageVersion?.id ?? null,
        stageVersionLabel: launchStageVersion?.label ?? null,
        stageVersionLineage: launchStageVersion?.lineageCode ?? null,
        stageVersionLocal: launchStageVersion?.localVersion ?? null,
        hyperoptNumber: epoch.hyperoptNumber ?? epoch.meta?.hyperoptNumber ?? null,
        analyzerNumber: epoch.analyzerNumber ?? epoch.meta?.analyzerNumber ?? null,
        hyperoptId: epoch.meta?.rowId || epoch.hyperoptId || "",
        analyzerId: epoch.meta?.subId || epoch.analyzerId || "",
        epochNumber: epoch.epochNumber ?? null,
        epochLabel: epoch.label || "Best result",
        epochParams: {
          mfe: epoch.mfe,
          mae: epoch.mae,
          air: epoch.air,
          hitRate: epoch.hitRate,
          score: epoch.score,
          stability: epoch.stability,
        },
        tradingMode: resolvedLaunch.tradingMode,
        exchange: resolvedLaunch.exchange,
        pairs: resolvedLaunch.pairs !== "—" ? resolvedLaunch.pairs : meta.pair,
        timeframe: resolvedLaunch.timeframe !== "—" ? resolvedLaunch.timeframe : meta.timeframe,
        timeRange: resolvedLaunch.timeRange,
        knowRange: epoch.knowRange ?? null,
        cycleMeta: meta,
        cycleData: cycles,
        params: runParams,
        paramsHash,
        runStatus: "Finished",
        result: backtestResult,
        createdAt: new Date().toISOString(),
      };

      onSaveResult?.(entry);
      onClose?.();
    } catch (err) {
      console.error("[MiniBacktestModal] run failed:", err);
    } finally {
      setRunning(false);
    }
  }, [epoch, params, existingResult, onSaveResult, onClose, launchStageId, launchStageVersion, launchContext, pairLabel, tfLabel, resolvedCycleCount]);

  if (!open) return null;

  const stakeFields =
    params.stakeMode === "fixed"
      ? [
          {
            key: "fixedStakeAmount",
            label: MINI_BACKTEST_LABELS.fixedStakeAmount,
            unit: MINI_BACKTEST_UNITS.fixedStakeAmount,
            value: params.fixedStakeAmount,
            onChange: (v) => updateParam("fixedStakeAmount", v),
            min: 0,
          },
        ]
      : [
          {
            key: "relativeStakeAmount",
            label: MINI_BACKTEST_LABELS.relativeStakeAmount,
            unit: MINI_BACKTEST_UNITS.relativeStakeAmount,
            value: params.relativeStakeAmount,
            onChange: (v) => updateParam("relativeStakeAmount", v),
            min: 0,
          },
        ];

  const executionFields =
    params.orderType === "taker"
      ? [
          {
            key: "feeTaker",
            label: MINI_BACKTEST_LABELS.feeTaker,
            unit: "% / side",
            value: params.feeTaker,
            onChange: (v) => updateParam("feeTaker", v),
            min: 0,
            step: 0.01,
          },
          {
            key: "slippage",
            label: MINI_BACKTEST_LABELS.slippage,
            unit: "% / side",
            value: params.slippage,
            onChange: (v) => updateParam("slippage", v),
            min: 0,
            step: 0.01,
          },
        ]
      : [
          {
            key: "feeMaker",
            label: MINI_BACKTEST_LABELS.feeMaker,
            unit: "% / side",
            value: params.feeMaker,
            onChange: (v) => updateParam("feeMaker", v),
            min: 0,
            step: 0.01,
          },
        ];

  const marketFields =
    params.marketType === "futures"
      ? [
          {
            key: "leverage",
            label: MINI_BACKTEST_LABELS.leverage,
            unit: "×",
            value: params.leverage,
            onChange: (v) => updateParam("leverage", v),
            min: 1,
          },
          {
            key: "maintMargin",
            label: "Maint.",
            unit: "%",
            value: params.maintMargin,
            onChange: (v) => updateParam("maintMargin", v),
            min: 0,
            step: 0.1,
          },
          {
            key: "fundRate",
            label: "Funding",
            unit: "%/8h",
            value: params.fundRate,
            onChange: (v) => updateParam("fundRate", v),
            step: 0.01,
          },
        ]
      : [];

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      <div
        className={cx(
          "relative z-10 w-full max-w-2xl rounded-lg border shadow-xl max-h-[90vh] flex flex-col",
          crmSurface.border,
          crmSurface.input,
        )}
      >
        <div className="flex items-center justify-between px-3 py-2 border-b border-[#303030] shrink-0 bg-[#13131f]">
          <div className="text-[12px] font-semibold text-[#f5f5f5]">Mini Backtest</div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#8c8c8c] hover:text-[#d9d9d9] text-[16px] leading-none"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="p-3 space-y-2 overflow-y-auto flex-1 min-h-0">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded border border-teal-500/25 bg-teal-500/10 px-2.5 py-1.5 text-[10px] min-h-[28px]">
            <span className="text-[8px] font-bold uppercase tracking-wider text-teal-300 shrink-0">Hyper Opt</span>
            <span className="text-[#8c8c8c]">
              Pair <span className="font-mono font-semibold text-[#f5f5f5]">{pairLabel}</span>
            </span>
            <span className="text-[#595959]">·</span>
            <span className="text-[#8c8c8c]">
              TF <span className="font-mono font-semibold text-[#f5f5f5]">{tfLabel}</span>
            </span>
            <span className="text-[#595959]">·</span>
            <span className="text-[#8c8c8c]">
              Epoch{" "}
              <span className="font-mono font-semibold text-[#f5f5f5]">
                {epochNumber != null ? `#${epochNumber}` : "—"}
              </span>
            </span>
            <span className="text-[#595959]">·</span>
            <span className="text-[#8c8c8c]">
              Cycles <span className="font-mono font-semibold text-[#f5f5f5]">{resolvedCycleCount}</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-stretch">
            <SectionGroup title="Account & Reserve">
              <FieldsRow
                fields={[
                  {
                    key: "initialBalance",
                    label: MINI_BACKTEST_LABELS.initialBalance,
                    unit: MINI_BACKTEST_UNITS.initialBalance,
                    value: params.initialBalance,
                    onChange: (v) => updateParam("initialBalance", v),
                    min: 0,
                  },
                  {
                    key: "reservedPct",
                    label: MINI_BACKTEST_LABELS.reservedPct,
                    unit: MINI_BACKTEST_UNITS.reservedPct,
                    value: params.reservedPct,
                    onChange: (v) => updateParam("reservedPct", v),
                    min: 0,
                  },
                ]}
              />
            </SectionGroup>

            <SectionGroup title="Position Sizing">
              <ModeRow
                modeLabel={MINI_BACKTEST_LABELS.stakeMode}
                name="stakeMode"
                options={MINI_BACKTEST_STAKE_MODES}
                value={params.stakeMode}
                onChange={(v) => updateParam("stakeMode", v)}
                fields={stakeFields}
              />
            </SectionGroup>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-stretch">
            <SectionGroup title="Execution & Fees">
              <ModeRow
                modeLabel={MINI_BACKTEST_LABELS.orderType}
                name="orderType"
                options={MINI_BACKTEST_ORDER_TYPES}
                value={params.orderType}
                onChange={(v) => updateParam("orderType", v)}
                fields={executionFields}
              />
            </SectionGroup>

            <SectionGroup title="Market">
              <ModeRow
                modeLabel={MINI_BACKTEST_LABELS.marketType}
                name="marketType"
                options={MINI_BACKTEST_MARKET_TYPES}
                value={params.marketType}
                onChange={(v) => updateParam("marketType", v)}
                fields={marketFields}
              />
            </SectionGroup>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-stretch">
            <SectionGroup title="Risk Control">
              <ModeRow
                modeLabel={MINI_BACKTEST_LABELS.stopoutMode}
                name="stopoutMode"
                options={MINI_BACKTEST_STOPOUT_MODES}
                value={params.stopoutMode}
                onChange={(v) => updateParam("stopoutMode", v)}
                fields={[
                  {
                    key: "stopout",
                    label: "Stopout floor",
                    unit: params.stopoutMode === "amount" ? "USDT, 0=off" : "% start, 0=off",
                    value: params.stopout,
                    onChange: (v) => updateParam("stopout", v),
                    min: 0,
                  },
                ]}
              />
            </SectionGroup>
          </div>
        </div>

        <div className="flex justify-end px-3 py-2 border-t border-[#303030]/50 shrink-0 bg-[#13131f] relative z-20">
          <AppButton type="button" variant="default" size="sm" onClick={handleRun} disabled={running}>
            {running ? "Running..." : "Run Mini Backtest"}
          </AppButton>
        </div>
      </div>
    </div>,
    document.body,
  );
});

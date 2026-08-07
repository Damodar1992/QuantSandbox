import React, { memo, useState, useCallback, useEffect, useMemo } from "react";
import { cx, ui } from "../../../../constants/ui";
import {
  MINI_BACKTEST_DEFAULTS,
  MINI_BACKTEST_LABELS,
  MINI_BACKTEST_UNITS,
  MINI_BACKTEST_STAKE_MODES,
  MINI_BACKTEST_ORDER_TYPES,
  MINI_BACKTEST_STOPOUT_MODES,
} from "../../../../constants/miniBacktest";
import { generateCycleDataForEpoch } from "../../utils/miniBacktestData";
import { runMiniBacktest, hashParams } from "../../utils/miniBacktestEngine";
import { getStageLabel } from "../../utils/stageSelect";
import { buildMiniBacktestLaunchContext } from "../../utils/miniBacktestDisplay";
import { AppButton } from "../../../../components/common/AppButton";
import { AppDialog } from "../../../../components/common/AppDialog";
import { AppInput } from "../../../../components/common/AppInput";

const INPUT_CLS = "h-9 w-full min-w-0 text-[12px]";
const LABEL_CLS = "text-[11px] text-[#8c8c8c] leading-snug mb-1 block";

function FieldLabel({ label, unit, hint, className }) {
  return (
    <label className={cx(LABEL_CLS, className)}>
      {label}
      {unit ? <span className="text-[#595959]"> ({unit})</span> : null}
      {hint ? <span className="block text-[9px] text-[#595959] mt-0.5 font-normal">{hint}</span> : null}
    </label>
  );
}

function SegmentedControl({ options, value, onChange, name }) {
  return (
    <div
      role="group"
      aria-label={name}
      className="flex rounded-lg border border-[rgba(60,40,80,0.45)] bg-[#0d0718] p-0.5 gap-0.5"
    >
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cx(
              "flex-1 rounded-md px-2.5 py-1.5 text-[11px] font-semibold transition-colors",
              active
                ? "bg-violet-500/20 border border-violet-500/40 text-violet-200 shadow-[0_0_0_1px_rgba(139,92,246,0.15)]"
                : "border border-transparent text-[#8c8c8c] hover:text-[#d9d9d9] hover:bg-[#1a1028]",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function SectionCard({ title, children, className }) {
  return (
    <section className={cx("rounded-lg border border-[rgba(60,40,80,0.35)] bg-[#120a20] overflow-hidden", className)}>
      <div className="px-3 py-2 border-b border-[rgba(60,40,80,0.25)] bg-[#19102b]/50">
        <h3 className="text-[10px] font-bold uppercase tracking-wider text-[#b8aecc]">{title}</h3>
      </div>
      <div className="p-3 space-y-3">{children}</div>
    </section>
  );
}

function Field({ label, unit, hint, inputAlign, children }) {
  const labelEl = (
    <FieldLabel label={label} unit={unit} hint={hint} className={inputAlign ? "mb-0" : undefined} />
  );

  if (inputAlign) {
    return (
      <div className="min-w-0 flex flex-col">
        <div className="min-h-[2.25rem] flex items-end mb-1">{labelEl}</div>
        {children}
      </div>
    );
  }

  return (
    <div className="min-w-0">
      {labelEl}
      {children}
    </div>
  );
}

function NumberInput({ value, onChange, min, step, placeholder }) {
  const safeValue = Number.isFinite(value) ? value : "";
  return (
    <AppInput
      type="number"
      value={safeValue}
      placeholder={placeholder}
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
      wrapperClassName="space-y-0"
      min={min}
      step={step}
    />
  );
}

function resolveMarketType(launchContext, epoch) {
  const fromLaunch = launchContext?.tradingMode;
  if (fromLaunch === "futures" || fromLaunch === "spot") return fromLaunch;
  const fromEpoch = epoch?.tradingMode ?? epoch?.marketType;
  if (fromEpoch === "futures" || fromEpoch === "spot") return fromEpoch;
  return MINI_BACKTEST_DEFAULTS.marketType;
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
  const resolvedMarketType = useMemo(
    () => resolveMarketType(launchContext, epoch),
    [launchContext, epoch],
  );

  const [params, setParams] = useState(() => ({
    ...MINI_BACKTEST_DEFAULTS,
    ...(existingResult?.params ?? {}),
    marketType: resolveMarketType(launchContext, epoch),
  }));
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!open) return;
    setParams({
      ...MINI_BACKTEST_DEFAULTS,
      ...(existingResult?.params ?? {}),
      marketType: resolvedMarketType,
    });
  }, [open, existingResult, resolvedMarketType]);

  const updateParam = useCallback((key, value) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  }, []);

  const pairLabel = epoch?.pairs || epoch?.pair || "—";
  const tfLabel = epoch?.timeframe || epoch?.timeRange || "—";
  const epochNumber = useMemo(() => {
    if (epoch?.epochNumber != null) return epoch.epochNumber;
    if (epoch?.meta?.epochNumber != null) return epoch.meta.epochNumber;
    const match = String(epoch?.label || "").match(/#(\d+)/);
    return match ? Number(match[1]) : null;
  }, [epoch]);

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
      const runParams = { ...params, marketType: resolvedMarketType, cycleCount: resolvedCycleCount };
      const { meta, cycles } = generateCycleDataForEpoch(epoch, resolvedCycleCount, {
        stageId: launchStageId,
        hyperoptId: epoch?.meta?.rowId || epoch?.hyperoptId || epoch?.id,
        epochNumber: epoch?.epochNumber ?? 1,
      });
      const backtestResult = runMiniBacktest(cycles, runParams, meta);

      const paramsHash = hashParams(runParams);
      const matchedExisting = existingResult?.paramsHash === paramsHash ? existingResult : null;

      const resolvedLaunch = launchContext || buildMiniBacktestLaunchContext({
        tradingMode: resolvedMarketType,
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
  }, [
    epoch,
    params,
    existingResult,
    onSaveResult,
    onClose,
    launchStageId,
    launchStageVersion,
    launchContext,
    pairLabel,
    tfLabel,
    resolvedCycleCount,
    resolvedMarketType,
  ]);

  return (
    <AppDialog
      open={!!open}
      onOpenChange={(next) => {
        if (!next) onClose?.();
      }}
      title={`MiniBacktest for epoch #${epochNumber ?? "—"}`}
      description="Configure trading conditions for this epoch"
      className="max-w-lg max-h-[90vh] overflow-hidden flex flex-col"
    >
      <div className="space-y-3 overflow-y-auto flex-1 min-h-0">
        <SectionCard title="Account & Reserve">
          <div className="grid grid-cols-2 gap-3">
            <Field label={MINI_BACKTEST_LABELS.initialBalance} unit={MINI_BACKTEST_UNITS.initialBalance}>
              <NumberInput
                value={params.initialBalance}
                onChange={(v) => updateParam("initialBalance", v)}
                min={1}
                placeholder="e.g. 100000"
              />
            </Field>
            <Field label={MINI_BACKTEST_LABELS.reservedPct} unit={MINI_BACKTEST_UNITS.reservedPct}>
              <NumberInput
                value={params.reservedPct}
                onChange={(v) => updateParam("reservedPct", v)}
                min={0}
                placeholder="e.g. 10"
              />
            </Field>
          </div>
        </SectionCard>

        <SectionCard title="Position Sizing">
          <Field label={MINI_BACKTEST_LABELS.stakeMode}>
            <SegmentedControl
              name="stakeMode"
              options={MINI_BACKTEST_STAKE_MODES}
              value={params.stakeMode}
              onChange={(v) => updateParam("stakeMode", v)}
            />
          </Field>
          {params.stakeMode === "fixed" ? (
            <Field label={MINI_BACKTEST_LABELS.fixedStakeAmount} unit={MINI_BACKTEST_UNITS.fixedStakeAmount}>
              <NumberInput
                value={params.fixedStakeAmount}
                onChange={(v) => updateParam("fixedStakeAmount", v)}
                min={1}
                placeholder="e.g. 5000"
              />
            </Field>
          ) : (
            <Field label={MINI_BACKTEST_LABELS.relativeStakeAmount} unit={MINI_BACKTEST_UNITS.relativeStakeAmount}>
              <NumberInput
                value={params.relativeStakeAmount}
                onChange={(v) => updateParam("relativeStakeAmount", v)}
                min={0.1}
                step={0.5}
                placeholder="e.g. 10"
              />
            </Field>
          )}
        </SectionCard>

        <SectionCard title="Fee Type">
          <Field label={MINI_BACKTEST_LABELS.orderType}>
            <SegmentedControl
              name="orderType"
              options={MINI_BACKTEST_ORDER_TYPES}
              value={params.orderType}
              onChange={(v) => updateParam("orderType", v)}
            />
          </Field>
          {params.orderType === "taker" ? (
            <div className="grid grid-cols-2 gap-3">
              <Field label={MINI_BACKTEST_LABELS.feeTaker} unit="% / side">
                <NumberInput
                  value={params.feeTaker}
                  onChange={(v) => updateParam("feeTaker", v)}
                  min={0}
                  step={0.01}
                  placeholder="0.10"
                />
              </Field>
              <Field label={MINI_BACKTEST_LABELS.slippage} unit="% / side">
                <NumberInput
                  value={params.slippage}
                  onChange={(v) => updateParam("slippage", v)}
                  min={0}
                  step={0.01}
                  placeholder="0.05"
                />
              </Field>
            </div>
          ) : (
            <Field label={MINI_BACKTEST_LABELS.feeMaker} unit="% / side" hint="Maker: no slippage">
              <NumberInput
                value={params.feeMaker}
                onChange={(v) => updateParam("feeMaker", v)}
                min={0}
                step={0.01}
                placeholder="0.02"
              />
            </Field>
          )}
        </SectionCard>

        <SectionCard title="Risk Control">
          <Field label={MINI_BACKTEST_LABELS.stopoutMode}>
            <SegmentedControl
              name="stopoutMode"
              options={MINI_BACKTEST_STOPOUT_MODES}
              value={params.stopoutMode}
              onChange={(v) => updateParam("stopoutMode", v)}
            />
          </Field>
          <Field
            label="Stopout floor"
            unit={params.stopoutMode === "amount" ? "USDT · empty = off" : "% of start · empty = off"}
          >
            <NumberInput
              value={params.stopout}
              onChange={(v) => updateParam("stopout", v)}
              min={0}
              placeholder="empty = off"
            />
          </Field>
        </SectionCard>

        {resolvedMarketType === "futures" ? (
          <SectionCard title="Futures conditions">
            <div className="grid grid-cols-3 gap-3">
              <Field
                inputAlign
                label={MINI_BACKTEST_LABELS.leverage}
                unit={MINI_BACKTEST_UNITS.leverage}
              >
                <NumberInput
                  value={params.leverage}
                  onChange={(v) => updateParam("leverage", v)}
                  min={1}
                  step={1}
                  placeholder="e.g. 5"
                />
              </Field>
              <Field
                inputAlign
                label={MINI_BACKTEST_LABELS.maintMargin}
                unit={MINI_BACKTEST_UNITS.maintMargin}
              >
                <NumberInput
                  value={params.maintMargin}
                  onChange={(v) => updateParam("maintMargin", v)}
                  min={0}
                  step={0.01}
                  placeholder="e.g. 0.5"
                />
              </Field>
              <Field
                inputAlign
                label="Funding"
                unit="% / 8h, signed"
                hint="Negative = receive funding"
              >
                <NumberInput
                  value={params.fundRate}
                  onChange={(v) => updateParam("fundRate", v)}
                  step={0.001}
                  placeholder="e.g. 0.01"
                />
              </Field>
            </div>
          </SectionCard>
        ) : null}
      </div>

      <div className="flex justify-end pt-2">
        <AppButton type="button" variant="default" size="sm" onClick={handleRun} disabled={running}>
          {running ? "Running..." : "Run Mini Backtest"}
        </AppButton>
      </div>
    </AppDialog>
  );
});

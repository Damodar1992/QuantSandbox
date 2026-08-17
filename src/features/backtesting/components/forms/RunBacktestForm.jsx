import React, { memo, useEffect, useMemo, useState } from "react";
import { cx, ui } from "@/constants/ui";
import { AppButton } from "@/components/common/AppButton";
import { AppInput } from "@/components/common/AppInput";
import { AppSelect } from "@/components/common/AppSelect";
import { DateRangePicker } from "@/components/common/DateRangePicker";
import {
  BT_EXCHANGES,
  BT_LEVERAGE_RANGE,
  BT_PAIR_OPTIONS,
  BT_RUN_BACKTEST_TOOLTIPS,
  BT_STAKE_MODES,
  BT_TIMEFRAMES,
  BT_TRADING_MODES,
  resolveBtFees,
} from "@/constants/backtesting";
import { diffAgainstMini } from "../../utils/miniSource";
import { BtValueTooltip } from "../BtInfoTooltip";
import { InheritanceBar } from "./InheritanceBar";
import { BT_FORM_CONTROL } from "./formControl";

const LABEL_DOTTED =
  "underline decoration-dotted underline-offset-2 decoration-[#6e6682]";

const NO_MINI = "__no_mini__";
const CONTROL = BT_FORM_CONTROL;

export const RUN_BACKTEST_FIELD_LABELS = {
  periodFrom: "Period (from)",
  periodTo: "Period (to)",
  pair: "Trading pair",
  timeframe: "Timeframe",
  exchange: "Exchange",
  mode: "Mode",
  leverage: "Leverage",
  startingCapital: "Starting capital",
  stakeMode: "Stake mode",
  stakeValue: "Stake value",
  profitReserving: "Profit Reserving",
};

/** Edits that break the reproduction premise entirely. */
const CRITICAL_FIELDS = new Set([
  "pair",
  "timeframe",
  "exchange",
  "mode",
  "leverage",
  "stakeMode",
  "profitReserving",
]);

const EMPTY_PARAMS = {
  periodFrom: "",
  periodTo: "",
  pair: "",
  timeframe: "",
  exchange: "",
  mode: "",
  leverage: 1,
  startingCapital: "",
  stakeMode: "fixed",
  stakeValue: "",
  profitReserving: "",
};

function Field({ label, hint, children, className }) {
  return (
    <div className={cx("space-y-1", className)}>
      {label ? (
        typeof label === "string" ? (
          <label className={cx("block text-[11px]", ui.textMuted)}>{label}</label>
        ) : (
          <div className={cx("flex flex-wrap items-center gap-1.5 text-[11px]", ui.textMuted)}>{label}</div>
        )
      ) : null}
      {children}
      {hint ? <div className={cx("text-[10px]", ui.textSubtle)}>{hint}</div> : null}
    </div>
  );
}

/**
 * Shared Run Backtest body — used inline in Stage 5 section 1 and inside the modal wrapper.
 *
 * @param {object} props
 * @param {boolean} [props.active=true] — when false, form resets on next activation (modal open / epoch change)
 * @param {boolean} [props.showCancel=false]
 * @param {string} [props.submitLabel="▶ Run Backtest"]
 * @param {"modal"|"inline"} [props.variant="inline"]
 */
export const RunBacktestForm = memo(function RunBacktestForm({
  epoch,
  strategyName: _strategyName,
  miniOptions = [],
  active = true,
  showCancel = false,
  submitLabel = "▶ Run Backtest",
  variant = "inline",
  onCancel,
  onSubmit,
  onRunMiniBacktest,
}) {
  const [miniId, setMiniId] = useState(NO_MINI);
  const [editing, setEditing] = useState(false);
  const [params, setParams] = useState(EMPTY_PARAMS);

  const mini = useMemo(
    () => miniOptions.find((m) => m.id === miniId) || null,
    [miniOptions, miniId],
  );

  const resetKey = `${active ? "1" : "0"}:${epoch?.id || ""}`;

  useEffect(() => {
    if (!active) return;
    setMiniId(NO_MINI);
    setEditing(false);
    setParams(EMPTY_PARAMS);
  }, [resetKey, active]);

  const applyMini = (nextId) => {
    setMiniId(nextId);
    setEditing(false);
    const next = miniOptions.find((m) => m.id === nextId);
    setParams(next ? { ...EMPTY_PARAMS, ...next.params } : EMPTY_PARAMS);
  };

  const patch = (key, value) => {
    setParams((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "mode" && value === "spot") next.leverage = 1;
      if (key === "stakeMode") next.stakeValue = "";
      return next;
    });
  };

  const editedFields = useMemo(
    () => (mini ? diffAgainstMini(params, mini.params) : []),
    [mini, params],
  );

  const mode = !mini ? "standalone" : editedFields.length > 0 ? "edited" : "ok";
  const readOnly = Boolean(mini) && !editing;

  const derivedFees = useMemo(
    () => (params.exchange && params.mode ? resolveBtFees(params.exchange, params.mode) : null),
    [params.exchange, params.mode],
  );

  const feesHeadline = useMemo(() => {
    if (!params.exchange || !params.mode) return null;
    const exchange =
      BT_EXCHANGES.find((e) => e.value === params.exchange)?.label || params.exchange;
    const mode =
      BT_TRADING_MODES.find((m) => m.value === params.mode)?.label || params.mode;
    const modeLabel = String(mode).charAt(0).toUpperCase() + String(mode).slice(1);
    return `${exchange} ${modeLabel}`;
  }, [params.exchange, params.mode]);

  const missing = useMemo(() => {
    const required = [
      ["periodFrom", "period"],
      ["periodTo", "period"],
      ["pair", "trading pair"],
      ["timeframe", "timeframe"],
      ["exchange", "exchange"],
      ["mode", "mode"],
      ["startingCapital", "starting capital"],
      ["stakeValue", "stake value"],
    ];
    const out = [];
    required.forEach(([key, label]) => {
      const value = params[key];
      if (value === "" || value === null || value === undefined) {
        if (!out.includes(label)) out.push(label);
      }
    });
    return out;
  }, [params]);

  const canRun = missing.length === 0;

  const handleSubmit = () => {
    if (!canRun) return;
    const payload = {
      periodFrom: params.periodFrom,
      periodTo: params.periodTo,
      pair: params.pair,
      timeframe: params.timeframe,
      exchange: params.exchange,
      mode: params.mode,
      leverage: params.mode === "spot" ? 1 : Number(params.leverage) || 1,
      startingCapital: Number(params.startingCapital) || 0,
      stakeMode: params.stakeMode,
      stakeValue: Number(params.stakeValue) || 0,
      profitReserving:
        params.profitReserving === "" || params.profitReserving === null
          ? null
          : Number(params.profitReserving),
      editedFields,
    };
    onSubmit?.({ params: payload, mini });
  };

  const subheading =
    mode === "standalone"
      ? "— entered by hand, no mini to inherit from"
      : editing
        ? "— edited by the quant, no longer a copy of the mini"
        : "— inherited from the mini";

  return (
    <div className="space-y-4">
      <section className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-[12px] font-medium text-[#faf7fd]">
            {variant === "inline" ? "Run backtest · Pick the mini-backtest" : "1 · Pick the mini-backtest"}
          </div>
          {onRunMiniBacktest ? (
            <AppButton
              type="button"
              variant="outline"
              size="sm"
              disabled={!epoch?.id}
              title={epoch?.id ? "Configure and run a mini-backtest for the selected epoch" : "Select an epoch first"}
              onClick={() => onRunMiniBacktest(epoch)}
            >
              Run minibacktest
            </AppButton>
          ) : null}
        </div>
        <AppSelect
          label="Mini-backtest · optional"
          value={miniId}
          onValueChange={applyMini}
          options={[
            { value: NO_MINI, label: "— no mini-backtest —" },
            ...miniOptions.map((m) => ({ value: m.id, label: m.label })),
          ]}
          triggerClassName={CONTROL}
        />
        <div className={cx("text-[10px]", ui.textSubtle)}>
          Picking a mini reproduces it one to one and unlocks the Δ comparison. Without a mini the
          run is standalone: parameters by hand, no comparison.
        </div>
        {miniOptions.length === 0 ? (
          <div className={cx("text-[10px]", "text-amber-300")}>
            This epoch has no finished mini-backtest — only a standalone run is possible.
          </div>
        ) : null}
      </section>

      <InheritanceBar
        state={mode}
        miniName={mini?.name}
        manualFees={mini?.manualFees}
        derivedFees={mini?.derivedFees}
        editedLabels={editedFields.map((f) => RUN_BACKTEST_FIELD_LABELS[f] || f)}
        criticalEdits={editedFields
          .filter((f) => CRITICAL_FIELDS.has(f))
          .map((f) => RUN_BACKTEST_FIELD_LABELS[f] || f)}
        epochNumber={epoch?.epochNumber}
      />

      <section className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-[12px] font-medium text-[#faf7fd]">
            {variant === "inline" ? "Run parameters" : "2 · Run parameters"}{" "}
            <span className={cx("font-normal", ui.textSubtle)}>{subheading}</span>
          </div>
          {mini ? (
            <div className="flex items-center gap-1.5">
              {editing ? (
                <>
                  <AppButton type="button" variant="outline" size="xs" onClick={() => setEditing(false)}>
                    ✓ Done editing
                  </AppButton>
                  <AppButton
                    type="button"
                    variant="outline"
                    size="xs"
                    onClick={() => setParams({ ...EMPTY_PARAMS, ...mini.params })}
                  >
                    ↺ Reset to mini
                  </AppButton>
                </>
              ) : (
                <AppButton type="button" variant="outline" size="xs" onClick={() => setEditing(true)}>
                  ✎ Edit parameters
                </AppButton>
              )}
            </div>
          ) : null}
        </div>

        <div className="space-y-3">
          {/* MARKET SETUP */}
          <div className={cx(ui.radius, ui.panelMuted, "space-y-3 p-3")}>
            <div className="text-[10px] font-semibold uppercase tracking-wide text-[#9b8ec4]">
              Market setup
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <Field label="Exchange">
                <AppSelect
                  value={params.exchange}
                  onValueChange={(v) => patch("exchange", v)}
                  options={BT_EXCHANGES}
                  disabled={readOnly}
                  placeholder="Select exchange…"
                  triggerClassName={CONTROL}
                />
              </Field>

              <Field label="Trading Mode">
                <AppSelect
                  value={params.mode}
                  onValueChange={(v) => patch("mode", v)}
                  options={BT_TRADING_MODES}
                  disabled={readOnly}
                  placeholder="spot / futures"
                  triggerClassName={CONTROL}
                />
              </Field>

              <Field label="Pair">
                <AppSelect
                  value={params.pair}
                  onValueChange={(v) => patch("pair", v)}
                  options={BT_PAIR_OPTIONS.map((p) => ({ value: p, label: p }))}
                  disabled={readOnly}
                  placeholder="Select pair…"
                  triggerClassName={CONTROL}
                />
              </Field>

              <Field label="Timeframe">
                <AppSelect
                  value={params.timeframe}
                  onValueChange={(v) => patch("timeframe", v)}
                  options={BT_TIMEFRAMES.map((t) => ({ value: t, label: t }))}
                  disabled={readOnly}
                  placeholder="Select timeframe…"
                  triggerClassName={CONTROL}
                />
              </Field>

              <Field label="Time Range">
                <DateRangePicker
                  label={null}
                  from={params.periodFrom}
                  to={params.periodTo}
                  disabled={readOnly}
                  onChange={({ from, to }) => {
                    setParams((prev) => ({ ...prev, periodFrom: from || "", periodTo: to || "" }));
                  }}
                  className="space-y-0"
                  triggerClassName={CONTROL}
                />
              </Field>

              <Field label="Leverage">
                <AppInput
                  type="number"
                  min={BT_LEVERAGE_RANGE.min}
                  max={BT_LEVERAGE_RANGE.max}
                  value={params.leverage}
                  disabled={readOnly || params.mode === "spot"}
                  onChange={(e) => patch("leverage", e.target.value)}
                  className={CONTROL}
                  wrapperClassName="space-y-0"
                />
              </Field>
            </div>
          </div>

          {/* CAPITAL & POSITION */}
          <div className={cx(ui.radius, ui.panelMuted, "space-y-3 p-3")}>
            <div className="text-[10px] font-semibold uppercase tracking-wide text-[#9b8ec4]">
              Capital & position
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <Field label="Starting Capital">
                <AppInput
                  type="number"
                  min={0}
                  value={params.startingCapital}
                  disabled={readOnly}
                  onChange={(e) => patch("startingCapital", e.target.value)}
                  className={CONTROL}
                  wrapperClassName="space-y-0"
                />
              </Field>

              <Field label="Stake Mode">
                <AppSelect
                  value={params.stakeMode}
                  onValueChange={(v) => patch("stakeMode", v)}
                  options={BT_STAKE_MODES}
                  disabled={readOnly}
                  triggerClassName={CONTROL}
                />
              </Field>

              <Field label="Stake Value">
                <AppInput
                  type="number"
                  min={0}
                  value={params.stakeValue}
                  disabled={readOnly}
                  onChange={(e) => patch("stakeValue", e.target.value)}
                  placeholder={params.stakeMode === "relative" ? "%" : "USDT"}
                  className={CONTROL}
                  wrapperClassName="space-y-0"
                  aria-label={params.stakeMode === "relative" ? "% of balance" : "USDT per trade"}
                />
              </Field>

              <Field
                label={
                  <BtValueTooltip text={BT_RUN_BACKTEST_TOOLTIPS.profitReserving.text}>
                    <span className={LABEL_DOTTED}>Profit Reserving</span>
                  </BtValueTooltip>
                }
              >
                <AppInput
                  type="number"
                  min={0}
                  max={100}
                  value={params.profitReserving ?? ""}
                  disabled={readOnly}
                  onChange={(e) => patch("profitReserving", e.target.value)}
                  className={CONTROL}
                  wrapperClassName="space-y-0"
                />
              </Field>
            </div>
          </div>

          {/* FEES */}
          <div className={cx(ui.radius, ui.panelMuted, "space-y-2 p-3")}>
            <div className="text-[10px] font-semibold uppercase tracking-wide text-[#9b8ec4]">
              <BtValueTooltip text={BT_RUN_BACKTEST_TOOLTIPS.fees.text}>
                <span className={LABEL_DOTTED}>Fees</span>
              </BtValueTooltip>
            </div>
            {derivedFees ? (
              <>
                <div className="text-[12px] font-medium text-[#faf7fd]">
                  {feesHeadline} · Maker {derivedFees.maker}% · Taker {derivedFees.taker}%
                  {derivedFees.funding ? " · funding" : ""}
                </div>
                <div className={cx("text-[10px]", ui.textSubtle)}>
                  Calculated automatically from exchange and trading mode
                </div>
              </>
            ) : (
              <div className={cx("text-[12px]", ui.textSubtle)}>
                Select exchange and trading mode to see derived fees
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <div className={cx("text-[10px]", canRun ? ui.textSubtle : "text-amber-300")}>
          {canRun
            ? `Runs on ${params.periodFrom} → ${params.periodTo} with the parameters above.`
            : `Fill in: ${missing.join(", ")}`}
        </div>
        <div className="flex gap-2">
          {showCancel ? (
            <AppButton type="button" variant="outline" size="sm" onClick={onCancel}>
              Cancel
            </AppButton>
          ) : null}
          <AppButton type="button" variant="default" size="sm" disabled={!canRun} onClick={handleSubmit}>
            {submitLabel}
          </AppButton>
        </div>
      </div>
    </div>
  );
});

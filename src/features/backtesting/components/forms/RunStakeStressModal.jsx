import React, { memo, useEffect, useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
import { cx, ui } from "@/constants/ui";
import { AppButton } from "@/components/common/AppButton";
import { AppDialog } from "@/components/common/AppDialog";
import { AppInput } from "@/components/common/AppInput";
import { AppSelect } from "@/components/common/AppSelect";
import { defaultValueForMode, readParentStake } from "../../utils/stakeStress";
import { BT_FORM_CONTROL } from "./formControl";

const MODE_OPTIONS = [
  { value: "fixed", label: "Fixed USDT" },
  { value: "percent", label: "Percent of balance" },
];

function money(value) {
  return Number(value || 0).toLocaleString("en-US", { maximumFractionDigits: 2 });
}

export function stakeText(mode, value) {
  const n = Number(value);
  if (!(n > 0)) return "—";
  return mode === "percent" ? `${n}%` : `${money(n)} USDT`;
}

export const StakeStressFields = memo(function StakeStressFields({
  parentRun,
  mode,
  value,
  onMode,
  onValue,
  readOnly = false,
  compact = false,
}) {
  const info = useMemo(() => readParentStake(parentRun || {}), [parentRun]);
  const reserve = info.reservePct > 0 ? `${info.reservePct}%` : "Off";
  const backtestStake = info.mode === "percent" ? `${info.value}% of balance` : `${money(info.value)} USDT`;

  return (
    <div className={compact ? "space-y-2" : "space-y-4"}>
      {compact ? null : (
        <p className={cx("text-[12px]", ui.textSubtle)}>
          {info.id} · {info.trades} trades · {info.pair} · {info.timeframe || "—"}
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-[180px_1fr]">
        <AppSelect
          label="Stake mode"
          aria-label="Stake mode"
          value={mode}
          onValueChange={onMode}
          options={MODE_OPTIONS}
          disabled={readOnly}
          triggerClassName={BT_FORM_CONTROL}
        />
        <AppInput
          type="number"
          min="0.01"
          max={mode === "percent" ? "99" : undefined}
          step="0.01"
          label={mode === "percent" ? "Stake (% of free balance)" : "Stake (USDT)"}
          value={value}
          disabled={readOnly}
          onChange={(e) => onValue?.(e.target.value)}
        />
      </div>

      {compact ? null : (
      <dl className="grid grid-cols-3 gap-3 rounded-lg border border-[rgba(60,40,80,0.35)] bg-[#120b20] px-3 py-2 text-[11px]">
        <div>
          <dt className={ui.textSubtle}>Start balance</dt>
          <dd className="mt-0.5 text-[#faf7fd]">{money(info.capital)} USDT</dd>
        </div>
        <div>
          <dt className={ui.textSubtle}>Backtest stake</dt>
          <dd className="mt-0.5 text-[#faf7fd]">{backtestStake}</dd>
        </div>
        <div>
          <dt className={ui.textSubtle}>Profit reserve</dt>
          <dd className="mt-0.5 text-[#faf7fd]">{reserve}</dd>
        </div>
      </dl>
      )}
    </div>
  );
});

function rowFromConfig(key, mode, value) {
  return {
    key,
    mode: mode === "percent" ? "percent" : "fixed",
    value: String(value ?? ""),
  };
}

function stakeRowsOf(parentRun, snapshotRun) {
  const key = snapshotRun?.batchId || snapshotRun?.id;
  const all = parentRun?.stressRuns || [];
  const matched = key ? all.filter((run) => (run.batchId || run.id) === key) : [];
  const source = (matched.length ? matched : snapshotRun ? [snapshotRun] : [])
    .slice()
    .sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)) || String(a.id).localeCompare(String(b.id)));
  return source.map((run) => rowFromConfig(run.id, run.config?.mode, run.config?.value));
}

export const RunStakeStressModal = memo(function RunStakeStressModal({
  open,
  parentRun,
  snapshotRun = null,
  readOnly = false,
  onClose,
  onSubmit,
}) {
  const info = useMemo(() => readParentStake(parentRun || {}), [parentRun]);
  const batchSignature = readOnly ? stakeRowsOf(parentRun, snapshotRun).map((row) => `${row.key}:${row.mode}:${row.value}`).join("|") : "";
  const [rows, setRows] = useState(() => [rowFromConfig("stake-1", "fixed", "")]);
  const [nextKey, setNextKey] = useState(2);

  useEffect(() => {
    if (!open) return;
    if (readOnly) {
      const listed = stakeRowsOf(parentRun, snapshotRun);
      setRows(listed.length ? listed : [rowFromConfig("stake-1", info.mode, info.value)]);
      return;
    }
    setRows([rowFromConfig("stake-1", info.mode, info.value)]);
    setNextKey(2);
  }, [open, readOnly, batchSignature, info.mode, info.value, parentRun, snapshotRun]);

  const canRun = rows.length > 0 && rows.every((row) => {
    const n = Number(row.value);
    return n > 0 && (row.mode !== "percent" || n < 100);
  });

  const changeMode = (key, next) => {
    setRows((prev) => prev.map((row) => (
      row.key === key
        ? { ...row, mode: next, value: readOnly ? row.value : String(defaultValueForMode(info, next)) }
        : row
    )));
  };

  const addRow = () => {
    const mode = info.mode === "percent" ? "percent" : "fixed";
    setRows((prev) => [...prev, rowFromConfig(`stake-${nextKey}`, mode, defaultValueForMode(info, mode))]);
    setNextKey((n) => n + 1);
  };

  const reserve = info.reservePct > 0 ? `${info.reservePct}%` : "Off";
  const backtestStake = info.mode === "percent" ? `${info.value}% of balance` : `${money(info.value)} USDT`;

  return (
    <AppDialog
      open={open}
      onOpenChange={(next) => { if (!next) onClose?.(); }}
      title={readOnly ? "Stake stress-test parameters" : "Run Stake Stress-Test"}
      description={readOnly
        ? "Stakes in this stress-test. Prices and dates stayed on the backtest."
        : "Each row is one stake. Prices and dates stay on the backtest. One click runs the whole list."}
      className="max-w-[640px]"
    >
      <p className={cx("text-[12px]", ui.textSubtle)}>
        {info.id} · {info.trades} trades · {info.pair} · {info.timeframe || "—"}
      </p>
      <dl className="grid grid-cols-3 gap-3 rounded-lg border border-[rgba(60,40,80,0.35)] bg-[#120b20] px-3 py-2 text-[11px]">
        <div>
          <dt className={ui.textSubtle}>Start balance</dt>
          <dd className="mt-0.5 text-[#faf7fd]">{money(info.capital)} USDT</dd>
        </div>
        <div>
          <dt className={ui.textSubtle}>Backtest stake</dt>
          <dd className="mt-0.5 text-[#faf7fd]">{backtestStake}</dd>
        </div>
        <div>
          <dt className={ui.textSubtle}>Profit reserve</dt>
          <dd className="mt-0.5 text-[#faf7fd]">{reserve}</dd>
        </div>
      </dl>

      <div className="overflow-x-auto rounded-lg border border-[rgba(60,40,80,0.35)]">
        <table className="w-full border-collapse text-[11px]">
          <thead className="bg-[#19102b] text-[#8c8c8c]">
            <tr>
              <th className="px-3 py-1.5 text-left font-medium">Run</th>
              <th className="px-3 py-1.5 text-left font-medium">Stake mode</th>
              <th className="px-3 py-1.5 text-left font-medium">Stake</th>
              {readOnly ? null : <th className="w-16 px-3 py-1.5 text-left font-medium">Delete</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={row.key} className="border-t border-[rgba(60,40,80,0.22)]">
                <td className="whitespace-nowrap px-3 py-2 font-medium text-[#faf7fd]">Run {index + 1}</td>
                <td className="px-3 py-2">
                  <AppSelect
                    aria-label={`Stake mode for run ${index + 1}`}
                    value={row.mode}
                    onValueChange={(next) => changeMode(row.key, next)}
                    options={MODE_OPTIONS}
                    disabled={readOnly}
                    triggerClassName={BT_FORM_CONTROL}
                  />
                </td>
                <td className="px-3 py-2">
                  <AppInput
                    type="number"
                    min="0.01"
                    max={row.mode === "percent" ? "99" : undefined}
                    step="0.01"
                    aria-label={`Stake for run ${index + 1}`}
                    placeholder={row.mode === "percent" ? "%" : "USDT"}
                    value={row.value}
                    disabled={readOnly}
                    className={BT_FORM_CONTROL}
                    onChange={(e) => setRows((prev) => prev.map((item) => item.key === row.key ? { ...item, value: e.target.value } : item))}
                  />
                </td>
                {readOnly ? null : (
                  <td className="px-3 py-2">
                    <AppButton
                      type="button"
                      variant="outline"
                      size="icon-xs"
                      title="Delete run"
                      aria-label={`Delete run ${index + 1}`}
                      disabled={rows.length < 2}
                      onClick={() => setRows((prev) => prev.filter((item) => item.key !== row.key))}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </AppButton>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {readOnly ? null : (
        <AppButton type="button" variant="outline" size="sm" onClick={addRow}>
          Add run
        </AppButton>
      )}

      <div className="flex items-center justify-between gap-2 pt-2">
        <p className={cx("text-[10px]", ui.textSubtle)}>
          {readOnly
            ? `${rows.length} ${rows.length === 1 ? "stake" : "stakes"}`
            : `${rows.length} ${rows.length === 1 ? "run" : "runs"} · ${info.trades} trades · the result opens in this window`}
        </p>
        <div className="flex gap-2">
          <AppButton type="button" variant="outline" size="sm" onClick={onClose}>
            {readOnly ? "Close" : "Cancel"}
          </AppButton>
          {readOnly ? null : (
            <AppButton
              type="button"
              variant="default"
              size="sm"
              disabled={!canRun}
              onClick={() => onSubmit?.(rows.map((row) => ({ mode: row.mode, value: Number(row.value) })))}
            >
              Run Stress-Test
            </AppButton>
          )}
        </div>
      </div>
    </AppDialog>
  );
});

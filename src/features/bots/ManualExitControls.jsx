import React, { useState } from "react";
import { AppButton } from "@/components/common/AppButton";
import { AppInput } from "@/components/common/AppInput";
import { AppSelect } from "@/components/common/AppSelect";

const ACTION_OPTIONS = [
  { value: "market", label: "Force exit market" },
  { value: "limit", label: "Exit limit" },
  { value: "partial", label: "Exit partial" },
];

/** Preview-only command form. The mock store records intent and never sends an exchange order. */
export function ManualExitControls({
  position,
  onSubmit,
  onCancel,
  hideTitle = false,
  lockedAction = null,
  initialAction = "market",
}) {
  const [action, setAction] = useState(lockedAction || initialAction);
  const [limitPrice, setLimitPrice] = useState("");
  const [partialPct, setPartialPct] = useState("");
  const [error, setError] = useState("");
  const effectiveAction = lockedAction || action;

  const submit = () => {
    const result = onSubmit?.({
      positionId: position.id,
      action: effectiveAction,
      limitPrice,
      partialPct,
    });
    if (result) setError(result);
    else onCancel?.();
  };

  return (
    <div className="space-y-4 text-[12px]">
      {hideTitle ? null : (
        <p className="font-medium text-[#faf7fd]">Manual exit · {position.id}</p>
      )}

      {!lockedAction ? (
        <AppSelect
          label="Action"
          aria-label="Action"
          value={action}
          onValueChange={(value) => {
            setAction(value);
            setError("");
          }}
          options={ACTION_OPTIONS}
        />
      ) : null}

      {effectiveAction === "market" ? (
        <p className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-amber-200">
          Record a Force exit market preview for {position.id} ({position.pair})? No exchange order
          will be sent.
        </p>
      ) : null}

      {effectiveAction === "limit" ? (
        <AppInput
          type="number"
          min="0.01"
          step="0.01"
          label="Limit price (USDT)"
          aria-label="Limit price (USDT)"
          placeholder="Limit price"
          value={limitPrice}
          onChange={(event) => setLimitPrice(event.target.value)}
        />
      ) : null}

      {effectiveAction === "partial" ? (
        <AppInput
          type="number"
          min="0.01"
          max="99.99"
          step="0.01"
          label="Portion to exit (%)"
          aria-label="Portion to exit (%)"
          placeholder="Exit %"
          value={partialPct}
          onChange={(event) => setPartialPct(event.target.value)}
        />
      ) : null}

      <p className="text-[11px] text-muted-foreground">Preview only. No exchange order is sent.</p>
      {error ? (
        <p role="alert" className="text-red-400">
          {error}
        </p>
      ) : null}

      <div className="flex justify-end gap-2">
        <AppButton onClick={onCancel}>Cancel</AppButton>
        <AppButton
          variant={effectiveAction === "market" ? "destructive" : "default"}
          onClick={submit}
        >
          Record preview
        </AppButton>
      </div>
    </div>
  );
}

import React, { useState } from "react";
import { AppButton } from "@/components/common/AppButton";
import { AppInput } from "@/components/common/AppInput";
import { AppSelect } from "@/components/common/AppSelect";

/** Preview-only command form. The mock store records intent and never sends an exchange order. */
export function ManualExitControls({ position, onSubmit, onCancel, hideTitle = false }) {
  const [action, setAction] = useState("market");
  const [limitPrice, setLimitPrice] = useState("");
  const [partialPct, setPartialPct] = useState("");
  const [error, setError] = useState("");
  return (
    <div className="space-y-1 text-[11px]">
      <div className="flex flex-wrap items-center gap-2">
        {hideTitle ? null : <span className="font-medium whitespace-nowrap">Manual exit · {position.id}</span>}
        <AppSelect
          aria-label="Action"
          value={action}
          onValueChange={(value) => { setAction(value); setError(""); }}
          options={[{ value: "market", label: "Force exit market" }, { value: "limit", label: "Force exit limit" }, { value: "partial", label: "Force exit partial" }]}
          className="w-[168px]"
          triggerClassName="h-7"
        />
        {action === "limit" ? (
          <AppInput
            type="number"
            min="0.01"
            step="0.01"
            aria-label="Limit price (USDT)"
            placeholder="Limit price"
            value={limitPrice}
            onChange={(event) => setLimitPrice(event.target.value)}
            wrapperClassName="w-[112px]"
            className="h-7 px-2 text-[11px]"
          />
        ) : null}
        {action === "partial" ? (
          <AppInput
            type="number"
            min="0.01"
            max="99.99"
            step="0.01"
            aria-label="Portion to exit (%)"
            placeholder="Exit %"
            value={partialPct}
            onChange={(event) => setPartialPct(event.target.value)}
            wrapperClassName="w-[88px]"
            className="h-7 px-2 text-[11px]"
          />
        ) : null}
        <div className="ml-auto flex items-center gap-2">
          <AppButton onClick={onCancel}>Cancel</AppButton>
          <AppButton variant="default" onClick={() => { const result = onSubmit?.({ positionId: position.id, action, limitPrice, partialPct }); if (result) setError(result); else onCancel?.(); }}>Record preview</AppButton>
        </div>
      </div>
      <p className="text-muted-foreground">Preview only. No exchange order is sent.</p>
      {error ? <p role="alert" className="text-red-400">{error}</p> : null}
    </div>
  );
}

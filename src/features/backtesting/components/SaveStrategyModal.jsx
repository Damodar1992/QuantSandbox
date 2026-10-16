import React, { useEffect, useState } from "react";
import { AppButton } from "@/components/common/AppButton";
import { AppDialog } from "@/components/common/AppDialog";
import { AppInput } from "@/components/common/AppInput";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export function SaveStrategyModal({ open, run, blueprintName, onClose, onSave }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setName(`${blueprintName || "Strategy"} · ${run?.epochLabel?.split(" · ")[0] || "Stage 5"}`);
    setDescription("");
    setError("");
  }, [open, blueprintName, run?.id, run?.epochLabel]);

  const handleSave = () => {
    if (!name.trim()) {
      setError("Enter a strategy name.");
      return;
    }
    onSave?.({ name: name.trim(), description: description.trim() });
  };

  const p = run?.params || {};
  const core = run?.result?.core || {};
  return (
    <AppDialog open={open} onOpenChange={(next) => !next && onClose?.()} title="Save strategy"
      description={run ? `Backtest ${run.id} · ${run.epochLabel || "Selected epoch"}` : ""}
      className="max-w-[620px]">
      <div className="space-y-4 text-xs">
        <div className="rounded-md border border-border bg-muted/30 p-3">
          <div className="font-medium text-foreground">Source backtest · Success</div>
          <div className="mt-2 grid grid-cols-2 gap-x-5 gap-y-2 text-muted-foreground sm:grid-cols-3">
            <span>Blueprint<br /><strong className="text-foreground">{blueprintName}</strong></span>
            <span>Exchange<br /><strong className="text-foreground">{p.exchange || "—"}</strong></span>
            <span>Pair / timeframe<br /><strong className="text-foreground">{p.pair || "—"} · {p.timeframe || "—"}</strong></span>
            <span>Market / leverage<br /><strong className="text-foreground">{p.mode || "—"} · {p.leverage ?? 1}×</strong></span>
            <span>Starting capital<br /><strong className="text-foreground">{Number(p.startingCapital || 0).toLocaleString("en-US")} USDT</strong></span>
            <span>ROI / Max DD<br /><strong className="text-foreground">{core.roi ?? "—"}% / {core.maxdd ?? "—"}%</strong></span>
          </div>
          <p className="mt-3 text-muted-foreground">Stage 1–4 parameters, selected epoch and trading settings are saved unchanged.</p>
        </div>
        <AppInput label="Strategy name" value={name} onChange={(event) => setName(event.target.value)} />
        <div className="space-y-1">
          <Label htmlFor="save-strategy-description">Description · optional</Label>
          <Textarea id="save-strategy-description" value={description} onChange={(event) => setDescription(event.target.value)} />
        </div>
        {error && <p role="alert" className="text-red-400">{error}</p>}
        <div className="flex justify-end gap-2">
          <AppButton onClick={onClose}>Cancel</AppButton>
          <AppButton variant="default" onClick={handleSave}>Save strategy</AppButton>
        </div>
      </div>
    </AppDialog>
  );
}

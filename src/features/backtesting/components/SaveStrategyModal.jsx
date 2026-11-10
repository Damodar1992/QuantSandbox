import React, { useEffect, useState } from "react";
import { AppButton } from "@/components/common/AppButton";
import { AppDialog } from "@/components/common/AppDialog";
import { AppInput } from "@/components/common/AppInput";
import { AppSelect } from "@/components/common/AppSelect";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { BtInfoTooltip } from "./BtInfoTooltip";
import { BT_EXCHANGES, BT_PAIR_OPTIONS, BT_TIMEFRAMES, BT_TRADING_MODES, BT_STAKE_MODES } from "@/constants/backtesting";

const emptyEpochParams = { exchange: "", mode: "spot", pair: "", timeframe: "", leverage: 1, stakeMode: "fixed", stakeValue: "", profitReserving: "" };

export function SaveStrategyModal({ open, run, epoch, blueprintName, versionLineage, onClose, onSave }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [params, setParams] = useState(emptyEpochParams);
  const [error, setError] = useState("");
  const fromRun = Boolean(run);
  const p = fromRun ? run.params || {} : params;
  const core = run?.result?.core || {};

  useEffect(() => {
    if (!open) return;
    setName(`${blueprintName || "Strategy"} · ${(run?.epochLabel || epoch?.label || "Selected epoch").split(" · ")[0]}`);
    setDescription("");
    setParams(emptyEpochParams);
    setError("");
  }, [open, blueprintName, run?.id, run?.epochLabel, epoch?.id, epoch?.label]);

  const patch = (key, value) => { setParams((prev) => ({ ...prev, [key]: value })); setError(""); };
  const handleSave = () => {
    if (!name.trim()) return setError("Enter a strategy name.");
    if (!fromRun) {
      if (!epoch) return setError("Select a favorite epoch first.");
      if (!p.exchange || !p.pair || !p.timeframe) return setError("Select exchange, pair and timeframe.");
      const stake = Number(p.stakeValue);
      if (!(stake > 0) || p.stakeMode === "relative" && stake > 100) return setError("Enter a valid Stake value.");
      if (p.mode === "futures" && !(Number(p.leverage) >= 1)) return setError("Enter valid Futures leverage.");
      if (p.profitReserving !== "" && !(Number(p.profitReserving) >= 0 && Number(p.profitReserving) <= 100)) return setError("Profit Reserving must be between 0 and 100%.");
    }
    onSave?.({ name: name.trim(), description: description.trim(), params: fromRun ? null : { ...p, leverage: p.mode === "spot" ? 1 : Number(p.leverage), stakeValue: Number(p.stakeValue), profitReserving: p.profitReserving === "" ? null : Number(p.profitReserving), startingCapital: null, periodFrom: null, periodTo: null } });
  };

  return <AppDialog open={open} onOpenChange={(next) => !next && onClose?.()} title={fromRun ? "Save strategy from backtest" : "Compile strategy from epoch"} description={fromRun ? `Backtest ${run.id} · ${run.epochLabel || "Selected epoch"}` : epoch?.label || "Selected Stage 5 epoch"} className="max-w-[680px]">
    <div className="max-h-[75vh] space-y-4 overflow-y-auto pr-1 text-xs">
      <div className="rounded-md border border-border bg-muted/30 p-3">
        <div className="font-medium text-foreground">{fromRun ? "Source backtest · Success" : "Source favorite epoch · no backtest results"}</div>
        <div className="mt-2 grid grid-cols-2 gap-x-5 gap-y-2 text-muted-foreground sm:grid-cols-3">
          <span>Blueprint<br /><strong className="text-foreground">{blueprintName || "—"}</strong></span>
          <span>Epoch<br /><strong className="text-foreground">{run?.epochLabel || epoch?.label || "—"}</strong></span>
          <span>Stage 1–4 lineage<br /><strong className="text-foreground">{versionLineage || "Selected source versions"}</strong></span>
          {fromRun ? <>
            <span>Exchange / market<br /><strong className="text-foreground">{p.exchange || "—"} · {p.mode || "—"}</strong></span>
            <span>Pair / timeframe<br /><strong className="text-foreground">{p.pair || "—"} · {p.timeframe || "—"}</strong></span>
            <span>Capital / ROI / Max DD<br /><strong className="text-foreground">{Number(p.startingCapital || 0).toLocaleString("en-US")} USDT · {core.roi ?? "—"}% · {core.maxdd ?? "—"}%</strong></span>
          </> : null}
        </div>
        <p className="mt-3 text-muted-foreground">Code and Stage 1–4 indicator/risk values remain read-only in the selected epoch and saved strategy. This UI previews strategy creation; it does not execute a compiler.</p>
      </div>
      <AppInput label="Strategy name" value={name} onChange={(event) => setName(event.target.value)} />
      <div className="space-y-1"><Label htmlFor="save-strategy-description">Description · optional</Label><Textarea id="save-strategy-description" value={description} onChange={(event) => setDescription(event.target.value)} /></div>
      {!fromRun ? <div className="space-y-3 rounded-md border border-border bg-muted/20 p-3">
        <div className="font-medium text-foreground">Trading configuration <BtInfoTooltip label="Trading configuration" text="Saved as defaults for bots created from this epoch. Code and epoch values remain frozen." /></div>
        <div className="grid gap-3 sm:grid-cols-2">
          <AppSelect label="Exchange" value={p.exchange} onValueChange={(v) => patch("exchange", v)} options={[...BT_EXCHANGES, { value: "bybit", label: "Bybit" }]} />
          <AppSelect label="Market" value={p.mode} onValueChange={(v) => { setParams((prev) => ({ ...prev, mode: v, pair: "" })); setError(""); }} options={BT_TRADING_MODES} />
          <AppSelect label="Trading pair" value={p.pair} onValueChange={(v) => patch("pair", v)} options={BT_PAIR_OPTIONS.map((v) => ({ value: p.mode === "futures" ? `${v}:USDT` : v, label: p.mode === "futures" ? `${v}:USDT` : v }))} />
          <AppSelect label="Timeframe" value={p.timeframe} onValueChange={(v) => patch("timeframe", v)} options={BT_TIMEFRAMES.map((v) => ({ value: v, label: v }))} />
          {p.mode === "futures" ? <AppInput type="number" min="1" step="1" label="Leverage" value={p.leverage} onChange={(e) => patch("leverage", e.target.value)} /> : null}
          <AppSelect label="Stake mode" value={p.stakeMode} onValueChange={(v) => patch("stakeMode", v)} options={BT_STAKE_MODES} />
          <AppInput type="number" min="0.01" step="0.01" label={p.stakeMode === "relative" ? "Stake value (%)" : "Stake value (USDT)"} value={p.stakeValue} onChange={(e) => patch("stakeValue", e.target.value)} />
          <AppInput type="number" min="0" max="100" step="0.1" label="Profit Reserving (%) · optional" value={p.profitReserving} onChange={(e) => patch("profitReserving", e.target.value)} />
          <AppInput label="Maximum open positions" value="1" disabled title="Fixed at one position in this scope" />
        </div>
      </div> : <p className="text-muted-foreground">Exchange, market, pair, timeframe, leverage, Stake and Profit Reserving are inherited from this backtest and cannot be changed here.</p>}
      {error ? <p role="alert" className="text-red-400">{error}</p> : null}
      <div className="flex justify-end gap-2"><AppButton onClick={onClose}>Cancel</AppButton><AppButton variant="default" onClick={handleSave}>{fromRun ? "Save strategy" : "Compile strategy"}</AppButton></div>
    </div>
  </AppDialog>;
}

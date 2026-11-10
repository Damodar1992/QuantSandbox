import React, { useEffect, useMemo, useRef, useState } from "react";
import { AppBadge } from "@/components/common/AppBadge";
import { AppButton } from "@/components/common/AppButton";
import { AppDialog } from "@/components/common/AppDialog";
import { AppInput } from "@/components/common/AppInput";
import { AppSelect } from "@/components/common/AppSelect";
import { EyeIcon } from "@/components/common/Icons";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { CircleStop, Pause, Play, Trash2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { BacktestingInfoModal } from "@/features/backtesting/components/BacktestingInfoModal";
import { BtInfoTooltip } from "@/features/backtesting/components/BtInfoTooltip";
import { BotOverview, BotTrades, BotAlerts, DataState, ModeBadge, RuntimeBadge } from "./BotDetails";
import { BotNotifications } from "./BotNotifications";
import { ManualExitControls } from "./ManualExitControls";
import { date, money, percent, amount, accountName, getBotMetrics, filterAndSortBots, hasNumber, pnlTone } from "./botsDisplay";
import { closedTrades, performanceSummary } from "./botsAnalytics";
import { cx, ui } from "@/constants/ui";
import { StrategyTemplatePreview } from "@/features/builder/components/StrategyTemplatePreview";
import { StageConfigColumns } from "@/features/backtesting/components/EpochContextPanel";
import { countStrategyBots, getCompatibleAccounts } from "./botsModel";

const PANEL = cx(ui.radius, ui.panel, "p-4");
const MUTED = ui.textMuted;
const SUBTLE = ui.textSubtle;

const toOptions = (values, allLabel = "All") => [
  { value: "All", label: allLabel },
  ...values.map((value) => ({ value, label: value })),
];
const unique = (items) => [...new Set(items)].sort();

function PillTabs({ items, value, onChange, className }) {
  return (
    <div
      className={cx(
        "flex flex-wrap items-center gap-2 border-b border-[rgba(60,40,80,0.35)] pb-3",
        className,
      )}
      role="tablist"
    >
      {items.map((item) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.value)}
            className={cx(
              "inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-[12px] font-medium transition-colors",
              active
                ? "border-violet-500/40 bg-violet-500/15 text-violet-200"
                : "border-[rgba(60,40,80,0.35)] text-[#8c8c8c] hover:text-[#d9d9d9]",
            )}
          >
            {item.label}
            {item.count != null ? (
              <span className="tabular-nums text-[10px] opacity-70">{item.count}</span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

function Status({ value }) {
  const variant =
    value === "Active" || value === "Ready" || value === "Running"
      ? "completed"
      : value === "Starting" || value === "Stopping"
        ? "warning"
        : value === "Needs attention" || value === "Launch failed"
          ? "failed"
          : "muted";
  return (
    <AppBadge status={value} variant={variant}>
      {value === "Active" ? "Ready" : value === "Archive" ? "Archived" : value}
    </AppBadge>
  );
}

const RUNTIME_VISIBLE_STATUSES = new Set(["Starting", "Running", "Paused", "Needs attention"]);

function BotStatusCell({ bot }) {
  const snapshotAt = bot.marketSnapshotAt || bot.updatedAt;
  const issue = bot.lastError || bot.lastWarning;
  const label = "w-16 shrink-0 text-[10px] uppercase tracking-wide text-muted-foreground";
  return (
    <div className="space-y-1 text-[11px]">
      <div className="flex items-center gap-2">
        <span className={label}>Bot</span>
        <Status value={bot.status} />
      </div>
      {RUNTIME_VISIBLE_STATUSES.has(bot.status) ? (
        <div className="flex items-center gap-2">
          <span className={label}>Runtime</span>
          <RuntimeBadge bot={bot} />
        </div>
      ) : null}
      <div className="text-muted-foreground">Contact {date(bot.lastHeartbeatAt)}</div>
      <div className="text-muted-foreground">Snapshot {date(snapshotAt)}</div>
      {bot.dataStatus === "stale" ? <div className="text-amber-300">Data is stale</div> : null}
      {issue ? <div className="max-w-52 text-amber-200">{typeof issue === "string" ? issue : issue.message || issue.code}</div> : null}
    </div>
  );
}

function BotRowActions({ bot, onStart, onPause, onResume, onStop, onDelete }) {
  const actions = [];
  if (bot.status === "Ready for start") {
    actions.push({ key: "start", label: "Start bot", hint: "Prepare and manually start this bot", variant: "default", icon: Play, onClick: onStart });
    actions.push({ key: "delete", label: "Delete bot", hint: "Delete this never-started bot", variant: "destructive", icon: Trash2, onClick: onDelete });
  }
  if (bot.status === "Running") {
    actions.push({ key: "pause", label: "Pause bot", hint: "Stop new buying; keep managing open trades", icon: Pause, onClick: onPause });
  }
  if (["Paused", "Stopped"].includes(bot.status)) {
    actions.push({ key: "resume", label: "Resume bot", hint: "Resume buying and handling open trades", icon: Play, onClick: onResume });
  }
  if (["Running", "Paused"].includes(bot.status)) {
    actions.push({ key: "stop", label: "Stop bot", hint: "Stop bot automation; open trades require manual attention", variant: "destructive", icon: CircleStop, onClick: onStop });
  }
  if (!actions.length) return <span className="text-muted-foreground">—</span>;
  return (
    <div className="flex items-center gap-1">
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <Tooltip key={action.key}>
            <TooltipTrigger asChild>
              <AppButton size="icon" variant={action.variant || "outline"} className="h-7 w-7" aria-label={action.label} onClick={action.onClick}>
                <Icon aria-hidden />
              </AppButton>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-[220px] text-left">
              <div className="font-medium text-[#faf7fd]">{action.label}</div>
              <div className="mt-0.5 text-[#a6a6a6]">{action.hint}</div>
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}

function InfoGrid({ rows }) {
  return (
    <dl className="grid grid-cols-[minmax(120px,1fr)_minmax(0,1.3fr)] gap-x-4 gap-y-2 text-[12px]">
      {rows.map(([label, value]) => (
        <React.Fragment key={label}>
          <dt className={MUTED}>{label}</dt>
          <dd className="min-w-0 break-words text-[#faf7fd]">{value ?? "—"}</dd>
        </React.Fragment>
      ))}
    </dl>
  );
}

const SECTION_CARD = cx(ui.radius, "border border-[rgba(60,40,80,0.35)] bg-[#120b20] p-3");

function OverviewSectionCard({ title, rows }) {
  const visibleRows = rows.filter((row) => row && row[1] != null);
  return (
    <div className={cx(SECTION_CARD, "h-fit space-y-2")}>
      <div className="text-[10px] font-semibold uppercase tracking-wide text-[#9b8ec4]">{title}</div>
      <ul className="space-y-2">
        {visibleRows.map(([label, value, help]) => (
          <li key={label} className="flex items-start justify-between gap-3 text-[11px]">
            <span className={cx(MUTED, "flex min-w-0 items-center gap-1 pt-0.5 leading-snug")}>{label}{help ? <BtInfoTooltip label={label} text={help} /> : null}</span>
            <span className="min-w-0 shrink-0 text-right text-[#faf7fd]">{value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function CollapsibleEngineInfo({ bot }) {
  return <Collapsible className={cx(ui.radius, ui.panel, "overflow-hidden")}><CollapsibleTrigger asChild><AppButton variant="ghost" className="h-auto w-full justify-between rounded-none px-4 py-3"><span>Engine information</span><span className="text-muted-foreground">Show details ▾</span></AppButton></CollapsibleTrigger><CollapsibleContent className="border-t border-border p-4"><InfoGrid rows={[["Engine", "Freqtrade"], ["Version", bot.engineVersion || "Not specified"], ["Force entry", bot.forceEntry == null ? "Not specified" : bot.forceEntry ? "Enabled" : "Disabled"], ["Reporting timezone", "UTC"]]} /></CollapsibleContent></Collapsible>;
}

function formatStakeLabel(params) {
  if (params?.stakeValue == null || params?.stakeValue === "") return null;
  const modeLabel = params.stakeMode === "relative" ? "Relative" : "Fixed";
  const value =
    params.stakeMode === "relative"
      ? `${Number(params.stakeValue)}%`
      : `${money(params.stakeValue)} USDT`;
  return `${modeLabel} · ${value}`;
}

function EmptyCell({ columns, children }) {
  return (
    <tr>
      <td colSpan={columns} className="px-4 py-12 text-center text-[12px] text-[#8c8c8c]">
        {children}
      </td>
    </tr>
  );
}

function DataTable({ headers, children, className }) {
  return (
    <div className="overflow-auto">
      <table className={cx("w-full border-collapse text-[12px]", className)}>
        <thead className="bg-[#1f1f1f] text-left text-[12px] text-[#8c8c8c]">
          <tr>
            {headers.map((label, index) => (
              <th
                key={label}
                className={cx(
                  "py-3 font-medium border-b border-[#303030]",
                  index === 0 ? "px-4" : "px-2",
                  ["Bot equity", "Total P&L", "Equity / Balance", "P&L", "Profit reserve"].includes(label) && "text-right",
                  label === "Actions" && "sticky right-0 z-10 bg-[#1f1f1f]",
                )}
              >
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

function FilterBar({ countLabel, children, action }) {
  return (
    <div
      className={cx(
        "space-y-3 px-4 py-3",
        ui.panelMuted,
        "border-0 border-b",
        ui.divider,
      )}
    >
      <div className="flex items-center justify-between gap-3"><div className={cx("text-[12px]", SUBTLE)}>{countLabel}</div>{action}</div>
      <div className="flex flex-wrap items-end gap-2">{children}</div>
    </div>
  );
}

function LaunchModal({ strategy, model, owner, onClose, onLaunched }) {
  const [name, setName] = useState(strategy.name);
  const [mode, setMode] = useState("Dryrun");
  const [capital, setCapital] = useState(String(strategy.params.startingCapital || 1000));
  const [stakeMode, setStakeMode] = useState(strategy.params.stakeMode || "fixed");
  const [stakeValue, setStakeValue] = useState(String(strategy.params.stakeValue || ""));
  const [accountId, setAccountId] = useState("");
  const [check, setCheck] = useState(null);
  const [error, setError] = useState("");
  const accounts = getCompatibleAccounts(strategy, model.accounts, owner);
  const change = (setter) => (value) => { setter(value); setCheck(null); setError(""); };
  const create = () => {
    const result = model.launchBot({ strategyId: strategy.id, name, mode, capital, stakeMode, stakeValue, accountId, owner, minBalanceCheck: check });
    if (result.error) setError(result.error);
    else onLaunched(result.bot.id);
  };
  const belowMinimum = check && !check.passed;
  return <AppDialog open onOpenChange={(open) => !open && onClose()} title="Create bot" description={`${strategy.name} · ${strategy.params.pair} · ${strategy.params.timeframe}`} className="max-w-[680px]">
    <div className="max-h-[75vh] space-y-4 overflow-y-auto pr-1 text-[12px]">
      <div className={cx(ui.radius, ui.panelMuted, "p-3", MUTED)}>
        <strong className="text-[#faf7fd]">{strategy.sourceBacktestId ? `Source backtest ${strategy.sourceBacktestId}` : "Source: selected Stage 5 epoch"}</strong> · {strategy.epochLabel}
        <div className="mt-1">Frozen: {strategy.params.exchange} · {strategy.params.mode} · {strategy.params.pair} · {strategy.params.timeframe} · {strategy.params.leverage || 1}×.</div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <AppInput label="Bot name" value={name} onChange={(event) => setName(event.target.value)} />
        <AppSelect label="Trading mode" value={mode} onValueChange={change(setMode)} options={[{ value: "Dryrun", label: "Dryrun" }, { value: "Live", label: "Live" }]} />
      </div>
      <AppSelect label={mode === "Dryrun" ? "Exchange account for fees · optional" : "Exchange account · required"} value={accountId} onValueChange={change(setAccountId)} options={[...(mode === "Dryrun" ? [{ value: "", label: "Use exchange fees" }] : []), ...accounts.map((account) => ({ value: account.id, label: `${account.name} · ${money(account.balance)} USDT available` }))]} />
      {mode === "Dryrun" ? <p className={MUTED}>The account supplies fee rates only. Dryrun uses virtual funds and sends no real orders. Without an account, exchange fee rates apply.</p> : accounts.length === 0 ? <p className="text-amber-300">Connect a compatible {strategy.params.exchange} {strategy.params.mode} account before creating a Live bot.</p> : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <AppInput type="number" min="0.01" step="0.01" label={mode === "Dryrun" ? "Virtual starting balance (USDT)" : "Allocated capital (USDT)"} value={capital} onChange={(event) => change(setCapital)(event.target.value)} className={belowMinimum ? "border-red-500" : ""} />
        <AppInput type="number" label="Maximum open positions" value="1" disabled title="Fixed at one position in this scope" />
        <AppSelect label="Stake mode" value={stakeMode} onValueChange={change(setStakeMode)} options={[{ value: "fixed", label: "Fixed USDT" }, { value: "relative", label: "Relative %" }]} />
        <AppInput type="number" min="0.01" step="0.01" label={stakeMode === "relative" ? "Stake value (%)" : "Stake value (USDT)"} value={stakeValue} onChange={(event) => change(setStakeValue)(event.target.value)} />
      </div>
      <div className="rounded-md border border-border bg-muted/30 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2"><span>Minimum balance check</span><AppButton onClick={() => { setCheck(model.checkMinBalance({ strategyId: strategy.id, mode, capital, stakeMode, stakeValue, accountId })); setError(""); }}>Check min balance</AppButton></div>
        {check ? <p role="status" className={cx("mt-2", belowMinimum ? "text-red-400" : "text-green-300")}>Illustrative preview response · Minimum: {amount(check.minimum)}. {belowMinimum ? "Increase starting balance to create this bot." : "Entered balance passes the preview check."}</p> : <p className={cx("mt-2", MUTED)}>Run the check after changing capital, stake, mode or account. The calculation is defined in a separate task.</p>}
      </div>
      {strategy.sourceBacktestId ? <p className="rounded-md border-l-2 border-violet-400 bg-violet-500/10 p-3 text-[#b8aecc]">Backtest capital: {money(strategy.params.startingCapital)} USDT. Changes to capital or stake mean historical results describe different conditions.</p> : <p className="rounded-md border-l-2 border-violet-400 bg-violet-500/10 p-3 text-[#b8aecc]">This strategy was created from an epoch; no source backtest metrics are available.</p>}
      {error ? <p role="alert" className="text-red-400">{error}</p> : null}
      <div className="flex justify-end gap-2"><AppButton onClick={onClose}>Cancel</AppButton><AppButton variant="default" disabled={!check?.passed || mode === "Live" && !accountId} onClick={create}>Create bot · Ready for start</AppButton></div>
    </div>
  </AppDialog>;
}

function AccountsModal({ model, owner, onClose }) {
  const [connecting, setConnecting] = useState(false);
  const [name, setName] = useState("");
  const [exchange, setExchange] = useState("binance");
  const [market, setMarket] = useState("spot");
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [error, setError] = useState("");

  const connect = () => {
    if (!apiKey.trim() || !apiSecret.trim()) {
      setError("Enter a fictional API Key and API Secret.");
      return;
    }
    const result = model.connectAccount({ name, exchange, market, owner });
    if (result.error) {
      setError(result.error);
      return;
    }
    setApiKey("");
    setApiSecret("");
    setName("");
    setError("");
    setConnecting(false);
  };

  return (
    <AppDialog
      open
      onOpenChange={(open) => !open && onClose()}
      title={connecting ? "Connect account" : "Exchange accounts"}
      description="Connections for Live bot launches"
      className="max-w-[700px]"
    >
      {connecting ? (
        <div className="space-y-4 text-[12px]">
          <p className="text-amber-300">
            Preview only. Use fictional credentials. No key is saved or sent.
          </p>
          <AppInput
            label="Connection name"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <AppSelect
              label="Exchange"
              value={exchange}
              onValueChange={setExchange}
              options={[
                { value: "binance", label: "Binance" },
                { value: "bybit", label: "Bybit" },
              ]}
            />
            <AppSelect
              label="Market"
              value={market}
              onValueChange={setMarket}
              options={[
                { value: "spot", label: "Spot" },
                { value: "futures", label: "Futures" },
              ]}
            />
          </div>
          <AppInput
            label="API Key · fictional"
            value={apiKey}
            onChange={(event) => setApiKey(event.target.value)}
            autoComplete="off"
          />
          <AppInput
            label="API Secret · fictional"
            type="password"
            value={apiSecret}
            onChange={(event) => setApiSecret(event.target.value)}
            autoComplete="off"
          />
          {error ? (
            <p role="alert" className="text-red-400">
              {error}
            </p>
          ) : null}
          <div className="flex justify-end gap-2">
            <AppButton
              onClick={() => {
                setConnecting(false);
                setError("");
              }}
            >
              Back
            </AppButton>
            <AppButton variant="default" onClick={connect}>
              Verify and connect
            </AppButton>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className={cx(ui.radius, ui.panel, "overflow-hidden")}>
            <DataTable headers={["Connection", "Exchange / market", "Balance", "Status"]}>
              {model.accounts
                .filter((account) => account.owner === owner)
                .map((account) => (
                  <tr key={account.id} className="border-b border-[rgba(60,40,80,0.25)]">
                    <td className="px-4 py-2.5">{account.name}</td>
                    <td className="px-2 py-2.5">
                      {account.exchange} · {account.market}
                    </td>
                    <td className="px-2 py-2.5">{money(account.balance)} USDT</td>
                    <td className="px-2 py-2.5">
                      <Status value={account.status} />
                    </td>
                  </tr>
                ))}
            </DataTable>
          </div>
          <div className="flex justify-end gap-2">
            <AppButton onClick={onClose}>Close</AppButton>
            <AppButton variant="default" onClick={() => setConnecting(true)}>
              Connect account
            </AppButton>
          </div>
        </div>
      )}
    </AppDialog>
  );
}

function ControlModal({ bot, action, onClose, onConfirm, onManualExit }) {
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [confirmAll, setConfirmAll] = useState(false);
  const [notice, setNotice] = useState("");
  const exitFormRef = useRef(null);
  const stopping = action === "stop";
  useEffect(() => {
    exitFormRef.current?.scrollIntoView({ block: "nearest" });
  }, [selectedPosition?.id]);
  return (
    <AppDialog
      open
      onOpenChange={(open) => !open && onClose()}
      title={stopping ? "Stop bot" : "Pause bot"}
      description={`${bot.name} · ${bot.positions.length} open positions`}
      className="max-w-[720px]"
    >
      <div className="max-h-[75vh] space-y-4 overflow-y-auto pr-1 text-[12px]">
        <p className={cx("rounded-md border p-3", stopping ? "border-amber-500/40 bg-amber-500/10 text-amber-200" : "border-violet-500/40 bg-violet-500/10 text-violet-200")}>
          {stopping ? "Bot automation will stop buying and handling open trades. Choose any trades to close manually; unselected trades remain open and require attention." : "New buying stops. The strategy continues managing open trades and their exits. Manual exit is optional."}
        </p>
        {stopping && bot.positions.length ? <div className="space-y-2"><AppButton onClick={() => setConfirmAll(true)}>Close all at market</AppButton>{confirmAll ? <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3"><p>Record a market-exit preview for all {bot.positions.length} open trades? No exchange order will be sent.</p><div className="mt-2 flex gap-2"><AppButton onClick={() => setConfirmAll(false)}>Cancel</AppButton><AppButton variant="destructive" onClick={() => { bot.positions.forEach((position) => onManualExit({ positionId: position.id, action: "market" })); setNotice(`Preview actions recorded for ${bot.positions.length} trades.`); setConfirmAll(false); }}>Confirm all preview exits</AppButton></div></div> : null}</div> : null}
        <div className="overflow-auto rounded-md border border-border">
          <table className="w-full min-w-[520px] text-left"><thead className="bg-secondary text-muted-foreground"><tr><th className="px-3 py-2">Open trade</th><th className="px-3 py-2">Entry / Current</th><th className="px-3 py-2">Exchange stop</th><th className="px-3 py-2">Action</th></tr></thead><tbody>
            {bot.positions.map((position) => {
              const exitOpen = selectedPosition?.id === position.id;
              return (
                <React.Fragment key={position.id}>
                  <tr className={cx("border-t border-border", exitOpen && "bg-violet-500/10")}>
                    <td className="px-3 py-2">{position.id} · {position.pair}</td>
                    <td className="px-3 py-2">{money(position.entryPrice)} / {money(position.currentPrice)}</td>
                    <td className="px-3 py-2">{position.stopOnExchange == null ? "No data" : position.stopOnExchange ? "Placed" : "Not placed"}</td>
                    <td className="px-3 py-2">
                      <AppButton
                        variant="link"
                        className="h-auto p-0 text-violet-200"
                        aria-expanded={exitOpen}
                        onClick={() => setSelectedPosition(exitOpen ? null : position)}
                      >
                        Force exit
                      </AppButton>
                      {position.manualExitPreview ? <div className="mt-1 max-w-40 whitespace-normal text-[10px] text-amber-200">{position.manualExitPreview} · preview</div> : null}
                    </td>
                  </tr>
                  {exitOpen ? (
                    <tr className="border-t border-violet-500/20 bg-violet-500/5">
                      <td colSpan={4} className="px-3 py-2">
                        <div ref={exitFormRef}>
                          <ManualExitControls
                            key={position.id}
                            hideTitle
                            position={position}
                            onSubmit={(request) => {
                              const result = onManualExit(request);
                              if (!result) setNotice(`Preview action recorded for ${position.id}.`);
                              return result;
                            }}
                            onCancel={() => setSelectedPosition(null)}
                          />
                        </div>
                      </td>
                    </tr>
                  ) : null}
                </React.Fragment>
              );
            })}
            {!bot.positions.length ? <tr><td colSpan={4} className="px-3 py-5 text-center text-muted-foreground">No open trades.</td></tr> : null}
          </tbody></table>
        </div>
        {notice ? <p role="status" className="text-violet-200">{notice}</p> : null}
        <div className="flex justify-end gap-2">
          <AppButton onClick={onClose}>Cancel</AppButton>
          <AppButton variant={stopping ? "destructive" : "default"} onClick={onConfirm}>
            Confirm {stopping ? "stop" : "pause"}
          </AppButton>
        </div>
      </div>
    </AppDialog>
  );
}

function EditStrategyModal({ strategy, onClose, onSave }) {
  const [name, setName] = useState(strategy.name);
  const [description, setDescription] = useState(strategy.description || "");
  const [error, setError] = useState("");
  return (
    <AppDialog
      open
      onOpenChange={(open) => !open && onClose()}
      title="Edit details"
      description="Trading parameters and code remain unchanged."
    >
      <div className="space-y-4">
        <AppInput
          label="Strategy name"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <div className="space-y-1">
          <Label htmlFor="bots-edit-description">Description</Label>
          <Textarea
            id="bots-edit-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </div>
        {error ? (
          <p role="alert" className="text-red-400">
            {error}
          </p>
        ) : null}
        <div className="flex justify-end gap-2">
          <AppButton onClick={onClose}>Cancel</AppButton>
          <AppButton
            variant="default"
            onClick={() => {
              const nextError = onSave({ name, description });
              if (nextError) setError(nextError);
              else onClose();
            }}
          >
            Save changes
          </AppButton>
        </div>
      </div>
    </AppDialog>
  );
}

export function BotsPage({
  model,
  backtestingState,
  currentUser = "bogdan",
  openTarget,
  onClearOpenTarget,
  onDetailChange,
  onOpenBlueprintStrategy,
}) {
  const [tab, setTab] = useState("strategies");
  const [detail, setDetail] = useState(null);
  const [detailTab, setDetailTab] = useState("Overview");
  const [chartFocus, setChartFocus] = useState(null);
  const [modal, setModal] = useState(null);
  const [error, setError] = useState("");
  const [strategySearch, setStrategySearch] = useState("");
  const [botSearch, setBotSearch] = useState("");
  const [botSort, setBotSort] = useState("latest");
  const [strategyFilters, setStrategyFilters] = useState({
    owner: "All",
    status: "All",
    exchange: "All",
  });
  const [botFilters, setBotFilters] = useState({
    strategy: "All",
    mode: "All",
    status: "All",
    owner: "All",
    account: "All",
  });

  useEffect(() => {
    onDetailChange?.(Boolean(detail));
  }, [detail, onDetailChange]);

  useEffect(() => {
    if (!openTarget) return;
    setTab("strategies");
    setDetail({ kind: "strategy", id: openTarget.id });
    setDetailTab("Overview");
    onClearOpenTarget?.(null);
  }, [openTarget, onClearOpenTarget]);

  const strategy =
    detail?.kind === "strategy" ? model.strategies.find((item) => item.id === detail.id) : null;
  const bot = detail?.kind === "bot" ? model.bots.find((item) => item.id === detail.id) : null;
  const botStrategy = bot ? model.strategies.find((item) => item.id === bot.strategyId) : null;
  const botStats = bot ? performanceSummary(bot) : null;
  const viewTradeOnOverview = (trade) => {
    setChartFocus((prev) => ({ ...trade, focusRequest: (prev?.focusRequest || 0) + 1 }));
    setDetailTab("Overview");
  };
  const strategyBotCounts = strategy ? countStrategyBots(strategy.id, model.bots) : null;

  const strategyRows = useMemo(
    () =>
      model.strategies.filter(
        (item) =>
          (!strategySearch.trim() || [item.name, item.id, item.blueprintName, item.params.pair].join(" ").toLowerCase().includes(strategySearch.trim().toLowerCase())) &&
          (strategyFilters.owner === "All" || item.owner === strategyFilters.owner) &&
          (strategyFilters.status === "All" || item.status === strategyFilters.status) &&
          (strategyFilters.exchange === "All" || item.params.exchange === strategyFilters.exchange),
      ),
    [model.strategies, strategyFilters, strategySearch],
  );

  const botRows = useMemo(
    () =>
      filterAndSortBots(model.bots, model.strategies, model.accounts, botFilters, botSearch, botSort),
    [model.bots, model.strategies, model.accounts, botFilters, botSearch, botSort],
  );

  const openStrategy = (id, subtab = "Overview") => {
    setTab("strategies");
    setDetail({ kind: "strategy", id });
    setDetailTab(subtab);
    setError("");
  };
  const openBot = (id) => {
    setChartFocus(null);
    setTab("bots");
    setDetail({ kind: "bot", id });
    setDetailTab("Overview");
    setError("");
  };
  const openLaunch = (id) => {
    setModal({ kind: "launch", id });
    setError("");
  };
  const closeModal = () => {
    setModal(null);
    setError("");
  };
  const applyArchive = (id, archived) => {
    const nextError = model.setStrategyArchived(id, archived);
    if (nextError) setError(nextError);
    else closeModal();
  };
  const listTitle = tab === "strategies" ? "Compiled Strategies" : "Bots";
  const sourceStrategy = modal?.kind === "source" ? model.strategies.find((item) => item.id === modal.id) : null;
  const sourceRun = sourceStrategy ? backtestingState?.getRuns(sourceStrategy.epochId).find((run) => run.id === sourceStrategy.sourceBacktestId) : null;
  const filtersClearable = Object.values(
    tab === "strategies" ? strategyFilters : botFilters,
  ).some((value) => value !== "All") || Boolean((tab === "strategies" ? strategySearch : botSearch).trim());

  return (
    <div className="space-y-5">
      {!detail ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[rgba(60,40,80,0.35)] pb-3">
            <PillTabs
              className="border-b-0 pb-0"
              value={tab}
              onChange={(value) => {
                setTab(value);
                setDetail(null);
                setError("");
              }}
              items={[
                {
                  value: "strategies",
                  label: "Compiled Strategies",
                  count: model.strategies.length,
                },
                { value: "bots", label: "Bots", count: model.bots.length },
              ]}
            />
            <AppButton onClick={() => setModal({ kind: "accounts" })}>Exchange accounts</AppButton>
          </div>

          {error ? (
            <p role="alert" className="text-[12px] text-red-400">
              {error}
            </p>
          ) : null}

          {tab === "strategies" ? (
            <section className={cx(ui.radius, ui.panel, "overflow-hidden")} aria-label="Compiled Strategies">
              <FilterBar
                countLabel={`${strategyRows.length} of ${model.strategies.length} strategies`}
                action={
                  <AppButton
                    size="sm"
                    disabled={!filtersClearable}
                    onClick={() =>
                      { setStrategyFilters({ owner: "All", status: "All", exchange: "All" }); setStrategySearch(""); }
                    }
                  >
                    Clear filters
                  </AppButton>
                }
              >
                <AppInput label="Search" value={strategySearch} onChange={(event) => setStrategySearch(event.target.value)} placeholder="Search name, ID or pair" aria-label="Search compiled strategies" wrapperClassName="w-52" className="h-8 text-[12px]" />
                <AppSelect
                  label="Owner"
                  value={strategyFilters.owner}
                  onValueChange={(owner) => setStrategyFilters((prev) => ({ ...prev, owner }))}
                  options={toOptions(unique(model.strategies.map((item) => item.owner)))}
                  className="w-[130px]"
                  triggerClassName="h-8 text-[12px]"
                  aria-label="Filter by owner"
                />
                <AppSelect
                  label="Status"
                  value={strategyFilters.status}
                  onValueChange={(status) => setStrategyFilters((prev) => ({ ...prev, status }))}
                  options={[{ value: "All", label: "All statuses" }, { value: "Active", label: "Ready" }, { value: "Archive", label: "Archived" }]}
                  className="w-[130px]"
                  triggerClassName="h-8 text-[12px]"
                  aria-label="Filter by status"
                />
                <AppSelect
                  label="Exchange"
                  value={strategyFilters.exchange}
                  onValueChange={(exchange) =>
                    setStrategyFilters((prev) => ({ ...prev, exchange }))
                  }
                  options={toOptions(unique(model.strategies.map((item) => item.params.exchange)))}
                  className="w-[130px]"
                  triggerClassName="h-8 text-[12px]"
                  aria-label="Filter by exchange"
                />
              </FilterBar>

              <DataTable headers={["Strategy", "Trading context", "Created", "Bots", "Owner", "Status", "Actions"]}>
                {!strategyRows.length ? <EmptyCell columns={7}>No strategies match the current filters.</EmptyCell> : null}
                {strategyRows.map((item) => {
                  const related = model.bots.filter((bot) => bot.strategyId === item.id);
                  const counts = countStrategyBots(item.id, model.bots);
                  return <tr key={item.id} className="border-b border-border">
                    <td className="px-4 py-3"><div className="flex items-center gap-2">
                      <AppButton size="icon" className="h-8 w-8 shrink-0" aria-label={`View ${item.name}`} onClick={() => openStrategy(item.id)}><EyeIcon /></AppButton>
                      <div><AppButton variant="link" className="h-auto p-0 text-left font-medium text-violet-200" onClick={() => openStrategy(item.id)}>{item.name}</AppButton><div className="mt-1 text-[11px] text-muted-foreground">{item.blueprintName} · {item.epochLabel}</div></div>
                    </div></td>
                    <td className="px-2 py-3"><div>{item.params.exchange} · {item.params.mode}{item.params.mode === "futures" ? ` · ${item.params.leverage}×` : ""}</div><div className="mt-1 text-[11px] text-muted-foreground">{item.params.pair} · {item.params.timeframe}</div></td>
                    <td className="px-2 py-3 whitespace-nowrap">{date(item.savedAt)}</td>
                    <td className="px-2 py-3"><AppButton variant="link" className="h-auto p-0 text-violet-200" onClick={() => openStrategy(item.id, "Bots")}>Live: {related.filter((bot) => bot.mode === "Live").length} · Dry-run: {related.filter((bot) => bot.mode === "Dryrun").length}</AppButton><div className="mt-1 text-[11px] text-muted-foreground">{counts.active} active · {counts.inactive} inactive</div></td>
                    <td className="px-2 py-3">{item.owner}</td>
                    <td className="px-2 py-3"><Status value={item.status} /></td>
                    <td className="px-2 py-3"><div className="flex gap-2"><AppButton disabled={item.status !== "Active"} onClick={() => openLaunch(item.id)}>Create bot</AppButton>
                      <DropdownMenu><DropdownMenuTrigger asChild><AppButton aria-label={`More actions for ${item.name}`}>⋯</AppButton></DropdownMenuTrigger><DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => openStrategy(item.id)}>View strategy</DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => setModal({ kind: "edit", id: item.id })}>Edit details</DropdownMenuItem>
                        <DropdownMenuItem disabled={item.status === "Active" && counts.active > 0} onSelect={() => item.status === "Archive" ? applyArchive(item.id, false) : setModal({ kind: "archive", id: item.id })}>{item.status === "Archive" ? "Restore" : counts.active > 0 ? "Archive · resolve active bots first" : "Archive"}</DropdownMenuItem>
                      </DropdownMenuContent></DropdownMenu>
                    </div></td>
                  </tr>;
                })}
              </DataTable>
            </section>
          ) : (
            <section className={cx(ui.radius, ui.panel, "overflow-hidden")} aria-label="Bots">
              <FilterBar
                countLabel={`${botRows.length} of ${model.bots.length} bots`}
                action={
                  <AppButton
                    size="sm"
                    disabled={!filtersClearable}
                    onClick={() =>
                      { setBotFilters({
                        strategy: "All",
                        mode: "All",
                        status: "All",
                        owner: "All",
                        account: "All",
                      }); setBotSearch(""); }
                    }
                  >
                    Clear filters
                  </AppButton>
                }
              >
                <AppInput label="Search" value={botSearch} onChange={(event) => setBotSearch(event.target.value)} placeholder="Search bots, ID or pair" aria-label="Search bots" wrapperClassName="w-48" className="h-8 text-[12px]" />
                <AppSelect
                  label="Strategy"
                  value={botFilters.strategy}
                  onValueChange={(strategyId) =>
                    setBotFilters((prev) => ({ ...prev, strategy: strategyId }))
                  }
                  options={[
                    { value: "All", label: "All strategies" },
                    ...model.strategies.map((item) => ({ value: item.id, label: item.name })),
                  ]}
                  className="w-[180px]"
                  triggerClassName="h-8 text-[12px]"
                  aria-label="Filter by strategy"
                />
                <AppSelect
                  label="Mode"
                  value={botFilters.mode}
                  onValueChange={(mode) => setBotFilters((prev) => ({ ...prev, mode }))}
                  options={[{ value: "All", label: "All modes" }, { value: "Dryrun", label: "Dry-run" }, { value: "Live", label: "Live" }]}
                  className="w-[120px]"
                  triggerClassName="h-8 text-[12px]"
                  aria-label="Filter by mode"
                />
                <AppSelect
                  label="Status"
                  value={botFilters.status}
                  onValueChange={(status) => setBotFilters((prev) => ({ ...prev, status }))}
                  options={toOptions([
                    "Ready for start",
                    "Starting",
                    "Running",
                    "Paused",
                    "Stopped",
                    "Launch failed",
                    "Needs attention",
                  ])}
                  className="w-[150px]"
                  triggerClassName="h-8 text-[12px]"
                  aria-label="Filter by status"
                />
                <AppSelect
                  label="Owner"
                  value={botFilters.owner}
                  onValueChange={(owner) => setBotFilters((prev) => ({ ...prev, owner }))}
                  options={toOptions(unique(model.bots.map((item) => item.owner)))}
                  className="w-[120px]"
                  triggerClassName="h-8 text-[12px]"
                  aria-label="Filter by owner"
                />
                <AppSelect label="Account" value={botFilters.account} onValueChange={(account) => setBotFilters((prev) => ({ ...prev, account }))} options={[{ value: "All", label: "All accounts" }, { value: "virtual", label: "Virtual wallet" }, ...model.accounts.map((account) => ({ value: account.id, label: account.name }))]} className="w-40" triggerClassName="h-8 text-[12px]" aria-label="Filter by account" />
                <AppSelect label="Sort" value={botSort} onValueChange={setBotSort} options={[{ value: "latest", label: "Latest start" }, { value: "name", label: "Name A–Z" }, { value: "pnl", label: "P&L high to low" }, { value: "status", label: "Status A–Z" }]} className="w-40" triggerClassName="h-8 text-[12px]" aria-label="Sort bots" />
              </FilterBar>

              <DataTable className="min-w-[1180px]" headers={["Bot / strategy", "Mode / account", "Status / data", "Equity / Balance", "P&L", "Trades / W–L", "Profit reserve", "Owner", "Actions"]}>
                {!botRows.length ? <EmptyCell columns={9}>No bots match the current filters.</EmptyCell> : null}
                {botRows.map((item) => {
                  const source = model.strategies.find((entry) => entry.id === item.strategyId);
                  const metrics = getBotMetrics(item);
                  const history = closedTrades(item);
                  const outcomesKnown = Array.isArray(item.trades) && history.every((trade) => hasNumber(trade.pnl));
                  const wins = history.filter((trade) => Number(trade.pnl) > 0).length;
                  const losses = history.filter((trade) => Number(trade.pnl) < 0).length;
                  const reserveEnabled = item.profitReserving === true || Number(source?.params?.profitReserving) > 0;
                  const reserve = hasNumber(item.profitReserve) ? Number(item.profitReserve) : reserveEnabled ? null : 0;
                  return <tr key={item.id} className="border-b border-border">
                    <td className="px-4 py-3"><div className="flex items-start gap-2"><AppButton size="icon" className="h-8 w-8 shrink-0" aria-label={`View ${item.name} ${item.mode}`} onClick={() => openBot(item.id)}><EyeIcon /></AppButton><div>
                      <AppButton variant="link" className="h-auto p-0 text-left font-medium text-violet-200" onClick={() => openBot(item.id)}>{item.name}</AppButton><div className="text-[10px] text-muted-foreground" title={item.id}>{item.id.length > 20 ? item.id.slice(-12) : item.id}</div>
                      <AppButton variant="link" className="h-auto p-0 text-[11px] text-violet-200" onClick={() => openStrategy(item.strategyId)}>{source?.name || "Source unavailable"}</AppButton>
                      <div className="text-[11px] text-muted-foreground">{source?.params.pair} · {source?.params.timeframe}</div>
                    </div></div></td>
                    <td className="px-2 py-3"><ModeBadge mode={item.mode} /><div className="mt-1 text-[11px] text-muted-foreground">{accountName(item, model.accounts)}</div></td>
                    <td className="px-2 py-3"><BotStatusCell bot={item} /></td>
                    <td className="px-2 py-3 text-right tabular-nums whitespace-nowrap"><div className="font-medium" title="Equity = balance + open P&L; includes the profit reserve">{amount(metrics.equity)}</div><div className="mt-1 text-[11px] text-muted-foreground" title="Balance = initial bot capital + closed P&L; includes committed funds and profit reserve">Balance {money(metrics.balance)}</div><div className="text-[10px] text-muted-foreground">Initial {money(item.capital)}</div></td>
                    <td className="px-2 py-3 text-right tabular-nums whitespace-nowrap"><div className={cx("font-medium", pnlTone(metrics.totalPnl))}>{amount(metrics.totalPnl, true)}</div><div className={cx("mt-0.5 text-[11px]", pnlTone(metrics.returnPct))} title="Total P&L / initial bot capital × 100">{percent(metrics.returnPct, true)} on initial capital</div><div className="mt-1 text-[11px]"><span className="text-muted-foreground">Open </span><span className={pnlTone(metrics.unrealized)}>{money(metrics.unrealized, true)}</span><span className="text-muted-foreground"> · Closed </span><span className={pnlTone(metrics.realized)}>{money(metrics.realized, true)}</span></div><div className="text-[10px] text-muted-foreground" title={`${date(item.startedAt)} → ${date(item.stoppedAt || item.updatedAt)}`}>Lifetime · USDT</div></td>
                    <td className="px-2 py-3 whitespace-nowrap"><div>{item.positions?.length ?? "No data"} open · {item.closedTradeCount ?? "No data"} closed</div><div className="mt-1 text-[11px]" title="Profitable / losing fully closed trades. Breakeven trades are excluded from W/L.">{outcomesKnown ? <><span className="text-green-400">{wins} W</span><span className="text-muted-foreground"> / </span><span className="text-red-400">{losses} L</span></> : <span className="text-muted-foreground">W/L · No data</span>}</div></td>
                    <td className="px-2 py-3 text-right tabular-nums whitespace-nowrap" title="Profit withheld from new entries; remains part of balance and equity. Separate from funds committed to positions."><div>{amount(reserve)}</div><div className="mt-1 text-[10px] text-muted-foreground">{reserveEnabled ? "Reserving enabled" : "Not enabled"}</div></td>
                    <td className="px-2 py-3">{item.owner}</td>
                    <td className="sticky right-0 z-10 border-l border-[rgba(60,40,80,0.35)] bg-[#170f29] px-2 py-3">
                      <BotRowActions
                        bot={item}
                        onStart={() => setError(model.startBot(item.id) || "")}
                        onPause={() => setModal({ kind: "pause", id: item.id })}
                        onResume={() => setError(model.resumeBot(item.id) || "")}
                        onStop={() => setModal({ kind: "stop", id: item.id })}
                        onDelete={() => setModal({ kind: "deleteBot", id: item.id })}
                      />
                    </td>
                  </tr>;
                })}
              </DataTable>
            </section>
          )}
        </>
      ) : null}

      {strategy ? (
        <section className="space-y-4">
          <AppButton variant="ghost" onClick={() => setDetail(null)}>
            ← {listTitle}
          </AppButton>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-[16px] font-semibold text-[#faf7fd]">{strategy.name}</h2>
              <div className={cx("mt-2 flex flex-wrap items-center gap-2 text-[12px]", MUTED)}>
                <Status value={strategy.status} />
                <span>Owner: {strategy.owner}</span>
                <span>
                  {strategy.params.exchange} · {strategy.params.pair} · {strategy.params.timeframe}
                </span>
              </div>
              <p className={cx("mt-2 max-w-3xl text-[12px]", MUTED)}>
                Description:{" "}
                <span className="text-[#faf7fd]">{strategy.description || "—"}</span>
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <AppButton onClick={() => setModal({ kind: "edit", id: strategy.id })}>
                Edit details
              </AppButton>
              <AppButton
                disabled={
                  strategy.status === "Active" &&
                  countStrategyBots(strategy.id, model.bots).active > 0
                }
                onClick={() =>
                  strategy.status === "Archive"
                    ? applyArchive(strategy.id, false)
                    : setModal({ kind: "archive", id: strategy.id })
                }
              >
                {strategy.status === "Archive" ? "Restore" : "Archive"}
              </AppButton>
              <AppButton
                variant="default"
                disabled={strategy.status !== "Active"}
                onClick={() => openLaunch(strategy.id)}
              >
                Create bot
              </AppButton>
            </div>
          </div>

          <PillTabs
            value={detailTab === "Bots" ? "Bots" : "Overview"}
            onChange={setDetailTab}
            items={["Overview", "Bots"].map((item) => ({
              value: item,
              label: item,
            }))}
          />

          {error ? (
            <p role="alert" className="text-[12px] text-red-400">
              {error}
            </p>
          ) : null}

          {detailTab !== "Bots" ? (
            <div className="space-y-4">
              <div className="grid gap-3 lg:grid-cols-2">
                <OverviewSectionCard
                  title="Strategy information"
                  rows={[
                    [
                      "Strategy",
                      onOpenBlueprintStrategy && strategy.sourceStrategyId != null ? (
                        <AppButton
                          key="strategy-name"
                          variant="link"
                          className="h-auto p-0 text-right text-violet-200"
                          onClick={() => onOpenBlueprintStrategy(strategy.sourceStrategyId)}
                        >
                          {strategy.name} · {strategy.versionLineage || "—"}
                        </AppButton>
                      ) : (
                        <span key="strategy-name">
                          {strategy.name} · {strategy.versionLineage || "—"}
                        </span>
                      ),
                    ],
                    ["Epoch", strategy.epochLabel],
                    ["Source type", strategy.sourceBacktestId ? "Successful backtest" : "Selected epoch"],
                    strategy.sourceBacktestId ? [
                      "Backtest",
                      <span key="backtest" className="inline-flex items-center justify-end gap-2">
                        <span>{strategy.sourceBacktestId}</span>
                        <AppButton
                          size="icon"
                          className="h-7 w-7 shrink-0"
                          aria-label={`Open backtest ${strategy.sourceBacktestId}`}
                          onClick={() => setModal({ kind: "source", id: strategy.id })}
                        >
                          <EyeIcon />
                        </AppButton>
                      </span>,
                    ] : null,
                    strategy.sourceBacktestId ? [
                      "Period",
                      `${strategy.params.periodFrom || "No data"} → ${strategy.params.periodTo || "No data"}`,
                    ] : null,
                    strategy.sourceBacktestId ? [
                      "ROI / Max DD",
                      `${percent(strategy.result?.roi, true)} / ${percent(strategy.result?.maxdd)}`,
                    ] : null,
                    strategy.sourceBacktestId ? ["Starting capital", `${money(strategy.params.startingCapital)} USDT`] : null,
                    [
                      "Linked bots",
                      <AppButton
                        key="linked-bots"
                        variant="link"
                        className="h-auto p-0 text-violet-200"
                        onClick={() => setDetailTab("Bots")}
                      >
                        {strategyBotCounts.active} active · {strategyBotCounts.inactive} inactive
                      </AppButton>,
                    ],
                  ]}
                />
                <OverviewSectionCard
                  title="Trading configuration"
                  rows={[
                    ["Exchange", strategy.params.exchange],
                    [
                      "Pair / timeframe",
                      `${strategy.params.pair} · ${strategy.params.timeframe}`,
                    ],
                    [
                      "Market / leverage",
                      strategy.params.mode === "futures"
                        ? `${strategy.params.mode} · ${strategy.params.leverage || 1}×`
                        : `${strategy.params.mode} · Not applicable`,
                    ],
                    [
                      "Stake",
                      formatStakeLabel(strategy.params),
                      "Default amount used for each new trade. A bot can override mode and value at creation.",
                    ],
                    ["Profit Reserving", Number(strategy.params.profitReserving) > 0 ? `${strategy.params.profitReserving}%` : "Off", "Share of realized profit withheld from new entries."],
                    ["Maximum open positions", "1 · fixed", "New bots are limited to one concurrent open position in this scope."],
                  ]}
                />
              </div>

              <div className={cx(SECTION_CARD, "space-y-2")}>
                <div className="text-[10px] font-semibold uppercase tracking-wide text-[#9b8ec4]">
                  Strategy indicators
                </div>
                {strategy.stageConfig ? (
                  <StageConfigColumns stageConfig={strategy.stageConfig} />
                ) : (
                  <div className={cx("text-[12px]", MUTED)}>
                    Configuration unavailable for this saved strategy.
                  </div>
                )}
              </div>

              <div className={cx(ui.radius, ui.panel, "overflow-hidden")}>
                <div className={cx("border-b px-3 py-2.5 text-[12px] font-medium text-[#faf7fd]", ui.divider)}>
                  Strategy Code
                </div>
                <StrategyTemplatePreview
                  signalIndicators={strategy.stageConfig?.stage1?.indicators || []}
                  entryFormula={strategy.stageConfig?.stage2?.formula || ""}
                  exitFormula={strategy.stageConfig?.stage3?.formula || ""}
                  riskRanges={strategy.stageConfig?.stage4?.riskRanges || {}}
                  riskHyperoptParams={strategy.stageConfig?.stage4?.riskHyperoptParams || {}}
                  timeRange={strategy.params?.timeframe || "1h"}
                  height={320}
                />
              </div>
            </div>
          ) : null}

          {detailTab === "Bots" ? (
            <div className={cx(ui.radius, ui.panel, "overflow-hidden")}>
              <div className={cx("px-4 py-3 text-[12px] font-medium", ui.panelMuted, "border-b", ui.divider)}>
                Linked bots
              </div>
              <DataTable headers={["Bot", "Mode / account", "Status / data", "Total P&L", "Positions", "Owner"]}>
                {model.bots
                  .filter((item) => item.strategyId === strategy.id)
                  .map((item) => (
                    <tr key={item.id} className="border-b border-[rgba(60,40,80,0.25)]">
                      <td className="px-4 py-2.5"><AppButton variant="link" className="h-auto p-0 text-violet-200" onClick={() => openBot(item.id)}>{item.name}</AppButton><div className="text-[11px] text-muted-foreground">{item.id.length > 20 ? item.id.slice(-12) : item.id}</div></td>
                      <td className="px-2 py-2.5"><ModeBadge mode={item.mode} /><div className="mt-1 text-[11px] text-muted-foreground">{accountName(item, model.accounts)}</div></td>
                      <td className="px-2 py-2.5"><BotStatusCell bot={item} /></td>
                      <td className={cx("px-2 py-2.5 text-right tabular-nums", pnlTone(getBotMetrics(item).totalPnl))}>{amount(getBotMetrics(item).totalPnl, true)}<div className="text-[11px]">{percent(getBotMetrics(item).returnPct, true)} · lifetime</div></td>
                      <td className="px-2 py-2.5">{item.positions?.length ?? "No data"} open</td>
                      <td className="px-2 py-2.5">{item.owner}</td>
                    </tr>
                  ))}
                {!model.bots.some((item) => item.strategyId === strategy.id) ? (
                  <EmptyCell columns={6}>No bots launched from this strategy.</EmptyCell>
                ) : null}
              </DataTable>
            </div>
          ) : null}
        </section>
      ) : null}

      {bot && botStrategy ? (
        <section className="space-y-4">
          <AppButton variant="ghost" onClick={() => setDetail(null)}>
            ← Bots
          </AppButton>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-[16px] font-semibold text-[#faf7fd]">{bot.name}</h2>
              <div className={cx("mt-2 flex flex-wrap items-center gap-2 text-[12px]", MUTED)}>
                <ModeBadge mode={bot.mode} />
                <Status value={bot.status} />
                <RuntimeBadge bot={bot} />
                <span>
                  {botStrategy.params.exchange} · {botStrategy.params.pair} ·{" "}
                  {botStrategy.params.timeframe}
                </span>
                <span>Account: {accountName(bot, model.accounts)}</span>
                <span className="inline-flex items-center gap-1">
                  Strategy:
                  <AppButton
                    variant="link"
                    className="h-auto p-0 text-violet-200"
                    onClick={() => openStrategy(botStrategy.id)}
                  >
                    {botStrategy.name}
                  </AppButton>
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <AppButton
                variant="default"
                disabled={botStrategy.status !== "Active"}
                onClick={() => openLaunch(botStrategy.id)}
              >
                Create new bot
              </AppButton>
              {bot.status === "Ready for start" ? <><AppButton variant="default" title="Prepare and manually start this bot" onClick={() => setError(model.startBot(bot.id) || "")}><Play aria-hidden />Start bot</AppButton><AppButton variant="destructive" title="Delete this never-started bot" onClick={() => setModal({ kind: "deleteBot", id: bot.id })}>Delete bot</AppButton></> : null}
              {bot.status === "Running" ? <AppButton title="Stop new buying; keep managing open trades" onClick={() => setModal({ kind: "pause", id: bot.id })}><Pause aria-hidden />Pause bot</AppButton> : null}
              {["Paused", "Stopped"].includes(bot.status) ? <AppButton title="Resume buying and handling open trades" onClick={() => setError(model.resumeBot(bot.id) || "")}><Play aria-hidden />Resume bot</AppButton> : null}
              {["Running", "Paused"].includes(bot.status) ? <AppButton variant="destructive" title="Stop bot automation; open trades require manual attention" onClick={() => setModal({ kind: "stop", id: bot.id })}><CircleStop aria-hidden />Stop bot</AppButton> : null}
            </div>
          </div>

          <PillTabs
            value={detailTab === "Settings" ? "Configuration" : detailTab}
            onChange={setDetailTab}
            items={["Overview", "Trades", "Events", "Configuration", "Notifications"].map((item) => ({
              value: item,
              label: item === "Trades" ? `Closed trades (${bot.closedTradeCount ?? "—"})` : item,
            }))}
          />

          {error ? (
            <p role="alert" className="text-[12px] text-red-400">
              {error}
            </p>
          ) : null}

          <DataState bot={bot} compact showRuntimeBadge={false} />
          <BotAlerts bot={bot} />

          {detailTab === "Overview" ? (
            <BotOverview key={bot.id} bot={bot} strategy={botStrategy} focusTrade={chartFocus?.pair === botStrategy.params.pair ? chartFocus : null} onViewChart={viewTradeOnOverview} onManualExit={(request) => model.recordManualExit({ botId: bot.id, ...request })} />
          ) : null}

          {detailTab === "Trades" ? <BotTrades key={bot.id} bot={bot} strategy={botStrategy} onViewChart={viewTradeOnOverview} /> : null}

          {detailTab === "Events" ? (
            <div className={PANEL}>
              <h3 className="mb-3 text-[12px] font-medium text-[#faf7fd]">Events and warnings</h3>
              {!bot.events?.length ? <p className="text-[12px] text-muted-foreground">No events recorded.</p> : null}
              {bot.events?.map((event) => (
                <div
                  key={event.id}
                  className="border-t border-[rgba(60,40,80,0.35)] py-3 text-[12px]"
                >
                  <time className={MUTED}>{date(event.at)}</time>
                  <p className={cx("mt-1", event.level === "error" ? "text-red-300" : event.level === "warning" ? "text-amber-200" : "text-foreground")}>{event.level ? `${event.level.toUpperCase()} · ` : ""}{event.text}</p>
                </div>
              ))}
            </div>
          ) : null}

          {detailTab === "Notifications" ? (
            <BotNotifications bot={bot} model={model} owner={currentUser} />
          ) : null}

          {detailTab === "Configuration" || detailTab === "Settings" ? (
            <div className="space-y-4">
              {(() => {
                const botCapitalKnown = bot.capital != null && bot.capital !== "";
                const backtestCapitalKnown =
                  botStrategy.params?.startingCapital != null &&
                  botStrategy.params.startingCapital !== "";
                const capitalsDiffer =
                  botCapitalKnown &&
                  backtestCapitalKnown &&
                  Number(bot.capital) !== Number(botStrategy.params.startingCapital);
                if (!capitalsDiffer) return null;
                return (
                  <p className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-[12px] text-amber-200">
                    Bot capital: {amount(bot.capital)} · Backtest capital:{" "}
                    {amount(botStrategy.params.startingCapital)}
                  </p>
                );
              })()}

              <div className="grid items-start gap-3 lg:grid-cols-2">
                <OverviewSectionCard
                  title="Bot configuration"
                  rows={[
                    ["Mode", bot.mode === "Dryrun" ? "Dry-run" : bot.mode === "Live" ? "Live" : bot.mode || null],
                    [
                      "Funding source / Account",
                      accountName(bot, model.accounts),
                    ],
                    ["Bot capital", amount(bot.capital)],
                    ["Fee source", bot.feeSource === "account" ? accountName(bot, model.accounts) : `${botStrategy.params.exchange} exchange rates`, "In Dryrun, an optional exchange account supplies fee rates only; trades use virtual funds."],
                    ["Stake", formatStakeLabel(bot), "The per-trade amount or percentage selected when this bot was created."],
                    [
                      "Max open trades",
                      bot.maxOpenTrades != null && bot.maxOpenTrades !== ""
                        ? `${bot.maxOpenTrades} max open trades`
                        : null,
                    ],
                  ]}
                />
                <OverviewSectionCard
                  title="Trading conditions"
                  rows={[
                    ["Exchange", botStrategy.params.exchange || null],
                    ["Market", botStrategy.params.mode || null],
                    ["Pair", botStrategy.params.pair || null],
                    ["Timeframe", botStrategy.params.timeframe || null],
                    ["Strategy default Stake", formatStakeLabel(botStrategy.params)],
                    botStrategy.params.mode === "futures"
                      ? [
                          "Leverage",
                          botStrategy.params.leverage != null
                            ? `${botStrategy.params.leverage}×`
                            : null,
                        ]
                      : null,
                  ]}
                />
                <OverviewSectionCard
                  title="Strategy source"
                  rows={[
                    [
                      "Strategy",
                      <AppButton
                        key="cfg-strategy"
                        variant="link"
                        className="h-auto p-0 text-violet-200"
                        onClick={() => openStrategy(botStrategy.id)}
                      >
                        {botStrategy.name}
                      </AppButton>,
                    ],
                    ["Blueprint", botStrategy.blueprintName || null],
                    ["Selected epoch", botStrategy.epochLabel || null],
                    [
                      "Source backtest",
                      botStrategy.sourceBacktestId ? (
                        <AppButton
                          key="cfg-backtest"
                          variant="link"
                          className="h-auto p-0 text-violet-200"
                          onClick={() => setModal({ kind: "source", id: botStrategy.id })}
                        >
                          {botStrategy.sourceBacktestId}
                        </AppButton>
                      ) : null,
                    ],
                  ]}
                />
                <OverviewSectionCard
                  title="History"
                  rows={[
                    ["Owner", bot.owner || null],
                    ["Bot started", date(bot.startedAt)],
                    ["First trade opened", date(botStats.firstOpened)],
                    ["Latest trade opened", date(botStats.latestOpened)],
                    bot.stoppedAt
                      ? ["Stopped", date(bot.stoppedAt)]
                      : null,
                  ]}
                />
              </div>
              <CollapsibleEngineInfo bot={bot} />
            </div>
          ) : null}
        </section>
      ) : null}

      <p className={cx("text-[11px]", SUBTLE)}>
        UI preview · Fictional account balances, bot results and trades. No exchange connection or
        orders are performed.
      </p>

      {modal?.kind === "launch" && model.strategies.some((item) => item.id === modal.id) ? (
        <LaunchModal
          key={modal.id}
          strategy={model.strategies.find((item) => item.id === modal.id)}
          model={model}
          owner={currentUser}
          onClose={closeModal}
          onLaunched={(id) => {
            closeModal();
            openBot(id);
          }}
        />
      ) : null}
      {modal?.kind === "accounts" ? (
        <AccountsModal model={model} owner={currentUser} onClose={closeModal} />
      ) : null}
      {["stop", "pause"].includes(modal?.kind) && model.bots.some((item) => item.id === modal.id) ? (
        <ControlModal
          key={`${modal.kind}-${modal.id}`}
          bot={model.bots.find((item) => item.id === modal.id)}
          action={modal.kind}
          onClose={closeModal}
          onManualExit={(request) => model.recordManualExit({ botId: modal.id, ...request })}
          onConfirm={() => {
            const nextError = modal.kind === "pause" ? model.pauseBot(modal.id) : model.stopBot(modal.id);
            if (nextError) setError(nextError);
            else closeModal();
          }}
        />
      ) : null}
      {modal?.kind === "deleteBot" ? <AppDialog open onOpenChange={(open) => !open && closeModal()} title="Delete never-started bot" description={model.bots.find((item) => item.id === modal.id)?.name}>
        <div className="space-y-4 text-[12px]"><p>This removes the unused bot record. No trade history exists.</p><div className="flex justify-end gap-2"><AppButton onClick={closeModal}>Cancel</AppButton><AppButton variant="destructive" onClick={() => { const nextError = model.deleteBot(modal.id); if (nextError) setError(nextError); else { closeModal(); setDetail(null); } }}>Delete bot</AppButton></div></div>
      </AppDialog> : null}
      {modal?.kind === "edit" && model.strategies.some((item) => item.id === modal.id) ? (
        <EditStrategyModal
          key={modal.id}
          strategy={model.strategies.find((item) => item.id === modal.id)}
          onClose={closeModal}
          onSave={(fields) => model.editStrategy(modal.id, fields)}
        />
      ) : null}
      {modal?.kind === "archive" ? (
        <AppDialog
          open
          onOpenChange={(open) => !open && closeModal()}
          title="Archive strategy"
          description={model.strategies.find((item) => item.id === modal.id)?.name}
        >
          <div className="space-y-4 text-[12px]">
            <p>Archiving prevents new launches. Bot history and source backtest remain available.</p>
            <div className="flex justify-end gap-2">
              <AppButton onClick={closeModal}>Cancel</AppButton>
              <AppButton variant="destructive" onClick={() => applyArchive(modal.id, true)}>
                Archive strategy
              </AppButton>
            </div>
          </div>
        </AppDialog>
      ) : null}
      {sourceRun ? <BacktestingInfoModal open run={sourceRun} onClose={closeModal} /> : null}
      {sourceStrategy && !sourceRun ? (
        <AppDialog
          open
          onOpenChange={(open) => !open && closeModal()}
          title="Source backtest · saved snapshot"
          description={model.strategies.find((item) => item.id === modal.id)?.sourceBacktestId}
        >
          <div className="space-y-4 text-[12px]">
            <p className={MUTED}>
              The original run is unavailable in this preview. These are the saved backtest values; a full report cannot be reconstructed from this snapshot.
            </p>
            <InfoGrid rows={[["Backtest", sourceStrategy.sourceBacktestId], ["Created", date(sourceStrategy.backtestCreatedAt)], ["Period", `${sourceStrategy.params.periodFrom || "No data"} → ${sourceStrategy.params.periodTo || "No data"}`], ["ROI", percent(sourceStrategy.result?.roi, true)], ["Max drawdown", percent(sourceStrategy.result?.maxdd)], ["Closed trades", sourceStrategy.result?.trades ?? "No data"], ["Initial capital", amount(sourceStrategy.params.startingCapital)]]} />
            <div className="flex justify-end">
              <AppButton onClick={closeModal}>Close</AppButton>
            </div>
          </div>
        </AppDialog>
      ) : null}
    </div>
  );
}

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppBadge } from "@/components/common/AppBadge";
import { AppButton } from "@/components/common/AppButton";
import { MinimumBalancePreview } from "@/components/common/MinBalancePreview";
import { previewBotStart } from "@/components/common/minimumBalancePreview";
import { AppDialog } from "@/components/common/AppDialog";
import { AppInput } from "@/components/common/AppInput";
import { AppSelect } from "@/components/common/AppSelect";
import { EyeIcon } from "@/components/common/Icons";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Check, ChevronDown, CircleStop, Copy, Pause, Play, Trash2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { BacktestingInfoModal } from "@/features/backtesting/components/BacktestingInfoModal";
import { BtInfoTooltip } from "@/features/backtesting/components/BtInfoTooltip";
import { BotOverview, BotTrades, BotAlerts, DataState, ModeBadge, RuntimeBadge } from "./BotDetails";
import { BotNotifications } from "./BotNotifications";
import { ManualExitControls } from "./ManualExitControls";
import { date, money, percent, amount, accountName, getBotMetrics, filterAndSortBots, hasNumber, pnlTone } from "./botsDisplay";
import { closedTrades, performanceSummary } from "./botsAnalytics";
import { cx, ui } from "@/constants/ui";
import { getCompatibleAccounts } from "./botsModel";

const PANEL = cx(ui.radius, ui.panel, "p-4");
const MUTED = ui.textMuted;
const SUBTLE = ui.textSubtle;

const toOptions = (values, allLabel = "All") => [
  { value: "All", label: allLabel },
  ...values.map((value) => ({ value, label: value })),
];
const unique = (items) => [...new Set(items)].sort();

function CopyIdButton({ id }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = useCallback(
    async (e) => {
      e.stopPropagation();
      if (!id) return;
      try {
        await navigator.clipboard.writeText(String(id));
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1500);
      } catch {
        /* ignore */
      }
    },
    [id],
  );
  return (
    <AppButton
      type="button"
      variant="outline"
      size="icon-xs"
      className="shrink-0"
      onClick={handleCopy}
      title={copied ? "Copied" : `Copy ID ${id}`}
      aria-label={copied ? "Copied" : "Copy bot ID"}
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 shrink-0 text-green-400" />
      ) : (
        <Copy className="h-3.5 w-3.5 shrink-0" />
      )}
    </AppButton>
  );
}

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
    value === "Ready" || value === "Running"
      ? "completed"
      : value === "Starting" || value === "Stopping"
        ? "warning"
        : value === "Needs attention" || value === "Launch failed"
          ? "failed"
          : "muted";
  return (
    <AppBadge status={value} variant={variant}>
      {value}
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
  const [name, setName] = useState(strategy.blueprintName || "");
  const [description, setDescription] = useState("");
  const [mode, setMode] = useState("Dryrun");
  const [capital, setCapital] = useState(String(strategy.params.startingCapital || 1000));
  const [stakeMode, setStakeMode] = useState(strategy.params.stakeMode || "fixed");
  const [stakeValue, setStakeValue] = useState(String(strategy.params.stakeValue || ""));
  const [accountId, setAccountId] = useState("");
  const [error, setError] = useState("");
  const accounts = getCompatibleAccounts(strategy, model.accounts, owner);
  const account = mode === "Live" ? accounts.find((item) => item.id === accountId) || null : null;
  const preview = useMemo(
    () => previewBotStart({
      bot: { mode, capital: Number(capital), stakeMode, stakeValue: Number(stakeValue) },
      strategy,
      account,
    }),
    [mode, capital, stakeMode, stakeValue, strategy, account],
  );
  const change = (setter) => (value) => { setter(value); setError(""); };
  const create = () => {
    if (!preview.ready) return;
    const result = model.launchBot({ source: strategy, name, description, mode, capital, stakeMode, stakeValue, accountId: mode === "Live" ? accountId : "", owner });
    if (result.error) setError(result.error);
    else onLaunched(result.bot.id);
  };
  return <AppDialog open onOpenChange={(open) => !open && onClose()} title="Create bot from backtest" description={`${strategy.sourceBacktestId} · ${strategy.params.pair} · ${strategy.params.timeframe}`} className="max-w-[680px]">
    <div className="max-h-[75vh] space-y-4 overflow-y-auto pr-1 text-[12px]">
      <div className={cx(ui.radius, ui.panelMuted, "p-3", MUTED)}>
        <strong className="text-[#faf7fd]">Source backtest {strategy.sourceBacktestId}</strong> · {strategy.epochLabel}
        <div className="mt-1">Frozen: {strategy.params.exchange} · {strategy.params.mode} · {strategy.params.pair} · {strategy.params.timeframe} · {strategy.params.leverage || 1}×.</div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <AppInput label="Bot name" value={name} onChange={(event) => setName(event.target.value)} />
        <AppSelect label="Trading mode" value={mode} onValueChange={(value) => { change(setMode)(value); if (value !== "Live") setAccountId(""); }} options={[{ value: "Dryrun", label: "Dryrun" }, { value: "Live", label: "Live" }]} />
      </div>
      <div className="space-y-1"><Label htmlFor="create-bot-description">Bot description · optional</Label><Textarea id="create-bot-description" value={description} onChange={(event) => setDescription(event.target.value)} /></div>
      {mode === "Live" ? <AppSelect label="Exchange account · required" value={accountId} onValueChange={change(setAccountId)} options={accounts.map((account) => ({ value: account.id, label: account.name }))} /> : null}
      {mode === "Live" && accounts.length === 0 ? <p className="text-amber-300">Connect a compatible {strategy.params.exchange} {strategy.params.mode} account before creating a Live bot.</p> : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <AppInput type="number" min="0.01" step="0.01" label={mode === "Dryrun" ? "Virtual starting balance (USDT)" : "Allocated capital (USDT)"} value={capital} onChange={(event) => change(setCapital)(event.target.value)} className={preview.highlight === "balance" ? "border-red-500" : ""} />
        <AppInput type="number" label="Maximum open positions" value="1" disabled title="Fixed at one position in this scope" />
        <AppSelect label="Stake mode" value={stakeMode} onValueChange={change(setStakeMode)} options={[{ value: "fixed", label: "Fixed USDT" }, { value: "relative", label: "Relative %" }]} />
        <AppInput type="number" min="0.01" step="0.01" label={stakeMode === "relative" ? "Stake value (%)" : "Stake value (USDT)"} value={stakeValue} onChange={(event) => change(setStakeValue)(event.target.value)} className={preview.highlight === "stake" ? "border-red-500" : ""} />
      </div>
      <p className="rounded-md border-l-2 border-violet-400 bg-violet-500/10 p-3 text-[#b8aecc]">Backtest capital: {money(strategy.params.startingCapital)} USDT. Changes to capital or stake mean historical results describe different conditions.</p>
      {mode === "Live" ? <p className="text-amber-200">Live account balance is unavailable in real time. The preview checks the configured allocation and illustrative minimum only; actual exchange funds are unverified.</p> : null}
      <MinimumBalancePreview preview={preview} />
      {error ? <p role="alert" className="text-red-400">{error}</p> : null}
      <div className="flex justify-end gap-2"><AppButton onClick={onClose}>Cancel</AppButton><AppButton variant="default" disabled={!preview.ready || (mode === "Live" && !accountId)} onClick={create}>Create bot · Ready for start</AppButton></div>
    </div>
  </AppDialog>;
}

function StartBotModal({ bot, strategy, account, onClose, onConfirm }) {
  const preview = useMemo(() => previewBotStart({ bot, strategy, account }), [bot, strategy, account]);
  const modeLabel = bot.mode === "Live" ? "Live" : "Dry Run";
  return (
    <AppDialog
      open
      onOpenChange={(open) => !open && onClose()}
      title="Start bot"
      description={`${bot.name} · ${modeLabel}`}
      className="max-w-[520px]"
    >
      <div className="space-y-4 text-[12px]">
        <MinimumBalancePreview preview={preview} />
        {bot.mode === "Live" ? <p className="text-amber-200">This preview cannot confirm current exchange funds. Start checks whether this account and pair are already occupied; shared account capital limits need a backend contract.</p> : null}
        <div className="flex justify-end gap-2">
          <AppButton onClick={onClose}>Cancel</AppButton>
          <AppButton variant="default" disabled={!preview.ready} onClick={onConfirm}>
            Start
          </AppButton>
        </div>
      </div>
    </AppDialog>
  );
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
            <DataTable headers={["Connection", "Exchange / market", "Status"]}>
              {model.accounts
                .filter((account) => account.owner === owner)
                .map((account) => (
                  <tr key={account.id} className="border-b border-[rgba(60,40,80,0.25)]">
                    <td className="px-4 py-2.5">{account.name}</td>
                    <td className="px-2 py-2.5">
                      {account.exchange} · {account.market}
                    </td>
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
  const [selectedExit, setSelectedExit] = useState(null);
  const [confirmAll, setConfirmAll] = useState(false);
  const [notice, setNotice] = useState("");
  const exitFormRef = useRef(null);
  const stopping = action === "stop";
  useEffect(() => {
    exitFormRef.current?.scrollIntoView({ block: "nearest" });
  }, [selectedExit?.position?.id, selectedExit?.action]);
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
        <div className="overflow-auto rounded-md border border-border">
          <table className="w-full min-w-[640px] text-left"><thead className="bg-secondary text-muted-foreground"><tr><th className="px-3 py-2">Open trade</th><th className="px-3 py-2">Entry / Current</th><th className="px-3 py-2">Exchange stop</th><th className="px-3 py-2">Actions</th></tr></thead><tbody>
            {bot.positions.map((position) => {
              const exitOpen = selectedExit?.position?.id === position.id;
              return (
                <React.Fragment key={position.id}>
                  <tr className={cx("border-t border-border", exitOpen && "bg-violet-500/10")}>
                    <td className="px-3 py-2">{position.id} · {position.pair}</td>
                    <td className="px-3 py-2">{money(position.entryPrice)} / {money(position.currentPrice)}</td>
                    <td className="px-3 py-2">{position.stopOnExchange == null ? "No data" : position.stopOnExchange ? "Placed" : "Not placed"}</td>
                    <td className="px-3 py-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <AppButton variant="outline" size="sm" aria-expanded={exitOpen}>
                            Exit
                            <ChevronDown className="size-3.5 opacity-70" />
                          </AppButton>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="min-w-[180px]">
                          <DropdownMenuItem onSelect={() => setSelectedExit({ position, action: "market" })}>
                            Force exit market
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => setSelectedExit({ position, action: "limit" })}>
                            Exit limit
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      {position.manualExitPreview ? <div className="mt-1 max-w-40 whitespace-normal text-[10px] text-amber-200">{position.manualExitPreview} · preview</div> : null}
                    </td>
                  </tr>
                  {exitOpen ? (
                    <tr className="border-t border-violet-500/20 bg-violet-500/5">
                      <td colSpan={4} className="px-3 py-2">
                        <div ref={exitFormRef}>
                          <ManualExitControls
                            key={`${position.id}-${selectedExit.action}`}
                            hideTitle
                            lockedAction={selectedExit.action}
                            position={position}
                            onSubmit={(request) => {
                              const result = onManualExit(request);
                              if (!result) setNotice(`Preview action recorded for ${position.id}.`);
                              return result;
                            }}
                            onCancel={() => setSelectedExit(null)}
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
        {confirmAll && bot.positions.length ? (
          <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3">
            <p>
              Record a market-exit preview for all {bot.positions.length} open trades? No exchange
              order will be sent.
            </p>
            <div className="mt-2 flex justify-end gap-2">
              <AppButton onClick={() => setConfirmAll(false)}>Cancel</AppButton>
              <AppButton
                variant="destructive"
                onClick={() => {
                  bot.positions.forEach((position) =>
                    onManualExit({ positionId: position.id, action: "market" }),
                  );
                  setNotice(
                    `Force exit all market preview recorded for ${bot.positions.length} trades.`,
                  );
                  setConfirmAll(false);
                }}
              >
                Confirm all preview exits
              </AppButton>
            </div>
          </div>
        ) : null}
        <div className="flex flex-wrap justify-end gap-2">
          <AppButton onClick={onClose}>Cancel</AppButton>
          {bot.positions.length ? (
            <AppButton variant="destructive" onClick={() => setConfirmAll(true)}>
              Force exit all market
            </AppButton>
          ) : null}
          <AppButton variant={stopping ? "destructive" : "default"} onClick={onConfirm}>
            Confirm {stopping ? "stop" : "pause"}
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
  onOpenBacktestSource,
}) {
  const [detail, setDetail] = useState(null);
  const [detailTab, setDetailTab] = useState("Overview");
  const [chartFocus, setChartFocus] = useState(null);
  const [modal, setModal] = useState(null);
  const [error, setError] = useState("");
  const [botSearch, setBotSearch] = useState("");
  const [botSort, setBotSort] = useState("latest");
  const [botFilters, setBotFilters] = useState({ mode: "All", status: "All", owner: "All", account: "All" });

  useEffect(() => { onDetailChange?.(Boolean(detail)); }, [detail, onDetailChange]);
  useEffect(() => {
    if (!openTarget?.source) return;
    setDetail(null);
    setModal({ kind: "launch", source: openTarget.source });
    onClearOpenTarget?.(null);
  }, [openTarget, onClearOpenTarget]);

  const bot = detail ? model.bots.find((item) => item.id === detail.id) : null;
  const botStrategy = bot?.source || null;
  const startTarget = modal?.kind === "start" ? model.bots.find((item) => item.id === modal.id) : null;
  const startStrategy = startTarget?.source || null;
  const startAccount = startTarget?.accountId ? model.accounts.find((item) => item.id === startTarget.accountId) || null : null;
  const botStats = bot ? performanceSummary(bot) : null;
  const viewTradeOnOverview = (trade) => {
    setChartFocus((prev) => ({ ...trade, focusRequest: (prev?.focusRequest || 0) + 1 }));
    setDetailTab("Overview");
  };
  const botRows = useMemo(
    () => filterAndSortBots(model.bots, model.accounts, botFilters, botSearch, botSort),
    [model.bots, model.accounts, botFilters, botSearch, botSort],
  );
  const openBot = (id) => {
    setChartFocus(null);
    setDetail({ id });
    setDetailTab("Overview");
    setError("");
  };
  const closeModal = () => { setModal(null); setError(""); };
  const sourceStrategy = modal?.kind === "source" ? model.bots.find((item) => item.id === modal.id)?.source : null;
  const sourceRun = sourceStrategy ? backtestingState?.getRuns(sourceStrategy.epochId).find((run) => run.id === sourceStrategy.sourceBacktestId) : null;
  const filtersClearable = Object.values(botFilters).some((value) => value !== "All") || Boolean(botSearch.trim());

  return (
    <div className="space-y-5">
      {!detail ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[rgba(60,40,80,0.35)] pb-3">
            <span className="text-[12px] text-muted-foreground">Manage bot runs and their source backtests.</span>
            <AppButton onClick={() => setModal({ kind: "accounts" })}>Exchange accounts</AppButton>
          </div>
          {error ? <p role="alert" className="text-[12px] text-red-400">{error}</p> : null}
            <section className={cx(ui.radius, ui.panel, "overflow-hidden")} aria-label="Bots">
              <FilterBar
                countLabel={`${botRows.length} of ${model.bots.length} bots`}
                action={
                  <AppButton
                    size="sm"
                    disabled={!filtersClearable}
                    onClick={() =>
                      { setBotFilters({
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

              <DataTable className="min-w-[1280px]" headers={["Bot", "Pair / timeframe", "Mode / account", "Status / data", "Equity / Balance", "P&L", "Trades / W–L", "Profit reserve", "Owner", "Actions"]}>
                {!botRows.length ? <EmptyCell columns={10}>No bots match the current filters.</EmptyCell> : null}
                {botRows.map((item) => {
                  const source = item.source;
                  const metrics = getBotMetrics(item);
                  const history = closedTrades(item);
                  const outcomesKnown = Array.isArray(item.trades) && history.every((trade) => hasNumber(trade.pnl));
                  const wins = history.filter((trade) => Number(trade.pnl) > 0).length;
                  const losses = history.filter((trade) => Number(trade.pnl) < 0).length;
                  const reserveEnabled = item.profitReserving === true || Number(source?.params?.profitReserving) > 0;
                  const reserve = hasNumber(item.profitReserve) ? Number(item.profitReserve) : reserveEnabled ? null : 0;
                  return <tr key={item.id} className="border-b border-border">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="inline-flex items-center gap-1">
                          <CopyIdButton id={item.id} />
                          <AppButton size="icon" className="h-8 w-8 shrink-0" aria-label={`View ${item.name} ${item.mode}`} onClick={() => openBot(item.id)}>
                            <EyeIcon />
                          </AppButton>
                        </div>
                        <AppButton variant="link" className="h-auto p-0 text-left font-medium text-violet-200" onClick={() => openBot(item.id)}>
                          {item.name}
                        </AppButton>
                      </div>
                    </td>
                    <td className="px-2 py-3 whitespace-nowrap">
                      {source?.params?.pair || "No data"} · {source?.params?.timeframe || "No data"}
                    </td>
                    <td className="px-2 py-3 whitespace-nowrap">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <ModeBadge mode={item.mode} />
                        {item.mode !== "Dryrun" ? (
                          <span className="text-[11px] text-muted-foreground">{accountName(item, model.accounts)}</span>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-2 py-3"><BotStatusCell bot={item} /></td>
                    <td className="px-2 py-3 text-right tabular-nums whitespace-nowrap"><div className="font-medium" title="Equity = balance + open P&L; includes the profit reserve">{amount(metrics.equity)}</div><div className="mt-1 text-[11px] text-muted-foreground" title="Balance = initial bot capital + closed P&L; includes committed funds and profit reserve">Balance {money(metrics.balance)}</div><div className="text-[10px] text-muted-foreground">Initial {money(item.capital)}</div></td>
                    <td className="px-2 py-3 text-right tabular-nums whitespace-nowrap"><div className={cx("font-medium", pnlTone(metrics.totalPnl))}>{amount(metrics.totalPnl, true)}</div><div className={cx("mt-0.5 text-[11px]", pnlTone(metrics.returnPct))} title="Total P&L / initial bot capital × 100">{percent(metrics.returnPct, true)} on initial capital</div><div className="mt-1 text-[11px]"><span className="text-muted-foreground">Open </span><span className={pnlTone(metrics.unrealized)}>{money(metrics.unrealized, true)}</span><span className="text-muted-foreground"> · Closed </span><span className={pnlTone(metrics.realized)}>{money(metrics.realized, true)}</span></div><div className="text-[10px] text-muted-foreground" title={`${date(item.startedAt)} → ${date(item.stoppedAt || item.updatedAt)}`}>Lifetime · USDT</div></td>
                    <td className="px-2 py-3 whitespace-nowrap"><div>{item.positions?.length ?? "No data"} open · {item.closedTradeCount ?? "No data"} closed</div><div className="mt-1 text-[11px]" title="Profitable / losing fully closed trades. Breakeven trades are excluded from W/L.">{outcomesKnown ? <><span className="text-green-400">{wins} W</span><span className="text-muted-foreground"> / </span><span className="text-red-400">{losses} L</span></> : <span className="text-muted-foreground">W/L · No data</span>}</div></td>
                    <td className="px-2 py-3 text-right tabular-nums whitespace-nowrap" title="Profit withheld from new entries; remains part of balance and equity. Separate from funds committed to positions."><div>{amount(reserve)}</div><div className="mt-1 text-[10px] text-muted-foreground">{reserveEnabled ? "Reserving enabled" : "Not enabled"}</div></td>
                    <td className="px-2 py-3">{item.owner}</td>
                    <td className="sticky right-0 z-10 border-l border-[rgba(60,40,80,0.35)] bg-[#170f29] px-2 py-3">
                      <BotRowActions
                        bot={item}
                        onStart={() => setModal({ kind: "start", id: item.id })}
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
        </>
      ) : null}

      {bot && botStrategy ? (
        <section className="space-y-4">
          <AppButton variant="ghost" onClick={() => setDetail(null)}>
            ← Bots
          </AppButton>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-[16px] font-semibold text-[#faf7fd]">{bot.name}</h2>
              {bot.description ? <p className="mt-1 text-[12px] text-muted-foreground">{bot.description}</p> : null}
              <div className={cx("mt-2 flex flex-wrap items-center gap-2 text-[12px]", MUTED)}>
                <ModeBadge mode={bot.mode} />
                <Status value={bot.status} />
                <RuntimeBadge bot={bot} />
                <span>
                  {botStrategy.params.exchange} · {botStrategy.params.pair} ·{" "}
                  {botStrategy.params.timeframe}
                </span>
                <span>Account: {accountName(bot, model.accounts)}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <AppButton
                variant="default"
                onClick={() => setModal({ kind: "launch", source: botStrategy })}
              >
                Create new bot
              </AppButton>
              {bot.status === "Ready for start" ? <><AppButton variant="default" title="Prepare and manually start this bot" onClick={() => setModal({ kind: "start", id: bot.id })}><Play aria-hidden />Start bot</AppButton><AppButton variant="destructive" title="Delete this never-started bot" onClick={() => setModal({ kind: "deleteBot", id: bot.id })}>Delete bot</AppButton></> : null}
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

              <div className="grid items-start gap-3 md:grid-cols-2 xl:grid-cols-4">
                <OverviewSectionCard
                  title="Bot configuration"
                  rows={[
                    ["Mode", bot.mode === "Dryrun" ? "Dry-run" : bot.mode === "Live" ? "Live" : bot.mode || null],
                    ["Funding source / Account", accountName(bot, model.accounts)],
                    ["Bot capital", amount(bot.capital)],
                    [
                      "Fee source",
                      bot.feeSource === "account"
                        ? accountName(bot, model.accounts)
                        : `${botStrategy.params.exchange} exchange rates`,
                      "In Dryrun, an optional exchange account supplies fee rates only; trades use virtual funds.",
                    ],
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
                    [
                      "Market & Leverage",
                      botStrategy.params.mode
                        ? botStrategy.params.mode === "futures" && hasNumber(botStrategy.params.leverage)
                          ? `${botStrategy.params.mode} · ${botStrategy.params.leverage}×`
                          : botStrategy.params.mode
                        : null,
                    ],
                    ["Pair", botStrategy.params.pair || null],
                    ["Timeframe", botStrategy.params.timeframe || null],
                  ]}
                />
                <OverviewSectionCard
                  title="Backtest source"
                  rows={[
                    [
                      "Strategy",
                      botStrategy.blueprintName || botStrategy.versionLineage ? (
                        <span key="cfg-strategy" className="inline-flex flex-col items-end gap-0.5">
                          {botStrategy.blueprintName ? (
                            onOpenBlueprintStrategy && botStrategy.sourceStrategyId != null ? (
                              <AppButton
                                variant="link"
                                className="h-auto p-0 text-violet-200"
                                onClick={() => onOpenBlueprintStrategy(botStrategy.sourceStrategyId)}
                              >
                                {botStrategy.blueprintName}
                              </AppButton>
                            ) : (
                              <span>{botStrategy.blueprintName}</span>
                            )
                          ) : null}
                          {botStrategy.versionLineage ? (
                            <span className="text-[10px] text-muted-foreground">{botStrategy.versionLineage}</span>
                          ) : null}
                        </span>
                      ) : null,
                    ],
                    ["Epoch", botStrategy.epochLabel || null],
                    [
                      "Backtest",
                      botStrategy.sourceBacktestId ? (
                        <span key="cfg-backtest" className="inline-flex items-center gap-1.5">
                          <span className="tabular-nums">{botStrategy.sourceBacktestId}</span>
                          <AppButton
                            type="button"
                            variant="outline"
                            size="icon-xs"
                            className="shrink-0"
                            title="Open in Strategy · Stage 5"
                            aria-label={`Open backtest ${botStrategy.sourceBacktestId} in Stage 5`}
                            onClick={() => {
                              if (onOpenBacktestSource) {
                                onOpenBacktestSource({
                                  strategyId: botStrategy.sourceStrategyId,
                                  epochId: botStrategy.epochId,
                                  backtestId: botStrategy.sourceBacktestId,
                                });
                                return;
                              }
                              setModal({ kind: "source", id: bot.id });
                            }}
                          >
                            <EyeIcon />
                          </AppButton>
                        </span>
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
                    bot.stoppedAt ? ["Stopped", date(bot.stoppedAt)] : null,
                  ]}
                />
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      <p className={cx("text-[11px]", SUBTLE)}>
        UI preview · Illustrative bot results and trades. No exchange connection or
        orders are performed.
      </p>

      {modal?.kind === "launch" && modal.source ? (
        <LaunchModal
          key={modal.source.sourceBacktestId}
          strategy={modal.source}
          model={model}
          owner={currentUser}
          onClose={closeModal}
          onLaunched={(id) => { closeModal(); openBot(id); }}
        />
      ) : null}
      {startTarget ? (
        <StartBotModal
          key={startTarget.id}
          bot={startTarget}
          strategy={startStrategy}
          account={startAccount}
          onClose={closeModal}
          onConfirm={() => {
            const nextError = model.startBot(startTarget.id);
            if (nextError) setError(nextError);
            else closeModal();
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
      {sourceRun ? <BacktestingInfoModal open run={sourceRun} onClose={closeModal} /> : null}
      {sourceStrategy && !sourceRun ? (
        <AppDialog
          open
          onOpenChange={(open) => !open && closeModal()}
          title="Source backtest · saved snapshot"
          description={sourceStrategy.sourceBacktestId}
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

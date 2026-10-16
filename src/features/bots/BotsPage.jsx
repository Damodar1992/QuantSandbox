import React, { useEffect, useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { AppBadge } from "@/components/common/AppBadge";
import { AppButton } from "@/components/common/AppButton";
import { AppDialog } from "@/components/common/AppDialog";
import { AppInput } from "@/components/common/AppInput";
import { AppSelect } from "@/components/common/AppSelect";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cx, ui } from "@/constants/ui";
import { StrategyTemplatePreview } from "@/features/builder/components/StrategyTemplatePreview";
import { countStrategyBots, getCompatibleAccounts } from "./botsModel";

const PANEL = cx(ui.radius, ui.panel, "p-4");
const MUTED = ui.textMuted;
const SUBTLE = ui.textSubtle;

const toOptions = (values) => [
  { value: "All", label: "All" },
  ...values.map((value) => ({ value, label: value })),
];
const unique = (items) => [...new Set(items)].sort();
const date = (value) =>
  value
    ? new Date(value).toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";
const money = (value) =>
  Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
const percent = (value, signed = false) =>
  value == null ? "No data" : `${signed && value > 0 ? "+" : ""}${Number(value).toFixed(1)}%`;
const accountName = (bot, accounts) =>
  bot.mode === "Dryrun"
    ? "Virtual wallet"
    : accounts.find((account) => account.id === bot.accountId)?.name || "Account unavailable";

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
      {value}
    </AppBadge>
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

function EmptyCell({ columns, children }) {
  return (
    <tr>
      <td colSpan={columns} className="px-4 py-12 text-center text-[12px] text-[#8c8c8c]">
        {children}
      </td>
    </tr>
  );
}

function DataTable({ headers, children }) {
  return (
    <div className="overflow-auto">
      <table className="w-full border-collapse text-[12px]">
        <thead className="bg-[#1f1f1f] text-left text-[12px] text-[#8c8c8c]">
          <tr>
            {headers.map((label, index) => (
              <th
                key={label}
                className={cx(
                  "py-3 font-medium border-b border-[#303030]",
                  index === 0 ? "px-4" : "px-2",
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
        "flex flex-wrap items-center gap-2 px-4 py-3",
        ui.panelMuted,
        "border-0 border-b",
        ui.divider,
      )}
    >
      <div className={cx("text-[12px]", SUBTLE)}>{countLabel}</div>
      <div className="ml-auto flex flex-wrap items-center gap-2">
        {children}
        {action}
      </div>
    </div>
  );
}

function LaunchModal({ strategy, model, owner, onClose, onLaunched }) {
  const [name, setName] = useState(`${strategy.name} · Dryrun`);
  const [mode, setMode] = useState("Dryrun");
  const [capital, setCapital] = useState(String(strategy.params.startingCapital || 1000));
  const [maxOpenTrades, setMaxOpenTrades] = useState("2");
  const [accountId, setAccountId] = useState("");
  const [error, setError] = useState("");
  const accounts = getCompatibleAccounts(strategy, model.accounts, owner);

  const changeMode = (next) => {
    if (name === `${strategy.name} · ${mode}`) setName(`${strategy.name} · ${next}`);
    setMode(next);
    setError("");
  };

  const launch = () => {
    const result = model.launchBot({
      strategyId: strategy.id,
      name,
      mode,
      capital,
      maxOpenTrades,
      accountId,
      owner,
    });
    if (result.error) setError(result.error);
    else onLaunched(result.bot.id);
  };

  return (
    <AppDialog
      open
      onOpenChange={(open) => !open && onClose()}
      title="Launch bot"
      description={`${strategy.name} · ${strategy.params.pair} · ${strategy.params.timeframe}`}
      className="max-w-[620px]"
    >
      <div className="space-y-4 text-[12px]">
        <div className={cx(ui.radius, ui.panelMuted, "p-3", MUTED)}>
          Source backtest{" "}
          <strong className="text-[#faf7fd]">{strategy.sourceBacktestId}</strong> · {strategy.epochLabel}
          <br />
          Frozen settings: {strategy.params.exchange} · {strategy.params.mode} ·{" "}
          {strategy.params.leverage || 1}× · Stake {strategy.params.stakeValue}
          {strategy.params.stakeMode === "relative" ? "%" : " USDT"}.
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <AppInput label="Bot name" value={name} onChange={(event) => setName(event.target.value)} />
          <AppSelect
            label="Trading mode"
            value={mode}
            onValueChange={changeMode}
            options={[
              { value: "Dryrun", label: "Dryrun" },
              { value: "Live", label: "Live" },
            ]}
          />
        </div>
        {mode === "Live" ? (
          <>
            <AppSelect
              label="Exchange account"
              value={accountId}
              onValueChange={setAccountId}
              placeholder="Select account"
              options={accounts.map((account) => ({
                value: account.id,
                label: `${account.name} · ${money(account.balance)} USDT available`,
              }))}
            />
            {accounts.length === 0 ? (
              <p className="text-amber-300">
                No compatible account. Connect an account for {strategy.params.exchange}{" "}
                {strategy.params.mode}.
              </p>
            ) : null}
          </>
        ) : null}
        <AppInput
          type="number"
          min={strategy.params.stakeMode === "relative" ? 0.01 : strategy.params.stakeValue || 1}
          step="0.01"
          label={mode === "Dryrun" ? "Virtual starting balance (USDT)" : "Allocated capital (USDT)"}
          value={capital}
          onChange={(event) => setCapital(event.target.value)}
        />
        <AppInput
          type="number"
          min="1"
          step="1"
          label="Maximum open positions"
          value={maxOpenTrades}
          onChange={(event) => setMaxOpenTrades(event.target.value)}
        />
        <div className="rounded-md border-l-2 border-violet-400 bg-violet-500/10 p-3 text-[#b8aecc]">
          Backtest capital: {money(strategy.params.startingCapital)} USDT.{" "}
          {Number(capital) !== Number(strategy.params.startingCapital)
            ? "The selected capital differs from the source backtest. "
            : null}
          {mode === "Live"
            ? "Live sends real orders through the selected account."
            : "Dryrun simulates trades with virtual funds."}
        </div>
        {error ? (
          <p role="alert" className="text-red-400">
            {error}
          </p>
        ) : null}
        <div className="flex justify-end gap-2">
          <AppButton onClick={onClose}>Cancel</AppButton>
          <AppButton variant="default" onClick={launch}>
            Launch {mode}
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

function StopModal({ bot, onClose, onConfirm }) {
  const hasPositions = bot.positions.length > 0;
  return (
    <AppDialog
      open
      onOpenChange={(open) => !open && onClose()}
      title="Stop bot"
      description={`${bot.name} · ${bot.positions.length} open positions`}
    >
      <div className="space-y-4 text-[12px]">
        {hasPositions ? (
          <p className={MUTED}>
            New entries are disabled. Existing positions remain managed until they close, then the
            bot stops.
          </p>
        ) : (
          <p className={MUTED}>No open positions. The bot stops after active orders are cleared.</p>
        )}
        <div className="flex justify-end gap-2">
          <AppButton onClick={onClose}>Cancel</AppButton>
          <AppButton variant="destructive" onClick={onConfirm}>
            Confirm stop
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

export function BotsPage({ model, currentUser = "bogdan", openTarget, onClearOpenTarget }) {
  const [tab, setTab] = useState("strategies");
  const [detail, setDetail] = useState(null);
  const [detailTab, setDetailTab] = useState("Overview");
  const [modal, setModal] = useState(null);
  const [error, setError] = useState("");
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
  });

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

  const strategyRows = useMemo(
    () =>
      model.strategies.filter(
        (item) =>
          (strategyFilters.owner === "All" || item.owner === strategyFilters.owner) &&
          (strategyFilters.status === "All" || item.status === strategyFilters.status) &&
          (strategyFilters.exchange === "All" || item.params.exchange === strategyFilters.exchange),
      ),
    [model.strategies, strategyFilters],
  );

  const botRows = useMemo(
    () =>
      model.bots.filter(
        (item) =>
          (botFilters.strategy === "All" || item.strategyId === botFilters.strategy) &&
          (botFilters.mode === "All" || item.mode === botFilters.mode) &&
          (botFilters.status === "All" || item.status === botFilters.status) &&
          (botFilters.owner === "All" || item.owner === botFilters.owner),
      ),
    [model.bots, botFilters],
  );

  const openStrategy = (id, subtab = "Overview") => {
    setTab("strategies");
    setDetail({ kind: "strategy", id });
    setDetailTab(subtab);
    setError("");
  };
  const openBot = (id) => {
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
  const filtersClearable = Object.values(
    tab === "strategies" ? strategyFilters : botFilters,
  ).some((value) => value !== "All");

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
                      setStrategyFilters({ owner: "All", status: "All", exchange: "All" })
                    }
                  >
                    Clear filters
                  </AppButton>
                }
              >
                <AppSelect
                  value={strategyFilters.owner}
                  onValueChange={(owner) => setStrategyFilters((prev) => ({ ...prev, owner }))}
                  options={toOptions(unique(model.strategies.map((item) => item.owner)))}
                  className="w-[130px]"
                  triggerClassName="h-8 text-[12px]"
                  aria-label="Filter by owner"
                />
                <AppSelect
                  value={strategyFilters.status}
                  onValueChange={(status) => setStrategyFilters((prev) => ({ ...prev, status }))}
                  options={toOptions(["Active", "Archive"])}
                  className="w-[130px]"
                  triggerClassName="h-8 text-[12px]"
                  aria-label="Filter by status"
                />
                <AppSelect
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

              <DataTable
                headers={[
                  "Strategy",
                  "Market",
                  "Backtest ROI",
                  "Max DD",
                  "Bots",
                  "Owner",
                  "Status",
                  "Source",
                  "Actions",
                ]}
              >
                {strategyRows.length === 0 ? (
                  <EmptyCell columns={9}>
                    No strategies match the current filters. Create one from a successful Stage 5
                    backtest.
                  </EmptyCell>
                ) : null}
                {strategyRows.map((item) => {
                  const counts = countStrategyBots(item.id, model.bots);
                  return (
                    <tr key={item.id} className="border-b border-[rgba(60,40,80,0.25)]">
                      <td className="px-4 py-2.5">
                        <AppButton
                          variant="link"
                          className="h-auto p-0 text-left font-medium text-violet-200"
                          onClick={() => openStrategy(item.id)}
                        >
                          {item.name}
                        </AppButton>
                        <div className={cx("text-[11px]", MUTED)}>
                          {item.params.exchange} · {item.params.pair} · {item.params.timeframe}
                        </div>
                      </td>
                      <td className="px-2 py-2.5">
                        {item.params.mode} · {item.params.leverage || 1}×
                      </td>
                      <td className="px-2 py-2.5 text-green-400">{percent(item.result.roi, true)}</td>
                      <td className="px-2 py-2.5">{percent(item.result.maxdd)}</td>
                      <td className="px-2 py-2.5">
                        <AppButton
                          variant="link"
                          className="h-auto p-0 text-violet-200"
                          onClick={() => openStrategy(item.id, "Bots")}
                        >
                          {counts.active} active / {counts.inactive} inactive
                        </AppButton>
                      </td>
                      <td className="px-2 py-2.5">{item.owner}</td>
                      <td className="px-2 py-2.5">
                        <Status value={item.status} />
                      </td>
                      <td className="px-2 py-2.5">
                        {item.blueprintName}
                        <div className={cx("text-[11px]", MUTED)}>
                          {item.sourceBacktestId} · {item.epochLabel}
                        </div>
                      </td>
                      <td className="px-2 py-2.5">
                        <div className="flex flex-wrap gap-1">
                          <AppButton onClick={() => openStrategy(item.id)}>Open</AppButton>
                          <AppButton
                            disabled={item.status !== "Active"}
                            onClick={() => openLaunch(item.id)}
                          >
                            Launch
                          </AppButton>
                          <AppButton
                            disabled={item.status === "Active" && counts.active > 0}
                            onClick={() =>
                              item.status === "Archive"
                                ? applyArchive(item.id, false)
                                : setModal({ kind: "archive", id: item.id })
                            }
                          >
                            {item.status === "Archive" ? "Restore" : "Archive"}
                          </AppButton>
                        </div>
                      </td>
                    </tr>
                  );
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
                      setBotFilters({
                        strategy: "All",
                        mode: "All",
                        status: "All",
                        owner: "All",
                      })
                    }
                  >
                    Clear filters
                  </AppButton>
                }
              >
                <AppSelect
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
                  value={botFilters.mode}
                  onValueChange={(mode) => setBotFilters((prev) => ({ ...prev, mode }))}
                  options={toOptions(["Dryrun", "Live"])}
                  className="w-[120px]"
                  triggerClassName="h-8 text-[12px]"
                  aria-label="Filter by mode"
                />
                <AppSelect
                  value={botFilters.status}
                  onValueChange={(status) => setBotFilters((prev) => ({ ...prev, status }))}
                  options={toOptions([
                    "Starting",
                    "Running",
                    "Stopping",
                    "Stopped",
                    "Launch failed",
                    "Needs attention",
                  ])}
                  className="w-[150px]"
                  triggerClassName="h-8 text-[12px]"
                  aria-label="Filter by status"
                />
                <AppSelect
                  value={botFilters.owner}
                  onValueChange={(owner) => setBotFilters((prev) => ({ ...prev, owner }))}
                  options={toOptions(unique(model.bots.map((item) => item.owner)))}
                  className="w-[120px]"
                  triggerClassName="h-8 text-[12px]"
                  aria-label="Filter by owner"
                />
              </FilterBar>

              <DataTable
                headers={[
                  "Bot",
                  "Strategy",
                  "Mode / account",
                  "Status",
                  "Owner",
                  "Capital",
                  "P&L",
                  "Action",
                ]}
              >
                {botRows.length === 0 ? (
                  <EmptyCell columns={8}>No bots match the current filters.</EmptyCell>
                ) : null}
                {botRows.map((item) => {
                  const source = model.strategies.find((entry) => entry.id === item.strategyId);
                  const totalPnl =
                    item.realizedPnl +
                    item.positions.reduce((sum, position) => sum + position.unrealizedPnl, 0);
                  return (
                    <tr key={item.id} className="border-b border-[rgba(60,40,80,0.25)]">
                      <td className="px-4 py-2.5">
                        <AppButton
                          variant="link"
                          className="h-auto p-0 font-medium text-violet-200"
                          onClick={() => openBot(item.id)}
                        >
                          {item.name}
                        </AppButton>
                        <div className={cx("text-[11px]", MUTED)}>
                          {source?.params.pair} · {date(item.startedAt)}
                        </div>
                      </td>
                      <td className="px-2 py-2.5">
                        <AppButton
                          variant="link"
                          className="h-auto p-0 text-violet-200"
                          onClick={() => openStrategy(item.strategyId)}
                        >
                          {source?.name || "Unavailable"}
                        </AppButton>
                      </td>
                      <td className="px-2 py-2.5">
                        {item.mode}
                        <div className={cx("text-[11px]", MUTED)}>
                          {accountName(item, model.accounts)}
                        </div>
                      </td>
                      <td className="px-2 py-2.5">
                        <Status value={item.status} />
                      </td>
                      <td className="px-2 py-2.5">{item.owner}</td>
                      <td className="px-2 py-2.5">{money(item.capital)} USDT</td>
                      <td
                        className={cx(
                          "px-2 py-2.5",
                          totalPnl < 0 ? "text-red-400" : "text-green-400",
                        )}
                      >
                        {money(totalPnl)} USDT
                      </td>
                      <td className="px-2 py-2.5">
                        <AppButton onClick={() => openBot(item.id)}>Open</AppButton>
                      </td>
                    </tr>
                  );
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
            <div>
              <h2 className="text-[16px] font-semibold text-[#faf7fd]">{strategy.name}</h2>
              <div className={cx("mt-2 flex flex-wrap items-center gap-2 text-[12px]", MUTED)}>
                <Status value={strategy.status} />
                <span>Owner: {strategy.owner}</span>
                <span>
                  {strategy.params.exchange} · {strategy.params.pair} · {strategy.params.timeframe}
                </span>
              </div>
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
                Launch bot
              </AppButton>
            </div>
          </div>

          <PillTabs
            value={detailTab}
            onChange={setDetailTab}
            items={["Overview", "Parameters", "Strategy code", "Bots"].map((item) => ({
              value: item,
              label: item,
            }))}
          />

          {error ? (
            <p role="alert" className="text-[12px] text-red-400">
              {error}
            </p>
          ) : null}

          {detailTab === "Overview" ? (
            <div className="grid gap-4 lg:grid-cols-2">
              <div className={PANEL}>
                <h3 className="mb-4 text-[12px] font-medium text-[#faf7fd]">Strategy information</h3>
                <InfoGrid
                  rows={[
                    ["Description", strategy.description || "—"],
                    ["Source blueprint", strategy.blueprintName],
                    ["Version lineage", strategy.versionLineage],
                    ["Selected epoch", strategy.epochLabel],
                    [
                      "Stage 5 validation",
                      <AppButton
                        key="source-backtest"
                        variant="link"
                        className="h-auto p-0 text-violet-200"
                        onClick={() => setModal({ kind: "source", id: strategy.id })}
                      >
                        {strategy.sourceBacktestId} · Success
                      </AppButton>,
                    ],
                    ["Saved on", date(strategy.savedAt)],
                  ]}
                />
              </div>
              <div className={PANEL}>
                <h3 className="mb-4 text-[12px] font-medium text-[#faf7fd]">Source backtest</h3>
                <InfoGrid
                  rows={[
                    [
                      "Period",
                      `${strategy.params.periodFrom || "—"} – ${strategy.params.periodTo || "—"}`,
                    ],
                    ["ROI", percent(strategy.result.roi, true)],
                    ["Max drawdown", percent(strategy.result.maxdd)],
                    ["Closed trades", strategy.result.trades ?? "No data"],
                    ["Starting capital", `${money(strategy.params.startingCapital)} USDT`],
                    [
                      "Linked bots",
                      `${countStrategyBots(strategy.id, model.bots).active} active / ${countStrategyBots(strategy.id, model.bots).inactive} inactive`,
                    ],
                  ]}
                />
              </div>
            </div>
          ) : null}

          {detailTab === "Parameters" ? (
            <div className="grid gap-4 lg:grid-cols-2">
              <div className={PANEL}>
                <h3 className="mb-4 text-[12px] font-medium text-[#faf7fd]">Stage 1–4 parameters</h3>
                {[1, 2, 3].map((stage) => {
                  const block = strategy.stageConfig?.[`stage${stage}`];
                  return (
                    <div
                      className={cx(
                        "flex justify-between border-b border-[rgba(60,40,80,0.35)] py-2 text-[12px]",
                      )}
                      key={stage}
                    >
                      <span>Stage {stage} · {block?.label || "Frozen configuration"}</span>
                      <span className={MUTED}>{block?.indicators?.length ?? 0} indicators</span>
                    </div>
                  );
                })}
                <div className={cx("mt-3 text-[12px]", MUTED)}>
                  Stage 4 risk:{" "}
                  {strategy.stageConfig?.stage4?.riskParams
                    ? Object.entries(strategy.stageConfig.stage4.riskParams)
                        .map(([key, value]) => `${key}: ${value}`)
                        .join(" · ")
                    : "Frozen from selected epoch"}
                </div>
              </div>
              <div className={PANEL}>
                <h3 className="mb-4 text-[12px] font-medium text-[#faf7fd]">Trading settings</h3>
                <InfoGrid
                  rows={[
                    ["Exchange", strategy.params.exchange],
                    [
                      "Pair / timeframe",
                      `${strategy.params.pair} · ${strategy.params.timeframe}`,
                    ],
                    [
                      "Market / leverage",
                      `${strategy.params.mode} · ${strategy.params.leverage || 1}×`,
                    ],
                    ["Backtest capital", `${money(strategy.params.startingCapital)} USDT`],
                    [
                      "Stake",
                      `${strategy.params.stakeMode || "fixed"} · ${money(strategy.params.stakeValue)}${strategy.params.stakeMode === "relative" ? "%" : " USDT"}`,
                    ],
                    ["Profit reserving", strategy.params.profitReserving ? "On" : "Off"],
                  ]}
                />
              </div>
            </div>
          ) : null}

          {detailTab === "Strategy code" ? (
            <StrategyTemplatePreview
              signalIndicators={strategy.stageConfig?.stage1?.indicators || []}
              entryFormula={strategy.stageConfig?.stage2?.formula || ""}
              exitFormula={strategy.stageConfig?.stage3?.formula || ""}
              riskRanges={strategy.stageConfig?.stage4?.riskRanges || {}}
              riskHyperoptParams={strategy.stageConfig?.stage4?.riskHyperoptParams || {}}
              timeRange={strategy.params?.timeframe || "1h"}
            />
          ) : null}

          {detailTab === "Bots" ? (
            <div className={cx(ui.radius, ui.panel, "overflow-hidden")}>
              <div className={cx("px-4 py-3 text-[12px] font-medium", ui.panelMuted, "border-b", ui.divider)}>
                Linked bots
              </div>
              <DataTable headers={["Bot", "Mode", "Status", "Owner", "Action"]}>
                {model.bots
                  .filter((item) => item.strategyId === strategy.id)
                  .map((item) => (
                    <tr key={item.id} className="border-b border-[rgba(60,40,80,0.25)]">
                      <td className="px-4 py-2.5">{item.name}</td>
                      <td className="px-2 py-2.5">{item.mode}</td>
                      <td className="px-2 py-2.5">
                        <Status value={item.status} />
                      </td>
                      <td className="px-2 py-2.5">{item.owner}</td>
                      <td className="px-2 py-2.5">
                        <AppButton onClick={() => openBot(item.id)}>Open</AppButton>
                      </td>
                    </tr>
                  ))}
                {!model.bots.some((item) => item.strategyId === strategy.id) ? (
                  <EmptyCell columns={5}>No bots launched from this strategy.</EmptyCell>
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
            <div>
              <h2 className="text-[16px] font-semibold text-[#faf7fd]">{bot.name}</h2>
              <div className={cx("mt-2 flex flex-wrap items-center gap-2 text-[12px]", MUTED)}>
                <span>{bot.id}</span>
                <Status value={bot.mode} />
                <Status value={bot.status} />
                <span>
                  {botStrategy.params.exchange} · {botStrategy.params.pair} ·{" "}
                  {botStrategy.params.timeframe}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <AppButton
                variant="default"
                disabled={bot.status !== "Stopped" || botStrategy.status !== "Active"}
                onClick={() => openLaunch(botStrategy.id)}
              >
                New launch
              </AppButton>
              <AppButton
                variant="destructive"
                disabled={["Stopped", "Launch failed"].includes(bot.status)}
                onClick={() => setModal({ kind: "stop", id: bot.id })}
              >
                Stop bot
              </AppButton>
            </div>
          </div>

          <PillTabs
            value={detailTab}
            onChange={setDetailTab}
            items={["Overview", "Trades", "Logs", "Settings"].map((item) => ({
              value: item,
              label: item === "Trades" ? `Trades ${bot.closedTradeCount}` : item,
            }))}
          />

          {error ? (
            <p role="alert" className="text-[12px] text-red-400">
              {error}
            </p>
          ) : null}

          {detailTab === "Overview" ? (
            <BotOverview
              bot={bot}
              strategy={botStrategy}
              accounts={model.accounts}
              onOpenStrategy={() => openStrategy(botStrategy.id)}
            />
          ) : null}

          {detailTab === "Trades" ? (
            <div className={cx(ui.radius, ui.panel, "overflow-hidden")}>
              <div className={cx("px-4 py-3 text-[12px] font-medium", ui.panelMuted, "border-b", ui.divider)}>
                Trade history
              </div>
              <DataTable
                headers={["Instrument", "Direction", "Opened", "Closed", "P&L", "Exit reason"]}
              >
                {bot.trades.map((trade) => (
                  <tr key={trade.id} className="border-b border-[rgba(60,40,80,0.25)]">
                    <td className="px-4 py-2.5">{trade.pair}</td>
                    <td className="px-2 py-2.5">{trade.direction}</td>
                    <td className="px-2 py-2.5">{date(trade.openedAt)}</td>
                    <td className="px-2 py-2.5">{date(trade.closedAt)}</td>
                    <td className="px-2 py-2.5">{money(trade.pnl)} USDT</td>
                    <td className="px-2 py-2.5">{trade.exitReason}</td>
                  </tr>
                ))}
                {bot.trades.length === 0 ? <EmptyCell columns={6}>No trades yet.</EmptyCell> : null}
              </DataTable>
            </div>
          ) : null}

          {detailTab === "Logs" ? (
            <div className={PANEL}>
              <h3 className="mb-3 text-[12px] font-medium text-[#faf7fd]">Event log</h3>
              {bot.events.map((event) => (
                <div
                  key={event.id}
                  className="border-t border-[rgba(60,40,80,0.35)] py-3 text-[12px]"
                >
                  <time className={MUTED}>{date(event.at)}</time>
                  <p className="mt-1 text-[#faf7fd]">{event.text}</p>
                </div>
              ))}
            </div>
          ) : null}

          {detailTab === "Settings" ? (
            <div className="grid gap-4 lg:grid-cols-2">
              <div className={PANEL}>
                <h3 className="mb-4 text-[12px] font-medium text-[#faf7fd]">Launch settings</h3>
                <InfoGrid
                  rows={[
                    [
                      "Strategy",
                      <AppButton
                        key="source-strategy"
                        variant="link"
                        className="h-auto p-0 text-violet-200"
                        onClick={() => openStrategy(botStrategy.id)}
                      >
                        {botStrategy.name}
                      </AppButton>,
                    ],
                    ["Mode", bot.mode],
                    ["Account", accountName(bot, model.accounts)],
                    ["Initial capital", `${money(bot.capital)} USDT`],
                    [
                      "Exchange / market",
                      `${botStrategy.params.exchange} · ${botStrategy.params.mode}`,
                    ],
                    [
                      "Pair / timeframe",
                      `${botStrategy.params.pair} · ${botStrategy.params.timeframe}`,
                    ],
                    [
                      "Stake",
                      `${money(botStrategy.params.stakeValue)}${botStrategy.params.stakeMode === "relative" ? "%" : " USDT"}`,
                    ],
                    ["Max open positions", bot.maxOpenTrades],
                  ]}
                />
              </div>
              <div className={PANEL}>
                <h3 className="mb-4 text-[12px] font-medium text-[#faf7fd]">Source</h3>
                <InfoGrid
                  rows={[
                    ["Blueprint", botStrategy.blueprintName],
                    ["Selected epoch", botStrategy.epochLabel],
                    ["Source backtest", botStrategy.sourceBacktestId],
                    ["Owner", bot.owner],
                    ["Started", date(bot.startedAt)],
                    ["Stopped", date(bot.stoppedAt)],
                  ]}
                />
              </div>
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
      {modal?.kind === "stop" && model.bots.some((item) => item.id === modal.id) ? (
        <StopModal
          key={modal.id}
          bot={model.bots.find((item) => item.id === modal.id)}
          onClose={closeModal}
          onConfirm={() => {
            const nextError = model.stopBot(modal.id);
            if (nextError) setError(nextError);
            else closeModal();
          }}
        />
      ) : null}
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
      {modal?.kind === "source" ? (
        <AppDialog
          open
          onOpenChange={(open) => !open && closeModal()}
          title="Source backtest"
          description={model.strategies.find((item) => item.id === modal.id)?.sourceBacktestId}
        >
          <div className="space-y-4 text-[12px]">
            <p className={MUTED}>
              This saved snapshot contains the validated epoch, trading settings and summary shown
              in the strategy details.
            </p>
            <div className="flex justify-end">
              <AppButton onClick={closeModal}>Close</AppButton>
            </div>
          </div>
        </AppDialog>
      ) : null}
    </div>
  );
}

function BotOverview({ bot, strategy, accounts, onOpenStrategy }) {
  const unrealized = bot.positions.reduce((sum, position) => sum + position.unrealizedPnl, 0);
  const committed = bot.positions.reduce((sum, position) => sum + position.stake, 0);
  const totalPnl = bot.realizedPnl + unrealized;
  const equity = bot.capital + totalPnl;
  const samples = [0, 0.12, -0.08, 0.31, 0.2, 0.44, 0.38, 0.72, 0.86, 1].map((share, index) => ({
    label: String(index + 1),
    value: bot.capital + totalPnl * share,
  }));

  return (
    <div className="space-y-4">
      {bot.status === "Stopping" ? (
        <div className="rounded-md border-l-2 border-amber-400 bg-amber-500/10 p-3 text-[12px] text-amber-200">
          New entries are disabled.{" "}
          {bot.stopIntent === "wait"
            ? "The strategy is managing existing positions until exit."
            : "Position closing and order clearance are in progress."}
        </div>
      ) : null}
      {bot.mode === "Dryrun" ? (
        <p className="text-[12px] text-violet-300">Simulated results · virtual funds</p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Equity", `${money(equity)} USDT`, `Initial: ${money(bot.capital)} USDT`],
          [
            "P&L",
            `${money(totalPnl)} USDT`,
            `${percent((totalPnl / bot.capital) * 100, true)} return`,
          ],
          [
            "Closed trades",
            bot.closedTradeCount,
            `Win rate: ${bot.winRate == null ? "No data" : percent(bot.winRate)}`,
          ],
          [
            "Open positions",
            bot.positions.length,
            `${money(committed)} USDT committed`,
          ],
        ].map(([label, value, note]) => (
          <div className={PANEL} key={label}>
            <div className={cx("text-[11px]", MUTED)}>{label}</div>
            <div className="mt-2 text-[18px] font-semibold tabular-nums text-[#faf7fd]">{value}</div>
            <div className={cx("mt-1 text-[11px]", MUTED)}>{note}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className={PANEL}>
          <h3 className="mb-2 text-[12px] font-medium text-[#faf7fd]">Equity · illustrative</h3>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={samples}>
                <CartesianGrid stroke="rgba(184,174,204,0.15)" vertical={false} />
                <XAxis dataKey="label" tick={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "#170f29",
                    border: "1px solid rgba(60,40,80,.35)",
                    color: "#faf7fd",
                  }}
                  formatter={(value) => [`${money(value)} USDT`, "Equity"]}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#a78bfa"
                  fill="rgba(167,139,250,0.14)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className={PANEL}>
          <h3 className="mb-4 text-[12px] font-medium text-[#faf7fd]">Capital and configuration</h3>
          <InfoGrid
            rows={[
              [
                "Available for entries",
                `${money(bot.capital + bot.realizedPnl - committed)} USDT`,
              ],
              ["In positions", `${money(committed)} USDT`],
              ["Realized P&L", `${money(bot.realizedPnl)} USDT`],
              ["Unrealized P&L", `${money(unrealized)} USDT`],
              [
                "Strategy",
                <AppButton
                  key="source-strategy"
                  variant="link"
                  className="h-auto p-0 text-violet-200"
                  onClick={onOpenStrategy}
                >
                  {strategy.name}
                </AppButton>,
              ],
              ["Account", accountName(bot, accounts)],
              ["Epoch / backtest", `${strategy.epochLabel} · ${strategy.sourceBacktestId}`],
              ["Last update", date(bot.updatedAt)],
            ]}
          />
        </div>
      </div>

      <div className={cx(ui.radius, ui.panel, "overflow-hidden")}>
        <div className={cx("px-4 py-3 text-[12px] font-medium", ui.panelMuted, "border-b", ui.divider)}>
          Open positions · {bot.positions.length}
        </div>
        <DataTable headers={["Instrument", "Direction", "Margin / stake", "Unrealized P&L"]}>
          {bot.positions.map((position) => (
            <tr key={position.id} className="border-b border-[rgba(60,40,80,0.25)]">
              <td className="px-4 py-2.5">{position.pair}</td>
              <td className="px-2 py-2.5">
                {position.direction} · {position.leverage}×
              </td>
              <td className="px-2 py-2.5">{money(position.stake)} USDT</td>
              <td
                className={cx(
                  "px-2 py-2.5",
                  position.unrealizedPnl < 0 ? "text-red-400" : "text-green-400",
                )}
              >
                {money(position.unrealizedPnl)} USDT
              </td>
            </tr>
          ))}
          {bot.positions.length === 0 ? (
            <EmptyCell columns={4}>No open positions.</EmptyCell>
          ) : null}
        </DataTable>
      </div>
    </div>
  );
}

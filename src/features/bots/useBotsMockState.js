import { useCallback, useEffect, useRef, useState } from "react";
import {
  INITIAL_BOTS,
  INITIAL_COMPILED_STRATEGIES,
  INITIAL_EXCHANGE_ACCOUNTS,
  countStrategyBots,
  validateBotLaunch,
  prepareBotRestart,
} from "./botsModel";

const makeId = (prefix) => `${prefix}-${globalThis.crypto?.randomUUID?.() ?? Date.now().toString(36)}`;
const now = () => new Date().toISOString();

function addEvent(bot, text) {
  return {
    ...bot,
    updatedAt: now(),
    events: [{ id: makeId("event"), at: now(), text }, ...(bot.events || [])],
  };
}

export function useBotsMockState() {
  const [data, setData] = useState(() => ({
    strategies: INITIAL_COMPILED_STRATEGIES,
    bots: INITIAL_BOTS,
    accounts: INITIAL_EXCHANGE_ACCOUNTS,
  }));
  const dataRef = useRef(data);
  const timers = useRef(new Set());

  const commit = useCallback((update) => {
    const next = update(dataRef.current);
    dataRef.current = next;
    setData(next);
    return next;
  }, []);

  useEffect(() => () => {
    timers.current.forEach(clearTimeout);
    timers.current.clear();
  }, []);

  const schedule = useCallback((callback, delay) => {
    const timer = setTimeout(() => {
      timers.current.delete(timer);
      callback();
    }, delay);
    timers.current.add(timer);
  }, []);

  const saveStrategy = useCallback((snapshot) => {
    const existing = dataRef.current.strategies.find((item) =>
      item.owner === snapshot.owner &&
      item.sourceBacktestId === snapshot.sourceBacktestId &&
      item.sourceStrategyId === snapshot.sourceStrategyId,
    );
    if (existing) return existing;
    const created = { ...snapshot, id: makeId("cs"), status: "Active", savedAt: now() };
    commit((prev) => ({ ...prev, strategies: [created, ...prev.strategies] }));
    return created;
  }, [commit]);

  const editStrategy = useCallback((id, { name, description }) => {
    if (!name?.trim()) return "Enter a strategy name.";
    commit((prev) => ({
      ...prev,
      strategies: prev.strategies.map((item) => item.id === id
        ? { ...item, name: name.trim(), description: description || "" }
        : item),
    }));
    return null;
  }, [commit]);

  const setStrategyArchived = useCallback((id, archived) => {
    const strategy = dataRef.current.strategies.find((item) => item.id === id);
    if (!strategy) return "Strategy not found.";
    if (archived && countStrategyBots(id, dataRef.current.bots).active > 0) {
      return "Stop all active bots before archiving.";
    }
    commit((prev) => ({
      ...prev,
      strategies: prev.strategies.map((item) => item.id === id
        ? { ...item, status: archived ? "Archive" : "Active" }
        : item),
    }));
    return null;
  }, [commit]);

  const connectAccount = useCallback(({ name, exchange, market, owner }) => {
    const trimmed = name?.trim();
    if (!trimmed) return { error: "Enter a connection name." };
    if (dataRef.current.accounts.some((item) => item.owner === owner && item.name.toLowerCase() === trimmed.toLowerCase())) {
      return { error: "Use a distinct connection name." };
    }
    const account = {
      id: makeId("account"), name: trimmed, exchange, market,
      owner, balance: 2500, status: "Ready",
    };
    commit((prev) => ({ ...prev, accounts: [...prev.accounts, account] }));
    return { account };
  }, [commit]);

  const launchBot = useCallback(({ strategyId, name, mode, capital, maxOpenTrades, accountId, owner }) => {
    const strategy = dataRef.current.strategies.find((item) => item.id === strategyId);
    const error = validateBotLaunch({
      strategy, name, mode, capital, maxOpenTrades, accountId, accounts: dataRef.current.accounts, owner,
    });
    if (error) return { error };
    const startedAt = now();
    const bot = {
      id: makeId("bot"), name: name.trim(), strategyId, owner, mode,
      accountId: mode === "Live" ? accountId : null,
      capital: Number(capital), maxOpenTrades: Number(maxOpenTrades), status: "Starting", realizedPnl: 0,
      startedAt, updatedAt: startedAt, stoppedAt: null, stopIntent: null,
      orders: [], positions: [], trades: [], closedTradeCount: 0, winRate: null,
      events: [{ id: makeId("event"), at: startedAt, text: `Bot launch requested in ${mode} mode.` }],
    };
    commit((prev) => ({ ...prev, bots: [bot, ...prev.bots] }));
    schedule(() => commit((prev) => ({
      ...prev,
      bots: prev.bots.map((item) => item.id === bot.id && item.status === "Starting"
        ? addEvent({ ...item, status: "Running" }, "Preparation complete. Bot is running.")
        : item),
    })), 1400);
    return { bot };
  }, [commit, schedule]);

  const stopBot = useCallback((id) => {
    const bot = dataRef.current.bots.find((item) => item.id === id);
    if (!bot || ["Stopped", "Launch failed"].includes(bot.status)) return "Bot is already inactive.";
    const hasPositions = bot.positions.length > 0;
    const intent = hasPositions ? "wait" : "close";
    const message = hasPositions
      ? "Stop requested. New entries disabled; waiting for strategy exits."
      : "Stop requested. Checking active orders.";
    commit((prev) => ({
      ...prev,
      bots: prev.bots.map((item) => item.id === id
        ? addEvent({ ...item, status: "Stopping", stopIntent: intent }, message)
        : item),
    }));
    schedule(() => commit((prev) => ({
      ...prev,
      bots: prev.bots.map((item) => item.id === id && item.status === "Stopping" && item.stopIntent === intent
        ? addEvent({ ...item, status: "Stopped", stopIntent: null, positions: [], stoppedAt: now() }, "No open positions or orders remain. Bot stopped.")
        : item),
    })), hasPositions && intent === "wait" ? 5500 : 1800);
    return null;
  }, [commit, schedule]);

  const restartBot = useCallback((id) => {
    const bot = dataRef.current.bots.find((item) => item.id === id);
    const strategy = dataRef.current.strategies.find((item) => item.id === bot?.strategyId);
    const result = prepareBotRestart(bot, strategy, dataRef.current.accounts, now());
    if (result.error) return result.error;
    commit((prev) => ({ ...prev, bots: prev.bots.map((item) => item.id === id ? addEvent(result.bot, "Restart requested. Identity, configuration and trade history preserved.") : item) }));
    schedule(() => commit((prev) => ({
      ...prev,
      bots: prev.bots.map((item) => item.id === id && item.status === "Starting"
        ? addEvent({ ...item, status: "Running" }, "Preview restart complete. No exchange orders are performed.") : item),
    })), 1400);
    return null;
  }, [commit, schedule]);

  return { ...data, saveStrategy, editStrategy, setStrategyArchived, connectAccount, launchBot, stopBot, restartBot };
}

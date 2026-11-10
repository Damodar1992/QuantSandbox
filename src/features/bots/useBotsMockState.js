import { useCallback, useEffect, useRef, useState } from "react";
import {
  INITIAL_BOTS,
  INITIAL_COMPILED_STRATEGIES,
  INITIAL_EXCHANGE_ACCOUNTS,
  INITIAL_NOTIFICATION_DESTINATIONS,
  INITIAL_NOTIFICATION_LEVELS,
  countStrategyBots,
  validateBotLaunch,
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
    notificationDestinations: INITIAL_NOTIFICATION_DESTINATIONS.map((item) => ({ ...item })),
    notificationLevels: structuredClone(INITIAL_NOTIFICATION_LEVELS),
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
    const existing = snapshot.sourceBacktestId && dataRef.current.strategies.find((item) =>
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
      return "Resolve unfinished bots before archiving this strategy.";
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

  const checkMinBalance = useCallback(({ capital }) => {
    // Illustrative service response only. The actual formula and API are a separate task.
    const minimum = 300;
    return { minimum, passed: Number(capital) >= minimum, checkedAt: now(), preview: true };
  }, []);

  const launchBot = useCallback(({ strategyId, name, mode, capital, stakeMode, stakeValue, accountId, owner, minBalanceCheck }) => {
    const strategy = dataRef.current.strategies.find((item) => item.id === strategyId);
    const error = validateBotLaunch({
      strategy, name, mode, capital, maxOpenTrades: 1, stakeMode, stakeValue, accountId, accounts: dataRef.current.accounts, owner,
    });
    if (error) return { error };
    if (!minBalanceCheck || !minBalanceCheck.passed || Number(capital) < Number(minBalanceCheck.minimum)) {
      return { error: "Run Check min balance and enter at least the returned minimum." };
    }
    const createdAt = now();
    const bot = {
      id: makeId("bot"), name: name.trim(), strategyId, owner, mode,
      accountId: accountId || null, feeSource: accountId ? "account" : "exchange",
      capital: Number(capital), stakeMode: stakeMode || strategy.params.stakeMode,
      stakeValue: Number(stakeValue ?? strategy.params.stakeValue), maxOpenTrades: 1,
      status: "Ready for start", realizedPnl: 0,
      createdAt, startedAt: null, updatedAt: createdAt, lastHeartbeatAt: null, stoppedAt: null, stopIntent: null,
      orders: [], positions: [], trades: [], closedTradeCount: 0, winRate: null,
      events: [{ id: makeId("event"), at: createdAt, text: `Bot created in ${mode} mode. Awaiting manual start.` }],
    };
    commit((prev) => ({ ...prev, bots: [bot, ...prev.bots] }));
    return { bot };
  }, [commit]);

  const startBot = useCallback((id) => {
    const bot = dataRef.current.bots.find((item) => item.id === id);
    if (!bot || bot.status !== "Ready for start") return "Only a never-started bot can be started.";
    commit((prev) => ({ ...prev, bots: prev.bots.map((item) => item.id === id
      ? addEvent({ ...item, status: "Starting" }, "Manual start requested. Preparing bot.") : item) }));
    schedule(() => commit((prev) => ({
      ...prev,
      bots: prev.bots.map((item) => item.id === id && item.status === "Starting"
        ? addEvent({ ...item, status: "Running", startedAt: item.startedAt || now(), lastHeartbeatAt: now() }, "Preparation complete. Bot is running. Runtime contact is simulated in this preview.")
        : item),
    })), 1400);
    return null;
  }, [commit, schedule]);

  const pauseBot = useCallback((id) => {
    const bot = dataRef.current.bots.find((item) => item.id === id);
    if (!bot || bot.status !== "Running") return "Only a running bot can be paused.";
    commit((prev) => ({
      ...prev,
      bots: prev.bots.map((item) => item.id === id
        ? addEvent({ ...item, status: "Paused" }, "New entries paused. Existing trades remain strategy-managed.")
        : item),
    }));
    return null;
  }, [commit]);

  const stopBot = useCallback((id) => {
    const bot = dataRef.current.bots.find((item) => item.id === id);
    if (!bot || !["Running", "Paused"].includes(bot.status)) return "Only a running or paused bot can be stopped.";
    commit((prev) => ({
      ...prev,
      bots: prev.bots.map((item) => item.id === id
        ? addEvent({ ...item, status: "Stopped", stoppedAt: now() }, "Bot automation stopped. Remaining trades require manual attention.")
        : item),
    }));
    return null;
  }, [commit]);

  const resumeBot = useCallback((id) => {
    const bot = dataRef.current.bots.find((item) => item.id === id);
    if (!bot || !["Paused", "Stopped"].includes(bot.status)) return "Only a paused or stopped bot can be resumed.";
    const strategy = dataRef.current.strategies.find((item) => item.id === bot.strategyId);
    if (strategy?.status !== "Active") return "Restore the strategy before resuming.";
    commit((prev) => ({ ...prev, bots: prev.bots.map((item) => item.id === id
      ? addEvent({ ...item, status: "Starting", stoppedAt: null }, "Resume requested. Reviewing current positions and orders.") : item) }));
    schedule(() => commit((prev) => ({
      ...prev,
      bots: prev.bots.map((item) => item.id === id && item.status === "Starting"
        ? addEvent({ ...item, status: "Running", lastHeartbeatAt: now() }, "Preview resume complete. Runtime contact is simulated; no exchange orders are performed.") : item),
    })), 1400);
    return null;
  }, [commit, schedule]);

  const deleteBot = useCallback((id) => {
    const bot = dataRef.current.bots.find((item) => item.id === id);
    if (!bot || bot.status !== "Ready for start" || bot.startedAt) return "Only a never-started bot can be deleted.";
    commit((prev) => ({ ...prev, bots: prev.bots.filter((item) => item.id !== id) }));
    return null;
  }, [commit]);

  const recordManualExit = useCallback(({ botId, positionId, action, limitPrice, partialPct }) => {
    const bot = dataRef.current.bots.find((item) => item.id === botId);
    if (!bot || !["Running", "Paused", "Stopped"].includes(bot.status)) return "Manual action is unavailable in this state.";
    if (!bot.positions?.some((item) => item.id === positionId)) return "Open trade not found.";
    if (!["market", "limit", "partial"].includes(action)) return "Select an exit action.";
    if (action === "limit" && !(Number(limitPrice) > 0)) return "Enter a positive limit price.";
    if (action === "partial" && !(Number(partialPct) > 0 && Number(partialPct) < 100)) return "Enter a percentage between 0 and 100.";
    const label = action === "market" ? "Force exit market" : action === "limit" ? `Force exit limit at ${limitPrice}` : `Force exit partial ${partialPct}%`;
    commit((prev) => ({ ...prev, bots: prev.bots.map((item) => item.id === botId
      ? addEvent({ ...item, positions: item.positions.map((position) => position.id === positionId
        ? { ...position, manualExitPreview: label } : position) }, `${label} preview recorded for ${positionId}. No order was sent.`)
      : item) }));
    return null;
  }, [commit]);

  const connectTelegramDestination = useCallback(({ botId, owner, name, token, chatType, chatId }) => {
    const bot = dataRef.current.bots.find((item) => item.id === botId);
    if (!bot || bot.owner !== owner) return { error: "Only the bot owner can manage notifications." };
    const trimmedName = name?.trim();
    const trimmedChatId = chatId?.trim();
    if (!trimmedName) return { error: "Enter a destination name." };
    if (!token?.trim()) return { error: "Enter a fictional Telegram bot token for this preview." };
    if (!["private", "group"].includes(chatType)) return { error: "Select a chat type." };
    if (!/^-?\d+$/.test(trimmedChatId || "")) return { error: "Enter a numeric Telegram chat ID." };
    if (dataRef.current.notificationDestinations.some((item) => item.owner === owner && item.name.toLowerCase() === trimmedName.toLowerCase())) {
      return { error: "Use a distinct destination name." };
    }
    // The preview never stores or sends the entered token. A real connection needs a backend secret vault and verification API.
    const destination = {
      id: makeId("telegram"), owner, name: trimmedName, type: "Telegram",
      chatType, chatId: trimmedChatId, status: "Preview connected",
      lastSuccessAt: null, lastError: null,
    };
    commit((prev) => ({
      ...prev,
      notificationDestinations: [...prev.notificationDestinations, destination],
      notificationLevels: {
        ...prev.notificationLevels,
        [botId]: { ...prev.notificationLevels[botId], [destination.id]: "Important" },
      },
    }));
    return { destination };
  }, [commit]);

  const setBotNotificationLevel = useCallback(({ botId, destinationId, owner, level }) => {
    const bot = dataRef.current.bots.find((item) => item.id === botId);
    const destination = dataRef.current.notificationDestinations.find((item) => item.id === destinationId);
    if (!bot || bot.owner !== owner || !destination || destination.owner !== owner) return "Destination unavailable.";
    if (!["Critical", "Important", "All", "Off"].includes(level)) return "Select a notification level.";
    commit((prev) => ({
      ...prev,
      notificationLevels: {
        ...prev.notificationLevels,
        [botId]: { ...prev.notificationLevels[botId], [destinationId]: level },
      },
    }));
    return null;
  }, [commit]);

  const sendTestNotification = useCallback(({ botId, destinationId, owner }) => {
    const bot = dataRef.current.bots.find((item) => item.id === botId);
    const destination = dataRef.current.notificationDestinations.find((item) => item.id === destinationId);
    if (!bot || bot.owner !== owner || !destination || destination.owner !== owner || destination.status !== "Preview connected") {
      return "Destination unavailable.";
    }
    commit((prev) => ({
      ...prev,
      notificationDestinations: prev.notificationDestinations.map((item) => item.id === destinationId
        ? { ...item, lastSuccessAt: now(), lastError: null }
        : item),
    }));
    return null;
  }, [commit]);

  const removeNotificationDestination = useCallback(({ destinationId, owner }) => {
    const destination = dataRef.current.notificationDestinations.find((item) => item.id === destinationId);
    if (!destination || destination.owner !== owner) return "Destination unavailable.";
    commit((prev) => {
      const notificationLevels = Object.fromEntries(Object.entries(prev.notificationLevels).map(([botId, levels]) => {
        const { [destinationId]: _removed, ...remaining } = levels;
        return [botId, remaining];
      }));
      return {
        ...prev,
        notificationDestinations: prev.notificationDestinations.filter((item) => item.id !== destinationId),
        notificationLevels,
      };
    });
    return null;
  }, [commit]);

  return { ...data, saveStrategy, editStrategy, setStrategyArchived, connectAccount, checkMinBalance, launchBot, startBot, pauseBot, stopBot, resumeBot, deleteBot, recordManualExit, connectTelegramDestination, setBotNotificationLevel, sendTestNotification, removeNotificationDestination };
}

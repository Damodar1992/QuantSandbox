export const hasNumber = (value) => value != null && value !== "" && Number.isFinite(Number(value));
export const date = (value) => value != null && value !== "" && Number.isFinite(new Date(value).getTime())
  ? new Date(value).toLocaleString("en-GB", { timeZone: "Europe/Kyiv", day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
  : "No data";
export const money = (value, signed = false) => hasNumber(value)
  ? `${signed && Number(value) > 0 ? "+" : ""}${Number(value).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  : "No data";
export const percent = (value, signed = false) => hasNumber(value)
  ? `${signed && Number(value) > 0 ? "+" : ""}${Number(value).toFixed(1)}%`
  : "No data";
export const amount = (value, signed = false) => hasNumber(value) ? `${money(value, signed)} USDT` : "No data";
export const pnlTone = (value) => !hasNumber(value) || Number(value) === 0 ? "text-muted-foreground" : Number(value) < 0 ? "text-red-400" : "text-green-400";
export const accountName = (bot, accounts) => bot.mode === "Dryrun" ? "Virtual wallet" : accounts.find((account) => account.id === bot.accountId)?.name || "Account unavailable";

export const ORDER_KIND_LABELS = { entry: "Entry", add: "Add", exit: "Exit" };

/** Open duration relative to snapshot time (bot.updatedAt) for stable preview ages. */
export function formatOpenAge(openedAt, asOf) {
  const start = Date.parse(openedAt);
  const end = Date.parse(asOf);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return "No data";
  const minutes = Math.floor((end - start) / 60000);
  if (minutes < 60) return `${minutes}m open`;
  const hours = Math.floor(minutes / 60);
  const rem = minutes % 60;
  if (hours < 48) return rem ? `${hours}h ${rem}m open` : `${hours}h open`;
  const days = Math.floor(hours / 24);
  const remH = hours % 24;
  return remH ? `${days}d ${remH}h open` : `${days}d open`;
}

/** Distance from mark price to stop loss as % of mark (positive = room remaining). */
export function stopLossDistancePct(position) {
  if (!hasNumber(position?.stopLoss) || !hasNumber(position?.currentPrice) || Number(position.currentPrice) === 0) {
    return null;
  }
  const mark = Number(position.currentPrice);
  const stop = Number(position.stopLoss);
  const raw = position.direction === "Short" ? (stop - mark) / mark : (mark - stop) / mark;
  return raw * 100;
}

export function ordersForPosition(orders, positionId) {
  if (!Array.isArray(orders)) return null;
  return orders.filter((order) => order.positionId === positionId);
}

export function summarizeOrderKinds(orders) {
  if (!orders?.length) return "None";
  const counts = {};
  for (const order of orders) {
    const key = ORDER_KIND_LABELS[order.kind] || order.kind || "Order";
    counts[key] = (counts[key] || 0) + 1;
  }
  return Object.entries(counts)
    .map(([label, count]) => (count > 1 ? `${count} ${label.toLowerCase()}` : label))
    .join(" · ");
}

export function getBotMetrics(bot) {
  const positions = bot.positions;
  const sum = (key) => Array.isArray(positions) && positions.every((position) => hasNumber(position[key]))
    ? positions.reduce((total, position) => total + Number(position[key]), 0) : null;
  const unrealized = sum("unrealizedPnl");
  const committed = sum("stake");
  const realized = hasNumber(bot.realizedPnl) ? Number(bot.realizedPnl) : null;
  const capital = hasNumber(bot.capital) ? Number(bot.capital) : null;
  const totalPnl = realized != null && unrealized != null ? realized + unrealized : null;
  return {
    unrealized, committed, realized, capital, totalPnl,
    equity: capital != null && totalPnl != null ? capital + totalPnl : null,
    available: capital != null && realized != null && committed != null ? capital + realized - committed : null,
    returnPct: capital > 0 && totalPnl != null ? totalPnl / capital * 100 : null,
  };
}

export function filterAndSortBots(bots, strategies, accounts, filters, search, sort) {
  const query = search.trim().toLowerCase();
  const result = bots.filter((bot) => {
    const strategy = strategies.find((item) => item.id === bot.strategyId);
    const text = [bot.name, bot.id, strategy?.name, strategy?.params.pair, accountName(bot, accounts)].join(" ").toLowerCase();
    return (!query || text.includes(query)) &&
      (filters.strategy === "All" || bot.strategyId === filters.strategy) &&
      (filters.mode === "All" || bot.mode === filters.mode) &&
      (filters.status === "All" || bot.status === filters.status) &&
      (filters.owner === "All" || bot.owner === filters.owner) &&
      (filters.account === "All" || (filters.account === "virtual" ? bot.mode === "Dryrun" : bot.mode === "Live" && bot.accountId === filters.account));
  });
  return result.sort((a, b) => {
    if (sort === "name") return a.name.localeCompare(b.name) || a.id.localeCompare(b.id);
    if (sort === "pnl") {
      const left = getBotMetrics(a).totalPnl;
      const right = getBotMetrics(b).totalPnl;
      return left == null ? (right == null ? 0 : 1) : right == null ? -1 : right - left;
    }
    if (sort === "status") return a.status.localeCompare(b.status) || a.name.localeCompare(b.name);
    return (Date.parse(b.startedAt) || 0) - (Date.parse(a.startedAt) || 0);
  });
}

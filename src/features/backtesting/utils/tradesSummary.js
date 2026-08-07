// Stage 5 · Single trades mock for Backtesting info → Trades tab.

function strHash(str) {
  let h = 2166136261;
  for (let i = 0; i < String(str).length; i += 1) {
    h ^= String(str).charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const round = (v, d = 2) => Math.round(v * 10 ** d) / 10 ** d;
const between = (rnd, lo, hi) => lo + rnd() * (hi - lo);

const EXIT_REASONS = [
  "first_day_green_candle_exit",
  "first_day_red_candle_exit",
  "roi",
  "stoploss",
  "exit_signal",
  "force_exit",
];

function pairLabel(run) {
  const pair = run?.params?.pair || "BTC/USDT";
  return pair.includes(":") ? pair : `${pair}:USDT`;
}

function pad(n) {
  return String(n).padStart(2, "0");
}

function formatTs(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

/**
 * Deterministic list of single trades for the Trades tab.
 */
export function buildTradesSummary(run) {
  const rnd = mulberry32(strHash(`trades|${run?.id || "run"}`));
  const pair = pairLabel(run);
  const leverage = run?.params?.mode === "spot" ? 1 : Number(run?.params?.leverage) || 5;
  const count = 10;
  const trades = [];

  let cursor = new Date(`${run?.params?.periodFrom || "2020-01-01"}T00:15:00`);
  if (Number.isNaN(cursor.getTime())) cursor = new Date("2020-01-01T00:15:00");

  for (let i = 0; i < count; i += 1) {
    const openRate = round(between(rnd, 6500, 9500), 2);
    const movePct = between(rnd, -0.004, 0.004);
    const closeRate = round(openRate * (1 + movePct), 2);
    const amount = round(between(rnd, 0.11, 0.22), 3);
    const stake = round(amount * openRate, 2);
    const netPlPct = round(((closeRate - openRate) / openRate) * 100 * leverage, 2);
    const netPlUsdt = round((stake * netPlPct) / 100, 2);
    const reserved = netPlUsdt > 0 ? round(netPlUsdt * between(rnd, 0.05, 0.25), 4) : 0;
    const stopLoss = round(openRate * between(rnd, 0.008, 0.02), 2);
    const liqPrice = round(openRate * between(rnd, 0.03, 0.08), 2);

    const openDate = new Date(cursor);
    const holdHours = Math.floor(between(rnd, 1, 18));
    cursor = new Date(cursor.getTime() + holdHours * 3600 * 1000);
    const closeDate = new Date(cursor);
    cursor = new Date(cursor.getTime() + Math.floor(between(rnd, 1, 6)) * 3600 * 1000);

    trades.push({
      id: `t-${i + 1}`,
      direction: "Long",
      pair,
      amount,
      stakeAmount: stake,
      leverage,
      openRate,
      closeRate,
      stopLoss,
      liqPrice,
      netPlPct,
      netPlUsdt,
      reserved,
      openDate: formatTs(openDate),
      closeDate: formatTs(closeDate),
      exitReason: EXIT_REASONS[Math.floor(rnd() * EXIT_REASONS.length)],
    });
  }

  return {
    subtitle: "every executed trade, filterable and exportable",
    trades,
  };
}

export function tradesToCsv(trades) {
  const headers = [
    "direction",
    "pair",
    "amount",
    "stake_amount",
    "leverage",
    "open_rate",
    "close_rate",
    "stop_loss",
    "liq_price",
    "net_pl_pct",
    "net_pl_usdt",
    "reserved",
    "open_date",
    "close_date",
    "exit_reason",
  ];
  const lines = [headers.join(",")];
  for (const t of trades) {
    lines.push(
      [
        t.direction,
        t.pair,
        t.amount,
        t.stakeAmount,
        t.leverage,
        t.openRate,
        t.closeRate,
        t.stopLoss,
        t.liqPrice,
        t.netPlPct,
        t.netPlUsdt,
        t.reserved,
        `"${t.openDate}"`,
        `"${t.closeDate}"`,
        t.exitReason,
      ].join(","),
    );
  }
  return `${lines.join("\n")}\n`;
}

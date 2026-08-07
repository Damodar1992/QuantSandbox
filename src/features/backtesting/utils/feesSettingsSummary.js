// Stage 5 · Fees + Run settings mocks for Backtesting info tabs.

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

function fmtMoneyUsdt(value, { na = false } = {}) {
  if (na || value == null) return "N/A";
  const num = Number(value);
  if (!Number.isFinite(num)) return "N/A";
  const sign = num > 0 ? "+" : "";
  return `${sign}${num.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} USDT`;
}

function fmtPct(value, decimals = 2) {
  const num = Number(value);
  if (!Number.isFinite(num)) return "N/A";
  return `${num.toFixed(decimals)}%`;
}

function fmtMoneyPlain(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return "N/A";
  return `${num.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} USDT`;
}

function toTimerange(from, to) {
  const compact = (iso) => String(iso || "").replace(/[-:T\s]/g, "").slice(0, 8);
  const a = compact(from);
  const b = compact(to);
  if (!a && !b) return "N/A";
  return `${a || "?"}-${b || "?"}`;
}

function pairLabel(run) {
  const pair = run?.params?.pair || "BTC/USDT";
  const mode = run?.params?.mode || "spot";
  if (mode === "spot") return pair.includes(":") ? pair : `${pair}:USDT`;
  return pair.includes(":") ? pair : `${pair}:USDT`;
}

/**
 * Fees table for open/closed orders + totals.
 */
export function buildFeesSummary(run) {
  const rnd = mulberry32(strHash(`fees|${run?.id || "run"}`));
  const starting = Number(run?.params?.startingCapital) || 10000;
  const hasMaker = rnd() > 0.65;

  const openTaker = round(-Math.abs(starting) * between(rnd, 0.12, 0.28), 2);
  const openMaker = hasMaker ? round(-Math.abs(starting) * between(rnd, 0.01, 0.06), 2) : null;
  const closeTaker = round(-Math.abs(starting) * between(rnd, 0.12, 0.28), 2);
  const closeMaker = hasMaker ? round(-Math.abs(starting) * between(rnd, 0.01, 0.06), 2) : null;

  const row = {
    pair: pairLabel(run),
    openTaker,
    openMaker,
    totalOpen: round(openTaker + (openMaker ?? 0), 2),
    closeTaker,
    closeMaker,
    totalClose: round(closeTaker + (closeMaker ?? 0), 2),
  };

  return {
    subtitle:
      "Entry and exit costs split by order type. The totals match Maker fee and Taker fee in the performance summary.",
    rows: [row],
    total: {
      pair: "TOTAL",
      openTaker: row.openTaker,
      openMaker: row.openMaker,
      totalOpen: row.totalOpen,
      closeTaker: row.closeTaker,
      closeMaker: row.closeMaker,
      totalClose: row.totalClose,
    },
  };
}

/**
 * Run settings panels — what the backtester was launched with.
 */
export function buildSettingsSummary(run) {
  const rnd = mulberry32(strHash(`settings|${run?.id || "run"}`));
  const p = run?.params || {};
  const from = p.periodFrom ? `${p.periodFrom} 00:00:00` : "2020-01-01 00:00:00";
  const to = p.periodTo ? `${p.periodTo} 00:00:00` : "2026-06-30 00:00:00";
  const starting = Number(p.startingCapital) || 10000;
  const makerRate = p.fees?.maker ?? 0.02;
  const takerRate = p.fees?.taker ?? 0.05;
  const profitReserving =
    p.profitReserving == null || p.profitReserving === ""
      ? null
      : Number(p.profitReserving);
  const volume = round(starting * between(rnd, 80, 520), 2);
  const execMinutes = Math.floor(between(rnd, 8, 95));

  return {
    subtitle: "what the backtester was launched with",
    panels: [
      {
        key: "period",
        title: "Period and build",
        rows: [
          { key: "from", label: "Backtesting from", value: from },
          { key: "to", label: "Backtesting to", value: to },
          { key: "timerange", label: "Run timerange", value: toTimerange(p.periodFrom, p.periodTo) },
          {
            key: "execTime",
            label: "BT execution time",
            value: `${execMinutes} minute${execMinutes === 1 ? "" : "s"}`,
          },
          { key: "build", label: "Build version", value: "master.2.0.9" },
        ],
      },
      {
        key: "market",
        title: "Market",
        rows: [
          { key: "exchange", label: "Exchange", value: p.exchange || "binance" },
          { key: "mode", label: "Trading mode", value: p.mode || "spot" },
          { key: "timeframe", label: "Timeframe", value: p.timeframe || "1h" },
          { key: "tfDetail", label: "Timeframe detail", value: "N/A" },
          { key: "maxOpen", label: "Max open trades", value: String(Math.floor(between(rnd, 1, 12))) },
        ],
      },
      {
        key: "exit",
        title: "Exit rules",
        rows: [
          { key: "stoploss", label: "Stoploss", value: "-99.00%", tone: "neg" },
          { key: "trailing", label: "Trailing stoploss", value: "false" },
          {
            key: "trailOffset",
            label: "Trail only when offset is reached",
            value: "true",
          },
          { key: "trailPos", label: "Trailing stop positive", value: "0.001" },
          { key: "trailPosOff", label: "Trailing stop positive offset", value: "0.025" },
          { key: "customSl", label: "Custom stoploss", value: "false" },
          { key: "roi", label: "ROI", value: '{"0": 100}' },
          { key: "exitSignal", label: "Use exit signal", value: "true" },
          { key: "exitProfitOnly", label: "Exit profit only", value: "false" },
          { key: "exitProfitOff", label: "Exit profit offset", value: "0" },
          { key: "protections", label: "Enable protections", value: "true" },
        ],
      },
      {
        key: "capital",
        title: "Capital and fees",
        rows: [
          { key: "starting", label: "Starting balance", value: fmtMoneyPlain(starting) },
          {
            key: "reserve",
            label: "Profit reserving, relative",
            value: profitReserving == null ? "Off" : fmtPct(profitReserving),
          },
          { key: "makerRate", label: "Maker fee rate", value: fmtPct(makerRate) },
          { key: "takerRate", label: "Taker fee rate", value: fmtPct(takerRate) },
          { key: "volume", label: "Total trade volume", value: fmtMoneyPlain(volume) },
        ],
      },
    ],
  };
}

export { fmtMoneyUsdt };

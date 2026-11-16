import { resolveBtFees } from "@/constants/backtesting";

/** Section 6 illustration. Not the live Binance or HTX filter. */
export const PREVIEW_SOURCE_PRICE = 40_000;
export const PREVIEW_PRICE_BUFFER_PCT = 10;

export const PREVIEW_STATUS = {
  READY: "READY",
  INSUFFICIENT: "Insufficient Funds",
  CONFIG_BLOCKED: "CONFIG BLOCKED",
  DATA_PAUSED: "DATA PAUSED",
};

const HINTS = {
  ready: "Funds are sufficient to start.",
  insufficient: "Increase the free balance to the amount shown.",
  reduceStake: "Decrease the Relative Stake.",
  configBlocked: "Increase Fixed Stake to the amount shown. Adding balance alone will not help.",
  dataPaused: "The data for this calculation could not be loaded or confirmed.",
};

const EPS = 1e-9;

function roundUnit(value) {
  return Math.round(value * 1e8) / 1e8;
}

function ceilToStep(value, step) {
  return roundUnit(Math.ceil((value - EPS) / step) * step);
}

function floorToStep(value, step) {
  return roundUnit(Math.floor((value + EPS) / step) * step);
}

export function ceilToCent(value) {
  return Math.ceil(value * 100 - 1e-8) / 100;
}

export function previewPrice(sourcePrice, bufferPct) {
  return sourcePrice * (1 + bufferPct / 100);
}

/**
 * Illustrative instrument limits from the spec example.
 * HTX futures quantity is in contracts; the contract size converts that to the base asset.
 */
export function illustrativeLimits({ exchange, market } = {}) {
  if (exchange === "htx" && market === "futures") {
    return {
      sourcePrice: PREVIEW_SOURCE_PRICE,
      bufferPct: PREVIEW_PRICE_BUFFER_PCT,
      minNotional: 50,
      minQty: 1,
      qtyStep: 1,
      contractSize: 0.001,
    };
  }
  return {
    sourcePrice: PREVIEW_SOURCE_PRICE,
    bufferPct: PREVIEW_PRICE_BUFFER_PCT,
    minNotional: 50,
    minQty: 0.001,
    qtyStep: 0.001,
    contractSize: 1,
  };
}

export function minimumOrderUsdt(limits) {
  const price = previewPrice(limits.sourcePrice, limits.bufferPct);
  const minBase = Math.max(limits.minNotional / price, limits.minQty * limits.contractSize);
  const units = ceilToStep(minBase / limits.contractSize, limits.qtyStep);
  return {
    price,
    units,
    order: roundUnit(units * limits.contractSize * price),
  };
}

function orderFromBudget(budget, limits, price, minUnits) {
  if (!(budget > 0) || !(price > 0)) return null;
  const units = floorToStep(budget / (price * limits.contractSize), limits.qtyStep);
  if (units + EPS < minUnits) return null;
  return {
    units,
    orderNotional: roundUnit(units * limits.contractSize * price),
  };
}

function paused() {
  return {
    status: PREVIEW_STATUS.DATA_PAUSED,
    metric: "minimumBalance",
    amount: null,
    hint: HINTS.dataPaused,
    highlight: null,
    ready: false,
  };
}

function reduceStake() {
  return {
    status: PREVIEW_STATUS.INSUFFICIENT,
    metric: "minimumBalance",
    amount: null,
    hint: HINTS.reduceStake,
    highlight: "stake",
    ready: false,
  };
}

function ensureAmount(start, works) {
  let amount = ceilToCent(start);
  for (let step = 0; step < 5 && !works(amount); step += 1) {
    amount = ceilToCent(amount + 0.01);
  }
  return works(amount) ? amount : null;
}

/**
 * One launch preview. Does not change the user's Fixed Stake.
 * @param {object} input
 * @param {boolean} input.confirmed
 * @param {"spot"|"futures"} input.market
 * @param {string} [input.exchange]
 * @param {number} [input.leverage]
 * @param {number} input.freeBalance
 * @param {"fixed"|"relative"} input.stakeMode
 * @param {number} input.stakeValue Fixed USDT, or Relative percent
 * @param {number} input.entryFeePct Entry fee in percent, e.g. 0.05
 * @param {object} [input.limits]
 */
export function previewMinimumBalance(input) {
  if (!input?.confirmed) return paused();
  const market = input.market === "futures" || input.market === "spot" ? input.market : null;
  if (!market) return paused();
  const leverage = market === "spot" ? 1 : Number(input.leverage);
  if (!Number.isFinite(leverage) || leverage < 1) return paused();
  const free = Number(input.freeBalance);
  if (!Number.isFinite(free) || free < 0) return paused();
  const stakeMode = input.stakeMode === "fixed" || input.stakeMode === "relative" ? input.stakeMode : null;
  if (!stakeMode) return paused();
  const stakeValue = Number(input.stakeValue);
  if (!Number.isFinite(stakeValue) || stakeValue <= 0) return paused();
  if (stakeMode === "relative" && stakeValue > 100) return paused();
  const feePct = Number(input.entryFeePct);
  if (!Number.isFinite(feePct) || feePct < 0) return paused();

  const limits = input.limits || illustrativeLimits({ exchange: input.exchange, market });
  const feeRate = feePct / 100;
  const { price, units: minUnits, order: minimumOrder } = minimumOrderUsdt(limits);
  if (!(minimumOrder > 0) || !(price > 0)) return paused();

  if (stakeMode === "fixed") {
    const sized = orderFromBudget(stakeValue * leverage, limits, price, minUnits);
    if (!sized) {
      return {
        status: PREVIEW_STATUS.CONFIG_BLOCKED,
        metric: "minimumStake",
        amount: ceilToCent(minimumOrder / leverage),
        hint: HINTS.configBlocked,
        highlight: "stake",
        ready: false,
      };
    }
    const fee = sized.orderNotional * feeRate;
    const amount = ensureAmount(stakeValue + fee, (candidate) => candidate + EPS >= stakeValue + fee);
    if (amount == null) return paused();
    if (free + EPS < amount) {
      return {
        status: PREVIEW_STATUS.INSUFFICIENT,
        metric: "minimumBalance",
        amount,
        hint: HINTS.insufficient,
        highlight: "balance",
        ready: false,
      };
    }
    return {
      status: PREVIEW_STATUS.READY,
      metric: "minimumBalance",
      amount,
      hint: HINTS.ready,
      highlight: null,
      ready: true,
    };
  }

  const fraction = stakeValue / 100;
  const feeFits = fraction < 1
    ? (1 - fraction) + EPS >= fraction * leverage * feeRate
    : feeRate <= 0;
  if (!feeFits) return reduceStake();

  const covers = (candidate) => {
    const sized = orderFromBudget(candidate * fraction * leverage, limits, price, minUnits);
    if (!sized) return false;
    const fee = sized.orderNotional * feeRate;
    return candidate + EPS >= candidate * fraction + fee;
  };
  const amount = ensureAmount(minimumOrder / (leverage * fraction), covers);
  if (amount == null) return reduceStake();
  if (free + EPS < amount) {
    return {
      status: PREVIEW_STATUS.INSUFFICIENT,
      metric: "minimumBalance",
      amount,
      hint: HINTS.insufficient,
      highlight: "balance",
      ready: false,
    };
  }
  return {
    status: PREVIEW_STATUS.READY,
    metric: "minimumBalance",
    amount,
    hint: HINTS.ready,
    highlight: null,
    ready: true,
  };
}

export function previewBotStart({ bot, strategy, account }) {
  const params = strategy?.params;
  const live = bot?.mode === "Live";
  // Live does not read the exchange balance. The known amount is the allocated capital.
  const freeBalance = bot?.capital;
  const market = params?.mode;
  const entryFeePct = params?.exchange && market ? resolveBtFees(params.exchange, market).taker : null;
  const confirmed = Boolean(
    params?.pair &&
    params.exchange &&
    (market === "spot" || market === "futures") &&
    Number.isFinite(Number(entryFeePct)) &&
    Number.isFinite(Number(freeBalance)) &&
    (!live || account),
  );
  return previewMinimumBalance({
    confirmed,
    market,
    exchange: params?.exchange,
    leverage: params?.leverage,
    freeBalance,
    stakeMode: bot?.stakeMode || params?.stakeMode,
    stakeValue: bot?.stakeValue ?? params?.stakeValue,
    entryFeePct,
  });
}

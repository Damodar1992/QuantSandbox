/**
 * Mini Backtest calculation engine.
 * Pure functions — no UI, no side effects.
 */

/**
 * Run mini backtest on cycle data with given params.
 * @param {Array} cycles - from generateCycleDataForEpoch
 * @param {Object} params - { initialBalance, fixedStake, relativeStake, reserved, fees, maxCycles, stopout }
 * @returns {Object} { summary, trades }
 */
export function runMiniBacktest(cycles, params) {
  const {
    initialBalance = 10000,
    fixedStake = 100,
    relativeStake = 10,
    reservedAmount = 0,
    fees = 0.1,
    maxCycles = 50,
    stopout = 20,
  } = params;

  let balance = initialBalance;
  let peakBalance = initialBalance;
  let totalPnL = 0;
  let totalFees = 0;
  let winCount = 0;
  let lossCount = 0;
  let totalWinPnL = 0;
  let totalLossPnL = 0;
  let maxDrawdown = 0;
  let cyclesExecuted = 0;
  let stoppedOut = false;

  const trades = [];

  for (let i = 0; i < Math.min(cycles.length, maxCycles); i++) {
    const cycle = cycles[i];
    cyclesExecuted++;

    const availableForTrading = balance - reservedAmount;
    const stakeByRelative = availableForTrading * (relativeStake / 100);
    const stake = fixedStake > 0 ? Math.min(fixedStake, availableForTrading) : stakeByRelative;

    if (stake <= 0) break;

    const rawPnL = ((cycle.close - cycle.open) / cycle.open) * stake * cycle.direction;
    const feeAmount = stake * (fees / 100);
    const netPnL = rawPnL - feeAmount;

    balance += netPnL;
    totalPnL += netPnL;
    totalFees += feeAmount;

    if (netPnL >= 0) {
      winCount++;
      totalWinPnL += netPnL;
    } else {
      lossCount++;
      totalLossPnL += Math.abs(netPnL);
    }

    if (balance > peakBalance) peakBalance = balance;
    const currentDrawdown = peakBalance > 0 ? (peakBalance - balance) / peakBalance : 0;
    maxDrawdown = Math.max(maxDrawdown, currentDrawdown);

    trades.push({
      cycleId: cycle.id,
      stake: +stake.toFixed(2),
      rawPnL: +rawPnL.toFixed(2),
      fee: +feeAmount.toFixed(2),
      netPnL: +netPnL.toFixed(2),
      balance: +balance.toFixed(2),
      drawdown: +(currentDrawdown * 100).toFixed(2),
    });

    if (currentDrawdown * 100 >= stopout) {
      stoppedOut = true;
      break;
    }
  }

  const totalTrades = winCount + lossCount;
  const winRate = totalTrades > 0 ? (winCount / totalTrades) * 100 : 0;
  const profitFactor = totalLossPnL > 0 ? totalWinPnL / totalLossPnL : totalWinPnL > 0 ? Infinity : 0;
  const roi = initialBalance > 0 ? (totalPnL / initialBalance) * 100 : 0;

  return {
    summary: {
      initialBalance,
      finalBalance: +balance.toFixed(2),
      totalPnL: +totalPnL.toFixed(2),
      roi: +roi.toFixed(2),
      maxDrawdown: +(maxDrawdown * 100).toFixed(2),
      profitFactor: +profitFactor.toFixed(2),
      winRate: +winRate.toFixed(1),
      totalTrades,
      winCount,
      lossCount,
      totalFees: +totalFees.toFixed(2),
      cyclesExecuted,
      stoppedOut,
    },
    trades,
  };
}

/**
 * Simple hash of params object for deduplication.
 */
export function hashParams(params) {
  const keys = Object.keys(params).sort();
  return keys.map((k) => `${k}=${params[k]}`).join("|");
}

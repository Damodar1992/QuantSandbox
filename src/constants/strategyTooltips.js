/**
 * Approved Strategy tooltip catalog (English).
 * One string per tooltip_key. Calculation lines stay inside the same string.
 * HTML <br> breaks from the inventory are stored as newlines.
 */

export const STRATEGY_TOOLTIPS = {
  "strategy.hyperopt_type": "Selects how the run searches the configured parameter grid.",
  "strategy.fold_size": "The number of candles assigned to a fold when the historical data is split for evaluation.",
  "strategy.score": "The ranking score recorded for this epoch. Its interpretation depends on the stage and scoring configuration.",
  "strategy.mfe": "The median of the largest favorable price moves measured across this epoch's cycles.",
  "strategy.mae": "The median of the largest adverse price moves measured across this epoch's cycles.",
  "strategy.air": "The median ratio of favorable movement to adverse movement across this epoch's cycles.",
  "strategy.hit_rate": "The share of evaluated cycles with a positive result.",
  "strategy.air_difference": "The normalized air difference component used in the stability formula.",
  "strategy.hit_rate_difference": "The normalized hit rate difference component used in the stability formula.",
  "strategy.mae_difference": "The normalized mae difference component used in the stability formula.",
  "strategy.mfe_difference": "The normalized mfe difference component used in the stability formula.",
  "strategy.std_ratio": "The normalized std ratio component used in the stability formula.",
  "strategy.air_score": "The normalized air score component used in the score formula.",
  "strategy.hit_rate_score": "The normalized hit rate score component used in the score formula.",
  "strategy.mae_score": "The normalized mae score component used in the score formula.",
  "strategy.mfe_score": "The normalized mfe score component used in the score formula.",
  "strategy.stability": "The normalized stability component used in the score formula.",
  "strategy.stability_score": "The penalty used to account for differences between evaluation splits.",
  "strategy.cycle_count": "The number of cycles evaluated for this epoch.",
  "strategy.median_return": "The median return across evaluated cycles.",
  "strategy.median_roi": "The median return on investment across evaluated cycles.",
  "strategy.median_duration": "The median cycle duration in candles.",
  "strategy.median_time_to_mfe": "The median number of candles from cycle start to the best favorable move.",
  "strategy.median_time_to_mae": "The median number of candles from cycle start to the worst adverse move.",
  "strategy.profit_capture": "Measures how much of the favorable move was captured by the realized result.",
  "strategy.max_drawdown": "The largest peak-to-trough decline in the evaluated balance or equity.",
  "strategy.gross_pnl": "The total monetary profit or loss before fees.",
  "strategy.total_roi": "The total return on investment reported for this epoch.",
  "strategy.mfe_med": "The median maximum favorable excursion across cycles.",
  "strategy.mae_med": "The median maximum adverse excursion across cycles.",
  "strategy.air_med": "The median favorable-to-adverse movement ratio.",
  "strategy.hr_val": "The share of evaluated cycles with a positive result.",
  "strategy.stoploss": "The loss threshold used to close a position when the trade moves against it.",
  "strategy.trailing_activation": "The favorable move required before the trailing stop becomes active.",
  "strategy.trailing_distance": "The distance the active trailing stop keeps from the best price reached since entry.",
  "strategy.loss_streak_threshold": "The number of consecutive losses required to trigger the cooldown.",
  "strategy.post_loss_cooldown_candles": "The number of candles to wait before allowing another entry after the loss streak triggers the cooldown.",
  "strategy.profit_factor": "Gross profit divided by gross loss in absolute terms.",
  "strategy.drawdown": "The drawdown recorded for this risk epoch.",
  "strategy.mini_backtest": "Uses the selected mini backtest settings and enables comparison with the full backtest. Leave empty for a standalone run.",
  "strategy.leverage": "The multiplier applied to position exposure when leverage is available.",
  "strategy.stake_mode": "Determines whether the stake is a fixed amount or a percentage of the available balance.",
  "strategy.stake_value": "The amount allocated per trade, interpreted according to Stake Mode.",
  "strategy.profit_reserving": "The percentage of profit set aside after each winning trade. Leave blank to keep all profit available for trading.",
  "strategy.roi": "Return on the starting capital for this backtest.",
  "strategy.pnl": "Net monetary profit or loss of the backtest.",
  "strategy.max_drawdown.2": "Largest peak-to-trough decline of the backtest account balance.",
  "strategy.profit_factor.2": "Gross profit divided by the absolute value of gross loss.",
  "strategy.win_rate": "The share of closed trades that were profitable.",
  "strategy.delta.2": "The difference between full and mini backtest metric values.",
  "strategy.market_change": "How much the traded instrument itself moved over the period. It is the benchmark the run is compared against.",
  "strategy.cagr": "Compound annual growth rate on the total balance (tradable + reserved), assuming profits are reinvested.\n\nCalculation:\n(final_balance(total) ÷ starting_balance(total)) ^ (1 ÷ (backtesting_days ÷ 365)) − 1",
  "strategy.max_dd_real_pct": "Deepest drop measured on equity over time, not on closed trades. It counts unrealised P/L, candle movement and the effect of leverage — so it also captures drawdowns of positions that later recovered.\n\nCalculation:\nPercentage: (Max Equity at Peak − Min Equity after Peak) ÷ Max Equity at Peak × 100\nEquity: Free tradable + Used Margin + Unrealized PnL",
  "strategy.calmar": "Annual return divided by the maximum drawdown. Answers “how much return per unit of pain”.",
  "strategy.profit_factor.3": "Above 1 the strategy earns more than it loses. Below 1 it does the opposite.\n\nCalculation:\nRatio: gross profit ÷ gross loss",
  "strategy.net_pl_pct": "Result on the **trading balance** — the money the strategy actually traded with. The reserve is not part of it.\n\nCalculation:\nPercentage: (End Tradable − Start Tradable) ÷ Start Tradable × 100\nAbsolute: End Tradable − Start Tradable",
  "strategy.annual_pl": "Net P/L stretched to a yearly basis without compounding. For the compounded version see CAGR in the cards below.\n\nCalculation:\nPercentage: PnL Tradable % ÷ (backtesting_days ÷ 365)",
  "strategy.max_dd_account": "Deepest drop from the highest balance peak to the lowest point, measured on closed trades only. Open positions and intra-candle moves are not part of it.\n\nCalculation:\nPercentage: (Max Tradable at Peak − Min Tradable after Peak) ÷ Max Tradable at Peak × 100\nAbsolute: Max Tradable at Peak − Min Tradable after Peak",
  "strategy.avg_dd": "Average depth of all drawdowns in the run, not just the worst one. A high average with a similar maximum means the strategy sat under water most of the time.",
  "strategy.sortino": "Return per unit of downside volatility. Unlike Sharpe it does not punish upside swings.",
  "strategy.sharpe": "Return per unit of total volatility.",
  "strategy.max_dd_abs": "Peak-to-trough distance taken over the whole equity curve, without splitting it into separate drawdown episodes. It differs slightly from Max drawdown, real because the two use different peak definitions.",
  "strategy.dd_high_low": "Balance at the start and at the bottom of the deepest drawdown.",
  "strategy.tradable": "Balance the strategy is allowed to trade with at the end of the run — the reserve is excluded.\n\nCalculation:\nAbsolute: Total balance − Reserved amount",
  "strategy.reserved": "Profit moved aside by Profit Reserving. It no longer takes part in trading.\n\nCalculation:\nAbsolute: sum(reserved amount per trade)",
  "strategy.ratio": "Represents the share of capital that is reserved compared to the tradable balance. Closer to 0 — most funds are available for trading. Closer to 1 — most funds are reserved and locked. = 1 — the reserve equals the tradable balance. > 1 — the reserve is larger than what is being traded.\n\nCalculation:\nRatio: Reserved amount ÷ Tradable amount",
  "strategy.winrate": "Share of profitable trades, written as wins / losses. On its own it says little: a strategy can win 80% of trades and still lose money if the losers are larger.\n\nCalculation:\nPercentage: wins ÷ (wins + losses) × 100",
  "strategy.expectancy": "Average result of one trade in R-multiples. Negative expectancy means the strategy loses on average, no matter the win rate.",
  "strategy.max_loss_n": "Longest unbroken run of losing trades. This is what a live account has to survive without the quant switching the strategy off.",
  "strategy.avg_loss_n": "Typical length of a losing streak.",
  "strategy.max_win_n": "Longest unbroken run of winning trades.",
  "strategy.avg_win_n": "Typical length of a winning streak.",
  "strategy.down_avg": "Idle time between one trade closing and the next one opening. Large downtime with many trades means the strategy fires in bursts.\n\nCalculation:\navg(idle periods)",
  "strategy.ccl": "Share of canceled trades against the rest, written as canceled / not canceled. A trade counts as canceled when its exit reason is canceled.\n\nCalculation:\nPercentage: canceled ÷ (canceled + not canceled) × 100",
  "strategy.net_pl_usdt": "The same result in quote currency. This is what the source report calls Total Profit.\n\nCalculation:\nAbsolute: End Tradable − Start Tradable",
  "strategy.max_dd_real_usdt": "The same equity-based drawdown in quote currency.\n\nCalculation:\nAbsolute: Max Equity at Peak − Min Equity after Peak\nEquity: Free tradable + Used Margin + Unrealized PnL",
  "strategy.max_loss_amt": "Money lost during the worst losing streak.",
  "strategy.avg_loss_amt": "Money lost during a typical losing streak.",
  "strategy.max_win_amt": "Money made during the best winning streak.",
  "strategy.avg_win_amt": "Money made during a typical winning streak.",
  "strategy.drawdown_duration": "The elapsed time spent below a previous balance peak.",
  "strategy.rel_max_dd_tradable": "Shows the maximum drawdown from any local maximum (Tradable) to the minimum value (Trough) after it. Based on closed trades only. Example: Peak 1 = 120 → values after it: 110, 105, 130 → minimum 105 = Trough after Peak 1. Drawdown = (120 − 105) / 120 = 12.5%. Peak 2 = 130 → values after it: 125, 140 → minimum 125 = Trough after Peak 2. Drawdown = (130 − 125) / 130 ≈ 3.85%. Relative Max Drawdown = the maximum of these drawdowns = 12.5%.\n\nCalculation:\nPercentage: (Max Tradable at Peak − Min Tradable after Peak) ÷ Max Tradable at Peak × 100\nAbsolute: Max Tradable at Peak − Min Tradable after Peak",
  "strategy.rel_dd_tradable": "Measures how much the tradable balance fell from the start of the period. Absolute decline from start of the year to the lowest point. Based on closed trades only.\n\nCalculation:\nPercentage: (Start Tradable − Min Tradable) ÷ Start Tradable × 100\nAbsolute: Start Tradable − Min Tradable",
  "strategy.rel_max_dd_equity": "Shows the maximum drawdown from any local maximum (Equity) to the minimum value (Trough) after it. Includes open trades. Example: Peak 1 = 120 → values after it: 110, 105, 130 → minimum 105 = Trough after Peak 1. Drawdown = (120 − 105) / 120 = 12.5%. Peak 2 = 130 → values after it: 125, 140 → minimum 125 = Trough after Peak 2. Drawdown = (130 − 125) / 130 ≈ 3.85%. Relative Max Drawdown = the maximum of these drawdowns = 12.5%.\n\nCalculation:\nPercentage: (Max Equity at Peak − Min Equity after Peak) ÷ Max Equity at Peak × 100\nAbsolute: Max Equity at Peak − Min Equity after Peak",
  "strategy.rel_dd_equity": "Shows how far equity fell from the starting point of the period. Absolute equity drawdown from period start. Includes open trades.\n\nCalculation:\nPercentage: (Start Equity − Min Equity) ÷ Start Equity × 100\nAbsolute: Start Equity − Min Equity",
  "strategy.pnl_tradable": "Profit and Loss for tradable balance during the period. Percentage shows the relative return on the starting tradable balance. Absolute shows the actual amount gained or lost in tradable balance.\n\nCalculation:\nPercentage: (End Tradable − Start Tradable) ÷ Start Tradable × 100\nAbsolute: End Tradable − Start Tradable",
  "strategy.pnl_reserved": "Profit reserved funds during the period. Percentage shows the reserved amount relative to the starting tradable balance. Absolute shows the actual reserved amount.\n\nCalculation:\nPercentage: (Reserved amount ÷ Start Tradable) × 100\nAbsolute: Reserved amount",
  "strategy.pnl_total": "Total Profit and Loss combining tradable and reserved amounts. Percentage shows the combined relative return. Absolute shows the total actual amount gained or lost.\n\nCalculation:\nPercentage: PnL Tradable % + PnL Reserved %\nAbsolute: PnL Tradable + PnL Reserved",
  "strategy.cagr_tradable": "CAGR (Compound Annual Growth Rate) represents the smoothed annual growth rate of capital over a given period, assuming profits are reinvested. It’s widely used to compare strategies or investments on a normalized yearly basis. Calculated with tradable amount.\n\nCalculation:\n(final_balance(tradable) ÷ starting_balance(tradable)) ^ (1 ÷ (backtesting_days ÷ 365)) − 1",
  "strategy.cagr_total": "CAGR (Compound Annual Growth Rate) represents the smoothed annual growth rate of capital over a given period, assuming profits are reinvested. It’s widely used to compare strategies or investments on a normalized yearly basis. Calculated with total amount (total = tradable + reserved).\n\nCalculation:\n(final_balance(total) ÷ starting_balance(total)) ^ (1 ÷ (backtesting_days ÷ 365)) − 1",
  "strategy.max_tradable_at_peak": "Max Tradable at Peak — the local peak value of Tradable in the selected period. It marks the starting point of a drawdown. For each peak, we measure the minimum value after it (Trough after Peak) to calculate the Relative Max Drawdown. Example: Values: 100, 120, 110, 105, 130, 125. Peak 1 = 120 → Trough after Peak = 105. Peak 2 = 130 → Trough after Peak = 125.",
  "strategy.min_tradable_after_peak": "Trough after Peak is the minimum value after a local maximum (Peak), before the next peak, or before the end of the period. It shows the depth of the decline after a specific maximum Tradable. Example: Peak 1 = 120 → values after it: 110, 105, 130 → minimum 105 = Trough after Peak 1.",
  "strategy.max_equity_at_peak": "Max Equity at Peak — the local peak value of Equity in the selected period. It marks the starting point of a drawdown. For each peak, we measure the minimum value after it (Trough after Peak) to calculate the Relative Max Drawdown. Example: Values: 100, 120, 110, 105, 130, 125. Peak 1 = 120 → Trough after Peak = 105. Peak 2 = 130 → Trough after Peak = 125.",
  "strategy.min_equity_after_peak": "Trough after Peak is the minimum value after a local maximum (Peak), before the next peak, or before the end of the period. It shows the depth of the decline after a specific maximum Equity. Example: Peak 1 = 120 → values after it: 110, 105, 130 → minimum 105 = Trough after Peak 1. Peak 2 = 130 → values after it: 125, 140 → minimum 125 = Trough after Peak 2.",
  "strategy.stake_amount": "Position size at entry, with leverage in brackets.",
  "strategy.liq_price": "Price at which the position would be liquidated by the exchange.",
  "strategy.net_pl_pct.2": "Result of this row — an enter tag, an exit reason or a single trade — in percent of the stake it used. This is not an account-level figure; for that see Net P/L tradable, %.\n\nCalculation:\nPercentage: net result of the row ÷ stake used × 100",
  "strategy.net_pl_usdt.2": "The same row-level result in quote currency, after fees and funding.\n\nCalculation:\nAbsolute: sum of net result across the trades of the row",
  "strategy.reserved.2": "Profit moved to the reserve by this particular trade.",
  "strategy.simulation_mode": "Selects the simulation setup used to rerun the baseline strategy.",
  "strategy.shuffle_approach": "Selects the method used to shuffle the input for the simulations.",
  "strategy.mcl": "The maximum consecutive losses target for this level.",
  "strategy.mcw": "The maximum consecutive wins target for this level.",
  "strategy.acl": "The average consecutive losses target for this level.",
  "strategy.acw": "The average consecutive wins target for this level.",
  "strategy.original_percentile": "The position of the original result within the distribution of simulated results.",
  "strategy.final_pnl": "Profit or loss at the end of the simulation.",
  "strategy.roi.2": "Return on the starting balance.",
  "strategy.pf": "Gross profit divided by the absolute value of gross loss.",
  "strategy.dd_peak": "Largest decline from a previous balance peak.",
  "strategy.max_dd_init": "Largest percentage shortfall below the starting balance.",
  "strategy.mcl.2": "Longest streak of consecutive losing trades.",
  "strategy.mcw.2": "Longest streak of consecutive winning trades.",
  "strategy.acl.2": "Average length of a losing streak in trades.",
  "strategy.acw.2": "Average length of a winning streak in trades.",
  "strategy.max_rec_init": "Longest period spent below the starting balance before recovery.",
  "strategy.rec_peak": "Time taken to regain a previous balance peak after a drawdown.",
  "strategy.unclosed": "Recovery phases still open at the end of the dataset.",
  "strategy.loss_recovered": "Number of losing streaks followed by a recovery.",
  "strategy.loss_rec_rate": "Share of losing streaks followed by a recovery.",
  "strategy.win_to_rec": "Number of winning streaks that led to recovery.",
  "strategy.win_rec_rate": "Share of winning streaks that led to recovery.",
  "strategy.roi.3": "Return on the starting capital of the synthetic backtest.",
  "strategy.pnl.2": "Net monetary profit or loss of the synthetic backtest.",
  "strategy.max_drawdown.3": "Largest peak-to-trough decline in the synthetic run.",
  "strategy.percentile": "The percentile rank of the original result among synthetic runs."
};

/** block.key + field.key -> tooltip_key, with the stages where the field applies. */
export const STRATEGY_TOOLTIP_PLACEMENTS = {
  "hyperopt_parameters": {
    "hyperopt_type": {
      "stages": [
        1,
        2,
        3,
        4
      ],
      "tooltipKey": "strategy.hyperopt_type"
    },
    "fold_size": {
      "stages": [
        1
      ],
      "tooltipKey": "strategy.fold_size"
    }
  },
  "favorite_epochs": {
    "score": {
      "stages": [
        1,
        2,
        3,
        4
      ],
      "tooltipKey": "strategy.score"
    },
    "mfe": {
      "stages": [
        1
      ],
      "tooltipKey": "strategy.mfe"
    },
    "mae": {
      "stages": [
        1
      ],
      "tooltipKey": "strategy.mae"
    },
    "air": {
      "stages": [
        1
      ],
      "tooltipKey": "strategy.air"
    },
    "hit_rate": {
      "stages": [
        1
      ],
      "tooltipKey": "strategy.hit_rate"
    },
    "profit_factor": {
      "stages": [
        4
      ],
      "tooltipKey": "strategy.profit_factor"
    },
    "drawdown": {
      "stages": [
        4
      ],
      "tooltipKey": "strategy.drawdown"
    }
  },
  "post_processing_info.stability": {
    "air_difference": {
      "stages": [
        1,
        2,
        3,
        4
      ],
      "tooltipKey": "strategy.air_difference"
    },
    "hit_rate_difference": {
      "stages": [
        1,
        2,
        3,
        4
      ],
      "tooltipKey": "strategy.hit_rate_difference"
    },
    "mae_difference": {
      "stages": [
        1,
        2,
        3,
        4
      ],
      "tooltipKey": "strategy.mae_difference"
    },
    "mfe_difference": {
      "stages": [
        1,
        2,
        3,
        4
      ],
      "tooltipKey": "strategy.mfe_difference"
    },
    "std_ratio": {
      "stages": [
        1,
        2,
        3,
        4
      ],
      "tooltipKey": "strategy.std_ratio"
    }
  },
  "post_processing_info.score": {
    "air_score": {
      "stages": [
        1,
        2,
        3,
        4
      ],
      "tooltipKey": "strategy.air_score"
    },
    "hit_rate_score": {
      "stages": [
        1,
        2,
        3,
        4
      ],
      "tooltipKey": "strategy.hit_rate_score"
    },
    "mae_score": {
      "stages": [
        1,
        2,
        3,
        4
      ],
      "tooltipKey": "strategy.mae_score"
    },
    "mfe_score": {
      "stages": [
        1,
        2,
        3,
        4
      ],
      "tooltipKey": "strategy.mfe_score"
    },
    "stability": {
      "stages": [
        1,
        2,
        3,
        4
      ],
      "tooltipKey": "strategy.stability"
    }
  },
  "source_epoch_info": {
    "stability_score": {
      "stages": [
        1,
        2,
        3,
        4
      ],
      "tooltipKey": "strategy.stability_score"
    },
    "cycle_count": {
      "stages": [
        1,
        2,
        3,
        4
      ],
      "tooltipKey": "strategy.cycle_count"
    },
    "median_return": {
      "stages": [
        1,
        2,
        3,
        4
      ],
      "tooltipKey": "strategy.median_return"
    },
    "median_roi": {
      "stages": [
        1,
        2,
        3,
        4
      ],
      "tooltipKey": "strategy.median_roi"
    },
    "median_duration": {
      "stages": [
        1,
        2,
        3,
        4
      ],
      "tooltipKey": "strategy.median_duration"
    },
    "median_time_to_mfe": {
      "stages": [
        1,
        2,
        3,
        4
      ],
      "tooltipKey": "strategy.median_time_to_mfe"
    },
    "median_time_to_mae": {
      "stages": [
        1,
        2,
        3,
        4
      ],
      "tooltipKey": "strategy.median_time_to_mae"
    },
    "profit_capture": {
      "stages": [
        1,
        2,
        3,
        4
      ],
      "tooltipKey": "strategy.profit_capture"
    },
    "max_drawdown": {
      "stages": [
        1,
        2,
        3,
        4
      ],
      "tooltipKey": "strategy.max_drawdown"
    },
    "gross_pnl": {
      "stages": [
        1,
        2,
        3,
        4
      ],
      "tooltipKey": "strategy.gross_pnl"
    },
    "total_roi": {
      "stages": [
        1,
        2,
        3,
        4
      ],
      "tooltipKey": "strategy.total_roi"
    },
    "mfe_med": {
      "stages": [
        1,
        2,
        3,
        4
      ],
      "tooltipKey": "strategy.mfe_med"
    },
    "mae_med": {
      "stages": [
        1,
        2,
        3,
        4
      ],
      "tooltipKey": "strategy.mae_med"
    },
    "air_med": {
      "stages": [
        1,
        2,
        3,
        4
      ],
      "tooltipKey": "strategy.air_med"
    },
    "hr_val": {
      "stages": [
        1,
        2,
        3,
        4
      ],
      "tooltipKey": "strategy.hr_val"
    }
  },
  "stoplosses": {
    "stoploss": {
      "stages": [
        4
      ],
      "tooltipKey": "strategy.stoploss"
    },
    "trailing_activation": {
      "stages": [
        4
      ],
      "tooltipKey": "strategy.trailing_activation"
    },
    "trailing_distance": {
      "stages": [
        4
      ],
      "tooltipKey": "strategy.trailing_distance"
    }
  },
  "cooldown": {
    "loss_streak_threshold": {
      "stages": [
        4
      ],
      "tooltipKey": "strategy.loss_streak_threshold"
    },
    "post_loss_cooldown_candles": {
      "stages": [
        4
      ],
      "tooltipKey": "strategy.post_loss_cooldown_candles"
    }
  },
  "backtest": {
    "mini_backtest": {
      "stages": [
        5
      ],
      "tooltipKey": "strategy.mini_backtest"
    },
    "leverage": {
      "stages": [
        5
      ],
      "tooltipKey": "strategy.leverage"
    },
    "stake_mode": {
      "stages": [
        5
      ],
      "tooltipKey": "strategy.stake_mode"
    },
    "stake_value": {
      "stages": [
        5
      ],
      "tooltipKey": "strategy.stake_value"
    },
    "profit_reserving": {
      "stages": [
        5
      ],
      "tooltipKey": "strategy.profit_reserving"
    }
  },
  "backtest_core_metrics": {
    "roi": {
      "stages": [
        5
      ],
      "tooltipKey": "strategy.roi"
    },
    "pnl": {
      "stages": [
        5
      ],
      "tooltipKey": "strategy.pnl"
    },
    "max_drawdown": {
      "stages": [
        5
      ],
      "tooltipKey": "strategy.max_drawdown.2"
    },
    "profit_factor": {
      "stages": [
        5
      ],
      "tooltipKey": "strategy.profit_factor.2"
    },
    "win_rate": {
      "stages": [
        5
      ],
      "tooltipKey": "strategy.win_rate"
    },
    "delta": {
      "stages": [
        5
      ],
      "tooltipKey": "strategy.delta.2"
    }
  },
  "backtesting_info.performance": {
    "market_change": {
      "stages": [
        5
      ],
      "tooltipKey": "strategy.market_change"
    },
    "cagr": {
      "stages": [
        5
      ],
      "tooltipKey": "strategy.cagr"
    },
    "max_dd_real_pct": {
      "stages": [
        5
      ],
      "tooltipKey": "strategy.max_dd_real_pct"
    },
    "calmar": {
      "stages": [
        5
      ],
      "tooltipKey": "strategy.calmar"
    },
    "profit_factor": {
      "stages": [
        5
      ],
      "tooltipKey": "strategy.profit_factor.3"
    },
    "net_pl_pct": {
      "stages": [
        5
      ],
      "tooltipKey": "strategy.net_pl_pct"
    },
    "annual_pl": {
      "stages": [
        5
      ],
      "tooltipKey": "strategy.annual_pl"
    },
    "max_dd_account": {
      "stages": [
        5
      ],
      "tooltipKey": "strategy.max_dd_account"
    },
    "avg_dd": {
      "stages": [
        5
      ],
      "tooltipKey": "strategy.avg_dd"
    },
    "sortino": {
      "stages": [
        5
      ],
      "tooltipKey": "strategy.sortino"
    },
    "sharpe": {
      "stages": [
        5
      ],
      "tooltipKey": "strategy.sharpe"
    },
    "max_dd_abs": {
      "stages": [
        5
      ],
      "tooltipKey": "strategy.max_dd_abs"
    },
    "dd_high_low": {
      "stages": [
        5
      ],
      "tooltipKey": "strategy.dd_high_low"
    },
    "tradable": {
      "stages": [
        5
      ],
      "tooltipKey": "strategy.tradable"
    },
    "reserved": {
      "stages": [
        5
      ],
      "tooltipKey": "strategy.reserved"
    },
    "ratio": {
      "stages": [
        5
      ],
      "tooltipKey": "strategy.ratio"
    },
    "winrate": {
      "stages": [
        5
      ],
      "tooltipKey": "strategy.winrate"
    },
    "expectancy": {
      "stages": [
        5
      ],
      "tooltipKey": "strategy.expectancy"
    },
    "max_loss_n": {
      "stages": [
        5
      ],
      "tooltipKey": "strategy.max_loss_n"
    },
    "avg_loss_n": {
      "stages": [
        5
      ],
      "tooltipKey": "strategy.avg_loss_n"
    },
    "max_win_n": {
      "stages": [
        5
      ],
      "tooltipKey": "strategy.max_win_n"
    },
    "avg_win_n": {
      "stages": [
        5
      ],
      "tooltipKey": "strategy.avg_win_n"
    },
    "down_avg": {
      "stages": [
        5
      ],
      "tooltipKey": "strategy.down_avg"
    },
    "ccl": {
      "stages": [
        5
      ],
      "tooltipKey": "strategy.ccl"
    },
    "drawdown_duration": {
      "stages": [
        5
      ],
      "tooltipKey": "strategy.drawdown_duration"
    }
  },
  "backtesting_info.temporal": {
    "rel_max_dd_tradable": {
      "stages": [
        5
      ],
      "tooltipKey": "strategy.rel_max_dd_tradable"
    },
    "rel_dd_tradable": {
      "stages": [
        5
      ],
      "tooltipKey": "strategy.rel_dd_tradable"
    },
    "rel_max_dd_equity": {
      "stages": [
        5
      ],
      "tooltipKey": "strategy.rel_max_dd_equity"
    },
    "rel_dd_equity": {
      "stages": [
        5
      ],
      "tooltipKey": "strategy.rel_dd_equity"
    },
    "pnl_tradable": {
      "stages": [
        5
      ],
      "tooltipKey": "strategy.pnl_tradable"
    },
    "pnl_reserved": {
      "stages": [
        5
      ],
      "tooltipKey": "strategy.pnl_reserved"
    },
    "pnl_total": {
      "stages": [
        5
      ],
      "tooltipKey": "strategy.pnl_total"
    },
    "cagr_tradable": {
      "stages": [
        5
      ],
      "tooltipKey": "strategy.cagr_tradable"
    },
    "cagr_total": {
      "stages": [
        5
      ],
      "tooltipKey": "strategy.cagr_total"
    },
    "max_tradable_at_peak": {
      "stages": [
        5
      ],
      "tooltipKey": "strategy.max_tradable_at_peak"
    },
    "min_tradable_after_peak": {
      "stages": [
        5
      ],
      "tooltipKey": "strategy.min_tradable_after_peak"
    },
    "max_equity_at_peak": {
      "stages": [
        5
      ],
      "tooltipKey": "strategy.max_equity_at_peak"
    },
    "min_equity_after_peak": {
      "stages": [
        5
      ],
      "tooltipKey": "strategy.min_equity_after_peak"
    }
  },
  "backtesting_info.trades": {
    "stake_amount": {
      "stages": [
        5
      ],
      "tooltipKey": "strategy.stake_amount"
    },
    "liq_price": {
      "stages": [
        5
      ],
      "tooltipKey": "strategy.liq_price"
    },
    "net_pl_pct": {
      "stages": [
        5
      ],
      "tooltipKey": "strategy.net_pl_pct.2"
    },
    "net_pl_usdt": {
      "stages": [
        5
      ],
      "tooltipKey": "strategy.net_pl_usdt.2"
    },
    "reserved": {
      "stages": [
        5
      ],
      "tooltipKey": "strategy.reserved.2"
    }
  },
  "shuffler": {
    "simulation_mode": {
      "stages": [
        5
      ],
      "tooltipKey": "strategy.simulation_mode"
    },
    "shuffle_approach": {
      "stages": [
        5
      ],
      "tooltipKey": "strategy.shuffle_approach"
    }
  },
  "shuffler_run_parameters": {
    "mcl": {
      "stages": [
        5
      ],
      "tooltipKey": "strategy.mcl"
    },
    "mcw": {
      "stages": [
        5
      ],
      "tooltipKey": "strategy.mcw"
    },
    "acl": {
      "stages": [
        5
      ],
      "tooltipKey": "strategy.acl"
    },
    "acw": {
      "stages": [
        5
      ],
      "tooltipKey": "strategy.acw"
    }
  },
  "shuffle_info.summary": {
    "original_percentile": {
      "stages": [
        5
      ],
      "tooltipKey": "strategy.original_percentile"
    }
  },
  "shuffle_info.summary.general": {
    "final_pnl": {
      "stages": [
        5
      ],
      "tooltipKey": "strategy.final_pnl"
    },
    "roi": {
      "stages": [
        5
      ],
      "tooltipKey": "strategy.roi.2"
    },
    "pf": {
      "stages": [
        5
      ],
      "tooltipKey": "strategy.pf"
    },
    "dd_peak": {
      "stages": [
        5
      ],
      "tooltipKey": "strategy.dd_peak"
    },
    "max_dd_init": {
      "stages": [
        5
      ],
      "tooltipKey": "strategy.max_dd_init"
    },
    "mcl": {
      "stages": [
        5
      ],
      "tooltipKey": "strategy.mcl.2"
    },
    "mcw": {
      "stages": [
        5
      ],
      "tooltipKey": "strategy.mcw.2"
    },
    "acl": {
      "stages": [
        5
      ],
      "tooltipKey": "strategy.acl.2"
    },
    "acw": {
      "stages": [
        5
      ],
      "tooltipKey": "strategy.acw.2"
    }
  },
  "shuffle_info.summary.recovery": {
    "max_rec_init": {
      "stages": [
        5
      ],
      "tooltipKey": "strategy.max_rec_init"
    },
    "rec_peak": {
      "stages": [
        5
      ],
      "tooltipKey": "strategy.rec_peak"
    },
    "unclosed": {
      "stages": [
        5
      ],
      "tooltipKey": "strategy.unclosed"
    },
    "loss_recovered": {
      "stages": [
        5
      ],
      "tooltipKey": "strategy.loss_recovered"
    },
    "loss_rec_rate": {
      "stages": [
        5
      ],
      "tooltipKey": "strategy.loss_rec_rate"
    },
    "win_to_rec": {
      "stages": [
        5
      ],
      "tooltipKey": "strategy.win_to_rec"
    },
    "win_rec_rate": {
      "stages": [
        5
      ],
      "tooltipKey": "strategy.win_rec_rate"
    }
  },
  "synthetic_core_metrics": {
    "roi": {
      "stages": [
        5
      ],
      "tooltipKey": "strategy.roi.3"
    },
    "pnl": {
      "stages": [
        5
      ],
      "tooltipKey": "strategy.pnl.2"
    },
    "max_drawdown": {
      "stages": [
        5
      ],
      "tooltipKey": "strategy.max_drawdown.3"
    },
    "profit_factor": {
      "stages": [
        5
      ],
      "tooltipKey": "strategy.profit_factor.2"
    },
    "win_rate": {
      "stages": [
        5
      ],
      "tooltipKey": "strategy.win_rate"
    },
    "percentile": {
      "stages": [
        5
      ],
      "tooltipKey": "strategy.percentile"
    }
  },
  "synthetic_info.performance": {
    "market_change": {
      "stages": [
        5
      ],
      "tooltipKey": "strategy.market_change"
    },
    "cagr": {
      "stages": [
        5
      ],
      "tooltipKey": "strategy.cagr"
    },
    "max_dd_real_pct": {
      "stages": [
        5
      ],
      "tooltipKey": "strategy.max_dd_real_pct"
    },
    "calmar": {
      "stages": [
        5
      ],
      "tooltipKey": "strategy.calmar"
    },
    "profit_factor": {
      "stages": [
        5
      ],
      "tooltipKey": "strategy.profit_factor.3"
    },
    "net_pl_pct": {
      "stages": [
        5
      ],
      "tooltipKey": "strategy.net_pl_pct"
    },
    "annual_pl": {
      "stages": [
        5
      ],
      "tooltipKey": "strategy.annual_pl"
    },
    "max_dd_account": {
      "stages": [
        5
      ],
      "tooltipKey": "strategy.max_dd_account"
    },
    "avg_dd": {
      "stages": [
        5
      ],
      "tooltipKey": "strategy.avg_dd"
    },
    "sortino": {
      "stages": [
        5
      ],
      "tooltipKey": "strategy.sortino"
    },
    "sharpe": {
      "stages": [
        5
      ],
      "tooltipKey": "strategy.sharpe"
    },
    "max_dd_abs": {
      "stages": [
        5
      ],
      "tooltipKey": "strategy.max_dd_abs"
    },
    "dd_high_low": {
      "stages": [
        5
      ],
      "tooltipKey": "strategy.dd_high_low"
    },
    "tradable": {
      "stages": [
        5
      ],
      "tooltipKey": "strategy.tradable"
    },
    "reserved": {
      "stages": [
        5
      ],
      "tooltipKey": "strategy.reserved"
    },
    "ratio": {
      "stages": [
        5
      ],
      "tooltipKey": "strategy.ratio"
    },
    "winrate": {
      "stages": [
        5
      ],
      "tooltipKey": "strategy.winrate"
    },
    "expectancy": {
      "stages": [
        5
      ],
      "tooltipKey": "strategy.expectancy"
    },
    "max_loss_n": {
      "stages": [
        5
      ],
      "tooltipKey": "strategy.max_loss_n"
    },
    "avg_loss_n": {
      "stages": [
        5
      ],
      "tooltipKey": "strategy.avg_loss_n"
    },
    "max_win_n": {
      "stages": [
        5
      ],
      "tooltipKey": "strategy.max_win_n"
    },
    "avg_win_n": {
      "stages": [
        5
      ],
      "tooltipKey": "strategy.avg_win_n"
    },
    "down_avg": {
      "stages": [
        5
      ],
      "tooltipKey": "strategy.down_avg"
    },
    "ccl": {
      "stages": [
        5
      ],
      "tooltipKey": "strategy.ccl"
    },
    "net_pl_usdt": {
      "stages": [
        5
      ],
      "tooltipKey": "strategy.net_pl_usdt"
    },
    "max_dd_real_usdt": {
      "stages": [
        5
      ],
      "tooltipKey": "strategy.max_dd_real_usdt"
    },
    "max_loss_amt": {
      "stages": [
        5
      ],
      "tooltipKey": "strategy.max_loss_amt"
    },
    "avg_loss_amt": {
      "stages": [
        5
      ],
      "tooltipKey": "strategy.avg_loss_amt"
    },
    "max_win_amt": {
      "stages": [
        5
      ],
      "tooltipKey": "strategy.max_win_amt"
    },
    "avg_win_amt": {
      "stages": [
        5
      ],
      "tooltipKey": "strategy.avg_win_amt"
    }
  },
  "synthetic_info.temporal": {
    "rel_max_dd_tradable": {
      "stages": [
        5
      ],
      "tooltipKey": "strategy.rel_max_dd_tradable"
    },
    "rel_dd_tradable": {
      "stages": [
        5
      ],
      "tooltipKey": "strategy.rel_dd_tradable"
    },
    "rel_max_dd_equity": {
      "stages": [
        5
      ],
      "tooltipKey": "strategy.rel_max_dd_equity"
    },
    "rel_dd_equity": {
      "stages": [
        5
      ],
      "tooltipKey": "strategy.rel_dd_equity"
    },
    "pnl_tradable": {
      "stages": [
        5
      ],
      "tooltipKey": "strategy.pnl_tradable"
    },
    "pnl_reserved": {
      "stages": [
        5
      ],
      "tooltipKey": "strategy.pnl_reserved"
    },
    "pnl_total": {
      "stages": [
        5
      ],
      "tooltipKey": "strategy.pnl_total"
    },
    "cagr_tradable": {
      "stages": [
        5
      ],
      "tooltipKey": "strategy.cagr_tradable"
    },
    "cagr_total": {
      "stages": [
        5
      ],
      "tooltipKey": "strategy.cagr_total"
    },
    "max_tradable_at_peak": {
      "stages": [
        5
      ],
      "tooltipKey": "strategy.max_tradable_at_peak"
    },
    "min_tradable_after_peak": {
      "stages": [
        5
      ],
      "tooltipKey": "strategy.min_tradable_after_peak"
    },
    "max_equity_at_peak": {
      "stages": [
        5
      ],
      "tooltipKey": "strategy.max_equity_at_peak"
    },
    "min_equity_after_peak": {
      "stages": [
        5
      ],
      "tooltipKey": "strategy.min_equity_after_peak"
    }
  }
};

/**
 * Mock control keys that differ from the inventory field.key.
 * A block resolves an alias to a field key, then the field key resolves to one catalog key.
 */
export const STRATEGY_UI_FIELD_ALIASES = {
  "favorite_epochs": {
    "HitRate": "hit_rate"
  },
  "post_processing_info.stability": {
    "normDiffAIR": "air_difference",
    "normDiffHitRate": "hit_rate_difference",
    "normDiffMAE": "mae_difference",
    "normDiffMFE": "mfe_difference",
    "normDiffStd": "std_ratio"
  },
  "post_processing_info.score": {
    "normAIR": "air_score",
    "normHitRate": "hit_rate_score",
    "normMAE": "mae_score",
    "normMFE": "mfe_score",
    "normStability": "stability",
    "Stability": "stability"
  },
  "source_epoch_info": {
    "ret_med": "median_return",
    "roi_med": "median_roi",
    "dur_med": "median_duration",
    "tt_mfe_med": "median_time_to_mfe",
    "tt_mae_med": "median_time_to_mae",
    "total_pnl_gross": "gross_pnl"
  },
  "backtest_core_metrics": {
    "maxdd": "max_drawdown",
    "pf": "profit_factor",
    "winrate": "win_rate"
  },
  "backtesting_info.performance": {
    "marketChange": "market_change",
    "maxDdRealPct": "max_dd_real_pct",
    "profitFactor": "profit_factor",
    "netPlPct": "net_pl_pct",
    "annualPl": "annual_pl",
    "maxDdAccount": "max_dd_account",
    "avgDd": "avg_dd",
    "maxDdAbs": "max_dd_abs",
    "ddHighLow": "dd_high_low",
    "maxLossN": "max_loss_n",
    "avgLossN": "avg_loss_n",
    "maxWinN": "max_win_n",
    "avgWinN": "avg_win_n",
    "downAvg": "down_avg",
    "ddDuration": "drawdown_duration"
  },
  "backtesting_info.temporal": {
    "relMaxDdTradable": "rel_max_dd_tradable",
    "relDdTradable": "rel_dd_tradable",
    "relMaxDdEquity": "rel_max_dd_equity",
    "relDdEquity": "rel_dd_equity",
    "pnlTradable": "pnl_tradable",
    "pnlReserved": "pnl_reserved",
    "pnlTotal": "pnl_total",
    "cagrTradable": "cagr_tradable",
    "cagrTotal": "cagr_total",
    "maxTradableAtPeak": "max_tradable_at_peak",
    "minTradableAfterPeak": "min_tradable_after_peak",
    "maxEquityAtPeak": "max_equity_at_peak",
    "minEquityAfterPeak": "min_equity_after_peak"
  },
  "backtesting_info.trades": {
    "stakeAmount": "stake_amount",
    "liqPrice": "liq_price",
    "netPlPct": "net_pl_pct",
    "netPlUsdt": "net_pl_usdt"
  },
  "shuffle_info.summary.general": {
    "finalPnl": "final_pnl",
    "ddPeak": "dd_peak",
    "maxDdInit": "max_dd_init"
  },
  "shuffle_info.summary.recovery": {
    "maxRecInit": "max_rec_init",
    "recPeak": "rec_peak",
    "lossRecovered": "loss_recovered",
    "lossRecRate": "loss_rec_rate",
    "winToRec": "win_to_rec",
    "winRecRate": "win_rec_rate"
  },
  "synthetic_core_metrics": {
    "maxdd": "max_drawdown",
    "pf": "profit_factor",
    "winrate": "win_rate"
  },
  "synthetic_info.performance": {
    "marketChange": "market_change",
    "maxDdRealPct": "max_dd_real_pct",
    "profitFactor": "profit_factor",
    "netPlPct": "net_pl_pct",
    "netPlUsdt": "net_pl_usdt",
    "annualPl": "annual_pl",
    "maxDdAccount": "max_dd_account",
    "avgDd": "avg_dd",
    "maxDdAbs": "max_dd_abs",
    "maxDdRealUsdt": "max_dd_real_usdt",
    "ddHighLow": "dd_high_low",
    "maxLossN": "max_loss_n",
    "avgLossN": "avg_loss_n",
    "maxLossAmt": "max_loss_amt",
    "avgLossAmt": "avg_loss_amt",
    "maxWinN": "max_win_n",
    "avgWinN": "avg_win_n",
    "maxWinAmt": "max_win_amt",
    "avgWinAmt": "avg_win_amt",
    "downAvg": "down_avg"
  },
  "synthetic_info.temporal": {
    "relMaxDdTradable": "rel_max_dd_tradable",
    "relDdTradable": "rel_dd_tradable",
    "relMaxDdEquity": "rel_max_dd_equity",
    "relDdEquity": "rel_dd_equity",
    "pnlTradable": "pnl_tradable",
    "pnlReserved": "pnl_reserved",
    "pnlTotal": "pnl_total",
    "cagrTradable": "cagr_tradable",
    "cagrTotal": "cagr_total",
    "maxTradableAtPeak": "max_tradable_at_peak",
    "minTradableAfterPeak": "min_tradable_after_peak",
    "maxEquityAtPeak": "max_equity_at_peak",
    "minEquityAfterPeak": "min_equity_after_peak"
  }
};

export function strategyTooltip(tooltipKey) {
  const text = STRATEGY_TOOLTIPS[tooltipKey];
  return typeof text === "string" && text ? text : null;
}

/**
 * @param {string} blockKey
 * @param {string} fieldKey inventory field.key or a mock alias
 * @param {number} [stage] when set, stage-specific rows return null outside their stages
 */
export function strategyUiTooltip(blockKey, fieldKey, stage) {
  const fields = STRATEGY_TOOLTIP_PLACEMENTS[blockKey];
  if (!fields || fieldKey == null) return null;
  const alias = STRATEGY_UI_FIELD_ALIASES[blockKey]?.[fieldKey];
  const resolvedKey = alias || fieldKey;
  const placement = fields[resolvedKey];
  if (!placement) return null;
  if (stage != null && !placement.stages.includes(Number(stage))) return null;
  return strategyTooltip(placement.tooltipKey);
}

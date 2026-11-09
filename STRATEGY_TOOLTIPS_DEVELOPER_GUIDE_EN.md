# Strategy tooltips — developer implementation guide

**Status:** Local implementation specification in English. Based on the [Strategy tooltip inventory](https://docs.google.com/spreadsheets/d/1OLhz8_l9vuo2di6535hpf15-pUXoWz5ZJ5X4XAQ_9Mg/edit?gid=849843283#gid=849843283), captured on 7 November 2026, with the later requested exclusion of `mini_backtest` and two semantic key merges described below. If the source sheet differs, use the corrections in this guide for this task.

**Scope:** Strategy, Stages 1–5; **164 field placements across 20 blocks**, resolved through **123 shared tooltip definitions**. The UI text is English only.

## What to implement

1. Add or update the tooltip at every placement in the tables below. Match the actual UI by stage, block, and visible label; the React variable name may differ from `field.key`. If a listed field is absent or has a different meaning, record it as unmatched. Do not create a new field just to attach a tooltip.
2. Existing Backtesting, Shuffler, and Synthetic tooltips count as placements to review. Compare their content with this guide and update it where necessary. Never add a second tooltip trigger to the same field. The current mock has reusable tooltip components in `src/features/backtesting/components/BtInfoTooltip.jsx` and the Radix/shadcn primitive in `src/components/ui/tooltip.jsx`.
3. Store each `tooltip_key` description once and reuse it wherever the key appears. `Calculation:` is part of the same `description`, including its line breaks. Preserve bold emphasis marked with `**...**`.
4. The two source-sheet aliases that carry the same meaning have been merged here: `strategy.hr_val` → `strategy.hit_rate`, and `strategy.pf` → `strategy.profit_factor.2`. Update placement references accordingly in the final catalog. Similar labels with different scope, units, or calculations must retain separate definitions.
5. Exclude `mini_backtest`. No new explanatory tooltip is required for that field or for unlisted section headings. Existing action, status, error, and chart interaction tooltips are outside this cleanup.
6. Treat the stage list on each row as applicability. A shared block, such as `hyperopt_parameters`, appears once in the catalog and serves all listed stages.

The [block screenshots PDF](../../Documentation/Strategy%20block%20screenshots.pdf) provides visual locations. Page numbers below refer to that PDF. Some screenshots show one example stage, so verify the actual stage in the UI before applying a placement.

## Placement map and exact English copy

### Strategy builder → Hyperoptimization Parameters

- `block.key`: `hyperopt_parameters`
- Stages: Stage 1, Stage 2, Stage 3, Stage 4
- Screenshot pages: 1, 7

| Stage(s) | UI label | `field.key` | `tooltip_key` | Tooltip `description` |
|---|---|---|---|---|
| Stage 1, Stage 2, Stage 3, Stage 4 | Hyperopt Type | `hyperopt_type` | `strategy.hyperopt_type` | Selects how the run searches the configured parameter grid. |
| Stage 1 | Fold size (candles) | `fold_size` | `strategy.fold_size` | The number of candles assigned to a fold when the historical data is split for evaluation. |

### Strategy builder → Favorite Epochs

- `block.key`: `favorite_epochs`
- Stages: Stage 1, Stage 2, Stage 3, Stage 4
- Screenshot pages: 4, 10

| Stage(s) | UI label | `field.key` | `tooltip_key` | Tooltip `description` |
|---|---|---|---|---|
| Stage 1, Stage 2, Stage 3, Stage 4 | Score | `score` | `strategy.score` | The ranking score recorded for this epoch. Its interpretation depends on the stage and scoring configuration. |
| Stage 1 | MFE | `mfe` | `strategy.mfe` | The median of the largest favorable price moves measured across this epoch's cycles. |
| Stage 1 | MAE | `mae` | `strategy.mae` | The median of the largest adverse price moves measured across this epoch's cycles. |
| Stage 1 | AIR | `air` | `strategy.air` | The median ratio of favorable movement to adverse movement across this epoch's cycles. |
| Stage 1 | Hit Rate | `hit_rate` | `strategy.hit_rate` | The share of evaluated cycles with a positive result. |
| Stage 4 | Profit factor | `profit_factor` | `strategy.profit_factor` | Gross profit divided by gross loss in absolute terms. |
| Stage 4 | Drawdown | `drawdown` | `strategy.drawdown` | The drawdown recorded for this risk epoch. |

### Strategy builder → Post-processing formula info → Stability formula

- `block.key`: `post_processing_info.stability`
- Stages: Stage 1, Stage 2, Stage 3, Stage 4
- Screenshot pages: 5

| Stage(s) | UI label | `field.key` | `tooltip_key` | Tooltip `description` |
|---|---|---|---|---|
| Stage 1, Stage 2, Stage 3, Stage 4 | Normalized AIR Difference | `air_difference` | `strategy.air_difference` | The normalized air difference component used in the stability formula. |
| Stage 1, Stage 2, Stage 3, Stage 4 | Normalized Hit Rate Difference | `hit_rate_difference` | `strategy.hit_rate_difference` | The normalized hit rate difference component used in the stability formula. |
| Stage 1, Stage 2, Stage 3, Stage 4 | Normalized MAE Difference | `mae_difference` | `strategy.mae_difference` | The normalized mae difference component used in the stability formula. |
| Stage 1, Stage 2, Stage 3, Stage 4 | Normalized MFE Difference | `mfe_difference` | `strategy.mfe_difference` | The normalized mfe difference component used in the stability formula. |
| Stage 1, Stage 2, Stage 3, Stage 4 | Normalized STD Ratio | `std_ratio` | `strategy.std_ratio` | The normalized std ratio component used in the stability formula. |

### Strategy builder → Post-processing formula info → Score formula

- `block.key`: `post_processing_info.score`
- Stages: Stage 1, Stage 2, Stage 3, Stage 4
- Screenshot pages: 6

| Stage(s) | UI label | `field.key` | `tooltip_key` | Tooltip `description` |
|---|---|---|---|---|
| Stage 1, Stage 2, Stage 3, Stage 4 | Normalized AIR Score | `air_score` | `strategy.air_score` | The normalized air score component used in the score formula. |
| Stage 1, Stage 2, Stage 3, Stage 4 | Normalized Hit Rate Score | `hit_rate_score` | `strategy.hit_rate_score` | The normalized hit rate score component used in the score formula. |
| Stage 1, Stage 2, Stage 3, Stage 4 | Normalized MAE Score | `mae_score` | `strategy.mae_score` | The normalized mae score component used in the score formula. |
| Stage 1, Stage 2, Stage 3, Stage 4 | Normalized MFE Score | `mfe_score` | `strategy.mfe_score` | The normalized mfe score component used in the score formula. |
| Stage 1, Stage 2, Stage 3, Stage 4 | Normalized Stability | `stability` | `strategy.stability` | The normalized stability component used in the score formula. |

### Strategy builder → Source epoch info

- `block.key`: `source_epoch_info`
- Stages: Stage 1, Stage 2, Stage 3, Stage 4
- Screenshot pages: 8

| Stage(s) | UI label | `field.key` | `tooltip_key` | Tooltip `description` |
|---|---|---|---|---|
| Stage 1, Stage 2, Stage 3, Stage 4 | STABILITY_SCORE | `stability_score` | `strategy.stability_score` | The penalty used to account for differences between evaluation splits. |
| Stage 1, Stage 2, Stage 3, Stage 4 | cycle_count | `cycle_count` | `strategy.cycle_count` | The number of cycles evaluated for this epoch. |
| Stage 1, Stage 2, Stage 3, Stage 4 | ret_med | `median_return` | `strategy.median_return` | The median return across evaluated cycles. |
| Stage 1, Stage 2, Stage 3, Stage 4 | roi_med | `median_roi` | `strategy.median_roi` | The median return on investment across evaluated cycles. |
| Stage 1, Stage 2, Stage 3, Stage 4 | dur_med | `median_duration` | `strategy.median_duration` | The median cycle duration in candles. |
| Stage 1, Stage 2, Stage 3, Stage 4 | tt_mfe_med | `median_time_to_mfe` | `strategy.median_time_to_mfe` | The median number of candles from cycle start to the best favorable move. |
| Stage 1, Stage 2, Stage 3, Stage 4 | tt_mae_med | `median_time_to_mae` | `strategy.median_time_to_mae` | The median number of candles from cycle start to the worst adverse move. |
| Stage 1, Stage 2, Stage 3, Stage 4 | profit_capture | `profit_capture` | `strategy.profit_capture` | Measures how much of the favorable move was captured by the realized result. |
| Stage 1, Stage 2, Stage 3, Stage 4 | max_drawdown | `max_drawdown` | `strategy.max_drawdown` | The largest peak-to-trough decline in the evaluated balance or equity. |
| Stage 1, Stage 2, Stage 3, Stage 4 | total_pnl_gross | `gross_pnl` | `strategy.gross_pnl` | The total monetary profit or loss before fees. |
| Stage 1, Stage 2, Stage 3, Stage 4 | total_roi | `total_roi` | `strategy.total_roi` | The total return on investment reported for this epoch. |
| Stage 1, Stage 2, Stage 3, Stage 4 | mfe_med | `mfe_med` | `strategy.mfe_med` | The median maximum favorable excursion across cycles. |
| Stage 1, Stage 2, Stage 3, Stage 4 | mae_med | `mae_med` | `strategy.mae_med` | The median maximum adverse excursion across cycles. |
| Stage 1, Stage 2, Stage 3, Stage 4 | air_med | `air_med` | `strategy.air_med` | The median favorable-to-adverse movement ratio. |
| Stage 1, Stage 2, Stage 3, Stage 4 | hr_val | `hr_val` | `strategy.hit_rate` | The share of evaluated cycles with a positive result. |

### Strategy builder → Stoplosses

- `block.key`: `stoplosses`
- Stages: Stage 4
- Screenshot pages: 9

| Stage(s) | UI label | `field.key` | `tooltip_key` | Tooltip `description` |
|---|---|---|---|---|
| Stage 4 | Stoploss | `stoploss` | `strategy.stoploss` | The loss threshold used to close a position when the trade moves against it. |
| Stage 4 | Trailing Activation | `trailing_activation` | `strategy.trailing_activation` | The favorable move required before the trailing stop becomes active. |
| Stage 4 | Trailing Distance | `trailing_distance` | `strategy.trailing_distance` | The distance the active trailing stop keeps from the best price reached since entry. |

### Strategy builder → Loss streak & cooldown

- `block.key`: `cooldown`
- Stages: Stage 4
- Screenshot pages: 9

| Stage(s) | UI label | `field.key` | `tooltip_key` | Tooltip `description` |
|---|---|---|---|---|
| Stage 4 | Loss streak threshold | `loss_streak_threshold` | `strategy.loss_streak_threshold` | The number of consecutive losses required to trigger the cooldown. |
| Stage 4 | Post-loss cooldown (candles) | `post_loss_cooldown_candles` | `strategy.post_loss_cooldown_candles` | The number of candles to wait before allowing another entry after the loss streak triggers the cooldown. |

### Validation → Backtest parameters

- `block.key`: `backtest`
- Stages: Stage 5
- Screenshot pages: 11

| Stage(s) | UI label | `field.key` | `tooltip_key` | Tooltip `description` |
|---|---|---|---|---|
| Stage 5 | Leverage | `leverage` | `strategy.leverage` | The multiplier applied to position exposure when leverage is available. |
| Stage 5 | Stake Mode | `stake_mode` | `strategy.stake_mode` | Determines whether the stake is a fixed amount or a percentage of the available balance. |
| Stage 5 | Stake Value | `stake_value` | `strategy.stake_value` | The amount allocated per trade, interpreted according to Stake Mode. |
| Stage 5 | Profit Reserving | `profit_reserving` | `strategy.profit_reserving` | The percentage of profit set aside after each winning trade. Leave blank to keep all profit available for trading. |

### Validation → Backtest runs → Core metrics

- `block.key`: `backtest_core_metrics`
- Stages: Stage 5
- Screenshot pages: 13

| Stage(s) | UI label | `field.key` | `tooltip_key` | Tooltip `description` |
|---|---|---|---|---|
| Stage 5 | ROI | `roi` | `strategy.roi` | Return on the starting capital for this backtest. |
| Stage 5 | PnL | `pnl` | `strategy.pnl` | Net monetary profit or loss of the backtest. |
| Stage 5 | Max Drawdown | `max_drawdown` | `strategy.max_drawdown.2` | Largest peak-to-trough decline of the backtest account balance. |
| Stage 5 | Profit Factor | `profit_factor` | `strategy.profit_factor.2` | Gross profit divided by the absolute value of gross loss. |
| Stage 5 | Win Rate | `win_rate` | `strategy.win_rate` | The share of closed trades that were profitable. |
| Stage 5 | Δ (BT vs Mini) | `delta` | `strategy.delta.2` | The difference between full and mini backtest metric values. |

### Validation → Backtesting info → Performance

- `block.key`: `backtesting_info.performance`
- Stages: Stage 5
- Screenshot pages: 14

| Stage(s) | UI label | `field.key` | `tooltip_key` | Tooltip `description` |
|---|---|---|---|---|
| Stage 5 | Market change | `market_change` | `strategy.market_change` | How much the traded instrument itself moved over the period. It is the benchmark the run is compared against. |
| Stage 5 | CAGR total | `cagr` | `strategy.cagr` | Compound annual growth rate on the total balance (tradable + reserved), assuming profits are reinvested.<br><br>Calculation:<br>(final_balance(total) ÷ starting_balance(total)) ^ (1 ÷ (backtesting_days ÷ 365)) − 1 |
| Stage 5 | Max drawdown, real % | `max_dd_real_pct` | `strategy.max_dd_real_pct` | Deepest drop measured on equity over time, not on closed trades. It counts unrealised P/L, candle movement and the effect of leverage — so it also captures drawdowns of positions that later recovered.<br><br>Calculation:<br>Percentage: (Max Equity at Peak − Min Equity after Peak) ÷ Max Equity at Peak × 100<br>Equity: Free tradable + Used Margin + Unrealized PnL |
| Stage 5 | Calmar | `calmar` | `strategy.calmar` | Annual return divided by the maximum drawdown. Answers “how much return per unit of pain”. |
| Stage 5 | Profit factor | `profit_factor` | `strategy.profit_factor.3` | Above 1 the strategy earns more than it loses. Below 1 it does the opposite.<br><br>Calculation:<br>Ratio: gross profit ÷ gross loss |
| Stage 5 | Net P/L tradable, % | `net_pl_pct` | `strategy.net_pl_pct` | Result on the **trading balance** — the money the strategy actually traded with. The reserve is not part of it.<br><br>Calculation:<br>Percentage: (End Tradable − Start Tradable) ÷ Start Tradable × 100<br>Absolute: End Tradable − Start Tradable |
| Stage 5 | Annual P/L, % | `annual_pl` | `strategy.annual_pl` | Net P/L stretched to a yearly basis without compounding. For the compounded version see CAGR in the cards below.<br><br>Calculation:<br>Percentage: PnL Tradable % ÷ (backtesting_days ÷ 365) |
| Stage 5 | Max drawdown, account % | `max_dd_account` | `strategy.max_dd_account` | Deepest drop from the highest balance peak to the lowest point, measured on closed trades only. Open positions and intra-candle moves are not part of it.<br><br>Calculation:<br>Percentage: (Max Tradable at Peak − Min Tradable after Peak) ÷ Max Tradable at Peak × 100<br>Absolute: Max Tradable at Peak − Min Tradable after Peak |
| Stage 5 | Avg drawdown, % | `avg_dd` | `strategy.avg_dd` | Average depth of all drawdowns in the run, not just the worst one. A high average with a similar maximum means the strategy sat under water most of the time. |
| Stage 5 | Sortino | `sortino` | `strategy.sortino` | Return per unit of downside volatility. Unlike Sharpe it does not punish upside swings. |
| Stage 5 | Sharpe | `sharpe` | `strategy.sharpe` | Return per unit of total volatility. |
| Stage 5 | Max drawdown, ABS | `max_dd_abs` | `strategy.max_dd_abs` | Peak-to-trough distance taken over the whole equity curve, without splitting it into separate drawdown episodes. It differs slightly from Max drawdown, real because the two use different peak definitions. |
| Stage 5 | Drawdown high \| low | `dd_high_low` | `strategy.dd_high_low` | Balance at the start and at the bottom of the deepest drawdown. |
| Stage 5 | Tradable amount | `tradable` | `strategy.tradable` | Balance the strategy is allowed to trade with at the end of the run — the reserve is excluded.<br><br>Calculation:<br>Absolute: Total balance − Reserved amount |
| Stage 5 | Reserved amount | `reserved` | `strategy.reserved` | Profit moved aside by Profit Reserving. It no longer takes part in trading.<br><br>Calculation:<br>Absolute: sum(reserved amount per trade) |
| Stage 5 | Ratio | `ratio` | `strategy.ratio` | Represents the share of capital that is reserved compared to the tradable balance. Closer to 0 — most funds are available for trading. Closer to 1 — most funds are reserved and locked. = 1 — the reserve equals the tradable balance. > 1 — the reserve is larger than what is being traded.<br><br>Calculation:<br>Ratio: Reserved amount ÷ Tradable amount |
| Stage 5 | Win rate (wins / losses) | `winrate` | `strategy.winrate` | Share of profitable trades, written as wins / losses. On its own it says little: a strategy can win 80% of trades and still lose money if the losers are larger.<br><br>Calculation:<br>Percentage: wins ÷ (wins + losses) × 100 |
| Stage 5 | Expectancy (ratio) | `expectancy` | `strategy.expectancy` | Average result of one trade in R-multiples. Negative expectancy means the strategy loses on average, no matter the win rate. |
| Stage 5 | Losses, max count | `max_loss_n` | `strategy.max_loss_n` | Longest unbroken run of losing trades. This is what a live account has to survive without the quant switching the strategy off. |
| Stage 5 | Losses, avg count | `avg_loss_n` | `strategy.avg_loss_n` | Typical length of a losing streak. |
| Stage 5 | Wins, max count | `max_win_n` | `strategy.max_win_n` | Longest unbroken run of winning trades. |
| Stage 5 | Wins, avg count | `avg_win_n` | `strategy.avg_win_n` | Typical length of a winning streak. |
| Stage 5 | Downtime · Avg | `down_avg` | `strategy.down_avg` | Idle time between one trade closing and the next one opening. Large downtime with many trades means the strategy fires in bursts.<br><br>Calculation:<br>avg(idle periods) |
| Stage 5 | Trades closed by CCL | `ccl` | `strategy.ccl` | Share of canceled trades against the rest, written as canceled / not canceled. A trade counts as canceled when its exit reason is canceled.<br><br>Calculation:<br>Percentage: canceled ÷ (canceled + not canceled) × 100 |
| Stage 5 | Drawdown duration | `drawdown_duration` | `strategy.drawdown_duration` | The elapsed time spent below a previous balance peak. |

### Validation → Backtesting info → Temporal

- `block.key`: `backtesting_info.temporal`
- Stages: Stage 5
- Screenshot pages: 15–16

| Stage(s) | UI label | `field.key` | `tooltip_key` | Tooltip `description` |
|---|---|---|---|---|
| Stage 5 | Relative Max Drawdown Tradable | `rel_max_dd_tradable` | `strategy.rel_max_dd_tradable` | Shows the maximum drawdown from any local maximum (Tradable) to the minimum value (Trough) after it. Based on closed trades only. Example: Peak 1 = 120 → values after it: 110, 105, 130 → minimum 105 = Trough after Peak 1. Drawdown = (120 − 105) / 120 = 12.5%. Peak 2 = 130 → values after it: 125, 140 → minimum 125 = Trough after Peak 2. Drawdown = (130 − 125) / 130 ≈ 3.85%. Relative Max Drawdown = the maximum of these drawdowns = 12.5%.<br><br>Calculation:<br>Percentage: (Max Tradable at Peak − Min Tradable after Peak) ÷ Max Tradable at Peak × 100<br>Absolute: Max Tradable at Peak − Min Tradable after Peak |
| Stage 5 | Relative Drawdown Tradable | `rel_dd_tradable` | `strategy.rel_dd_tradable` | Measures how much the tradable balance fell from the start of the period. Absolute decline from start of the year to the lowest point. Based on closed trades only.<br><br>Calculation:<br>Percentage: (Start Tradable − Min Tradable) ÷ Start Tradable × 100<br>Absolute: Start Tradable − Min Tradable |
| Stage 5 | Relative Max Equity Drawdown | `rel_max_dd_equity` | `strategy.rel_max_dd_equity` | Shows the maximum drawdown from any local maximum (Equity) to the minimum value (Trough) after it. Includes open trades. Example: Peak 1 = 120 → values after it: 110, 105, 130 → minimum 105 = Trough after Peak 1. Drawdown = (120 − 105) / 120 = 12.5%. Peak 2 = 130 → values after it: 125, 140 → minimum 125 = Trough after Peak 2. Drawdown = (130 − 125) / 130 ≈ 3.85%. Relative Max Drawdown = the maximum of these drawdowns = 12.5%.<br><br>Calculation:<br>Percentage: (Max Equity at Peak − Min Equity after Peak) ÷ Max Equity at Peak × 100<br>Absolute: Max Equity at Peak − Min Equity after Peak |
| Stage 5 | Relative Equity Drawdown | `rel_dd_equity` | `strategy.rel_dd_equity` | Shows how far equity fell from the starting point of the period. Absolute equity drawdown from period start. Includes open trades.<br><br>Calculation:<br>Percentage: (Start Equity − Min Equity) ÷ Start Equity × 100<br>Absolute: Start Equity − Min Equity |
| Stage 5 | PnL Tradable | `pnl_tradable` | `strategy.pnl_tradable` | Profit and Loss for tradable balance during the period. Percentage shows the relative return on the starting tradable balance. Absolute shows the actual amount gained or lost in tradable balance.<br><br>Calculation:<br>Percentage: (End Tradable − Start Tradable) ÷ Start Tradable × 100<br>Absolute: End Tradable − Start Tradable |
| Stage 5 | PnL Reserved | `pnl_reserved` | `strategy.pnl_reserved` | Profit reserved funds during the period. Percentage shows the reserved amount relative to the starting tradable balance. Absolute shows the actual reserved amount.<br><br>Calculation:<br>Percentage: (Reserved amount ÷ Start Tradable) × 100<br>Absolute: Reserved amount |
| Stage 5 | PnL Total | `pnl_total` | `strategy.pnl_total` | Total Profit and Loss combining tradable and reserved amounts. Percentage shows the combined relative return. Absolute shows the total actual amount gained or lost.<br><br>Calculation:<br>Percentage: PnL Tradable % + PnL Reserved %<br>Absolute: PnL Tradable + PnL Reserved |
| Stage 5 | CAGR Tradable | `cagr_tradable` | `strategy.cagr_tradable` | CAGR (Compound Annual Growth Rate) represents the smoothed annual growth rate of capital over a given period, assuming profits are reinvested. It’s widely used to compare strategies or investments on a normalized yearly basis. Calculated with tradable amount.<br><br>Calculation:<br>(final_balance(tradable) ÷ starting_balance(tradable)) ^ (1 ÷ (backtesting_days ÷ 365)) − 1 |
| Stage 5 | CAGR Total | `cagr_total` | `strategy.cagr_total` | CAGR (Compound Annual Growth Rate) represents the smoothed annual growth rate of capital over a given period, assuming profits are reinvested. It’s widely used to compare strategies or investments on a normalized yearly basis. Calculated with total amount (total = tradable + reserved).<br><br>Calculation:<br>(final_balance(total) ÷ starting_balance(total)) ^ (1 ÷ (backtesting_days ÷ 365)) − 1 |
| Stage 5 | Max Tradable at Peak | `max_tradable_at_peak` | `strategy.max_tradable_at_peak` | Max Tradable at Peak — the local peak value of Tradable in the selected period. It marks the starting point of a drawdown. For each peak, we measure the minimum value after it (Trough after Peak) to calculate the Relative Max Drawdown. Example: Values: 100, 120, 110, 105, 130, 125. Peak 1 = 120 → Trough after Peak = 105. Peak 2 = 130 → Trough after Peak = 125. |
| Stage 5 | Min Tradable after Peak | `min_tradable_after_peak` | `strategy.min_tradable_after_peak` | Trough after Peak is the minimum value after a local maximum (Peak), before the next peak, or before the end of the period. It shows the depth of the decline after a specific maximum Tradable. Example: Peak 1 = 120 → values after it: 110, 105, 130 → minimum 105 = Trough after Peak 1. |
| Stage 5 | Max Equity at Peak | `max_equity_at_peak` | `strategy.max_equity_at_peak` | Max Equity at Peak — the local peak value of Equity in the selected period. It marks the starting point of a drawdown. For each peak, we measure the minimum value after it (Trough after Peak) to calculate the Relative Max Drawdown. Example: Values: 100, 120, 110, 105, 130, 125. Peak 1 = 120 → Trough after Peak = 105. Peak 2 = 130 → Trough after Peak = 125. |
| Stage 5 | Min Equity after Peak | `min_equity_after_peak` | `strategy.min_equity_after_peak` | Trough after Peak is the minimum value after a local maximum (Peak), before the next peak, or before the end of the period. It shows the depth of the decline after a specific maximum Equity. Example: Peak 1 = 120 → values after it: 110, 105, 130 → minimum 105 = Trough after Peak 1. Peak 2 = 130 → values after it: 125, 140 → minimum 125 = Trough after Peak 2. |

### Validation → Backtesting info → Trades

- `block.key`: `backtesting_info.trades`
- Stages: Stage 5
- Screenshot pages: 17

| Stage(s) | UI label | `field.key` | `tooltip_key` | Tooltip `description` |
|---|---|---|---|---|
| Stage 5 | Stake amount | `stake_amount` | `strategy.stake_amount` | Position size at entry, with leverage in brackets. |
| Stage 5 | Liq. price | `liq_price` | `strategy.liq_price` | Price at which the position would be liquidated by the exchange. |
| Stage 5 | Net P/L, % | `net_pl_pct` | `strategy.net_pl_pct.2` | Result of this row — an enter tag, an exit reason or a single trade — in percent of the stake it used. This is not an account-level figure; for that see Net P/L tradable, %.<br><br>Calculation:<br>Percentage: net result of the row ÷ stake used × 100 |
| Stage 5 | Net P/L, USDT | `net_pl_usdt` | `strategy.net_pl_usdt.2` | The same row-level result in quote currency, after fees and funding.<br><br>Calculation:<br>Absolute: sum of net result across the trades of the row |
| Stage 5 | Reserved | `reserved` | `strategy.reserved.2` | Profit moved to the reserve by this particular trade. |

### Validation → Run Shuffler

- `block.key`: `shuffler`
- Stages: Stage 5
- Screenshots: see the block map in the source sheet

| Stage(s) | UI label | `field.key` | `tooltip_key` | Tooltip `description` |
|---|---|---|---|---|
| Stage 5 | Simulation Mode | `simulation_mode` | `strategy.simulation_mode` | Selects the simulation setup used to rerun the baseline strategy. |
| Stage 5 | Shuffle Approach | `shuffle_approach` | `strategy.shuffle_approach` | Selects the method used to shuffle the input for the simulations. |

### Validation → Shuffler run parameters

- `block.key`: `shuffler_run_parameters`
- Stages: Stage 5
- Screenshot pages: 18

| Stage(s) | UI label | `field.key` | `tooltip_key` | Tooltip `description` |
|---|---|---|---|---|
| Stage 5 | MCL | `mcl` | `strategy.mcl` | The maximum consecutive losses target for this level. |
| Stage 5 | MCW | `mcw` | `strategy.mcw` | The maximum consecutive wins target for this level. |
| Stage 5 | ACL | `acl` | `strategy.acl` | The average consecutive losses target for this level. |
| Stage 5 | ACW | `acw` | `strategy.acw` | The average consecutive wins target for this level. |

### Validation → Shuffle info → Summary → Shared

- `block.key`: `shuffle_info.summary`
- Stages: Stage 5
- Screenshot pages: 19–20

| Stage(s) | UI label | `field.key` | `tooltip_key` | Tooltip `description` |
|---|---|---|---|---|
| Stage 5 | Original vs runs | `original_percentile` | `strategy.original_percentile` | The position of the original result within the distribution of simulated results. |

### Validation → Shuffle info → Summary → General

- `block.key`: `shuffle_info.summary.general`
- Stages: Stage 5
- Screenshot pages: 19

| Stage(s) | UI label | `field.key` | `tooltip_key` | Tooltip `description` |
|---|---|---|---|---|
| Stage 5 | Final PnL | `final_pnl` | `strategy.final_pnl` | Profit or loss at the end of the simulation. |
| Stage 5 | ROI | `roi` | `strategy.roi.2` | Return on the starting balance. |
| Stage 5 | Profit Factor | `pf` | `strategy.profit_factor.2` | Gross profit divided by the absolute value of gross loss. |
| Stage 5 | Max Drawdown | `dd_peak` | `strategy.dd_peak` | Largest decline from a previous balance peak. |
| Stage 5 | Max Drawdown from initial balance | `max_dd_init` | `strategy.max_dd_init` | Largest percentage shortfall below the starting balance. |
| Stage 5 | MCL (Max Consec. Losses) | `mcl` | `strategy.mcl.2` | Longest streak of consecutive losing trades. |
| Stage 5 | MCW (Max Consec. Wins) | `mcw` | `strategy.mcw.2` | Longest streak of consecutive winning trades. |
| Stage 5 | ACL (Avg Consec. Losses) | `acl` | `strategy.acl.2` | Average length of a losing streak in trades. |
| Stage 5 | ACW (Avg Consec. Wins) | `acw` | `strategy.acw.2` | Average length of a winning streak in trades. |

### Validation → Shuffle info → Summary → Recovery

- `block.key`: `shuffle_info.summary.recovery`
- Stages: Stage 5
- Screenshot pages: 20

| Stage(s) | UI label | `field.key` | `tooltip_key` | Tooltip `description` |
|---|---|---|---|---|
| Stage 5 | Max Recovery Period from initial balance | `max_rec_init` | `strategy.max_rec_init` | Longest period spent below the starting balance before recovery. |
| Stage 5 | Recovery Period from Peak | `rec_peak` | `strategy.rec_peak` | Time taken to regain a previous balance peak after a drawdown. |
| Stage 5 | Unclosed phases at end of dataset | `unclosed` | `strategy.unclosed` | Recovery phases still open at the end of the dataset. |
| Stage 5 | Loss streaks recovered | `loss_recovered` | `strategy.loss_recovered` | Number of losing streaks followed by a recovery. |
| Stage 5 | Loss streak recovery rate | `loss_rec_rate` | `strategy.loss_rec_rate` | Share of losing streaks followed by a recovery. |
| Stage 5 | Win streaks that led to recovery | `win_to_rec` | `strategy.win_to_rec` | Number of winning streaks that led to recovery. |
| Stage 5 | Recovering win streak rate | `win_rec_rate` | `strategy.win_rec_rate` | Share of winning streaks that led to recovery. |

### Validation → Synthetic backtest runs → Core metrics

- `block.key`: `synthetic_core_metrics`
- Stages: Stage 5
- Screenshot pages: 21

| Stage(s) | UI label | `field.key` | `tooltip_key` | Tooltip `description` |
|---|---|---|---|---|
| Stage 5 | ROI | `roi` | `strategy.roi.3` | Return on the starting capital of the synthetic backtest. |
| Stage 5 | PnL | `pnl` | `strategy.pnl.2` | Net monetary profit or loss of the synthetic backtest. |
| Stage 5 | Max Drawdown | `max_drawdown` | `strategy.max_drawdown.3` | Largest peak-to-trough decline in the synthetic run. |
| Stage 5 | Profit Factor | `profit_factor` | `strategy.profit_factor.2` | Gross profit divided by the absolute value of gross loss. |
| Stage 5 | Win Rate | `win_rate` | `strategy.win_rate` | The share of closed trades that were profitable. |
| Stage 5 | Percentile | `percentile` | `strategy.percentile` | The percentile rank of the original result among synthetic runs. |

### Validation → Synthetic backtest info → Performance

- `block.key`: `synthetic_info.performance`
- Stages: Stage 5
- Screenshot pages: 22–23

| Stage(s) | UI label | `field.key` | `tooltip_key` | Tooltip `description` |
|---|---|---|---|---|
| Stage 5 | Market change | `market_change` | `strategy.market_change` | How much the traded instrument itself moved over the period. It is the benchmark the run is compared against. |
| Stage 5 | CAGR total | `cagr` | `strategy.cagr` | Compound annual growth rate on the total balance (tradable + reserved), assuming profits are reinvested.<br><br>Calculation:<br>(final_balance(total) ÷ starting_balance(total)) ^ (1 ÷ (backtesting_days ÷ 365)) − 1 |
| Stage 5 | Max drawdown, real % | `max_dd_real_pct` | `strategy.max_dd_real_pct` | Deepest drop measured on equity over time, not on closed trades. It counts unrealised P/L, candle movement and the effect of leverage — so it also captures drawdowns of positions that later recovered.<br><br>Calculation:<br>Percentage: (Max Equity at Peak − Min Equity after Peak) ÷ Max Equity at Peak × 100<br>Equity: Free tradable + Used Margin + Unrealized PnL |
| Stage 5 | Calmar | `calmar` | `strategy.calmar` | Annual return divided by the maximum drawdown. Answers “how much return per unit of pain”. |
| Stage 5 | Profit factor | `profit_factor` | `strategy.profit_factor.3` | Above 1 the strategy earns more than it loses. Below 1 it does the opposite.<br><br>Calculation:<br>Ratio: gross profit ÷ gross loss |
| Stage 5 | Net P/L tradable, % | `net_pl_pct` | `strategy.net_pl_pct` | Result on the **trading balance** — the money the strategy actually traded with. The reserve is not part of it.<br><br>Calculation:<br>Percentage: (End Tradable − Start Tradable) ÷ Start Tradable × 100<br>Absolute: End Tradable − Start Tradable |
| Stage 5 | Annual P/L, % | `annual_pl` | `strategy.annual_pl` | Net P/L stretched to a yearly basis without compounding. For the compounded version see CAGR in the cards below.<br><br>Calculation:<br>Percentage: PnL Tradable % ÷ (backtesting_days ÷ 365) |
| Stage 5 | Max drawdown, account % | `max_dd_account` | `strategy.max_dd_account` | Deepest drop from the highest balance peak to the lowest point, measured on closed trades only. Open positions and intra-candle moves are not part of it.<br><br>Calculation:<br>Percentage: (Max Tradable at Peak − Min Tradable after Peak) ÷ Max Tradable at Peak × 100<br>Absolute: Max Tradable at Peak − Min Tradable after Peak |
| Stage 5 | Avg drawdown, % | `avg_dd` | `strategy.avg_dd` | Average depth of all drawdowns in the run, not just the worst one. A high average with a similar maximum means the strategy sat under water most of the time. |
| Stage 5 | Sortino | `sortino` | `strategy.sortino` | Return per unit of downside volatility. Unlike Sharpe it does not punish upside swings. |
| Stage 5 | Sharpe | `sharpe` | `strategy.sharpe` | Return per unit of total volatility. |
| Stage 5 | Max drawdown, ABS | `max_dd_abs` | `strategy.max_dd_abs` | Peak-to-trough distance taken over the whole equity curve, without splitting it into separate drawdown episodes. It differs slightly from Max drawdown, real because the two use different peak definitions. |
| Stage 5 | Drawdown high \| low | `dd_high_low` | `strategy.dd_high_low` | Balance at the start and at the bottom of the deepest drawdown. |
| Stage 5 | Tradable amount | `tradable` | `strategy.tradable` | Balance the strategy is allowed to trade with at the end of the run — the reserve is excluded.<br><br>Calculation:<br>Absolute: Total balance − Reserved amount |
| Stage 5 | Reserved amount | `reserved` | `strategy.reserved` | Profit moved aside by Profit Reserving. It no longer takes part in trading.<br><br>Calculation:<br>Absolute: sum(reserved amount per trade) |
| Stage 5 | Ratio | `ratio` | `strategy.ratio` | Represents the share of capital that is reserved compared to the tradable balance. Closer to 0 — most funds are available for trading. Closer to 1 — most funds are reserved and locked. = 1 — the reserve equals the tradable balance. > 1 — the reserve is larger than what is being traded.<br><br>Calculation:<br>Ratio: Reserved amount ÷ Tradable amount |
| Stage 5 | Win rate (wins / losses) | `winrate` | `strategy.winrate` | Share of profitable trades, written as wins / losses. On its own it says little: a strategy can win 80% of trades and still lose money if the losers are larger.<br><br>Calculation:<br>Percentage: wins ÷ (wins + losses) × 100 |
| Stage 5 | Expectancy (ratio) | `expectancy` | `strategy.expectancy` | Average result of one trade in R-multiples. Negative expectancy means the strategy loses on average, no matter the win rate. |
| Stage 5 | Losses, max count | `max_loss_n` | `strategy.max_loss_n` | Longest unbroken run of losing trades. This is what a live account has to survive without the quant switching the strategy off. |
| Stage 5 | Losses, avg count | `avg_loss_n` | `strategy.avg_loss_n` | Typical length of a losing streak. |
| Stage 5 | Wins, max count | `max_win_n` | `strategy.max_win_n` | Longest unbroken run of winning trades. |
| Stage 5 | Wins, avg count | `avg_win_n` | `strategy.avg_win_n` | Typical length of a winning streak. |
| Stage 5 | Avg | `down_avg` | `strategy.down_avg` | Idle time between one trade closing and the next one opening. Large downtime with many trades means the strategy fires in bursts.<br><br>Calculation:<br>avg(idle periods) |
| Stage 5 | Trades closed by CCL | `ccl` | `strategy.ccl` | Share of canceled trades against the rest, written as canceled / not canceled. A trade counts as canceled when its exit reason is canceled.<br><br>Calculation:<br>Percentage: canceled ÷ (canceled + not canceled) × 100 |
| Stage 5 | Net P/L tradable, USDT | `net_pl_usdt` | `strategy.net_pl_usdt` | The same result in quote currency. This is what the source report calls Total Profit.<br><br>Calculation:<br>Absolute: End Tradable − Start Tradable |
| Stage 5 | Max drawdown, real USDT | `max_dd_real_usdt` | `strategy.max_dd_real_usdt` | The same equity-based drawdown in quote currency.<br><br>Calculation:<br>Absolute: Max Equity at Peak − Min Equity after Peak<br>Equity: Free tradable + Used Margin + Unrealized PnL |
| Stage 5 | Losses, max amount | `max_loss_amt` | `strategy.max_loss_amt` | Money lost during the worst losing streak. |
| Stage 5 | Losses, avg amount | `avg_loss_amt` | `strategy.avg_loss_amt` | Money lost during a typical losing streak. |
| Stage 5 | Wins, max amount | `max_win_amt` | `strategy.max_win_amt` | Money made during the best winning streak. |
| Stage 5 | Wins, avg amount | `avg_win_amt` | `strategy.avg_win_amt` | Money made during a typical winning streak. |

### Validation → Synthetic backtest info → Temporal metrics

- `block.key`: `synthetic_info.temporal`
- Stages: Stage 5
- Screenshot pages: 24

| Stage(s) | UI label | `field.key` | `tooltip_key` | Tooltip `description` |
|---|---|---|---|---|
| Stage 5 | Relative Max Drawdown Tradable | `rel_max_dd_tradable` | `strategy.rel_max_dd_tradable` | Shows the maximum drawdown from any local maximum (Tradable) to the minimum value (Trough) after it. Based on closed trades only. Example: Peak 1 = 120 → values after it: 110, 105, 130 → minimum 105 = Trough after Peak 1. Drawdown = (120 − 105) / 120 = 12.5%. Peak 2 = 130 → values after it: 125, 140 → minimum 125 = Trough after Peak 2. Drawdown = (130 − 125) / 130 ≈ 3.85%. Relative Max Drawdown = the maximum of these drawdowns = 12.5%.<br><br>Calculation:<br>Percentage: (Max Tradable at Peak − Min Tradable after Peak) ÷ Max Tradable at Peak × 100<br>Absolute: Max Tradable at Peak − Min Tradable after Peak |
| Stage 5 | Relative Drawdown Tradable | `rel_dd_tradable` | `strategy.rel_dd_tradable` | Measures how much the tradable balance fell from the start of the period. Absolute decline from start of the year to the lowest point. Based on closed trades only.<br><br>Calculation:<br>Percentage: (Start Tradable − Min Tradable) ÷ Start Tradable × 100<br>Absolute: Start Tradable − Min Tradable |
| Stage 5 | Relative Max Equity Drawdown | `rel_max_dd_equity` | `strategy.rel_max_dd_equity` | Shows the maximum drawdown from any local maximum (Equity) to the minimum value (Trough) after it. Includes open trades. Example: Peak 1 = 120 → values after it: 110, 105, 130 → minimum 105 = Trough after Peak 1. Drawdown = (120 − 105) / 120 = 12.5%. Peak 2 = 130 → values after it: 125, 140 → minimum 125 = Trough after Peak 2. Drawdown = (130 − 125) / 130 ≈ 3.85%. Relative Max Drawdown = the maximum of these drawdowns = 12.5%.<br><br>Calculation:<br>Percentage: (Max Equity at Peak − Min Equity after Peak) ÷ Max Equity at Peak × 100<br>Absolute: Max Equity at Peak − Min Equity after Peak |
| Stage 5 | Relative Equity Drawdown | `rel_dd_equity` | `strategy.rel_dd_equity` | Shows how far equity fell from the starting point of the period. Absolute equity drawdown from period start. Includes open trades.<br><br>Calculation:<br>Percentage: (Start Equity − Min Equity) ÷ Start Equity × 100<br>Absolute: Start Equity − Min Equity |
| Stage 5 | PnL Tradable | `pnl_tradable` | `strategy.pnl_tradable` | Profit and Loss for tradable balance during the period. Percentage shows the relative return on the starting tradable balance. Absolute shows the actual amount gained or lost in tradable balance.<br><br>Calculation:<br>Percentage: (End Tradable − Start Tradable) ÷ Start Tradable × 100<br>Absolute: End Tradable − Start Tradable |
| Stage 5 | PnL Reserved | `pnl_reserved` | `strategy.pnl_reserved` | Profit reserved funds during the period. Percentage shows the reserved amount relative to the starting tradable balance. Absolute shows the actual reserved amount.<br><br>Calculation:<br>Percentage: (Reserved amount ÷ Start Tradable) × 100<br>Absolute: Reserved amount |
| Stage 5 | PnL Total | `pnl_total` | `strategy.pnl_total` | Total Profit and Loss combining tradable and reserved amounts. Percentage shows the combined relative return. Absolute shows the total actual amount gained or lost.<br><br>Calculation:<br>Percentage: PnL Tradable % + PnL Reserved %<br>Absolute: PnL Tradable + PnL Reserved |
| Stage 5 | CAGR Tradable | `cagr_tradable` | `strategy.cagr_tradable` | CAGR (Compound Annual Growth Rate) represents the smoothed annual growth rate of capital over a given period, assuming profits are reinvested. It’s widely used to compare strategies or investments on a normalized yearly basis. Calculated with tradable amount.<br><br>Calculation:<br>(final_balance(tradable) ÷ starting_balance(tradable)) ^ (1 ÷ (backtesting_days ÷ 365)) − 1 |
| Stage 5 | CAGR Total | `cagr_total` | `strategy.cagr_total` | CAGR (Compound Annual Growth Rate) represents the smoothed annual growth rate of capital over a given period, assuming profits are reinvested. It’s widely used to compare strategies or investments on a normalized yearly basis. Calculated with total amount (total = tradable + reserved).<br><br>Calculation:<br>(final_balance(total) ÷ starting_balance(total)) ^ (1 ÷ (backtesting_days ÷ 365)) − 1 |
| Stage 5 | Max Tradable at Peak | `max_tradable_at_peak` | `strategy.max_tradable_at_peak` | Max Tradable at Peak — the local peak value of Tradable in the selected period. It marks the starting point of a drawdown. For each peak, we measure the minimum value after it (Trough after Peak) to calculate the Relative Max Drawdown. Example: Values: 100, 120, 110, 105, 130, 125. Peak 1 = 120 → Trough after Peak = 105. Peak 2 = 130 → Trough after Peak = 125. |
| Stage 5 | Min Tradable after Peak | `min_tradable_after_peak` | `strategy.min_tradable_after_peak` | Trough after Peak is the minimum value after a local maximum (Peak), before the next peak, or before the end of the period. It shows the depth of the decline after a specific maximum Tradable. Example: Peak 1 = 120 → values after it: 110, 105, 130 → minimum 105 = Trough after Peak 1. |
| Stage 5 | Max Equity at Peak | `max_equity_at_peak` | `strategy.max_equity_at_peak` | Max Equity at Peak — the local peak value of Equity in the selected period. It marks the starting point of a drawdown. For each peak, we measure the minimum value after it (Trough after Peak) to calculate the Relative Max Drawdown. Example: Values: 100, 120, 110, 105, 130, 125. Peak 1 = 120 → Trough after Peak = 105. Peak 2 = 130 → Trough after Peak = 125. |
| Stage 5 | Min Equity after Peak | `min_equity_after_peak` | `strategy.min_equity_after_peak` | Trough after Peak is the minimum value after a local maximum (Peak), before the next peak, or before the end of the period. It shows the depth of the decline after a specific maximum Equity. Example: Peak 1 = 120 → values after it: 110, 105, 130 → minimum 105 = Trough after Peak 1. Peak 2 = 130 → values after it: 125, 140 → minimum 125 = Trough after Peak 2. |

## Endpoint JSON response contract

The tooltip endpoint returns one JSON object containing an `objects` array. The array may contain multiple system objects; this task populates `strategy`. Each object has a collection of `blocks`; each block has a collection of `fields`. The logical path is **object → block → field → description**. Shared descriptions live once in `objects[].tooltips` and are referenced from fields by `tooltip_key`.

The endpoint route should follow the backend's existing API conventions. A possible route is `GET /api/tooltips?object=strategy`; the path is a proposal, while the response structure below is required.

| Property | Type | Requirement |
|---|---|---|
| `objects` | array | System objects; each has a unique `key`. |
| `objects[].key` | string | Stable object key, for example `strategy`. |
| `objects[].blocks` | array | Collection of blocks for the object. |
| `blocks[].key` | string | Stable block key, unique within the object. Use one `hyperopt_parameters` block for Stages 1–4. |
| `blocks[].fields` | array | Fields that have a tooltip in the block. |
| `fields[].key` | string | Stable field key, unique within its block. |
| `fields[].stages` | array of integers | Stage numbers where the field is displayed; for Strategy, values are 1–5. |
| `fields[].tooltip_key` | string | Reference to a key in the same object's `tooltips` map. |
| `objects[].tooltips` | object | Map of shared tooltip definitions. |
| `tooltips[tooltip_key].description` | string | Nonempty English text. If a calculation is present, it is included in this string with newline characters. |

Example fragment showing one definition reused by two blocks:

```json
{
  "objects": [
    {
      "key": "strategy",
      "blocks": [
        {
          "key": "backtest_core_metrics",
          "fields": [
            {
              "key": "profit_factor",
              "stages": [5],
              "tooltip_key": "strategy.profit_factor.2"
            }
          ]
        },
        {
          "key": "shuffle_info.summary.general",
          "fields": [
            {
              "key": "pf",
              "stages": [5],
              "tooltip_key": "strategy.profit_factor.2"
            }
          ]
        }
      ],
      "tooltips": {
        "strategy.profit_factor.2": {
          "description": "Gross profit divided by the absolute value of gross loss."
        }
      }
    }
  ]
}
```

Contract rules:

1. A block key is unique within an object; a field key is unique within a block.
2. Every field reference resolves to a definition in the same object's `tooltips` map. Do not return unused definitions.
3. Reuse one `tooltip_key` when the meaning and description are identical. A matching visible label alone does not prove identical meaning.
4. Put stage applicability in `fields[].stages`; do not create one copy of a shared block per stage.
5. `description` is the only tooltip content property. There is no separate `formula` property. Keep calculations inside `description`.
6. Descriptions are always English. Omit `locale` and `revision`.
7. The response contains no screenshot references or visible UI labels; those belong to the implementation guide and the UI.

## Acceptance criteria

- All 164 listed placements are implemented or explicitly reported as unmatched because the field does not exist or its meaning differs in the current mock.
- Existing tooltips are updated in place. Each UI field has at most one explanatory tooltip trigger.
- Reused keys display identical text at every placement; the two alias pairs above are consolidated.
- The endpoint response validates against the stated structure, has no dangling references or unused definitions, and contains no `mini_backtest`, `locale`, `revision`, or separate `formula` property.
- Tooltips work on hover and keyboard focus, remain visible above modals and tables, and preserve line breaks and emphasis.
- The mock builds with `npm run build`; review representative placements in both UI themes. The endpoint should have a response contract check in the backend project when that part is implemented.

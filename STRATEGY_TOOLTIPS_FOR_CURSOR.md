# Strategy tooltips — task for Cursor

Status: approved UI inventory for the QuantSandbox mock, exported from the current [Strategy tooltips sheet](https://docs.google.com/spreadsheets/d/1OLhz8_l9vuo2di6535hpf15-pUXoWz5ZJ5X4XAQ_9Mg/edit?gid=849843283) on 2026-11-07.

## Goal

Add the tooltips listed below to the existing Strategy UI in `Mockup/QuantSandbox`. The document is self-contained: the placement map identifies each target, and the catalog contains the exact English text. There are **165 field placements**, **20 blocks**, and **126 unique tooltip texts**.

Use one definition per `tooltip_key`. Multiple placements may reference the same key. `description (tooltip)` is one content field; the `Calculation:` lines are part of that content. Preserve paragraph and line breaks. The UI locale for these tooltips is English.

## Scope and implementation rules

1. Read `Mockup/QuantSandbox/AGENTS.md`, `README.md`, and `docs/ARCHITECTURE.md` before editing the mock. This task changes UI help text and triggers in the React mock.
2. Inspect the live component for each block and match by block, stage, field key, and visible label. If a listed field is absent or its semantics differ, report it as unmatched. Do not create a new form field or result metric solely to host a tooltip.
3. Reuse the existing Radix/shadcn tooltip primitive in `src/components/ui/tooltip.jsx`. The mock already uses `BtInfoTooltip`, `BtValueTooltip`, and `BtHeaderWithHelp` in `src/features/backtesting/components/BtInfoTooltip.jsx`. Update existing field tooltips when present; do not add a second trigger to the same label or value.
4. Keep one shared text catalog, keyed by the exact `tooltip_key` values below. Do not merge keys because labels look similar: some metrics differ by scope, units, or calculation. A block and field key resolve to a catalog key; the catalog key resolves to one English description.
5. Only the placements below require field explanation tooltips. Remove obsolete field explanation triggers in these blocks when they are outside the approved list. Keep unrelated action, status, error, and chart interaction tooltips.
6. Treat `Stage(s)` as applicability. For example, `hyperopt_parameters.trading_mode` is one rule used in Stages 1–4. Stage-specific rows apply only where the row lists that stage.
7. Keep the existing mock architecture and behavior. This brief covers the mock UI; a server endpoint can later serve the same keys and text. Use the current JavaScript/JSX stack and existing styling for legacy and prod themes.
8. Make the trigger available on hover and keyboard focus. Preserve readable line breaks and `**bold**` emphasis in the catalog text. Ensure the tooltip remains visible above modal and table layers without blocking interaction.

## Where to look in the mock

| Area | Likely entry points |
|---|---|
| Builder stages 1–4 | `src/features/builder/BuilderStepper.jsx`; `src/features/builder/components/RiskStoplossPanel.jsx`; `src/features/builder/components/results/` |
| Stage 5 run form and core results | `src/features/backtesting/components/forms/RunBacktestForm.jsx`; `src/features/backtesting/components/CoreMetricsCompareTable.jsx`; `src/features/backtesting/components/BranchPanel.jsx` |
| Backtesting info | `src/features/backtesting/components/BacktestingInfoModal.jsx`; `PerformanceSummaryTab.jsx`; `TemporalSummaryTab.jsx`; `TradesSummaryTab.jsx` |
| Shuffler | `src/features/backtesting/components/forms/RunShufflerModal.jsx`; `PessimismGrid.jsx`; `ShuffleInfoModal.jsx`; `ShuffleSectionSummaryPanel.jsx` |
| Synthetic | `src/features/backtesting/components/SyntheticCoreResultsPanel.jsx`; `SyntheticInfoModal.jsx`; `SyntheticPerformanceTab.jsx`; `SyntheticTemporalTab.jsx` |
| Existing text sources | `src/constants/backtesting.js` (`BT_TOOLTIPS`, `BT_PERFORMANCE_TOOLTIPS`, `BT_TEMPORAL_TOOLTIPS`, etc.); reconcile these with the approved catalog |

The user-provided block screenshots are in [Strategy block screenshots.pdf](../../Documentation/Strategy%20block%20screenshots.pdf). Page numbers in the next table refer to that PDF. Some screenshots show an example stage; inspect the actual stage before applying a placement.

## Blocks and screenshots

| `block.key` | Stage(s) | Screen / block | Screenshot pages |
|---|---|---|---|
| `hyperopt_parameters` | Stage 1, Stage 2, Stage 3, Stage 4 | Strategy builder → Hyperoptimization Parameters | 1, 7 |
| `favorite_epochs` | Stage 1, Stage 2, Stage 3, Stage 4 | Strategy builder → Favorite Epochs | 4, 10 |
| `post_processing_info.stability` | Stage 1, Stage 2, Stage 3, Stage 4 | Strategy builder → Post-processing formula info → Stability formula | 5 |
| `post_processing_info.score` | Stage 1, Stage 2, Stage 3, Stage 4 | Strategy builder → Post-processing formula info → Score formula | 6 |
| `source_epoch_info` | Stage 1, Stage 2, Stage 3, Stage 4 | Strategy builder → Source epoch info | 8 |
| `stoplosses` | Stage 4 | Strategy builder → Stoplosses | 9 |
| `cooldown` | Stage 4 | Strategy builder → Loss streak & cooldown | 9 |
| `backtest` | Stage 5 | Validation → Backtest parameters | 11 |
| `backtest_core_metrics` | Stage 5 | Validation → Backtest runs → Core metrics | 13 |
| `backtesting_info.performance` | Stage 5 | Validation → Backtesting info → Performance | 14 |
| `backtesting_info.temporal` | Stage 5 | Validation → Backtesting info → Temporal | 15–16 |
| `backtesting_info.trades` | Stage 5 | Validation → Backtesting info → Trades | 17 |
| `shuffler` | Stage 5 | Validation → Run Shuffler | See block map in source sheet |
| `shuffler_run_parameters` | Stage 5 | Validation → Shuffler run parameters | 18 |
| `shuffle_info.summary` | Stage 5 | Validation → Shuffle info → Summary → Shared | 19–20 |
| `shuffle_info.summary.general` | Stage 5 | Validation → Shuffle info → Summary → General | 19 |
| `shuffle_info.summary.recovery` | Stage 5 | Validation → Shuffle info → Summary → Recovery | 20 |
| `synthetic_core_metrics` | Stage 5 | Validation → Synthetic backtest runs → Core metrics | 21 |
| `synthetic_info.performance` | Stage 5 | Validation → Synthetic backtest info → Performance | 22–23 |
| `synthetic_info.temporal` | Stage 5 | Validation → Synthetic backtest info → Temporal metrics | 24 |

## Placement map

Use `block.key` + `field.key` to find a UI location, then use its `tooltip_key` to look up the text in the catalog. These keys are identifiers for this inventory; they may differ from React variable names. Labels are shown as they appear in the current inventory; follow the actual UI when a label has changed.

### `hyperopt_parameters`

| Stage(s) | `field.key` | UI label | `tooltip_key` |
|---|---|---|---|
| Stage 1, Stage 2, Stage 3, Stage 4 | `hyperopt_type` | Hyperopt Type | `strategy.hyperopt_type` |
| Stage 1 | `fold_size` | Fold size (candles) | `strategy.fold_size` |

### `favorite_epochs`

| Stage(s) | `field.key` | UI label | `tooltip_key` |
|---|---|---|---|
| Stage 1, Stage 2, Stage 3, Stage 4 | `score` | Score | `strategy.score` |
| Stage 1 | `mfe` | MFE | `strategy.mfe` |
| Stage 1 | `mae` | MAE | `strategy.mae` |
| Stage 1 | `air` | AIR | `strategy.air` |
| Stage 1 | `hit_rate` | Hit Rate | `strategy.hit_rate` |
| Stage 4 | `profit_factor` | Profit factor | `strategy.profit_factor` |
| Stage 4 | `drawdown` | Drawdown | `strategy.drawdown` |

### `post_processing_info.stability`

| Stage(s) | `field.key` | UI label | `tooltip_key` |
|---|---|---|---|
| Stage 1, Stage 2, Stage 3, Stage 4 | `air_difference` | Normalized AIR Difference | `strategy.air_difference` |
| Stage 1, Stage 2, Stage 3, Stage 4 | `hit_rate_difference` | Normalized Hit Rate Difference | `strategy.hit_rate_difference` |
| Stage 1, Stage 2, Stage 3, Stage 4 | `mae_difference` | Normalized MAE Difference | `strategy.mae_difference` |
| Stage 1, Stage 2, Stage 3, Stage 4 | `mfe_difference` | Normalized MFE Difference | `strategy.mfe_difference` |
| Stage 1, Stage 2, Stage 3, Stage 4 | `std_ratio` | Normalized STD Ratio | `strategy.std_ratio` |

### `post_processing_info.score`

| Stage(s) | `field.key` | UI label | `tooltip_key` |
|---|---|---|---|
| Stage 1, Stage 2, Stage 3, Stage 4 | `air_score` | Normalized AIR Score | `strategy.air_score` |
| Stage 1, Stage 2, Stage 3, Stage 4 | `hit_rate_score` | Normalized Hit Rate Score | `strategy.hit_rate_score` |
| Stage 1, Stage 2, Stage 3, Stage 4 | `mae_score` | Normalized MAE Score | `strategy.mae_score` |
| Stage 1, Stage 2, Stage 3, Stage 4 | `mfe_score` | Normalized MFE Score | `strategy.mfe_score` |
| Stage 1, Stage 2, Stage 3, Stage 4 | `stability` | Normalized Stability | `strategy.stability` |

### `source_epoch_info`

| Stage(s) | `field.key` | UI label | `tooltip_key` |
|---|---|---|---|
| Stage 1, Stage 2, Stage 3, Stage 4 | `stability_score` | STABILITY_SCORE | `strategy.stability_score` |
| Stage 1, Stage 2, Stage 3, Stage 4 | `cycle_count` | cycle_count | `strategy.cycle_count` |
| Stage 1, Stage 2, Stage 3, Stage 4 | `median_return` | ret_med | `strategy.median_return` |
| Stage 1, Stage 2, Stage 3, Stage 4 | `median_roi` | roi_med | `strategy.median_roi` |
| Stage 1, Stage 2, Stage 3, Stage 4 | `median_duration` | dur_med | `strategy.median_duration` |
| Stage 1, Stage 2, Stage 3, Stage 4 | `median_time_to_mfe` | tt_mfe_med | `strategy.median_time_to_mfe` |
| Stage 1, Stage 2, Stage 3, Stage 4 | `median_time_to_mae` | tt_mae_med | `strategy.median_time_to_mae` |
| Stage 1, Stage 2, Stage 3, Stage 4 | `profit_capture` | profit_capture | `strategy.profit_capture` |
| Stage 1, Stage 2, Stage 3, Stage 4 | `max_drawdown` | max_drawdown | `strategy.max_drawdown` |
| Stage 1, Stage 2, Stage 3, Stage 4 | `gross_pnl` | total_pnl_gross | `strategy.gross_pnl` |
| Stage 1, Stage 2, Stage 3, Stage 4 | `total_roi` | total_roi | `strategy.total_roi` |
| Stage 1, Stage 2, Stage 3, Stage 4 | `mfe_med` | mfe_med | `strategy.mfe_med` |
| Stage 1, Stage 2, Stage 3, Stage 4 | `mae_med` | mae_med | `strategy.mae_med` |
| Stage 1, Stage 2, Stage 3, Stage 4 | `air_med` | air_med | `strategy.air_med` |
| Stage 1, Stage 2, Stage 3, Stage 4 | `hr_val` | hr_val | `strategy.hr_val` |

### `stoplosses`

| Stage(s) | `field.key` | UI label | `tooltip_key` |
|---|---|---|---|
| Stage 4 | `stoploss` | Stoploss | `strategy.stoploss` |
| Stage 4 | `trailing_activation` | Trailing Activation | `strategy.trailing_activation` |
| Stage 4 | `trailing_distance` | Trailing Distance | `strategy.trailing_distance` |

### `cooldown`

| Stage(s) | `field.key` | UI label | `tooltip_key` |
|---|---|---|---|
| Stage 4 | `loss_streak_threshold` | Loss streak threshold | `strategy.loss_streak_threshold` |
| Stage 4 | `post_loss_cooldown_candles` | Post-loss cooldown (candles) | `strategy.post_loss_cooldown_candles` |

### `backtest`

| Stage(s) | `field.key` | UI label | `tooltip_key` |
|---|---|---|---|
| Stage 5 | `mini_backtest` | Mini-backtest · optional | `strategy.mini_backtest` |
| Stage 5 | `leverage` | Leverage | `strategy.leverage` |
| Stage 5 | `stake_mode` | Stake Mode | `strategy.stake_mode` |
| Stage 5 | `stake_value` | Stake Value | `strategy.stake_value` |
| Stage 5 | `profit_reserving` | Profit Reserving | `strategy.profit_reserving` |

### `backtest_core_metrics`

| Stage(s) | `field.key` | UI label | `tooltip_key` |
|---|---|---|---|
| Stage 5 | `roi` | ROI | `strategy.roi` |
| Stage 5 | `pnl` | PnL | `strategy.pnl` |
| Stage 5 | `max_drawdown` | Max Drawdown | `strategy.max_drawdown.2` |
| Stage 5 | `profit_factor` | Profit Factor | `strategy.profit_factor.2` |
| Stage 5 | `win_rate` | Win Rate | `strategy.win_rate` |
| Stage 5 | `delta` | Δ (BT vs Mini) | `strategy.delta.2` |

### `backtesting_info.performance`

| Stage(s) | `field.key` | UI label | `tooltip_key` |
|---|---|---|---|
| Stage 5 | `market_change` | Market change | `strategy.market_change` |
| Stage 5 | `cagr` | CAGR total | `strategy.cagr` |
| Stage 5 | `max_dd_real_pct` | Max drawdown, real % | `strategy.max_dd_real_pct` |
| Stage 5 | `calmar` | Calmar | `strategy.calmar` |
| Stage 5 | `profit_factor` | Profit factor | `strategy.profit_factor.3` |
| Stage 5 | `net_pl_pct` | Net P/L tradable, % | `strategy.net_pl_pct` |
| Stage 5 | `annual_pl` | Annual P/L, % | `strategy.annual_pl` |
| Stage 5 | `max_dd_account` | Max drawdown, account % | `strategy.max_dd_account` |
| Stage 5 | `avg_dd` | Avg drawdown, % | `strategy.avg_dd` |
| Stage 5 | `sortino` | Sortino | `strategy.sortino` |
| Stage 5 | `sharpe` | Sharpe | `strategy.sharpe` |
| Stage 5 | `max_dd_abs` | Max drawdown, ABS | `strategy.max_dd_abs` |
| Stage 5 | `dd_high_low` | Drawdown high \| low | `strategy.dd_high_low` |
| Stage 5 | `tradable` | Tradable amount | `strategy.tradable` |
| Stage 5 | `reserved` | Reserved amount | `strategy.reserved` |
| Stage 5 | `ratio` | Ratio | `strategy.ratio` |
| Stage 5 | `winrate` | Win rate (wins / losses) | `strategy.winrate` |
| Stage 5 | `expectancy` | Expectancy (ratio) | `strategy.expectancy` |
| Stage 5 | `max_loss_n` | Losses, max count | `strategy.max_loss_n` |
| Stage 5 | `avg_loss_n` | Losses, avg count | `strategy.avg_loss_n` |
| Stage 5 | `max_win_n` | Wins, max count | `strategy.max_win_n` |
| Stage 5 | `avg_win_n` | Wins, avg count | `strategy.avg_win_n` |
| Stage 5 | `down_avg` | Downtime · Avg | `strategy.down_avg` |
| Stage 5 | `ccl` | Trades closed by CCL | `strategy.ccl` |
| Stage 5 | `drawdown_duration` | Drawdown duration | `strategy.drawdown_duration` |

### `backtesting_info.temporal`

| Stage(s) | `field.key` | UI label | `tooltip_key` |
|---|---|---|---|
| Stage 5 | `rel_max_dd_tradable` | Relative Max Drawdown Tradable | `strategy.rel_max_dd_tradable` |
| Stage 5 | `rel_dd_tradable` | Relative Drawdown Tradable | `strategy.rel_dd_tradable` |
| Stage 5 | `rel_max_dd_equity` | Relative Max Equity Drawdown | `strategy.rel_max_dd_equity` |
| Stage 5 | `rel_dd_equity` | Relative Equity Drawdown | `strategy.rel_dd_equity` |
| Stage 5 | `pnl_tradable` | PnL Tradable | `strategy.pnl_tradable` |
| Stage 5 | `pnl_reserved` | PnL Reserved | `strategy.pnl_reserved` |
| Stage 5 | `pnl_total` | PnL Total | `strategy.pnl_total` |
| Stage 5 | `cagr_tradable` | CAGR Tradable | `strategy.cagr_tradable` |
| Stage 5 | `cagr_total` | CAGR Total | `strategy.cagr_total` |
| Stage 5 | `max_tradable_at_peak` | Max Tradable at Peak | `strategy.max_tradable_at_peak` |
| Stage 5 | `min_tradable_after_peak` | Min Tradable after Peak | `strategy.min_tradable_after_peak` |
| Stage 5 | `max_equity_at_peak` | Max Equity at Peak | `strategy.max_equity_at_peak` |
| Stage 5 | `min_equity_after_peak` | Min Equity after Peak | `strategy.min_equity_after_peak` |

### `backtesting_info.trades`

| Stage(s) | `field.key` | UI label | `tooltip_key` |
|---|---|---|---|
| Stage 5 | `stake_amount` | Stake amount | `strategy.stake_amount` |
| Stage 5 | `liq_price` | Liq. price | `strategy.liq_price` |
| Stage 5 | `net_pl_pct` | Net P/L, % | `strategy.net_pl_pct.2` |
| Stage 5 | `net_pl_usdt` | Net P/L, USDT | `strategy.net_pl_usdt.2` |
| Stage 5 | `reserved` | Reserved | `strategy.reserved.2` |

### `shuffler`

| Stage(s) | `field.key` | UI label | `tooltip_key` |
|---|---|---|---|
| Stage 5 | `simulation_mode` | Simulation Mode | `strategy.simulation_mode` |
| Stage 5 | `shuffle_approach` | Shuffle Approach | `strategy.shuffle_approach` |

### `shuffler_run_parameters`

| Stage(s) | `field.key` | UI label | `tooltip_key` |
|---|---|---|---|
| Stage 5 | `mcl` | MCL | `strategy.mcl` |
| Stage 5 | `mcw` | MCW | `strategy.mcw` |
| Stage 5 | `acl` | ACL | `strategy.acl` |
| Stage 5 | `acw` | ACW | `strategy.acw` |

### `shuffle_info.summary`

| Stage(s) | `field.key` | UI label | `tooltip_key` |
|---|---|---|---|
| Stage 5 | `original_percentile` | Original vs runs | `strategy.original_percentile` |

### `shuffle_info.summary.general`

| Stage(s) | `field.key` | UI label | `tooltip_key` |
|---|---|---|---|
| Stage 5 | `final_pnl` | Final PnL | `strategy.final_pnl` |
| Stage 5 | `roi` | ROI | `strategy.roi.2` |
| Stage 5 | `pf` | Profit Factor | `strategy.pf` |
| Stage 5 | `dd_peak` | Max Drawdown | `strategy.dd_peak` |
| Stage 5 | `max_dd_init` | Max Drawdown from initial balance | `strategy.max_dd_init` |
| Stage 5 | `mcl` | MCL (Max Consec. Losses) | `strategy.mcl.2` |
| Stage 5 | `mcw` | MCW (Max Consec. Wins) | `strategy.mcw.2` |
| Stage 5 | `acl` | ACL (Avg Consec. Losses) | `strategy.acl.2` |
| Stage 5 | `acw` | ACW (Avg Consec. Wins) | `strategy.acw.2` |

### `shuffle_info.summary.recovery`

| Stage(s) | `field.key` | UI label | `tooltip_key` |
|---|---|---|---|
| Stage 5 | `max_rec_init` | Max Recovery Period from initial balance | `strategy.max_rec_init` |
| Stage 5 | `rec_peak` | Recovery Period from Peak | `strategy.rec_peak` |
| Stage 5 | `unclosed` | Unclosed phases at end of dataset | `strategy.unclosed` |
| Stage 5 | `loss_recovered` | Loss streaks recovered | `strategy.loss_recovered` |
| Stage 5 | `loss_rec_rate` | Loss streak recovery rate | `strategy.loss_rec_rate` |
| Stage 5 | `win_to_rec` | Win streaks that led to recovery | `strategy.win_to_rec` |
| Stage 5 | `win_rec_rate` | Recovering win streak rate | `strategy.win_rec_rate` |

### `synthetic_core_metrics`

| Stage(s) | `field.key` | UI label | `tooltip_key` |
|---|---|---|---|
| Stage 5 | `roi` | ROI | `strategy.roi.3` |
| Stage 5 | `pnl` | PnL | `strategy.pnl.2` |
| Stage 5 | `max_drawdown` | Max Drawdown | `strategy.max_drawdown.3` |
| Stage 5 | `profit_factor` | Profit Factor | `strategy.profit_factor.2` |
| Stage 5 | `win_rate` | Win Rate | `strategy.win_rate` |
| Stage 5 | `percentile` | Percentile | `strategy.percentile` |

### `synthetic_info.performance`

| Stage(s) | `field.key` | UI label | `tooltip_key` |
|---|---|---|---|
| Stage 5 | `market_change` | Market change | `strategy.market_change` |
| Stage 5 | `cagr` | CAGR total | `strategy.cagr` |
| Stage 5 | `max_dd_real_pct` | Max drawdown, real % | `strategy.max_dd_real_pct` |
| Stage 5 | `calmar` | Calmar | `strategy.calmar` |
| Stage 5 | `profit_factor` | Profit factor | `strategy.profit_factor.3` |
| Stage 5 | `net_pl_pct` | Net P/L tradable, % | `strategy.net_pl_pct` |
| Stage 5 | `annual_pl` | Annual P/L, % | `strategy.annual_pl` |
| Stage 5 | `max_dd_account` | Max drawdown, account % | `strategy.max_dd_account` |
| Stage 5 | `avg_dd` | Avg drawdown, % | `strategy.avg_dd` |
| Stage 5 | `sortino` | Sortino | `strategy.sortino` |
| Stage 5 | `sharpe` | Sharpe | `strategy.sharpe` |
| Stage 5 | `max_dd_abs` | Max drawdown, ABS | `strategy.max_dd_abs` |
| Stage 5 | `dd_high_low` | Drawdown high \| low | `strategy.dd_high_low` |
| Stage 5 | `tradable` | Tradable amount | `strategy.tradable` |
| Stage 5 | `reserved` | Reserved amount | `strategy.reserved` |
| Stage 5 | `ratio` | Ratio | `strategy.ratio` |
| Stage 5 | `winrate` | Win rate (wins / losses) | `strategy.winrate` |
| Stage 5 | `expectancy` | Expectancy (ratio) | `strategy.expectancy` |
| Stage 5 | `max_loss_n` | Losses, max count | `strategy.max_loss_n` |
| Stage 5 | `avg_loss_n` | Losses, avg count | `strategy.avg_loss_n` |
| Stage 5 | `max_win_n` | Wins, max count | `strategy.max_win_n` |
| Stage 5 | `avg_win_n` | Wins, avg count | `strategy.avg_win_n` |
| Stage 5 | `down_avg` | Avg | `strategy.down_avg` |
| Stage 5 | `ccl` | Trades closed by CCL | `strategy.ccl` |
| Stage 5 | `net_pl_usdt` | Net P/L tradable, USDT | `strategy.net_pl_usdt` |
| Stage 5 | `max_dd_real_usdt` | Max drawdown, real USDT | `strategy.max_dd_real_usdt` |
| Stage 5 | `max_loss_amt` | Losses, max amount | `strategy.max_loss_amt` |
| Stage 5 | `avg_loss_amt` | Losses, avg amount | `strategy.avg_loss_amt` |
| Stage 5 | `max_win_amt` | Wins, max amount | `strategy.max_win_amt` |
| Stage 5 | `avg_win_amt` | Wins, avg amount | `strategy.avg_win_amt` |

### `synthetic_info.temporal`

| Stage(s) | `field.key` | UI label | `tooltip_key` |
|---|---|---|---|
| Stage 5 | `rel_max_dd_tradable` | Relative Max Drawdown Tradable | `strategy.rel_max_dd_tradable` |
| Stage 5 | `rel_dd_tradable` | Relative Drawdown Tradable | `strategy.rel_dd_tradable` |
| Stage 5 | `rel_max_dd_equity` | Relative Max Equity Drawdown | `strategy.rel_max_dd_equity` |
| Stage 5 | `rel_dd_equity` | Relative Equity Drawdown | `strategy.rel_dd_equity` |
| Stage 5 | `pnl_tradable` | PnL Tradable | `strategy.pnl_tradable` |
| Stage 5 | `pnl_reserved` | PnL Reserved | `strategy.pnl_reserved` |
| Stage 5 | `pnl_total` | PnL Total | `strategy.pnl_total` |
| Stage 5 | `cagr_tradable` | CAGR Tradable | `strategy.cagr_tradable` |
| Stage 5 | `cagr_total` | CAGR Total | `strategy.cagr_total` |
| Stage 5 | `max_tradable_at_peak` | Max Tradable at Peak | `strategy.max_tradable_at_peak` |
| Stage 5 | `min_tradable_after_peak` | Min Tradable after Peak | `strategy.min_tradable_after_peak` |
| Stage 5 | `max_equity_at_peak` | Max Equity at Peak | `strategy.max_equity_at_peak` |
| Stage 5 | `min_equity_after_peak` | Min Equity after Peak | `strategy.min_equity_after_peak` |

## Tooltip catalog

The text below is the approved `description (tooltip)` value. Each catalog key is defined once. `Calculation:` belongs inside the same tooltip content; it is not a separate API/data field.

| `tooltip_key` | English tooltip text |
|---|---|
| `strategy.hyperopt_type` | Selects how the run searches the configured parameter grid. |
| `strategy.fold_size` | The number of candles assigned to a fold when the historical data is split for evaluation. |
| `strategy.score` | The ranking score recorded for this epoch. Its interpretation depends on the stage and scoring configuration. |
| `strategy.mfe` | The median of the largest favorable price moves measured across this epoch's cycles. |
| `strategy.mae` | The median of the largest adverse price moves measured across this epoch's cycles. |
| `strategy.air` | The median ratio of favorable movement to adverse movement across this epoch's cycles. |
| `strategy.hit_rate` | The share of evaluated cycles with a positive result. |
| `strategy.air_difference` | The normalized air difference component used in the stability formula. |
| `strategy.hit_rate_difference` | The normalized hit rate difference component used in the stability formula. |
| `strategy.mae_difference` | The normalized mae difference component used in the stability formula. |
| `strategy.mfe_difference` | The normalized mfe difference component used in the stability formula. |
| `strategy.std_ratio` | The normalized std ratio component used in the stability formula. |
| `strategy.air_score` | The normalized air score component used in the score formula. |
| `strategy.hit_rate_score` | The normalized hit rate score component used in the score formula. |
| `strategy.mae_score` | The normalized mae score component used in the score formula. |
| `strategy.mfe_score` | The normalized mfe score component used in the score formula. |
| `strategy.stability` | The normalized stability component used in the score formula. |
| `strategy.stability_score` | The penalty used to account for differences between evaluation splits. |
| `strategy.cycle_count` | The number of cycles evaluated for this epoch. |
| `strategy.median_return` | The median return across evaluated cycles. |
| `strategy.median_roi` | The median return on investment across evaluated cycles. |
| `strategy.median_duration` | The median cycle duration in candles. |
| `strategy.median_time_to_mfe` | The median number of candles from cycle start to the best favorable move. |
| `strategy.median_time_to_mae` | The median number of candles from cycle start to the worst adverse move. |
| `strategy.profit_capture` | Measures how much of the favorable move was captured by the realized result. |
| `strategy.max_drawdown` | The largest peak-to-trough decline in the evaluated balance or equity. |
| `strategy.gross_pnl` | The total monetary profit or loss before fees. |
| `strategy.total_roi` | The total return on investment reported for this epoch. |
| `strategy.mfe_med` | The median maximum favorable excursion across cycles. |
| `strategy.mae_med` | The median maximum adverse excursion across cycles. |
| `strategy.air_med` | The median favorable-to-adverse movement ratio. |
| `strategy.hr_val` | The share of evaluated cycles with a positive result. |
| `strategy.stoploss` | The loss threshold used to close a position when the trade moves against it. |
| `strategy.trailing_activation` | The favorable move required before the trailing stop becomes active. |
| `strategy.trailing_distance` | The distance the active trailing stop keeps from the best price reached since entry. |
| `strategy.loss_streak_threshold` | The number of consecutive losses required to trigger the cooldown. |
| `strategy.post_loss_cooldown_candles` | The number of candles to wait before allowing another entry after the loss streak triggers the cooldown. |
| `strategy.profit_factor` | Gross profit divided by gross loss in absolute terms. |
| `strategy.drawdown` | The drawdown recorded for this risk epoch. |
| `strategy.mini_backtest` | Uses the selected mini backtest settings and enables comparison with the full backtest. Leave empty for a standalone run. |
| `strategy.leverage` | The multiplier applied to position exposure when leverage is available. |
| `strategy.stake_mode` | Determines whether the stake is a fixed amount or a percentage of the available balance. |
| `strategy.stake_value` | The amount allocated per trade, interpreted according to Stake Mode. |
| `strategy.profit_reserving` | The percentage of profit set aside after each winning trade. Leave blank to keep all profit available for trading. |
| `strategy.roi` | Return on the starting capital for this backtest. |
| `strategy.pnl` | Net monetary profit or loss of the backtest. |
| `strategy.max_drawdown.2` | Largest peak-to-trough decline of the backtest account balance. |
| `strategy.profit_factor.2` | Gross profit divided by the absolute value of gross loss. |
| `strategy.win_rate` | The share of closed trades that were profitable. |
| `strategy.delta.2` | The difference between full and mini backtest metric values. |
| `strategy.market_change` | How much the traded instrument itself moved over the period. It is the benchmark the run is compared against. |
| `strategy.cagr` | Compound annual growth rate on the total balance (tradable + reserved), assuming profits are reinvested.<br><br>Calculation:<br>(final_balance(total) ÷ starting_balance(total)) ^ (1 ÷ (backtesting_days ÷ 365)) − 1 |
| `strategy.max_dd_real_pct` | Deepest drop measured on equity over time, not on closed trades. It counts unrealised P/L, candle movement and the effect of leverage — so it also captures drawdowns of positions that later recovered.<br><br>Calculation:<br>Percentage: (Max Equity at Peak − Min Equity after Peak) ÷ Max Equity at Peak × 100<br>Equity: Free tradable + Used Margin + Unrealized PnL |
| `strategy.calmar` | Annual return divided by the maximum drawdown. Answers “how much return per unit of pain”. |
| `strategy.profit_factor.3` | Above 1 the strategy earns more than it loses. Below 1 it does the opposite.<br><br>Calculation:<br>Ratio: gross profit ÷ gross loss |
| `strategy.net_pl_pct` | Result on the **trading balance** — the money the strategy actually traded with. The reserve is not part of it.<br><br>Calculation:<br>Percentage: (End Tradable − Start Tradable) ÷ Start Tradable × 100<br>Absolute: End Tradable − Start Tradable |
| `strategy.annual_pl` | Net P/L stretched to a yearly basis without compounding. For the compounded version see CAGR in the cards below.<br><br>Calculation:<br>Percentage: PnL Tradable % ÷ (backtesting_days ÷ 365) |
| `strategy.max_dd_account` | Deepest drop from the highest balance peak to the lowest point, measured on closed trades only. Open positions and intra-candle moves are not part of it.<br><br>Calculation:<br>Percentage: (Max Tradable at Peak − Min Tradable after Peak) ÷ Max Tradable at Peak × 100<br>Absolute: Max Tradable at Peak − Min Tradable after Peak |
| `strategy.avg_dd` | Average depth of all drawdowns in the run, not just the worst one. A high average with a similar maximum means the strategy sat under water most of the time. |
| `strategy.sortino` | Return per unit of downside volatility. Unlike Sharpe it does not punish upside swings. |
| `strategy.sharpe` | Return per unit of total volatility. |
| `strategy.max_dd_abs` | Peak-to-trough distance taken over the whole equity curve, without splitting it into separate drawdown episodes. It differs slightly from Max drawdown, real because the two use different peak definitions. |
| `strategy.dd_high_low` | Balance at the start and at the bottom of the deepest drawdown. |
| `strategy.tradable` | Balance the strategy is allowed to trade with at the end of the run — the reserve is excluded.<br><br>Calculation:<br>Absolute: Total balance − Reserved amount |
| `strategy.reserved` | Profit moved aside by Profit Reserving. It no longer takes part in trading.<br><br>Calculation:<br>Absolute: sum(reserved amount per trade) |
| `strategy.ratio` | Represents the share of capital that is reserved compared to the tradable balance. Closer to 0 — most funds are available for trading. Closer to 1 — most funds are reserved and locked. = 1 — the reserve equals the tradable balance. > 1 — the reserve is larger than what is being traded.<br><br>Calculation:<br>Ratio: Reserved amount ÷ Tradable amount |
| `strategy.winrate` | Share of profitable trades, written as wins / losses. On its own it says little: a strategy can win 80% of trades and still lose money if the losers are larger.<br><br>Calculation:<br>Percentage: wins ÷ (wins + losses) × 100 |
| `strategy.expectancy` | Average result of one trade in R-multiples. Negative expectancy means the strategy loses on average, no matter the win rate. |
| `strategy.max_loss_n` | Longest unbroken run of losing trades. This is what a live account has to survive without the quant switching the strategy off. |
| `strategy.avg_loss_n` | Typical length of a losing streak. |
| `strategy.max_win_n` | Longest unbroken run of winning trades. |
| `strategy.avg_win_n` | Typical length of a winning streak. |
| `strategy.down_avg` | Idle time between one trade closing and the next one opening. Large downtime with many trades means the strategy fires in bursts.<br><br>Calculation:<br>avg(idle periods) |
| `strategy.ccl` | Share of canceled trades against the rest, written as canceled / not canceled. A trade counts as canceled when its exit reason is canceled.<br><br>Calculation:<br>Percentage: canceled ÷ (canceled + not canceled) × 100 |
| `strategy.net_pl_usdt` | The same result in quote currency. This is what the source report calls Total Profit.<br><br>Calculation:<br>Absolute: End Tradable − Start Tradable |
| `strategy.max_dd_real_usdt` | The same equity-based drawdown in quote currency.<br><br>Calculation:<br>Absolute: Max Equity at Peak − Min Equity after Peak<br>Equity: Free tradable + Used Margin + Unrealized PnL |
| `strategy.max_loss_amt` | Money lost during the worst losing streak. |
| `strategy.avg_loss_amt` | Money lost during a typical losing streak. |
| `strategy.max_win_amt` | Money made during the best winning streak. |
| `strategy.avg_win_amt` | Money made during a typical winning streak. |
| `strategy.drawdown_duration` | The elapsed time spent below a previous balance peak. |
| `strategy.rel_max_dd_tradable` | Shows the maximum drawdown from any local maximum (Tradable) to the minimum value (Trough) after it. Based on closed trades only. Example: Peak 1 = 120 → values after it: 110, 105, 130 → minimum 105 = Trough after Peak 1. Drawdown = (120 − 105) / 120 = 12.5%. Peak 2 = 130 → values after it: 125, 140 → minimum 125 = Trough after Peak 2. Drawdown = (130 − 125) / 130 ≈ 3.85%. Relative Max Drawdown = the maximum of these drawdowns = 12.5%.<br><br>Calculation:<br>Percentage: (Max Tradable at Peak − Min Tradable after Peak) ÷ Max Tradable at Peak × 100<br>Absolute: Max Tradable at Peak − Min Tradable after Peak |
| `strategy.rel_dd_tradable` | Measures how much the tradable balance fell from the start of the period. Absolute decline from start of the year to the lowest point. Based on closed trades only.<br><br>Calculation:<br>Percentage: (Start Tradable − Min Tradable) ÷ Start Tradable × 100<br>Absolute: Start Tradable − Min Tradable |
| `strategy.rel_max_dd_equity` | Shows the maximum drawdown from any local maximum (Equity) to the minimum value (Trough) after it. Includes open trades. Example: Peak 1 = 120 → values after it: 110, 105, 130 → minimum 105 = Trough after Peak 1. Drawdown = (120 − 105) / 120 = 12.5%. Peak 2 = 130 → values after it: 125, 140 → minimum 125 = Trough after Peak 2. Drawdown = (130 − 125) / 130 ≈ 3.85%. Relative Max Drawdown = the maximum of these drawdowns = 12.5%.<br><br>Calculation:<br>Percentage: (Max Equity at Peak − Min Equity after Peak) ÷ Max Equity at Peak × 100<br>Absolute: Max Equity at Peak − Min Equity after Peak |
| `strategy.rel_dd_equity` | Shows how far equity fell from the starting point of the period. Absolute equity drawdown from period start. Includes open trades.<br><br>Calculation:<br>Percentage: (Start Equity − Min Equity) ÷ Start Equity × 100<br>Absolute: Start Equity − Min Equity |
| `strategy.pnl_tradable` | Profit and Loss for tradable balance during the period. Percentage shows the relative return on the starting tradable balance. Absolute shows the actual amount gained or lost in tradable balance.<br><br>Calculation:<br>Percentage: (End Tradable − Start Tradable) ÷ Start Tradable × 100<br>Absolute: End Tradable − Start Tradable |
| `strategy.pnl_reserved` | Profit reserved funds during the period. Percentage shows the reserved amount relative to the starting tradable balance. Absolute shows the actual reserved amount.<br><br>Calculation:<br>Percentage: (Reserved amount ÷ Start Tradable) × 100<br>Absolute: Reserved amount |
| `strategy.pnl_total` | Total Profit and Loss combining tradable and reserved amounts. Percentage shows the combined relative return. Absolute shows the total actual amount gained or lost.<br><br>Calculation:<br>Percentage: PnL Tradable % + PnL Reserved %<br>Absolute: PnL Tradable + PnL Reserved |
| `strategy.cagr_tradable` | CAGR (Compound Annual Growth Rate) represents the smoothed annual growth rate of capital over a given period, assuming profits are reinvested. It’s widely used to compare strategies or investments on a normalized yearly basis. Calculated with tradable amount.<br><br>Calculation:<br>(final_balance(tradable) ÷ starting_balance(tradable)) ^ (1 ÷ (backtesting_days ÷ 365)) − 1 |
| `strategy.cagr_total` | CAGR (Compound Annual Growth Rate) represents the smoothed annual growth rate of capital over a given period, assuming profits are reinvested. It’s widely used to compare strategies or investments on a normalized yearly basis. Calculated with total amount (total = tradable + reserved).<br><br>Calculation:<br>(final_balance(total) ÷ starting_balance(total)) ^ (1 ÷ (backtesting_days ÷ 365)) − 1 |
| `strategy.max_tradable_at_peak` | Max Tradable at Peak — the local peak value of Tradable in the selected period. It marks the starting point of a drawdown. For each peak, we measure the minimum value after it (Trough after Peak) to calculate the Relative Max Drawdown. Example: Values: 100, 120, 110, 105, 130, 125. Peak 1 = 120 → Trough after Peak = 105. Peak 2 = 130 → Trough after Peak = 125. |
| `strategy.min_tradable_after_peak` | Trough after Peak is the minimum value after a local maximum (Peak), before the next peak, or before the end of the period. It shows the depth of the decline after a specific maximum Tradable. Example: Peak 1 = 120 → values after it: 110, 105, 130 → minimum 105 = Trough after Peak 1. |
| `strategy.max_equity_at_peak` | Max Equity at Peak — the local peak value of Equity in the selected period. It marks the starting point of a drawdown. For each peak, we measure the minimum value after it (Trough after Peak) to calculate the Relative Max Drawdown. Example: Values: 100, 120, 110, 105, 130, 125. Peak 1 = 120 → Trough after Peak = 105. Peak 2 = 130 → Trough after Peak = 125. |
| `strategy.min_equity_after_peak` | Trough after Peak is the minimum value after a local maximum (Peak), before the next peak, or before the end of the period. It shows the depth of the decline after a specific maximum Equity. Example: Peak 1 = 120 → values after it: 110, 105, 130 → minimum 105 = Trough after Peak 1. Peak 2 = 130 → values after it: 125, 140 → minimum 125 = Trough after Peak 2. |
| `strategy.stake_amount` | Position size at entry, with leverage in brackets. |
| `strategy.liq_price` | Price at which the position would be liquidated by the exchange. |
| `strategy.net_pl_pct.2` | Result of this row — an enter tag, an exit reason or a single trade — in percent of the stake it used. This is not an account-level figure; for that see Net P/L tradable, %.<br><br>Calculation:<br>Percentage: net result of the row ÷ stake used × 100 |
| `strategy.net_pl_usdt.2` | The same row-level result in quote currency, after fees and funding.<br><br>Calculation:<br>Absolute: sum of net result across the trades of the row |
| `strategy.reserved.2` | Profit moved to the reserve by this particular trade. |
| `strategy.simulation_mode` | Selects the simulation setup used to rerun the baseline strategy. |
| `strategy.shuffle_approach` | Selects the method used to shuffle the input for the simulations. |
| `strategy.mcl` | The maximum consecutive losses target for this level. |
| `strategy.mcw` | The maximum consecutive wins target for this level. |
| `strategy.acl` | The average consecutive losses target for this level. |
| `strategy.acw` | The average consecutive wins target for this level. |
| `strategy.original_percentile` | The position of the original result within the distribution of simulated results. |
| `strategy.final_pnl` | Profit or loss at the end of the simulation. |
| `strategy.roi.2` | Return on the starting balance. |
| `strategy.pf` | Gross profit divided by the absolute value of gross loss. |
| `strategy.dd_peak` | Largest decline from a previous balance peak. |
| `strategy.max_dd_init` | Largest percentage shortfall below the starting balance. |
| `strategy.mcl.2` | Longest streak of consecutive losing trades. |
| `strategy.mcw.2` | Longest streak of consecutive winning trades. |
| `strategy.acl.2` | Average length of a losing streak in trades. |
| `strategy.acw.2` | Average length of a winning streak in trades. |
| `strategy.max_rec_init` | Longest period spent below the starting balance before recovery. |
| `strategy.rec_peak` | Time taken to regain a previous balance peak after a drawdown. |
| `strategy.unclosed` | Recovery phases still open at the end of the dataset. |
| `strategy.loss_recovered` | Number of losing streaks followed by a recovery. |
| `strategy.loss_rec_rate` | Share of losing streaks followed by a recovery. |
| `strategy.win_to_rec` | Number of winning streaks that led to recovery. |
| `strategy.win_rec_rate` | Share of winning streaks that led to recovery. |
| `strategy.roi.3` | Return on the starting capital of the synthetic backtest. |
| `strategy.pnl.2` | Net monetary profit or loss of the synthetic backtest. |
| `strategy.max_drawdown.3` | Largest peak-to-trough decline in the synthetic run. |
| `strategy.percentile` | The percentile rank of the original result among synthetic runs. |

## Acceptance checklist

- Every listed placement that exists in the mock resolves to its exact catalog text; shared keys are stored once.
- No target field receives two tooltip triggers, and approved blocks have no obsolete field explanation tooltip outside this list.
- Stage-specific fields appear only in the listed stages. No Mini Backtest tooltip work is included.
- Existing Backtesting, Shuffle, and Synthetic info modals retain their behavior; labels and values remain readable with hover and keyboard focus.
- Run `npm run build` and `npm run lint` in `Mockup/QuantSandbox`. Review the relevant blocks in both UI themes and report any placement that could not be matched to an actual element.


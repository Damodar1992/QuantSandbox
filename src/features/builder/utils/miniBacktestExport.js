/**
 * CSV export builder for mini backtest results (POC v5 exportCSV).
 */

function esc(v) {
  return `"${String(v ?? "").replace(/"/g, '""')}"`;
}

function kv(k, v) {
  return `${esc(k)},${esc(v)}`;
}

/**
 * Build CSV string from a saved mini backtest entry.
 */
export function buildMiniBacktestCsv(entry) {
  const { params = {}, result = {}, cycleMeta = {} } = entry;
  const em = result.epoch || {};
  const r = result.summary || {};
  const rows = result.rows || [];
  const cfg = params;
  const data = {
    meta: {
      pair: cycleMeta.pair || entry.pairs || "—",
      timeframe: cycleMeta.timeframe || entry.timeframe || "—",
    },
    cycles: entry.cycleData || [],
  };

  const L = [];
  L.push("# MINI BACKTEST EXPORT");
  L.push(`# generated,${new Date().toISOString()}`);
  L.push("");
  L.push("## CONFIG");
  [
    ["Hyper Opt ID", entry.hyperoptId || "—"],
    ["Stage", entry.stageId ?? entry.stage ?? "—"],
    ["Epoch", entry.epochNumber ?? "—"],
    ["Pair", data.meta.pair],
    ["Timeframe", data.meta.timeframe],
    ["Cycles", data.cycles.length],
    ["Stake mode", cfg.stakeMode ?? "fixed"],
    ["Stake amount $", cfg.fixedStakeAmount ?? "—"],
    ["Stake %", cfg.relativeStakeAmount ?? "—"],
    ["Starting balance", cfg.initialBalance],
    ["Reserve from profit %", cfg.reservedPct ?? 0],
    ["Order type", cfg.orderType ?? "taker"],
    ["Taker fee %", cfg.feeTaker ?? "—"],
    ["Maker fee %", cfg.feeMaker ?? "—"],
    ["Slippage %", cfg.slippage ?? "—"],
    ["Market", cfg.marketType ?? "spot"],
    ["Leverage", cfg.leverage ?? 1],
    ["Maint margin %", cfg.maintMargin ?? "—"],
    ["Funding %/8h", cfg.fundRate ?? "—"],
    ["Stopout mode", cfg.stopoutMode ?? "pct"],
    ["Stopout value", cfg.stopout ?? 0],
  ].forEach(([k, v]) => L.push(kv(k, v)));

  L.push("");
  L.push("## EPOCH (BEFORE)");
  [
    ["Hit rate %", em.hitRate],
    ["Median MFE %", em.medMFE],
    ["Median MAE %", em.medMAE],
    ["Median AIR", em.medAIR],
    ["Profit Factor OHLC", em.pfOHLC],
    ["Profit capture", em.profitCapture],
    ["Avg duration candles", em.avgDurC],
    ["Time to MFE", em.medTtMfe],
    ["Time to MAE", em.medTtMae],
  ].forEach(([k, v]) => L.push(kv(k, v)));

  L.push("");
  L.push("## SUMMARY (AFTER)");
  [
    ["ROI total %", r.roiTotal ?? r.roi],
    ["ROI reserve %", r.roiReserve],
    ["ROI tradable %", r.roiTradable],
    ["Final balance", r.equity ?? r.finalBalance],
    ["Tradable", r.tradable],
    ["Reserve", r.reserve],
    ["PnL gross", r.pnlGross],
    ["PnL net", r.pnlNet ?? r.totalPnL],
    ["Trade fees", r.tradeFeesT ?? r.totalFees],
    ["Funding", r.fundingT],
    ["Slippage cost", r.slipCostT],
    ["Max DD total close %", r.maxDD],
    ["Max DD total intra %", r.maxDDIntra],
    ["Max DD tradable close %", r.maxDDTrad],
    ["Max DD tradable intra %", r.maxDDTradIntra],
    ["Calmar", r.calmar],
    ["Profit Factor net", r.pfNet ?? r.profitFactor],
    ["Win rate %", r.winRate],
    ["Executed", r.execCount ?? r.cyclesExecuted],
    ["Liquidations", r.liqCount],
    ["Halted", r.halted ?? r.stoppedOut],
    ["Halt reason", r.haltReason || "—"],
    ["Halt at cycle", r.haltAt || "—"],
  ].forEach(([k, v]) => L.push(kv(k, v)));

  L.push("");
  L.push("## PER-CYCLE");
  const hdr = [
    "id",
    "status",
    "P0",
    "P_exit",
    "exit_pct",
    "mae_pct",
    "mfe_pct",
    "duration_candles",
    "idx_mfe",
    "idx_mae",
    "stake",
    "notional",
    "qty_asset",
    "gross",
    "entry_fee",
    "exit_fee",
    "funding",
    "slip_cost",
    "net",
    "reserve_skim",
    "tradable",
    "balance",
    "intra_low",
  ];
  L.push(hdr.join(","));

  rows.forEach((row) => {
    const c = row.c;
    if (row.status === "halt" || row.status === "skip") {
      L.push([c.id, row.status, "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""].join(","));
      return;
    }
    L.push(
      [
        c.id,
        row.status,
        c.P0,
        c.P_exit.toFixed(2),
        (((c.P_exit / c.P0 - 1) * 100).toFixed(4)),
        c.mae_pct,
        c.mfe_pct,
        c.duration_candles,
        c.idx_mfe,
        c.idx_mae,
        row.stake.toFixed(2),
        row.notional.toFixed(2),
        (row.stake / c.P0).toFixed(8),
        row.gross.toFixed(2),
        row.entryFee.toFixed(2),
        row.exitFee.toFixed(2),
        row.funding.toFixed(2),
        (row.slipCost || 0).toFixed(2),
        row.net.toFixed(2),
        row.skim.toFixed(2),
        row.tradable.toFixed(2),
        row.equity.toFixed(2),
        row.intraLow.toFixed(2),
      ].join(","),
    );
  });

  return L.join("\n");
}

export function downloadMiniBacktestCsv(entry) {
  const csv = buildMiniBacktestCsv(entry);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const ho = entry.hyperoptId || "HO";
  const stage = entry.stageId ?? "S";
  const epoch = entry.epochNumber ?? "E";
  a.href = url;
  a.download = `mini_backtest_${ho}_${stage}E${epoch}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

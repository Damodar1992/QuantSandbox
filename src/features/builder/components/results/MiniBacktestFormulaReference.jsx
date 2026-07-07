import React, { memo, useEffect, useRef, useState } from "react";
import { cx } from "../../../../constants/ui";

/* ─── Formula data (mirrors the official HTML PoC reference) ─────────────
   Fields: [id, shortName, fullName, type, relationship, pairedWith,
            description, formula, computedFrom, example, whyUsed, location]
   type       : 'canon' | 'oper'
   relationship: 'paired' | 'carried' | 'nopair'
────────────────────────────────────────────────────────────────────────── */
export const FORMULA_REF = [
  [1,  "MFE",             "Maximum Favorable Excursion", "canon", "carried", null,       "Max favorable price move inside the cycle window vs entry.",                                       "max_high / P0 − 1",                                                     "max_high_over_window, p0_reference_price",       "max_high 71970.9, P0 71043 → +1.31%",         "Aggregated into Median MFE; feeds Profit Capture.",                                  "Stage Summary; carried"],
  [2,  "MAE",             "Maximum Adverse Excursion",   "canon", "carried", null,       "Max adverse price move inside the cycle (negative).",                                             "min_low / P0 − 1",                                                      "min_low_over_window, p0_reference_price",        "min_low 70780, P0 71043 → −0.37%",            "Basis for intra-cycle DD and liquidation.",                                          "Stage Summary; carried"],
  [3,  "AIR",             "Adverse Impact Ratio",        "canon", "carried", null,       "Balance of upside potential vs adverse move (capped at 10).",                                     "min( mfe / abs(mae), 10 )",                                             "mfe, mae",                                       "1.31/0.37 = 3.53",                            "Aggregated into Median AIR.",                                                        "Stage Summary; carried"],
  [4,  "Cycle Return",    "Cycle Return",                "canon", "carried", null,       "Net price change over the cycle (fraction).",                                                     "P_exit / P0 − 1",                                                       "P_exit_close_price, p0_reference_price",         "71943.8/71043 − 1 = +1.27%",                  "Basis for Gross PnL (executed).",                                                    "Stage Summary; carried"],
  [5,  "Cycle Duration",  "Cycle Duration",              "canon", "carried", null,       "Cycle length in candles (the first candle is included, hence +1).",                               "duration = end_index − start_index + 1",                                "duration",                                       "end 58, start 51 → 8 candles",                "Converted to hours for Funding (№26). Not used for CAGR — CAGR takes its period from the Time Range (№37).", "Stage Summary; carried"],
  [6,  "Time to MFE",     "Time to MFE",                 "canon", "carried", null,       "Candles from reference to the max high.",                                                         "idx_max_high − (start_index + 1)",                                      "max_high_over_window_index, start_index",        "58 − 53 = 5",                                 "Aggregated into Median Time to MFE; carried.",                                       "Stage Summary; carried"],
  [7,  "Time to MAE",     "Time to MAE",                 "canon", "carried", null,       "Candles from reference to the min low.",                                                          "idx_min_low − (start_index + 1)",                                       "min_low_over_window_index, start_index",         "54 − 53 = 1",                                 "Aggregated into Median Time to MAE; carried.",                                       "Stage Summary; carried"],
  [8,  "Hit Rate",        "Hit Rate",                    "canon", "paired",  "№39 Win Rate", "Share of cycles closing above entry (price-based).",                                          "count(P_exit > P0) / total_cycles",                                     "P_exit_close_price, p0_reference_price",         "3 / 5 = 60%",                                 "Stage Summary (before); paired with Win Rate.",                                      "Before/After"],
  [9,  "Median MFE",      "Median MFE",                  "canon", "carried", null,       "Median MFE across cycles.",                                                                       "median(mfe over cycles)",                                               "per-cycle mfe",                                  "0.90%",                                       "Stage Summary; carried.",                                                            "Stage Summary"],
  [10, "Median MAE",      "Median MAE",                  "canon", "carried", null,       "Median MAE across cycles.",                                                                       "median(mae over cycles)",                                               "per-cycle mae",                                  "−0.37%",                                      "Stage Summary; carried.",                                                            "Stage Summary"],
  [11, "Median AIR",      "Median AIR",                  "canon", "carried", null,       "Median AIR across cycles.",                                                                       "median(air over cycles)",                                               "per-cycle air",                                  "2.12",                                        "Stage Summary; carried.",                                                            "Stage Summary"],
  [12, "Median Return",   "Median Return",               "canon", "carried", null,       "Median cycle return across cycles.",                                                              "median(return over cycles)",                                            "per-cycle return",                               "+0.27%",                                      "Stage Summary; carried.",                                                            "Stage Summary"],
  [13, "Median Duration", "Median Duration",             "canon", "carried", null,       "Median cycle length across cycles.",                                                              "median(duration over cycles)",                                          "duration",                                       "8 candles",                                   "Stage Summary; carried.",                                                            "Stage Summary"],
  [42, "Median Time to MFE", "Median Time to MFE",       "canon", "carried", null,       "Median number of candles from entry to the max high, across cycles (timing of the favorable extreme).", "median( time_to_mfe over cycles )",              "per-cycle time_to_mfe (№6)",                     "median → 5 candles",                          "Stage Summary; carried. Paired median row in Before/After.",                         "Stage Summary / Before-After"],
  [43, "Median Time to MAE", "Median Time to MAE",       "canon", "carried", null,       "Median number of candles from entry to the min low, across cycles (timing of the adverse extreme).",  "median( time_to_mae over cycles )",              "per-cycle time_to_mae (№7)",                     "median → 3 candles",                          "Stage Summary; carried. Paired median row in Before/After.",                         "Stage Summary / Before-After"],
  [14, "Profit Factor",   "Profit Factor",               "canon", "paired",  "№40 PF net", "How many times profit covers loss (price-based).",                                              "sum(+ret) / abs(sum(−ret))",                                            "P_exit, P0",                                     "1807.5 / 340.5 = 5.31",                       "Stage Summary; paired with PF net.",                                                 "Before/After"],
  [15, "Profit Capture",  "Profit Capture",              "canon", "paired",  "№41 PC executed", "Share of the favorable move (MFE) actually captured.",                                    "median(return / mfe)",                                                  "P_exit, P0, max_high",                           "median → 0.31",                               "Stage Summary; paired with PC executed.",                                            "Before/After"],
  [16, "ROI",             "ROI (Analyzer)",              "canon", "paired",  "№32 ROI Total", "Epoch return in % of starting balance (1 unit, no costs).",                                 "(FinalBalance − Start) / Start × 100%",                                 "P_exit, P0, StartingBalance",                    "+1.467%",                                     "Stage Summary; paired with ROI Total (diff basis).",                                 "Before/After"],
  [17, "PnL (Gross)",     "Gross PnL",                   "canon", "paired",  "№28 Net PnL", "Money result before costs (1 unit of asset).",                                               "sum(P_exit − P0)",                                                      "P_exit, P0",                                     "+1467.0",                                     "Basis for ROI; paired with Net PnL (diff basis).",                                   "Before/After"],
  [18, "Maximum Drawdown","Max Drawdown",                "canon", "paired",  "№35/36",    "Max balance drop from prior peak along cycles.",                                                  "max((Peak − Balance) / Peak)",                                          "P_exit, P0, Start",                              "0.27%",                                       "Stage Summary; paired with tradable MaxDD (diff basis).",                            "Before/After"],
  [19, "Starting Balance","Starting Balance",            "canon", "carried", null,       "Initial balance the sequence builds from.",                                                        "StartingBalance = 100000",                                              "constant / input",                               "100000",                                      "Base for ROI and MaxDD; editable config in mini backtest.",                          "Configs"],
  [20, "Position sizing", "Position Sizing",             "oper",  "nopair",  null,       "Money put into a trade (before leverage).",                                                        "fixed: min(stake_amount, available); relative: available × stake_pct",  "stake_amount / stake_pct, tradable",             "min(5000,100000)=5000",                        "Feeds notional, gross, fees, funding.",                                               "engine"],
  [21, "Leverage & Notional", "Leverage & Notional",    "oper",  "nopair",  null,       "Leverage scales position; notional carries PnL/fees/funding — the leverage-risk side of the run.", "notional = stake × leverage",                                           "stake, leverage",                                "5000 × 10 = 50000",                           "Feeds gross, fees, funding, liquidation.",                                            "engine (futures)"],
  [22, "Slippage & fills","Slippage & Fills",            "oper",  "nopair",  null,       "Slippage worsens fills; executed return computed from fills — part of execution cost.",            "entry_fill = P0×(1+slip); exit_fill = P_exit×(1−slip); return = exit_fill/entry_fill − 1", "P0, P_exit, slippage", "+1.167% vs +1.268%",                    "Feeds gross, asset quantity.",                                                        "engine"],
  [23, "Asset quantity",  "Asset Quantity",              "oper",  "nopair",  null,       "Units of asset bought on notional at fill price.",                                                 "quantity = notional / entry_fill",                                      "notional, entry_fill",                           "5000/71043 = 0.0704",                         "Per-cycle column in Cycle Reports.",                                                  "Cycle Reports"],
  [24, "Gross PnL",       "Gross PnL (executed)",        "oper",  "nopair",  null,       "Dollar result before costs on real stake.",                                                        "gross = notional × return",                                             "notional, return",                               "5000 × 0.01268 = 63.40",                      "Basis for Net PnL.",                                                                  "Cycle Reports / Overview"],
  [25, "Trading fees",    "Trading Fees",                "oper",  "nopair",  null,       "Broker fee on entry and exit (on notional) — part of execution cost.",                            "entry_fee = notional×fee; exit_fee = (notional+gross)×fee",             "notional, gross, fee",                           "5.00 + 5.06 = 10.06",                         "Subtracted in Net PnL; summed to Trading fees.",                                      "Cycle Reports / Account Result"],
  [26, "Funding fee",     "Funding Fee",                 "oper",  "nopair",  null,       "Perp holding fee every 8h (signed) — a leverage/futures-only cost.",                              "periods = floor(duration×tf_h/8); funding = notional × rate × periods", "duration, tf_hours, notional, funding_rate",     "50000×0.0001×1 = 5.0",                        "Subtracted (signed) in Net PnL.",                                                     "Cycle Reports (futures)"],
  [27, "Liquidation",     "Liquidation",                 "oper",  "nopair",  null,       "Forced close when MAE breaches collateral — the whole stake is lost. A leverage/futures-only risk.", "liq if MAE ≤ −(1/leverage − maint_margin); net = −stake − entry_fee", "MAE, leverage, maint_margin, stake, entry_fee",  "−9.7% ≤ −9.5% → liq",                        "Flags cycle liquidated; counted in Liquidations.",                                    "Cycle Reports (futures)"],
  [28, "Net PnL",         "Net PnL",                     "oper",  "paired",  "№17 PnL",  "Real dollar result — gross minus all costs.",                                                    "net = gross − entry_fee − exit_fee − funding",                          "gross, fees, funding",                           "63.40 − 10.06 − 0 = 53.34",                  "Updates balance; feeds reserve; paired with analyzer PnL.",                           "Before/After / Cycle Reports"],
  [29, "Reserve from profit","Reserve from Profit",      "oper",  "nopair",  null,       "Part of each winning cycle profit locked into reserve.",                                           "win: reserve += net×pct, tradable += net−that; loss: tradable += net", "net, reserved_pct",                              "net 53.34 → reserve 5.33",                    "Splits net between tradable and reserve.",                                            "engine"],
  [30, "Balances + ruin", "Balances & Ruin",             "oper",  "nopair",  null,       "Three balances per cycle; ruin when tradable ≤ 0.",                                                "Total = Tradable + Reserved; ruin if Tradable ≤ 0",                     "net, reserved_pct",                              "Total 100027.70",                             "Balances card; run status.",                                                          "Overview / Cycle Reports"],
  [31, "Stopout",         "Stopout",                     "oper",  "nopair",  null,       "User stop threshold checked before each cycle.",                                                   "floor = amount or Start×pct; stop if tradable ≤ floor",                 "tradable, stopout config",                       "93000 ≤ 95000 → stop",                        "Halts the run; status Stopout.",                                                      "Overview / Cycle Reports"],
  [32, "ROI · Total",     "ROI (Total)",                 "oper",  "paired",  "№16 ROI",  "Mini backtest return — Total balance % of start.",                                               "(Total − Start) / Start × 100%",                                        "Total balance, Start",                           "+0.66%",                                      "Headline KPI; paired with analyzer ROI.",                                             "Overview / Before-After"],
  [33, "Tradable %",      "Tradable Balance %",          "oper",  "nopair",  null,       "Growth of the trading account (reserve excluded).",                                                "(Tradable − Start) / Start × 100%",                                     "Tradable balance, Start",                        "+0.40%",                                      "Balances card.",                                                                      "Overview / Before-After"],
  [34, "Reserved %",      "Reserved Balance %",          "oper",  "nopair",  null,       "Share of start banked into reserve.",                                                              "Reserved / Start × 100%",                                               "Reserved balance, Start",                        "+0.26%",                                      "Balances card.",                                                                      "Overview / Before-After"],
  [35, "Max DD close (tradable)","Max Drawdown (Close)", "oper",  "paired",  "№18 MaxDD","Max drawdown of tradable balance by closes.",                                                     "max((Peak − Tradable)/Peak)",                                           "tradable balance sequence",                      "0.80%",                                       "Overview / Before-After.",                                                            "Overview / Before-After"],
  [36, "Max DD intra (tradable)","Max Drawdown (Intra-cycle)","oper","paired","№18 MaxDD","Tradable-balance drawdown that counts the worst point inside the cycle (by MAE), not just the close — the honest intra-cycle drawdown.", "intra_low = tradable + notional×MAE − entry_fee; DD from prior peak", "MAE, notional, tradable, entry_fee", "0.235% at 10×", "Honest intra-cycle risk; headline Max DD in Overview.",                               "Overview / Before-After"],
  [37, "CAGR",            "CAGR",                        "oper",  "nopair",  null,       "Compound annual growth rate of capital.",                                                          "(Total/Start)^(1/years) − 1; years = days/365",                         "Total & tradable balance, Start, time range",    "+10%/yr",                                     "Overview KPI; Calmar numerator.",                                                     "Overview"],
  [38, "Calmar",          "Calmar",                      "oper",  "nopair",  null,       "Return per unit of risk.",                                                                         "CAGR_tradable / abs(MaxDD_intra)",                                      "CAGR tradable, MaxDD intra",                     "0.0724/0.09 = 0.80",                          "Overview KPI.",                                                                       "Overview"],
  [39, "Win Rate",        "Win Rate",                    "oper",  "paired",  "№8 Hit Rate","Share of cycles profitable by net PnL (after costs).",                                          "count(net > 0) / total_cycles",                                         "net per cycle",                                  "55%",                                         "Overview / Before-After; paired with Hit Rate.",                                      "Overview / Before-After"],
  [40, "Profit Factor net","Profit Factor (Net)",        "oper",  "paired",  "№14 Profit Factor","Profit ÷ loss on net PnL (after costs). Reserve not subtracted.",                       "sum(+net) / abs(sum(−net))",                                            "net per cycle",                                  "4200/2800 = 1.5",                             "Before/After; paired with analyzer PF.",                                              "Before/After"],
  [41, "Profit Capture executed","Profit Capture (Executed)","oper","paired","№15 Profit Capture","Share of MFE captured on executed (post-slippage) return.",                            "median(executed_return / mfe)",                                         "entry_fill, exit_fill, mfe",                     "median → 0.21",                               "Before/After; paired with analyzer Profit Capture.",                                  "Before/After"],
  ["FS","Final Score",    "Final Score",                 "canon", "nopair",  null,       "Aggregate quality score the analyzer ranks epochs by.",                                            "analyzer-internal scoring — not recomputed by the mini backtest",       "analyzer output",                                "—",                                           "Shown as epoch context in Before/After.",                                             "Before/After (context)"],
  ["SS","Stability Score","Stability Score",             "canon", "nopair",  null,       "Aggregate stability score the analyzer ranks epochs by.",                                          "analyzer-internal scoring — not recomputed by the mini backtest",       "analyzer output",                                "—",                                           "Shown as epoch context in Before/After.",                                             "Before/After (context)"],
];

const GROUP_DEFS = {
  paired:  { label: "🔁 Paired — before ↔ after",  badgeCls: "bg-violet-500/10 text-violet-300 border-violet-500/30" },
  carried: { label: "＝ Carried — unchanged",        badgeCls: "bg-teal-500/10 text-teal-300 border-teal-500/30"     },
  nopair:  { label: "— No-pair",                     badgeCls: "bg-amber-500/10 text-amber-300 border-amber-500/30"  },
};

function TypeBadge({ type }) {
  return type === "canon" ? (
    <span className="inline-flex items-center rounded-md px-1.5 py-px text-[9px] font-bold uppercase tracking-wider border bg-emerald-500/10 text-emerald-300 border-emerald-500/30">
      📘 Canonical
    </span>
  ) : (
    <span className="inline-flex items-center rounded-md px-1.5 py-px text-[9px] font-bold uppercase tracking-wider border bg-amber-500/10 text-amber-300 border-amber-500/30">
      🆕 Operational
    </span>
  );
}

function RelBadge({ rel }) {
  const s = GROUP_DEFS[rel];
  return (
    <span className={cx("inline-flex items-center rounded-md px-1.5 py-px text-[9px] font-bold uppercase tracking-wider border", s.badgeCls)}>
      {rel === "paired" ? "🔁 Paired" : rel === "carried" ? "＝ Carried" : "— No-pair"}
    </span>
  );
}

function FormulaCard({ f, defaultOpen, expandSignal }) {
  const [open, setOpen] = useState(defaultOpen);
  const ref = useRef(null);
  const lastRevRef = useRef(0);

  useEffect(() => {
    if (expandSignal.rev > lastRevRef.current) {
      lastRevRef.current = expandSignal.rev;
      setOpen(expandSignal.open);
    }
  }, [expandSignal]);

  return (
    <div
      ref={ref}
      id={`formula-card-${f[0]}`}
      className={cx(
        "rounded-xl border overflow-hidden transition-shadow",
        f[3] === "canon"
          ? "border-l-[3px] border-l-emerald-500/60 border-[rgba(60,40,80,0.35)] bg-[#120a20]"
          : "border-l-[3px] border-l-amber-500/50 border-[rgba(60,40,80,0.35)] bg-[#120a20]",
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex flex-wrap items-center gap-2 px-3 py-2.5 text-left hover:bg-[#1a1028]/60 transition-colors"
      >
        {typeof f[0] === "number" && (
          <span className="text-[10px] font-bold text-[#6b6b6b] shrink-0">№{f[0]}</span>
        )}
        <span className="text-[13px] font-semibold text-[#faf7fd]">{f[2]}</span>
        <TypeBadge type={f[3]} />
        <RelBadge rel={f[4]} />
        {f[5] && <span className="text-[9px] text-[#6b6b6b]">↔ {f[5]}</span>}
        <span className="ml-auto text-[10px] text-[#6b6b6b] shrink-0">{open ? "▾" : "▸"}</span>
      </button>

      {open && (
        <div className="px-3 pb-3 pt-0 border-t border-[rgba(60,40,80,0.25)] space-y-2">
          <div className="pt-2">
            <div className="text-[9px] font-bold uppercase tracking-wider text-[#6b6b6b] mb-1">What it is</div>
            <div className="text-[12px] text-[#b8aecc] leading-relaxed">{f[6]}</div>
          </div>
          <div>
            <div className="text-[9px] font-bold uppercase tracking-wider text-[#6b6b6b] mb-1">Formula</div>
            <div className="rounded-md border border-[rgba(60,40,80,0.35)] bg-[#0d0718] px-3 py-2 font-mono text-[11.5px] text-[#faf7fd] whitespace-pre-wrap leading-relaxed">
              {f[7]}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div>
              <div className="text-[9px] font-bold uppercase tracking-wider text-[#6b6b6b] mb-1">Computed from</div>
              <div className="text-[11px] text-[#8c8c8c]">{f[8]}</div>
            </div>
            <div>
              <div className="text-[9px] font-bold uppercase tracking-wider text-[#6b6b6b] mb-1">Example</div>
              <div className="text-[11px] font-mono text-[#d9d9d9]">{f[9]}</div>
            </div>
            <div>
              <div className="text-[9px] font-bold uppercase tracking-wider text-[#6b6b6b] mb-1">Why / where used</div>
              <div className="text-[11px] text-[#8c8c8c]">{f[10]} · {f[11]}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SectionHeader({ label, count }) {
  return (
    <div className="flex items-center gap-3 mt-5 mb-2">
      <span className="text-[12px] font-bold text-[#d9d9d9]">{label}</span>
      <span className="rounded-full bg-[#1a1028] border border-[rgba(60,40,80,0.45)] px-2 py-px text-[9px] text-[#8c8c8c]">
        {count}
      </span>
      <div className="flex-1 h-px bg-[rgba(60,40,80,0.35)]" />
    </div>
  );
}

export const MiniBacktestFormulaReference = memo(function MiniBacktestFormulaReference({ targetId }) {
  const [filter, setFilter] = useState("all");
  const [expandSignal, setExpandSignal] = useState({ rev: 0, open: false });
  const didScrollRef = useRef(null);

  useEffect(() => {
    if (targetId == null || targetId === didScrollRef.current) return;
    didScrollRef.current = targetId;
    const el = document.getElementById(`formula-card-${targetId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.style.boxShadow = "0 0 0 2px rgba(139,92,246,0.7)";
      setTimeout(() => { el.style.boxShadow = ""; }, 1800);
    }
  }, [targetId]);

  const filters = [
    { id: "all", label: "All" },
    { id: "paired", label: "🔁 Paired" },
    { id: "carried", label: "＝ Carried" },
    { id: "nopair", label: "— No-pair" },
  ];

  const grouped = { paired: [], carried: [], nopair: [] };
  for (const f of FORMULA_REF) {
    if (filter !== "all" && f[4] !== filter) continue;
    grouped[f[4]].push(f);
  }

  return (
    <div className="space-y-2">
      <div>
        <h2 className="text-[15px] font-semibold text-[#faf7fd] mb-1">Formula Reference</h2>
        <p className="text-[11px] text-[#8c8c8c]">
          Static reference for every metric and formula of the mini backtest.
        </p>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2 py-2">
        <span className="inline-flex items-center rounded-md px-1.5 py-px text-[9px] font-bold uppercase tracking-wider border bg-emerald-500/10 text-emerald-300 border-emerald-500/30">
          📘 Canonical — from the official Appendix (what the analyzer computes today)
        </span>
        <span className="inline-flex items-center rounded-md px-1.5 py-px text-[9px] font-bold uppercase tracking-wider border bg-amber-500/10 text-amber-300 border-amber-500/30">
          🆕 Operational — added for the mini backtest
        </span>
      </div>

      <div className="rounded-lg border border-[rgba(60,40,80,0.25)] bg-[#1a1028]/40 px-3 py-2 text-[10.5px] text-[#8c8c8c] leading-relaxed">
        Risk shown here in plain terms:{" "}
        <strong className="text-[#d9d9d9]">intra-cycle drawdown</strong> — the worst equity point inside a cycle (by MAE), the honest Max DD ·{" "}
        <strong className="text-[#d9d9d9]">execution cost</strong> — slippage + maker/taker fees ·{" "}
        <strong className="text-[#d9d9d9]">leverage risk</strong> — liquidation + funding on futures.
      </div>

      {/* Filters + expand/collapse */}
      <div className="flex flex-wrap gap-2 items-center">
        {filters.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={cx(
              "px-3 py-1.5 rounded-lg border text-[11px] font-semibold transition-colors",
              filter === f.id
                ? "bg-violet-500/15 border-violet-500/40 text-violet-200"
                : "border-[rgba(60,40,80,0.35)] bg-[#1a1028] text-[#8c8c8c] hover:text-[#d9d9d9]",
            )}
          >
            {f.label}
          </button>
        ))}
        <div className="flex-1" />
        <button
          type="button"
          onClick={() => setExpandSignal((s) => ({ rev: s.rev + 1, open: true }))}
          className="px-3 py-1.5 rounded-lg border border-[rgba(60,40,80,0.35)] bg-[#1a1028] text-[11px] text-[#8c8c8c] hover:text-[#d9d9d9]"
        >
          ▾ Expand all
        </button>
        <button
          type="button"
          onClick={() => setExpandSignal((s) => ({ rev: s.rev + 1, open: false }))}
          className="px-3 py-1.5 rounded-lg border border-[rgba(60,40,80,0.35)] bg-[#1a1028] text-[11px] text-[#8c8c8c] hover:text-[#d9d9d9]"
        >
          ▸ Collapse all
        </button>
      </div>

      {/* Cards grouped */}
      {["paired", "carried", "nopair"].map((grp) => {
        const items = grouped[grp];
        if (!items.length) return null;
        return (
          <div key={grp}>
            <SectionHeader label={GROUP_DEFS[grp].label} count={items.length} />
            <div className="space-y-2">
              {items.map((f) => (
                <FormulaCard
                  key={f[0]}
                  f={f}
                  defaultOpen={grp === "paired" || f[0] === targetId}
                  expandSignal={expandSignal}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
});

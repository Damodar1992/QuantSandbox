import React, { memo, useMemo, useState } from "react";
import { Download } from "lucide-react";
import { cx, ui } from "@/constants/ui";
import { AppButton } from "@/components/common/AppButton";
import { AppInput } from "@/components/common/AppInput";
import { BT_TRADES_TOOLTIPS } from "@/constants/backtesting";
import {
  BT_MUTED,
  BT_NEGATIVE,
  BT_NEUTRAL,
  BT_POSITIVE,
} from "../utils/format";
import { buildTradesSummary, tradesToCsv } from "../utils/tradesSummary";
import { BtHeaderWithHelp } from "./BtInfoTooltip";

const TH =
  "px-3 py-2 text-left text-[10px] font-medium uppercase tracking-wide border-b border-[rgba(60,40,80,0.35)] text-[#8c8c8c] whitespace-nowrap";
const TD = "px-3 py-2 align-middle text-[11px] font-mono tabular-nums whitespace-nowrap";

function TipHeader({ tipKey, children }) {
  const tip = BT_TRADES_TOOLTIPS[tipKey];
  if (!tip) return children;
  return (
    <BtHeaderWithHelp label={String(children)} tip={tip}>
      <span className="border-b border-dotted border-[#8c8c8c]/60">{children}</span>
    </BtHeaderWithHelp>
  );
}

function fmtNum(value, decimals = 2) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function signedTone(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n === 0) return BT_NEUTRAL;
  return n > 0 ? BT_POSITIVE : BT_NEGATIVE;
}

function downloadCsv(filename, content) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export const TradesSummaryTab = memo(function TradesSummaryTab({ run }) {
  const summary = useMemo(() => {
    const raw =
      run?.result?.tradesList ||
      (run?.result?.core ? buildTradesSummary(run) : null);
    if (!raw?.trades?.length) return null;
    return {
      ...raw,
      trades: raw.trades.filter((t) => t.direction !== "Short"),
    };
  }, [run]);

  const [filter, setFilter] = useState("");

  const filtered = useMemo(() => {
    const trades = summary?.trades || [];
    const q = filter.trim().toLowerCase();
    if (!q) return trades;
    return trades.filter((t) => {
      const hay = `${t.pair} ${t.direction} ${t.exitReason}`.toLowerCase();
      return hay.includes(q);
    });
  }, [summary, filter]);

  if (!summary?.trades?.length) {
    return (
      <div className={cx(ui.radius, ui.panelMuted, "px-4 py-10 text-center text-[12px]", ui.textSubtle)}>
        No trades for this run.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-[#d9d9d9]">
          Single trades
        </div>
        {summary.subtitle ? (
          <div className={cx("mb-3 text-[10px] leading-snug", ui.textSubtle)}>{summary.subtitle}</div>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="min-w-[220px] flex-1">
          <AppInput
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter by pair, direction or exit reason..."
            className="h-8 text-[12px]"
          />
        </div>
        <span className={cx("text-[11px]", BT_MUTED)}>
          {filtered.length} of {summary.trades.length} trades
        </span>
        <AppButton
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            downloadCsv(`backtest-trades-${run?.id || "run"}.csv`, tradesToCsv(filtered))
          }
        >
          <Download className="mr-1.5 h-3.5 w-3.5" />
          Export CSV
        </AppButton>
      </div>

      <div className="overflow-x-auto rounded-lg border border-[rgba(60,40,80,0.35)]">
        <table className="w-full border-collapse">
          <thead className="bg-[#19102b]">
            <tr>
              <th className={TH}>Direction</th>
              <th className={TH}>Pair</th>
              <th className={TH}>Amount</th>
              <th className={TH}>
                <TipHeader tipKey="stakeAmount">Stake amount</TipHeader>
              </th>
              <th className={TH}>Open rate</th>
              <th className={TH}>Close rate</th>
              <th className={TH}>
                <TipHeader tipKey="stopLoss">Stop loss</TipHeader>
              </th>
              <th className={TH}>
                <TipHeader tipKey="liqPrice">Liq. price</TipHeader>
              </th>
              <th className={TH}>
                <TipHeader tipKey="netPlPct">Net P/L, %</TipHeader>
              </th>
              <th className={TH}>
                <TipHeader tipKey="netPlUsdt">Net P/L, USDT</TipHeader>
              </th>
              <th className={TH}>
                <TipHeader tipKey="reserved">Reserved</TipHeader>
              </th>
              <th className={TH}>Open date</th>
              <th className={TH}>Close date</th>
              <th className={TH}>Exit reason</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((t) => (
              <tr
                key={t.id}
                className="border-b border-[rgba(60,40,80,0.22)] last:border-b-0 hover:bg-[#1a1430]/40"
              >
                <td
                  className={cx(
                    TD,
                    "font-sans",
                    t.direction === "Short" ? "text-red-300" : "text-sky-300",
                  )}
                >
                  {t.direction}
                </td>
                <td className={cx(TD, "text-[#d9d9d9]")}>{t.pair}</td>
                <td className={TD}>{fmtNum(t.amount, 3)}</td>
                <td className={TD}>
                  {fmtNum(t.stakeAmount, 2)} ({t.leverage}x)
                </td>
                <td className={TD}>{fmtNum(t.openRate, 2)}</td>
                <td className={TD}>{fmtNum(t.closeRate, 2)}</td>
                <td className={TD}>{fmtNum(t.stopLoss, 2)}</td>
                <td className={TD}>{fmtNum(t.liqPrice, 2)}</td>
                <td className={cx(TD, signedTone(t.netPlPct))}>{fmtNum(t.netPlPct, 2)}%</td>
                <td className={cx(TD, signedTone(t.netPlUsdt))}>{fmtNum(t.netPlUsdt, 2)} USDT</td>
                <td className={TD}>{fmtNum(t.reserved, 4)}</td>
                <td className={cx(TD, "text-[#b8aecc]")}>{t.openDate}</td>
                <td className={cx(TD, "text-[#b8aecc]")}>{t.closeDate}</td>
                <td className={cx(TD, "font-sans text-[#d9d9d9]")}>{t.exitReason}</td>
              </tr>
            ))}
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={14} className={cx(TD, "py-6 text-center font-sans", ui.textSubtle)}>
                  No trades match this filter.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
});

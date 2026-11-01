import React, { useEffect, useRef, useState } from "react";
import { Locate } from "lucide-react";
import { AppBadge } from "@/components/common/AppBadge";
import { AppButton } from "@/components/common/AppButton";
import { EyeIcon } from "@/components/common/Icons";
import { cx } from "@/constants/ui";
import { money, percent, pnlTone } from "./botsDisplay";
import { utcDate } from "./botsAnalytics";
import { BotTradeDetails } from "./BotTradeDetails";

export function BotChartTrades({ trades, strategy, selectedId, onSelect, onFocus }) {
  const [selectedTrade, setSelectedTrade] = useState(null);
  const viewport = useRef(null);
  const rows = useRef(new Map());
  useEffect(() => {
    const row = rows.current.get(selectedId);
    const container = viewport.current;
    if (!row || !container) return;
    const bounds = row.getBoundingClientRect();
    const frame = container.getBoundingClientRect();
    // Scroll only the table, keeping the chart in place when selecting a marker.
    if (bounds.top < frame.top + 40) container.scrollTop += bounds.top - frame.top - 40;
    else if (bounds.bottom > frame.bottom) container.scrollTop += bounds.bottom - frame.bottom;
  }, [selectedId]);

  return (
    <section className="pt-2" aria-label="Trades in view">
      <div ref={viewport} className="relative isolate max-h-52 overflow-auto overscroll-contain rounded-md border border-border">
        <table className="w-full min-w-[800px] border-collapse text-[12px]">
          <thead className="sticky top-0 z-10 bg-background text-muted-foreground">
            <tr>
              {["Trade", "Status", "Entry", "Exit", "P&L · USDT"].map((label) => (
                <th key={label} className={cx("border-b border-border px-3 py-2.5 text-left font-medium", label === "P&L · USDT" && "text-right")}>{label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {trades.map((trade) => {
              const selected = trade.id === selectedId;
              const closed = Boolean(trade.closedAt);
              const pnl = closed ? trade.pnl : trade.unrealizedPnl;
              return (
                <tr
                  key={trade.id}
                  ref={(node) => { if (node) rows.current.set(trade.id, node); else rows.current.delete(trade.id); }}
                  data-selected={selected}
                  onClick={() => onSelect(trade)}
                  className={cx("cursor-pointer border-b border-border transition-colors last:border-0 hover:bg-violet-500/10", selected && "bg-violet-500/15")}
                >
                  <td className={cx("border-l-2 px-3 py-2.5", selected ? "border-l-violet-400" : "border-l-transparent")}>
                    <div className="flex items-start gap-2">
                      <div className="flex shrink-0 gap-1">
                        <AppButton
                          size="icon"
                          className="h-8 w-8"
                          aria-label={`Focus trade ${trade.id}`}
                          onClick={(e) => { e.stopPropagation(); onFocus(trade); }}
                        >
                          <Locate className="size-3.5" />
                        </AppButton>
                        <AppButton
                          size="icon"
                          className="h-8 w-8"
                          aria-label={`${closed ? "Closed" : "Open"} trade ${trade.id} details`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelect(trade);
                            setSelectedTrade(trade);
                          }}
                        >
                          <EyeIcon />
                        </AppButton>
                      </div>
                      <div>
                        <AppButton variant="link" className="h-auto p-0 text-violet-200" aria-pressed={selected} aria-label={`Select trade ${trade.id}`}>{trade.id}</AppButton>
                        <div className="mt-0.5 text-[10px] text-muted-foreground">{trade.direction || "—"}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2.5"><AppBadge variant={closed ? "muted" : "completed"}>{closed ? "Closed" : "Open"}</AppBadge></td>
                  <td className="whitespace-nowrap px-3 py-2.5 tabular-nums">{money(trade.entryPrice)}<div className="mt-0.5 text-[10px] text-muted-foreground">{utcDate(trade.openedAt)}</div></td>
                  <td className="whitespace-nowrap px-3 py-2.5 tabular-nums">{closed ? money(trade.exitPrice) : "—"}<div className="mt-0.5 text-[10px] text-muted-foreground">{closed ? utcDate(trade.closedAt) : "Still open"}</div></td>
                  <td className={cx("whitespace-nowrap px-3 py-2.5 text-right tabular-nums", pnlTone(pnl))}>{money(pnl, true)}<div className="mt-0.5 text-[10px]">{percent(trade.returnPct, true)}{!closed ? " · Unrealized" : ""}</div></td>
                </tr>
              );
            })}
            {!trades.length ? (
              <tr>
                <td colSpan={5} className="p-5 text-center text-muted-foreground">No trades overlap this range.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      <BotTradeDetails
        trade={selectedTrade}
        strategy={strategy}
        onClose={() => setSelectedTrade(null)}
        onViewChart={onFocus}
      />
    </section>
  );
}

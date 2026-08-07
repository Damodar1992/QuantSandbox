import React, { memo } from "react";
import { cx, ui } from "@/constants/ui";

/**
 * Read-only snapshot of the parent backtest. There is no source selector:
 * the parent row *is* the source.
 */
export const InheritedChips = memo(function InheritedChips({ title, subtitle, chips = [] }) {
  return (
    <section className="space-y-2">
      <div className="text-[12px] font-medium text-[#faf7fd]">
        {title} <span className={cx("font-normal", ui.textSubtle)}>— read only</span>
      </div>
      {subtitle ? <div className={cx("text-[10px]", ui.textSubtle)}>{subtitle}</div> : null}
      <div className={cx(ui.radius, ui.panelMuted, "grid gap-2 p-3 sm:grid-cols-3 xl:grid-cols-4")}>
        {chips.map((chip) => (
          <div
            key={chip.label}
            className="rounded-md border border-[rgba(60,40,80,0.35)] bg-[#0f0a1b] px-2 py-1.5"
          >
            <div className="text-[9px] uppercase tracking-wide text-[#6e6682]">{chip.label}</div>
            <div className="font-mono text-[11px] tabular-nums text-[#faf7fd]">{chip.value}</div>
          </div>
        ))}
      </div>
    </section>
  );
});

const DASH = "—";
const show = (v, suffix = "") =>
  v === null || v === undefined || v === "" ? DASH : `${v}${suffix}`;

/** Chip list for the Shuffler modal (§5.2, section 1). */
export function shufflerInheritedChips(inherited = {}) {
  return [
    { label: "Starting balance", value: show(inherited.startingCapital, " USDT") },
    {
      label: inherited.stakeMode === "relative" ? "Stake, % of balance" : "Stake, USDT",
      value: show(inherited.stakeValue),
    },
    { label: "Profit Reserving", value: inherited.profitReserving ? `${inherited.profitReserving}%` : "off" },
    { label: "Trading mode", value: show(inherited.mode) },
    { label: "Leverage", value: show(inherited.leverage) },
    { label: "Fee maker", value: show(inherited.feeMaker, "%") },
    { label: "Fee taker", value: show(inherited.feeTaker, "%") },
    { label: "Slippage", value: show(inherited.slippage, "%") },
    { label: "Funding", value: inherited.funding ? "on" : "off" },
    { label: "Stop-out", value: inherited.stopOut ? "yes" : "no" },
    { label: "Trades", value: show(inherited.trades) },
    { label: "Winning trades", value: show(inherited.wins) },
    { label: "Losing trades", value: show(inherited.losses) },
    {
      label: "Period",
      value:
        inherited.periodFrom || inherited.periodTo
          ? `${inherited.periodFrom || "?"} → ${inherited.periodTo || "?"}`
          : DASH,
    },
  ];
}

/** Chip list for the Synthetic modal (§5.3, section 2). */
export function syntheticInheritedChips(inherited = {}) {
  return [
    { label: "Exchange", value: show(inherited.exchange) },
    { label: "Mode", value: show(inherited.mode) },
    { label: "Leverage", value: show(inherited.leverage) },
    { label: "Starting capital", value: show(inherited.startingCapital, " USDT") },
    {
      label: inherited.stakeMode === "relative" ? "Stake relative, %" : "Stake amount, USDT",
      value: show(inherited.stakeValue),
    },
    { label: "Profit Reserving", value: inherited.profitReserving ? `${inherited.profitReserving}%` : "off" },
  ];
}

import React, { useMemo, useState } from "react";
import { Bar, CartesianGrid, Cell, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AppButton } from "@/components/common/AppButton";
import { ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cx, ui } from "@/constants/ui";
import { amount, money, percent, pnlTone } from "./botsDisplay";
import { periodBreakdown } from "./botsAnalytics";

const GREEN = "#34d399";
const RED = "#f87171";
const PURPLE = "#a78bfa";

function PeriodTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return <div className="rounded-lg border border-border bg-background p-3 text-[12px] shadow-xl"><div className="mb-2 font-medium">{row.label} · UTC</div><div className={pnlTone(row.pnl)}>Realized P&L: {amount(row.pnl, true)}</div><div>Return on initial capital: {percent(row.returnPct, true)}</div><div className="mt-1 text-muted-foreground">Closed trades: {row.trades}</div></div>;
}

export function BotPerformance({ bot }) {
  const [period, setPeriod] = useState("days");
  const [open, setOpen] = useState(false);
  const rows = useMemo(() => periodBreakdown(bot, period), [bot, period]);
  return <Collapsible open={open} onOpenChange={setOpen} className={cx(ui.radius, ui.panel, "overflow-hidden")}>
      <CollapsibleTrigger asChild><AppButton variant="ghost" className="group h-auto w-full justify-between rounded-none px-4 py-3"><span className="text-sm font-medium">Period breakdown</span><ChevronDown className="size-3.5 transition-transform group-data-[state=open]:rotate-180" /></AppButton></CollapsibleTrigger>
      <CollapsibleContent className="border-t border-border px-4 pb-4">
      <div className="flex flex-wrap items-start justify-between gap-4 pt-4"><p className="max-w-2xl text-[11px] text-muted-foreground">Fully closed trades only. The entire trade result is assigned to its final closing date.</p><div className="flex gap-1" role="group" aria-label="Period aggregation">{["days", "weeks", "months"].map((value) => <AppButton key={value} variant={period === value ? "default" : "outline"} aria-pressed={period === value} onClick={() => setPeriod(value)}>{value[0].toUpperCase() + value.slice(1)}</AppButton>)}</div></div>
      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-[11px] text-muted-foreground"><span><span className="mr-1.5 inline-block h-2 w-2 rounded-sm bg-emerald-400" />Realized P&L · USDT</span><span><span className="mr-1.5 inline-block h-0.5 w-4 align-middle bg-violet-400" />Closed trades</span><span className="ml-auto">UTC · Weeks start Monday</span></div>
      {rows.length ? <div className="mt-4 h-56" aria-label="Realized profit and closed trade count by period">
        <ResponsiveContainer width="100%" height="100%"><ComposedChart data={rows} margin={{ top: 12, right: 6, left: 4, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="rgba(184,174,204,.12)" />
          <XAxis dataKey="label" tick={{ fill: "#b8aecc", fontSize: 10 }} minTickGap={25} axisLine={false} tickLine={false} />
          <YAxis yAxisId="pnl" tick={{ fill: "#b8aecc", fontSize: 10 }} tickFormatter={(n) => money(n)} axisLine={false} tickLine={false} width={64} />
          <YAxis yAxisId="trades" orientation="right" allowDecimals={false} domain={[0, "auto"]} tick={{ fill: PURPLE, fontSize: 10 }} axisLine={false} tickLine={false} width={35} />
          <Tooltip content={<PeriodTooltip />} cursor={{ fill: "rgba(167,139,250,.06)" }} />
          <Bar yAxisId="pnl" dataKey="pnl" maxBarSize={42} radius={[3, 3, 0, 0]} isAnimationActive={false}>{rows.map((row) => <Cell key={row.at} fill={Number(row.pnl) < 0 ? RED : GREEN} fillOpacity={0.7} />)}</Bar>
          <Line yAxisId="trades" type="linear" dataKey="trades" stroke={PURPLE} strokeWidth={2} dot={{ r: 3, fill: PURPLE }} isAnimationActive={false} />
        </ComposedChart></ResponsiveContainer>
      </div> : <div className="flex h-52 items-center justify-center text-[12px] text-muted-foreground">No closed trades yet. Period results appear after a trade fully closes.</div>}
      <Collapsible className="mt-3 border-t border-border pt-2">
        <CollapsibleTrigger asChild><AppButton variant="ghost" className="group w-full justify-between"><span>Period details</span><ChevronDown className="size-3.5 transition-transform group-data-[state=open]:rotate-180" /></AppButton></CollapsibleTrigger>
        <CollapsibleContent>
      <div className="mt-3 overflow-auto"><table className="w-full min-w-[620px] text-[12px]"><thead className="border-y border-border bg-secondary/40 text-muted-foreground"><tr>{["Period · UTC", "Realized P&L · USDT", "Return on initial capital · %", "Closed trades"].map((label, i) => <th key={label} className={cx("px-3 py-2.5 font-medium", i ? "text-right" : "text-left")}>{label}</th>)}</tr></thead><tbody>{[...rows].reverse().map((row) => <tr key={row.at} className="border-b border-border"><td className="px-3 py-3">{row.label}</td><td className={cx("px-3 py-3 text-right tabular-nums", pnlTone(row.pnl))}>{money(row.pnl, true)}</td><td className={cx("px-3 py-3 text-right tabular-nums", pnlTone(row.returnPct))}>{percent(row.returnPct, true)}</td><td className="px-3 py-3 text-right tabular-nums">{row.trades}</td></tr>)}{!rows.length ? <tr><td colSpan={4} className="p-5 text-center text-muted-foreground">No period results.</td></tr> : null}</tbody></table></div>
      <p className="mt-3 text-[11px] text-muted-foreground">Return = period P&L ÷ initial bot capital ({amount(bot.capital)}). Open positions and unrealized P&L are excluded.</p>
        </CollapsibleContent>
      </Collapsible>
      </CollapsibleContent>
  </Collapsible>;
}

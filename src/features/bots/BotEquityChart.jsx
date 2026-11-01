import React from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { amount, date, hasNumber, money } from "./botsDisplay";

export function BotEquityChart({ bot, expanded = false }) {
  const samples = (bot.equityHistory || [])
    .filter((point) => hasNumber(point.value) && Number.isFinite(Date.parse(point.at)))
    .map((point) => ({ at: Date.parse(point.at), value: Number(point.value) }))
    .sort((a, b) => a.at - b.at);
  const span = samples.length > 1 ? samples.at(-1).at - samples[0].at : 0;
  const tick = (value) => new Date(value).toLocaleString("en-GB", {
    timeZone: "UTC", day: "2-digit", month: "short",
    ...(span < 48 * 3600000 ? { hour: "2-digit", minute: "2-digit", hour12: false } : {}),
  });
  return <div className={expanded ? "h-[52vh] min-h-72" : "h-80"} aria-label="Bot equity history">
    {samples.length > 1 ? <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={samples} margin={{ top: 12, left: 10, right: 16, bottom: 0 }}>
        <CartesianGrid stroke="rgba(184,174,204,.12)" vertical={false} />
        <XAxis dataKey="at" type="number" domain={["dataMin", "dataMax"]} tickCount={5} minTickGap={40} tick={{ fill: "#b8aecc", fontSize: 10 }} tickFormatter={tick} axisLine={false} tickLine={false} />
        <YAxis domain={["auto", "auto"]} width={80} tick={{ fill: "#b8aecc", fontSize: 10 }} tickFormatter={(value) => money(value)} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={{ background: "#170f29", border: "1px solid rgba(184,174,204,.2)", borderRadius: 8, fontSize: 11 }} labelFormatter={(value) => date(Number(value))} formatter={(value) => [amount(value), "Equity"]} />
        <Area type="linear" dataKey="value" stroke="#a78bfa" fill="rgba(167,139,250,.14)" strokeWidth={2} dot={false} activeDot={{ r: 4 }} isAnimationActive={false} />
      </AreaChart>
    </ResponsiveContainer> : <div className="flex h-full items-center justify-center rounded-md border border-dashed border-border text-[12px] text-muted-foreground">Equity history unavailable · no historical samples</div>}
  </div>;
}

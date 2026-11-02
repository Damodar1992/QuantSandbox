import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Bar, BarChart, Brush, CartesianGrid, ComposedChart, ReferenceArea, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChevronDown, Maximize2 } from "lucide-react";
import { AppButton } from "@/components/common/AppButton";
import { AppDialog } from "@/components/common/AppDialog";
import { AppSelect } from "@/components/common/AppSelect";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cx, ui } from "@/constants/ui";
import { money } from "./botsDisplay";
import { demoCandles, shortDate, tradesInWindow, utcDate } from "./botsAnalytics";
import { BotChartTrades } from "./BotChartTrades";
import { BotEquityChart } from "./BotEquityChart";

const GREEN = "#34d399";
const RED = "#f87171";
const BLUE = "#60a5fa";
const PURPLE = "#c4b5fd";
const AMBER = "#fbbf24";

function Candle({ x, y, width, height, payload, signals, executions, selectedId, onSelect }) {
  if (!payload || !Number.isFinite(x) || !Number.isFinite(y)) return null;
  const center = x + width / 2;
  const scale = (price) => y + height * (payload.high - price) / (payload.high - payload.low || 1);
  const bodyTop = scale(Math.max(payload.open, payload.close));
  const bodyBottom = scale(Math.min(payload.open, payload.close));
  const color = payload.close >= payload.open ? GREEN : RED;
  return <g>
    <line x1={center} x2={center} y1={y} y2={y + height} stroke={color} strokeWidth={1} />
    <rect x={x} y={bodyTop} width={Math.max(width, 1)} height={Math.max(bodyBottom - bodyTop, 1.5)} fill={color} rx={0.5} />
    {signals && payload.signal === "Entry" ? <path d={`M ${center} ${y + height + 3} l -5 8 h 10 z`} fill={GREEN} /> : null}
    {signals && payload.signal === "Exit" ? <path d={`M ${center} ${y - 12} l 5 5 l -5 5 l -5 -5 z`} fill={AMBER} /> : null}
    {executions ? payload.executions.map((event, i) => <g key={event.id} role="button" tabIndex={0} aria-label={`${event.kind} ${event.trade.id}`} aria-pressed={selectedId === event.trade.id} opacity={selectedId && selectedId !== event.trade.id ? 0.22 : 1} onClick={(e) => { e.stopPropagation(); onSelect(event.trade); }} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(event.trade); } }} style={{ cursor: "pointer" }}>
      <circle cx={center + (i % 2 ? 5 : -3)} cy={scale(event.price)} r={selectedId === event.trade.id ? 8 : 5} fill={event.kind === "Entry" ? BLUE : PURPLE} stroke={selectedId === event.trade.id ? "#fff" : "#170f29"} strokeWidth={selectedId === event.trade.id ? 2 : 1.5} />
      <title>{event.kind} · {event.trade.id} · {money(event.price)}</title>
    </g>) : null}
  </g>;
}

function CandleTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return <div className="min-w-44 rounded-lg border border-border bg-background p-3 text-[11px] shadow-xl"><div className="mb-2 font-medium">{utcDate(p.at)} UTC</div><dl className="grid grid-cols-2 gap-x-5 gap-y-1">{[["Open", p.open], ["High", p.high], ["Low", p.low], ["Close", p.close], ["Volume", p.volume]].map(([label, value]) => <React.Fragment key={label}><dt className="text-muted-foreground">{label}</dt><dd className="text-right tabular-nums">{money(value)}</dd></React.Fragment>)}</dl>{p.executions.map((e) => <div key={e.id} className="mt-2 border-t border-border pt-2"><span style={{ color: e.kind === "Entry" ? BLUE : PURPLE }}>{e.kind} · {e.trade.id}</span><div>{money(e.price)} · {utcDate(e.at)} UTC</div></div>)}</div>;
}

export function BotChart({ bot, strategy, focusTrade }) {
  const candles = useMemo(() => demoCandles(bot, strategy), [bot, strategy]);
  const [range, setRange] = useState("all");
  const [window, setWindow] = useState(null);
  const [signals, setSignals] = useState(false);
  const [executions, setExecutions] = useState(true);
  const [volume, setVolume] = useState(true);
  const [fullScreen, setFullScreen] = useState(false);
  const [highlight, setHighlight] = useState(null);
  const [view, setView] = useState("Market");
  const [tradesOpen, setTradesOpen] = useState(false);
  const chartFrame = useRef(null);

  const resetRange = (value) => {
    setRange(value);
    setHighlight(null);
    const hours = value === "48h" ? 48 : value === "7d" ? 168 : Infinity;
    const start = candles.findIndex((c) => c.at >= candles.at(-1)?.at - hours * 3600000);
    setWindow({ startIndex: Math.max(0, start), endIndex: candles.length - 1 });
  };
  const focus = useCallback((trade) => {
    if (!trade || !candles.length) return;
    const start = candles.findIndex((c) => c.at >= Date.parse(trade.openedAt));
    const end = trade.closedAt ? candles.findIndex((c) => c.at >= Date.parse(trade.closedAt)) : candles.length - 1;
    setWindow({ startIndex: Math.max(0, start - 8), endIndex: Math.min(candles.length - 1, Math.max(start, end < 0 ? candles.length - 1 : end) + 8) });
    setExecutions(true);
    setHighlight(trade);
    setRange("trade");
    setView("Market");
    setTradesOpen(true);
    requestAnimationFrame(() => chartFrame.current?.scrollIntoView({ block: "start", behavior: "smooth" }));
  }, [candles]);
  useEffect(() => { if (focusTrade) focus(focusTrade); }, [focusTrade, focus]);
  const select = (trade) => {
    setHighlight(trade);
    setExecutions(true);
    setTradesOpen(true);
    requestAnimationFrame(() => chartFrame.current?.scrollIntoView({ block: "start", behavior: "smooth" }));
  };
  const clearSelection = () => { setHighlight(null); if (range === "trade") setRange("custom"); };

  const startIndex = window?.startIndex ?? 0;
  const endIndex = window?.endIndex ?? candles.length - 1;
  const visible = candles.slice(startIndex, endIndex + 1);
  const tickLabel = (at) => visible.at(-1)?.at - visible[0]?.at < 48 * 3600000
    ? new Date(at).toLocaleString("en-GB", { timeZone: "UTC", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : shortDate(at);
  const step = candles.length > 1 ? candles[1].at - candles[0].at : 3600000;
  const visibleTrades = tradesInWindow(bot, visible[0]?.at ?? 0, (visible.at(-1)?.at ?? 0) + step);
  let selectedSegment = null;
  let tradeBand = null;
  if (highlight && candles.length) {
    const entryIndex = Math.floor((Date.parse(highlight.openedAt) - candles[0].at) / step);
    const exitIndex = highlight.closedAt
      ? Math.floor((Date.parse(highlight.closedAt) - candles[0].at) / step)
      : endIndex;
    const from = Math.max(entryIndex, startIndex);
    const to = Math.min(exitIndex < 0 ? endIndex : exitIndex, endIndex);
    const pnl = Number(highlight.closedAt ? highlight.pnl : highlight.unrealizedPnl);
    const tone = pnl > 0 ? GREEN : pnl < 0 ? RED : PURPLE;
    if (from <= to) {
      tradeBand = { x1: candles[from].at, x2: candles[Math.min(to + (from === to ? 1 : 0), candles.length - 1)].at, fill: tone };
      if (highlight.closedAt) {
        const price = (index) => Number(highlight.entryPrice) + (Number(highlight.exitPrice) - Number(highlight.entryPrice)) * (index - entryIndex) / (exitIndex - entryIndex || 1);
        selectedSegment = [{ x: candles[from].at, y: price(from) }, { x: candles[to].at, y: exitIndex === entryIndex ? Number(highlight.exitPrice) : price(to) }];
      }
    }
  }
  const control = (id, label, checked, onChange, color) => <label htmlFor={id} className="flex cursor-pointer items-center gap-2 text-[11px] text-muted-foreground"><Checkbox id={id} checked={checked} onCheckedChange={(value) => onChange(value === true)} /><span className="h-2 w-2 rounded-sm" style={{ background: color }} />{label}</label>;
  const content = <div className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex gap-1" role="group" aria-label="Chart view">{["Market", "Equity"].map((item) => <AppButton key={item} variant={view === item ? "default" : "outline"} aria-pressed={view === item} onClick={() => setView(item)}>{item}</AppButton>)}</div>
        <div><h3 className="text-[12px] font-medium">{view === "Market" ? strategy.params.pair : "Equity history · USDT"}</h3><p className="mt-0.5 text-[10px] text-muted-foreground">{view === "Market" ? `${strategy.params.timeframe} candles · Demo market data` : "Sampled bot equity"} · UTC</p></div>
      </div>
      <div className="flex items-center gap-2">
        {view === "Market" ? <AppSelect aria-label="Chart range" value={range} onValueChange={resetRange} className="w-36" options={[{ value: "48h", label: "Last 48 hours" }, { value: "7d", label: "Last 7 days" }, { value: "all", label: "All history" }, ...(range === "trade" ? [{ value: "trade", label: "Selected trade" }] : []), ...(range === "custom" ? [{ value: "custom", label: "Custom range" }] : [])]} /> : null}
        {!fullScreen ? <AppButton aria-label="Expand chart" onClick={() => setFullScreen(true)}><Maximize2 className="size-3.5" />Expand</AppButton> : null}
      </div>
    </div>
    {view === "Equity" ? <BotEquityChart bot={bot} expanded={fullScreen} /> : <>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3 border-y border-border py-3">
        {control(fullScreen ? "full-volume" : "chart-volume", "Volume", volume, setVolume, "#8c829f")}
        {control(fullScreen ? "full-trades" : "chart-trades", "Trade entries / exits", executions, setExecutions, BLUE)}
        {control(fullScreen ? "full-signals" : "chart-signals", "Recalculated signals", signals, setSignals, GREEN)}
        <div className="ml-auto flex gap-3 text-[10px] text-muted-foreground"><span className="text-blue-300">● Trade entry</span><span className="text-violet-200">● Trade exit</span>{signals ? <><span className="text-emerald-400">▲ Entry signal</span><span className="text-amber-300">◆ Exit signal</span></> : null}</div>
      </div>
      {signals ? <p className="text-[11px] text-muted-foreground">Recalculated signals are illustrative and may differ from signals available during trading.</p> : null}
      {highlight ? <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-violet-500/30 bg-violet-500/10 px-3 py-2 text-[12px]"><span>Selected trade: <strong>{highlight.id}</strong></span><div className="flex gap-2"><AppButton onClick={() => focus(highlight)}>Focus trade</AppButton><AppButton variant="ghost" onClick={clearSelection}>Clear selection</AppButton></div></div> : null}
      <div ref={chartFrame} className={cx("space-y-3 rounded-md bg-background pt-2", fullScreen ? "scroll-mt-3" : "scroll-mt-16")}>
        {candles.length ? <>
          <div className={fullScreen ? "h-[42vh] min-h-56" : tradesOpen ? "h-64" : "h-80"} aria-label={`${strategy.params.pair} candlestick chart`}>
            <ResponsiveContainer width="100%" height="100%"><ComposedChart data={candles} margin={{ top: 18, right: 10, left: 10, bottom: 0 }}>
              {tradeBand ? <ReferenceArea x1={tradeBand.x1} x2={tradeBand.x2} fill={tradeBand.fill} fillOpacity={0.16} stroke={tradeBand.fill} strokeOpacity={0.45} ifOverflow="hidden" /> : null}
              <CartesianGrid stroke="rgba(184,174,204,.12)" vertical={false} />
              <XAxis dataKey="at" tickFormatter={tickLabel} tick={{ fill: "#b8aecc", fontSize: 10 }} minTickGap={60} axisLine={false} tickLine={false} />
              <YAxis domain={[(min) => min * 0.998, (max) => max * 1.002]} width={80} tick={{ fill: "#b8aecc", fontSize: 10 }} tickFormatter={(n) => money(n)} axisLine={false} tickLine={false} />
              <Tooltip content={<CandleTooltip />} cursor={{ stroke: "#8c829f", strokeDasharray: "3 3" }} />
              <Bar dataKey="range" isAnimationActive={false} shape={(props) => <Candle {...props} signals={signals} executions={executions} selectedId={highlight?.id} onSelect={select} />} />
              {executions && selectedSegment ? <ReferenceLine className="selected-trade-connection" segment={selectedSegment} stroke={PURPLE} strokeWidth={2} strokeDasharray="5 4" ifOverflow="hidden" style={{ pointerEvents: "none" }} /> : null}
              <Brush dataKey="at" height={25} startIndex={startIndex} endIndex={endIndex} stroke="#675685" fill="#170f29" tickFormatter={shortDate} travellerWidth={8} onChange={(next) => { if (next && next.startIndex !== next.endIndex && (next.startIndex !== startIndex || next.endIndex !== endIndex)) { setWindow(next); setRange(next.startIndex === 0 && next.endIndex === candles.length - 1 ? "all" : "custom"); } }} />
            </ComposedChart></ResponsiveContainer>
          </div>
          {volume ? <div><div className="mb-1 text-[10px] text-muted-foreground">Volume · {strategy.params.pair.split("/")[0]}</div><div className="h-16"><ResponsiveContainer width="100%" height="100%"><BarChart data={visible} margin={{ top: 0, left: 90, right: 10, bottom: 0 }}><XAxis dataKey="at" hide /><YAxis hide /><Bar dataKey="volume" fill="#8c829f" fillOpacity={0.5} isAnimationActive={false} /></BarChart></ResponsiveContainer></div></div> : null}
        </> : <div className="flex h-64 items-center justify-center rounded-md border border-dashed border-border text-[12px] text-muted-foreground">No chart history yet.</div>}
        <Collapsible open={tradesOpen} onOpenChange={setTradesOpen} className="border-t border-border pt-2">
          <CollapsibleTrigger asChild><AppButton variant="ghost" className="group w-full justify-between"><span>Trades in view · {visibleTrades.length}</span><ChevronDown className="size-3.5 transition-transform group-data-[state=open]:rotate-180" /></AppButton></CollapsibleTrigger>
          <CollapsibleContent><BotChartTrades trades={visibleTrades} strategy={strategy} selectedId={highlight?.id} onSelect={select} onFocus={focus} /></CollapsibleContent>
        </Collapsible>
      </div>
    </>}
  </div>;
  return !fullScreen ? <section className={cx(ui.radius, ui.panel, "p-4")}>{content}</section> : <AppDialog open onOpenChange={setFullScreen} title={view === "Market" ? "Market chart" : "Equity history"} description={view === "Market" ? `${strategy.params.pair} · ${strategy.params.timeframe} · UTC` : "Bot capital · USDT · UTC"} className="w-[calc(100vw-2rem)] max-w-none max-h-[calc(100dvh-2rem)]">{content}</AppDialog>;
}

import React, { memo, useMemo } from "react";

import {

  CartesianGrid,

  Legend,

  Line,

  LineChart,

  ReferenceLine,

  ResponsiveContainer,

  Tooltip,

  XAxis,

  YAxis,

} from "recharts";

import { cx } from "../../../../constants/ui";



function formatUsd(value) {

  if (value == null || Number.isNaN(value)) return "—";

  return `$${Number(value).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

}



export const MiniBacktestBalanceChart = memo(function MiniBacktestBalanceChart({

  trades = [],

  initialBalance = 0,

  halted = false,

  haltReason = null,

  haltAt = null,

}) {

  const chartData = useMemo(() => {

    const startPoint = {

      cycle: 0,

      total: initialBalance,

      tradable: initialBalance,

      reserve: 0,

      start: initialBalance,

    };

    const points = trades.map((trade, index) => ({

      cycle: trade.cycleId ?? index + 1,

      total: trade.equity ?? trade.balance,

      tradable: trade.tradable ?? trade.balance,

      reserve: trade.reserve ?? 0,

      start: initialBalance,

    }));

    return [startPoint, ...points];

  }, [trades, initialBalance]);



  if (chartData.length <= 1) {

    return (

      <div className="flex h-[280px] items-center justify-center rounded-lg border border-[rgba(60,40,80,0.35)] bg-[#120a20] text-[12px] text-[#8c8c8c]">

        No balance data to chart

      </div>

    );

  }



  const haltCycle = halted && haltAt != null

    ? chartData.find((d) => d.cycle === haltAt)?.cycle ?? chartData[chartData.length - 1]?.cycle

    : null;



  return (

    <div className="h-[300px] w-full rounded-lg border border-[rgba(60,40,80,0.35)] bg-[#120a20] px-2 py-3">

      <div className="flex flex-wrap gap-4 text-[11px] text-[#8c8c8c] mb-1 px-1">

        <span className="flex items-center gap-1.5">

          <span className="inline-block w-2.5 h-0.5 rounded bg-violet-400" /> Total

        </span>

        <span className="flex items-center gap-1.5">

          <span className="inline-block w-2.5 h-0.5 rounded bg-blue-400" /> Tradable

        </span>

        <span className="flex items-center gap-1.5">

          <span className="inline-block w-2.5 h-0.5 rounded bg-teal-400 border border-dashed border-teal-400" /> Reserve

        </span>

        {halted && haltCycle != null && (

          <span className={cx("text-[10px] font-semibold", haltReason === "ruin" ? "text-red-400" : "text-amber-400")}>

            {haltReason === "ruin" ? "⛔ wiped" : "⚠ stopout"} · cyc {haltAt}

          </span>

        )}

      </div>

      <ResponsiveContainer width="100%" height="92%">

        <LineChart data={chartData} margin={{ top: 8, right: 48, left: 4, bottom: 0 }}>

          <CartesianGrid stroke="rgba(60,40,80,0.35)" strokeDasharray="3 3" vertical={false} />

          <XAxis

            dataKey="cycle"

            tick={{ fill: "#8c8c8c", fontSize: 11 }}

            axisLine={{ stroke: "rgba(60,40,80,0.5)" }}

            tickLine={false}

            label={{ value: "Cycle", position: "insideBottom", offset: -2, fill: "#8c8c8c", fontSize: 11 }}

          />

          <YAxis

            yAxisId="balance"

            tick={{ fill: "#8c8c8c", fontSize: 11 }}

            axisLine={false}

            tickLine={false}

            tickFormatter={(v) => formatUsd(v)}

            width={72}

          />

          <YAxis

            yAxisId="reserve"

            orientation="right"

            tick={{ fill: "#2dd4bf", fontSize: 10 }}

            axisLine={false}

            tickLine={false}

            tickFormatter={(v) => formatUsd(v)}

            width={56}

          />

          <Tooltip

            contentStyle={{

              background: "#170f29",

              border: "1px solid rgba(60,40,80,0.5)",

              borderRadius: 8,

              fontSize: 12,

            }}

            labelStyle={{ color: "#b8aecc" }}

            formatter={(value, name) => {

              const labels = { total: "Total", tradable: "Tradable", reserve: "Reserve", start: "Start" };

              return [formatUsd(value), labels[name] || name];

            }}

            labelFormatter={(label) => `Cycle ${label}`}

          />

          <Legend wrapperStyle={{ fontSize: 11, color: "#b8aecc", paddingTop: 4 }} />

          <ReferenceLine

            yAxisId="balance"

            y={initialBalance}

            stroke="#6b7280"

            strokeDasharray="6 4"

            strokeWidth={1.5}

          />

          {haltCycle != null && (

            <ReferenceLine

              x={haltCycle}

              stroke={haltReason === "ruin" ? "#f87171" : "#fbbf24"}

              strokeDasharray="3 3"

              strokeWidth={1.5}

            />

          )}

          <Line

            yAxisId="balance"

            type="monotone"

            dataKey="total"

            name="total"

            stroke="#a78bfa"

            strokeWidth={2.2}

            dot={false}

            activeDot={{ r: 4, fill: "#a78bfa" }}

          />

          <Line

            yAxisId="balance"

            type="monotone"

            dataKey="tradable"

            name="tradable"

            stroke="#60a5fa"

            strokeWidth={1.6}

            dot={false}

            activeDot={{ r: 3, fill: "#60a5fa" }}

          />

          <Line

            yAxisId="reserve"

            type="monotone"

            dataKey="reserve"

            name="reserve"

            stroke="#2dd4bf"

            strokeWidth={1.6}

            strokeDasharray="3 3"

            dot={false}

            activeDot={{ r: 3, fill: "#2dd4bf" }}

          />

        </LineChart>

      </ResponsiveContainer>

    </div>

  );

});


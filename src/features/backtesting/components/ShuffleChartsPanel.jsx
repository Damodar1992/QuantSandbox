import React, { memo, useMemo, useState } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  LineChart,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { cx, ui } from "@/constants/ui";
import {
  SHUFFLE_CHART_COLORS,
  SHUFFLE_CHART_FILTERS,
  buildShuffleChartsModel,
  wideDensityTable,
  wideSeriesTable,
} from "../utils/shuffleChartsData";

function fmtMoney(v) {
  if (v == null || Number.isNaN(Number(v))) return "—";
  return Number(v).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function fmtPct(v) {
  if (v == null || Number.isNaN(Number(v))) return "—";
  return `${Number(v).toFixed(2)}%`;
}

function SectionFilter({ value, onChange, available }) {
  const options = SHUFFLE_CHART_FILTERS.filter(
    (f) => f.id === "ALL" || available.includes(f.id),
  );
  return (
    <div className="inline-flex flex-wrap items-center gap-1">
      {options.map((opt) => (
        <button
          key={opt.id}
          type="button"
          onClick={() => onChange(opt.id)}
          className={cx(
            "rounded-md border px-2 py-0.5 text-[10px] font-medium transition-colors",
            value === opt.id
              ? "border-violet-500/45 bg-violet-500/15 text-violet-200"
              : "border-[rgba(60,40,80,0.4)] text-[#8c8c8c] hover:text-[#d9d9d9]",
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function ChartCard({ title, filter, onFilter, available, extra, children }) {
  return (
    <div className={cx(ui.radius, "border border-[rgba(60,40,80,0.35)] bg-[#120b20] p-3")}>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="text-[12px] font-medium text-[#faf7fd]">{title}</div>
        <div className="flex flex-wrap items-center gap-2">
          {extra}
          {filter != null ? (
            <SectionFilter value={filter} onChange={onFilter} available={available} />
          ) : null}
        </div>
      </div>
      {children}
    </div>
  );
}

function LegendItem({ color, label, dashed }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[10px] text-[#b8aecc]">
      <span
        className={cx("inline-block h-0.5 w-3 rounded", dashed && "border-t border-dashed bg-transparent")}
        style={dashed ? { borderColor: color, height: 0, width: 12 } : { background: color }}
      />
      {label}
    </span>
  );
}

function BalanceChart({ model, filter }) {
  const visible = useMemo(() => {
    if (filter === "ALL") return model.series;
    return model.series.filter((s) => s.section === filter);
  }, [model.series, filter]);

  const data = useMemo(
    () => wideSeriesTable(
      visible.map((s) => s.balance),
      model.original.balance,
    ),
    [visible, model.original.balance],
  );

  const finalX = model.original.balance[model.original.balance.length - 1]?.x;
  const finalY = model.original.final;

  return (
    <div className="w-full">
      <div className="h-[248px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 12, right: 72, left: 4, bottom: 4 }}>
            <CartesianGrid stroke="rgba(60,40,80,0.35)" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="x"
              tick={{ fill: "#8c8c8c", fontSize: 10 }}
              axisLine={{ stroke: "rgba(60,40,80,0.5)" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "#8c8c8c", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              domain={["auto", "auto"]}
              width={44}
            />
            <Tooltip
              contentStyle={{
                background: "#170f29",
                border: "1px solid rgba(60,40,80,0.45)",
                borderRadius: 8,
                fontSize: 11,
              }}
              labelFormatter={(x) => `Step ${x}`}
              formatter={(value, name) => [
                fmtMoney(value),
                name === "original" ? "Original" : name,
              ]}
            />
            {visible.map((s, idx) => (
              <Line
                key={s.id}
                type="monotone"
                dataKey={`s${idx}`}
                stroke={SHUFFLE_CHART_COLORS[s.section] || SHUFFLE_CHART_COLORS.random}
                strokeWidth={1}
                strokeOpacity={0.55}
                dot={false}
                isAnimationActive={false}
                legendType="none"
              />
            ))}
            <Line
              type="monotone"
              dataKey="original"
              stroke={SHUFFLE_CHART_COLORS.original}
              strokeWidth={2.5}
              dot={{ r: 2.5, fill: SHUFFLE_CHART_COLORS.original, strokeWidth: 0 }}
              isAnimationActive={false}
            />
            <ReferenceDot
              x={finalX}
              y={finalY}
              r={0}
              label={{
                value: `Final ${fmtMoney(finalY)}`,
                position: "right",
                fill: "#93c5fd",
                fontSize: 10,
                offset: 8,
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 px-1">
        <LegendItem color={SHUFFLE_CHART_COLORS.original} label="Original" />
        <LegendItem color={SHUFFLE_CHART_COLORS.random} label="Shuffle" />
        <LegendItem color={SHUFFLE_CHART_COLORS.L2} label="L2" />
        <LegendItem color={SHUFFLE_CHART_COLORS.L3} label="L3" />
        <LegendItem color={SHUFFLE_CHART_COLORS.L4} label="L4" />
      </div>
    </div>
  );
}

function DrawdownChart({ model, filter }) {
  const visible = useMemo(() => {
    if (filter === "ALL") return model.series;
    return model.series.filter((s) => s.section === filter);
  }, [model.series, filter]);

  const data = useMemo(
    () => wideSeriesTable(
      visible.map((s) => s.drawdown),
      model.original.drawdown,
    ),
    [visible, model.original.drawdown],
  );

  const maxPt = model.original.maxDdPoint;

  return (
    <div className="w-full">
      <div className="h-[228px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 16, right: 56, left: 4, bottom: 4 }}>
            <CartesianGrid stroke="rgba(60,40,80,0.35)" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="x"
              tick={{ fill: "#8c8c8c", fontSize: 10 }}
              axisLine={{ stroke: "rgba(60,40,80,0.5)" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "#8c8c8c", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${v}%`}
              width={44}
            />
            <Tooltip
              contentStyle={{
                background: "#170f29",
                border: "1px solid rgba(60,40,80,0.45)",
                borderRadius: 8,
                fontSize: 11,
              }}
              labelFormatter={(x) => `Step ${x}`}
              formatter={(value, name) => [
                fmtPct(value),
                name === "original" ? "Original" : name,
              ]}
            />
            {visible.map((s, idx) => (
              <Line
                key={s.id}
                type="monotone"
                dataKey={`s${idx}`}
                stroke={SHUFFLE_CHART_COLORS[s.section] || SHUFFLE_CHART_COLORS.random}
                strokeWidth={1}
                strokeOpacity={0.5}
                dot={false}
                isAnimationActive={false}
              />
            ))}
            <Line
              type="monotone"
              dataKey="original"
              stroke={SHUFFLE_CHART_COLORS.original}
              strokeWidth={2.5}
              dot={false}
              isAnimationActive={false}
            />
            <ReferenceDot
              x={maxPt.x}
              y={maxPt.y}
              r={4}
              fill="#f87171"
              stroke="#fecaca"
              strokeWidth={1}
              label={{
                value: `MAX ${fmtPct(model.original.maxDd)}`,
                position: "top",
                fill: "#fca5a5",
                fontSize: 10,
                offset: 8,
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 px-1">
        <LegendItem
          color={SHUFFLE_CHART_COLORS.original}
          label={`Original · max ${fmtPct(model.original.maxDd)}`}
        />
        <LegendItem color={SHUFFLE_CHART_COLORS.random} label="Shuffle" />
        <LegendItem color={SHUFFLE_CHART_COLORS.L2} label="L2" />
        <LegendItem color={SHUFFLE_CHART_COLORS.L3} label="L3" />
        <LegendItem color={SHUFFLE_CHART_COLORS.L4} label="L4" />
      </div>
    </div>
  );
}

const DENSITY_TICKS_POS = [0, 4, 8, 12, 16, 20, 24, 28, 32];
const DENSITY_TICKS_NEG = [-32, -28, -24, -20, -16, -12, -8, -4, 0];

function DensityChart({ model, polarity }) {
  const isNeg = polarity === "negative";
  const densityMap = isNeg ? model.densityNegative : model.densityPositive;
  const keys = model.sectionKeys.filter((k) => densityMap[k]);
  const data = useMemo(() => wideDensityTable(densityMap, keys), [densityMap, keys]);
  const originalX = isNeg ? -Math.abs(model.original.maxDd) : Math.abs(model.original.maxDd);
  const originalLabel = isNeg
    ? `Original -${Number(model.original.maxDd).toFixed(2)} %`
    : `Original ${fmtPct(model.original.maxDd)}`;

  return (
    <div className="w-full">
      <div className="h-[228px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 20, right: 16, left: 4, bottom: 4 }}>
            <CartesianGrid stroke="rgba(60,40,80,0.35)" strokeDasharray="3 3" vertical={false} />
            <XAxis
              type="number"
              dataKey="x"
              domain={isNeg ? [-32, 0] : [0, 32]}
              ticks={isNeg ? DENSITY_TICKS_NEG : DENSITY_TICKS_POS}
              tick={{ fill: "#8c8c8c", fontSize: 10 }}
              axisLine={{ stroke: "rgba(60,40,80,0.5)" }}
              tickLine={false}
              tickFormatter={(v) => `${v} %`}
            />
            <YAxis
              tick={{ fill: "#8c8c8c", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              label={{
                value: "Density",
                angle: -90,
                position: "insideLeft",
                fill: "#8c8c8c",
                fontSize: 10,
              }}
              width={48}
            />
            <Tooltip
              contentStyle={{
                background: "#170f29",
                border: "1px solid rgba(60,40,80,0.45)",
                borderRadius: 8,
                fontSize: 11,
              }}
              labelFormatter={(x) => `Max DD ${x} %`}
              formatter={(value, name) => [
                Number(value).toFixed(4),
                name === "random" ? "Shuffle" : name,
              ]}
            />
            {keys.map((key) => (
              <Area
                key={key}
                type="monotone"
                dataKey={key}
                stroke={SHUFFLE_CHART_COLORS[key] || SHUFFLE_CHART_COLORS.random}
                fill={SHUFFLE_CHART_COLORS[key] || SHUFFLE_CHART_COLORS.random}
                fillOpacity={0.12}
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            ))}
            <ReferenceLine
              x={originalX}
              stroke="#f87171"
              strokeWidth={1.5}
              label={{
                value: originalLabel,
                position: "top",
                fill: "#fca5a5",
                fontSize: 10,
              }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 px-1">
        {keys.map((key) => (
          <LegendItem
            key={key}
            color={SHUFFLE_CHART_COLORS[key] || SHUFFLE_CHART_COLORS.random}
            label={`${key === "random" ? "Shuffle" : key} · μ ${fmtPct(model.means[key])}`}
          />
        ))}
        <LegendItem
          color="#f87171"
          label={`Original · ${fmtPct(model.original.maxDd)}`}
          dashed
        />
      </div>
    </div>
  );
}

/** Three Shuffle-info charts matching the reference layout. */
export const ShuffleChartsPanel = memo(function ShuffleChartsPanel({ run }) {
  const model = useMemo(() => buildShuffleChartsModel(run), [run]);
  const [balanceFilter, setBalanceFilter] = useState("ALL");
  const [ddFilter, setDdFilter] = useState("ALL");
  const [polarity, setPolarity] = useState("positive");

  const available = useMemo(() => {
    const set = new Set(model.sectionKeys);
    return ["random", "L2", "L3", "L4"].filter((k) => set.has(k));
  }, [model.sectionKeys]);

  return (
    <div className="space-y-4">
      <ChartCard
        title="Balance Curve"
        filter={balanceFilter}
        onFilter={setBalanceFilter}
        available={available}
      >
        <BalanceChart model={model} filter={balanceFilter} />
      </ChartCard>

      <ChartCard
        title="Drawdown from initial balance"
        filter={ddFilter}
        onFilter={setDdFilter}
        available={available}
      >
        <DrawdownChart model={model} filter={ddFilter} />
      </ChartCard>

      <ChartCard
        title="Max Drawdown from Initial Balance — Distribution"
        filter={null}
        available={available}
        extra={
          <div className="inline-flex items-center gap-0.5 rounded-full border border-[rgba(60,40,80,0.45)] p-0.5">
            {[
              { id: "positive", label: "Positive %" },
              { id: "negative", label: "Negative %" },
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setPolarity(opt.id)}
                className={cx(
                  "rounded-full px-2.5 py-0.5 text-[10px] font-medium transition-colors",
                  polarity === opt.id
                    ? "bg-violet-500/20 text-violet-200"
                    : "text-[#8c8c8c] hover:text-[#d9d9d9]",
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        }
      >
        <DensityChart model={model} polarity={polarity} />
      </ChartCard>
    </div>
  );
});

import { memo, useMemo } from "react";
import { cx, ui } from "@/constants/ui";
import { BT_PERFORMANCE_TOOLTIPS } from "@/constants/backtesting";
import {
  BT_DRAWDOWN,
  BT_MUTED,
  BT_NEGATIVE,
  BT_NEUTRAL,
  BT_POSITIVE,
  fmtNum,
  fmtPct,
  isMissing,
} from "../utils/format";
import { buildPerformanceSummary } from "../utils/mockResults";
import { BtValueTooltip } from "./BtInfoTooltip";

const CARD_SHELL = cx(ui.radius, "border border-[rgba(60,40,80,0.35)] bg-[#120b20] p-3");
const LABEL_DOTTED =
  "underline decoration-dotted underline-offset-2 decoration-[#6e6682]";

function toneClass(tone, value) {
  switch (tone) {
    case "signed":
    case "money":
      if (isMissing(value)) return BT_MUTED;
      return Number(value) > 0 ? BT_POSITIVE : Number(value) < 0 ? BT_NEGATIVE : BT_NEUTRAL;
    case "drawdown-text":
    case "drawdown-money":
    case "drawdown-pct":
      return BT_DRAWDOWN;
    case "int-neg":
    case "num-neg":
    case "neg-text":
      return BT_NEGATIVE;
    case "int-pos":
    case "num-pos":
    case "pos-text":
      return BT_POSITIVE;
    case "pf":
      if (isMissing(value)) return BT_MUTED;
      return Number(value) >= 1 ? BT_POSITIVE : BT_NEGATIVE;
    case "neutral-text":
    case "int":
    case "num":
    case "money-unsigned":
    default:
      return BT_NEUTRAL;
  }
}

function formatHeroValue(item) {
  if (item.tone === "signed") {
    if (item.suffix === "%") return fmtPct(item.value, 2, true);
    return fmtNum(item.value, 2);
  }
  if (item.tone === "drawdown-pct") return fmtPct(item.value, 2, false);
  if (item.tone === "pf") return fmtNum(item.value, 2);
  return String(item.value ?? "—");
}

function heroValueClass(item) {
  if (item.tone === "signed" || item.tone === "pf") return toneClass(item.tone, item.value);
  return toneClass(item.tone, item.value);
}

function MetricLabel({ label, tip, className }) {
  const tipObj = typeof tip === "string" ? { text: tip } : tip;
  if (!tipObj?.text && !tipObj?.formula) {
    return <span className={className}>{label}</span>;
  }
  return (
    <BtValueTooltip text={tipObj.text} formula={tipObj.formula}>
      <span className={cx(LABEL_DOTTED, className)}>{label}</span>
    </BtValueTooltip>
  );
}

function HeroCard({ item }) {
  return (
    <div className={cx(CARD_SHELL, "space-y-1.5")}>
      <MetricLabel
        label={item.label}
        tip={BT_PERFORMANCE_TOOLTIPS[item.key]}
        className={cx("text-[10px] leading-snug", BT_MUTED)}
      />
      <div className={cx("text-[22px] font-semibold leading-none font-mono tabular-nums", heroValueClass(item))}>
        {formatHeroValue(item)}
      </div>
      {item.sub ? (
        <div className={cx("text-[10px] leading-snug", ui.textSubtle)}>{item.sub}</div>
      ) : null}
    </div>
  );
}

function SectionCard({ section }) {
  return (
    <div className={cx(CARD_SHELL, "space-y-2")}>
      <div className="text-[10px] font-semibold uppercase tracking-wide text-[#9b8ec4]">
        {section.hint ? (
          <MetricLabel
            label={section.title}
            tip={section.hint}
            className="text-[10px] font-semibold uppercase tracking-wide text-[#9b8ec4]"
          />
        ) : (
          section.title
        )}
      </div>
      <ul className="space-y-2">
        {(section.rows || []).map((row) => (
          <li
            key={row.key}
            className="flex items-start justify-between gap-3 text-[11px]"
          >
            <span className={cx(BT_MUTED, "min-w-0 pt-0.5 leading-snug")}>
              <MetricLabel label={row.label} tip={BT_PERFORMANCE_TOOLTIPS[row.key]} />
            </span>
            <span className="shrink-0 text-right">
              <span
                className={cx(
                  "block font-mono tabular-nums leading-snug",
                  toneClass(row.tone, row.total),
                )}
              >
                {row.total ?? "—"}
              </span>
              {row.sub ? (
                <span className={cx("mt-0.5 block text-[10px] leading-snug", ui.textSubtle)}>
                  {row.sub}
                </span>
              ) : null}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ensurePerformance(run) {
  const existing = run?.result?.performance;
  if (existing?.hero?.length && existing?.columns?.length) return existing;

  const core = run?.result?.core;
  const streaks = run?.result?.streaks;
  if (!core || !run) return null;

  // Fallback for runs created before the redesigned performance summary.
  let h = 2166136261;
  const seed = `backtest|${run.id}`;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  let a = h >>> 0;
  const rnd = () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  return buildPerformanceSummary(run, {
    rnd,
    roi: core.roi,
    pnl: core.pnl,
    maxdd: core.maxdd,
    pf: core.pf,
    winrate: core.winrate,
    trades: core.trades,
    wins: streaks?.wins ?? Math.max(1, Math.round((core.trades * core.winrate) / 100)),
    losses:
      streaks?.losses ??
      Math.max(1, core.trades - Math.round((core.trades * core.winrate) / 100)),
    startingCapital: Number(run.params?.startingCapital) || 10000,
  });
}

export const PerformanceSummaryTab = memo(function PerformanceSummaryTab({ run }) {
  const performance = useMemo(() => ensurePerformance(run), [run]);

  if (!performance?.hero?.length && !performance?.columns?.length) {
    return (
      <div className={cx(ui.radius, ui.panelMuted, "px-4 py-10 text-center text-[12px]", ui.textSubtle)}>
        No performance summary for this run.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-[#d9d9d9]">
          Performance summary
        </div>
        <div className={cx("text-[10px]", ui.textSubtle)}>
          Every metric name is documented — hover the dotted label for the formula and what it means.
        </div>
      </div>

      {performance.hero?.length ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {performance.hero.map((item) => (
            <HeroCard key={item.key} item={item} />
          ))}
        </div>
      ) : null}

      {performance.columns?.length ? (
        <div className="grid gap-3 lg:grid-cols-3">
          {performance.columns.map((column) => (
            <div key={column.key} className="space-y-3">
              {(column.sections || []).map((section) => (
                <SectionCard key={section.key} section={section} />
              ))}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
});

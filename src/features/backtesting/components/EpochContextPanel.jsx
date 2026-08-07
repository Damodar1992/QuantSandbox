import React, { memo, useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cx, ui } from "@/constants/ui";
import { AppSelect } from "@/components/common/AppSelect";
import { RISK_STOPLOSS_LABELS, RISK_LOSS_STREAK_LABELS } from "@/constants/risk";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

const RISK_KEYS = [
  "stoploss",
  "trailing_activation",
  "trailing_distance",
  "loss_streak_threshold",
  "post_loss_cooldown_candles",
];

function formatRiskValue(key, value) {
  if (value === null || value === undefined) return "—";
  if (key === "loss_streak_threshold" || key === "post_loss_cooldown_candles") return String(value);
  return `${(Number(value) * 100).toFixed(2)}%`;
}

function IndicatorColumn({ indicators }) {
  if (!indicators?.length) {
    return <div className={cx("text-[11px]", ui.textSubtle)}>No indicators</div>;
  }

  return (
    <div className="space-y-3">
      {indicators.map((snapshot, idx) => {
        const name = snapshot.displayName || snapshot.type || `Indicator ${idx + 1}`;
        const params = snapshot.paramsSnapshot || {};
        const entries = Object.entries(params);
        return (
          <div key={snapshot.id ?? `${name}-${idx}`} className="space-y-1">
            <div className="text-[12px] font-medium text-[#faf7fd]">{name}</div>
            {entries.length ? (
              <ul className="space-y-0.5">
                {entries.map(([key, value]) => (
                  <li
                    key={key}
                    className="flex items-baseline justify-between gap-2 font-mono text-[11px] tabular-nums"
                  >
                    <span className="text-[#8c8c8c]">{key}</span>
                    <span className="text-[#e8e0f0]">{String(value)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className={cx("text-[10px]", ui.textSubtle)}>no params</div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function RiskColumn({ risk }) {
  return (
    <ul className="space-y-2">
      {RISK_KEYS.map((key) => (
        <li key={key} className="space-y-0.5">
          <div className="text-[10px] uppercase tracking-wide text-[#8c8c8c]">
            {RISK_STOPLOSS_LABELS[key] || RISK_LOSS_STREAK_LABELS?.[key] || key}
          </div>
          <div className="font-mono text-[12px] tabular-nums text-[#faf7fd]">
            {formatRiskValue(key, risk?.[key])}
          </div>
        </li>
      ))}
    </ul>
  );
}

/**
 * Favorite-epoch selector + collapsible Epoch Details (Stages 1–4 columns).
 */
export const EpochContextPanel = memo(function EpochContextPanel({
  epochs,
  selectedEpochId,
  onSelectEpoch,
  stageStatusByEpoch,
  stageConfig,
}) {
  const [detailsOpen, setDetailsOpen] = useState(false);

  const options = useMemo(
    () =>
      (epochs || []).map((epoch) => ({
        value: String(epoch.id),
        label: `${epoch.label || `Epoch #${epoch.epochNumber ?? "?"}`}${
          stageStatusByEpoch?.[epoch.id] && stageStatusByEpoch[epoch.id] !== "—"
            ? ` · ${stageStatusByEpoch[epoch.id]}`
            : ""
        }`,
      })),
    [epochs, stageStatusByEpoch],
  );

  const epoch = (epochs || []).find((e) => String(e.id) === String(selectedEpochId)) || null;
  const risk = stageConfig?.stage4?.riskParams || epoch?.riskParams || {};

  const columns = [
    { key: "signal", title: "Signal", indicators: stageConfig?.stage1?.indicators },
    { key: "entry", title: "Entry", indicators: stageConfig?.stage2?.indicators },
    { key: "exit", title: "Exit", indicators: stageConfig?.stage3?.indicators },
    { key: "risk", title: "Risk", risk: true },
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-3">
        <AppSelect
          label="Source best score"
          value={selectedEpochId ? String(selectedEpochId) : ""}
          onValueChange={onSelectEpoch}
          options={options}
          placeholder="Select epoch…"
          className="min-w-[320px]"
          triggerClassName="h-9 text-[12px]"
        />
      </div>

      {epoch ? (
        <Collapsible open={detailsOpen} onOpenChange={setDetailsOpen}>
          <div className={cx(ui.radius, ui.panelMuted, "overflow-hidden")}>
            <CollapsibleTrigger
              type="button"
              className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left hover:bg-[#1a1028]/50 transition-colors"
            >
              <span className="text-[12px] font-medium text-[#faf7fd]">Epoch Details</span>
              <ChevronDown
                className={cx(
                  "h-4 w-4 shrink-0 text-[#8c8c8c] transition-transform duration-200",
                  detailsOpen && "rotate-180",
                )}
                aria-hidden
              />
            </CollapsibleTrigger>

            <CollapsibleContent>
              <div className="border-t border-[rgba(60,40,80,0.35)] px-3 py-3">
                <div className="grid grid-cols-2 gap-y-4 lg:grid-cols-4 lg:divide-x lg:divide-[rgba(60,40,80,0.3)]">
                  {columns.map((col) => (
                    <div key={col.key} className="min-w-0 space-y-2 px-0 lg:px-3 first:lg:pl-0 last:lg:pr-0">
                      <div className="text-[11px] font-semibold uppercase tracking-wider text-[#d9d9d9]">
                        {col.title}
                      </div>
                      {col.risk ? (
                        <RiskColumn risk={risk} />
                      ) : (
                        <IndicatorColumn indicators={col.indicators} />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>
      ) : null}
    </div>
  );
});

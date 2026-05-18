import React, { memo } from "react";
import { cx, ui } from "../../../constants/ui";
import { RiskStoplossPanel } from "./RiskStoplossPanel";
import { StrategyTemplatePreview } from "./StrategyTemplatePreview";

function SectionShell({ title, subtitle, sectionNum, collapsed, onToggle, children }) {
  return (
    <div className={cx(ui.radius, ui.panel, "overflow-hidden")}>
      <button
        type="button"
        onClick={() => onToggle(sectionNum)}
        className={cx(
          "w-full px-3 py-2 flex items-center justify-between gap-2 text-left",
          ui.panelMuted,
          "border-0 border-b",
          ui.divider,
          "hover:bg-[#1a1a1a] transition-colors",
        )}
      >
        <div>
          <div className="text-[12px] font-medium text-[#d9d9d9]">{title}</div>
          {subtitle && <div className={cx("text-[11px]", ui.textMuted)}>{subtitle}</div>}
        </div>
        <span className="text-[#8c8c8c] text-[10px]">{collapsed ? "▶" : "▼"}</span>
      </button>
      {!collapsed && <div className="p-3">{children}</div>}
    </div>
  );
}

export const RiskStagePanel = memo(function RiskStagePanel({
  collapsedSections,
  toggleSection,
  riskStoplossRanges,
  onRiskStoplossRangesChange,
  signalIndicators,
  entryFormula,
  exitFormula,
  timeRange,
}) {
  return (
    <>
      <SectionShell
        title="1. Stoplosses"
        subtitle="Min, max, and step for stoploss hyperopt grid"
        sectionNum={1}
        collapsed={collapsedSections.has(1)}
        onToggle={toggleSection}
      >
        <RiskStoplossPanel ranges={riskStoplossRanges} onChange={onRiskStoplossRangesChange} />
      </SectionShell>

      <SectionShell
        title="2. Formula"
        subtitle="Read-only preview: Stages 1–3 + risk parameters"
        sectionNum={2}
        collapsed={collapsedSections.has(2)}
        onToggle={toggleSection}
      >
        <StrategyTemplatePreview
          signalIndicators={signalIndicators}
          entryFormula={entryFormula}
          exitFormula={exitFormula}
          riskRanges={riskStoplossRanges}
          timeRange={timeRange}
        />
      </SectionShell>
    </>
  );
});

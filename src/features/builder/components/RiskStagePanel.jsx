import React, { memo, useMemo } from "react";
import { BuilderSectionShell } from "../layout/BuilderSectionShell";
import { RiskStoplossPanel } from "./RiskStoplossPanel";
import { StrategyTemplatePreview } from "./StrategyTemplatePreview";
import { TotalCombinationsBadge } from "./IndicatorRangesPanel";
import { countRiskCombinations } from "../utils/riskCombinations";

export const RiskStagePanel = memo(function RiskStagePanel({
  collapsedSections,
  toggleSection,
  riskStoplossRanges,
  onRiskStoplossRangesChange,
  riskHyperoptParams,
  signalIndicators,
  entryFormula,
  exitFormula,
  timeRange,
}) {
  const stoplossCombinations = useMemo(
    () => countRiskCombinations(riskStoplossRanges),
    [riskStoplossRanges],
  );

  return (
    <>
      <BuilderSectionShell
        sectionNum={1}
        title="Stoplosses"
        subtitle="Min, max, and step for stoploss hyperopt grid"
        collapsed={collapsedSections.has(1)}
        onToggle={() => toggleSection(1)}
        headerRight={<TotalCombinationsBadge totalCombinations={stoplossCombinations} />}
      >
        <RiskStoplossPanel ranges={riskStoplossRanges} onChange={onRiskStoplossRangesChange} />
      </BuilderSectionShell>

      <BuilderSectionShell
        sectionNum={2}
        title="Formula"
        subtitle="Read-only preview: Stages 1–3 + risk parameters"
        collapsed={collapsedSections.has(2)}
        onToggle={() => toggleSection(2)}
      >
        <StrategyTemplatePreview
          signalIndicators={signalIndicators}
          entryFormula={entryFormula}
          exitFormula={exitFormula}
          riskRanges={riskStoplossRanges}
          riskHyperoptParams={riskHyperoptParams}
          timeRange={timeRange}
        />
      </BuilderSectionShell>
    </>
  );
});

import React, { memo, useMemo } from "react";
import { BuilderSectionShell } from "../layout/BuilderSectionShell";
import { RiskStoplossPanel } from "./RiskStoplossPanel";
import { RiskHyperoptParamsPanel } from "./RiskHyperoptParamsPanel";
import { StrategyTemplatePreview } from "./StrategyTemplatePreview";
import { TotalCombinationsBadge } from "./IndicatorRangesPanel";
import { countRiskCombinations, countRiskHyperoptParamCombinations } from "../utils/riskCombinations";

export const RiskStagePanel = memo(function RiskStagePanel({
  collapsedSections,
  toggleSection,
  riskStoplossRanges,
  onRiskStoplossRangesChange,
  riskHyperoptParams,
  onRiskHyperoptParamsChange,
  signalIndicators,
  entryFormula,
  exitFormula,
  timeRange,
}) {
  const totalCombinations = useMemo(
    () =>
      countRiskCombinations(riskStoplossRanges) *
      countRiskHyperoptParamCombinations(riskHyperoptParams),
    [riskStoplossRanges, riskHyperoptParams],
  );

  return (
    <>
      <BuilderSectionShell
        sectionNum={1}
        title="Stoplosses"
        subtitle="Min, max, and step for stoploss hyperopt grid"
        collapsed={collapsedSections.has(1)}
        onToggle={() => toggleSection(1)}
        headerRight={<TotalCombinationsBadge totalCombinations={totalCombinations} />}
      >
        <div className="space-y-3">
          <RiskStoplossPanel ranges={riskStoplossRanges} onChange={onRiskStoplossRangesChange} />
          <RiskHyperoptParamsPanel
            params={riskHyperoptParams}
            onChange={onRiskHyperoptParamsChange}
          />
        </div>
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

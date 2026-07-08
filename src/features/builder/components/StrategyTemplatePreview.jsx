import React, { memo, useMemo } from "react";
import { buildStrategyTemplatePreview } from "../../../utils/strategyTemplateCode";
import { MonacoPythonEditor } from "./MonacoPythonEditor";

export const StrategyTemplatePreview = memo(function StrategyTemplatePreview({
  signalIndicators,
  entryFormula,
  exitFormula,
  riskRanges,
  riskHyperoptParams,
  timeRange,
}) {
  const code = useMemo(
    () =>
      buildStrategyTemplatePreview({
        signalIndicators,
        entryFormula,
        exitFormula,
        riskRanges,
        riskHyperoptParams,
        timeframe: timeRange || "5m",
      }),
    [signalIndicators, entryFormula, exitFormula, riskRanges, riskHyperoptParams, timeRange],
  );

  return <MonacoPythonEditor value={code} readOnly />;
});

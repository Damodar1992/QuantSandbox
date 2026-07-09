import React, { memo, useMemo, Suspense, lazy } from "react";
import { buildStrategyTemplatePreview } from "../../../utils/strategyTemplateCode";
import { LoadingFallback } from "../../../components/common/LoadingFallback";

const MonacoPythonEditor = lazy(() =>
  import("./MonacoPythonEditor").then((m) => ({ default: m.MonacoPythonEditor })),
);

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

  return (
    <Suspense fallback={<LoadingFallback />}>
      <MonacoPythonEditor value={code} readOnly />
    </Suspense>
  );
});

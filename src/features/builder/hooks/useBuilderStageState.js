import { useState, useCallback } from "react";
import { pickByStage } from "../utils/stageSelect";

/**
 * Section collapse state for the Builder stepper panels.
 */
export function useCollapsedSections() {
  const [collapsedSections, setCollapsedSections] = useState(() => new Set());
  const toggleSection = useCallback((num) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(num)) next.delete(num);
      else next.add(num);
      return next;
    });
  }, []);
  return { collapsedSections, toggleSection };
}

/**
 * Per-stage hyperopt market configuration (hyperopt type, exchange, trading mode,
 * synthetic dataset, max possible std, unknown time range, fold size).
 *
 * @param {number} activeStage
 */
export function useBuilderStageConfig(activeStage) {
  const [signalHyperoptType, setSignalHyperoptType] = useState("Brute Force");
  const [entryHyperoptType, setEntryHyperoptType] = useState("Brute Force");
  const [exitHyperoptType, setExitHyperoptType] = useState("Brute Force");
  const [riskHyperoptType, setRiskHyperoptType] = useState("Brute Force");

  const [signalExchange, setSignalExchange] = useState("binance");
  const [entryExchange, setEntryExchange] = useState("binance");
  const [exitExchange, setExitExchange] = useState("binance");
  const [riskExchange, setRiskExchange] = useState("binance");

  const [signalTradingMode, setSignalTradingMode] = useState("futures");
  const [entryTradingMode, setEntryTradingMode] = useState("futures");
  const [exitTradingMode, setExitTradingMode] = useState("futures");
  const [riskTradingMode, setRiskTradingMode] = useState("futures");

  const [signalSyntheticDataset, setSignalSyntheticDataset] = useState("dataset1");
  const [entrySyntheticDataset, setEntrySyntheticDataset] = useState("dataset1");
  const [exitSyntheticDataset, setExitSyntheticDataset] = useState("dataset1");
  const [riskSyntheticDataset, setRiskSyntheticDataset] = useState("dataset1");

  const [signalMaxPossibleStd, setSignalMaxPossibleStd] = useState("");
  const [entryMaxPossibleStd, setEntryMaxPossibleStd] = useState("");
  const [exitMaxPossibleStd, setExitMaxPossibleStd] = useState("");
  const [riskMaxPossibleStd, setRiskMaxPossibleStd] = useState("");

  const [signalUnknowTimeRangeStart, setSignalUnknowTimeRangeStart] = useState("");
  const [signalUnknowTimeRangeEnd, setSignalUnknowTimeRangeEnd] = useState("");
  const [entryUnknowTimeRangeStart, setEntryUnknowTimeRangeStart] = useState("");
  const [entryUnknowTimeRangeEnd, setEntryUnknowTimeRangeEnd] = useState("");
  const [exitUnknowTimeRangeStart, setExitUnknowTimeRangeStart] = useState("");
  const [exitUnknowTimeRangeEnd, setExitUnknowTimeRangeEnd] = useState("");
  const [riskUnknowTimeRangeStart, setRiskUnknowTimeRangeStart] = useState("");
  const [riskUnknowTimeRangeEnd, setRiskUnknowTimeRangeEnd] = useState("");

  const [signalFoldSize, setSignalFoldSize] = useState("");
  const [includeIncompleteFold, setIncludeIncompleteFold] = useState(false);

  // Derived per-active-stage accessors
  const hyperoptType = pickByStage(activeStage, {
    signal: signalHyperoptType,
    entry: entryHyperoptType,
    exit: exitHyperoptType,
    risk: riskHyperoptType,
  });
  const setHyperoptType = pickByStage(activeStage, {
    signal: setSignalHyperoptType,
    entry: setEntryHyperoptType,
    exit: setExitHyperoptType,
    risk: setRiskHyperoptType,
  });

  const exchange = pickByStage(activeStage, {
    signal: signalExchange,
    entry: entryExchange,
    exit: exitExchange,
    risk: riskExchange,
  });
  const setExchange = pickByStage(activeStage, {
    signal: setSignalExchange,
    entry: setEntryExchange,
    exit: setExitExchange,
    risk: setRiskExchange,
  });

  const tradingMode = pickByStage(activeStage, {
    signal: signalTradingMode,
    entry: entryTradingMode,
    exit: exitTradingMode,
    risk: riskTradingMode,
  });
  const setTradingMode = pickByStage(activeStage, {
    signal: setSignalTradingMode,
    entry: setEntryTradingMode,
    exit: setExitTradingMode,
    risk: setRiskTradingMode,
  });

  const syntheticDataset = pickByStage(activeStage, {
    signal: signalSyntheticDataset,
    entry: entrySyntheticDataset,
    exit: exitSyntheticDataset,
    risk: riskSyntheticDataset,
  });
  const setSyntheticDataset = pickByStage(activeStage, {
    signal: setSignalSyntheticDataset,
    entry: setEntrySyntheticDataset,
    exit: setExitSyntheticDataset,
    risk: setRiskSyntheticDataset,
  });

  const maxPossibleStd = pickByStage(activeStage, {
    signal: signalMaxPossibleStd,
    entry: entryMaxPossibleStd,
    exit: exitMaxPossibleStd,
    risk: riskMaxPossibleStd,
  });
  const setMaxPossibleStd = pickByStage(activeStage, {
    signal: setSignalMaxPossibleStd,
    entry: setEntryMaxPossibleStd,
    exit: setExitMaxPossibleStd,
    risk: setRiskMaxPossibleStd,
  });

  const unknowTimeRangeStart = pickByStage(activeStage, {
    signal: signalUnknowTimeRangeStart,
    entry: entryUnknowTimeRangeStart,
    exit: exitUnknowTimeRangeStart,
    risk: riskUnknowTimeRangeStart,
  });
  const setUnknowTimeRangeStart = pickByStage(activeStage, {
    signal: setSignalUnknowTimeRangeStart,
    entry: setEntryUnknowTimeRangeStart,
    exit: setExitUnknowTimeRangeStart,
    risk: setRiskUnknowTimeRangeStart,
  });

  const unknowTimeRangeEnd = pickByStage(activeStage, {
    signal: signalUnknowTimeRangeEnd,
    entry: entryUnknowTimeRangeEnd,
    exit: exitUnknowTimeRangeEnd,
    risk: riskUnknowTimeRangeEnd,
  });
  const setUnknowTimeRangeEnd = pickByStage(activeStage, {
    signal: setSignalUnknowTimeRangeEnd,
    entry: setEntryUnknowTimeRangeEnd,
    exit: setExitUnknowTimeRangeEnd,
    risk: setRiskUnknowTimeRangeEnd,
  });

  return {
    // Per-stage derived
    hyperoptType,
    setHyperoptType,
    exchange,
    setExchange,
    tradingMode,
    setTradingMode,
    syntheticDataset,
    setSyntheticDataset,
    maxPossibleStd,
    setMaxPossibleStd,
    unknowTimeRangeStart,
    setUnknowTimeRangeStart,
    unknowTimeRangeEnd,
    setUnknowTimeRangeEnd,
    // Signal-only (fold)
    signalFoldSize,
    setSignalFoldSize,
    includeIncompleteFold,
    setIncludeIncompleteFold,
    // Per-stage raw (needed for template preview / meta save)
    signalHyperoptType,
    entryHyperoptType,
    exitHyperoptType,
    riskHyperoptType,
  };
}

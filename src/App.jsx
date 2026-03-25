import React, { memo, useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import Editor from "@monaco-editor/react";

// Import constants from separate files
import { cx, ui } from "./constants/ui";
import { SECTIONS, DISABLED_SECTIONS, PAIR_OPTIONS, TIME_RANGES, INITIAL_STRATEGIES, MOCK_OPTIMIZATION_RUNS } from "./constants/app";
import { SOURCE_OPTIONS, MA_TYPES, INDICATOR_GROUPS, BASE_INDICATORS } from "./constants/indicators";
import { HEATMAP_FILTER_KEYS, FILTER_OPERATIONS } from "./constants/heatmap";
import {
  FINAL_SCORE_FORMULA_OPTIONS,
  METRIC_FORMULA_OPTIONS,
  HYPEROPT_DETAILS_TOOLTIP_TEXT,
  DEFAULT_FORMULA_CODE,
  DEFAULT_FINAL_SCORE_FORMULA,
  DEFAULT_FINAL_SCORE_FORMULA_WITH_STABILITY,
  DEFAULT_STABILITY_FORMULA,
  DEFAULT_STABILITY_BLOCK_FORMULA,
  DEFAULT_MFE_FORMULA,
  DEFAULT_MAE_FORMULA,
  DEFAULT_AIR_FORMULA,
  DEFAULT_HITRATE_FORMULA,
  DEFAULT_INT_NORM_MFE,
  DEFAULT_INT_NORM_MAE,
  DEFAULT_INT_NORM_AIR,
  DEFAULT_INT_NORM_HITRATE,
  STABILITY_NORM_DIFF_DEFAULTS,
  INTERMEDIATE_SCORE_CODE_BY_TEMPLATE,
  FINAL_SCORE_CODE_BY_TEMPLATE,
  INTERMEDIATE_METRIC_FORMULA_CODE_BY_TEMPLATE,
  STABILITY_NORM_DIFF_FORMULA_CODE_BY_TEMPLATE,
  METRIC_FORMULA_CODE_BY_TEMPLATE,
  FORMULA_EDITOR_VARIABLES,
  FORMULA_EDITOR_FUNCTIONS,
  FORMULA_EDITOR_OPERATORS,
  FORMULA_MODAL_VARIABLES,
  FORMULA_MODAL_FUNCTIONS,
  FORMULA_MODAL_OPERATORS,
  FORMULA_HYPEROPT_TYPES,
  FORMULA_TYPES,
  FORMULA_SUBTYPES,
} from "./constants/formulas";
import { clamp, lerp, quantile, computeRanges, normalizeParam, buildHeatMap, formatScore, heatmapScoreToColor, HEATMAP_LEGEND_STOPS, HEATMAP_CELL_PX, HEATMAP_GAP_PX, EMPTY_CELL_BG } from "./utils/heatmap";
import { setWeightCapped } from "./utils/weights";
import { buildIndicatorSnapshot, buildSignalBestResult as buildSignalBestResultFromUtils } from "./utils/builder";
import { getParamValuesFromDef, getParamDefForCompositeKey, getParamLabel, getReportParamLabel, getIndicatorTemplate } from "./utils/indicators";
import { generatePythonCode } from "./utils/pythonCode";
import { generateMockResults } from "./utils/mockResults";
import { useOutsideClose } from "./hooks/useOutsideClose";
import { Logo, Badge, MoreIcon, EyeIcon, MenuIcon, ModalShell } from "./components/common";
import { LoginScreen, ForgotPasswordModal } from "./components/auth";
import { Header } from "./components/shared";
import { CreateStrategyModal, EditDescriptionModal, StrategyRow } from "./components/strategies";
import { GenerateReportModal } from "./components/report";
import { HeatMapView, HeatMapConfigurator, PairsDropdown, HeatMapGrid, HyperoptDetailsTooltip } from "./components/heatmap";
import { FormulaActionsMenu } from "./components/formulas";
import { UserActionsMenu, CreateUserModal, EditUserModal, ChangePasswordModal, ResetPasswordModal } from "./components/users";
import { IndicatorActionsMenu, AddIndicatorPageModal } from "./components/indicators";
import {
  StageIcon,
  IndicatorLibrary,
  IndicatorItem,
  AddIndicatorModal,
  EditIndicatorModal,
  CollapsibleSelect,
  TableBasedEditor,
  FormulaEditor,
  CodeEditor,
} from "./features/builder/components";
import { getDefaultDisplayName, formatIndicatorSnapshot } from "./features/builder/utils/indicatorHelpers";

/**
 * Quant Sandbox CRM Mock — Properly structured React app
 * - Login + Forgot Password (mock)
 * - Header navigation (Backtesting disabled, Users available)
 * - Strategies list (expand versions)
 * - Strategy detail (tabs: Strategy Builder / Strategy Code)
 * - Edit version description modal
 * - Builder: Run Optimization + Optimization Runs table + row-details HeatMap
 * 
 * Structure:
 * - constants/ - All app constants and configurations
 * - App.jsx - Main application logic and components
 */

/* ====================== HeatMap Configuration (imported from components/heatmap) ====================== */

const BuilderStepper = memo(function BuilderStepper({
  activeStage,
  onStageChange,
  pairs,
  onPairsChange,
  timeRange,
  onTimeRangeChange,
  timeFrameStart,
  onTimeFrameStartChange,
  timeFrameEnd,
  onTimeFrameEndChange,
  hyperoptRun,
  onHyperoptRunChange,
}) {
  // Indicators state (separate for Signal and Entry)
  const [signalIndicators, setSignalIndicators] = useState([]);
  const [entryIndicators, setEntryIndicators] = useState([]);
  const isEntryStage = activeStage === 2;
  const indicators = isEntryStage ? entryIndicators : signalIndicators;
  const setIndicators = isEntryStage ? setEntryIndicators : setSignalIndicators;
  const [editingIndicator, setEditingIndicator] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addModalType, setAddModalType] = useState("RSI");
  const [libraryQuery, setLibraryQuery] = useState("");
  const [libraryGroup, setLibraryGroup] = useState("All");
  const [selectedTab, setSelectedTab] = useState("list"); // list or code

  // Total combinations from indicator params (product of param value counts per enabled indicator)
  const totalCombinations = useMemo(() => {
    if (indicators.length === 0) return 0;
    return indicators.reduce((product, ind) => {
      if (!ind.enabled || !Array.isArray(ind.params)) return product;
      const perIndicator = ind.params.reduce((p, param) => p * getParamValuesFromDef(param).length, 1);
      return product * Math.max(1, perIndicator);
    }, 1);
  }, [indicators]);
  
  // Hyperoptimization progress
  const [isRunningOptimization, setIsRunningOptimization] = useState(false);
  const [optimizationProgress, setOptimizationProgress] = useState(0);
  // Technical params (Market / Technical blocks)
  const [signalMaxPossibleStd, setSignalMaxPossibleStd] = useState("");
  const [entryMaxPossibleStd, setEntryMaxPossibleStd] = useState("");
  const [signalUnknowTimeRangeStart, setSignalUnknowTimeRangeStart] = useState("");
  const [signalUnknowTimeRangeEnd, setSignalUnknowTimeRangeEnd] = useState("");
  const [entryUnknowTimeRangeStart, setEntryUnknowTimeRangeStart] = useState("");
  const [entryUnknowTimeRangeEnd, setEntryUnknowTimeRangeEnd] = useState("");
  const [signalHyperoptType, setSignalHyperoptType] = useState("BIAS");
  const [entryHyperoptType, setEntryHyperoptType] = useState("BIAS");
  const maxPossibleStd = isEntryStage ? entryMaxPossibleStd : signalMaxPossibleStd;
  const setMaxPossibleStd = isEntryStage ? setEntryMaxPossibleStd : setSignalMaxPossibleStd;
  const unknowTimeRangeStart = isEntryStage ? entryUnknowTimeRangeStart : signalUnknowTimeRangeStart;
  const setUnknowTimeRangeStart = isEntryStage ? setEntryUnknowTimeRangeStart : setSignalUnknowTimeRangeStart;
  const unknowTimeRangeEnd = isEntryStage ? entryUnknowTimeRangeEnd : signalUnknowTimeRangeEnd;
  const setUnknowTimeRangeEnd = isEntryStage ? setEntryUnknowTimeRangeEnd : setSignalUnknowTimeRangeEnd;
  const hyperoptType = isEntryStage ? entryHyperoptType : signalHyperoptType;
  const setHyperoptType = isEntryStage ? setEntryHyperoptType : setSignalHyperoptType;
  // Best results are tracked only for Signal stage
  const [signalBestResults, setSignalBestResults] = useState([]);
  const [selectedBestResult, setSelectedBestResult] = useState(null);
  const [showBestResultDetailsModal, setShowBestResultDetailsModal] = useState(false);
  const [showAddBestResultModal, setShowAddBestResultModal] = useState(false);
  const [manualBestResultSelectionKey, setManualBestResultSelectionKey] = useState("");
  const [signalBestCandidates, setSignalBestCandidates] = useState([]);
  
  // Normalization formulas: Intermediate + Final (tables shown after dropdown selection)
  const [signalIntermediateScoreFormula, setSignalIntermediateScoreFormula] = useState("Base formula");
  const [signalFinalScoreFormula, setSignalFinalScoreFormula] = useState("Base formula");
  const [entryIntermediateScoreFormula, setEntryIntermediateScoreFormula] = useState("Base formula");
  const [entryFinalScoreFormula, setEntryFinalScoreFormula] = useState("Base formula");
  const intermediateScoreFormula = isEntryStage ? entryIntermediateScoreFormula : signalIntermediateScoreFormula;
  const setIntermediateScoreFormula = isEntryStage ? setEntryIntermediateScoreFormula : setSignalIntermediateScoreFormula;
  const finalScoreFormula = isEntryStage ? entryFinalScoreFormula : signalFinalScoreFormula;
  const setFinalScoreFormula = isEntryStage ? setEntryFinalScoreFormula : setSignalFinalScoreFormula;
  // Intermediate metrics table (after user selects Normalization global formula)
  const [signalIntMfeFormula, setSignalIntMfeFormula] = useState("Formula 1");
  const [signalIntMaeFormula, setSignalIntMaeFormula] = useState("Formula 1");
  const [signalIntAirFormula, setSignalIntAirFormula] = useState("Formula 1");
  const [signalIntHitRateFormula, setSignalIntHitRateFormula] = useState("Formula 1");
  const [signalIntMfeFormulaCode, setSignalIntMfeFormulaCode] = useState(DEFAULT_FORMULA_CODE);
  const [signalIntMaeFormulaCode, setSignalIntMaeFormulaCode] = useState(DEFAULT_FORMULA_CODE);
  const [signalIntAirFormulaCode, setSignalIntAirFormulaCode] = useState(DEFAULT_FORMULA_CODE);
  const [signalIntHitRateFormulaCode, setSignalIntHitRateFormulaCode] = useState(DEFAULT_FORMULA_CODE);
  const [signalIntMfeWeight, setSignalIntMfeWeight] = useState(0);
  const [signalIntMaeWeight, setSignalIntMaeWeight] = useState(0);
  const [signalIntAirWeight, setSignalIntAirWeight] = useState(0);
  const [signalIntHitRateWeight, setSignalIntHitRateWeight] = useState(0);

  const [entryIntMfeFormula, setEntryIntMfeFormula] = useState("Formula 1");
  const [entryIntMaeFormula, setEntryIntMaeFormula] = useState("Formula 1");
  const [entryIntAirFormula, setEntryIntAirFormula] = useState("Formula 1");
  const [entryIntHitRateFormula, setEntryIntHitRateFormula] = useState("Formula 1");
  const [entryIntMfeFormulaCode, setEntryIntMfeFormulaCode] = useState(DEFAULT_FORMULA_CODE);
  const [entryIntMaeFormulaCode, setEntryIntMaeFormulaCode] = useState(DEFAULT_FORMULA_CODE);
  const [entryIntAirFormulaCode, setEntryIntAirFormulaCode] = useState(DEFAULT_FORMULA_CODE);
  const [entryIntHitRateFormulaCode, setEntryIntHitRateFormulaCode] = useState(DEFAULT_FORMULA_CODE);
  const [entryIntMfeWeight, setEntryIntMfeWeight] = useState(0);
  const [entryIntMaeWeight, setEntryIntMaeWeight] = useState(0);
  const [entryIntAirWeight, setEntryIntAirWeight] = useState(0);
  const [entryIntHitRateWeight, setEntryIntHitRateWeight] = useState(0);

  const intMfeFormula = isEntryStage ? entryIntMfeFormula : signalIntMfeFormula;
  const setIntMfeFormula = isEntryStage ? setEntryIntMfeFormula : setSignalIntMfeFormula;
  const intMaeFormula = isEntryStage ? entryIntMaeFormula : signalIntMaeFormula;
  const setIntMaeFormula = isEntryStage ? setEntryIntMaeFormula : setSignalIntMaeFormula;
  const intAirFormula = isEntryStage ? entryIntAirFormula : signalIntAirFormula;
  const setIntAirFormula = isEntryStage ? setEntryIntAirFormula : setSignalIntAirFormula;
  const intHitRateFormula = isEntryStage ? entryIntHitRateFormula : signalIntHitRateFormula;
  const setIntHitRateFormula = isEntryStage ? setEntryIntHitRateFormula : setSignalIntHitRateFormula;
  const intMfeFormulaCode = isEntryStage ? entryIntMfeFormulaCode : signalIntMfeFormulaCode;
  const setIntMfeFormulaCode = isEntryStage ? setEntryIntMfeFormulaCode : setSignalIntMfeFormulaCode;
  const intMaeFormulaCode = isEntryStage ? entryIntMaeFormulaCode : signalIntMaeFormulaCode;
  const setIntMaeFormulaCode = isEntryStage ? setEntryIntMaeFormulaCode : setSignalIntMaeFormulaCode;
  const intAirFormulaCode = isEntryStage ? entryIntAirFormulaCode : signalIntAirFormulaCode;
  const setIntAirFormulaCode = isEntryStage ? setEntryIntAirFormulaCode : setSignalIntAirFormulaCode;
  const intHitRateFormulaCode = isEntryStage ? entryIntHitRateFormulaCode : signalIntHitRateFormulaCode;
  const setIntHitRateFormulaCode = isEntryStage ? setEntryIntHitRateFormulaCode : setSignalIntHitRateFormulaCode;
  const intMfeWeight = isEntryStage ? entryIntMfeWeight : signalIntMfeWeight;
  const setIntMfeWeight = isEntryStage ? setEntryIntMfeWeight : setSignalIntMfeWeight;
  const intMaeWeight = isEntryStage ? entryIntMaeWeight : signalIntMaeWeight;
  const setIntMaeWeight = isEntryStage ? setEntryIntMaeWeight : setSignalIntMaeWeight;
  const intAirWeight = isEntryStage ? entryIntAirWeight : signalIntAirWeight;
  const setIntAirWeight = isEntryStage ? setEntryIntAirWeight : setSignalIntAirWeight;
  const intHitRateWeight = isEntryStage ? entryIntHitRateWeight : signalIntHitRateWeight;
  const setIntHitRateWeight = isEntryStage ? setEntryIntHitRateWeight : setSignalIntHitRateWeight;
  const intWeightsSum = intMfeWeight + intMaeWeight + intAirWeight + intHitRateWeight;
  // Final metrics table (after user selects Final Score Formula): 5 rows, Stability row has 4 sub-weights
  const [signalFinStabilityFormula, setSignalFinStabilityFormula] = useState("Formula 1");
  const [signalFinStabilityBlockFormula, setSignalFinStabilityBlockFormula] = useState("Formula 1");
  const [signalFinStabilityBlockFormulaCode, setSignalFinStabilityBlockFormulaCode] = useState(DEFAULT_STABILITY_BLOCK_FORMULA);
  const [signalFinMfeFormula, setSignalFinMfeFormula] = useState("Formula 1");
  const [signalFinMaeFormula, setSignalFinMaeFormula] = useState("Formula 1");
  const [signalFinAirFormula, setSignalFinAirFormula] = useState("Formula 1");
  const [signalFinHitRateFormula, setSignalFinHitRateFormula] = useState("Formula 1");
  const [signalFinFinalFormulaCode, setSignalFinFinalFormulaCode] = useState(DEFAULT_FINAL_SCORE_FORMULA_WITH_STABILITY);
  const [signalFinStabilityFormulaCode, setSignalFinStabilityFormulaCode] = useState(DEFAULT_STABILITY_FORMULA);
  const [signalFinMfeFormulaCode, setSignalFinMfeFormulaCode] = useState(DEFAULT_MFE_FORMULA);
  const [signalFinMaeFormulaCode, setSignalFinMaeFormulaCode] = useState(DEFAULT_MAE_FORMULA);
  const [signalFinAirFormulaCode, setSignalFinAirFormulaCode] = useState(DEFAULT_AIR_FORMULA);
  const [signalFinHitRateFormulaCode, setSignalFinHitRateFormulaCode] = useState(DEFAULT_HITRATE_FORMULA);
  const [signalFinStabMfeWeight, setSignalFinStabMfeWeight] = useState(0);
  const [signalFinStabMaeWeight, setSignalFinStabMaeWeight] = useState(0);
  const [signalFinStabAirWeight, setSignalFinStabAirWeight] = useState(0);
  const [signalFinStabHitRateWeight, setSignalFinStabHitRateWeight] = useState(0);
  const [signalFinStabilityWeight, setSignalFinStabilityWeight] = useState(0);
  const [signalFinMfeWeight, setSignalFinMfeWeight] = useState(0);
  const [signalFinMaeWeight, setSignalFinMaeWeight] = useState(0);
  const [signalFinAirWeight, setSignalFinAirWeight] = useState(0);
  const [signalFinHitRateWeight, setSignalFinHitRateWeight] = useState(0);

  const [entryFinStabilityFormula, setEntryFinStabilityFormula] = useState("Formula 1");
  const [entryFinStabilityBlockFormula, setEntryFinStabilityBlockFormula] = useState("Formula 1");
  const [entryFinStabilityBlockFormulaCode, setEntryFinStabilityBlockFormulaCode] = useState(DEFAULT_STABILITY_BLOCK_FORMULA);
  const [entryFinMfeFormula, setEntryFinMfeFormula] = useState("Formula 1");
  const [entryFinMaeFormula, setEntryFinMaeFormula] = useState("Formula 1");
  const [entryFinAirFormula, setEntryFinAirFormula] = useState("Formula 1");
  const [entryFinHitRateFormula, setEntryFinHitRateFormula] = useState("Formula 1");

  const [intermediateBlockScoreFormula, setIntermediateBlockScoreFormula] = useState("Base formula");
  const [intermediateBlockScoreFormulaCode, setIntermediateBlockScoreFormulaCode] = useState(DEFAULT_FINAL_SCORE_FORMULA);
  const [signalIntNormMfeFormula, setSignalIntNormMfeFormula] = useState("Formula 1");
  const [signalIntNormMfeFormulaCode, setSignalIntNormMfeFormulaCode] = useState(DEFAULT_INT_NORM_MFE);
  const [signalIntNormMaeFormula, setSignalIntNormMaeFormula] = useState("Formula 1");
  const [signalIntNormMaeFormulaCode, setSignalIntNormMaeFormulaCode] = useState(DEFAULT_INT_NORM_MAE);
  const [signalIntNormAirFormula, setSignalIntNormAirFormula] = useState("Formula 1");
  const [signalIntNormAirFormulaCode, setSignalIntNormAirFormulaCode] = useState(DEFAULT_INT_NORM_AIR);
  const [signalIntNormHitRateFormula, setSignalIntNormHitRateFormula] = useState("Formula 1");
  const [signalIntNormHitRateFormulaCode, setSignalIntNormHitRateFormulaCode] = useState(DEFAULT_INT_NORM_HITRATE);
  const [entryIntNormMfeFormula, setEntryIntNormMfeFormula] = useState("Formula 1");
  const [entryIntNormMfeFormulaCode, setEntryIntNormMfeFormulaCode] = useState(DEFAULT_INT_NORM_MFE);
  const [entryIntNormMaeFormula, setEntryIntNormMaeFormula] = useState("Formula 1");
  const [entryIntNormMaeFormulaCode, setEntryIntNormMaeFormulaCode] = useState(DEFAULT_INT_NORM_MAE);
  const [entryIntNormAirFormula, setEntryIntNormAirFormula] = useState("Formula 1");
  const [entryIntNormAirFormulaCode, setEntryIntNormAirFormulaCode] = useState(DEFAULT_INT_NORM_AIR);
  const [entryIntNormHitRateFormula, setEntryIntNormHitRateFormula] = useState("Formula 1");
  const [entryIntNormHitRateFormulaCode, setEntryIntNormHitRateFormulaCode] = useState(DEFAULT_INT_NORM_HITRATE);
  const [entryFinFinalFormulaCode, setEntryFinFinalFormulaCode] = useState(DEFAULT_FINAL_SCORE_FORMULA_WITH_STABILITY);
  const [entryFinStabilityFormulaCode, setEntryFinStabilityFormulaCode] = useState(DEFAULT_STABILITY_FORMULA);
  const [entryFinMfeFormulaCode, setEntryFinMfeFormulaCode] = useState(DEFAULT_MFE_FORMULA);
  const [entryFinMaeFormulaCode, setEntryFinMaeFormulaCode] = useState(DEFAULT_MAE_FORMULA);
  const [entryFinAirFormulaCode, setEntryFinAirFormulaCode] = useState(DEFAULT_AIR_FORMULA);
  const [entryFinHitRateFormulaCode, setEntryFinHitRateFormulaCode] = useState(DEFAULT_HITRATE_FORMULA);
  const [entryFinStabMfeWeight, setEntryFinStabMfeWeight] = useState(0);
  const [entryFinStabMaeWeight, setEntryFinStabMaeWeight] = useState(0);
  const [entryFinStabAirWeight, setEntryFinStabAirWeight] = useState(0);
  const [entryFinStabHitRateWeight, setEntryFinStabHitRateWeight] = useState(0);
  const [entryFinStabilityWeight, setEntryFinStabilityWeight] = useState(0);
  const [entryFinMfeWeight, setEntryFinMfeWeight] = useState(0);
  const [entryFinMaeWeight, setEntryFinMaeWeight] = useState(0);
  const [entryFinAirWeight, setEntryFinAirWeight] = useState(0);
  const [entryFinHitRateWeight, setEntryFinHitRateWeight] = useState(0);
  const [signalFinStabDiffMfeFormula, setSignalFinStabDiffMfeFormula] = useState("Formula 1");
  const [signalFinStabDiffMfeFormulaCode, setSignalFinStabDiffMfeFormulaCode] = useState(STABILITY_NORM_DIFF_DEFAULTS.normDiffMFE);
  const [signalFinStabDiffMfeWeight, setSignalFinStabDiffMfeWeight] = useState(0);
  const [signalFinStabDiffMaeFormula, setSignalFinStabDiffMaeFormula] = useState("Formula 1");
  const [signalFinStabDiffMaeFormulaCode, setSignalFinStabDiffMaeFormulaCode] = useState(STABILITY_NORM_DIFF_DEFAULTS.normDiffMAE);
  const [signalFinStabDiffMaeWeight, setSignalFinStabDiffMaeWeight] = useState(0);
  const [signalFinStabDiffAirFormula, setSignalFinStabDiffAirFormula] = useState("Formula 1");
  const [signalFinStabDiffAirFormulaCode, setSignalFinStabDiffAirFormulaCode] = useState(STABILITY_NORM_DIFF_DEFAULTS.normDiffAIR);
  const [signalFinStabDiffAirWeight, setSignalFinStabDiffAirWeight] = useState(0);
  const [signalFinStabDiffHitRateFormula, setSignalFinStabDiffHitRateFormula] = useState("Formula 1");
  const [signalFinStabDiffHitRateFormulaCode, setSignalFinStabDiffHitRateFormulaCode] = useState(STABILITY_NORM_DIFF_DEFAULTS.normDiffHitRate);
  const [signalFinStabDiffHitRateWeight, setSignalFinStabDiffHitRateWeight] = useState(0);
  const [signalFinStabDiffStdFormula, setSignalFinStabDiffStdFormula] = useState("Formula 1");
  const [signalFinStabDiffStdFormulaCode, setSignalFinStabDiffStdFormulaCode] = useState(STABILITY_NORM_DIFF_DEFAULTS.normDiffStd);
  const [signalFinStabDiffStdWeight, setSignalFinStabDiffStdWeight] = useState(0);
  const [entryFinStabDiffMfeFormula, setEntryFinStabDiffMfeFormula] = useState("Formula 1");
  const [entryFinStabDiffMfeFormulaCode, setEntryFinStabDiffMfeFormulaCode] = useState(STABILITY_NORM_DIFF_DEFAULTS.normDiffMFE);
  const [entryFinStabDiffMfeWeight, setEntryFinStabDiffMfeWeight] = useState(0);
  const [entryFinStabDiffMaeFormula, setEntryFinStabDiffMaeFormula] = useState("Formula 1");
  const [entryFinStabDiffMaeFormulaCode, setEntryFinStabDiffMaeFormulaCode] = useState(STABILITY_NORM_DIFF_DEFAULTS.normDiffMAE);
  const [entryFinStabDiffMaeWeight, setEntryFinStabDiffMaeWeight] = useState(0);
  const [entryFinStabDiffAirFormula, setEntryFinStabDiffAirFormula] = useState("Formula 1");
  const [entryFinStabDiffAirFormulaCode, setEntryFinStabDiffAirFormulaCode] = useState(STABILITY_NORM_DIFF_DEFAULTS.normDiffAIR);
  const [entryFinStabDiffAirWeight, setEntryFinStabDiffAirWeight] = useState(0);
  const [entryFinStabDiffHitRateFormula, setEntryFinStabDiffHitRateFormula] = useState("Formula 1");
  const [entryFinStabDiffHitRateFormulaCode, setEntryFinStabDiffHitRateFormulaCode] = useState(STABILITY_NORM_DIFF_DEFAULTS.normDiffHitRate);
  const [entryFinStabDiffHitRateWeight, setEntryFinStabDiffHitRateWeight] = useState(0);
  const [entryFinStabDiffStdFormula, setEntryFinStabDiffStdFormula] = useState("Formula 1");
  const [entryFinStabDiffStdFormulaCode, setEntryFinStabDiffStdFormulaCode] = useState(STABILITY_NORM_DIFF_DEFAULTS.normDiffStd);
  const [entryFinStabDiffStdWeight, setEntryFinStabDiffStdWeight] = useState(0);

  const finStabilityFormula = isEntryStage ? entryFinStabilityFormula : signalFinStabilityFormula;
  const setFinStabilityFormula = isEntryStage ? setEntryFinStabilityFormula : setSignalFinStabilityFormula;
  const finStabilityBlockFormula = isEntryStage ? entryFinStabilityBlockFormula : signalFinStabilityBlockFormula;
  const setFinStabilityBlockFormula = isEntryStage ? setEntryFinStabilityBlockFormula : setSignalFinStabilityBlockFormula;
  const finStabilityBlockFormulaCode = isEntryStage ? entryFinStabilityBlockFormulaCode : signalFinStabilityBlockFormulaCode;
  const setFinStabilityBlockFormulaCode = isEntryStage ? setEntryFinStabilityBlockFormulaCode : setSignalFinStabilityBlockFormulaCode;
  const finMfeFormula = isEntryStage ? entryFinMfeFormula : signalFinMfeFormula;
  const setFinMfeFormula = isEntryStage ? setEntryFinMfeFormula : setSignalFinMfeFormula;
  const finMaeFormula = isEntryStage ? entryFinMaeFormula : signalFinMaeFormula;
  const setFinMaeFormula = isEntryStage ? setEntryFinMaeFormula : setSignalFinMaeFormula;
  const finAirFormula = isEntryStage ? entryFinAirFormula : signalFinAirFormula;
  const setFinAirFormula = isEntryStage ? setEntryFinAirFormula : setSignalFinAirFormula;
  const finHitRateFormula = isEntryStage ? entryFinHitRateFormula : signalFinHitRateFormula;
  const setFinHitRateFormula = isEntryStage ? setEntryFinHitRateFormula : setSignalFinHitRateFormula;
  const finFinalFormulaCode = isEntryStage ? entryFinFinalFormulaCode : signalFinFinalFormulaCode;
  const setFinFinalFormulaCode = isEntryStage ? setEntryFinFinalFormulaCode : setSignalFinFinalFormulaCode;
  const finStabilityFormulaCode = isEntryStage ? entryFinStabilityFormulaCode : signalFinStabilityFormulaCode;
  const setFinStabilityFormulaCode = isEntryStage ? setEntryFinStabilityFormulaCode : setSignalFinStabilityFormulaCode;
  const finMfeFormulaCode = isEntryStage ? entryFinMfeFormulaCode : signalFinMfeFormulaCode;
  const setFinMfeFormulaCode = isEntryStage ? setEntryFinMfeFormulaCode : setSignalFinMfeFormulaCode;
  const finMaeFormulaCode = isEntryStage ? entryFinMaeFormulaCode : signalFinMaeFormulaCode;
  const setFinMaeFormulaCode = isEntryStage ? setEntryFinMaeFormulaCode : setSignalFinMaeFormulaCode;
  const finAirFormulaCode = isEntryStage ? entryFinAirFormulaCode : signalFinAirFormulaCode;
  const setFinAirFormulaCode = isEntryStage ? setEntryFinAirFormulaCode : setSignalFinAirFormulaCode;
  const finHitRateFormulaCode = isEntryStage ? entryFinHitRateFormulaCode : signalFinHitRateFormulaCode;
  const setFinHitRateFormulaCode = isEntryStage ? setEntryFinHitRateFormulaCode : setSignalFinHitRateFormulaCode;
  const finStabMfeWeight = isEntryStage ? entryFinStabMfeWeight : signalFinStabMfeWeight;
  const setFinStabMfeWeight = isEntryStage ? setEntryFinStabMfeWeight : setSignalFinStabMfeWeight;
  const finStabMaeWeight = isEntryStage ? entryFinStabMaeWeight : signalFinStabMaeWeight;
  const setFinStabMaeWeight = isEntryStage ? setEntryFinStabMaeWeight : setSignalFinStabMaeWeight;
  const finStabAirWeight = isEntryStage ? entryFinStabAirWeight : signalFinStabAirWeight;
  const setFinStabAirWeight = isEntryStage ? setEntryFinStabAirWeight : setSignalFinStabAirWeight;
  const finStabHitRateWeight = isEntryStage ? entryFinStabHitRateWeight : signalFinStabHitRateWeight;
  const setFinStabHitRateWeight = isEntryStage ? setEntryFinStabHitRateWeight : setSignalFinStabHitRateWeight;
  const finStabilityWeight = isEntryStage ? entryFinStabilityWeight : signalFinStabilityWeight;
  const setFinStabilityWeight = isEntryStage ? setEntryFinStabilityWeight : setSignalFinStabilityWeight;
  const finMfeWeight = isEntryStage ? entryFinMfeWeight : signalFinMfeWeight;
  const setFinMfeWeight = isEntryStage ? setEntryFinMfeWeight : setSignalFinMfeWeight;
  const finMaeWeight = isEntryStage ? entryFinMaeWeight : signalFinMaeWeight;
  const setFinMaeWeight = isEntryStage ? setEntryFinMaeWeight : setSignalFinMaeWeight;
  const finAirWeight = isEntryStage ? entryFinAirWeight : signalFinAirWeight;
  const setFinAirWeight = isEntryStage ? setEntryFinAirWeight : setSignalFinAirWeight;
  const finHitRateWeight = isEntryStage ? entryFinHitRateWeight : signalFinHitRateWeight;
  const setFinHitRateWeight = isEntryStage ? setEntryFinHitRateWeight : setSignalFinHitRateWeight;
  const finStabWeightsSum = finStabMfeWeight + finStabMaeWeight + finStabAirWeight + finStabHitRateWeight;
  const finWeightsSum = finStabilityWeight + finMfeWeight + finMaeWeight + finAirWeight + finHitRateWeight;
  const finStabDiffMfeFormula = isEntryStage ? entryFinStabDiffMfeFormula : signalFinStabDiffMfeFormula;
  const setFinStabDiffMfeFormula = isEntryStage ? setEntryFinStabDiffMfeFormula : setSignalFinStabDiffMfeFormula;
  const finStabDiffMfeFormulaCode = isEntryStage ? entryFinStabDiffMfeFormulaCode : signalFinStabDiffMfeFormulaCode;
  const setFinStabDiffMfeFormulaCode = isEntryStage ? setEntryFinStabDiffMfeFormulaCode : setSignalFinStabDiffMfeFormulaCode;
  const finStabDiffMfeWeight = isEntryStage ? entryFinStabDiffMfeWeight : signalFinStabDiffMfeWeight;
  const setFinStabDiffMfeWeight = isEntryStage ? setEntryFinStabDiffMfeWeight : setSignalFinStabDiffMfeWeight;
  const finStabDiffMaeFormula = isEntryStage ? entryFinStabDiffMaeFormula : signalFinStabDiffMaeFormula;
  const setFinStabDiffMaeFormula = isEntryStage ? setEntryFinStabDiffMaeFormula : setSignalFinStabDiffMaeFormula;
  const finStabDiffMaeFormulaCode = isEntryStage ? entryFinStabDiffMaeFormulaCode : signalFinStabDiffMaeFormulaCode;
  const setFinStabDiffMaeFormulaCode = isEntryStage ? setEntryFinStabDiffMaeFormulaCode : setSignalFinStabDiffMaeFormulaCode;
  const finStabDiffMaeWeight = isEntryStage ? entryFinStabDiffMaeWeight : signalFinStabDiffMaeWeight;
  const setFinStabDiffMaeWeight = isEntryStage ? setEntryFinStabDiffMaeWeight : setSignalFinStabDiffMaeWeight;
  const finStabDiffAirFormula = isEntryStage ? entryFinStabDiffAirFormula : signalFinStabDiffAirFormula;
  const setFinStabDiffAirFormula = isEntryStage ? setEntryFinStabDiffAirFormula : setSignalFinStabDiffAirFormula;
  const finStabDiffAirFormulaCode = isEntryStage ? entryFinStabDiffAirFormulaCode : signalFinStabDiffAirFormulaCode;
  const setFinStabDiffAirFormulaCode = isEntryStage ? setEntryFinStabDiffAirFormulaCode : setSignalFinStabDiffAirFormulaCode;
  const finStabDiffAirWeight = isEntryStage ? entryFinStabDiffAirWeight : signalFinStabDiffAirWeight;
  const setFinStabDiffAirWeight = isEntryStage ? setEntryFinStabDiffAirWeight : setSignalFinStabDiffAirWeight;
  const finStabDiffHitRateFormula = isEntryStage ? entryFinStabDiffHitRateFormula : signalFinStabDiffHitRateFormula;
  const setFinStabDiffHitRateFormula = isEntryStage ? setEntryFinStabDiffHitRateFormula : setSignalFinStabDiffHitRateFormula;
  const finStabDiffHitRateFormulaCode = isEntryStage ? entryFinStabDiffHitRateFormulaCode : signalFinStabDiffHitRateFormulaCode;
  const setFinStabDiffHitRateFormulaCode = isEntryStage ? setEntryFinStabDiffHitRateFormulaCode : setSignalFinStabDiffHitRateFormulaCode;
  const finStabDiffHitRateWeight = isEntryStage ? entryFinStabDiffHitRateWeight : signalFinStabDiffHitRateWeight;
  const setFinStabDiffHitRateWeight = isEntryStage ? setEntryFinStabDiffHitRateWeight : setSignalFinStabDiffHitRateWeight;
  const finStabDiffStdFormula = isEntryStage ? entryFinStabDiffStdFormula : signalFinStabDiffStdFormula;
  const setFinStabDiffStdFormula = isEntryStage ? setEntryFinStabDiffStdFormula : setSignalFinStabDiffStdFormula;
  const finStabDiffStdFormulaCode = isEntryStage ? entryFinStabDiffStdFormulaCode : signalFinStabDiffStdFormulaCode;
  const setFinStabDiffStdFormulaCode = isEntryStage ? setEntryFinStabDiffStdFormulaCode : setSignalFinStabDiffStdFormulaCode;
  const finStabDiffStdWeight = isEntryStage ? entryFinStabDiffStdWeight : signalFinStabDiffStdWeight;
  const setFinStabDiffStdWeight = isEntryStage ? setEntryFinStabDiffStdWeight : setSignalFinStabDiffStdWeight;
  const finStabDiffWeightsSum = finStabDiffMfeWeight + finStabDiffMaeWeight + finStabDiffAirWeight + finStabDiffHitRateWeight + finStabDiffStdWeight;

  const intNormMfeFormula = isEntryStage ? entryIntNormMfeFormula : signalIntNormMfeFormula;
  const setIntNormMfeFormula = isEntryStage ? setEntryIntNormMfeFormula : setSignalIntNormMfeFormula;
  const intNormMfeFormulaCode = isEntryStage ? entryIntNormMfeFormulaCode : signalIntNormMfeFormulaCode;
  const setIntNormMfeFormulaCode = isEntryStage ? setEntryIntNormMfeFormulaCode : setSignalIntNormMfeFormulaCode;
  const intNormMaeFormula = isEntryStage ? entryIntNormMaeFormula : signalIntNormMaeFormula;
  const setIntNormMaeFormula = isEntryStage ? setEntryIntNormMaeFormula : setSignalIntNormMaeFormula;
  const intNormMaeFormulaCode = isEntryStage ? entryIntNormMaeFormulaCode : signalIntNormMaeFormulaCode;
  const setIntNormMaeFormulaCode = isEntryStage ? setEntryIntNormMaeFormulaCode : setSignalIntNormMaeFormulaCode;
  const intNormAirFormula = isEntryStage ? entryIntNormAirFormula : signalIntNormAirFormula;
  const setIntNormAirFormula = isEntryStage ? setEntryIntNormAirFormula : setSignalIntNormAirFormula;
  const intNormAirFormulaCode = isEntryStage ? entryIntNormAirFormulaCode : signalIntNormAirFormulaCode;
  const setIntNormAirFormulaCode = isEntryStage ? setEntryIntNormAirFormulaCode : setSignalIntNormAirFormulaCode;
  const intNormHitRateFormula = isEntryStage ? entryIntNormHitRateFormula : signalIntNormHitRateFormula;
  const setIntNormHitRateFormula = isEntryStage ? setEntryIntNormHitRateFormula : setSignalIntNormHitRateFormula;
  const intNormHitRateFormulaCode = isEntryStage ? entryIntNormHitRateFormulaCode : signalIntNormHitRateFormulaCode;
  const setIntNormHitRateFormulaCode = isEntryStage ? setEntryIntNormHitRateFormulaCode : setSignalIntNormHitRateFormulaCode;

  // When Entry uses the same Hyperopt type as Signal, keep Entry normalization formulas in sync and read-only
  useEffect(() => {
    if (signalHyperoptType !== entryHyperoptType) return;
    // Sync Entry intermediate formulas from Signal
    setEntryIntermediateScoreFormula(signalIntermediateScoreFormula);
    setEntryFinalScoreFormula(signalFinalScoreFormula);
    setEntryIntMfeFormula(signalIntMfeFormula);
    setEntryIntMaeFormula(signalIntMaeFormula);
    setEntryIntAirFormula(signalIntAirFormula);
    setEntryIntHitRateFormula(signalIntHitRateFormula);
    setEntryIntMfeFormulaCode(signalIntMfeFormulaCode);
    setEntryIntMaeFormulaCode(signalIntMaeFormulaCode);
    setEntryIntAirFormulaCode(signalIntAirFormulaCode);
    setEntryIntHitRateFormulaCode(signalIntHitRateFormulaCode);
    setEntryIntMfeWeight(signalIntMfeWeight);
    setEntryIntMaeWeight(signalIntMaeWeight);
    setEntryIntAirWeight(signalIntAirWeight);
    setEntryIntHitRateWeight(signalIntHitRateWeight);
    setEntryIntNormMfeFormula(signalIntNormMfeFormula);
    setEntryIntNormMfeFormulaCode(signalIntNormMfeFormulaCode);
    setEntryIntNormMaeFormula(signalIntNormMaeFormula);
    setEntryIntNormMaeFormulaCode(signalIntNormMaeFormulaCode);
    setEntryIntNormAirFormula(signalIntNormAirFormula);
    setEntryIntNormAirFormulaCode(signalIntNormAirFormulaCode);
    setEntryIntNormHitRateFormula(signalIntNormHitRateFormula);
    setEntryIntNormHitRateFormulaCode(signalIntNormHitRateFormulaCode);
    // Sync Entry final formulas from Signal
    setEntryFinStabilityFormula(signalFinStabilityFormula);
    setEntryFinStabilityBlockFormula(signalFinStabilityBlockFormula);
    setEntryFinStabilityBlockFormulaCode(signalFinStabilityBlockFormulaCode);
    setEntryFinMfeFormula(signalFinMfeFormula);
    setEntryFinMaeFormula(signalFinMaeFormula);
    setEntryFinAirFormula(signalFinAirFormula);
    setEntryFinHitRateFormula(signalFinHitRateFormula);
    setEntryFinFinalFormulaCode(signalFinFinalFormulaCode);
    setEntryFinStabilityFormulaCode(signalFinStabilityFormulaCode);
    setEntryFinMfeFormulaCode(signalFinMfeFormulaCode);
    setEntryFinMaeFormulaCode(signalFinMaeFormulaCode);
    setEntryFinAirFormulaCode(signalFinAirFormulaCode);
    setEntryFinHitRateFormulaCode(signalFinHitRateFormulaCode);
    setEntryFinStabMfeWeight(signalFinStabMfeWeight);
    setEntryFinStabMaeWeight(signalFinStabMaeWeight);
    setEntryFinStabAirWeight(signalFinStabAirWeight);
    setEntryFinStabHitRateWeight(signalFinStabHitRateWeight);
    setEntryFinStabilityWeight(signalFinStabilityWeight);
    setEntryFinMfeWeight(signalFinMfeWeight);
    setEntryFinMaeWeight(signalFinMaeWeight);
    setEntryFinAirWeight(signalFinAirWeight);
    setEntryFinHitRateWeight(signalFinHitRateWeight);
    setEntryFinStabDiffMfeFormula(signalFinStabDiffMfeFormula);
    setEntryFinStabDiffMfeFormulaCode(signalFinStabDiffMfeFormulaCode);
    setEntryFinStabDiffMfeWeight(signalFinStabDiffMfeWeight);
    setEntryFinStabDiffMaeFormula(signalFinStabDiffMaeFormula);
    setEntryFinStabDiffMaeFormulaCode(signalFinStabDiffMaeFormulaCode);
    setEntryFinStabDiffMaeWeight(signalFinStabDiffMaeWeight);
    setEntryFinStabDiffAirFormula(signalFinStabDiffAirFormula);
    setEntryFinStabDiffAirFormulaCode(signalFinStabDiffAirFormulaCode);
    setEntryFinStabDiffAirWeight(signalFinStabDiffAirWeight);
    setEntryFinStabDiffHitRateFormula(signalFinStabDiffHitRateFormula);
    setEntryFinStabDiffHitRateFormulaCode(signalFinStabDiffHitRateFormulaCode);
    setEntryFinStabDiffHitRateWeight(signalFinStabDiffHitRateWeight);
    setEntryFinStabDiffStdFormula(signalFinStabDiffStdFormula);
    setEntryFinStabDiffStdFormulaCode(signalFinStabDiffStdFormulaCode);
    setEntryFinStabDiffStdWeight(signalFinStabDiffStdWeight);
  }, [
    signalHyperoptType,
    entryHyperoptType,
    signalIntermediateScoreFormula,
    signalFinalScoreFormula,
    signalIntMfeFormula,
    signalIntMaeFormula,
    signalIntAirFormula,
    signalIntHitRateFormula,
    signalIntMfeFormulaCode,
    signalIntMaeFormulaCode,
    signalIntAirFormulaCode,
    signalIntHitRateFormulaCode,
    signalIntMfeWeight,
    signalIntMaeWeight,
    signalIntAirWeight,
    signalIntHitRateWeight,
    signalIntNormMfeFormula,
    signalIntNormMfeFormulaCode,
    signalIntNormMaeFormula,
    signalIntNormMaeFormulaCode,
    signalIntNormAirFormula,
    signalIntNormAirFormulaCode,
    signalIntNormHitRateFormula,
    signalIntNormHitRateFormulaCode,
    signalFinStabilityFormula,
    signalFinStabilityBlockFormula,
    signalFinStabilityBlockFormulaCode,
    signalFinMfeFormula,
    signalFinMaeFormula,
    signalFinAirFormula,
    signalFinHitRateFormula,
    signalFinFinalFormulaCode,
    signalFinStabilityFormulaCode,
    signalFinMfeFormulaCode,
    signalFinMaeFormulaCode,
    signalFinAirFormulaCode,
    signalFinHitRateFormulaCode,
    signalFinStabMfeWeight,
    signalFinStabMaeWeight,
    signalFinStabAirWeight,
    signalFinStabHitRateWeight,
    signalFinStabilityWeight,
    signalFinMfeWeight,
    signalFinMaeWeight,
    signalFinAirWeight,
    signalFinHitRateWeight,
    signalFinStabDiffMfeFormula,
    signalFinStabDiffMfeFormulaCode,
    signalFinStabDiffMfeWeight,
    signalFinStabDiffMaeFormula,
    signalFinStabDiffMaeFormulaCode,
    signalFinStabDiffMaeWeight,
    signalFinStabDiffAirFormula,
    signalFinStabDiffAirFormulaCode,
    signalFinStabDiffAirWeight,
    signalFinStabDiffHitRateFormula,
    signalFinStabDiffHitRateFormulaCode,
    signalFinStabDiffHitRateWeight,
    signalFinStabDiffStdFormula,
    signalFinStabDiffStdFormulaCode,
    signalFinStabDiffStdWeight,
  ]);

  const [showFormulaEditor, setShowFormulaEditor] = useState(false);
  const [formulaEditorValue, setFormulaEditorValue] = useState("");
  const formulaEditorRef = useRef(null);
  const formulaEditorMirrorRef = useRef(null);
  const [formulaEditorSelection, setFormulaEditorSelection] = useState({ start: 0, end: 0 });

  const formulaEditorVariableRegex = useMemo(
    () => new RegExp("\\b(" + [...FORMULA_EDITOR_VARIABLES].sort((a, b) => b.length - a.length).join("|") + ")\\b", "g"),
    [],
  );
  const renderFormulaEditorWithVariables = useCallback(
    (text) => {
      if (!text) return null;
      const parts = text.split(formulaEditorVariableRegex);
      return parts.map((part, i) =>
        FORMULA_EDITOR_VARIABLES.includes(part) ? (
          <span key={i} className="text-emerald-400">
            {part}
          </span>
        ) : (
          part
        ),
      );
    },
    [formulaEditorVariableRegex],
  );
  const [formulaEditorApplyFn, setFormulaEditorApplyFn] = useState(null);

  const openFormulaEditor = useCallback((initialValue, applyFn) => {
    setFormulaEditorValue(initialValue || "");
    setFormulaEditorApplyFn(() => applyFn);
    setShowFormulaEditor(true);
  }, []);

  const handleFormulaEditorChange = useCallback((e) => {
    const { value, selectionStart, selectionEnd } = e.target;
    setFormulaEditorValue(value);
    setFormulaEditorSelection({
      start: selectionStart ?? value.length,
      end: selectionEnd ?? selectionStart ?? value.length,
    });
  }, []);

  const handleFormulaEditorSelect = useCallback((e) => {
    const { selectionStart, selectionEnd } = e.target;
    setFormulaEditorSelection({
      start: selectionStart ?? 0,
      end: selectionEnd ?? selectionStart ?? 0,
    });
  }, []);

  const insertIntoFormulaEditor = useCallback(
    (snippet) => {
      setFormulaEditorValue((prev) => {
        const textarea = formulaEditorRef.current;
        const start = textarea?.selectionStart ?? formulaEditorSelection.start ?? prev.length;
        const end = textarea?.selectionEnd ?? formulaEditorSelection.end ?? start;
        const before = prev.slice(0, start);
        const after = prev.slice(end);
        const next = `${before}${snippet}${after}`;
        const newPos = start + snippet.length;

        queueMicrotask(() => {
          const el = formulaEditorRef.current;
          if (el) {
            el.focus();
            el.selectionStart = newPos;
            el.selectionEnd = newPos;
          }
          setFormulaEditorSelection({ start: newPos, end: newPos });
        });

        return next;
      });
    },
    [formulaEditorSelection.start, formulaEditorSelection.end],
  );

  const handleFormulaEditorApply = useCallback(() => {
    if (typeof formulaEditorApplyFn === "function") {
      formulaEditorApplyFn(formulaEditorValue);
    }
    setShowFormulaEditor(false);
  }, [formulaEditorApplyFn, formulaEditorValue]);

  const handleFormulaEditorCancel = useCallback(() => {
    setShowFormulaEditor(false);
  }, []);

  const handleFormulaEditorClear = useCallback(() => {
    setFormulaEditorValue("");
    setFormulaEditorSelection({ start: 0, end: 0 });
    const el = formulaEditorRef.current;
    if (el) {
      el.focus();
      el.selectionStart = 0;
      el.selectionEnd = 0;
    }
  }, []);

  // Formula state (separate for Signal / Entry)
  const [signalFormula, setSignalFormula] = useState(`def populate_indicators(self, dataframe: pd.DataFrame, metadata: dict) -> pd.DataFrame:
    """
    Populate signals.
    Based on the following conditions:
    - Rule 1: Close > Close
    """
    # Initialize signal column
    dataframe.loc[:, 'signal'] = False
    
    # Rule 1
    condition1 = (dataframe['Close'] > dataframe['Close'])
    dataframe.loc[condition1, 'signal'] = True

    return dataframe
`);
  const [entryFormula, setEntryFormula] = useState(`# Define your entry validation signals
# Example:
IF FinalScore > 0.5 AND Stability > 0.7 THEN VALIDATE_ENTRY

# You can use:
# - Normalized metrics: FinalScore, Stability, median_MFE, median_MAE, median_AIR
# - Logic: AND, OR, NOT`);
  
  // HeatMap state
  const [showHeatMapConfig, setShowHeatMapConfig] = useState(false);
  const [heatMapConfigModalId, setHeatMapConfigModalId] = useState(null);
  const [heatMapViewModalId, setHeatMapViewModalId] = useState(null);
  const [generatedHeatMap, setGeneratedHeatMap] = useState(null);
  const [showTruncateModal, setShowTruncateModal] = useState(false);
  const [selectedNormalizationRow, setSelectedNormalizationRow] = useState(null);
  const [truncateForm, setTruncateForm] = useState({
    tEndTrunc: "",
    foldSize: "12",
  });
  const [normalizationDetailsExpanded, setNormalizationDetailsExpanded] = useState(() => new Set());
  const toggleNormalizationDetails = useCallback((id) => {
    setNormalizationDetailsExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);
  
  // Report Modal state
  const [showReportModal, setShowReportModal] = useState(false);
  // Hyperopt Results: Run normalization modal (same content as Normalization formulas block)
  const [showNormalizationModal, setShowNormalizationModal] = useState(false);
  const [normModalCollapsedSections, setNormModalCollapsedSections] = useState(() => new Set());
  const toggleNormModalSection = useCallback((key) => {
    setNormModalCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);
  const [showHyperoptDetailsModal, setShowHyperoptDetailsModal] = useState(false);
  // Hyperopt Results: which level-1 rows are expanded (collapse/expand)
  const [hyperoptResultsExpanded, setHyperoptResultsExpanded] = useState(() => new Set(["hr1", "hr2"]));
  const toggleHyperoptRow = useCallback((id) => {
    setHyperoptResultsExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);
  // Level 3 (HeatMaps & Reports) expanded per level-2 row id
  const [hyperoptLevel3Expanded, setHyperoptLevel3Expanded] = useState(() => new Set(["hr1-1", "hr1-2"]));
  const toggleHyperoptLevel3 = useCallback((id) => {
    setHyperoptLevel3Expanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);
  // Hyperopt Results three-level table data (level 1: runs; level 2: normalization results; level 3: HeatMaps & Reports)
  const [hyperoptResultsRows, setHyperoptResultsRows] = useState(() => [
    { id: "hr1", date: "2024-01-15", pairs: "BTC/USDT", timeFrame: "1h", knowRange: "2020-01-01 – 2023-06-01", unknowRange: "2023-06-01 – 2023-12-31", children: [
      { id: "hr1-1", date: "2024-01-15", minScore: "0.20", avgScore: "0.55", maxScore: "0.99", foldSize: "24", truncScores: { min: "-0.14", avg: "-0.45", max: "0.84" }, heatmapsAndReports: [
        { id: "hr1-1-h1", date: "2024-01-15", type: "Heatmap" },
        { id: "hr1-1-r1", date: "2024-01-15", type: "Report" },
      ]},
      { id: "hr1-2", date: "2024-01-16", minScore: "0.18", avgScore: "0.52", maxScore: "0.87", heatmapsAndReports: [
        { id: "hr1-2-h1", date: "2024-01-16", type: "Heatmap" },
      ]},
    ]},
    { id: "hr2", date: "2024-01-14", pairs: "ETH/USDT", timeFrame: "4h", knowRange: "2021-01-01 – 2023-09-01", unknowRange: "2023-09-01 – 2024-01-01", children: [
      { id: "hr2-1", date: "2024-01-14", minScore: "0.22", avgScore: "0.58", maxScore: "0.91", heatmapsAndReports: [
        { id: "hr2-1-h1", date: "2024-01-14", type: "Heatmap" },
        { id: "hr2-1-r1", date: "2024-01-14", type: "Report" },
      ]},
    ]},
  ]);
  
  // Collapsed sections in Strategy Builder (1–5)
  const [collapsedSections, setCollapsedSections] = useState(() => new Set());
  const toggleSection = useCallback((num) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(num)) next.delete(num);
      else next.add(num);
      return next;
    });
  }, []);
  // Collapsed subsections inside Normalization formulas (intermediate / final)
  const [collapsedNormSections, setCollapsedNormSections] = useState(() => new Set());
  const toggleNormSection = useCallback((key) => {
    setCollapsedNormSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const formulaDisplayVariableRegex = useMemo(
    () => new RegExp("\\b(" + [...FORMULA_EDITOR_VARIABLES].sort((a, b) => b.length - a.length).join("|") + ")\\b", "g"),
    [],
  );
  const renderFormulaWithVariables = useCallback(
    (code) => {
      if (!code) return null;
      const parts = code.split(formulaDisplayVariableRegex);
      return parts.map((part, i) =>
        FORMULA_EDITOR_VARIABLES.includes(part) ? (
          <span key={i} className="text-emerald-400">
            {part}
          </span>
        ) : (
          part
        )
      );
    },
    [formulaDisplayVariableRegex],
  );

  const handleAddIndicatorFromLibrary = useCallback((indicatorKey) => {
    setAddModalType(indicatorKey);
    setShowAddModal(true);
  }, []);
  
  const handleAddIndicator = useCallback((indicator) => {
    setIndicators((prev) => [...prev, { ...indicator, id: Date.now() + Math.random(), enabled: true }]);
    setShowAddModal(false);
  }, [setIndicators]);
  
  const handleEditIndicator = useCallback((updated) => {
    setIndicators(prev => prev.map(ind => ind.id === updated.id ? updated : ind));
  }, []);
  
  const handleDeleteIndicator = useCallback((id) => {
    if (confirm("Delete this indicator?")) {
      setIndicators(prev => prev.filter(ind => ind.id !== id));
      if (editingIndicator?.id === id) setEditingIndicator(null);
    }
  }, [editingIndicator]);
  
  const handleMoveIndicator = useCallback((id, direction) => {
    setIndicators(prev => {
      const idx = prev.findIndex(ind => ind.id === id);
      if (idx === -1) return prev;
      
      const newIdx = direction === "up" ? idx - 1 : idx + 1;
      if (newIdx < 0 || newIdx >= prev.length) return prev;
      
      const next = [...prev];
      [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
      return next;
    });
  }, []);
  
  const handleToggleIndicator = useCallback((id, enabled) => {
    setIndicators(prev => prev.map(ind => ind.id === id ? {...ind, enabled} : ind));
  }, []);
  
  const handleGenerateHeatMap = useCallback((config, runId) => {
    if (!config || runId == null) return;
    try {
      const fullResults = generateMockResults(config, runId);
      setGeneratedHeatMap({
        runId,
        config,
        fullResults,
        zoomStack: [],
      });
      setShowHeatMapConfig(null);
      setHeatMapConfigModalId(null);
    } catch (err) {
      console.error("HeatMap generation failed:", err);
      alert("HeatMap generation failed. Check console for details.");
    }
  }, []);

  const handleHeatMapCellClick = useCallback(
    (cell, runId) => {
      if (!cell || !cell.count) return;
      // For leaf cells (n=1) add candidate(s) for Save as Best instead of drilldown
      if (!isEntryStage && cell.count === 1 && Array.isArray(cell.results) && cell.results.length === 1) {
        const result = cell.results[0];
        const rawParams = result.params || {};
        const params = {};
        const indicatorsFromConfig = generatedHeatMap?.config?.indicators || [];
        const prettifyParamName = (raw) => {
          const s = String(raw || "").trim();
          if (!s) return "";
          const lower = s.toLowerCase();
          const m = lower.match(/^(fast|slow|signal)(?:_|-)?period$/);
          if (m) return `${m[1][0].toUpperCase()}${m[1].slice(1)}Period`;
          if (lower === "stddev" || lower === "std_dev" || lower === "std-dev") return "StdDev";
          if (lower === "timeframe" || lower === "time_frame" || lower === "time-frame") return "TimeFrame";
          const chunks = s.split(/[_-]+/g).filter(Boolean);
          const title = (w) => (w ? `${w[0].toUpperCase()}${w.slice(1)}` : w);
          const out = chunks.map((c) => title(String(c))).join("");
          return out || s;
        };

        Object.entries(rawParams).forEach(([key, value]) => {
          const parts = String(key).split("_");
          const indicatorIdPart = parts[0];
          const paramRaw = parts.length >= 2 ? parts.slice(1).join("_") : parts[0];
          const ind = indicatorsFromConfig.find((i) => String(i.id) === String(indicatorIdPart));
          const indicatorPrefix = ind ? ind.shortName || ind.displayName || ind.name || ind.type || "" : "";
          const paramName = prettifyParamName(paramRaw) || paramRaw;
          const friendlyKey = indicatorPrefix ? `${indicatorPrefix}.${paramName}` : paramName;
          params[friendlyKey] = value;
        });
        const zoomLevel = generatedHeatMap?.zoomStack?.length || 0;
        const candidateKey = `${runId}:${zoomLevel}:${cell.xi}:${cell.yi}`;
        setSignalBestCandidates((prev) => {
          if (prev.some((c) => c.key === candidateKey)) return prev;
          const score = typeof result.score === "number" ? result.score : cell.avgScore ?? null;
          const candidate = {
            id: `cand-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            key: candidateKey,
            score,
            params,
            meta: {
              runId,
              zoomLevel,
              xi: cell.xi,
              yi: cell.yi,
              count: cell.count,
            },
          };
          return [...prev, candidate];
        });
        return;
      }
      // For aggregated cells (n>1) keep drilldown behaviour
      setGeneratedHeatMap((prev) => {
        if (!prev || prev.runId !== runId || !prev.config) return prev;
        if (!cell.count || !cell.zoomRanges || !Object.keys(cell.zoomRanges).length) return prev;
        const label = `Zoom: cell (${cell.xi + 1}, ${cell.yi + 1}) • n=${cell.count}`;
        return {
          ...prev,
          zoomStack: [...prev.zoomStack, { label, zoomRanges: cell.zoomRanges }],
        };
      });
    },
    [generatedHeatMap?.zoomStack, isEntryStage],
  );

  const handleHeatMapZoomOut = useCallback((runId) => {
    setGeneratedHeatMap((prev) => {
      if (!prev || prev.runId !== runId || prev.zoomStack.length === 0) return prev;
      return { ...prev, zoomStack: prev.zoomStack.slice(0, -1) };
    });
  }, []);

  const handleHeatMapResetZoom = useCallback((runId) => {
    setGeneratedHeatMap((prev) => {
      if (!prev || prev.runId !== runId) return prev;
      return { ...prev, zoomStack: [] };
    });
  }, []);

  const heatMapZoomRanges = useMemo(() => {
    if (!generatedHeatMap?.zoomStack?.length) return null;
    return generatedHeatMap.zoomStack[generatedHeatMap.zoomStack.length - 1].zoomRanges;
  }, [generatedHeatMap?.zoomStack]);

  const currentHeatMapData = useMemo(() => {
    if (!generatedHeatMap?.fullResults || !generatedHeatMap?.config) return null;
    return buildHeatMap(generatedHeatMap.fullResults, generatedHeatMap.config, heatMapZoomRanges);
  }, [generatedHeatMap?.fullResults, generatedHeatMap?.config, heatMapZoomRanges]);
  const buildSignalBestResult = useCallback(
    (params) =>
      buildSignalBestResultFromUtils(params, {
        signalIndicators,
        pairs,
        timeRange,
        signalHyperoptType,
      }),
    [signalIndicators, pairs, timeRange, signalHyperoptType],
  );

  const handleSaveSignalBestResultFromDetail = useCallback(
    ({ row, sub, detail, source }) => {
      if (isEntryStage) return;
      if (!detail) return;
      const scores = detail.scores || null;
      setSignalBestResults((prev) => {
        const label =
          `Result #${prev.length + 1} • ${row.pairs || pairs || ""} • ${row.timeFrame || ""} • ${detail.label || ""}`.trim();
        const best = buildSignalBestResult({
          label,
          source,
          scores,
          meta: {
            rowId: row.id,
            subId: sub.id,
            detailId: detail.id,
            detailLabel: detail.label,
            date: sub.date || row.date,
          },
          timeRangeOverride: row.timeFrame,
        });
        return [...prev, best];
      });
    },
    [isEntryStage, setSignalBestResults, buildSignalBestResult, pairs],
  );
  const handleSaveSignalBestResultFromHeatMap = useCallback(() => {
    if (!heatMapViewModalId) return;
    if (isEntryStage) return;
    const id = String(heatMapViewModalId);
    const prefix = "hyperopt-";
    if (!id.startsWith(prefix)) return;
    const rest = id.slice(prefix.length);
    const dashIndex = rest.indexOf("-");
    if (dashIndex === -1) return;
    const rowId = rest.slice(0, dashIndex);
    const subId = rest.slice(dashIndex + 1);
    let foundRow = null;
    let foundSub = null;
    for (const row of hyperoptResultsRows) {
      if (row.id !== rowId) continue;
      for (const sub of row.children || []) {
        if (sub.id !== subId) continue;
        foundRow = row;
        foundSub = sub;
        break;
      }
      if (foundRow) break;
    }
    if (!foundRow || !foundSub) return;
    const detail = {
      id: `${foundSub.id}-full`,
      label: "Full data (from HeatMap)",
      scores: {
        min: foundSub.minScore,
        avg: foundSub.avgScore,
        max: foundSub.maxScore,
      },
    };
    handleSaveSignalBestResultFromDetail({
      row: foundRow,
      sub: foundSub,
      detail,
      source: "heatmap",
    });
  }, [heatMapViewModalId, isEntryStage, hyperoptResultsRows, handleSaveSignalBestResultFromDetail]);

  const handleSaveSignalBestCandidates = useCallback(() => {
    if (isEntryStage || signalBestCandidates.length === 0) return;
    let heatMapTimeFrame = null;
    if (heatMapViewModalId) {
      const id = String(heatMapViewModalId);
      const prefix = "hyperopt-";
      if (id.startsWith(prefix)) {
        const rest = id.slice(prefix.length);
        const dashIndex = rest.indexOf("-");
        if (dashIndex !== -1) {
          const rowId = rest.slice(0, dashIndex);
          const subId = rest.slice(dashIndex + 1);
          for (const row of hyperoptResultsRows) {
            if (row.id === rowId) {
              heatMapTimeFrame = row.timeFrame;
              break;
            }
          }
        }
      }
    }
    setSignalBestResults((prev) => {
      const startIndex = prev.length;
      const added = signalBestCandidates.map((cand, idx) =>
        buildSignalBestResult({
          label: `Heatmap cell #${startIndex + idx + 1}`,
          source: "heatmap",
          scores: { avg: cand.score },
          meta: {
            ...cand.meta,
            heatmapParams: cand.params,
          },
          timeRangeOverride: heatMapTimeFrame,
        }),
      );
      return [...prev, ...added];
    });
    setSignalBestCandidates([]);
  }, [isEntryStage, signalBestCandidates, buildSignalBestResult, setSignalBestResults, heatMapViewModalId, hyperoptResultsRows]);

  const handleRemoveSignalBestCandidate = useCallback((id) => {
    setSignalBestCandidates((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const handleLoadBestResultIntoSignal = useCallback(
    (best) => {
      if (!best || !Array.isArray(best.indicatorsRaw)) return;
      if (isEntryStage) return;
      setSignalIndicators(
        best.indicatorsRaw.map((ind) => ({
          ...ind,
          id: Date.now() + Math.random(),
        })),
      );
    },
    [isEntryStage, setSignalIndicators],
  );
  const stages = useMemo(
    () => [
      {
        id: 1,
        label: "Signal",
        title: "STAGE 1: SIGNAL GENERATOR",
        locked: false,
        icon: (
          <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
            <path d="M4 19V5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M4 19h16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M7 15l4-4 3 3 5-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="7" cy="15" r="1.4" fill="currentColor" />
            <circle cx="11" cy="11" r="1.4" fill="currentColor" />
            <circle cx="14" cy="14" r="1.4" fill="currentColor" />
            <circle cx="19" cy="7" r="1.4" fill="currentColor" />
          </svg>
        ),
      },
      {
        id: 2,
        label: "Entry",
        title: "STAGE 2: ENTRY VALIDATION",
        locked: false,
        icon: (
          <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
            <path d="M4 12h10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M10 8l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M14 4h6v16h-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ),
      },
      {
        id: 3,
        label: "Exit",
        title: "STAGE 3: EXIT LOGIC",
        locked: true,
        icon: (
          <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
            <path d="M20 12H10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M14 8l-4 4 4 4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M10 4H4v16h6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ),
      },
      {
        id: 4,
        label: "Risk",
        title: "STAGE 4: RISK MANAGEMENT",
        locked: true,
        icon: (
          <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
            <path d="M12 2l9 5v10l-9 5-9-5V7l9-5z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
            <path d="M12 8v5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <circle cx="12" cy="16.5" r="1" fill="currentColor" />
          </svg>
        ),
      },
      {
        id: 5,
        label: "Final",
        title: "STAGE 5: FINAL VALIDATION",
        locked: true,
        icon: (
          <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
            <path d="M20 6L9 17l-5-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ),
      },
    ],
    []
  );

  const active = stages.find((s) => s.id === activeStage) ?? stages[0];

  const [openRunId, setOpenRunId] = useState(null);

  return (
    <div className={cx(ui.radius, ui.panel, "overflow-hidden")}>
      <div className={cx("flex items-center justify-between px-3 py-2", ui.panelMuted, "border-0 border-b", ui.divider)}>
        <div className="flex items-center gap-2">
          <StageIcon>
            <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
              <path d="M5 7h14M5 12h10M5 17h14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </StageIcon>
          <div>
            <div className="text-[12px] font-medium text-[#d9d9d9]">Strategy Builder</div>
          </div>
        </div>
        <span className="rounded-md border border-[#303030] bg-[#0f0f0f] px-2 py-0.5 text-[10px] text-[#8c8c8c]">mock</span>
      </div>

      {/* Horizontal stepper */}
      <div className={cx("px-3 py-3", ui.panelMuted, "border-0 border-b", ui.divider)}>
        <div className="grid grid-cols-5 gap-2">
          {stages.map((s) => {
            const isActive = s.id === activeStage;
            const isLocked = s.locked;
            return (
              <div
                key={s.id}
                className={cx(
                  "rounded-lg border px-2 py-2 flex items-center gap-2",
                  isActive ? "border-emerald-500/40 bg-emerald-500/10" : "border-[#303030] bg-[#0f0f0f]",
                  isLocked && "opacity-80 cursor-not-allowed"
                )}
                title={s.title}
                onClick={() => {
                  if (!isLocked && typeof onStageChange === "function") {
                    onStageChange(s.id);
                  }
                }}
              >
                <span
                  className={cx(
                    "inline-flex h-7 w-7 items-center justify-center rounded-md border",
                    isActive ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200" : "border-[#303030] bg-[#141414] text-[#a6a6a6]"
                  )}
                >
                  {s.icon}
                </span>
                <div className="min-w-0">
                  <div className={cx("text-[12px] font-medium truncate", isActive ? "text-emerald-100" : "text-[#d9d9d9]")}>
                    {s.label}
                  </div>
                  <div className={cx("text-[10px] truncate", ui.textMuted)}>{isLocked ? "locked" : "active"}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Stage content */}
      <div className="p-3">
        {active.id === 1 || active.id === 2 ? (
          <div className="space-y-4">
            {/* 1. INDICATORS */}
            <div className={cx(ui.radius, ui.panel, "overflow-hidden")}>
              <button
                type="button"
                onClick={() => toggleSection(1)}
                className={cx("w-full px-3 py-2 flex items-center justify-between gap-2 text-left", ui.panelMuted, "border-0 border-b", ui.divider, "hover:bg-[#1a1a1a] transition-colors")}
              >
                <div>
                  <div className="text-[12px] font-medium text-[#d9d9d9]">
                    1. Indicators {isEntryStage ? "(Entry)" : "(Signal)"}
                  </div>
                  <div className={cx("text-[11px]", ui.textMuted)}>
                    Indicator Library and Selected Indicators
                  </div>
                </div>
                <span className="text-[#8c8c8c] text-[10px]">
                  {collapsedSections.has(1) ? "▶" : "▼"}
                </span>
              </button>
              {!collapsedSections.has(1) && (
              <div className="p-3">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                  {/* Library (left) */}
                  <div className="lg:col-span-5">
                    <IndicatorLibrary
                      query={libraryQuery}
                      onQueryChange={setLibraryQuery}
                      groupFilter={libraryGroup}
                      onGroupChange={setLibraryGroup}
                      onAdd={handleAddIndicatorFromLibrary}
                    />
                  </div>

                  {/* Selected indicators (right) */}
                  <div className="lg:col-span-7">
                <div className={cx(ui.radius, ui.panel, "overflow-hidden h-full flex flex-col")}>
                  <div className={cx("px-4 py-3", ui.panelMuted, "border-0 border-b", ui.divider)}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-[12px] font-medium text-[#d9d9d9] mb-1">Selected Indicators</div>
                      </div>
                      <div className={cx(
                        "text-[11px] shrink-0 rounded-md border px-2 py-1.5",
                        totalCombinations > 10_000_000 ? "border-red-500/50 bg-red-500/10 text-red-400" : totalCombinations > 0 ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400" : "border-[#303030] bg-[#0f0f0f] text-[#8c8c8c]"
                      )}>
                        Total combinations: <span className="font-medium">{totalCombinations.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex-1 overflow-auto p-3">
                    {true ? (
                      indicators.length === 0 ? (
                        <div className={cx(ui.radius, ui.panelMuted, "p-6 text-center text-[12px]", ui.textMuted)}>
                          No indicators yet. Add one from the library.
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {indicators.map((ind, idx) => (
                            <IndicatorItem 
                              key={ind.id} 
                              indicator={ind}
                              index={idx}
                              total={indicators.length}
                              onEdit={() => setEditingIndicator(ind)}
                              onDelete={() => handleDeleteIndicator(ind.id)}
                            />
                          ))}
                        </div>
                      )
                    ) : (
                      <div className={cx(ui.radius, ui.panelMuted, "p-4")}>
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <div className="text-[12px] font-medium text-[#d9d9d9]">populate_indicators() preview</div>
                            <div className={cx("text-[11px]", ui.textMuted)}>Python code based on selected indicators</div>
                          </div>
                          <button className={cx(ui.btn, "h-7 px-2 text-[10px]")} onClick={() => {
                            const code = generatePythonCode(indicators);
                            navigator.clipboard?.writeText(code);
                          }}>
                            Copy
                          </button>
                        </div>
                        <pre className="text-[11px] font-mono text-[#a6a6a6] whitespace-pre-wrap overflow-auto max-h-96 p-3 rounded-lg bg-[#0f0f0f] border border-[#303030]">
                          {generatePythonCode(indicators)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              </div>
                </div>
              </div>
              )}
            </div>

            {/* 2. FORMULAS (Signal / Entry) */}
            <div className={cx(ui.radius, ui.panel, "overflow-hidden")}>
              <button
                type="button"
                onClick={() => toggleSection(2)}
                className={cx("w-full px-3 py-2 flex items-center justify-between gap-2 text-left", ui.panelMuted, "border-0 border-b", ui.divider, "hover:bg-[#1a1a1a] transition-colors")}
              >
                <div>
                  <div className="text-[12px] font-medium text-[#d9d9d9]">
                    {isEntryStage ? "2. Entry formulas" : "2. Signal Formulas"}
                  </div>
                  <div className={cx("text-[11px]", ui.textMuted)}>
                    Define {isEntryStage ? "entry validation" : "trading"} signals using python formula or builder
                  </div>
                </div>
                <span className="text-[#8c8c8c] text-[10px]">{collapsedSections.has(2) ? "▶" : "▼"}</span>
              </button>
              {!collapsedSections.has(2) && (
                <div className="p-3">
                  <FormulaEditor
                    key={isEntryStage ? "entry-formulas" : "signal-formulas"}
                    value={isEntryStage ? entryFormula : signalFormula}
                    onChange={isEntryStage ? setEntryFormula : setSignalFormula}
                    indicators={indicators}
                    mode={isEntryStage ? "entry" : "signal"}
                  />
                </div>
              )}
            </div>

            {/* 3. HYPEROPTIMIZATION PARAMETERS */}
            <div className={cx(ui.radius, ui.panel, "overflow-hidden")}>
              <button
                type="button"
                onClick={() => toggleSection(3)}
                className={cx("w-full px-3 py-2 flex items-center justify-between gap-2 text-left", ui.panelMuted, "border-0 border-b", ui.divider, "hover:bg-[#1a1a1a] transition-colors")}
              >
                <div>
                  <div className="text-[12px] font-medium text-[#d9d9d9]">3. Hyperoptimization Parameters</div>
                  <div className={cx("text-[11px]", ui.textMuted)}>Set trading pairs and time parameters</div>
                </div>
                <span className="text-[#8c8c8c] text-[10px]">{collapsedSections.has(3) ? "▶" : "▼"}</span>
              </button>
              {!collapsedSections.has(3) && (
              <div className="p-3 space-y-3">
                <div className={cx(ui.radius, ui.panelMuted, "p-3")}>
                  <div className="text-[12px] font-medium text-[#d9d9d9] mb-3">Market configuration</div>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <PairsDropdown value={pairs} onChange={onPairsChange} />
                    <div>
                      <label className={cx("block mb-1 text-xs", ui.textMuted)}>Time Frame</label>
                      <select value={timeRange} onChange={(e) => onTimeRangeChange(e.target.value)} className={cx(ui.input, "h-9 text-[12px] w-full")}>
                        {TIME_RANGES.map((v) => (
                          <option key={v} value={v}>{v}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className={cx("block mb-1 text-xs", ui.textMuted)}>Time Range</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="date"
                          value={timeFrameStart}
                          onChange={(e) => onTimeFrameStartChange(e.target.value)}
                          className={cx(ui.input, "h-9 text-[12px] flex-1 min-w-0")}
                          title="From"
                        />
                        <input
                          type="date"
                          value={timeFrameEnd}
                          onChange={(e) => onTimeFrameEndChange(e.target.value)}
                          className={cx(ui.input, "h-9 text-[12px] flex-1 min-w-0")}
                          title="To"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className={cx(ui.radius, ui.panelMuted, "p-3")}>
                  <div className="text-[12px] font-medium text-[#d9d9d9] mb-3">
                    Hyperopt type {isEntryStage ? "(Entry)" : "(Signal)"}
                  </div>
                  <select
                    value={hyperoptType}
                    onChange={(e) => setHyperoptType(e.target.value)}
                    className={cx(ui.input, "h-9 text-[12px] w-full max-w-[200px]")}
                  >
                    <option value="BIAS">BIAS</option>
                    <option value="Brute Force">Brute Force</option>
                  </select>
                </div>

                {/* Intermediate formula — скрыт только для Brute Force; Post-processing ниже показывается для всех типов */}
                {hyperoptType !== "Brute Force" && (
                <div className={cx(ui.radius, ui.panelMuted, "p-3")}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-[12px] font-medium text-[#d9d9d9]">
                      Intermediate formula (Score and normalization metrics)
                    </div>
                    {isEntryStage && signalHyperoptType === entryHyperoptType && (
                      <div className="text-[10px] text-emerald-400">
                        In sync with Signal (read-only)
                      </div>
                    )}
                  </div>
                  <div className="p-3 pt-0 space-y-3 border-t border-[#303030]">
                          <div className="space-y-1.5">
                          <div className="text-[11px] font-medium text-[#d9d9d9]">Score formula</div>
                            <div className="flex flex-wrap items-center gap-3 gap-y-2">
                              <select
                                value={intermediateBlockScoreFormula}
                                onChange={(e) => {
                                  const next = e.target.value;
                                  setIntermediateBlockScoreFormula(next);
                                  const code = INTERMEDIATE_SCORE_CODE_BY_TEMPLATE[next];
                                  if (code) setIntermediateBlockScoreFormulaCode(code);
                                }}
                                disabled={isEntryStage && signalHyperoptType === entryHyperoptType}
                                className={cx(
                                  ui.input,
                                  "h-9 text-[12px] w-full max-w-[200px]",
                                  isEntryStage && signalHyperoptType === entryHyperoptType && "opacity-60 cursor-not-allowed",
                                )}
                              >
                                {FINAL_SCORE_FORMULA_OPTIONS.map((v) => <option key={v} value={v}>{v}</option>)}
                              </select>
                              <div className="min-w-[200px] flex-1 max-w-[800px]">
                                  <div className="relative rounded-md border border-[#303030] bg-[#0f0f0f] h-9 overflow-hidden">
                                  <div data-formula-mirror className="absolute left-0 top-0 bottom-0 right-8 pl-3 overflow-x-auto overflow-y-hidden whitespace-nowrap py-2 text-[11px] font-mono text-[#d9d9d9] pointer-events-none flex items-center [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }} aria-hidden>
                                    <span className="inline-block min-w-full">{intermediateBlockScoreFormulaCode ? renderFormulaWithVariables(intermediateBlockScoreFormulaCode) : <span className="text-[#595959]">e.g. 1 / (1 + exp(-k * ...))</span>}</span>
                                  </div>
                                  <input
                                    type="text"
                                    value={intermediateBlockScoreFormulaCode}
                                    onChange={(e) => setIntermediateBlockScoreFormulaCode(e.target.value)}
                                    onScroll={(e) => {
                                      const m = e.target.parentElement?.querySelector("[data-formula-mirror]");
                                      if (m) m.scrollLeft = e.target.scrollLeft;
                                    }}
                                    placeholder="Formula code"
                                    disabled={isEntryStage && signalHyperoptType === entryHyperoptType}
                                    className={cx(
                                      "relative z-10 w-full h-full bg-transparent text-transparent caret-[#d9d9d9] rounded-md border-0 pl-3 pr-8 py-2 text-[11px] font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:ring-inset",
                                      isEntryStage && signalHyperoptType === entryHyperoptType && "cursor-not-allowed",
                                    )}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => openFormulaEditor(intermediateBlockScoreFormulaCode, setIntermediateBlockScoreFormulaCode)}
                                    disabled={isEntryStage && signalHyperoptType === entryHyperoptType}
                                    className={cx(
                                      "absolute right-0 top-0 bottom-0 z-20 flex items-center justify-center w-8 h-full bg-emerald-600 text-white hover:bg-emerald-500 active:bg-emerald-700 rounded-r-md",
                                      isEntryStage && signalHyperoptType === entryHyperoptType && "opacity-60 cursor-not-allowed",
                                    )}
                                    title="Формула"
                                  >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                                      <path
                                        fillRule="nonzero"
                                        d="M5 4.5C5 3.672 5.672 3 6.5 3h11c.828 0 1.5.672 1.5 1.5V5c0 .552-.448 1-1 1s-1-.448-1-1V5H7v.54l6.562 5.625c.512.44.512 1.232 0 1.671L7 18.46V19h10c.552 0 1 .448 1 1s-.448 1-1 1H6.5C5.672 21 5 20.328 5 19.5v-1.27c0-.438.191-.854.524-1.139l5.94-4.091L5.524 6.909C5.191 6.624 5 6.208 5 5.77V4.5z"
                                      />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="text-[11px] font-medium text-[#d9d9d9]">Normalization metrics formulas and weights</div>
                          <div className="overflow-x-auto border border-[#303030] rounded-lg">
                            <table className="w-full text-[11px] border-collapse">
                              <thead>
                                <tr className="bg-[#1a1a1a] text-[#8c8c8c]">
                                  <th className="px-3 py-2 text-left font-medium border-b border-[#303030] w-24">Metrics</th>
                                  <th className="px-3 py-2 text-left font-medium border-b border-[#303030] w-32">Formula</th>
                                  <th className="px-3 py-2 text-left font-medium border-b border-[#303030] min-w-[200px]">Formula Code</th>
                                  <th className="px-3 py-2 text-left font-medium border-b border-[#303030]">Weight</th>
                                </tr>
                              </thead>
                              <tbody className="text-[#d9d9d9]">
                                {[
                                  { metric: "normMFE", formula: intNormMfeFormula, setFormula: setIntNormMfeFormula, formulaCode: intNormMfeFormulaCode, setFormulaCode: setIntNormMfeFormulaCode, weight: finMfeWeight, setWeight: setFinMfeWeight, others: finMaeWeight + finAirWeight + finHitRateWeight },
                                  { metric: "normMAE", formula: intNormMaeFormula, setFormula: setIntNormMaeFormula, formulaCode: intNormMaeFormulaCode, setFormulaCode: setIntNormMaeFormulaCode, weight: finMaeWeight, setWeight: setFinMaeWeight, others: finMfeWeight + finAirWeight + finHitRateWeight },
                                  { metric: "normAIR", formula: intNormAirFormula, setFormula: setIntNormAirFormula, formulaCode: intNormAirFormulaCode, setFormulaCode: setIntNormAirFormulaCode, weight: finAirWeight, setWeight: setFinAirWeight, others: finMfeWeight + finMaeWeight + finHitRateWeight },
                                  { metric: "normHitRate", formula: intNormHitRateFormula, setFormula: setIntNormHitRateFormula, formulaCode: intNormHitRateFormulaCode, setFormulaCode: setIntNormHitRateFormulaCode, weight: finHitRateWeight, setWeight: setFinHitRateWeight, others: finMfeWeight + finMaeWeight + finAirWeight },
                                ].map((row) => (
                                  <tr key={row.metric} className="border-b border-[#303030]">
                                    <td className="px-3 py-2 text-[#a6a6a6] align-top">{row.metric}</td>
                                    <td className="px-3 py-2 w-32 align-top">
                                      <select
                                        value={row.formula}
                                        onChange={(e) => {
                                          const next = e.target.value;
                                          row.setFormula(next);
                                          const byTemplate = INTERMEDIATE_METRIC_FORMULA_CODE_BY_TEMPLATE[row.metric];
                                          const code = byTemplate && byTemplate[next];
                                          if (code) row.setFormulaCode(code);
                                        }}
                                        disabled={isEntryStage && signalHyperoptType === entryHyperoptType}
                                        className={cx(
                                          ui.input,
                                          "h-8 text-[11px] w-full min-w-0",
                                          isEntryStage && signalHyperoptType === entryHyperoptType && "opacity-60 cursor-not-allowed",
                                        )}
                                      >
                                        <option value="Formula 1">{row.metric}</option>
                                        <option value="Formula 2">Fake formula</option>
                                      </select>
                                    </td>
                                    <td className="px-3 py-2 align-top min-w-[200px]">
                                      <div className="relative rounded-md border border-[#303030] bg-[#0f0f0f] h-8 overflow-hidden min-w-[200px]">
                                        <div
                                          data-formula-mirror
                                          className="absolute left-0 top-0 bottom-0 right-8 pl-3 overflow-x-auto overflow-y-hidden whitespace-nowrap py-2 text-[11px] font-mono text-[#d9d9d9] pointer-events-none flex items-center [&::-webkit-scrollbar]:hidden"
                                          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                                          aria-hidden
                                        >
                                          <span className="inline-block min-w-full">
                                            {row.formulaCode
                                              ? renderFormulaWithVariables(row.formulaCode)
                                              : <span className="text-[#595959]">e.g. 1 / (1 + exp(-k * ...))</span>}
                                          </span>
                                        </div>
                                        <input
                                          type="text"
                                          value={row.formulaCode}
                                          readOnly
                                          onKeyDown={(e) => e.preventDefault()}
                                          onPaste={(e) => e.preventDefault()}
                                          onScroll={(e) => {
                                            const m = e.target.parentElement?.querySelector("[data-formula-mirror]");
                                            if (m) m.scrollLeft = e.target.scrollLeft;
                                          }}
                                          disabled={isEntryStage && signalHyperoptType === entryHyperoptType}
                                          className={cx(
                                            "relative z-10 w-full h-full bg-transparent text-transparent caret-transparent select-none cursor-not-allowed rounded-md border-0 pl-3 pr-8 py-2 text-[11px] font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:ring-inset",
                                            isEntryStage && signalHyperoptType === entryHyperoptType && "cursor-not-allowed",
                                          )}
                                        />
                                        <button
                                          type="button"
                                          onClick={() => openFormulaEditor(row.formulaCode, row.setFormulaCode)}
                                          disabled={isEntryStage && signalHyperoptType === entryHyperoptType}
                                          className={cx(
                                            "absolute right-0 top-0 bottom-0 z-20 flex items-center justify-center w-8 h-full bg-emerald-600 text-white hover:bg-emerald-500 active:bg-emerald-700 rounded-r-md",
                                            isEntryStage && signalHyperoptType === entryHyperoptType && "opacity-60 cursor-not-allowed",
                                          )}
                                          title="Формула"
                                        >
                                          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                                            <path
                                              fillRule="nonzero"
                                              d="M5 4.5C5 3.672 5.672 3 6.5 3h11c.828 0 1.5.672 1.5 1.5V5c0 .552-.448 1-1 1s-1-.448-1-1V5H7v.54l6.562 5.625c.512.44.512 1.232 0 1.671L7 18.46V19h10c.552 0 1 .448 1 1s-.448 1-1 1H6.5C5.672 21 5 20.328 5 19.5v-1.27c0-.438.191-.854.524-1.139l5.94-4.091L5.524 6.909C5.191 6.624 5 6.208 5 5.77V4.5z"
                                            />
                                          </svg>
                                        </button>
                                      </div>
                                    </td>
                                    <td className="px-3 py-2 align-top">
                                      <div className="flex items-center gap-2">
                                        <input
                                          type="range"
                                          min={0}
                                          max={100}
                                          step={1}
                                          value={row.weight}
                                          onChange={(e) => setWeightCapped(row.setWeight, e.target.value, row.others)}
                                          disabled={isEntryStage && signalHyperoptType === entryHyperoptType}
                                          className={cx(
                                            "flex-1 max-w-[120px] h-2 accent-emerald-500",
                                            isEntryStage && signalHyperoptType === entryHyperoptType && "opacity-60 cursor-not-allowed",
                                          )}
                                        />
                                        <span className="text-[#8c8c8c] w-7">{row.weight}%</span>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                              <tfoot>
                                <tr className="bg-[#1a1a1a]">
                                  <td colSpan={3} className="px-3 py-2 text-right text-[11px] font-medium text-[#8c8c8c]">Total</td>
                                  <td className={cx("px-3 py-2 text-[11px] font-medium", (finMfeWeight + finMaeWeight + finAirWeight + finHitRateWeight) === 100 ? "text-emerald-500" : (finMfeWeight + finMaeWeight + finAirWeight + finHitRateWeight) > 100 ? "text-amber-500" : "text-[#8c8c8c]")}>{finMfeWeight + finMaeWeight + finAirWeight + finHitRateWeight}%</td>
                                </tr>
                              </tfoot>
                            </table>
                          </div>
                  </div>
                </div>
                )}

                {/* Post-processing */}
                <div className={cx(ui.radius, ui.panelMuted, "p-3", hyperoptRun !== "Pipeline" && "hidden")}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-[12px] font-medium text-[#d9d9d9]">Post-processing</div>
                    {isEntryStage && signalHyperoptType === entryHyperoptType && (
                      <div className="text-[10px] text-emerald-400">
                        In sync with Signal (read-only)
                      </div>
                    )}
                  </div>

                  <div className="space-y-3 border-t border-[#303030] pt-3">
                    {/* Block 1: Stability formula (collapsible) */}
                    <div className="rounded-lg border border-[#303030] overflow-hidden bg-[#0f0f0f]/50">
                      <button
                        type="button"
                        onClick={() => toggleNormSection("post-stability")}
                        className="w-full flex items-center gap-2 px-3 py-2.5 text-left text-[12px] font-medium text-[#d9d9d9] hover:bg-[#1a1a1a] transition-colors"
                      >
                        <span className="text-[#8c8c8c] text-[10px]">{collapsedNormSections.has("post-stability") ? "▶" : "▼"}</span>
                        <span>Stability formula</span>
                      </button>
                      {!collapsedNormSections.has("post-stability") && (
                        <div className="px-3 pb-3 pt-0 space-y-3 border-t border-[#303030]">
                          <div className="space-y-1.5 pt-3">
                            <div className="text-[11px] font-medium text-[#d9d9d9]">Stability formula</div>
                            <div className="flex flex-wrap items-center gap-3 gap-y-2">
                              <select
                                value={finStabilityBlockFormula}
                                onChange={(e) => setFinStabilityBlockFormula(e.target.value)}
                                disabled={isEntryStage && signalHyperoptType === entryHyperoptType}
                                className={cx(ui.input, "h-9 text-[12px] w-full max-w-[200px]")}
                              >
                                {METRIC_FORMULA_OPTIONS.map((v) => (
                                  <option key={v} value={v}>
                                    {v}
                                  </option>
                                ))}
                              </select>
                              <div className="min-w-[200px] flex-1 max-w-[800px]">
                                <div className="relative rounded-md border border-[#303030] bg-[#0f0f0f] h-9 overflow-hidden">
                                  <div
                                    data-formula-mirror
                                    className="absolute left-0 top-0 bottom-0 right-8 pl-3 overflow-x-auto overflow-y-hidden whitespace-nowrap py-2 text-[11px] font-mono text-[#d9d9d9] pointer-events-none flex items-center [&::-webkit-scrollbar]:hidden"
                                    style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                                    aria-hidden
                                  >
                                    <span className="inline-block min-w-full">
                                      {finStabilityBlockFormulaCode ? (
                                        renderFormulaWithVariables(finStabilityBlockFormulaCode)
                                      ) : (
                                        <span className="text-[#595959]">e.g. 1 / (1 + exp(-k * ...))</span>
                                      )}
                                    </span>
                                  </div>
                                  <input
                                    type="text"
                                    value={finStabilityBlockFormulaCode}
                                    onChange={(e) => setFinStabilityBlockFormulaCode(e.target.value)}
                                    onScroll={(e) => {
                                      const m = e.target.parentElement?.querySelector("[data-formula-mirror]");
                                      if (m) m.scrollLeft = e.target.scrollLeft;
                                    }}
                                    disabled={isEntryStage && signalHyperoptType === entryHyperoptType}
                                    className="relative z-10 w-full h-full bg-transparent text-transparent caret-[#d9d9d9] rounded-md border-0 pl-3 pr-8 py-2 text-[11px] font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:ring-inset"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => openFormulaEditor(finStabilityBlockFormulaCode, setFinStabilityBlockFormulaCode)}
                                    disabled={isEntryStage && signalHyperoptType === entryHyperoptType}
                                    className="absolute right-0 top-0 bottom-0 z-20 flex items-center justify-center w-8 h-full bg-emerald-600 text-white hover:bg-emerald-500 active:bg-emerald-700 rounded-r-md"
                                    title="Формула"
                                  >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                                      <path
                                        fillRule="nonzero"
                                        d="M5 4.5C5 3.672 5.672 3 6.5 3h11c.828 0 1.5.672 1.5 1.5V5c0 .552-.448 1-1 1s-1-.448-1-1V5H7v.54l6.562 5.625c.512.44.512 1.232 0 1.671L7 18.46V19h10c.552 0 1 .448 1 1s-.448 1-1 1H6.5C5.672 21 5 20.328 5 19.5v-1.27c0-.438.191-.854.524-1.139l5.94-4.091L5.524 6.909C5.191 6.624 5 6.208 5 5.77V4.5z"
                                      />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                          {/* Normalization stability formulas and weights (normDiff*) */}
                          <div>
                            <div className="text-[11px] font-medium text-[#d9d9d9] mb-2">
                              Normalization stability formulas and weights
                            </div>
                            <div className="overflow-x-auto border border-[#303030] rounded-lg">
                              <table className="w-full text-[11px] border-collapse">
                                <thead>
                                  <tr className="bg-[#1a1a1a] text-[#8c8c8c]">
                                    <th className="px-3 py-2 text-left font-medium border-b border-[#303030] w-24">
                                      Metrics
                                    </th>
                                    <th className="px-3 py-2 text-left font-medium border-b border-[#303030] w-32">
                                      Formula
                                    </th>
                                    <th className="px-3 py-2 text-left font-medium border-b border-[#303030] min-w-[200px]">
                                      Formula Code
                                    </th>
                                    <th className="px-3 py-2 text-left font-medium border-b border-[#303030]">
                                      Weight
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="text-[#d9d9d9]">
                                  {[
                                    {
                                      metric: "normDiffMFE",
                                      formula: finStabDiffMfeFormula,
                                      setFormula: setFinStabDiffMfeFormula,
                                      formulaCode: finStabDiffMfeFormulaCode,
                                      setFormulaCode: setFinStabDiffMfeFormulaCode,
                                      weight: finStabDiffMfeWeight,
                                      setWeight: setFinStabDiffMfeWeight,
                                      others:
                                        finStabDiffMaeWeight +
                                        finStabDiffAirWeight +
                                        finStabDiffHitRateWeight +
                                        finStabDiffStdWeight,
                                    },
                                    {
                                      metric: "normDiffMAE",
                                      formula: finStabDiffMaeFormula,
                                      setFormula: setFinStabDiffMaeFormula,
                                      formulaCode: finStabDiffMaeFormulaCode,
                                      setFormulaCode: setFinStabDiffMaeFormulaCode,
                                      weight: finStabDiffMaeWeight,
                                      setWeight: setFinStabDiffMaeWeight,
                                      others:
                                        finStabDiffMfeWeight +
                                        finStabDiffAirWeight +
                                        finStabDiffHitRateWeight +
                                        finStabDiffStdWeight,
                                    },
                                    {
                                      metric: "normDiffAIR",
                                      formula: finStabDiffAirFormula,
                                      setFormula: setFinStabDiffAirFormula,
                                      formulaCode: finStabDiffAirFormulaCode,
                                      setFormulaCode: setFinStabDiffAirFormulaCode,
                                      weight: finStabDiffAirWeight,
                                      setWeight: setFinStabDiffAirWeight,
                                      others:
                                        finStabDiffMfeWeight +
                                        finStabDiffMaeWeight +
                                        finStabDiffHitRateWeight +
                                        finStabDiffStdWeight,
                                    },
                                    {
                                      metric: "normDiffHitRate",
                                      formula: finStabDiffHitRateFormula,
                                      setFormula: setFinStabDiffHitRateFormula,
                                      formulaCode: finStabDiffHitRateFormulaCode,
                                      setFormulaCode: setFinStabDiffHitRateFormulaCode,
                                      weight: finStabDiffHitRateWeight,
                                      setWeight: setFinStabDiffHitRateWeight,
                                      others:
                                        finStabDiffMfeWeight +
                                        finStabDiffMaeWeight +
                                        finStabDiffAirWeight +
                                        finStabDiffStdWeight,
                                    },
                                    {
                                      metric: "normDiffStd",
                                      formula: finStabDiffStdFormula,
                                      setFormula: setFinStabDiffStdFormula,
                                      formulaCode: finStabDiffStdFormulaCode,
                                      setFormulaCode: setFinStabDiffStdFormulaCode,
                                      weight: finStabDiffStdWeight,
                                      setWeight: setFinStabDiffStdWeight,
                                      others:
                                        finStabDiffMfeWeight +
                                        finStabDiffMaeWeight +
                                        finStabDiffAirWeight +
                                        finStabDiffHitRateWeight,
                                    },
                                  ].map((row) => (
                                    <tr key={row.metric} className="border-b border-[#303030]">
                                      <td className="px-3 py-2 text-[#a6a6a6] align-top">{row.metric}</td>
                                      <td className="px-3 py-2 w-32 align-top">
                                        <select
                                          value={row.formula}
                                          onChange={(e) => {
                                            const next = e.target.value;
                                            row.setFormula(next);
                                            const byTemplate = STABILITY_NORM_DIFF_FORMULA_CODE_BY_TEMPLATE[row.metric];
                                            const code = byTemplate && byTemplate[next];
                                            if (code) row.setFormulaCode(code);
                                          }}
                                          className={cx(ui.input, "h-8 text-[11px] w-full min-w-0")}
                                        >
                                          <option value="Formula 1">{row.metric}</option>
                                          <option value="Formula 2">Fake formula</option>
                                        </select>
                                      </td>
                                      <td className="px-3 py-2 align-top min-w-[200px]">
                                        <div className="relative rounded-md border border-[#303030] bg-[#0f0f0f] h-8 overflow-hidden min-w-[200px]">
                                          <div
                                            data-formula-mirror
                                            className="absolute left-0 top-0 bottom-0 right-8 pl-3 overflow-x-auto overflow-y-hidden whitespace-nowrap py-2 text-[11px] font-mono text-[#d9d9d9] pointer-events-none flex items-center [&::-webkit-scrollbar]:hidden"
                                            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                                            aria-hidden
                                          >
                                            <span className="inline-block min-w-full">
                                              {row.formulaCode ? (
                                                renderFormulaWithVariables(row.formulaCode)
                                              ) : (
                                                <span className="text-[#595959]">e.g. formula</span>
                                              )}
                                            </span>
                                          </div>
                                          <input
                                            type="text"
                                            value={row.formulaCode}
                                            readOnly
                                            onKeyDown={(e) => e.preventDefault()}
                                            onPaste={(e) => e.preventDefault()}
                                            onScroll={(e) => {
                                              const m = e.target.parentElement?.querySelector("[data-formula-mirror]");
                                              if (m) m.scrollLeft = e.target.scrollLeft;
                                            }}
                                            className="relative z-10 w-full h-full bg-transparent text-transparent caret-transparent select-none cursor-not-allowed rounded-md border-0 pl-3 pr-8 py-2 text-[11px] font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:ring-inset"
                                          />
                                          <button
                                            type="button"
                                            onClick={() => openFormulaEditor(row.formulaCode, row.setFormulaCode)}
                                            className="absolute right-0 top-0 bottom-0 z-20 flex items-center justify-center w-8 h-full bg-emerald-600 text-white hover:bg-emerald-500 active:bg-emerald-700 rounded-r-md"
                                            title="Формула"
                                          >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                                              <path
                                                fillRule="nonzero"
                                                d="M5 4.5C5 3.672 5.672 3 6.5 3h11c.828 0 1.5.672 1.5 1.5V5c0 .552-.448 1-1 1s-1-.448-1-1V5H7v.54l6.562 5.625c.512.44.512 1.232 0 1.671L7 18.46V19h10c.552 0 1 .448 1 1s-.448 1-1 1H6.5C5.672 21 5 20.328 5 19.5v-1.27c0-.438.191-.854.524-1.139l5.94-4.091L5.524 6.909C5.191 6.624 5 6.208 5 5.77V4.5z"
                                              />
                                            </svg>
                                          </button>
                                        </div>
                                      </td>
                                      <td className="px-3 py-2 align-top">
                                        <div className="flex items-center gap-2">
                                          <input
                                            type="range"
                                            min={0}
                                            max={100}
                                            step={1}
                                            value={row.weight}
                                            onChange={(e) => setWeightCapped(row.setWeight, e.target.value, row.others)}
                                            className="flex-1 max-w-[120px] h-2 accent-emerald-500"
                                          />
                                          <span className="text-[#8c8c8c] w-7">{row.weight}%</span>
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                                <tfoot>
                                  <tr className="bg-[#1a1a1a]">
                                    <td colSpan={3} className="px-3 py-2 text-right text-[11px] font-medium text-[#8c8c8c]">
                                      Total
                                    </td>
                                    <td
                                      className={cx(
                                        "px-3 py-2 text-[11px] font-medium",
                                        finStabDiffWeightsSum === 100
                                          ? "text-emerald-500"
                                          : finStabDiffWeightsSum > 100
                                            ? "text-amber-500"
                                            : "text-[#8c8c8c]"
                                      )}
                                    >
                                      {finStabDiffWeightsSum}%
                                    </td>
                                  </tr>
                                </tfoot>
                              </table>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Block 2: Score formula (collapsible) */}
                    <div className="rounded-lg border border-[#303030] overflow-hidden bg-[#0f0f0f]/50">
                      <button
                        type="button"
                        onClick={() => toggleNormSection("post-score")}
                        className="w-full flex items-center gap-2 px-3 py-2.5 text-left text-[12px] font-medium text-[#d9d9d9] hover:bg-[#1a1a1a] transition-colors"
                      >
                        <span className="text-[#8c8c8c] text-[10px]">{collapsedNormSections.has("post-score") ? "▶" : "▼"}</span>
                        <span>Score formula</span>
                      </button>
                      {!collapsedNormSections.has("post-score") && (
                        <div className="px-3 pb-3 pt-0 space-y-3 border-t border-[#303030]">
                          <div className="space-y-1.5 pt-3">
                            <div className="text-[11px] font-medium text-[#d9d9d9]">Score formula</div>
                            <div className="flex flex-wrap items-center gap-3 gap-y-2">
                              <select
                                value={finalScoreFormula}
                                onChange={(e) => {
                                  const next = e.target.value;
                                  setFinalScoreFormula(next);
                                  const code = FINAL_SCORE_CODE_BY_TEMPLATE[next];
                                  if (code) setFinFinalFormulaCode(code);
                                }}
                                disabled={isEntryStage && signalHyperoptType === entryHyperoptType}
                                className={cx(ui.input, "h-9 text-[12px] w-full max-w-[200px]")}
                              >
                                {FINAL_SCORE_FORMULA_OPTIONS.map((v) => (
                                  <option key={v} value={v}>
                                    {v}
                                  </option>
                                ))}
                              </select>
                              <div className="min-w-[200px] flex-1 max-w-[800px]">
                                <div className="relative rounded-md border border-[#303030] bg-[#0f0f0f] h-9 overflow-hidden">
                                  <div
                                    data-formula-mirror
                                    className="absolute left-0 top-0 bottom-0 right-8 pl-3 overflow-x-auto overflow-y-hidden whitespace-nowrap py-2 text-[11px] font-mono text-[#d9d9d9] pointer-events-none flex items-center [&::-webkit-scrollbar]:hidden"
                                    style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                                    aria-hidden
                                  >
                                    <span className="inline-block min-w-full">
                                      {finFinalFormulaCode ? (
                                        renderFormulaWithVariables(finFinalFormulaCode)
                                      ) : (
                                        <span className="text-[#595959]">e.g. 1 / (1 + exp(-k * ...))</span>
                                      )}
                                    </span>
                                  </div>
                                  <input
                                    type="text"
                                    value={finFinalFormulaCode}
                                    readOnly
                                    onKeyDown={(e) => e.preventDefault()}
                                    onPaste={(e) => e.preventDefault()}
                                    onScroll={(e) => {
                                      const m = e.target.parentElement?.querySelector("[data-formula-mirror]");
                                      if (m) m.scrollLeft = e.target.scrollLeft;
                                    }}
                                    placeholder="Formula code"
                                    disabled={isEntryStage && signalHyperoptType === entryHyperoptType}
                                    className="relative z-10 w-full h-full bg-transparent text-transparent caret-transparent select-none cursor-not-allowed rounded-md border-0 pl-3 pr-8 py-2 text-[11px] font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:ring-inset"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => openFormulaEditor(finFinalFormulaCode, setFinFinalFormulaCode)}
                                    disabled={isEntryStage && signalHyperoptType === entryHyperoptType}
                                    className="absolute right-0 top-0 bottom-0 z-20 flex items-center justify-center w-8 h-full bg-emerald-600 text-white hover:bg-emerald-500 active:bg-emerald-700 rounded-r-md"
                                    title="Формула"
                                  >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                                      <path
                                        fillRule="nonzero"
                                        d="M5 4.5C5 3.672 5.672 3 6.5 3h11c.828 0 1.5.672 1.5 1.5V5c0 .552-.448 1-1 1s-1-.448-1-1V5H7v.54l6.562 5.625c.512.44.512 1.232 0 1.671L7 18.46V19h10c.552 0 1 .448 1 1s-.448 1-1 1H6.5C5.672 21 5 20.328 5 19.5v-1.27c0-.438.191-.854.524-1.139l5.94-4.091L5.524 6.909C5.191 6.624 5 6.208 5 5.77V4.5z"
                                      />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                          {/* Normalization metrics formulas and weights */}
                          <div>
                            <div className="text-[11px] font-medium text-[#d9d9d9]">
                              Normalization metrics formulas and weights
                            </div>
                            <div className="overflow-x-auto border border-[#303030] rounded-lg">
                              <table className="w-full text-[11px] border-collapse">
                                <thead>
                                  <tr className="bg-[#1a1a1a] text-[#8c8c8c]">
                                    <th className="px-3 py-2 text-left font-medium border-b border-[#303030] w-24">
                                      Metrics
                                    </th>
                                    <th className="px-3 py-2 text-left font-medium border-b border-[#303030] w-32">
                                      Formula
                                    </th>
                                    <th className="px-3 py-2 text-left font-medium border-b border-[#303030] min-w-[200px]">
                                      Formula Code
                                    </th>
                                    <th className="px-3 py-2 text-left font-medium border-b border-[#303030]">
                                      Weight
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="text-[#d9d9d9]">
                                  {[
                                    {
                                      metric: "normStability",
                                      formula: finStabilityFormula,
                                      setFormula: setFinStabilityFormula,
                                      formulaCode: finStabilityFormulaCode,
                                      setFormulaCode: setFinStabilityFormulaCode,
                                      weight: finStabilityWeight,
                                      setWeight: setFinStabilityWeight,
                                      others: finMfeWeight + finMaeWeight + finAirWeight + finHitRateWeight,
                                    },
                                    {
                                      metric: "normMFE",
                                      formula: finMfeFormula,
                                      setFormula: setFinMfeFormula,
                                      formulaCode: finMfeFormulaCode,
                                      setFormulaCode: setFinMfeFormulaCode,
                                      weight: finMfeWeight,
                                      setWeight: setFinMfeWeight,
                                      others: finStabilityWeight + finMaeWeight + finAirWeight + finHitRateWeight,
                                    },
                                    {
                                      metric: "normMAE",
                                      formula: finMaeFormula,
                                      setFormula: setFinMaeFormula,
                                      formulaCode: finMaeFormulaCode,
                                      setFormulaCode: setFinMaeFormulaCode,
                                      weight: finMaeWeight,
                                      setWeight: setFinMaeWeight,
                                      others: finStabilityWeight + finMfeWeight + finAirWeight + finHitRateWeight,
                                    },
                                    {
                                      metric: "normAIR",
                                      formula: finAirFormula,
                                      setFormula: setFinAirFormula,
                                      formulaCode: finAirFormulaCode,
                                      setFormulaCode: setFinAirFormulaCode,
                                      weight: finAirWeight,
                                      setWeight: setFinAirWeight,
                                      others: finStabilityWeight + finMfeWeight + finMaeWeight + finHitRateWeight,
                                    },
                                    {
                                      metric: "normHitRate",
                                      formula: finHitRateFormula,
                                      setFormula: setFinHitRateFormula,
                                      formulaCode: finHitRateFormulaCode,
                                      setFormulaCode: setFinHitRateFormulaCode,
                                      weight: finHitRateWeight,
                                      setWeight: setFinHitRateWeight,
                                      others: finStabilityWeight + finMfeWeight + finMaeWeight + finAirWeight,
                                    },
                                  ].map((row) => (
                                    <tr key={row.metric} className="border-b border-[#303030]">
                                      <td className="px-3 py-2 text-[#a6a6a6] align-top">{row.metric}</td>
                                      <td className="px-3 py-2 w-32 align-top">
                                        <select
                                          value={row.formula}
                                          onChange={(e) => {
                                            const next = e.target.value;
                                            row.setFormula(next);
                                            const byTemplate = METRIC_FORMULA_CODE_BY_TEMPLATE[row.metric];
                                            const code = byTemplate && byTemplate[next];
                                            if (code) row.setFormulaCode(code);
                                          }}
                                          className={cx(ui.input, "h-8 text-[11px] w-full min-w-0")}
                                        >
                                          <option value="Formula 1">{row.metric}</option>
                                          <option value="Formula 2">Fake formula</option>
                                        </select>
                                      </td>
                                      <td className="px-3 py-2 align-top min-w-[200px]">
                                        <div className="relative rounded-md border border-[#303030] bg-[#0f0f0f] h-8 overflow-hidden min-w-[200px]">
                                          <div
                                            data-formula-mirror
                                            className="absolute left-0 top-0 bottom-0 right-8 pl-3 overflow-x-auto overflow-y-hidden whitespace-nowrap py-2 text-[11px] font-mono text-[#d9d9d9] pointer-events-none flex items-center [&::-webkit-scrollbar]:hidden"
                                            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                                            aria-hidden
                                          >
                                            <span className="inline-block min-w-full">
                                              {row.formulaCode ? (
                                                renderFormulaWithVariables(row.formulaCode)
                                              ) : (
                                                <span className="text-[#595959]">e.g. formula</span>
                                              )}
                                            </span>
                                          </div>
                                          <input
                                            type="text"
                                            value={row.formulaCode}
                                            readOnly
                                            onKeyDown={(e) => e.preventDefault()}
                                            onPaste={(e) => e.preventDefault()}
                                            onScroll={(e) => {
                                              const m = e.target.parentElement?.querySelector("[data-formula-mirror]");
                                              if (m) m.scrollLeft = e.target.scrollLeft;
                                            }}
                                            className="relative z-10 w-full h-full bg-transparent text-transparent caret-transparent select-none cursor-not-allowed rounded-md border-0 pl-3 pr-8 py-2 text-[11px] font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:ring-inset"
                                          />
                                          <button
                                            type="button"
                                            onClick={() => openFormulaEditor(row.formulaCode, row.setFormulaCode)}
                                            className="absolute right-0 top-0 bottom-0 z-20 flex items-center justify-center w-8 h-full bg-emerald-600 text-white hover:bg-emerald-500 active:bg-emerald-700 rounded-r-md"
                                            title="Формула"
                                          >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                                              <path
                                                fillRule="nonzero"
                                                d="M5 4.5C5 3.672 5.672 3 6.5 3h11c.828 0 1.5.672 1.5 1.5V5c0 .552-.448 1-1 1s-1-.448-1-1V5H7v.54l6.562 5.625c.512.44.512 1.232 0 1.671L7 18.46V19h10c.552 0 1 .448 1 1s-.448 1-1 1H6.5C5.672 21 5 20.328 5 19.5v-1.27c0-.438.191-.854.524-1.139l5.94-4.091L5.524 6.909C5.191 6.624 5 6.208 5 5.77V4.5z"
                                              />
                                            </svg>
                                          </button>
                                        </div>
                                      </td>
                                      <td className="px-3 py-2 align-top">
                                        <div className="flex items-center gap-2">
                                          <input
                                            type="range"
                                            min={0}
                                            max={100}
                                            step={1}
                                            value={row.weight}
                                            onChange={(e) => setWeightCapped(row.setWeight, e.target.value, row.others)}
                                            className="flex-1 max-w-[120px] h-2 accent-emerald-500"
                                          />
                                          <span className="text-[#8c8c8c] w-7">{row.weight}%</span>
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                                <tfoot>
                                  <tr className="bg-[#1a1a1a]">
                                    <td colSpan={3} className="px-3 py-2 text-right text-[11px] font-medium text-[#8c8c8c]">
                                      Total
                                    </td>
                                    <td
                                      className={cx(
                                        "px-3 py-2 text-[11px] font-medium",
                                        finWeightsSum === 100
                                          ? "text-emerald-500"
                                          : finWeightsSum > 100
                                            ? "text-amber-500"
                                            : "text-[#8c8c8c]"
                                      )}
                                    >
                                      {finWeightsSum}%
                                    </td>
                                  </tr>
                                </tfoot>
                              </table>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {hyperoptType !== "Brute Force" && (
                <div className={cx(ui.radius, ui.panelMuted, "p-3", "hidden")}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-[12px] font-medium text-[#d9d9d9]">
                      Intermediate formula (Score and normalization metrics)
                    </div>
                    {isEntryStage && signalHyperoptType === entryHyperoptType && (
                      <div className="text-[10px] text-emerald-400">
                        In sync with Signal (read-only)
                      </div>
                    )}
                  </div>
                  <div className="p-3 pt-0 space-y-3 border-t border-[#303030]">
                          <div className="space-y-1.5">
                          <div className="text-[11px] font-medium text-[#d9d9d9]">Score formula</div>
                            <div className="flex flex-wrap items-center gap-3 gap-y-2">
                              <select
                                value={intermediateBlockScoreFormula}
                                onChange={(e) => {
                                  const next = e.target.value;
                                  setIntermediateBlockScoreFormula(next);
                                  const code = INTERMEDIATE_SCORE_CODE_BY_TEMPLATE[next];
                                  if (code) setIntermediateBlockScoreFormulaCode(code);
                                }}
                                disabled={isEntryStage && signalHyperoptType === entryHyperoptType}
                                className={cx(
                                  ui.input,
                                  "h-9 text-[12px] w-full max-w-[200px]",
                                  isEntryStage && signalHyperoptType === entryHyperoptType && "opacity-60 cursor-not-allowed",
                                )}
                              >
                                {FINAL_SCORE_FORMULA_OPTIONS.map((v) => <option key={v} value={v}>{v}</option>)}
                              </select>
                              <div className="min-w-[200px] flex-1 max-w-[800px]">
                                  <div className="relative rounded-md border border-[#303030] bg-[#0f0f0f] h-9 overflow-hidden">
                                  <div data-formula-mirror className="absolute left-0 top-0 bottom-0 right-8 pl-3 overflow-x-auto overflow-y-hidden whitespace-nowrap py-2 text-[11px] font-mono text-[#d9d9d9] pointer-events-none flex items-center [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }} aria-hidden>
                                    <span className="inline-block min-w-full">{intermediateBlockScoreFormulaCode ? renderFormulaWithVariables(intermediateBlockScoreFormulaCode) : <span className="text-[#595959]">e.g. 1 / (1 + exp(-k * ...))</span>}</span>
                                  </div>
                                  <input
                                    type="text"
                                    value={intermediateBlockScoreFormulaCode}
                                    onChange={(e) => setIntermediateBlockScoreFormulaCode(e.target.value)}
                                    onScroll={(e) => {
                                      const m = e.target.parentElement?.querySelector("[data-formula-mirror]");
                                      if (m) m.scrollLeft = e.target.scrollLeft;
                                    }}
                                    placeholder="Formula code"
                                    disabled={isEntryStage && signalHyperoptType === entryHyperoptType}
                                    className={cx(
                                      "relative z-10 w-full h-full bg-transparent text-transparent caret-[#d9d9d9] rounded-md border-0 pl-3 pr-8 py-2 text-[11px] font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:ring-inset",
                                      isEntryStage && signalHyperoptType === entryHyperoptType && "cursor-not-allowed",
                                    )}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => openFormulaEditor(intermediateBlockScoreFormulaCode, setIntermediateBlockScoreFormulaCode)}
                                    disabled={isEntryStage && signalHyperoptType === entryHyperoptType}
                                    className={cx(
                                      "absolute right-0 top-0 bottom-0 z-20 flex items-center justify-center w-8 h-full bg-emerald-600 text-white hover:bg-emerald-500 active:bg-emerald-700 rounded-r-md",
                                      isEntryStage && signalHyperoptType === entryHyperoptType && "opacity-60 cursor-not-allowed",
                                    )}
                                    title="Формула"
                                  >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                                      <path
                                        fillRule="nonzero"
                                        d="M5 4.5C5 3.672 5.672 3 6.5 3h11c.828 0 1.5.672 1.5 1.5V5c0 .552-.448 1-1 1s-1-.448-1-1V5H7v.54l6.562 5.625c.512.44.512 1.232 0 1.671L7 18.46V19h10c.552 0 1 .448 1 1s-.448 1-1 1H6.5C5.672 21 5 20.328 5 19.5v-1.27c0-.438.191-.854.524-1.139l5.94-4.091L5.524 6.909C5.191 6.624 5 6.208 5 5.77V4.5z"
                                      />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="text-[11px] font-medium text-[#d9d9d9]">Normalization metrics formulas and weights</div>
                          <div className="overflow-x-auto border border-[#303030] rounded-lg">
                            <table className="w-full text-[11px] border-collapse">
                              <thead>
                                <tr className="bg-[#1a1a1a] text-[#8c8c8c]">
                                  <th className="px-3 py-2 text-left font-medium border-b border-[#303030] w-24">Metrics</th>
                                  <th className="px-3 py-2 text-left font-medium border-b border-[#303030] w-32">Formula</th>
                                  <th className="px-3 py-2 text-left font-medium border-b border-[#303030] min-w-[200px]">Formula Code</th>
                                  <th className="px-3 py-2 text-left font-medium border-b border-[#303030]">Weight</th>
                                </tr>
                              </thead>
                              <tbody className="text-[#d9d9d9]">
                                {[
                                  { metric: "normMFE", formula: intNormMfeFormula, setFormula: setIntNormMfeFormula, formulaCode: intNormMfeFormulaCode, setFormulaCode: setIntNormMfeFormulaCode, weight: finMfeWeight, setWeight: setFinMfeWeight, others: finMaeWeight + finAirWeight + finHitRateWeight },
                                  { metric: "normMAE", formula: intNormMaeFormula, setFormula: setIntNormMaeFormula, formulaCode: intNormMaeFormulaCode, setFormulaCode: setIntNormMaeFormulaCode, weight: finMaeWeight, setWeight: setFinMaeWeight, others: finMfeWeight + finMaeWeight + finAirWeight + finHitRateWeight },
                                  { metric: "normAIR", formula: intNormAirFormula, setFormula: setIntNormAirFormula, formulaCode: intNormAirFormulaCode, setFormulaCode: setIntNormAirFormulaCode, weight: finAirWeight, setWeight: setFinAirWeight, others: finMfeWeight + finMaeWeight + finHitRateWeight },
                                  { metric: "normHitRate", formula: intNormHitRateFormula, setFormula: setIntNormHitRateFormula, formulaCode: intNormHitRateFormulaCode, setFormulaCode: setIntNormHitRateFormulaCode, weight: finHitRateWeight, setWeight: setFinHitRateWeight, others: finMfeWeight + finMaeWeight + finAirWeight },
                                ].map((row) => (
                                  <tr key={row.metric} className="border-b border-[#303030]">
                                    <td className="px-3 py-2 text-[#a6a6a6] align-top">{row.metric}</td>
                                    <td className="px-3 py-2 w-32 align-top">
                                      <select
                                        value={row.formula}
                                        onChange={(e) => {
                                          const next = e.target.value;
                                          row.setFormula(next);
                                          const byTemplate = INTERMEDIATE_METRIC_FORMULA_CODE_BY_TEMPLATE[row.metric];
                                          const code = byTemplate && byTemplate[next];
                                          if (code) row.setFormulaCode(code);
                                        }}
                                        disabled={isEntryStage && signalHyperoptType === entryHyperoptType}
                                        className={cx(
                                          ui.input,
                                          "h-8 text-[11px] w-full min-w-0",
                                          isEntryStage && signalHyperoptType === entryHyperoptType && "opacity-60 cursor-not-allowed",
                                        )}
                                      >
                                        <option value="Formula 1">{row.metric}</option>
                                        <option value="Formula 2">Fake formula</option>
                                      </select>
                                    </td>
                                    <td className="px-3 py-2 align-top min-w-[200px]">
                                      <div className="relative rounded-md border border-[#303030] bg-[#0f0f0f] h-8 overflow-hidden min-w-[200px]">
                                        <div
                                          data-formula-mirror
                                          className="absolute left-0 top-0 bottom-0 right-8 pl-3 overflow-x-auto overflow-y-hidden whitespace-nowrap py-2 text-[11px] font-mono text-[#d9d9d9] pointer-events-none flex items-center [&::-webkit-scrollbar]:hidden"
                                          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                                          aria-hidden
                                        >
                                          <span className="inline-block min-w-full">
                                            {row.formulaCode
                                              ? renderFormulaWithVariables(row.formulaCode)
                                              : <span className="text-[#595959]">e.g. 1 / (1 + exp(-k * ...))</span>}
                                          </span>
                                        </div>
                                        <input
                                          type="text"
                                          value={row.formulaCode}
                                          readOnly
                                          onKeyDown={(e) => e.preventDefault()}
                                          onPaste={(e) => e.preventDefault()}
                                          onScroll={(e) => {
                                            const m = e.target.parentElement?.querySelector("[data-formula-mirror]");
                                            if (m) m.scrollLeft = e.target.scrollLeft;
                                          }}
                                          disabled={isEntryStage && signalHyperoptType === entryHyperoptType}
                                          className={cx(
                                            "relative z-10 w-full h-full bg-transparent text-transparent caret-transparent select-none cursor-not-allowed rounded-md border-0 pl-3 pr-8 py-2 text-[11px] font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:ring-inset",
                                            isEntryStage && signalHyperoptType === entryHyperoptType && "cursor-not-allowed",
                                          )}
                                        />
                                        <button
                                          type="button"
                                          onClick={() => openFormulaEditor(row.formulaCode, row.setFormulaCode)}
                                          disabled={isEntryStage && signalHyperoptType === entryHyperoptType}
                                          className={cx(
                                            "absolute right-0 top-0 bottom-0 z-20 flex items-center justify-center w-8 h-full bg-emerald-600 text-white hover:bg-emerald-500 active:bg-emerald-700 rounded-r-md",
                                            isEntryStage && signalHyperoptType === entryHyperoptType && "opacity-60 cursor-not-allowed",
                                          )}
                                          title="Формула"
                                        >
                                          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                                            <path
                                              fillRule="nonzero"
                                              d="M5 4.5C5 3.672 5.672 3 6.5 3h11c.828 0 1.5.672 1.5 1.5V5c0 .552-.448 1-1 1s-1-.448-1-1V5H7v.54l6.562 5.625c.512.44.512 1.232 0 1.671L7 18.46V19h10c.552 0 1 .448 1 1s-.448 1-1 1H6.5C5.672 21 5 20.328 5 19.5v-1.27c0-.438.191-.854.524-1.139l5.94-4.091L5.524 6.909C5.191 6.624 5 6.208 5 5.77V4.5z"
                                            />
                                          </svg>
                                        </button>
                                      </div>
                                    </td>
                                    <td className="px-3 py-2 align-top">
                                      <div className="flex items-center gap-2">
                                        <input
                                          type="range"
                                          min={0}
                                          max={100}
                                          step={1}
                                          value={row.weight}
                                          onChange={(e) => setWeightCapped(row.setWeight, e.target.value, row.others)}
                                          disabled={isEntryStage && signalHyperoptType === entryHyperoptType}
                                          className={cx(
                                            "flex-1 max-w-[120px] h-2 accent-emerald-500",
                                            isEntryStage && signalHyperoptType === entryHyperoptType && "opacity-60 cursor-not-allowed",
                                          )}
                                        />
                                        <span className="text-[#8c8c8c] w-7">{row.weight}%</span>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                              <tfoot>
                                <tr className="bg-[#1a1a1a]">
                                  <td colSpan={3} className="px-3 py-2 text-right text-[11px] font-medium text-[#8c8c8c]">Total</td>
                                  <td className={cx("px-3 py-2 text-[11px] font-medium", (finMfeWeight + finMaeWeight + finAirWeight + finHitRateWeight) === 100 ? "text-emerald-500" : (finMfeWeight + finMaeWeight + finAirWeight + finHitRateWeight) > 100 ? "text-amber-500" : "text-[#8c8c8c]")}>{finMfeWeight + finMaeWeight + finAirWeight + finHitRateWeight}%</td>
                                </tr>
                              </tfoot>
                            </table>
                          </div>
                  </div>
                </div>
                )}

                {!isRunningOptimization ? (
                  <button 
                    type="button" 
                    className={cx(ui.btnPrimary, "h-9 w-full")}
                    onClick={() => {
                      setIsRunningOptimization(true);
                      setOptimizationProgress(0);
                      
                      // Simulate progress over 3 seconds
                      const duration = 3000;
                      const interval = 50;
                      const steps = duration / interval;
                      let currentStep = 0;
                      
                      const timer = setInterval(() => {
                        currentStep++;
                        setOptimizationProgress((currentStep / steps) * 100);
                        
                        if (currentStep >= steps) {
                          clearInterval(timer);
                          setTimeout(() => {
                            setIsRunningOptimization(false);
                            setOptimizationProgress(0);
                          }, 200);
                        }
                      }, interval);
                    }}
                    disabled={indicators.length === 0}
                  >
                    ⚡ Run Hyperoptimization
                  </button>
                ) : (
                  <div className={cx(ui.radius, ui.panelMuted, "p-4")}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[12px] text-[#d9d9d9] font-medium">
                        ⚡ Hyperoptimization running...
                      </span>
                      <span className="text-[11px] text-[#8c8c8c]">
                        {Math.round(optimizationProgress)}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-[#0f0f0f] rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500 transition-all duration-100 ease-linear rounded-full"
                        style={{ width: `${optimizationProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
              )}
            </div>

            {/* 4. HYPEROPT RESULTS (two-level table + Run normalization modal) */}
            <div className={cx(ui.radius, ui.panel, "overflow-hidden")}>
              <button
                type="button"
                onClick={() => toggleSection(4)}
                className={cx("w-full px-3 py-2 flex items-center justify-between gap-2 text-left", ui.panelMuted, "border-0 border-b", ui.divider, "hover:bg-[#1a1a1a] transition-colors")}
              >
                <div>
                  <div className="text-[12px] font-medium text-[#d9d9d9]">4. Hyperopt Results</div>
                  <div className={cx("text-[11px]", ui.textMuted)}>
                    Analyze hyperoptimization results, normalize scores by formula, and generate heatmaps and reports.
                  </div>
                </div>
                <span className="flex items-center gap-2">
                  <span className="rounded-md border border-[#303030] bg-[#0f0f0f] px-2 py-0.5 text-[10px] text-[#8c8c8c]">
                    {hyperoptResultsRows.length} runs
                  </span>
                  <span className="text-[#8c8c8c] text-[10px]">{collapsedSections.has(4) ? "▶" : "▼"}</span>
                </span>
              </button>
              {!collapsedSections.has(4) && (
              <div className="overflow-auto p-3 space-y-4">
                {/* Block 1: Hyperopt result */}
                <div className="rounded-lg border border-[#303030] overflow-hidden border-l-4 border-l-emerald-500">
                  <div className="px-3 py-2 font-medium border-b border-[#303030] bg-emerald-500/10 text-emerald-200 text-[12px]">
                    Hyperopt result
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-[11px]">
                      <thead className="bg-[#1a1a1a] text-[#8c8c8c]">
                        <tr>
                          <th className="px-2 py-2 text-left font-medium border-b border-[#303030] w-8"></th>
                          <th className="px-3 py-2 text-left font-medium border-b border-[#303030]">Date</th>
                          <th className="px-3 py-2 text-left font-medium border-b border-[#303030]">Pairs</th>
                          <th className="px-3 py-2 text-left font-medium border-b border-[#303030]">TimeFrame</th>
                          <th className="px-3 py-2 text-left font-medium border-b border-[#303030]">KnowRange</th>
                          <th className="px-3 py-2 text-left font-medium border-b border-[#303030]">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="text-[#d9d9d9]">
                        {hyperoptResultsRows.map((row) => (
                          <React.Fragment key={row.id}>
                            <tr className="border-b border-[#303030] bg-[#141414] hover:bg-[#1f1f1f]">
                              <td className="px-2 py-2 align-middle">
                                <button
                                  type="button"
                                  onClick={() => toggleHyperoptRow(row.id)}
                                  className="text-[#8c8c8c] hover:text-[#d9d9d9] p-0.5 rounded"
                                  aria-label={hyperoptResultsExpanded.has(row.id) ? "Collapse" : "Expand"}
                                >
                                  {hyperoptResultsExpanded.has(row.id) ? "▼" : "▶"}
                                </button>
                              </td>
                              <td className="px-3 py-2">{row.date}</td>
                              <td className="px-3 py-2">{row.pairs}</td>
                              <td className="px-3 py-2">{row.timeFrame}</td>
                              <td className="px-3 py-2 text-[#a6a6a6]">{row.knowRange}</td>
                              <td className="px-3 py-2">
                                {hyperoptRun !== "Pipeline" && (
                                  <button
                                    type="button"
                                    onClick={() => setShowNormalizationModal(true)}
                                    className={cx(ui.btnPrimary, "h-7 px-2 text-[10px] whitespace-nowrap")}
                                  >
                                    Post-processing
                                  </button>
                                )}
                              </td>
                            </tr>
                            {hyperoptResultsExpanded.has(row.id) && row.children && row.children.length > 0 && (
                              <tr>
                                <td colSpan={6} className="p-0 align-top bg-[#0f0f0f]">
                                  {/* Block 2: Normalization result (nested per expanded row) */}
                                  <div className="ml-4 mt-2 mb-2 rounded-lg border border-[#303030] overflow-hidden border-l-4 border-l-sky-500">
                                    <div className="px-3 py-1.5 font-medium border-b border-[#303030] bg-sky-500/10 text-sky-200 text-[11px]">
                                      Post-processing result
                                      <span className="ml-2 text-[#8c8c8c] font-normal">— {row.date} · {row.pairs}</span>
                                    </div>
                                    <div className="overflow-x-auto">
                                      <table className="w-full border-collapse text-[11px]">
                                        <thead className="bg-[#1a1a1a] text-[#8c8c8c]">
                                          <tr>
                                            <th className="px-2 py-1.5 text-left font-medium border-b border-[#303030] w-8"></th>
                                            <th className="px-3 py-1.5 text-left font-medium border-b border-[#303030] w-24">Date</th>
                                            <th className="px-3 py-1.5 text-left font-medium border-b border-[#303030] w-20">Min score</th>
                                            <th className="px-3 py-1.5 text-left font-medium border-b border-[#303030] w-20">AVG score</th>
                                            <th className="px-3 py-1.5 text-left font-medium border-b border-[#303030] w-20">Max score</th>
                                            <th className="px-3 py-1.5 text-left font-medium border-b border-[#303030]">Post-processing formula info</th>
                                            <th className="px-3 py-1.5 text-left font-medium border-b border-[#303030]">Actions</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {row.children.map((sub) => {
                                            const heatMapId = `hyperopt-${row.id}-${sub.id}`;
                                            const level3Items = sub.heatmapsAndReports || [];
                                            const isLevel3Expanded = hyperoptLevel3Expanded.has(sub.id);
                                            const hasTruncData = !!sub.truncScores;
                                            const normKey = `${row.id}::${sub.id}`;
                                            const isDetailsExpanded = normalizationDetailsExpanded.has(normKey);

                                            return (
                                              <React.Fragment key={sub.id}>
                                                <tr className="border-b border-[#303030]/50 hover:bg-[#1a1a1a]">
                                                  <td className="px-2 py-2 align-middle">
                                                    <button
                                                      type="button"
                                                        onClick={() => toggleNormalizationDetails(normKey)}
                                                      className="text-[#8c8c8c] hover:text-[#d9d9d9] p-0.5 rounded"
                                                      aria-label={isDetailsExpanded ? "Collapse" : "Expand"}
                                                    >
                                                      {isDetailsExpanded ? "▼" : "▶"}
                                                    </button>
                                                  </td>
                                                  <td className="px-3 py-2 text-[#a6a6a6]">{sub.date}</td>
                                                  <td className="px-3 py-2 tabular-nums text-[#d9d9d9]">{sub.minScore ?? "—"}</td>
                                                  <td className="px-3 py-2 tabular-nums text-[#d9d9d9]">{sub.avgScore ?? "—"}</td>
                                                  <td className="px-3 py-2 tabular-nums text-[#d9d9d9]">{sub.maxScore ?? "—"}</td>
                                                  <td className="px-3 py-2">
                                                    <HyperoptDetailsTooltip onShowDetails={() => setShowHyperoptDetailsModal(true)} />
                                                  </td>
                                                  <td className="px-3 py-2">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                      <button
                                                        type="button"
                                                        onClick={() => setHeatMapConfigModalId(heatMapId)}
                                                        className={cx(ui.btn, "h-7 px-2 text-[10px] whitespace-nowrap")}
                                                      >
                                                        Configure HeatMap
                                                      </button>
                                                      <button
                                                        type="button"
                                                        onClick={() => setShowReportModal(true)}
                                                        className={cx(ui.btn, "h-7 px-2 text-[10px] whitespace-nowrap")}
                                                      >
                                                        Generate Report
                                                      </button>
                                                      <button
                                                        type="button"
                                                        onClick={() => {
                                                          setSelectedNormalizationRow(sub);
                                                          setShowTruncateModal(true);
                                                        }}
                                                        className={cx(ui.btn, "h-7 px-2 text-[10px] whitespace-nowrap")}
                                                      >
                                                        Add truncate
                                                      </button>
                                                    </div>
                                                  </td>
                                                </tr>
                                                {isDetailsExpanded && (
                                                  <tr>
                                                    <td colSpan={7} className="p-0 align-top bg-[#0f0f0f]">
                                                      {/* Branch A: HeatMaps & Reports (full data scope) */}
                                                      <div className="ml-4 mt-2 mb-2 rounded-lg border border-[#303030] overflow-hidden border-l-4 border-l-amber-500 bg-[#111111]">
                                                        <div className="px-3 py-1.5 font-medium border-b border-[#303030] bg-amber-500/10 text-amber-200 text-[11px]">
                                                          HeatMaps &amp; Reports
                                                        </div>
                                                        <div className="overflow-x-auto">
                                                          <table className="w-full border-collapse text-[11px]">
                                                            <thead className="bg-[#1a1a1a] text-[#8c8c8c]">
                                                              <tr>
                                                                <th className="px-3 py-1.5 text-left font-medium border-b border-[#303030] w-24">
                                                                  Date
                                                                </th>
                                                                <th className="px-3 py-1.5 text-left font-medium border-b border-[#303030]">
                                                                  Type
                                                                </th>
                                                                <th className="px-3 py-1.5 text-left font-medium border-b border-[#303030]">
                                                                  Details
                                                                </th>
                                                                <th className="px-3 py-1.5 text-left font-medium border-b border-[#303030]">
                                                                  Actions
                                                                </th>
                                                              </tr>
                                                            </thead>
                                                            <tbody>
                                                              {level3Items.map((item) => (
                                                                <tr key={item.id} className="border-b border-[#303030]/30 hover:bg-[#141414]">
                                                                  <td className="px-3 py-2 text-[#a6a6a6]">{item.date}</td>
                                                                  <td className="px-3 py-2">{item.type}</td>
                                                                  <td className="px-3 py-2">
                                                                    <button
                                                                      type="button"
                                                                      title="info"
                                                                      className="text-[#8c8c8c] hover:text-[#d9d9d9] p-1 rounded inline-flex items-center justify-center"
                                                                      aria-label="Info"
                                                                    >
                                                                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                                                                        <circle cx="12" cy="12" r="10" />
                                                                        <path d="M12 16v-4M12 8h.01" />
                                                                      </svg>
                                                                    </button>
                                                                  </td>
                                                                  <td className="px-3 py-2">
                                                                    {item.type === "Heatmap" ? (
                                                                      <button
                                                                        type="button"
                                                                        onClick={() => setHeatMapViewModalId(heatMapId)}
                                                                        className={cx(ui.btn, "h-7 px-2 text-[10px] whitespace-nowrap")}
                                                                      >
                                                                        Show heatmap
                                                                      </button>
                                                                    ) : (
                                                                      <button
                                                                        type="button"
                                                                        onClick={() => setShowReportModal(true)}
                                                                        className={cx(ui.btn, "h-7 px-2 text-[10px] whitespace-nowrap")}
                                                                      >
                                                                        Download report
                                                                      </button>
                                                                    )}
                                                                  </td>
                                                                </tr>
                                                              ))}
                                                            </tbody>
                                                          </table>
                                                        </div>
                                                      </div>

                                                      {/* Block 2.5: Normalization details (per normalization row) */}
                                                      <div className="ml-4 mt-2 mb-2 rounded-lg border border-[#303030] overflow-hidden border-l-4 border-l-emerald-500 bg-[#111111]">
                                                        <div className="px-3 py-1.5 font-medium border-b border-[#303030] bg-emerald-500/10 text-emerald-200 text-[11px]">
                                                          Post-processing trunk details
                                                        </div>
                                                        <div className="overflow-x-auto">
                                                          <table className="w-full border-collapse text-[11px]">
                                                            <thead className="bg-[#1a1a1a] text-[#8c8c8c]">
                                                              <tr>
                                                                <th className="px-2 py-1.5 text-left font-medium border-b border-[#303030] w-8"></th>
                                                                <th className="px-3 py-1.5 text-left font-medium border-b border-[#303030] w-24">Date</th>
                                                                <th className="px-3 py-1.5 text-left font-medium border-b border-[#303030]">Min score</th>
                                                                <th className="px-3 py-1.5 text-left font-medium border-b border-[#303030]">AVG score</th>
                                                                <th className="px-3 py-1.5 text-left font-medium border-b border-[#303030]">Max score</th>
                                                                <th className="px-3 py-1.5 text-left font-medium border-b border-[#303030]">Fold size</th>
                                                                <th className="px-3 py-1.5 text-left font-medium border-b border-[#303030]">Actions</th>
                                                              </tr>
                                                            </thead>
                                                            <tbody>
                                                              {[
                                                                hasTruncData && {
                                                                  id: `${sub.id}-trunc`,
                                                                  label: "Trunc data",
                                                                  scores: sub.truncScores,
                                                                },
                                                              ]
                                                                .filter(Boolean)
                                                                .map((detail) => {
                                                                  const level3Key = `${sub.id}::${detail.id}`;
                                                                  const isLevel3ExpandedForRow = hyperoptLevel3Expanded.has(level3Key);
                                                                  return (
                                                                    <React.Fragment key={detail.id}>
                                                                      <tr className="border-b border-[#303030]/50 hover:bg-[#1a1a1a]">
                                                                        <td className="px-2 py-2 align-middle">
                                                                          {level3Items.length > 0 && (
                                                                            <button
                                                                              type="button"
                                                                              onClick={() => toggleHyperoptLevel3(level3Key)}
                                                                              className="text-[#8c8c8c] hover:text-[#d9d9d9] p-0.5 rounded"
                                                                              aria-label={isLevel3ExpandedForRow ? "Collapse" : "Expand"}
                                                                            >
                                                                              {isLevel3ExpandedForRow ? "▼" : "▶"}
                                                                            </button>
                                                                          )}
                                                                        </td>
                                                                      <td className="px-3 py-2 text-[#a6a6a6]">{sub.date}</td>
                                                                      <td className="px-3 py-2">{detail.scores?.min ?? "-"}</td>
                                                                      <td className="px-3 py-2">{detail.scores?.avg ?? "-"}</td>
                                                                      <td className="px-3 py-2">{detail.scores?.max ?? "-"}</td>
                                                                      <td className="px-3 py-2">{sub.foldSize ?? "-"}</td>
                                                                      <td className="px-3 py-2">
                                                                        <div className="flex items-center gap-2">
                                                                          <button
                                                                            type="button"
                                                                            onClick={() => setHeatMapConfigModalId(heatMapId)}
                                                                            className={cx(ui.btn, "h-7 px-2 text-[10px] whitespace-nowrap")}
                                                                          >
                                                                            Configure HeatMap
                                                                          </button>
                                                                          <button
                                                                            type="button"
                                                                            onClick={() => setShowReportModal(true)}
                                                                            className={cx(ui.btn, "h-7 px-2 text-[10px] whitespace-nowrap")}
                                                                          >
                                                                            Generate Report
                                                                          </button>
                                                                        </div>
                                                                      </td>
                                                                      </tr>
                                                                      {isLevel3ExpandedForRow && level3Items.length > 0 && (
                                                                        <tr>
                                                                          <td colSpan={7} className="p-0 align-top bg-[#0a0a0a]">
                                                                          {/* Block 3: HeatMaps & Reports (child of Normalization details) */}
                                                                          <div className="ml-4 mt-2 mb-2 rounded-lg border border-[#303030] overflow-hidden border-l-4 border-l-amber-500">
                                                                            <div className="px-3 py-1.5 font-medium border-b border-[#303030] bg-amber-500/10 text-amber-200 text-[11px]">
                                                                              HeatMaps &amp; Reports
                                                                            </div>
                                                                            <div className="overflow-x-auto">
                                                                              <table className="w-full border-collapse text-[11px]">
                                                                                <thead className="bg-[#1a1a1a] text-[#8c8c8c]">
                                                                                  <tr>
                                                                                    <th className="px-3 py-1.5 text-left font-medium border-b border-[#303030] w-24">Date</th>
                                                                                    <th className="px-3 py-1.5 text-left font-medium border-b border-[#303030]">Type</th>
                                                                                    <th className="px-3 py-1.5 text-left font-medium border-b border-[#303030]">Details</th>
                                                                                    <th className="px-3 py-1.5 text-left font-medium border-b border-[#303030]">Actions</th>
                                                                                  </tr>
                                                                                </thead>
                                                                                <tbody>
                                                                                  {level3Items.map((item) => (
                                                                                    <tr key={item.id} className="border-b border-[#303030]/30 hover:bg-[#141414]">
                                                                                      <td className="px-3 py-2 text-[#a6a6a6]">{item.date}</td>
                                                                                      <td className="px-3 py-2">{item.type}</td>
                                                                                      <td className="px-3 py-2">
                                                                                        <button
                                                                                          type="button"
                                                                                          title="info"
                                                                                          className="text-[#8c8c8c] hover:text-[#d9d9d9] p-1 rounded inline-flex items-center justify-center"
                                                                                          aria-label="Info"
                                                                                        >
                                                                                          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>
                                                                                        </button>
                                                                                      </td>
                                                                                      <td className="px-3 py-2">
                                                                                        {item.type === "Heatmap" ? (
                                                                                          <button
                                                                                            type="button"
                                                                                            onClick={() => setHeatMapViewModalId(heatMapId)}
                                                                                            className={cx(ui.btn, "h-7 px-2 text-[10px] whitespace-nowrap")}
                                                                                          >
                                                                                            Show heatmap
                                                                                          </button>
                                                                                        ) : (
                                                                                          <button
                                                                                            type="button"
                                                                                            onClick={() => setShowReportModal(true)}
                                                                                            className={cx(ui.btn, "h-7 px-2 text-[10px] whitespace-nowrap")}
                                                                                          >
                                                                                            Download report
                                                                                          </button>
                                                                                        )}
                                                                                      </td>
                                                                                    </tr>
                                                                                  ))}
                                                                                </tbody>
                                                                              </table>
                                                                            </div>
                                                                          </div>
                                                                          </td>
                                                                        </tr>
                                                                      )}
                                                                    </React.Fragment>
                                                                  );
                                                                })}
                                                            </tbody>
                                                          </table>
                                                        </div>
                                                      </div>
                                                    </td>
                                                  </tr>
                                                )}
                                              </React.Fragment>
                                            );
                                          })}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              )}
            </div>

            {/* 5. BEST RESULTS (Signal only) */}
            {!isEntryStage && (
              <div className={cx(ui.radius, ui.panel, "overflow-hidden")}>
                <button
                  type="button"
                  onClick={() => toggleSection(5)}
                  className={cx(
                    "w-full px-3 py-2 flex items-center justify-between gap-2 text-left",
                    ui.panelMuted,
                    "border-0 border-b",
                    ui.divider,
                    "hover:bg-[#1a1a1a] transition-colors",
                  )}
                >
                  <div>
                    <div className="text-[12px] font-medium text-[#d9d9d9]">5. Best scores for Stage 2</div>
                    <div className={cx("text-[11px]", ui.textMuted)}>
                      Select scores from the heatmap or enter manually for Stage 2
                    </div>
                  </div>
                  <span className="flex items-center gap-2">
                    <span className="rounded-md border border-[#303030] bg-[#0f0f0f] px-2 py-0.5 text-[10px] text-[#8c8c8c]">
                      {signalBestResults.length} saved
                    </span>
                    <span className="text-[#8c8c8c] text-[10px]">{collapsedSections.has(5) ? "▶" : "▼"}</span>
                  </span>
                </button>
                {!collapsedSections.has(5) && (
                  <div className="p-3 space-y-3">
                    <div className={cx("text-[11px]", ui.textMuted)}>
                      Choose the best values from the heatmap to apply in Stage 2 (Entry).
                    </div>
                    {signalBestResults.length === 0 ? (
                      <div className={cx(ui.radius, ui.panelMuted, "p-3 text-[11px]", ui.textMuted)}>
                        No best scores for Stage 2 yet. Use "☆ Save as Best" in Hyperopt Results or add manually.
                      </div>
                    ) : (
                      <div className="overflow-x-auto border border-[#303030] rounded-lg">
                        <table className="w-full text-[11px] border-collapse">
                          <thead className="bg-[#1a1a1a] text-[#8c8c8c]">
                            <tr>
                              <th className="px-3 py-2 text-left font-medium border-b border-[#303030] w-6"></th>
                              <th className="px-3 py-2 text-left font-medium border-b border-[#303030]">Label</th>
                              <th className="px-3 py-2 text-left font-medium border-b border-[#303030]">Score</th>
                              <th className="px-3 py-2 text-left font-medium border-b border-[#303030]">MFE</th>
                              <th className="px-3 py-2 text-left font-medium border-b border-[#303030]">MAE</th>
                              <th className="px-3 py-2 text-left font-medium border-b border-[#303030]">AIR</th>
                          <th className="px-3 py-2 text-left font-medium border-b border-[#303030]">normStability</th>
                              <th className="px-3 py-2 text-left font-medium border-b border-[#303030]">Indicators</th>
                              <th className="px-3 py-2 text-left font-medium border-b border-[#303030]">Source</th>
                              <th className="px-3 py-2 text-left font-medium border-b border-[#303030]">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="text-[#d9d9d9]">
                            {signalBestResults.map((best) => (
                              <tr key={best.id} className="border-b border-[#303030]/60 hover:bg-[#141414]">
                                <td className="px-3 py-2 align-middle">
                                  <span title={best.timestamp} className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
                                </td>
                                <td className="px-3 py-2">
                                  <div className="flex flex-col gap-0.5">
                                    <span className="font-medium text-[11px] text-[#f5f5f5]">
                                      {best.label || "Best result"}
                                    </span>
                                    <span className={cx("text-[10px]", ui.textMuted)}>
                                      {best.pairs || pairs || "-"} · {best.timeRange || timeRange || "-"}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-3 py-2">{best.score != null ? best.score.toFixed(3) : "-"}</td>
                                <td className="px-3 py-2">{best.mfe != null ? best.mfe.toFixed(3) : "-"}</td>
                                <td className="px-3 py-2">{best.mae != null ? best.mae.toFixed(3) : "-"}</td>
                                <td className="px-3 py-2">{best.air != null ? best.air.toFixed(3) : "-"}</td>
                                <td className="px-3 py-2">
                                  {best.stability != null ? best.stability.toFixed(3) : "-"}
                                </td>
                                <td className="px-3 py-2">
                                  <div className="flex flex-wrap gap-1">
                                    {(best.indicators || []).map((ind) => {
                                      const params = formatIndicatorSnapshot(ind);
                                      return (
                                        <span
                                          key={ind.id}
                                          className="inline-flex items-center gap-1 rounded-full bg-[#1a1a1a] border border-[#303030] px-2 py-0.5"
                                        >
                                          <span className="text-[10px] text-[#f5f5f5]">
                                            {ind.displayName || getDefaultDisplayName(ind.type || "")}
                                          </span>
                                          {params && (
                                            <span className="text-[9px] text-[#a6a6a6] truncate max-w-[160px]">
                                              {params}
                                            </span>
                                          )}
                                        </span>
                                      );
                                    })}
                                  </div>
                                </td>
                                <td className="px-3 py-2 capitalize text-[#a6a6a6]">
                                  {best.source === "heatmap" ? "HeatMap" : best.source || "Manual"}
                                </td>
                                <td className="px-3 py-2">
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedBestResult(best);
                                        setShowBestResultDetailsModal(true);
                                      }}
                                      className={cx(ui.btn, "h-7 px-2 text-[10px] whitespace-nowrap")}
                                    >
                                      View
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (!confirm("Remove this Best result?")) return;
                                        setSignalBestResults((prev) =>
                                          prev.filter((item) => item.id !== best.id),
                                        );
                                      }}
                                      className={cx(
                                        ui.btn,
                                        "h-7 px-2 text-[10px] whitespace-nowrap text-red-400 border-red-500/60 hover:bg-red-500/10",
                                      )}
                                    >
                                      Remove
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

          </div>
        ) : (
          <div className={cx(ui.radius, ui.panelMuted, "px-4 py-3 text-[12px]", ui.textSubtle)}>
            {active.title} — coming soon.
          </div>
        )}
      </div>
      
      {/* Modals */}
      {showAddModal && (
        <AddIndicatorModal 
          initialType={addModalType}
          onClose={() => setShowAddModal(false)} 
          onAdd={handleAddIndicator} 
        />
      )}
      
      {showReportModal && (
        <GenerateReportModal 
          indicators={indicators}
          onClose={() => setShowReportModal(false)} 
          onGenerate={(config) => {
            console.log('📊 Report generated:', config);
            // TODO: Handle report generation
            alert(`Report generated for ${config.indicator.name}`);
          }} 
        />
      )}
      {/* Formula Editor modal */}
      {showFormulaEditor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={handleFormulaEditorCancel}>
          <div
            className={cx(
              ui.radius,
              "bg-[#141414] border border-[#303030] max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-xl"
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#303030]">
              <span className="text-[14px] font-medium text-[#d9d9d9]">Formula Editor</span>
              <button
                type="button"
                onClick={handleFormulaEditorCancel}
                className="text-[#8c8c8c] hover:text-[#d9d9d9] p-1"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4 space-y-4">
              {/* Textarea */}
              <div className="space-y-1.5">
                <div className="text-[11px] font-medium text-[#d9d9d9]">Score formula</div>
                <div className="relative min-h-[140px] rounded-md border border-[#303030] bg-[#0f0f0f] overflow-hidden">
                  <div
                    ref={formulaEditorMirrorRef}
                    className="absolute inset-0 overflow-auto px-3 py-2 text-[11px] font-mono text-[#d9d9d9] whitespace-pre-wrap break-words pointer-events-none [&::-webkit-scrollbar]:hidden"
                    style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                    aria-hidden
                  >
                    {formulaEditorValue ? (
                      renderFormulaEditorWithVariables(formulaEditorValue)
                    ) : (
                      <span className="text-[#595959]">Enter formula...</span>
                    )}
                  </div>
                  <textarea
                    ref={formulaEditorRef}
                    value={formulaEditorValue}
                    onChange={handleFormulaEditorChange}
                    onSelect={handleFormulaEditorSelect}
                    onScroll={(e) => {
                      const m = formulaEditorMirrorRef.current;
                      if (m) {
                        m.scrollTop = e.target.scrollTop;
                        m.scrollLeft = e.target.scrollLeft;
                      }
                    }}
                    className={cx(
                      "relative z-10 w-full min-h-[140px] resize-y rounded-md border-0 bg-transparent px-3 py-2 text-[11px] font-mono text-transparent caret-[#d9d9d9] focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:ring-inset"
                    )}
                    placeholder="Enter formula..."
                  />
                </div>
              </div>
              {/* Variables & Functions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="text-[11px] font-medium text-[#d9d9d9]">Variables</div>
                  <div className="flex items-center gap-2">
                    <select
                      className={cx(ui.input, "h-8 text-[11px] flex-1")}
                      onChange={(e) => {
                        if (!e.target.value) return;
                        insertIntoFormulaEditor(e.target.value);
                        e.target.selectedIndex = 0;
                      }}
                    >
                      <option value="">Select variable…</option>
                      {FORMULA_EDITOR_VARIABLES.map((v) => (
                        <option key={v} value={v}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-[11px] font-medium text-[#d9d9d9]">Functions</div>
                  <div className="flex items-center gap-2">
                    <select
                      className={cx(ui.input, "h-8 text-[11px] flex-1")}
                      onChange={(e) => {
                        if (!e.target.value) return;
                        insertIntoFormulaEditor(e.target.value);
                        e.target.selectedIndex = 0;
                      }}
                    >
                      <option value="">Select function…</option>
                      {FORMULA_EDITOR_FUNCTIONS.map((fn) => (
                        <option key={fn.label} value={fn.template}>
                          {fn.label} — {fn.template}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              {/* Operators */}
              <div className="space-y-2">
                <div className="text-[11px] font-medium text-[#d9d9d9]">Operators</div>
                <div className="flex flex-wrap gap-1.5">
                  {FORMULA_EDITOR_OPERATORS.map((op) => (
                    <button
                      key={op}
                      type="button"
                      onClick={() => insertIntoFormulaEditor(op)}
                      className="inline-flex items-center justify-center rounded-md border border-[#303030] bg-[#0f0f0f] px-2.5 py-1 text-[11px] text-[#d9d9d9] hover:bg-[#1f1f1f] active:translate-y-[0.5px]"
                    >
                      {op}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between gap-2 px-4 py-3 border-t border-[#303030] bg-[#111111]">
              <button
                type="button"
                onClick={handleFormulaEditorClear}
                className="text-[11px] text-[#8c8c8c] hover:text-[#d9d9d9]"
              >
                Clear
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleFormulaEditorCancel}
                  className={cx(ui.btn, "h-8 px-3 text-[11px]")}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleFormulaEditorApply}
                  className={cx(ui.btnPrimary, "h-8 px-3 text-[11px]")}
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Run normalization modal — same block as Normalization formulas */}
      {showNormalizationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => setShowNormalizationModal(false)}>
          <div className={cx(ui.radius, "bg-[#141414] border border-[#303030] max-w-[720px] w-full max-h-[90vh] overflow-hidden flex flex-col shadow-xl")} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#303030]">
              <span className="text-[14px] font-medium text-[#d9d9d9]">
                Run normalization {isEntryStage ? "(Entry)" : "(Signal)"}
              </span>
              <button type="button" onClick={() => setShowNormalizationModal(false)} className="text-[#8c8c8c] hover:text-[#d9d9d9] p-1">✕</button>
            </div>
            <div className="overflow-auto p-4">
              <div className="space-y-3">
                  {/* Block 1: Stability formula (collapsible) */}
                  <div className="rounded-lg border border-[#303030] overflow-hidden bg-[#0f0f0f]/50">
                    <button
                      type="button"
                      onClick={() => toggleNormModalSection("stability")}
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-left text-[12px] font-medium text-[#d9d9d9] hover:bg-[#1a1a1a] transition-colors"
                    >
                      <span className="text-[#8c8c8c] text-[10px]">{normModalCollapsedSections.has("stability") ? "▶" : "▼"}</span>
                      <span>Stability formula</span>
                    </button>
                    {!normModalCollapsedSections.has("stability") && (
                      <div className="px-3 pb-3 pt-0 space-y-3 border-t border-[#303030]">
                        <div className="space-y-1.5 pt-3">
                          <div className="text-[11px] font-medium text-[#d9d9d9]">Stability formula</div>
                    <div className="flex flex-wrap items-center gap-3 gap-y-2">
                      <select value={finStabilityBlockFormula} onChange={(e) => setFinStabilityBlockFormula(e.target.value)} className={cx(ui.input, "h-9 text-[12px] w-full max-w-[200px]")}>
                        {METRIC_FORMULA_OPTIONS.map((v) => <option key={v} value={v}>{v}</option>)}
                      </select>
                      <div className="min-w-[200px] flex-1 max-w-[800px]">
                        <div className="relative rounded-md border border-[#303030] bg-[#0f0f0f] h-9 overflow-hidden">
                          <div data-formula-mirror className="absolute left-0 top-0 bottom-0 right-8 pl-3 overflow-x-auto overflow-y-hidden whitespace-nowrap py-2 text-[11px] font-mono text-[#d9d9d9] pointer-events-none flex items-center [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }} aria-hidden>
                            <span className="inline-block min-w-full">{finStabilityBlockFormulaCode ? renderFormulaWithVariables(finStabilityBlockFormulaCode) : <span className="text-[#595959]">e.g. 1 / (1 + exp(-k * ...))</span>}</span>
                          </div>
                          <input type="text" value={finStabilityBlockFormulaCode} onChange={(e) => setFinStabilityBlockFormulaCode(e.target.value)} onScroll={(e) => { const m = e.target.parentElement?.querySelector("[data-formula-mirror]"); if (m) m.scrollLeft = e.target.scrollLeft; }} className="relative z-10 w-full h-full bg-transparent text-transparent caret-[#d9d9d9] rounded-md border-0 pl-3 pr-8 py-2 text-[11px] font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:ring-inset" />
                          <button type="button" onClick={() => openFormulaEditor(finStabilityBlockFormulaCode, setFinStabilityBlockFormulaCode)} className="absolute right-0 top-0 bottom-0 z-20 flex items-center justify-center w-8 h-full bg-emerald-600 text-white hover:bg-emerald-500 active:bg-emerald-700 rounded-r-md" title="Формула">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                              <path fillRule="nonzero" d="M5 4.5C5 3.672 5.672 3 6.5 3h11c.828 0 1.5.672 1.5 1.5V5c0 .552-.448 1-1 1s-1-.448-1-1V5H7v.54l6.562 5.625c.512.44.512 1.232 0 1.671L7 18.46V19h10c.552 0 1 .448 1 1s-.448 1-1 1H6.5C5.672 21 5 20.328 5 19.5v-1.27c0-.438.191-.854.524-1.139l5.94-4.091L5.524 6.909C5.191 6.624 5 6.208 5 5.77V4.5z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Normalization stability formulas and weights (normDiff*) */}
                  <div>
                    <div className="text-[11px] font-medium text-[#d9d9d9] mb-2">Normalization stability formulas and weights</div>
                    <div className="overflow-x-auto border border-[#303030] rounded-lg">
                      <table className="w-full text-[11px] border-collapse">
                        <thead>
                          <tr className="bg-[#1a1a1a] text-[#8c8c8c]">
                            <th className="px-3 py-2 text-left font-medium border-b border-[#303030] w-24">Metrics</th>
                            <th className="px-3 py-2 text-left font-medium border-b border-[#303030] w-32">Formula</th>
                            <th className="px-3 py-2 text-left font-medium border-b border-[#303030] min-w-[200px]">Formula Code</th>
                            <th className="px-3 py-2 text-left font-medium border-b border-[#303030]">Weight</th>
                          </tr>
                        </thead>
                        <tbody className="text-[#d9d9d9]">
                          {[
                            { metric: "normDiffMFE", formula: finStabDiffMfeFormula, setFormula: setFinStabDiffMfeFormula, formulaCode: finStabDiffMfeFormulaCode, setFormulaCode: setFinStabDiffMfeFormulaCode, weight: finStabDiffMfeWeight, setWeight: setFinStabDiffMfeWeight, others: finStabDiffMaeWeight + finStabDiffAirWeight + finStabDiffHitRateWeight + finStabDiffStdWeight },
                            { metric: "normDiffMAE", formula: finStabDiffMaeFormula, setFormula: setFinStabDiffMaeFormula, formulaCode: finStabDiffMaeFormulaCode, setFormulaCode: setFinStabDiffMaeFormulaCode, weight: finStabDiffMaeWeight, setWeight: setFinStabDiffMaeWeight, others: finStabDiffMfeWeight + finStabDiffAirWeight + finStabDiffHitRateWeight + finStabDiffStdWeight },
                            { metric: "normDiffAIR", formula: finStabDiffAirFormula, setFormula: setFinStabDiffAirFormula, formulaCode: finStabDiffAirFormulaCode, setFormulaCode: setFinStabDiffAirFormulaCode, weight: finStabDiffAirWeight, setWeight: setFinStabDiffAirWeight, others: finStabDiffMfeWeight + finStabDiffMaeWeight + finStabDiffHitRateWeight + finStabDiffStdWeight },
                            { metric: "normDiffHitRate", formula: finStabDiffHitRateFormula, setFormula: setFinStabDiffHitRateFormula, formulaCode: finStabDiffHitRateFormulaCode, setFormulaCode: setFinStabDiffHitRateFormulaCode, weight: finStabDiffHitRateWeight, setWeight: setFinStabDiffHitRateWeight, others: finStabDiffMfeWeight + finStabDiffMaeWeight + finStabDiffAirWeight + finStabDiffStdWeight },
                            { metric: "normDiffStd", formula: finStabDiffStdFormula, setFormula: setFinStabDiffStdFormula, formulaCode: finStabDiffStdFormulaCode, setFormulaCode: setFinStabDiffStdFormulaCode, weight: finStabDiffStdWeight, setWeight: setFinStabDiffStdWeight, others: finStabDiffMfeWeight + finStabDiffMaeWeight + finStabDiffAirWeight + finStabDiffHitRateWeight },
                          ].map((row) => (
                            <tr key={row.metric} className="border-b border-[#303030]">
                              <td className="px-3 py-2 text-[#a6a6a6] align-top">{row.metric}</td>
                              <td className="px-3 py-2 w-32 align-top">
                                <select
                                  value={row.formula}
                                  onChange={(e) => {
                                    const next = e.target.value;
                                    row.setFormula(next);
                                    const byTemplate = STABILITY_NORM_DIFF_FORMULA_CODE_BY_TEMPLATE[row.metric];
                                    const code = byTemplate && byTemplate[next];
                                    if (code) row.setFormulaCode(code);
                                  }}
                                  className={cx(ui.input, "h-8 text-[11px] w-full min-w-0")}
                                >
                                  <option value="Formula 1">{row.metric}</option>
                                  <option value="Formula 2">Fake formula</option>
                                </select>
                              </td>
                              <td className="px-3 py-2 align-top min-w-[200px]">
                                <div className="relative rounded-md border border-[#303030] bg-[#0f0f0f] h-8 overflow-hidden min-w-[200px]">
                                  <div data-formula-mirror className="absolute left-0 top-0 bottom-0 right-8 pl-3 overflow-x-auto overflow-y-hidden whitespace-nowrap py-2 text-[11px] font-mono text-[#d9d9d9] pointer-events-none flex items-center [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }} aria-hidden>
                                    <span className="inline-block min-w-full">{row.formulaCode ? renderFormulaWithVariables(row.formulaCode) : <span className="text-[#595959]">e.g. formula</span>}</span>
                                  </div>
                                  <input
                                    type="text"
                                    value={row.formulaCode}
                                    readOnly
                                    onKeyDown={(e) => e.preventDefault()}
                                    onPaste={(e) => e.preventDefault()}
                                    onScroll={(e) => {
                                      const m = e.target.parentElement?.querySelector("[data-formula-mirror]");
                                      if (m) m.scrollLeft = e.target.scrollLeft;
                                    }}
                                    className="relative z-10 w-full h-full bg-transparent text-transparent caret-transparent select-none cursor-not-allowed rounded-md border-0 pl-3 pr-8 py-2 text-[11px] font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:ring-inset"
                                  />
                                  <button type="button" onClick={() => openFormulaEditor(row.formulaCode, row.setFormulaCode)} className="absolute right-0 top-0 bottom-0 z-20 flex items-center justify-center w-8 h-full bg-emerald-600 text-white hover:bg-emerald-500 active:bg-emerald-700 rounded-r-md" title="Формула">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                                      <path fillRule="nonzero" d="M5 4.5C5 3.672 5.672 3 6.5 3h11c.828 0 1.5.672 1.5 1.5V5c0 .552-.448 1-1 1s-1-.448-1-1V5H7v.54l6.562 5.625c.512.44.512 1.232 0 1.671L7 18.46V19h10c.552 0 1 .448 1 1s-.448 1-1 1H6.5C5.672 21 5 20.328 5 19.5v-1.27c0-.438.191-.854.524-1.139l5.94-4.091L5.524 6.909C5.191 6.624 5 6.208 5 5.77V4.5z" />
                                    </svg>
                                  </button>
                                </div>
                              </td>
                              <td className="px-3 py-2 align-top">
                                <div className="flex items-center gap-2">
                                  <input type="range" min={0} max={100} step={1} value={row.weight} onChange={(e) => setWeightCapped(row.setWeight, e.target.value, row.others)} className="flex-1 max-w-[120px] h-2 accent-emerald-500" />
                                  <span className="text-[#8c8c8c] w-7">{row.weight}%</span>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="bg-[#1a1a1a]">
                            <td colSpan={3} className="px-3 py-2 text-right text-[11px] font-medium text-[#8c8c8c]">Total</td>
                            <td className={cx("px-3 py-2 text-[11px] font-medium", finStabDiffWeightsSum === 100 ? "text-emerald-500" : finStabDiffWeightsSum > 100 ? "text-amber-500" : "text-[#8c8c8c]")}>{finStabDiffWeightsSum}%</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                        </div>
                    )}
                  </div>
                  {/* Block 2: Score formula (collapsible) */}
                  <div className="rounded-lg border border-[#303030] overflow-hidden bg-[#0f0f0f]/50">
                    <button
                      type="button"
                      onClick={() => toggleNormModalSection("score")}
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-left text-[12px] font-medium text-[#d9d9d9] hover:bg-[#1a1a1a] transition-colors"
                    >
                      <span className="text-[#8c8c8c] text-[10px]">{normModalCollapsedSections.has("score") ? "▶" : "▼"}</span>
                      <span>Score formula</span>
                    </button>
                    {!normModalCollapsedSections.has("score") && (
                      <div className="px-3 pb-3 pt-0 space-y-3 border-t border-[#303030]">
                        <div className="space-y-1.5 pt-3">
                          <div className="text-[11px] font-medium text-[#d9d9d9]">Score formula</div>
                          <div className="flex flex-wrap items-center gap-3 gap-y-2">
                            <select
                              value={finalScoreFormula}
                        onChange={(e) => {
                          const next = e.target.value;
                          setFinalScoreFormula(next);
                          const code = FINAL_SCORE_CODE_BY_TEMPLATE[next];
                          if (code) setFinFinalFormulaCode(code);
                        }}
                        className={cx(ui.input, "h-9 text-[12px] w-full max-w-[200px]")}
                      >
                        {FINAL_SCORE_FORMULA_OPTIONS.map((v) => <option key={v} value={v}>{v}</option>)}
                      </select>
                      <div className="min-w-[200px] flex-1 max-w-[800px]">
                        <div className="relative rounded-md border border-[#303030] bg-[#0f0f0f] h-9 overflow-hidden">
                          <div data-formula-mirror className="absolute left-0 top-0 bottom-0 right-8 pl-3 overflow-x-auto overflow-y-hidden whitespace-nowrap py-2 text-[11px] font-mono text-[#d9d9d9] pointer-events-none flex items-center [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }} aria-hidden>
                            <span className="inline-block min-w-full">{finFinalFormulaCode ? renderFormulaWithVariables(finFinalFormulaCode) : <span className="text-[#595959]">e.g. 1 / (1 + exp(-k * ...))</span>}</span>
                          </div>
                          <input
                            type="text"
                            value={finFinalFormulaCode}
                            readOnly
                            onKeyDown={(e) => e.preventDefault()}
                            onPaste={(e) => e.preventDefault()}
                            onScroll={(e) => {
                              const m = e.target.parentElement?.querySelector("[data-formula-mirror]");
                              if (m) m.scrollLeft = e.target.scrollLeft;
                            }}
                            placeholder="Formula code"
                            className="relative z-10 w-full h-full bg-transparent text-transparent caret-transparent select-none cursor-not-allowed rounded-md border-0 pl-3 pr-8 py-2 text-[11px] font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:ring-inset"
                          />
                          <button
                            type="button"
                            onClick={() => openFormulaEditor(finFinalFormulaCode, setFinFinalFormulaCode)}
                            className="absolute right-0 top-0 bottom-0 z-20 flex items-center justify-center w-8 h-full bg-emerald-600 text-white hover:bg-emerald-500 active:bg-emerald-700 rounded-r-md"
                            title="Формула"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                              <path fillRule="nonzero" d="M5 4.5C5 3.672 5.672 3 6.5 3h11c.828 0 1.5.672 1.5 1.5V5c0 .552-.448 1-1 1s-1-.448-1-1V5H7v.54l6.562 5.625c.512.44.512 1.232 0 1.671L7 18.46V19h10c.552 0 1 .448 1 1s-.448 1-1 1H6.5C5.672 21 5 20.328 5 19.5v-1.27c0-.438.191-.854.524-1.139l5.94-4.091L5.524 6.909C5.191 6.624 5 6.208 5 5.77V4.5z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                        </div>
                        <div className="text-[11px] font-medium text-[#d9d9d9]">Normalization metrics formulas and weights</div>
                  <div className="overflow-x-auto border border-[#303030] rounded-lg">
                    <table className="w-full text-[11px] border-collapse">
                      <thead>
                        <tr className="bg-[#1a1a1a] text-[#8c8c8c]">
                          <th className="px-3 py-2 text-left font-medium border-b border-[#303030] w-24">Metrics</th>
                          <th className="px-3 py-2 text-left font-medium border-b border-[#303030] w-32">Formula</th>
                          <th className="px-3 py-2 text-left font-medium border-b border-[#303030] min-w-[200px]">Formula Code</th>
                          <th className="px-3 py-2 text-left font-medium border-b border-[#303030]">Weight</th>
                        </tr>
                      </thead>
                      <tbody className="text-[#d9d9d9]">
                        <tr className="border-b border-[#303030]">
                          <td className="px-3 py-2 text-[#a6a6a6] align-top">normStability</td>
                          <td className="px-3 py-2 w-32 align-top">
                            <select
                              value={finStabilityFormula}
                              onChange={(e) => {
                                const next = e.target.value;
                                setFinStabilityFormula(next);
                                const byTemplate = METRIC_FORMULA_CODE_BY_TEMPLATE.normStability;
                                const code = byTemplate && byTemplate[next];
                                if (code) setFinStabilityFormulaCode(code);
                              }}
                              className={cx(ui.input, "h-8 text-[11px] w-full min-w-0")}
                            >
                              <option value="Formula 1">normStability</option>
                              <option value="Formula 2">Fake formula</option>
                            </select>
                          </td>
                          <td className="px-3 py-2 align-top min-w-[200px]">
                            <div className="relative rounded-md border border-[#303030] bg-[#0f0f0f] h-8 overflow-hidden min-w-[200px]">
                              <div data-formula-mirror className="absolute left-0 top-0 bottom-0 right-8 pl-3 overflow-x-auto overflow-y-hidden whitespace-nowrap py-2 text-[11px] font-mono text-[#d9d9d9] pointer-events-none flex items-center [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }} aria-hidden>
                                <span className="inline-block min-w-full">{finStabilityFormulaCode ? renderFormulaWithVariables(finStabilityFormulaCode) : <span className="text-[#595959]">e.g. 1 / (1 + exp(-k * ...))</span>}</span>
                              </div>
                              <input type="text" value={finStabilityFormulaCode} onChange={(e) => setFinStabilityFormulaCode(e.target.value)} onScroll={(e) => { const m = e.target.parentElement?.querySelector("[data-formula-mirror]"); if (m) m.scrollLeft = e.target.scrollLeft; }} className="relative z-10 w-full h-full bg-transparent text-transparent caret-[#d9d9d9] rounded-md border-0 pl-3 pr-8 py-2 text-[11px] font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:ring-inset" />
                              <button type="button" onClick={() => openFormulaEditor(finStabilityFormulaCode, setFinStabilityFormulaCode)} className="absolute right-0 top-0 bottom-0 z-20 flex items-center justify-center w-8 h-full bg-emerald-600 text-white hover:bg-emerald-500 active:bg-emerald-700 rounded-r-md" title="Формула">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                                  <path fillRule="nonzero" d="M5 4.5C5 3.672 5.672 3 6.5 3h11c.828 0 1.5.672 1.5 1.5V5c0 .552-.448 1-1 1s-1-.448-1-1V5H7v.54l6.562 5.625c.512.44.512 1.232 0 1.671L7 18.46V19h10c.552 0 1 .448 1 1s-.448 1-1 1H6.5C5.672 21 5 20.328 5 19.5v-1.27c0-.438.191-.854.524-1.139l5.94-4.091L5.524 6.909C5.191 6.624 5 6.208 5 5.77V4.5z" />
                                </svg>
                              </button>
                            </div>
                          </td>
                          <td className="px-3 py-2 align-top">
                            <div className="flex items-center gap-2">
                              <input type="range" min={0} max={100} step={1} value={finStabilityWeight} onChange={(e) => setWeightCapped(setFinStabilityWeight, e.target.value, finMfeWeight + finMaeWeight + finAirWeight + finHitRateWeight)} className="flex-1 max-w-[120px] h-2 accent-emerald-500" />
                              <span className="text-[#8c8c8c] w-7">{finStabilityWeight}%</span>
                            </div>
                          </td>
                        </tr>
                        {[
                          { metric: "normMFE", formula: finMfeFormula, setFormula: setFinMfeFormula, formulaCode: finMfeFormulaCode, setFormulaCode: setFinMfeFormulaCode, weight: finMfeWeight, setWeight: setFinMfeWeight, others: finStabilityWeight + finMaeWeight + finAirWeight + finHitRateWeight },
                          { metric: "normMAE", formula: finMaeFormula, setFormula: setFinMaeFormula, formulaCode: finMaeFormulaCode, setFormulaCode: setFinMaeFormulaCode, weight: finMaeWeight, setWeight: setFinMaeWeight, others: finStabilityWeight + finMfeWeight + finAirWeight + finHitRateWeight },
                          { metric: "normAIR", formula: finAirFormula, setFormula: setFinAirFormula, formulaCode: finAirFormulaCode, setFormulaCode: setFinAirFormulaCode, weight: finAirWeight, setWeight: setFinAirWeight, others: finStabilityWeight + finMfeWeight + finMaeWeight + finHitRateWeight },
                          { metric: "normHitRate", formula: finHitRateFormula, setFormula: setFinHitRateFormula, formulaCode: finHitRateFormulaCode, setFormulaCode: setFinHitRateFormulaCode, weight: finHitRateWeight, setWeight: setFinHitRateWeight, others: finStabilityWeight + finMfeWeight + finMaeWeight + finAirWeight },
                        ].map((row) => (
                          <tr key={row.metric} className="border-b border-[#303030]">
                            <td className="px-3 py-2 text-[#a6a6a6] align-top">{row.metric}</td>
                            <td className="px-3 py-2 w-32 align-top">
                              <select
                                value={row.formula}
                                onChange={(e) => {
                                  const next = e.target.value;
                                  row.setFormula(next);
                                  const byTemplate = METRIC_FORMULA_CODE_BY_TEMPLATE[row.metric];
                                  const code = byTemplate && byTemplate[next];
                                  if (code) row.setFormulaCode(code);
                                }}
                                className={cx(ui.input, "h-8 text-[11px] w-full min-w-0")}
                              >
                                <option value="Formula 1">{row.metric}</option>
                                <option value="Formula 2">Fake formula</option>
                              </select>
                            </td>
                            <td className="px-3 py-2 align-top min-w-[200px]">
                              <div className="relative rounded-md border border-[#303030] bg-[#0f0f0f] h-8 overflow-hidden min-w-[200px]">
                                <div data-formula-mirror className="absolute left-0 top-0 bottom-0 right-8 pl-3 overflow-x-auto overflow-y-hidden whitespace-nowrap py-2 text-[11px] font-mono text-[#d9d9d9] pointer-events-none flex items-center [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }} aria-hidden>
                                  <span className="inline-block min-w-full">{row.formulaCode ? renderFormulaWithVariables(row.formulaCode) : <span className="text-[#595959]">e.g. 1 / (1 + exp(-k * ...))</span>}</span>
                                </div>
                                <input
                                  type="text"
                                  value={row.formulaCode}
                                  readOnly
                                  onKeyDown={(e) => e.preventDefault()}
                                  onPaste={(e) => e.preventDefault()}
                                  onScroll={(e) => {
                                    const m = e.target.parentElement?.querySelector("[data-formula-mirror]");
                                    if (m) m.scrollLeft = e.target.scrollLeft;
                                  }}
                                  className="relative z-10 w-full h-full bg-transparent text-transparent caret-transparent select-none cursor-not-allowed rounded-md border-0 pl-3 pr-8 py-2 text-[11px] font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:ring-inset"
                                />
                                <button type="button" onClick={() => openFormulaEditor(row.formulaCode, row.setFormulaCode)} className="absolute right-0 top-0 bottom-0 z-20 flex items-center justify-center w-8 h-full bg-emerald-600 text-white hover:bg-emerald-500 active:bg-emerald-700 rounded-r-md" title="Формула">
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                                    <path fillRule="nonzero" d="M5 4.5C5 3.672 5.672 3 6.5 3h11c.828 0 1.5.672 1.5 1.5V5c0 .552-.448 1-1 1s-1-.448-1-1V5H7v.54l6.562 5.625c.512.44.512 1.232 0 1.671L7 18.46V19h10c.552 0 1 .448 1 1s-.448 1-1 1H6.5C5.672 21 5 20.328 5 19.5v-1.27c0-.438.191-.854.524-1.139l5.94-4.091L5.524 6.909C5.191 6.624 5 6.208 5 5.77V4.5z" />
                                  </svg>
                                </button>
                              </div>
                            </td>
                            <td className="px-3 py-2 align-top">
                              <div className="flex items-center gap-2">
                                <input type="range" min={0} max={100} step={1} value={row.weight} onChange={(e) => setWeightCapped(row.setWeight, e.target.value, row.others)} className="flex-1 max-w-[120px] h-2 accent-emerald-500" />
                                <span className="text-[#8c8c8c] w-7">{row.weight}%</span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-[#1a1a1a]">
                          <td colSpan={3} className="px-3 py-2 text-right text-[11px] font-medium text-[#8c8c8c]">Total</td>
                          <td className={cx("px-3 py-2 text-[11px] font-medium", finWeightsSum === 100 ? "text-emerald-500" : finWeightsSum > 100 ? "text-amber-500" : "text-[#8c8c8c]")}>{finWeightsSum}%</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                        </div>
                      </div>
                    )}
                  </div>
              </div>
            </div>
            <div className="px-4 py-3 border-t border-[#303030] flex justify-end">
              <button type="button" onClick={() => setShowNormalizationModal(false)} className={cx(ui.btnPrimary, "h-8 px-3 text-[11px]")}>Apply</button>
            </div>
          </div>
        </div>
      )}
      {/* Add truncate modal */}
      {showTruncateModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
          onClick={() => {
            setShowTruncateModal(false);
            setSelectedNormalizationRow(null);
          }}
        >
          <div
            className={cx(
              ui.radius,
              "bg-[#141414] border border-[#303030] max-w-[420px] w-full max-h-[90vh] overflow-hidden flex flex-col shadow-xl",
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#303030]">
              <span className="text-[14px] font-medium text-[#d9d9d9]">Add truncate</span>
              <button
                type="button"
                onClick={() => {
                  setShowTruncateModal(false);
                  setSelectedNormalizationRow(null);
                }}
                className="text-[#8c8c8c] hover:text-[#d9d9d9] p-1"
              >
                ✕
              </button>
            </div>
            <div className="overflow-auto p-4 space-y-4">
              {selectedNormalizationRow && (
                <div className="text-[11px] text-[#8c8c8c]">
                  <div className="font-medium text-[#d9d9d9] mb-1">Normalization context</div>
                  <div>Date: {selectedNormalizationRow.date}</div>
                </div>
              )}
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-medium text-[#d9d9d9]">
                    Fold size
                    <input
                      type="number"
                      min={1}
                      step={1}
                      inputMode="numeric"
                      value={truncateForm.foldSize}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (v === "" || /^\d+$/.test(v))
                          setTruncateForm((prev) => ({ ...prev, foldSize: v }));
                      }}
                      className={cx(ui.input, "mt-1 h-8 text-[12px]")}
                      placeholder="e.g. 12"
                    />
                  </label>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-[#303030] px-4 py-3 bg-[#101010]">
              <button
                type="button"
                onClick={() => {
                  setShowTruncateModal(false);
                  setSelectedNormalizationRow(null);
                }}
                className={cx(ui.btnGhost, "h-8 px-3 text-[12px]")}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  // Placeholder: here in future we'll persist truncate settings
                  // For now just close modal.
                  setShowTruncateModal(false);
                  setSelectedNormalizationRow(null);
                }}
                className={cx(ui.btn, "h-8 px-3 text-[12px]")}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Add Best result manually (Signal only) */}
      {!isEntryStage && showAddBestResultModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
          onClick={() => {
            setShowAddBestResultModal(false);
            setManualBestResultSelectionKey("");
          }}
        >
          <div
            className={cx(
              ui.radius,
              "bg-[#141414] border border-[#303030] max-w-[520px] w-full max-h-[90vh] overflow-hidden flex flex-col shadow-xl",
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#303030]">
              <span className="text-[14px] font-medium text-[#d9d9d9]">Add Best result (Signal)</span>
              <button
                type="button"
                onClick={() => {
                  setShowAddBestResultModal(false);
                  setManualBestResultSelectionKey("");
                }}
                className="text-[#8c8c8c] hover:text-[#d9d9d9] p-1"
              >
                ✕
              </button>
            </div>
            <div className="overflow-auto p-4 space-y-4">
              <div className={cx(ui.radius, ui.panelMuted, "p-3 space-y-3")}>
                <div className="text-[12px] font-medium text-[#d9d9d9]">Select normalization result</div>
                <p className={cx("text-[11px]", ui.textMuted)}>
                  Choose a normalization result (full or trunc data). Metrics will be taken from the selected row and the
                  current Signal indicators will be captured as a snapshot.
                </p>
                <select
                  value={manualBestResultSelectionKey}
                  onChange={(e) => setManualBestResultSelectionKey(e.target.value)}
                  className={cx(ui.input, "h-9 text-[12px] w-full")}
                >
                  <option value="">Select normalization result…</option>
                  {hyperoptResultsRows.flatMap((row) =>
                    (row.children || []).flatMap((sub) => {
                      const entries = [
                        {
                          id: `${row.id}|${sub.id}|full`,
                          label: "Full data",
                          scores: {
                            min: sub.minScore,
                            avg: sub.avgScore,
                            max: sub.maxScore,
                          },
                        },
                        sub.truncScores && {
                          id: `${row.id}|${sub.id}|trunc`,
                          label: "Trunc data",
                          scores: sub.truncScores,
                        },
                      ].filter(Boolean);
                      return entries.map((detail) => (
                        <option key={detail.id} value={detail.id}>
                          {row.pairs || pairs} · {row.timeFrame} · {sub.date} · {detail.label} · score{" "}
                          {detail.scores?.avg ?? detail.scores?.max ?? "-"}
                        </option>
                      ));
                    }),
                  )}
                </select>
              </div>
            </div>
            <div className="px-4 py-3 border-t border-[#303030] flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowAddBestResultModal(false);
                  setManualBestResultSelectionKey("");
                }}
                className={cx(ui.btn, "h-8 px-3 text-[11px]")}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!manualBestResultSelectionKey) return;
                  const [rowId, subId, detailKey] = manualBestResultSelectionKey.split("|");
                  let foundRow = null;
                  let foundSub = null;
                  let detail = null;
                  for (const row of hyperoptResultsRows) {
                    if (row.id !== rowId) continue;
                    for (const sub of row.children || []) {
                      if (sub.id !== subId) continue;
                      foundRow = row;
                      foundSub = sub;
                      if (detailKey === "full") {
                        detail = {
                          id: `${sub.id}-full`,
                          label: "Full data",
                          scores: {
                            min: sub.minScore,
                            avg: sub.avgScore,
                            max: sub.maxScore,
                          },
                        };
                      } else if (detailKey === "trunc" && sub.truncScores) {
                        detail = {
                          id: `${sub.id}-trunc`,
                          label: "Trunc data",
                          scores: sub.truncScores,
                        };
                      }
                      break;
                    }
                    if (foundRow) break;
                  }
                  if (foundRow && foundSub && detail) {
                    handleSaveSignalBestResultFromDetail({
                      row: foundRow,
                      sub: foundSub,
                      detail,
                      source: "manual",
                    });
                    setShowAddBestResultModal(false);
                    setManualBestResultSelectionKey("");
                  }
                }}
                className={cx(ui.btnPrimary, "h-8 px-3 text-[11px]")}
              >
                Save Best result
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Formulas info modal (read-only) — opens when Details ⓘ is clicked */}
      {showHyperoptDetailsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => setShowHyperoptDetailsModal(false)}>
          <div className={cx(ui.radius, "bg-[#141414] border border-[#303030] max-w-[720px] w-full max-h-[90vh] overflow-hidden flex flex-col shadow-xl")} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#303030]">
              <span className="text-[14px] font-medium text-[#d9d9d9]">Formulas info (read-only)</span>
              <button type="button" onClick={() => setShowHyperoptDetailsModal(false)} className="text-[#8c8c8c] hover:text-[#d9d9d9] p-1">✕</button>
            </div>
            <div className="overflow-auto p-4">
              <div className={cx(ui.radius, ui.panelMuted, "p-3")}>
                <div className="text-[12px] font-medium text-[#d9d9d9] mb-3">Normalization formulas</div>
                <div className="p-3 pt-0 space-y-3 border-t border-[#303030]">
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-medium text-[#d9d9d9]">Score formula</div>
                    <div className="flex flex-wrap items-center gap-3 gap-y-2">
                      <span className="text-[11px] text-[#a6a6a6]">{finalScoreFormula}</span>
                      <div className="min-w-[200px] flex-1 max-w-[800px] rounded-md border border-[#303030] bg-[#0f0f0f] px-3 py-2 text-[11px] font-mono text-[#d9d9d9]">
                        {finFinalFormulaCode ? renderFormulaWithVariables(finFinalFormulaCode) : <span className="text-[#595959]">—</span>}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-medium text-[#d9d9d9]">Stability Formula</div>
                    <div className="flex flex-wrap items-center gap-3 gap-y-2">
                      <span className="text-[11px] text-[#a6a6a6]">{finStabilityFormula}</span>
                      <div className="min-w-[200px] flex-1 max-w-[800px] rounded-md border border-[#303030] bg-[#0f0f0f] px-3 py-2 text-[11px] font-mono text-[#d9d9d9]">
                        {finStabilityFormulaCode ? renderFormulaWithVariables(finStabilityFormulaCode) : <span className="text-[#595959]">—</span>}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-[11px] font-medium text-[#d9d9d9]">Stability weights (sum ≤ 100%)</div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-4">
                      {[
                        { label: "StabWeightMFE", val: finStabMfeWeight },
                        { label: "StabWeightMAE", val: finStabMaeWeight },
                        { label: "StabWeightAIR", val: finStabAirWeight },
                        { label: "StabWeightHitRate", val: finStabHitRateWeight },
                      ].map((s) => (
                        <div key={s.label} className="flex items-center gap-2">
                          <span className="text-[10px] text-[#8c8c8c] shrink-0">{s.label}</span>
                          <span className="text-[#d9d9d9] text-[11px]">{s.val}%</span>
                        </div>
                      ))}
                    </div>
                    <div className="text-[10px] text-[#8c8c8c]">Total: {finStabWeightsSum}%</div>
                  </div>
                  <div className="text-[11px] font-medium text-[#d9d9d9]">Normalization metrics formulas and weights</div>
                  <div className="overflow-x-auto border border-[#303030] rounded-lg">
                    <table className="w-full text-[11px] border-collapse">
                      <thead>
                        <tr className="bg-[#1a1a1a] text-[#8c8c8c]">
                          <th className="px-3 py-2 text-left font-medium border-b border-[#303030] w-24">Metrics</th>
                          <th className="px-3 py-2 text-left font-medium border-b border-[#303030] w-32">Formula</th>
                          <th className="px-3 py-2 text-left font-medium border-b border-[#303030] min-w-[200px]">Formula Code</th>
                          <th className="px-3 py-2 text-left font-medium border-b border-[#303030]">Weight</th>
                        </tr>
                      </thead>
                      <tbody className="text-[#d9d9d9]">
                        <tr className="border-b border-[#303030]">
                          <td className="px-3 py-2 text-[#a6a6a6] align-top">Stability</td>
                          <td className="px-3 py-2 align-top">{finStabilityFormula}</td>
                          <td className="px-3 py-2 align-top min-w-[200px]">
                            <div className="rounded border border-[#303030] bg-[#0f0f0f] px-2 py-1.5 text-[11px] font-mono">
                              {finStabilityFormulaCode ? renderFormulaWithVariables(finStabilityFormulaCode) : <span className="text-[#595959]">—</span>}
                            </div>
                          </td>
                          <td className="px-3 py-2 align-top">{finStabilityWeight}%</td>
                        </tr>
                        {[
                          { metric: "normMFE", formula: finMfeFormula, formulaCode: finMfeFormulaCode, weight: finMfeWeight },
                          { metric: "normMAE", formula: finMaeFormula, formulaCode: finMaeFormulaCode, weight: finMaeWeight },
                          { metric: "normAIR", formula: finAirFormula, formulaCode: finAirFormulaCode, weight: finAirWeight },
                          { metric: "normHitRate", formula: finHitRateFormula, formulaCode: finHitRateFormulaCode, weight: finHitRateWeight },
                        ].map((row) => (
                          <tr key={row.metric} className="border-b border-[#303030]">
                            <td className="px-3 py-2 text-[#a6a6a6] align-top">{row.metric}</td>
                            <td className="px-3 py-2 align-top">{row.formula}</td>
                            <td className="px-3 py-2 align-top min-w-[200px]">
                              <div className="rounded border border-[#303030] bg-[#0f0f0f] px-2 py-1.5 text-[11px] font-mono">
                                {row.formulaCode ? renderFormulaWithVariables(row.formulaCode) : <span className="text-[#595959]">—</span>}
                              </div>
                            </td>
                            <td className="px-3 py-2 align-top">{row.weight}%</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-[#1a1a1a]">
                          <td colSpan={3} className="px-3 py-2 text-right text-[11px] font-medium text-[#8c8c8c]">Total</td>
                          <td className={cx("px-3 py-2 text-[11px] font-medium", finWeightsSum === 100 ? "text-emerald-500" : finWeightsSum > 100 ? "text-amber-500" : "text-[#8c8c8c]")}>{finWeightsSum}%</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>
            </div>
            <div className="px-4 py-3 border-t border-[#303030] flex justify-end">
              <button type="button" onClick={() => setShowHyperoptDetailsModal(false)} className={cx(ui.btn, "h-8 px-3 text-[11px]")}>Close</button>
            </div>
          </div>
        </div>
      )}
      {/* Best result details modal */}
      {showBestResultDetailsModal && selectedBestResult && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
          onClick={() => {
            setShowBestResultDetailsModal(false);
            setSelectedBestResult(null);
          }}
        >
          <div
            className={cx(
              ui.radius,
              "bg-[#141414] border border-[#303030] max-w-[720px] w-full max-h-[90vh] overflow-hidden flex flex-col shadow-xl",
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#303030]">
              <div className="flex flex-col">
                <span className="text-[14px] font-medium text-[#d9d9d9]">
                  Best result — {selectedBestResult.label || "Signal configuration"}
                </span>
                <span className={cx("text-[11px]", ui.textMuted)}>
                  {selectedBestResult.pairs || pairs || "-"} · {selectedBestResult.timeRange || timeRange || "-"} ·{" "}
                  {selectedBestResult.hyperoptType || signalHyperoptType}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowBestResultDetailsModal(false);
                  setSelectedBestResult(null);
                }}
                className="text-[#8c8c8c] hover:text-[#d9d9d9] p-1"
              >
                ✕
              </button>
            </div>
            <div className="overflow-auto p-4 space-y-4">
              <div className={cx(ui.radius, ui.panelMuted, "p-3")}>
                <div className="text-[12px] font-medium text-[#d9d9d9] mb-2">Metrics</div>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-[11px]">
                  <div className="flex items-baseline gap-1.5">
                    <span className={cx("text-[10px]", ui.textMuted)}>Score</span>
                    <span>{selectedBestResult.score != null ? selectedBestResult.score.toFixed(3) : "-"}</span>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className={cx("text-[10px]", ui.textMuted)}>MFE</span>
                    <span>{selectedBestResult.mfe != null ? selectedBestResult.mfe.toFixed(3) : "-"}</span>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className={cx("text-[10px]", ui.textMuted)}>MAE</span>
                    <span>{selectedBestResult.mae != null ? selectedBestResult.mae.toFixed(3) : "-"}</span>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className={cx("text-[10px]", ui.textMuted)}>AIR</span>
                    <span>{selectedBestResult.air != null ? selectedBestResult.air.toFixed(3) : "-"}</span>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className={cx("text-[10px]", ui.textMuted)}>normStability</span>
                    <span>{selectedBestResult.stability != null ? selectedBestResult.stability.toFixed(3) : "-"}</span>
                  </div>
                </div>
              </div>
              <div className={cx(ui.radius, ui.panelMuted, "p-3")}>
                <div className="text-[12px] font-medium text-[#d9d9d9] mb-2">Indicators snapshot</div>
                {(!selectedBestResult.indicators || selectedBestResult.indicators.length === 0) ? (
                  <div className={cx("text-[11px]", ui.textMuted)}>No indicators captured for this Best result.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-[11px] border-collapse">
                      <thead className="bg-[#1a1a1a] text-[#8c8c8c]">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium border-b border-[#303030]">Type</th>
                          <th className="px-3 py-2 text-left font-medium border-b border-[#303030]">Display name</th>
                          <th className="px-3 py-2 text-left font-medium border-b border-[#303030]">Params</th>
                        </tr>
                      </thead>
                      <tbody className="text-[#d9d9d9]">
                        {selectedBestResult.indicators.map((ind) => {
                          const params =
                            ind.paramsSnapshot &&
                            Object.entries(ind.paramsSnapshot)
                              .map(([k, v]) => {
                                if (typeof v === "number" && Number.isFinite(v)) {
                                  return `${k}: ${v.toFixed(2)}`;
                                }
                                return `${k}: ${v}`;
                              })
                              .join(", ");
                          return (
                            <tr key={ind.id} className="border-b border-[#303030]/60">
                              <td className="px-3 py-2 align-top">{ind.type || "-"}</td>
                              <td className="px-3 py-2 align-top">
                                {ind.displayName || ind.type || "-"}
                              </td>
                              <td className="px-3 py-2 align-top">
                                <code className="text-[10px] bg-[#0f0f0f] px-2 py-1 rounded block overflow-x-auto">
                                  {params || "{}"}
                                </code>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
            <div className="px-4 py-3 border-t border-[#303030] flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowBestResultDetailsModal(false);
                  setSelectedBestResult(null);
                }}
                className={cx(ui.btnPrimary, "h-8 px-3 text-[11px]")}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {/* HeatMap configurator modal — opens when Configure HeatMap is clicked */}
      {heatMapConfigModalId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => setHeatMapConfigModalId(null)}>
          <div className={cx(ui.radius, "bg-[#141414] border border-[#303030] w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-xl")} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#303030]">
              <span className="text-[14px] font-medium text-[#d9d9d9]">Configure HeatMap</span>
              <button type="button" onClick={() => setHeatMapConfigModalId(null)} className="text-[#8c8c8c] hover:text-[#d9d9d9] p-1">✕</button>
            </div>
            <div className="overflow-auto p-4">
              <HeatMapConfigurator
                indicators={indicators}
                onGenerate={(config) => handleGenerateHeatMap(config, heatMapConfigModalId)}
              />
            </div>
          </div>
        </div>
      )}
      {/* HeatMap view modal — opens when Show heatmap is clicked */}
      {heatMapViewModalId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => setHeatMapViewModalId(null)}>
          <div className={cx(ui.radius, "bg-[#141414] border border-[#303030] w-full max-w-[95vw] max-h-[90vh] overflow-hidden flex flex-col shadow-xl")} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#303030]">
              <span className="text-[14px] font-medium text-[#d9d9d9]">Heatmap</span>
              <div className="flex items-center gap-2">
                {generatedHeatMap && generatedHeatMap.runId === heatMapViewModalId && (
                  <button type="button" onClick={() => { setGeneratedHeatMap(null); setHeatMapViewModalId(null); }} className={cx(ui.btn, "h-7 px-2 text-[10px]")}>
                    Clear HeatMap
                  </button>
                )}
                <button type="button" onClick={() => setHeatMapViewModalId(null)} className="text-[#8c8c8c] hover:text-[#d9d9d9] p-1">✕</button>
              </div>
            </div>
            <div className="overflow-auto p-4 flex-1 min-h-0">
              {generatedHeatMap && generatedHeatMap.runId === heatMapViewModalId ? (
                <HeatMapView
                  heatMapData={currentHeatMapData}
                  config={generatedHeatMap.config}
                  onCellClick={(cell) => handleHeatMapCellClick(cell, heatMapViewModalId)}
                  onZoomOut={() => handleHeatMapZoomOut(heatMapViewModalId)}
                  onResetZoom={() => handleHeatMapResetZoom(heatMapViewModalId)}
                  canZoomOut={generatedHeatMap.zoomStack.length > 0}
                  canReset={generatedHeatMap.zoomStack.length > 0}
                  zoomLevel={generatedHeatMap.zoomStack.length}
                  zoomLevelLabel={generatedHeatMap.zoomStack.length > 0 ? generatedHeatMap.zoomStack[generatedHeatMap.zoomStack.length - 1].label : "Full heatmap"}
                  onSaveBest={
                    !isEntryStage
                      ? signalBestCandidates.length > 0
                        ? handleSaveSignalBestCandidates
                        : handleSaveSignalBestResultFromHeatMap
                      : null
                  }
                  bestCandidates={!isEntryStage ? signalBestCandidates : []}
                  onRemoveCandidate={!isEntryStage ? handleRemoveSignalBestCandidate : null}
                />
              ) : (
                <div className="py-8 text-center text-[#8c8c8c] text-[13px]">
                  <p className="mb-3">No heatmap generated for this run.</p>
                  <button type="button" onClick={() => { setHeatMapViewModalId(null); setHeatMapConfigModalId(heatMapViewModalId); }} className={cx(ui.btnPrimary, "h-8 px-3 text-[12px]")}>
                    Configure &amp; Generate HeatMap
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {editingIndicator && (
        <EditIndicatorModal 
          indicator={editingIndicator} 
          onClose={() => setEditingIndicator(null)} 
          onSave={handleEditIndicator} 
        />
      )}
    </div>
  );
});

/* ====================== Main App ====================== */

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);

  // Forgot password (mock)
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");

  // Create strategy modal (mock)
  const [showCreate, setShowCreate] = useState(false);
  const [newStrategyName, setNewStrategyName] = useState("");
  const [newStrategyTemplate, setNewStrategyTemplate] = useState("Strategy Builder");
  const [newStrategyDescription, setNewStrategyDescription] = useState("");

  // Navigation
  const [activeSection, setActiveSection] = useState("Strategies");
  const [settingsSubSection, setSettingsSubSection] = useState("indicators"); // "indicators" | "formulas"

  // Strategies
  const [strategies, setStrategies] = useState(INITIAL_STRATEGIES);
  const [expandedStrategies, setExpandedStrategies] = useState(() => new Set());
  const [selected, setSelected] = useState(null); // {strategyId, versionId}
  const [strategyCode, setStrategyCode] = useState("");

  // Detail tabs
  const [detailTab, setDetailTab] = useState("Strategy Builder"); // "Strategy Builder" | "Strategy Code"
  const [actionsDropdownOpen, setActionsDropdownOpen] = useState(false);

  // Builder fields (mock)
  const [builderStage, setBuilderStage] = useState(1);
  const [builderPairs, setBuilderPairs] = useState("BTC/USDT");
  const [builderTimeRange, setBuilderTimeRange] = useState("15m");
  const [builderTimeFrameStart, setBuilderTimeFrameStart] = useState("2020-01-01");
  const [builderTimeFrameEnd, setBuilderTimeFrameEnd] = useState("2023-12-31");
  const [builderHyperoptRun, setBuilderHyperoptRun] = useState("Pipeline");

  // Edit description modal
  const [showEditDescription, setShowEditDescription] = useState(false);
  const [editDescriptionDraft, setEditDescriptionDraft] = useState("");

  // Filters
  const [filterName, setFilterName] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterOwner, setFilterOwner] = useState("All");

  // Queue panel (header): list of jobs with drag-and-drop reorder
  const [showQueuePanel, setShowQueuePanel] = useState(false);
  const [queueItems, setQueueItems] = useState(() => [
    { id: "q1", strategyName: "Hyperopt Ema bounce", version: "v1", status: "In progress", estimationTime: "5m" },
    { id: "q2", strategyName: "Hyperopt Ema bounce", version: "v2", status: "Waiting", estimationTime: "10m" },
    { id: "q3", strategyName: "RSI Mean Reversion", version: "v1", status: "Waiting", estimationTime: "13m" },
  ]);
  const handleQueueReorder = useCallback((newOrder) => {
    setQueueItems(newOrder);
  }, []);
  const handleQueueRemove = useCallback((id) => {
    setQueueItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  // Mock role
  const currentUserRole = "Admin";

  // Mock users management (Users section)
  const [users, setUsers] = useState(() => [
    {
      id: 1,
      login: "admin@example.com",
      username: "Admin User",
      role: "Admin",
      status: "Active",
      createdOn: "2025-01-01",
    },
    {
      id: 2,
      login: "quant@example.com",
      username: "Quant Trader",
      role: "Quant",
      status: "Active",
      createdOn: "2025-02-15",
    },
    {
      id: 3,
      login: "old@example.com",
      username: "Old User",
      role: "Quant",
      status: "Deactivated",
      createdOn: "2024-06-10",
    },
  ]);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [userDraft, setUserDraft] = useState({ login: "", username: "", role: "Quant" });
  const [userToEdit, setUserToEdit] = useState(null);
  const [editUserDraft, setEditUserDraft] = useState({ username: "", role: "Quant", status: "Active" });
  const [userToChangePassword, setUserToChangePassword] = useState(null);
  const [userToResetPassword, setUserToResetPassword] = useState(null);

  // Indicators page (mock)
  const [pageIndicators, setPageIndicators] = useState(() => [
    { id: 1, name: "RSI - Relative Strength Index", description: "Momentum oscillator measuring speed and magnitude of price changes", type: "Momentum", indicatorType: "System", status: "Active", createdAt: "2025-01-10" },
    { id: 2, name: "EMA - Exponential Moving Average", description: "Moving average giving more weight to recent prices", type: "Trend", indicatorType: "System", status: "Active", createdAt: "2025-01-12" },
    { id: 3, name: "BB - Bollinger Bands", description: "Volatility bands placed above and below a moving average", type: "Volatility", indicatorType: "System", status: "Archived", createdAt: "2024-11-05" },
  ]);
  const [showAddIndicatorPage, setShowAddIndicatorPage] = useState(false);

  // Formulas (Settings → Formulas)
  const formulaModalFormulaRef = useRef(null);
  const formulaModalMirrorRef = useRef(null);
  const [formulaModalSelection, setFormulaModalSelection] = useState({ start: 0, end: 0 });
  const formulaModalVariableRegex = useMemo(
    () => new RegExp("\\b(" + [...FORMULA_MODAL_VARIABLES].sort((a, b) => b.length - a.length).join("|") + ")\\b", "g"),
    [],
  );
  const renderFormulaModalWithVariables = useCallback(
    (text) => {
      try {
        const str = typeof text === "string" ? text : String(text ?? "");
        if (!str) return null;
        const parts = str.split(formulaModalVariableRegex);
        return parts.map((part, i) =>
          FORMULA_MODAL_VARIABLES.includes(part) ? (
            <span key={i} className="rounded bg-emerald-500/25 px-0.5 text-emerald-400">{part}</span>
          ) : (
            part
          )
        );
      } catch {
        return typeof text === "string" ? text : null;
      }
    },
    [formulaModalVariableRegex],
  );
  const insertIntoFormulaModal = useCallback((snippet) => {
    setFormulaDraft((prev) => {
      const textarea = formulaModalFormulaRef.current;
      const start = textarea?.selectionStart ?? formulaModalSelection.start ?? (prev.formula ?? "").length;
      const end = textarea?.selectionEnd ?? formulaModalSelection.end ?? start;
      const formula = prev.formula ?? "";
      const before = formula.slice(0, start);
      const after = formula.slice(end);
      const next = before + snippet + after;
      const newPos = start + snippet.length;
      queueMicrotask(() => {
        const el = formulaModalFormulaRef.current;
        if (el) {
          el.focus();
          el.selectionStart = newPos;
          el.selectionEnd = newPos;
        }
        setFormulaModalSelection({ start: newPos, end: newPos });
      });
      return { ...prev, formula: next };
    });
  }, [formulaModalSelection.start, formulaModalSelection.end]);
  const [formulas, setFormulas] = useState(() => [
    { id: 1, name: "Intermediate score", hyperoptType: "Brute Force", type: "Score", subType: "Intermediate score", formula: "  weightMFE * normMFE\n- weightMAE * normMAE\n+ weightAIR * normAIR\n+ weightHitRate * normHitRate", owner: "System" },
    { id: 2, name: "MFE", hyperoptType: "Brute Force", type: "Metric", subType: "MFE", formula: "1/(1+EXP(-1*(MFE - MEDIAN(MFE)) / (QUARTILE.INC(MFE,3) - QUARTILE.INC(MFE,1))))", owner: "System" },
    { id: 3, name: "MAE", hyperoptType: "Brute Force", type: "Metric", subType: "MAE", formula: "1/(1+EXP(1*(MAE - MEDIAN(MAE)) / (QUARTILE.INC(MAE,3) - QUARTILE.INC(MAE,1))))", owner: "System" },
    { id: 4, name: "AIR", hyperoptType: "Brute Force", type: "Metric", subType: "AIR", formula: "1/(1+EXP(-1*(AIR - MEDIAN(AIR)) / (QUARTILE.INC(AIR,3) - QUARTILE.INC(AIR,1))))", owner: "System" },
    { id: 5, name: "HitRate", hyperoptType: "Brute Force", type: "Metric", subType: "HitRate", formula: "1/(1+EXP(-1*(HitRate - MEDIAN(HitRate)) / (QUARTILE.INC(HitRate,3) - QUARTILE.INC(HitRate,1))))", owner: "System" },
    { id: 6, name: "Final score", hyperoptType: "Brute Force", type: "Score", subType: "Final score", formula: "  weightMFE * normMFE\n- weightMAE * normMAE\n+ weightAIR * normAIR\n+ weightHitRate * normHitRate", owner: "System" },
    { id: 7, name: "Stability (formula)", hyperoptType: "Brute Force", type: "Stability", subType: "Stability", formula: "Your Stability formula can be placed here 😁", owner: "System" },
    { id: 8, name: "Stability (metric)", hyperoptType: "Brute Force", type: "Metric", subType: "Stability", formula: "1/(1+EXP(-1*(Stability - MEDIAN(Stability)) / (QUARTILE.INC(Stability,3) - QUARTILE.INC(Stability,1))))", owner: "System" },
  ]);
  const [showFormulaModal, setShowFormulaModal] = useState(false);
  const [formulaEditingId, setFormulaEditingId] = useState(null);
  const [formulaDraft, setFormulaDraft] = useState({ name: "", hyperoptType: "BIAS", type: "Score", subType: "Intermediate score", formula: "" });
  const handleOpenAddFormula = useCallback(() => {
    setFormulaEditingId(null);
    setFormulaDraft({ name: "", hyperoptType: "BIAS", type: "Score", subType: "Intermediate score", formula: "" });
    setShowFormulaModal(true);
  }, []);
  const handleEditFormula = useCallback((formula) => {
    setFormulaEditingId(formula.id);
    setFormulaDraft({ name: formula.name ?? "", hyperoptType: formula.hyperoptType, type: formula.type, subType: formula.subType, formula: formula.formula });
    setShowFormulaModal(true);
  }, []);
  const handleSaveFormula = useCallback(() => {
    if (formulaEditingId != null) {
      setFormulas((prev) => prev.map((f) => (f.id === formulaEditingId ? { ...f, ...formulaDraft } : f)));
    } else {
      setFormulas((prev) => [...prev, { id: Date.now(), owner: "bogdan", ...formulaDraft }]);
    }
    setShowFormulaModal(false);
  }, [formulaDraft, formulaEditingId]);
  const handleDeleteFormula = useCallback((formula) => {
    setFormulas((prev) => prev.filter((f) => f.id !== formula.id));
  }, []);

  const owners = useMemo(() => Array.from(new Set(strategies.map((s) => s.owner))), [strategies]);
  const totalVersions = useMemo(() => strategies.reduce((acc, s) => acc + s.versions.length, 0), [strategies]);

  const selectedStrategy = useMemo(() => {
    if (!selected) return null;
    const s = strategies.find((x) => x.id === selected.strategyId);
    const v = s?.versions.find((x) => x.id === selected.versionId);
    if (!s || !v) return null;
    return { s, v };
  }, [selected, strategies]);

  const filteredStrategies = useMemo(() => {
    return strategies.filter((strategy) => {
      if (filterName && !strategy.name.toLowerCase().includes(filterName.toLowerCase())) return false;
      if (filterOwner !== "All" && strategy.owner !== filterOwner) return false;

      if (filterStatus !== "All") {
        const hasStatus = strategy.versions.some((v) => {
          if (filterStatus === "Published") return v.status === "Active";
          if (filterStatus === "Deactivated") return v.status === "Disabled";
          if (filterStatus === "Not Verified") return false;
          return v.status === filterStatus;
        });
        if (!hasStatus) return false;
      }
      return true;
    });
  }, [strategies, filterName, filterOwner, filterStatus]);

  // Users helpers (mock)
  const handleOpenCreateUser = useCallback(() => {
    setUserDraft({ login: "", username: "", role: "Quant" });
    setShowCreateUser(true);
  }, []);

  const handleCreateUser = useCallback(() => {
    const now = new Date();
    const createdOn = now.toISOString().slice(0, 10);
    setUsers((prev) => [
      ...prev,
      {
        id: Date.now(),
        login: userDraft.login,
        username: userDraft.username,
        role: userDraft.role,
        status: "Active",
        createdOn,
      },
    ]);
    setShowCreateUser(false);
  }, [userDraft, setUsers]);

  const handleOpenEditUser = useCallback((user) => {
    setUserToEdit(user);
    setEditUserDraft({ username: user.username, role: user.role, status: user.status });
  }, []);

  const handleSaveEditUser = useCallback(() => {
    if (!userToEdit) return;
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userToEdit.id
          ? { ...u, username: editUserDraft.username, role: editUserDraft.role, status: editUserDraft.status }
          : u
      )
    );
    setUserToEdit(null);
  }, [userToEdit, editUserDraft]);

  const handleCloseChangePassword = useCallback(() => setUserToChangePassword(null), []);
  const handleCloseResetPassword = useCallback(() => setUserToResetPassword(null), []);

  const handleAddPageIndicator = useCallback((payload) => {
    setPageIndicators((prev) => [
      ...prev,
      { id: Date.now(), name: payload.name, description: payload.description, type: payload.group, status: "Active", createdAt: new Date().toISOString().slice(0, 10) },
    ]);
    setShowAddIndicatorPage(false);
  }, []);
  const handleIndicatorArchiveOrActivate = useCallback((ind) => {
    setPageIndicators((prev) => prev.map((i) => (i.id === ind.id ? { ...i, status: i.status === "Archived" ? "Active" : "Archived" } : i)));
  }, []);
  const handleIndicatorUpdate = useCallback(() => { /* mock: no action */ }, []);

  // In-app sanity tests
  useEffect(() => {
    console.assert(Array.isArray(strategies) && strategies.length > 0, "[Test] strategies should be a non-empty array");
    console.assert(typeof totalVersions === "number" && totalVersions > 0, "[Test] totalVersions should be > 0");
    const ids = strategies.map((s) => s.id);
    console.assert(new Set(ids).size === ids.length, "[Test] strategy ids should be unique");
    console.assert(SECTIONS.includes("Strategies"), "[Test] sections include Strategies");
  }, [strategies, totalVersions]);

  const toggleExpanded = useCallback((id) => {
    setExpandedStrategies((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const handleSectionChange = useCallback((section) => {
    // Backtesting stays disabled; Strategies and Users are available
    if (section === "Backtesting") return;
    setActiveSection(section);
    setSelected(null);
  }, []);

  const handleSelectVersion = useCallback(
    (strategyId, versionId) => {
      setSelected({ strategyId, versionId });
      const s = strategies.find((x) => x.id === strategyId);
      const v = s?.versions.find((x) => x.id === versionId);
      setStrategyCode(v?.code ?? "");
      setDetailTab("Strategy Builder");
    },
    [strategies]
  );

  const openEditDescription = useCallback(() => {
    if (!selectedStrategy) return;
    setEditDescriptionDraft(selectedStrategy.v.description || "");
    setShowEditDescription(true);
  }, [selectedStrategy]);

  const saveEditDescription = useCallback(() => {
    if (!selectedStrategy) return;
    const { s, v } = selectedStrategy;
    setStrategies((prev) =>
      prev.map((st) => {
        if (st.id !== s.id) return st;
        return {
          ...st,
          versions: st.versions.map((ver) => (ver.id === v.id ? { ...ver, description: editDescriptionDraft } : ver)),
        };
      })
    );
    setShowEditDescription(false);
  }, [editDescriptionDraft, selectedStrategy]);

  const handleCreateStrategy = useCallback(() => {
    // mock behavior: just close + reset
    setShowCreate(false);
    setNewStrategyName("");
    setNewStrategyTemplate("Strategy Builder");
    setNewStrategyDescription("");
  }, []);

  const handleLogin = useCallback(() => setLoggedIn(true), []);

  const handleForgotSend = useCallback(() => {
    alert(`Reset link sent to: ${forgotEmail || "(empty)"}`);
    setShowForgot(false);
    setForgotEmail("");
  }, [forgotEmail]);

  const handleLogout = useCallback(() => {
    setLoggedIn(false);
    setSelected(null);
    setActiveSection("Strategies");
    setExpandedStrategies(new Set());
  }, []);

  if (!loggedIn) {
    return (
      <>
        <LoginScreen onLogin={handleLogin} onForgotPassword={() => setShowForgot(true)} />
        {showForgot && (
          <ForgotPasswordModal
            email={forgotEmail}
            onEmailChange={setForgotEmail}
            onClose={() => {
              setShowForgot(false);
              setForgotEmail("");
            }}
            onSend={handleForgotSend}
          />
        )}
      </>
    );
  }

  const current = selectedStrategy?.s ?? null;
  const versions = current?.versions ?? [];

  return (
    <div className={cx("min-h-screen", ui.page, "flex flex-col")}>
      <Header
        onLogout={handleLogout}
        sections={SECTIONS}
        activeSection={activeSection}
        onSectionChange={handleSectionChange}
        settingsSubSection={settingsSubSection}
        onSettingsSubChange={setSettingsSubSection}
        strategiesCount={strategies.length}
        disabledSections={DISABLED_SECTIONS}
        queueOpen={showQueuePanel}
        onQueueToggle={() => setShowQueuePanel((v) => !v)}
        onQueueClose={() => setShowQueuePanel(false)}
        queueItems={queueItems}
        onQueueReorder={handleQueueReorder}
        onQueueRemove={handleQueueRemove}
        hyperoptRun={builderHyperoptRun}
        onHyperoptRunChange={setBuilderHyperoptRun}
      />

      <main className="flex-1 overflow-auto p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-[16px] font-semibold text-[#f5f5f5]">{activeSection === "Settings" ? `${activeSection} · ${settingsSubSection === "indicators" ? "Indicators" : "Formulas"}` : activeSection}</h1>
            <p className={cx("mt-1 text-[12px]", ui.textMuted)}>
              {activeSection === "Users"
                ? "Manage application users (mock data only)."
                : activeSection === "Settings" && settingsSubSection === "indicators"
                ? "Manage indicator library (mock)."
                : activeSection === "Settings" && settingsSubSection === "formulas"
                ? "Manage formulas (Hyperopt Type, Type, SubType)."
                : "Manage and configure your strategies."}
            </p>
          </div>

          {activeSection === "Strategies" && !selectedStrategy && (
            <button onClick={() => setShowCreate(true)} className={ui.btnPrimary}>
              + Add strategy
            </button>
          )}

          {activeSection === "Users" && (
            <button onClick={handleOpenCreateUser} className={ui.btnPrimary}>
              + Create user
            </button>
          )}
          {activeSection === "Settings" && settingsSubSection === "indicators" && (
            <button onClick={() => setShowAddIndicatorPage(true)} className={ui.btnPrimary}>
              Add indicator
            </button>
          )}
          {activeSection === "Settings" && settingsSubSection === "formulas" && (
            <button onClick={handleOpenAddFormula} className={ui.btnPrimary}>
              Add Formula
            </button>
          )}
        </div>

        {/* Strategies list */}
        {activeSection === "Strategies" && !selectedStrategy && (
          <div className={cx(ui.radius, ui.panel, "overflow-hidden")}>
            <div className={cx("flex items-center gap-3 px-4 py-3", ui.panelMuted, "border-0 border-b", ui.divider)}>
              <div className={cx("text-[12px]", ui.textSubtle)}>
                {strategies.length} strategies / {totalVersions} versions
              </div>

              <div className="ml-auto flex items-center gap-3">
                <input
                  value={filterName}
                  onChange={(e) => setFilterName(e.target.value)}
                  className={cx(ui.input, "h-8 w-64 text-[12px]")}
                  placeholder="Search strategy..."
                />

                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className={ui.select}>
                  <option value="All">All statuses</option>
                  <option value="Draft">Draft</option>
                  <option value="Not Verified">Not Verified</option>
                  <option value="Published">Published</option>
                  <option value="Deactivated">Deactivated</option>
                </select>

                {currentUserRole === "Admin" && (
                  <select value={filterOwner} onChange={(e) => setFilterOwner(e.target.value)} className={ui.select}>
                    <option value="All">All owners</option>
                    {owners.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            <table className="w-full border-collapse text-[12px]">
              <thead className="bg-[#1f1f1f] text-left text-[12px] text-[#8c8c8c]">
                <tr>
                  <th className="px-4 py-3 border-b border-[#303030] font-medium">Strategy name</th>
                  <th className="px-2 py-3 border-b border-[#303030] font-medium">Description</th>
                  <th className="px-2 py-3 border-b border-[#303030] font-medium">Current stage</th>
                  <th className="px-2 py-3 border-b border-[#303030] font-medium">Status</th>
                  <th className="px-2 py-3 border-b border-[#303030] font-medium">Owner</th>
                  <th className="px-2 py-3 border-b border-[#303030] font-medium">Created at</th>
                  <th className="px-2 py-3 border-b border-[#303030] font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredStrategies.map((strategy) => (
                  <StrategyRow
                    key={strategy.id}
                    strategy={strategy}
                    isExpanded={expandedStrategies.has(strategy.id)}
                    onToggle={toggleExpanded}
                    onSelectVersion={handleSelectVersion}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Strategy detail */}
        {activeSection === "Strategies" && selectedStrategy && (
          <div className={cx(ui.radius, ui.panel, "p-5 space-y-5")}>
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-[14px] font-semibold text-[#f5f5f5] truncate">{selectedStrategy.s.name}</h2>

                  <select
                    value={selectedStrategy.v.id}
                    onChange={(e) => handleSelectVersion(selectedStrategy.s.id, Number(e.target.value))}
                    className={ui.select}
                    aria-label="Version"
                    title="Version"
                  >
                    {versions.map((v) => (
                      <option key={v.id} value={v.id}>
                        v{v.version}
                      </option>
                    ))}
                  </select>

                  <Badge status={selectedStrategy.v.status} />
                </div>

                <p className={cx("mt-1 text-[12px]", ui.textMuted)}>
                  Owner: <span className="text-[#d9d9d9]">{selectedStrategy.s.owner}</span>
                </p>

                <div className={cx("mt-1 flex items-start gap-2 text-[12px]", ui.textMuted)}>
                  <div className="min-w-0">
                    Description: <span className="text-[#d9d9d9]">{selectedStrategy.v.description || "—"}</span>
                  </div>
                  <button
                    onClick={openEditDescription}
                    className="inline-flex h-5 w-5 items-center justify-center rounded border border-[#303030] bg-[#0f0f0f] text-[#a6a6a6] hover:bg-[#1f1f1f]"
                    title="Edit description"
                    aria-label="Edit description"
                  >
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" aria-hidden="true">
                      <path
                        d="M16.9 3.7a2.1 2.1 0 0 1 3 3L8.4 18.2 4 19.4l1.2-4.4L16.9 3.7z"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinejoin="round"
                        strokeLinecap="round"
                      />
                      <path d="M14.7 5.9l3.4 3.4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
              </div>

              <div
                className="relative"
                onMouseEnter={() => setActionsDropdownOpen(true)}
                onMouseLeave={() => setActionsDropdownOpen(false)}
              >
                <button type="button" className={ui.btnPrimary} aria-haspopup="true" aria-expanded={actionsDropdownOpen}>
                  Actions
                </button>
                {actionsDropdownOpen && (
                  <div className="absolute right-0 top-full z-50 mt-1 min-w-[180px] rounded-md border border-[#303030] bg-[#1a1a1a] py-1 shadow-lg">
                    <button
                      type="button"
                      onClick={() => { alert("Create new version (mock)"); setActionsDropdownOpen(false); }}
                      className="block w-full px-3 py-2 text-left text-[12px] text-[#d9d9d9] hover:bg-[#252525]"
                    >
                      Create new version
                    </button>
                    <button
                      type="button"
                      onClick={() => { alert("Duplicate strategy (mock)"); setActionsDropdownOpen(false); }}
                      className="block w-full px-3 py-2 text-left text-[12px] text-[#d9d9d9] hover:bg-[#252525]"
                    >
                      Duplicate strategy
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Tabs */}
            <div className={cx("border-0 border-b", ui.divider)}>
              <nav className="-mb-px flex gap-4 text-[13px]">
                <button
                  type="button"
                  onClick={() => setDetailTab("Strategy Builder")}
                  className={cx(
                    "px-2 py-2 border-b-2 transition",
                    detailTab === "Strategy Builder"
                      ? "border-emerald-500 text-emerald-200"
                      : "border-transparent text-[#8c8c8c] hover:text-[#d9d9d9]"
                  )}
                >
                  Strategy Builder
                </button>

                <button
                  type="button"
                  onClick={() => setDetailTab("Strategy Code")}
                  className={cx(
                    "px-2 py-2 border-b-2 transition",
                    detailTab === "Strategy Code"
                      ? "border-emerald-500 text-emerald-200"
                      : "border-transparent text-[#8c8c8c] hover:text-[#d9d9d9]"
                  )}
                >
                  Strategy Code
                </button>
              </nav>
            </div>

            {/* Content */}
            {detailTab === "Strategy Builder" && (
              <div className="space-y-4">
                <BuilderStepper
                  activeStage={builderStage}
                  onStageChange={setBuilderStage}
                  pairs={builderPairs}
                  onPairsChange={setBuilderPairs}
                  timeRange={builderTimeRange}
                  onTimeRangeChange={setBuilderTimeRange}
                  timeFrameStart={builderTimeFrameStart}
                  onTimeFrameStartChange={setBuilderTimeFrameStart}
                  timeFrameEnd={builderTimeFrameEnd}
                  onTimeFrameEndChange={setBuilderTimeFrameEnd}
                  hyperoptRun={builderHyperoptRun}
                  onHyperoptRunChange={setBuilderHyperoptRun}
                />
              </div>
            )}

            {detailTab === "Strategy Code" && (
              <div className="space-y-3">
                <div>
                  <div className="text-[12px] font-medium text-[#d9d9d9]">Strategy code</div>
                  <div className={cx("text-[11px]", ui.textMuted)}>Displayed as Python code.</div>
                </div>
                <CodeEditor value={strategyCode} onChange={setStrategyCode} language="python" />
              </div>
            )}
          </div>
        )}

        {/* Users page (mock) */}
        {activeSection === "Users" && (
          <div className={cx(ui.radius, ui.panel, "overflow-hidden")}>
            <div className={cx("flex items-center justify-between px-4 py-3", ui.panelMuted, "border-0 border-b", ui.divider)}>
              <div>
                <div className="text-[12px] font-medium text-[#d9d9d9]">Users</div>
                <div className={cx("text-[11px]", ui.textMuted)}>Manage logins, roles, and status (mock only).</div>
              </div>
              <span className="rounded-md border border-[#303030] bg-[#0f0f0f] px-2 py-0.5 text-[10px] text-[#8c8c8c]">
                {users.length} users
              </span>
            </div>

            <div className="overflow-auto">
              <table className="w-full border-collapse text-[12px]">
                <thead className="bg-[#1f1f1f] text-left text-[12px] text-[#8c8c8c]">
                  <tr>
                    <th className="px-4 py-3 border-b border-[#303030] font-medium">Login</th>
                    <th className="px-2 py-3 border-b border-[#303030] font-medium">Username</th>
                    <th className="px-2 py-3 border-b border-[#303030] font-medium">Role</th>
                    <th className="px-2 py-3 border-b border-[#303030] font-medium">Status</th>
                    <th className="px-2 py-3 border-b border-[#303030] font-medium">Created On</th>
                    <th className="px-2 py-3 border-b border-[#303030] font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="bg-[#141414] hover:bg-[#1f1f1f] transition-colors">
                      <td className="px-4 py-2 border-b border-[#303030] text-[#d9d9d9]">{user.login}</td>
                      <td className="px-2 py-2 border-b border-[#303030] text-[#d9d9d9]">{user.username}</td>
                      <td className="px-2 py-2 border-b border-[#303030] text-[#a6a6a6]">{user.role}</td>
                      <td className="px-2 py-2 border-b border-[#303030]">
                        <Badge status={user.status} type="status" />
                      </td>
                      <td className="px-2 py-2 border-b border-[#303030] text-[#a6a6a6]">{user.createdOn}</td>
                      <td className="px-2 py-2 border-b border-[#303030]">
                        <UserActionsMenu
                          user={user}
                          onEdit={handleOpenEditUser}
                          onChangePassword={setUserToChangePassword}
                          onResetPassword={setUserToResetPassword}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Indicators page (mock) */}
        {(activeSection === "Settings" && settingsSubSection === "indicators") && (
          <div className={cx(ui.radius, ui.panel, "overflow-hidden")}>
            <div className={cx("flex items-center justify-between px-4 py-3", ui.panelMuted, "border-0 border-b", ui.divider)}>
              <div>
                <div className="text-[12px] font-medium text-[#d9d9d9]">Indicators</div>
                <div className={cx("text-[11px]", ui.textMuted)}>Indicator library (mock).</div>
              </div>
              <span className="rounded-md border border-[#303030] bg-[#0f0f0f] px-2 py-0.5 text-[10px] text-[#8c8c8c]">
                {pageIndicators.length} indicators
              </span>
            </div>

            <div className="overflow-auto">
              <table className="w-full border-collapse text-[12px]">
                <thead className="bg-[#1f1f1f] text-left text-[12px] text-[#8c8c8c]">
                  <tr>
                    <th className="px-4 py-3 border-b border-[#303030] font-medium">Indicator</th>
                    <th className="px-2 py-3 border-b border-[#303030] font-medium">Description</th>
                    <th className="px-2 py-3 border-b border-[#303030] font-medium">Category</th>
                    <th className="px-2 py-3 border-b border-[#303030] font-medium">Type</th>
                    <th className="px-2 py-3 border-b border-[#303030] font-medium">Status</th>
                    <th className="px-2 py-3 border-b border-[#303030] font-medium">Created At</th>
                    <th className="px-2 py-3 border-b border-[#303030] font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pageIndicators.map((ind) => (
                    <tr key={ind.id} className="bg-[#141414] hover:bg-[#1f1f1f] transition-colors">
                      <td className="px-4 py-2 border-b border-[#303030] text-[#d9d9d9]">{ind.name}</td>
                      <td className="px-2 py-2 border-b border-[#303030] text-[#a6a6a6] max-w-[200px] truncate" title={ind.description}>{ind.description}</td>
                      <td className="px-2 py-2 border-b border-[#303030]">
                        <Badge status={ind.type} type="indicatorGroup" />
                      </td>
                      <td className="px-2 py-2 border-b border-[#303030] text-[#d9d9d9]">{ind.indicatorType ?? "System"}</td>
                      <td className="px-2 py-2 border-b border-[#303030]">
                        <Badge status={ind.status} type="status" />
                      </td>
                      <td className="px-2 py-2 border-b border-[#303030] text-[#a6a6a6]">{ind.createdAt}</td>
                      <td className="px-2 py-2 border-b border-[#303030]">
                        <IndicatorActionsMenu
                          indicator={ind}
                          onArchiveOrActivate={handleIndicatorArchiveOrActivate}
                          onUpdate={handleIndicatorUpdate}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Formulas page (Settings → Formulas) */}
        {(activeSection === "Settings" && settingsSubSection === "formulas") && (
          <div className={cx(ui.radius, ui.panel, "overflow-hidden")}>
            <div className={cx("flex items-center justify-between px-4 py-3", ui.panelMuted, "border-0 border-b", ui.divider)}>
              <div>
                <div className="text-[12px] font-medium text-[#d9d9d9]">Formulas</div>
                <div className={cx("text-[11px]", ui.textMuted)}>Hyperopt Type, Type, SubType, Formula</div>
              </div>
              <span className="rounded-md border border-[#303030] bg-[#0f0f0f] px-2 py-0.5 text-[10px] text-[#8c8c8c]">
                {formulas.length} formulas
              </span>
            </div>
            <div className="overflow-auto">
              <table className="w-full border-collapse text-[12px]">
                <thead className="bg-[#1f1f1f] text-left text-[12px] text-[#8c8c8c]">
                  <tr>
                    <th className="px-3 py-2 border-b border-[#303030] font-medium">Name</th>
                    <th className="px-3 py-2 border-b border-[#303030] font-medium">Hyperopt Type</th>
                    <th className="px-3 py-2 border-b border-[#303030] font-medium">Type</th>
                    <th className="px-3 py-2 border-b border-[#303030] font-medium">SubType</th>
                    <th className="px-3 py-2 border-b border-[#303030] font-medium min-w-[200px]">Formula</th>
                    <th className="px-3 py-2 border-b border-[#303030] font-medium">Owner</th>
                    <th className="px-3 py-2 border-b border-[#303030] font-medium w-20">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {formulas.map((f) => (
                    <tr key={f.id} className="bg-[#141414] hover:bg-[#1f1f1f] transition-colors">
                      <td className="px-3 py-2 border-b border-[#303030] text-[#d9d9d9]">{f.name ?? "—"}</td>
                      <td className="px-3 py-2 border-b border-[#303030] text-[#d9d9d9]">{f.hyperoptType}</td>
                      <td className="px-3 py-2 border-b border-[#303030] text-[#d9d9d9]">{f.type}</td>
                      <td className="px-3 py-2 border-b border-[#303030] text-[#a6a6a6]">{f.subType}</td>
                      <td className="px-3 py-2 border-b border-[#303030] text-[#a6a6a6] max-w-[280px] truncate font-mono text-[11px]" title={f.formula}>{f.formula || "—"}</td>
                      <td className="px-3 py-2 border-b border-[#303030] text-[#a6a6a6]">{f.owner ?? "—"}</td>
                      <td className="px-3 py-2 border-b border-[#303030]">
                        <FormulaActionsMenu formula={f} onEdit={handleEditFormula} onDelete={handleDeleteFormula} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {formulas.length === 0 && (
                <div className={cx("py-12 text-center text-[12px]", ui.textMuted)}>No formulas yet. Click &quot;Add Formula&quot; to create one.</div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      {showCreate && (
        <CreateStrategyModal
          name={newStrategyName}
          template={newStrategyTemplate}
          description={newStrategyDescription}
          onNameChange={setNewStrategyName}
          onTemplateChange={setNewStrategyTemplate}
          onDescriptionChange={setNewStrategyDescription}
          onClose={() => setShowCreate(false)}
          onCreate={handleCreateStrategy}
        />
      )}

      {showEditDescription && (
        <EditDescriptionModal
          value={editDescriptionDraft}
          onChange={setEditDescriptionDraft}
          onClose={() => setShowEditDescription(false)}
          onSave={saveEditDescription}
        />
      )}

      {showForgot && (
        <ForgotPasswordModal
          email={forgotEmail}
          onEmailChange={setForgotEmail}
          onClose={() => {
            setShowForgot(false);
            setForgotEmail("");
          }}
          onSend={handleForgotSend}
        />
      )}

      {showCreateUser && (
        <CreateUserModal
          draft={userDraft}
          onDraftChange={setUserDraft}
          onClose={() => setShowCreateUser(false)}
          onCreate={handleCreateUser}
        />
      )}

      {userToEdit && (
        <EditUserModal
          draft={editUserDraft}
          onDraftChange={setEditUserDraft}
          onClose={() => setUserToEdit(null)}
          onSave={handleSaveEditUser}
        />
      )}

      {userToChangePassword && (
        <ChangePasswordModal user={userToChangePassword} onClose={handleCloseChangePassword} />
      )}

      {userToResetPassword && (
        <ResetPasswordModal user={userToResetPassword} onClose={handleCloseResetPassword} />
      )}

      {showAddIndicatorPage && (
        <AddIndicatorPageModal
          onClose={() => setShowAddIndicatorPage(false)}
          onAdd={handleAddPageIndicator}
        />
      )}

      {showFormulaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => setShowFormulaModal(false)}>
          <div className={cx(ui.radius, "bg-[#141414] border border-[#303030] max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col shadow-xl")} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#303030]">
              <span className="text-[14px] font-medium text-[#d9d9d9]">{formulaEditingId != null ? "Edit Formula" : "Add Formula"}</span>
              <button type="button" onClick={() => setShowFormulaModal(false)} className="text-[#8c8c8c] hover:text-[#d9d9d9] p-1">✕</button>
            </div>
            <div className="overflow-auto p-4 space-y-4">
              <div>
                <label className={cx("block mb-1 text-xs", ui.textMuted)}>Name</label>
                <input type="text" value={formulaDraft.name ?? ""} onChange={(e) => setFormulaDraft((d) => ({ ...d, name: e.target.value }))} placeholder="Formula name" className={cx(ui.input, "h-9 text-[12px] w-full")} />
              </div>
              <div>
                <label className={cx("block mb-1 text-xs", ui.textMuted)}>Hyperopt Type</label>
                <select value={formulaDraft.hyperoptType} onChange={(e) => setFormulaDraft((d) => ({ ...d, hyperoptType: e.target.value }))} className={cx(ui.input, "h-9 text-[12px] w-full")}>
                  {FORMULA_HYPEROPT_TYPES.map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className={cx("block mb-1 text-xs", ui.textMuted)}>Type</label>
                <select value={formulaDraft.type} onChange={(e) => setFormulaDraft((d) => ({ ...d, type: e.target.value }))} className={cx(ui.input, "h-9 text-[12px] w-full")}>
                  {FORMULA_TYPES.map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className={cx("block mb-1 text-xs", ui.textMuted)}>SubType</label>
                <select value={formulaDraft.subType} onChange={(e) => setFormulaDraft((d) => ({ ...d, subType: e.target.value }))} className={cx(ui.input, "h-9 text-[12px] w-full")}>
                  {FORMULA_SUBTYPES.map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className={cx("block mb-1 text-xs", ui.textMuted)}>Formula</label>
                <div className="relative min-h-[120px] rounded-md border border-[#303030] bg-[#0f0f0f] overflow-hidden">
                  <div
                    ref={formulaModalMirrorRef}
                    className="absolute inset-0 overflow-auto px-3 py-2 text-[11px] font-mono text-[#d9d9d9] whitespace-pre-wrap break-words pointer-events-none [&::-webkit-scrollbar]:hidden"
                    style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                    aria-hidden
                  >
                    {formulaDraft.formula ? (
                      renderFormulaModalWithVariables(formulaDraft.formula)
                    ) : (
                      <span className="text-[#595959]">Formula expression...</span>
                    )}
                  </div>
                  <textarea
                    ref={formulaModalFormulaRef}
                    value={formulaDraft.formula ?? ""}
                    onChange={(e) => {
                      const { value, selectionStart, selectionEnd } = e.target;
                      setFormulaDraft((d) => ({ ...d, formula: value }));
                      setFormulaModalSelection({ start: selectionStart ?? value.length, end: selectionEnd ?? value.length });
                    }}
                    onSelect={(e) => {
                      const { selectionStart, selectionEnd } = e.target;
                      setFormulaModalSelection({ start: selectionStart ?? 0, end: selectionEnd ?? 0 });
                    }}
                    onScroll={(e) => {
                      const m = formulaModalMirrorRef.current;
                      if (m) {
                        m.scrollTop = e.target.scrollTop;
                        m.scrollLeft = e.target.scrollLeft;
                      }
                    }}
                    rows={6}
                    placeholder="Formula expression..."
                    className="relative z-10 w-full min-h-[120px] resize-y rounded-md border-0 bg-transparent px-3 py-2 text-[11px] font-mono text-transparent caret-[#d9d9d9] focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:ring-inset"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="text-[11px] font-medium text-[#d9d9d9]">Functions</div>
                  <select
                    className={cx(ui.input, "h-8 text-[11px] flex-1 w-full")}
                    onChange={(e) => {
                      if (!e.target.value) return;
                      insertIntoFormulaModal(e.target.value);
                      e.target.selectedIndex = 0;
                    }}
                  >
                    <option value="">Select function…</option>
                    {FORMULA_MODAL_FUNCTIONS.map((fn) => (
                      <option key={fn.label} value={fn.template}>
                        {fn.label} — {fn.template}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-[11px] font-medium text-[#d9d9d9]">Variables</div>
                <div className="flex flex-wrap gap-1.5">
                  {FORMULA_MODAL_VARIABLES.map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => insertIntoFormulaModal(v)}
                      className="inline-flex items-center justify-center rounded-md border border-[#303030] bg-[#0f0f0f] px-2.5 py-1 text-[11px] text-[#d9d9d9] hover:bg-[#1f1f1f] active:translate-y-[0.5px]"
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-[11px] font-medium text-[#d9d9d9]">Operators</div>
                <div className="flex flex-wrap gap-1.5">
                  {FORMULA_MODAL_OPERATORS.map((op) => (
                    <button
                      key={op}
                      type="button"
                      onClick={() => insertIntoFormulaModal(op)}
                      className="inline-flex items-center justify-center rounded-md border border-[#303030] bg-[#0f0f0f] px-2.5 py-1 text-[11px] text-[#d9d9d9] hover:bg-[#1f1f1f] active:translate-y-[0.5px]"
                    >
                      {op}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="px-4 py-3 border-t border-[#303030] flex justify-end gap-2">
              <button type="button" onClick={() => setShowFormulaModal(false)} className={cx(ui.btn, "h-8 px-3 text-[11px]")}>Cancel</button>
              <button type="button" onClick={handleSaveFormula} className={cx(ui.btnPrimary, "h-8 px-3 text-[11px]")}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { memo, useCallback, useEffect, useId, useMemo, useRef, useState, Suspense, lazy } from 'react';
import { Blocks, FlaskConical, Workflow, Tag, Pencil } from 'lucide-react';
import { useHyperoptResultsState } from './hooks/useHyperoptResultsState';
import { useCollapsedSections, useBuilderStageConfig } from './hooks/useBuilderStageState';
import { cx, ui } from '../../constants/ui';
import { SOURCE_OPTIONS, MA_TYPES, INDICATOR_GROUPS, BASE_INDICATORS } from '../../constants/indicators';
import { HEATMAP_FILTER_KEYS, FILTER_OPERATIONS } from '../../constants/heatmap';
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
} from '../../constants/formulas';
import {
  DEFAULT_RISK_STOPLOSS_RANGES,
  DEFAULT_RISK_HYPEROPT_PARAMS,
  RISK_STOPLOSS_KEYS,
  RISK_STOPLOSS_LABELS,
  RISK_HYPEROPT_PARAM_DEFS,
  RISK_LOSS_STREAK_LABELS,
  buildDefaultRiskHeatmapConfig,
  riskStoplossMidpoints,
  riskLossStreakMidpoints,
} from '../../constants/risk';
import { riskParamsFromHeatmap } from '../backtesting/utils/resolveEpochStageConfig';
import { TIME_RANGES } from '../../constants/app';
import {
  STAGE_ID_TO_TYPE,
  STAGE_TYPE_TO_ID,
  STAGE_TYPE_LABELS,
  PARENT_STAGE_TYPE,
} from '../../constants/versioning';
import { getStageVersionsForStrategy } from '../../constants/mockStageVersionTree';
import { pickByStage, getBuilderStageCopy } from './utils/stageSelect';
import { countRiskCombinations, countRiskHyperoptParamCombinations } from './utils/riskCombinations';
import { clamp, lerp, quantile, computeRanges, normalizeParam, buildHeatMap, formatScore, heatmapScoreToColor, HEATMAP_LEGEND_STOPS, HEATMAP_CELL_PX, HEATMAP_GAP_PX, EMPTY_CELL_BG } from '../../utils/heatmap';
import { setWeightCapped } from '../../utils/weights';
import { buildIndicatorSnapshot, buildSignalBestResult as buildSignalBestResultFromUtils } from '../../utils/builder';
import {
  buildDefaultBbHeatmapConfig,
  createDefaultBbIndicator,
  createDefaultEntryFavoriteEpoch,
  createDefaultExitFavoriteEpoch,
  createDefaultRiskFavoriteEpoch,
  createDefaultSignalFavoriteEpoch,
  DEFAULT_BB_INDICATOR_IDS,
  DEFAULT_FAVORITE_EPOCH_IDS,
} from './utils/defaultBbSetup';
import { BacktestingStagePanel } from '../backtesting';
import { getParamValuesFromDef, getParamDefForCompositeKey, getParamLabel, getReportParamLabel, getIndicatorTemplate } from '../../utils/indicators';
import { generatePythonCode } from '../../utils/pythonCode';
import { generateMockResults } from '../../utils/mockResults';
import { useOutsideClose } from '../../hooks/useOutsideClose';
import { Logo, Badge, MoreIcon, EyeIcon, MenuIcon, ModalShell } from '../../components/common';
import { TagMultiSelect } from '../../components/common/TagMultiSelect';
import { AppButton } from '../../components/common/AppButton';
import { AppDialog } from '../../components/common/AppDialog';
import { AppInput } from '../../components/common/AppInput';
import { AppSelect } from '../../components/common/AppSelect';
import { Textarea } from '@/components/ui/textarea';
import { DateRangePicker } from '../../components/common/DateRangePicker';
import { BuilderSectionShell } from './layout/BuilderSectionShell';
import { BuilderStepsSidebar } from '../../components/prod';
import { TableViewIcon, CardViewIcon, TrashIcon } from '../../components/shared';
import { LoadingFallback } from '../../components/common/LoadingFallback';

const GenerateReportModal = lazy(() =>
  import('../../components/report/GenerateReportModal').then((m) => ({
    default: m.GenerateReportModal,
  })),
);
import {
  HeatMapView,
  HeatMapConfigurator,
  PairsDropdown,
  HeatMapGrid,
  HyperoptDetailsTooltip,
  HeatmapFiltersReadOnlyModal,
} from '../../components/heatmap';
import { FormulaActionsMenu } from '../../components/formulas';
import {
  StageIcon,
  IndicatorLibrary,
  SelectedIndicatorCard,
  selectedIndicatorsGridClass,
  AddIndicatorModal,
  EditIndicatorModal,
  IndicatorRangesPanel,
  TotalCombinationsBadge,
  CollapsibleSelect,
  TableBasedEditor,
  FormulaEditor,
  RiskStagePanel,
  HyperoptResultCard,
  HyperoptResultListItem,
  HyperoptResultDrawer,
  HyperoptRunDetail,
  RunStatusBadge,
  MiniBacktestPage,
  BestEpochsModal,
  PostProcessingTableActions,
  AnalyticsItemActions,
  AddRangeNarrowingModal,
  RangeNarrowingReadOnlyModal,
  RangeNarrowingResultsModal,
  ComparativeWidgetModal,
  AddComparisonWidgetModal,
  ComparisonWidgetReadOnlyModal,
} from './components';
import { applyConfigRowsToIndicators, createRangeNarrowingAnalyticsItem } from './utils/rangeNarrowingMock';
import { createComparisonWidgetAnalyticsItem, filterAnalyticsItemsForStage } from './utils/analyticsItems';
import { getDefaultDisplayName, formatIndicatorSnapshot } from './utils/indicatorHelpers';
import { formatHyperoptDateTime, normalizeHyperoptRunStatus, isHyperoptRawDataDeleted } from './utils/hyperoptFormatters';
import { buildEpochFromHyperoptContext } from './utils/hyperoptEpoch';
import { MINI_BACKTEST_DEFAULTS } from '../../constants/miniBacktest';
import { dedupeMiniBacktestResultIds } from './utils/miniBacktestEngine';
import { buildMiniBacktestLaunchContext } from './utils/miniBacktestDisplay';
import {
  StageVersionSelect,
  StageVersionCommentModal,
  StageVersionTreeModal,
  createDefaultVersionSelection,
  applyVersionChange,
  selectionFromTreeNode,
  getAvailableVersions,
  getVersionBreadcrumb,
  getVersionById,
  hasVersionComment,
} from '../../features/versioning';
import {
  findOrCreateTagByName,
  getAvailableTagIdsForFilter,
  resolveTagNames,
  syncHyperoptTagIds,
} from '../../features/tags/utils/tagStore';
import { MOCK_CURRENT_USER } from '../../constants/tags';
import { TagsEditModal } from '../../components/tags';

export const BuilderStepper = memo(function BuilderStepper({
  strategyId,
  strategyName = "",
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
  versionComments = {},
  onOpenVersionComment,
  onDeleteVersionComment,
  miniBacktestEnabled = false,
  onMiniBacktestEnabledChange,
  miniBacktestResults = [],
  miniBacktestExpandedEpochId = null,
  onMiniBacktestExpandedEpochIdChange,
  onSaveMiniBacktestResult,
  onRemoveMiniBacktestResult,
  onOpenMiniBacktestModal,
  onCloseMiniBacktestModal,
  tagsRegistry = [],
  setTagsRegistry,
  tagRelations = [],
  setTagRelations,
  hyperoptResultsRows = [],
  setHyperoptResultsRows,
  currentUserRole = "Admin",
  currentUserId = MOCK_CURRENT_USER.id,
  hyperoptTagFilter = [],
  setHyperoptTagFilter,
  hyperoptTagsModalRowId = null,
  hyperoptTagsDraft = { tagIds: [], tagInput: "" },
  setHyperoptTagsDraft,
  openHyperoptTagsModal,
  closeHyperoptTagsModal,
  commitHyperoptTagsDraftTag,
  saveHyperoptTagsModal,
  indicatorTagIdsByKey = {},
  onAddIndicatorTag,
  backtestingEnabled = true,
}) {
  // Indicators state (separate for Signal and Entry)
  const [signalIndicators, setSignalIndicators] = useState(() => [
    createDefaultBbIndicator(DEFAULT_BB_INDICATOR_IDS.signal),
  ]);
  const [entryIndicators, setEntryIndicators] = useState(() => [
    createDefaultBbIndicator(DEFAULT_BB_INDICATOR_IDS.entry),
  ]);
  const [exitIndicators, setExitIndicators] = useState(() => [
    createDefaultBbIndicator(DEFAULT_BB_INDICATOR_IDS.exit),
  ]);
  const [riskStoplossRanges, setRiskStoplossRanges] = useState(() => ({
    ...DEFAULT_RISK_STOPLOSS_RANGES,
    stoploss: { ...DEFAULT_RISK_STOPLOSS_RANGES.stoploss },
    trailing_activation: { ...DEFAULT_RISK_STOPLOSS_RANGES.trailing_activation },
    trailing_distance: { ...DEFAULT_RISK_STOPLOSS_RANGES.trailing_distance },
  }));
  const [riskHyperoptParams, setRiskHyperoptParams] = useState(() => ({ ...DEFAULT_RISK_HYPEROPT_PARAMS }));
  const isEntryStage = activeStage === 2;
  const isExitStage = activeStage === 3;
  const isRiskStage = activeStage === 4;
  const isSignalStage = activeStage === 1;
  const hasSourceBestScore = isEntryStage || isExitStage || isRiskStage;
  const stageCopy = getBuilderStageCopy(activeStage);
  const indicators = pickByStage(activeStage, {
    signal: signalIndicators,
    entry: entryIndicators,
    exit: exitIndicators,
    risk: signalIndicators,
  });
  const setIndicators = pickByStage(activeStage, {
    signal: setSignalIndicators,
    entry: setEntryIndicators,
    exit: setExitIndicators,
    risk: setSignalIndicators,
  });
  const [editingIndicator, setEditingIndicator] = useState(null);
  const [editIndicatorModalRangesOnly, setEditIndicatorModalRangesOnly] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addModalType, setAddModalType] = useState("RSI");
  const [libraryQuery, setLibraryQuery] = useState("");
  const [libraryGroup, setLibraryGroup] = useState("All");
  const [selectedTab, setSelectedTab] = useState("list"); // list or code

  const totalCombinations = useMemo(() => {
    if (isRiskStage) {
      return (
        countRiskCombinations(riskStoplossRanges) * countRiskHyperoptParamCombinations(riskHyperoptParams)
      );
    }
    if (indicators.length === 0) return 0;
    return indicators.reduce((product, ind) => {
      if (!ind.enabled || !Array.isArray(ind.params)) return product;
      const perIndicator = ind.params.reduce((p, param) => p * getParamValuesFromDef(param).length, 1);
      return product * Math.max(1, perIndicator);
    }, 1);
  }, [isRiskStage, riskStoplossRanges, riskHyperoptParams, indicators]);

  const hyperoptSectionNum = isRiskStage ? 3 : 4;
  const resultsSectionNum = isRiskStage ? 4 : 5;
  const favoritesSectionNum = isRiskStage ? 5 : 6;
  
  // Hyperoptimization progress
  const [isRunningOptimization, setIsRunningOptimization] = useState(false);
  const [optimizationProgress, setOptimizationProgress] = useState(0);
  // Per-stage hyperopt / market config
  const {
    hyperoptType, setHyperoptType,
    exchange, setExchange,
    tradingMode, setTradingMode,
    syntheticDataset, setSyntheticDataset,
    maxPossibleStd, setMaxPossibleStd,
    unknowTimeRangeStart, setUnknowTimeRangeStart,
    unknowTimeRangeEnd, setUnknowTimeRangeEnd,
    signalFoldSize, setSignalFoldSize,
    includeIncompleteFold, setIncludeIncompleteFold,
    signalHyperoptType, entryHyperoptType, exitHyperoptType, riskHyperoptType,
  } = useBuilderStageConfig(activeStage);
  const isSyntheticExchange = exchange === "synthetic";
  const syntheticDatasetPair = syntheticDataset === "dataset2" ? "ETC/USDT" : "BTC/USDT";
  useEffect(() => {
    if (isSyntheticExchange && pairs !== syntheticDatasetPair) {
      onPairsChange?.(syntheticDatasetPair);
    }
  }, [isSyntheticExchange, syntheticDatasetPair, pairs, onPairsChange]);
  // Best results are tracked independently per stage
  const [signalBestResults, setSignalBestResults] = useState(() => [createDefaultSignalFavoriteEpoch()]);
  const [entryBestResults, setEntryBestResults] = useState(() => [createDefaultEntryFavoriteEpoch()]);
  const [exitBestResults, setExitBestResults] = useState(() => [createDefaultExitFavoriteEpoch()]);
  const [selectedBestResult, setSelectedBestResult] = useState(null);
  const [showBestResultDetailsModal, setShowBestResultDetailsModal] = useState(false);
  const [showSourceEpochInfoModal, setShowSourceEpochInfoModal] = useState(false);
  const [showAddBestResultModal, setShowAddBestResultModal] = useState(false);
  const [showBestEpochsModal, setShowBestEpochsModal] = useState(false);
  const [bestEpochsContext, setBestEpochsContext] = useState(null);
  const [bestEpochsModalMode, setBestEpochsModalMode] = useState("add-favorites");
  const [manualBestResultSelectionKey, setManualBestResultSelectionKey] = useState("");
  const [signalBestCandidates, setSignalBestCandidates] = useState([]);
  const [entryBestCandidates, setEntryBestCandidates] = useState([]);
  const [exitBestCandidates, setExitBestCandidates] = useState([]);
  // Seeded like stages 1-3: Stage 5 needs at least one promoted epoch to validate.
  const [riskBestResults, setRiskBestResults] = useState(() => [createDefaultRiskFavoriteEpoch()]);
  const [riskBestCandidates, setRiskBestCandidates] = useState([]);
  const [entryBestSourceId, setEntryBestSourceId] = useState(DEFAULT_FAVORITE_EPOCH_IDS.signal);
  const [entrySourceDropdownOpen, setEntrySourceDropdownOpen] = useState(false);
  const entrySourceDropdownRef = useOutsideClose(entrySourceDropdownOpen, () => setEntrySourceDropdownOpen(false));
  const [exitBestSourceId, setExitBestSourceId] = useState(DEFAULT_FAVORITE_EPOCH_IDS.entry);
  const [exitSourceDropdownOpen, setExitSourceDropdownOpen] = useState(false);
  const exitSourceDropdownRef = useOutsideClose(exitSourceDropdownOpen, () => setExitSourceDropdownOpen(false));
  const [riskBestSourceId, setRiskBestSourceId] = useState(DEFAULT_FAVORITE_EPOCH_IDS.exit);
  const [riskSourceDropdownOpen, setRiskSourceDropdownOpen] = useState(false);
  const riskSourceDropdownRef = useOutsideClose(riskSourceDropdownOpen, () => setRiskSourceDropdownOpen(false));
  const bestResults = pickByStage(activeStage, {
    signal: signalBestResults,
    entry: entryBestResults,
    exit: exitBestResults,
    risk: riskBestResults,
  });
  const setBestResults = pickByStage(activeStage, {
    signal: setSignalBestResults,
    entry: setEntryBestResults,
    exit: setExitBestResults,
    risk: setRiskBestResults,
  });
  const bestCandidates = pickByStage(activeStage, {
    signal: signalBestCandidates,
    entry: entryBestCandidates,
    exit: exitBestCandidates,
    risk: riskBestCandidates,
  });
  const setBestCandidates = pickByStage(activeStage, {
    signal: setSignalBestCandidates,
    entry: setEntryBestCandidates,
    exit: setExitBestCandidates,
    risk: setRiskBestCandidates,
  });
  const formatBestMetric = useCallback((value) => {
    if (value == null || value === "") return "-";
    const num = Number(value);
    return Number.isFinite(num) ? num.toFixed(3) : "-";
  }, []);

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
  const [exitFormula, setExitFormula] = useState(`# Define your exit logic
# Example:
IF FinalScore < 0.3 OR Stability < 0.5 THEN TRIGGER_EXIT

# You can use:
# - Normalized metrics: FinalScore, Stability, median_MFE, median_MAE, median_AIR
# - Logic: AND, OR, NOT`);
  const stageFormula = isRiskStage
    ? ""
    : pickByStage(activeStage, {
        signal: signalFormula,
        entry: entryFormula,
        exit: exitFormula,
        risk: "",
      });
  const setStageFormula = pickByStage(activeStage, {
    signal: setSignalFormula,
    entry: setEntryFormula,
    exit: setExitFormula,
    risk: () => {},
  });

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
  const {
    normalizationDetailsExpanded,
    toggleNormalizationDetails,
    normModalCollapsedSections,
    toggleNormModalSection,
    hyperoptResultsExpanded,
    toggleHyperoptRow,
    hyperoptLevel3Expanded,
    toggleHyperoptLevel3,
  } = useHyperoptResultsState();

  // Report Modal state
  const [showReportModal, setShowReportModal] = useState(false);
  // Hyperopt Results: Run normalization modal (same content as Normalization formulas block)
  const [showNormalizationModal, setShowNormalizationModal] = useState(false);
  const [showAddRangeNarrowingModal, setShowAddRangeNarrowingModal] = useState(false);
  const [rangeNarrowingContext, setRangeNarrowingContext] = useState(null);
  const [rangeNarrowingInfoItem, setRangeNarrowingInfoItem] = useState(null);
  const [rangeNarrowingResultsItem, setRangeNarrowingResultsItem] = useState(null);
  const [comparativeWidgetContext, setComparativeWidgetContext] = useState(null);
  const [comparisonWidgetFormContext, setComparisonWidgetFormContext] = useState(null);
  const [comparisonWidgetInfoItem, setComparisonWidgetInfoItem] = useState(null);
  // Range Narrowing tab state
  const [normActiveTab, setNormActiveTab] = useState("stability"); // "stability" | "score" | "narrowing"
  const [rnEnabled, setRnEnabled] = useState(false);
  const [rnPlateauWidth, setRnPlateauWidth] = useState(39);
  const [rnMinImportance, setRnMinImportance] = useState(0.5);
  const [rnMaxCombinations, setRnMaxCombinations] = useState(122);
  const [rnMinEpochsPerValue, setRnMinEpochsPerValue] = useState(4);
  const [rnMarginEnabled, setRnMarginEnabled] = useState(true);
  const [rnMarginWiden, setRnMarginWiden] = useState(2);
  const [showHyperoptDetailsModal, setShowHyperoptDetailsModal] = useState(false);
  const [hyperoptDetailsModalType, setHyperoptDetailsModalType] = useState("post-processing");
  const [heatmapItemFiltersModalItem, setHeatmapItemFiltersModalItem] = useState(null);
  // Hyperopt Results three-level table data (level 1: runs; level 2: normalization results; level 3: HeatMaps & Reports)
  const [hyperoptCommentModalRowId, setHyperoptCommentModalRowId] = useState(null);
  const [hyperoptCommentDraft, setHyperoptCommentDraft] = useState({ comment: "" });
  const openHyperoptCommentModal = useCallback((row) => {
    setHyperoptCommentModalRowId(row.id);
    setHyperoptCommentDraft({
      comment: typeof row.comment === "string" ? row.comment : "",
    });
  }, []);
  const closeHyperoptCommentModal = useCallback(() => {
    setHyperoptCommentModalRowId(null);
    setHyperoptCommentDraft({ comment: "" });
  }, []);
  const hyperoptAvailableTagIds = useMemo(
    () => getAvailableTagIdsForFilter(hyperoptResultsRows, tagsRegistry, currentUserRole, currentUserId),
    [hyperoptResultsRows, tagsRegistry, currentUserRole, currentUserId],
  );
  const hyperoptTagFilterOptions = useMemo(
    () =>
      hyperoptAvailableTagIds.map((tagId) => ({
        value: tagId,
        label: tagsRegistry.find((tag) => tag.id === tagId)?.name || tagId,
      })),
    [hyperoptAvailableTagIds, tagsRegistry],
  );
  const filteredHyperoptResultsRows = useMemo(() => {
    if (hyperoptTagFilter.length === 0) return hyperoptResultsRows;
    return hyperoptResultsRows.filter((row) =>
      (row.tagIds || []).some((tagId) => hyperoptTagFilter.includes(tagId)),
    );
  }, [hyperoptResultsRows, hyperoptTagFilter]);
  const hyperoptResultsOverview = useMemo(
    () =>
      filteredHyperoptResultsRows.reduce(
        (acc, row) => {
          acc.total += 1;
          acc.postProcessing += row.children?.length ?? 0;
          const status = normalizeHyperoptRunStatus(row.status);
          if (status === "Completed") acc.completed += 1;
          else if (status === "In Progress") acc.inProgress += 1;
          else acc.other += 1;
          return acc;
        },
        { total: 0, completed: 0, inProgress: 0, other: 0, postProcessing: 0 },
      ),
    [filteredHyperoptResultsRows],
  );
  const saveHyperoptCommentModal = useCallback(() => {
    if (!hyperoptCommentModalRowId) return;
    setHyperoptResultsRows((rows) =>
      rows.map((r) =>
        r.id === hyperoptCommentModalRowId ? { ...r, comment: hyperoptCommentDraft.comment } : r
      )
    );
    closeHyperoptCommentModal();
  }, [hyperoptCommentModalRowId, hyperoptCommentDraft.comment, closeHyperoptCommentModal]);
  const selectedSourceBestResults = pickByStage(activeStage, {
    signal: [],
    entry: signalBestResults,
    exit: entryBestResults,
    risk: exitBestResults,
  });
  const selectedSourceId = pickByStage(activeStage, {
    signal: "",
    entry: entryBestSourceId,
    exit: exitBestSourceId,
    risk: riskBestSourceId,
  });
  const setSelectedSourceId = pickByStage(activeStage, {
    signal: () => {},
    entry: setEntryBestSourceId,
    exit: setExitBestSourceId,
    risk: setRiskBestSourceId,
  });
  const sourceDropdownOpen = pickByStage(activeStage, {
    signal: false,
    entry: entrySourceDropdownOpen,
    exit: exitSourceDropdownOpen,
    risk: riskSourceDropdownOpen,
  });
  const setSourceDropdownOpen = pickByStage(activeStage, {
    signal: () => {},
    entry: setEntrySourceDropdownOpen,
    exit: setExitSourceDropdownOpen,
    risk: setRiskSourceDropdownOpen,
  });
  const sourceDropdownRef = pickByStage(activeStage, {
    signal: null,
    entry: entrySourceDropdownRef,
    exit: exitSourceDropdownRef,
    risk: riskSourceDropdownRef,
  });
  const selectedStageSource = useMemo(
    () => selectedSourceBestResults.find((best) => best.id === selectedSourceId) || null,
    [selectedSourceBestResults, selectedSourceId],
  );
  const parseKnownRange = useCallback((value) => {
    if (!value || typeof value !== "string") return null;
    const parts = value.split("–").map((part) => part.trim());
    if (parts.length !== 2) return null;
    return { start: parts[0] || "", end: parts[1] || "" };
  }, []);
  const selectedStageSourceKnownRange = useMemo(() => {
    if (!selectedStageSource?.meta?.rowId) return null;
    const row = hyperoptResultsRows.find((item) => item.id === selectedStageSource.meta.rowId);
    return parseKnownRange(row?.knowRange);
  }, [selectedStageSource, hyperoptResultsRows, parseKnownRange]);
  const selectedStagePairs = selectedStageSource?.pairs || "";
  const selectedStageTimeRangeStart =
    selectedStageSourceKnownRange?.start || selectedStageSource?.meta?.timeFrameStart || "";
  const selectedStageTimeRangeEnd =
    selectedStageSourceKnownRange?.end || selectedStageSource?.meta?.timeFrameEnd || "";
  const selectedStageSourceInfo = useMemo(() => {
    if (!selectedStageSource) return null;

    const labelParts = String(selectedStageSource.label || "")
      .split("·")
      .map((part) => part.trim())
      .filter(Boolean);

    const rawSourceTimeRange = String(selectedStageSource.timeRange || "").trim();
    const timeframe =
      selectedStageSource.timeframe ||
      (TIME_RANGES.includes(rawSourceTimeRange) ? rawSourceTimeRange : "") ||
      labelParts[2] ||
      "—";
    const dateRange =
      selectedStageTimeRangeStart && selectedStageTimeRangeEnd
        ? `${selectedStageTimeRangeStart}  ↔  ${selectedStageTimeRangeEnd}`
        : rawSourceTimeRange.includes("–")
          ? rawSourceTimeRange
        : "—";

    const fmtMetric = (value, digits = 3) =>
      Number.isFinite(Number(value)) ? Number(value).toFixed(digits) : "—";
    const fmtMaybeInt = (value) =>
      Number.isFinite(Number(value)) ? String(Math.round(Number(value))) : "—";
    const seedFrom = (key) =>
      `${selectedStageSource.id || ""}|${selectedStageSource.label || ""}|${selectedStageSource.epochNumber || 0}|${key}`;
    const seeded = (key, min, max, digits = 6) => {
      let hash = 2166136261;
      const source = seedFrom(key);
      for (let i = 0; i < source.length; i += 1) {
        hash ^= source.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
      }
      const ratio = (hash >>> 0) / 4294967295;
      const value = min + (max - min) * ratio;
      return Number(value.toFixed(digits));
    };
    const asNum = (value, fallback) => {
      const num = Number(value);
      return Number.isFinite(num) ? num : fallback;
    };
    const asPct = (value, fallback) => `${asNum(value, fallback).toFixed(2)}%`;
    const fmtParamValue = (value) => {
      if (value == null || value === "") return "—";
      if (typeof value !== "number" || !Number.isFinite(value)) return String(value);
      return Number.isInteger(value) ? String(value) : value.toFixed(Math.abs(value) >= 10 ? 0 : 3);
    };
    const fmtBound = (value) => {
      if (value == null || value === "") return "—";
      if (typeof value !== "number" || !Number.isFinite(value)) return String(value);
      return Number.isInteger(value) ? String(value) : value.toFixed(Math.abs(value) >= 10 ? 0 : 3);
    };

    const indicatorRows = (selectedStageSource.indicators || []).flatMap((ind) => {
      const paramsSnapshot =
        ind?.paramsSnapshot && typeof ind.paramsSnapshot === "object" ? ind.paramsSnapshot : {};
      const template = getIndicatorTemplate(ind?.type || "");
      const templateParams = new Map((template?.parameters || []).map((param) => [String(param.name), param]));
      const alias = ind?.displayName || getDefaultDisplayName(ind?.type || "") || String(ind?.type || "indicator").toLowerCase();

      return Object.entries(paramsSnapshot).map(([key, value]) => {
        const paramDef = templateParams.get(String(key));
        return {
          id: `${ind?.id || alias}-${key}`,
          indicator: String(ind?.type || "IND"),
          alias,
          key,
          value: fmtParamValue(value),
          type: String(paramDef?.type || (Number.isInteger(value) ? "INT" : "FLOAT")).toUpperCase(),
          min: fmtBound(paramDef?.min),
          max: fmtBound(paramDef?.max),
          step: fmtBound(paramDef?.step),
        };
      });
    });

    const scoreValue = asNum(selectedStageSource.score, seeded("score", 0.18, 0.38));
    const mfeValue = asNum(selectedStageSource.mfe, seeded("mfe", 0.32, 0.68));
    const maeValue = asNum(selectedStageSource.mae, seeded("mae", -0.42, -0.08));
    const airValue = asNum(selectedStageSource.air, seeded("air", 1.6, 3.4));
    const stabilityValue = asNum(selectedStageSource.stability, seeded("stability", 0.08, 0.74));
    const hitRateValue = asNum(selectedStageSource.hitRate, seeded("hitRate", 58, 79, 2));
    const epochValue = asNum(selectedStageSource.epochNumber, seeded("epoch", 1, 300, 0));
    const cycleCountValue = Math.max(1, Math.round(seeded("cycle_count", 120, 180, 0)));
    const roiMedValue = seeded("roi_med", 12.4, 18.1);
    const totalRoiValue = seeded("total_roi", 34.2, 42.9);
    const zMfeValue = seeded("z_mfe_med", 0.02, 0.08);
    const zMaeValue = seeded("z_mae_med", 0, 0.03);
    const zAirValue = seeded("z_air_med", 0.22, 0.38);
    const zHrValue = seeded("z_hr_val", 0.72, 1, 0);
    const sigmoid = (v) => 1 / (1 + Math.exp(-v));
    const normMfe = sigmoid(seeded("norm_score_mfe_med", 0.02, 0.08));
    const normMae = sigmoid(seeded("norm_score_mae_med", -0.02, 0.02));
    const normAir = sigmoid(seeded("norm_score_air_med", 0.22, 0.38));
    const normHr = sigmoid(seeded("norm_score_hr_val", 0.72, 1.0));
    const detailLabel = selectedStageSource.meta?.detailLabel || labelParts[3] || "—";
    const stageLabel = labelParts[4] || "—";

    return {
      title: selectedStageSource.label || "Source epoch",
      pair: selectedStagePairs || labelParts[1] || pairs || "—",
      timeframe,
      exchange: exchange || "—",
      tradingMode: tradingMode || "—",
      dateRange,
      finalEvaluation: [
        { label: "Score", value: fmtMetric(scoreValue, 6) },
        { label: "stability_score", value: fmtMetric(stabilityValue, 6) },
        { label: "Epoch", value: fmtMaybeInt(epochValue) },
      ],
      cyclePerformanceColumns: [
        [
          { label: "cycle_count", value: fmtMaybeInt(cycleCountValue) },
          { label: "mfe_med", value: fmtMetric(mfeValue, 5) },
          { label: "mae_med", value: fmtMetric(maeValue, 5) },
          { label: "air_med", value: fmtMetric(airValue, 5) },
          { label: "hr_val", value: fmtMetric(hitRateValue, 2) },
          { label: "ret_med", value: fmtMetric(seeded("ret_med", 0.11, 0.19), 5) },
          { label: "roi_med", value: fmtMetric(roiMedValue, 2) },
          { label: "dur_med", value: fmtMaybeInt(seeded("dur_med", 8, 14, 0)) },
        ],
        [
          { label: "tt_mfe_med", value: fmtMaybeInt(seeded("tt_mfe_med", 3, 6, 0)) },
          { label: "tt_mae_med", value: fmtMaybeInt(seeded("tt_mae_med", 1, 3, 0)) },
          { label: "profit_factor", value: fmtMetric(seeded("profit_factor", 2.8, 8.2), 6) },
          { label: "profit_capture", value: fmtMetric(seeded("profit_capture", 28, 42), 2) },
          { label: "max_drawdown", value: fmtMetric(Math.abs(maeValue) * seeded("max_drawdown", 3.8, 4.8), 4) },
          { label: "total_pnl_gross", value: fmtMaybeInt(seeded("total_pnl_gross", 26000, 42000, 0)) },
          { label: "total_roi", value: fmtMetric(totalRoiValue, 3) },
        ],
      ],
      finalScoreColumns: [
        [
          { label: "z_mfe_med", value: fmtMetric(zMfeValue, 6) },
          { label: "z_mae_med", value: fmtMetric(zMaeValue, 0) },
          { label: "z_air_med", value: fmtMetric(zAirValue, 6) },
          { label: "z_hr_val", value: fmtMetric(zHrValue, 0) },
          { label: "norm_score_mfe_med", value: fmtMetric(normMfe, 6) },
          { label: "norm_score_mae_med", value: fmtMetric(0.5, 1) },
          { label: "norm_score_air_med", value: fmtMetric(normAir, 6) },
          { label: "norm_score_hr_val", value: fmtMetric(normHr, 6) },
        ],
        [
          { label: "norm_stability", value: fmtMetric(stabilityValue, 6) },
          { label: "weight_score_mfe_med", value: "20%" },
          { label: "weight_score_mae_med", value: "20%" },
          { label: "weight_score_air_med", value: "20%" },
          { label: "weight_score_hr_val", value: "20%" },
          { label: "weight_stability", value: "20%" },
        ],
      ],
      stabilityColumns: [
        [
          { label: "rel_diff_mfe_med", value: asPct(seeded("rel_diff_mfe_med", -3.5, 2.5), 0) },
          { label: "rel_diff_mae_med", value: asPct(seeded("rel_diff_mae_med", 8, 22), 0) },
          { label: "rel_diff_air_med", value: asPct(seeded("rel_diff_air_med", -2.5, 1.5), 0) },
          { label: "rel_diff_hr_val", value: asPct(seeded("rel_diff_hr_val", -12, -4), 0) },
          { label: "std_ratio", value: asPct(seeded("std_ratio", 7, 12), 0) },
          { label: "max_possible_std", value: "1" },
          { label: "stab_p_low", value: fmtMetric(seeded("stab_p_low", 0.01, 0.05), 2) },
          { label: "stab_p_high", value: fmtMetric(seeded("stab_p_high", 0.4, 0.7), 1) },
          { label: "std_ratio_p_low", value: "0" },
          { label: "std_ratio_p_high", value: "1" },
        ],
        [
          { label: "rel_diff_mfe_p_low", value: "0" },
          { label: "rel_diff_mfe_p_high", value: "1" },
          { label: "rel_diff_mae_p_low", value: "0" },
          { label: "rel_diff_mae_p_high", value: "1" },
          { label: "rel_diff_air_p_low", value: "0" },
          { label: "rel_diff_air_p_high", value: "1" },
          { label: "rel_diff_hr_p_low", value: "0" },
          { label: "rel_diff_hr_p_high", value: "1" },
          { label: "intermediate_mae_p_low", value: fmtMetric(-0.001, 3) },
          { label: "intermediate_mae_p_high", value: fmtMetric(-0.999, 3) },
        ],
        [
          { label: "intermediate_mfe_p_low", value: fmtMetric(0.001, 3) },
          { label: "intermediate_mfe_p_high", value: fmtMetric(0.999, 3) },
          { label: "intermediate_air_p_low", value: fmtMetric(0.001, 3) },
          { label: "intermediate_air_p_high", value: fmtMetric(3, 0) },
          { label: "intermediate_hr_val_p_low", value: fmtMetric(0.001, 3) },
          { label: "intermediate_hr_val_p_high", value: fmtMetric(seeded("intermediate_hr_val_p_high", 0.48, 0.62), 2) },
          { label: "weight_stability_mfe_med", value: "20%" },
          { label: "weight_stability_mae_med", value: "20%" },
          { label: "weight_stability_air_med", value: "20%" },
          { label: "weight_stability_hr_val", value: "20%" },
          { label: "weight_stability_std_ratio", value: "20%" },
        ],
      ],
      detailLabel,
      stageLabel,
      indicatorRows,
    };
  }, [
    selectedStageSource,
    selectedStagePairs,
    selectedStageTimeRangeStart,
    selectedStageTimeRangeEnd,
    pairs,
    exchange,
    tradingMode,
  ]);
  const totalCandles = 43848;
  const signalFoldSizeValue = Number.parseInt(signalFoldSize, 10);
  const hasValidFoldSize = Number.isFinite(signalFoldSizeValue) && signalFoldSizeValue > 0;
  const isSignalTimeRangeFilled = Boolean(String(timeFrameStart || "").trim() && String(timeFrameEnd || "").trim());
  const completedFolds = hasValidFoldSize ? Math.floor(totalCandles / signalFoldSizeValue) : 0;
  const remainingCandles = hasValidFoldSize ? totalCandles % signalFoldSizeValue : 0;
  const entryAllowedTimeFrames = useMemo(() => {
    if (!hasSourceBestScore || !selectedStageSource?.timeRange) return TIME_RANGES;
    const sourceIdx = TIME_RANGES.indexOf(selectedStageSource.timeRange);
    if (sourceIdx === -1) return TIME_RANGES;
    return TIME_RANGES.slice(0, sourceIdx + 1);
  }, [hasSourceBestScore, selectedStageSource]);
  useEffect(() => {
    if (!hasSourceBestScore || !selectedStageSource) return;
    if (entryAllowedTimeFrames.includes(timeRange)) return;
    const fallback =
      (selectedStageSource.timeRange && entryAllowedTimeFrames.includes(selectedStageSource.timeRange)
        ? selectedStageSource.timeRange
        : entryAllowedTimeFrames[entryAllowedTimeFrames.length - 1]) || timeRange;
    onTimeRangeChange(fallback);
  }, [hasSourceBestScore, selectedStageSource, entryAllowedTimeFrames, timeRange, onTimeRangeChange]);
  useEffect(() => {
    if (!isSignalStage) return;
    if (remainingCandles > 0) return;
    setIncludeIncompleteFold(false);
  }, [isSignalStage, remainingCandles]);
  
  // Collapsed sections in Strategy Builder (1–5)
  const { collapsedSections, toggleSection } = useCollapsedSections();
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
      if (editingIndicator?.id === id) {
        setEditingIndicator(null);
        setEditIndicatorModalRangesOnly(false);
      }
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

  useEffect(() => {
    if (hyperoptResultsRows.length === 0) return;

    const row = hyperoptResultsRows[0];
    const sub = row?.children?.[0];
    if (!row || !sub) return;

    const runId = `hyperopt-${row.id}-${sub.id}`;

    let config;
    if (isRiskStage) {
      config = buildDefaultRiskHeatmapConfig(riskStoplossRanges, riskHyperoptParams);
    } else {
      const stageIndicators = pickByStage(activeStage, {
        signal: signalIndicators,
        entry: entryIndicators,
        exit: exitIndicators,
        risk: [],
      });
      config = buildDefaultBbHeatmapConfig(stageIndicators);
    }
    if (!config) return;

    setGeneratedHeatMap((prev) => {
      const sameRun = prev?.runId === runId;
      const sameVariant =
        (prev?.config?.heatmapVariant === "risk") === (config.heatmapVariant === "risk");
      const sameAxes = prev?.config?.xAxis?.join?.() === config.xAxis.join();
      if (sameRun && sameVariant && sameAxes) return prev;
      try {
        const fullResults = generateMockResults(config, runId);
        return { runId, config, fullResults, zoomStack: [] };
      } catch {
        return prev;
      }
    });
  }, [
    activeStage,
    isRiskStage,
    riskStoplossRanges,
    riskHyperoptParams,
    signalIndicators,
    entryIndicators,
    exitIndicators,
    hyperoptResultsRows,
  ]);

  const handleHeatMapCellClick = useCallback(
    (cell, runId) => {
      if (!cell || !cell.count) return;
      // For leaf cells (n=1) add candidate(s) for Save as Best instead of drilldown
      if (cell.count === 1 && Array.isArray(cell.results) && cell.results.length === 1) {
        const result = cell.results[0];
        const rawParams = result.params || {};
        const params = {};
        const isRiskHeatmap = generatedHeatMap?.config?.heatmapVariant === "risk";

        if (isRiskHeatmap) {
          const formatRiskValue = (key, value) => {
            if (key === "drawdown" && typeof value === "number" && value > 0 && value <= 1) {
              return `${(value * 100).toFixed(1)}%`;
            }
            if (typeof value === "number" && Number.isFinite(value)) {
              return value % 1 === 0 ? String(value) : value.toFixed(3);
            }
            return value;
          };
          const riskLabels = {
            profit_factor: "Profit factor",
            drawdown: "Drawdown",
            ...RISK_STOPLOSS_LABELS,
            ...RISK_LOSS_STREAK_LABELS,
          };
          Object.entries(rawParams).forEach(([key, value]) => {
            const label = riskLabels[key] || key;
            params[label] = formatRiskValue(key, value);
          });
        } else {
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
        }
        const zoomLevel = generatedHeatMap?.zoomStack?.length || 0;
        const stagePrefix = pickByStage(activeStage, {
          signal: "signal",
          entry: "entry",
          exit: "exit",
          risk: "risk",
        });
        const candidateKey = `${stagePrefix}:${runId}:${zoomLevel}:${cell.xi}:${cell.yi}`;
        setBestCandidates((prev) => {
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
    [generatedHeatMap?.zoomStack, generatedHeatMap?.config?.heatmapVariant, isEntryStage, setBestCandidates, activeStage],
  );

  const handleApplyHeatMapFilters = useCallback(({ filterRoot, filterPreset }) => {
    setGeneratedHeatMap((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        config: { ...prev.config, filters: filterRoot, filterPreset },
      };
    });
  }, []);

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
  const buildBestResult = useCallback(
    (params) => {
      const best = buildSignalBestResultFromUtils(params, {
        signalIndicators: isRiskStage ? signalIndicators : indicators,
        pairs,
        timeRange,
        signalHyperoptType: hyperoptType,
      });
      if (isRiskStage && best) {
        if (best.meta) {
          best.meta.riskStoplossRanges = { ...riskStoplossRanges };
          best.meta.riskHyperoptParams = { ...riskHyperoptParams };
        }
        const signalFav =
          signalBestResults.find((b) => String(b.id) === String(entryBestSourceId)) ||
          signalBestResults[0] ||
          null;
        const entryFav =
          entryBestResults.find((b) => String(b.id) === String(exitBestSourceId)) ||
          entryBestResults[0] ||
          null;
        const exitFav =
          exitBestResults.find((b) => String(b.id) === String(riskBestSourceId)) ||
          exitBestResults[0] ||
          null;

        const snapFromLive = (inds) =>
          (inds || []).map((ind) => buildIndicatorSnapshot(ind));
        const snapFromFavorite = (fav, liveInds) => {
          if (fav?.indicators?.length) {
            return {
              label: fav.label || null,
              indicators: fav.indicators.map((s) => ({
                ...s,
                paramsSnapshot: { ...(s.paramsSnapshot || {}) },
              })),
            };
          }
          return { label: fav?.label || null, indicators: snapFromLive(liveInds) };
        };

        best.lineage = {
          signalId: signalFav?.id ?? (entryBestSourceId || null),
          entryId: entryFav?.id ?? (exitBestSourceId || null),
          exitId: exitFav?.id ?? (riskBestSourceId || null),
        };
        best.indicatorsByStage = {
          signal: snapFromFavorite(signalFav, signalIndicators),
          entry: snapFromFavorite(entryFav, entryIndicators),
          exit: snapFromFavorite(exitFav, exitIndicators),
        };

        const fromHeatmap = riskParamsFromHeatmap(params?.meta?.heatmapParams || best.meta?.heatmapParams);
        const fromMidpoints = {
          ...riskStoplossMidpoints(riskStoplossRanges),
          ...riskLossStreakMidpoints(riskHyperoptParams),
        };
        best.riskParams = fromHeatmap || (Object.keys(fromMidpoints).length ? fromMidpoints : null);
      }
      return best;
    },
    [
      indicators,
      signalIndicators,
      entryIndicators,
      exitIndicators,
      isRiskStage,
      riskStoplossRanges,
      riskHyperoptParams,
      pairs,
      timeRange,
      hyperoptType,
      signalBestResults,
      entryBestResults,
      exitBestResults,
      entryBestSourceId,
      exitBestSourceId,
      riskBestSourceId,
    ],
  );

  const handleSaveBestResultFromDetail = useCallback(
    ({ row, sub, detail, source }) => {
      if (!detail) return;
      const scores = detail.scores || null;
      setBestResults((prev) => {
        const label =
          `Result #${prev.length + 1} • ${row.pairs || pairs || ""} • ${row.timeFrame || ""} • ${detail.label || ""}`.trim();
        const best = buildBestResult({
          label,
          source,
          scores,
          meta: {
            rowId: row.id,
            subId: sub.id,
            detailId: detail.id,
            detailLabel: detail.label,
            date: sub.date || row.date,
            hyperoptNumber: row.hyperoptNumber,
            analyzerNumber: sub.analyzerNumber,
          },
          timeRangeOverride: row.timeFrame,
        });
        return [...prev, {
          ...best,
          epochNumber: prev.length + 1,
          hyperoptNumber: row.hyperoptNumber,
          analyzerNumber: sub.analyzerNumber,
        }];
      });
    },
    [setBestResults, buildBestResult, pairs],
  );
  const handleSaveBestResultFromHeatMap = useCallback(() => {
    if (!heatMapViewModalId) return;
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
    handleSaveBestResultFromDetail({
      row: foundRow,
      sub: foundSub,
      detail,
      source: "heatmap",
    });
  }, [heatMapViewModalId, hyperoptResultsRows, handleSaveBestResultFromDetail]);

  const handleSaveBestCandidates = useCallback(() => {
    if (bestCandidates.length === 0) return;
    let heatMapTimeFrame = null;
    let hyperoptNumber = null;
    let analyzerNumber = null;
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
              hyperoptNumber = row.hyperoptNumber;
              for (const sub of row.children || []) {
                if (sub.id === subId) {
                  analyzerNumber = sub.analyzerNumber;
                  break;
                }
              }
              break;
            }
          }
        }
      }
    }
    setBestResults((prev) => {
      const startIndex = prev.length;
      const added = bestCandidates.map((cand, idx) => {
        const best = buildBestResult({
          label: `Heatmap cell #${startIndex + idx + 1}`,
          source: "heatmap",
          scores: { avg: cand.score },
          meta: {
            ...cand.meta,
            heatmapParams: cand.params,
            hyperoptNumber,
            analyzerNumber,
          },
          timeRangeOverride: heatMapTimeFrame,
        });
        return {
          ...best,
          epochNumber: startIndex + idx + 1,
          hyperoptNumber,
          analyzerNumber,
        };
      });
      return [...prev, ...added];
    });
    setBestCandidates([]);
  }, [bestCandidates, buildBestResult, setBestResults, setBestCandidates, heatMapViewModalId, hyperoptResultsRows]);

  const handleRemoveBestCandidate = useCallback(
    (id) => {
      setBestCandidates((prev) => prev.filter((c) => c.id !== id));
    },
    [setBestCandidates],
  );

  const handleClearBestCandidates = useCallback(() => {
    setBestCandidates([]);
  }, [setBestCandidates]);

  const openBestEpochsModal = useCallback((row, sub, heatMapId) => {
    setBestEpochsContext({ row, sub, heatMapId });
    setBestEpochsModalMode("add-favorites");
    setShowBestEpochsModal(true);
  }, []);

  const openMiniBacktestEpochModal = useCallback((row, sub, heatMapId) => {
    setBestEpochsContext({ row, sub, heatMapId });
    setBestEpochsModalMode("mini-backtest");
    setShowBestEpochsModal(true);
  }, []);

  const closeBestEpochsModal = useCallback(() => {
    setShowBestEpochsModal(false);
    setBestEpochsContext(null);
  }, []);

  const handleAddBestEpochs = useCallback(
    (epochNumbers) => {
      if (!bestEpochsContext) return;
      const { row, sub, heatMapId } = bestEpochsContext;
      const heatmapResults =
        generatedHeatMap?.runId === heatMapId ? generatedHeatMap.fullResults : null;

      setBestResults((prev) => {
        const existingEpochs = new Set(prev.map((b) => b.epochNumber).filter((n) => n != null));
        const toAdd = [];

        for (const epochNum of epochNumbers) {
          if (existingEpochs.has(epochNum)) continue;

          const heatmapResult = heatmapResults?.[epochNum - 1];
          const best = buildBestResult({
            label: `Epoch #${epochNum}`,
            source: "best-epochs",
            scores: heatmapResult
              ? { avg: heatmapResult.score, min: heatmapResult.score, max: heatmapResult.score }
              : { min: sub.minScore, avg: sub.avgScore, max: sub.maxScore },
            meta: {
              rowId: row.id,
              subId: sub.id,
              detailId: `epoch-${epochNum}`,
              detailLabel: `Epoch #${epochNum}`,
              date: sub.date || row.date,
              hyperoptNumber: row.hyperoptNumber,
              analyzerNumber: sub.analyzerNumber,
              heatmapParams: heatmapResult?.params,
            },
            timeRangeOverride: row.timeFrame,
          });

          toAdd.push({
            ...best,
            ...(heatmapResult && {
              score: heatmapResult.score,
              mfe: heatmapResult.mfe ?? best.mfe,
              mae: heatmapResult.mae ?? best.mae,
              air: heatmapResult.air ?? best.air,
              hitRate: heatmapResult.hitRate,
            }),
            epochNumber: epochNum,
            hyperoptNumber: row.hyperoptNumber,
            analyzerNumber: sub.analyzerNumber,
            pairs: row.pairs ?? pairs,
            timeRange: row.timeFrame ?? timeRange,
          });
          existingEpochs.add(epochNum);
        }

        return toAdd.length ? [...prev, ...toAdd] : prev;
      });

      closeBestEpochsModal();
    },
    [bestEpochsContext, generatedHeatMap, buildBestResult, setBestResults, pairs, timeRange, closeBestEpochsModal],
  );

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
  const formatIndicatorRangeParams = useCallback((ind) => {
    const list = Array.isArray(ind?.params) ? ind.params : [];
    if (!list.length) return "{}";
    return list
      .map((p) => {
        const name = p?.label || p?.key || p?.name || "param";
        if (p?.min != null && p?.max != null) {
          const hasStep = p?.step != null && p.step !== "";
          return `${name}: ${p.min}..${p.max}${hasStep ? ` (step ${p.step})` : ""}`;
        }
        if (Array.isArray(p?.values) && p.values.length > 0) {
          return `${name}: [${p.values.join(", ")}]`;
        }
        if (p?.value != null) return `${name}: ${p.value}`;
        if (p?.default != null) return `${name}: ${p.default}`;
        if (p?.defaultValue != null) return `${name}: ${p.defaultValue}`;
        return `${name}: -`;
      })
      .join(", ");
  }, []);
  const hyperoptIndicatorSnapshotRows = useMemo(
    () =>
      (indicators || [])
        .filter((ind) => ind?.enabled !== false)
        .flatMap((ind) => {
          const params = Array.isArray(ind?.params) ? ind.params : [];
          const typeLabel = String(ind?.type || "IND").toUpperCase();
          return params.map((param) => {
            const type =
              param?.type ||
              (Number.isInteger(param?.step) && Number(param.step) >= 1 ? "INT" : "FLOAT");
            const fmtBound = (value) => {
              if (value == null || value === "") return "—";
              const num = Number(value);
              if (!Number.isFinite(num)) return String(value);
              return Number.isInteger(num) ? String(num) : num.toFixed(Math.abs(num) >= 10 ? 0 : 3);
            };
            return {
              id: `${ind.id}-${param.key}`,
              typeLabel,
              paramLabel: String(param?.label || param?.key || param?.name || "param").toLowerCase(),
              valueType: String(type).toUpperCase(),
              min: fmtBound(param?.min),
              max: fmtBound(param?.max),
              step: fmtBound(param?.step),
            };
          });
        }),
    [indicators],
  );
  const riskStoplossSnapshotRows = useMemo(
    () =>
      RISK_STOPLOSS_KEYS.map((key) => {
        const fmtPct = (value) => {
          const n = Number(value);
          if (!Number.isFinite(n)) return "—";
          return `${Number((n * 100).toFixed(4))}%`;
        };
        return {
          id: key,
          label: RISK_STOPLOSS_LABELS[key] || key,
          min: fmtPct(riskStoplossRanges?.[key]?.min),
          max: fmtPct(riskStoplossRanges?.[key]?.max),
          step: fmtPct(riskStoplossRanges?.[key]?.step),
        };
      }),
    [riskStoplossRanges],
  );
  const riskCooldownSnapshotRows = useMemo(
    () =>
      RISK_HYPEROPT_PARAM_DEFS.map((def) => ({
        id: def.paramKey,
        label: def.label,
        min: riskHyperoptParams?.[def.minKey] ?? "—",
        max: riskHyperoptParams?.[def.maxKey] ?? "—",
        step: riskHyperoptParams?.[def.stepKey] ?? "—",
      })),
    [riskHyperoptParams],
  );

  const openRangeNarrowingModalForSub = useCallback((rowId, subId) => {
    if (isRiskStage) return;
    setRangeNarrowingContext({ rowId, subId });
    setShowAddRangeNarrowingModal(true);
  }, [isRiskStage]);

  /** Comparison widget: the Analytics menu only configures filters, the entry runs it later. */
  const openComparisonWidgetForm = useCallback(
    (rowId, subId) => {
      if (activeStage < 2) return;
      setComparisonWidgetFormContext({ rowId, subId });
    },
    [activeStage],
  );

  /** Comparison widget: current Stage comes from the Post-processing result context. */
  const openComparativeWidget = useCallback(
    (row, sub, item) => {
      if (activeStage < 2) return;
      setComparativeWidgetContext({
        runId: `${row.id}::${sub.id}`,
        rowId: row.id,
        subId: sub.id,
        itemId: item?.id ?? null,
        strategyName,
        timeframe: row.timeFrame ?? timeRange,
        period: row.knowRange ?? "",
        currentStage: activeStage,
        createdAt: item?.date ?? "",
        filters: item?.runConfig?.filters ?? null,
        filterPreset: item?.runConfig?.filterPreset ?? "",
      });
    },
    [activeStage, strategyName, timeRange],
  );

  /** Persist live filter edits from the widget back onto the Analytics entry. */
  const handleComparativeWidgetFiltersChange = useCallback(
    ({ filters, filterPreset }) => {
      setComparativeWidgetContext((prev) =>
        prev
          ? {
              ...prev,
              filters,
              filterPreset: filterPreset || "",
            }
          : prev,
      );

      const rowId = comparativeWidgetContext?.rowId;
      const subId = comparativeWidgetContext?.subId;
      const itemId = comparativeWidgetContext?.itemId;
      if (!setHyperoptResultsRows || !rowId || !subId || !itemId) return;

      setHyperoptResultsRows((prev) =>
        prev.map((row) => {
          if (row.id !== rowId) return row;
          return {
            ...row,
            children: (row.children || []).map((sub) => {
              if (sub.id !== subId) return sub;
              return {
                ...sub,
                heatmapsAndReports: (sub.heatmapsAndReports || []).map((item) => {
                  if (item.id !== itemId) return item;
                  return {
                    ...item,
                    runConfig: {
                      ...(item.runConfig || {}),
                      filters,
                      filterPreset: filterPreset || "",
                    },
                  };
                }),
              };
            }),
          };
        }),
      );
    },
    [
      comparativeWidgetContext?.itemId,
      comparativeWidgetContext?.rowId,
      comparativeWidgetContext?.subId,
      setHyperoptResultsRows,
    ],
  );

  /** Append an Analytics (level 3) entry to a single Post-processing result. */
  const appendAnalyticsItem = useCallback(
    (rowId, subId, item) => {
      if (!setHyperoptResultsRows) return;
      setHyperoptResultsRows((prev) =>
        prev.map((row) => {
          if (row.id !== rowId) return row;
          return {
            ...row,
            children: (row.children || []).map((sub) => {
              if (sub.id !== subId) return sub;
              return {
                ...sub,
                heatmapsAndReports: [...(sub.heatmapsAndReports || []), item],
              };
            }),
          };
        }),
      );
    },
    [setHyperoptResultsRows],
  );

  const handleRunRangeNarrowing = useCallback(
    (runConfig) => {
      if (isRiskStage || !rangeNarrowingContext) return;
      const { rowId, subId } = rangeNarrowingContext;
      appendAnalyticsItem(
        rowId,
        subId,
        createRangeNarrowingAnalyticsItem({
          subId,
          runConfig,
          date: new Date().toISOString().slice(0, 10),
        }),
      );
      setRangeNarrowingContext(null);
    },
    [appendAnalyticsItem, isRiskStage, rangeNarrowingContext],
  );

  const handleCreateComparisonWidget = useCallback(
    ({ filters, filterPreset }) => {
      if (!comparisonWidgetFormContext) return;
      const { rowId, subId } = comparisonWidgetFormContext;
      appendAnalyticsItem(
        rowId,
        subId,
        createComparisonWidgetAnalyticsItem({ subId, filters, filterPreset }),
      );
      setComparisonWidgetFormContext(null);
    },
    [appendAnalyticsItem, comparisonWidgetFormContext],
  );

  const handleApplyRangeNarrowingRanges = useCallback(
    (configRows) => {
      if (!Array.isArray(configRows) || !configRows.length) return;
      setIndicators((prev) => applyConfigRowsToIndicators(prev, configRows));
    },
    [setIndicators],
  );

  const handleRunHyperoptFromRangeNarrowing = useCallback(
    (configRows) => {
      handleApplyRangeNarrowingRanges(configRows);
    },
    [handleApplyRangeNarrowingRanges],
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
        locked: false,
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
        locked: false,
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
        label: "Validation",
        title: "STAGE 5: VALIDATION",
        locked: !backtestingEnabled,
        icon: (
          <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
            <path d="M3 4h18v5H3z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
            <path d="M6 13h15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M6 18h15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M3 13h0.01M3 18h0.01" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        ),
      },
    ],
    [backtestingEnabled]
  );

  const active = stages.find((s) => s.id === activeStage) ?? stages[0];

  const stageVersions = useMemo(
    () => (strategyId != null ? getStageVersionsForStrategy(strategyId) : []),
    [strategyId],
  );
  const [selectedVersionByStage, setSelectedVersionByStage] = useState(() =>
    createDefaultVersionSelection(stageVersions),
  );
  const [showVersionTree, setShowVersionTree] = useState(false);

  useEffect(() => {
    if (strategyId == null) return;
    setSelectedVersionByStage(createDefaultVersionSelection(getStageVersionsForStrategy(strategyId)));
  }, [strategyId]);

  const versionBreadcrumb = useMemo(
    () => getVersionBreadcrumb(stageVersions, selectedVersionByStage),
    [stageVersions, selectedVersionByStage],
  );

  const handleRunMiniBacktestFromHyperopt = useCallback(
    (epochNumbers) => {
      if (!bestEpochsContext || !miniBacktestEnabled) return;
      const epochNum = epochNumbers[0];
      if (!epochNum) return;

      const { row, sub, heatMapId } = bestEpochsContext;
      const epoch = buildEpochFromHyperoptContext({
        row,
        sub,
        heatMapId,
        epochNum,
        generatedHeatMap,
        buildBestResult,
        pairs,
        timeRange,
      });

      const stageType = STAGE_ID_TO_TYPE[activeStage];
      const version = getVersionById(stageVersions, selectedVersionByStage[stageType]);
      onOpenMiniBacktestModal?.(
        epoch,
        activeStage,
        version
          ? {
              id: version.id,
              label: version.label,
              lineageCode: version.lineageCode,
              localVersion: version.localVersion,
            }
          : null,
        buildMiniBacktestLaunchContext({
          tradingMode,
          exchange,
          pairs: row.pairs ?? pairs,
          timeframe: row.timeFrame ?? timeRange,
          knowRange: row.knowRange,
          timeFrameStart,
          timeFrameEnd,
        }),
      );
      closeBestEpochsModal();
    },
    [
      bestEpochsContext,
      miniBacktestEnabled,
      generatedHeatMap,
      buildBestResult,
      pairs,
      timeRange,
      activeStage,
      stageVersions,
      selectedVersionByStage,
      tradingMode,
      exchange,
      timeFrameStart,
      timeFrameEnd,
      onOpenMiniBacktestModal,
      closeBestEpochsModal,
    ],
  );

  const handleBestEpochsModalSubmit = useCallback(
    (epochNumbers) => {
      if (bestEpochsModalMode === "mini-backtest") {
        handleRunMiniBacktestFromHyperopt(epochNumbers);
      } else {
        handleAddBestEpochs(epochNumbers);
      }
    },
    [bestEpochsModalMode, handleRunMiniBacktestFromHyperopt, handleAddBestEpochs],
  );

  const handleStageVersionChange = useCallback(
    (stageType, versionId) => {
      setSelectedVersionByStage((prev) =>
        applyVersionChange(prev, stageType, versionId, stageVersions),
      );
    },
    [stageVersions],
  );

  const handleAddNewStageVersion = useCallback((stageType) => {
    const label = STAGE_TYPE_LABELS[stageType] ?? stageType;
    alert(`Add new ${label} version (mock — not persisted)`);
  }, []);

  const handleTreeNodeSelect = useCallback(
    (versionId) => {
      const target = getVersionById(stageVersions, versionId);
      if (!target) return;
      setSelectedVersionByStage(selectionFromTreeNode(stageVersions, target));
      if (typeof onStageChange === "function") {
        onStageChange(STAGE_TYPE_TO_ID[target.stageType] ?? 1);
      }
      setShowVersionTree(false);
    },
    [stageVersions, onStageChange],
  );

  const [openRunId, setOpenRunId] = useState(null);
  const [resultsViewMode, setResultsViewMode] = useState("table");

  const stageNavRows = useMemo(
    () =>
      stages.map((s) => {
        const stageType = STAGE_ID_TO_TYPE[s.id];
        const parentType = PARENT_STAGE_TYPE[stageType];
        const versionDisabled = parentType && !selectedVersionByStage[parentType];
        return {
          ...s,
          stageType,
          versionOptions: getAvailableVersions(stageVersions, stageType, selectedVersionByStage),
          versionDisabled,
          hasComment: hasVersionComment(versionComments, selectedVersionByStage[stageType]),
        };
      }),
    [stages, stageVersions, selectedVersionByStage, versionComments],
  );

  const openVersionCommentForStage = useCallback(
    (stageType) => {
      const version = getVersionById(stageVersions, selectedVersionByStage[stageType]);
      if (version && typeof onOpenVersionComment === "function") {
        onOpenVersionComment(version);
      }
    },
    [stageVersions, selectedVersionByStage, onOpenVersionComment],
  );

  const deleteVersionCommentForStage = useCallback(
    (stageType) => {
      const versionId = selectedVersionByStage[stageType];
      if (versionId && typeof onDeleteVersionComment === "function") {
        onDeleteVersionComment(versionId);
      }
    },
    [selectedVersionByStage, onDeleteVersionComment],
  );

  const archiveStageVersionForStage = useCallback(
    (stageType) => {
      const version = getVersionById(stageVersions, selectedVersionByStage[stageType]);
      if (!version) return;
      alert(`Archive strategy version ${version.label} (${version.lineageCode}) (mock — not persisted)`);
    },
    [stageVersions, selectedVersionByStage],
  );

  return (
    <div className="space-y-6">
      <StageVersionTreeModal
        open={showVersionTree}
        onClose={() => setShowVersionTree(false)}
        versions={stageVersions}
        strategyName={strategyName}
        selectedByStage={selectedVersionByStage}
        commentsByVersionId={versionComments}
        onSelectNode={handleTreeNodeSelect}
      />

      <div className="space-y-6">
        <div className="sticky z-10 top-[var(--header-height)] border-b border-[rgba(60,40,80,0.35)] bg-[#0f0d1e]/95 py-3 backdrop-blur supports-[backdrop-filter]:bg-[#0f0d1e]/80">
          <BuilderStepsSidebar
            stages={stageNavRows}
            activeStageId={activeStage}
            onStageChange={onStageChange}
            selectedVersionByStage={selectedVersionByStage}
            onStageVersionChange={handleStageVersionChange}
            onAddNewStageVersion={handleAddNewStageVersion}
            onOpenVersionComment={openVersionCommentForStage}
            onDeleteVersionComment={deleteVersionCommentForStage}
            onArchiveStageVersion={archiveStageVersionForStage}
            onOpenVersionTree={() => setShowVersionTree(true)}
            versionBreadcrumb={versionBreadcrumb}
          />
        </div>
        <div className="min-w-0">
        {active.id === 1 || active.id === 2 || active.id === 3 || active.id === 4 ? (
          <div className="space-y-6">
            {isRiskStage && (
              <RiskStagePanel
                collapsedSections={collapsedSections}
                toggleSection={toggleSection}
                riskStoplossRanges={riskStoplossRanges}
                onRiskStoplossRangesChange={setRiskStoplossRanges}
                riskHyperoptParams={riskHyperoptParams}
                onRiskHyperoptParamsChange={setRiskHyperoptParams}
                signalIndicators={signalIndicators}
                entryFormula={entryFormula}
                exitFormula={exitFormula}
                timeRange={timeRange}
              />
            )}
            {!isRiskStage && (
            <>
            {/* 1. INDICATORS */}
            <BuilderSectionShell
              sectionNum={1}
              title={`Indicators (${stageCopy.stageTag})`}
              subtitle="Indicator Library and Selected Indicators"
              collapsed={collapsedSections.has(1)}
              onToggle={() => toggleSection(1)}
            >
                <div className="grid grid-cols-1 lg:grid-cols-[3fr_7fr] gap-4">
                  {/* Library (left) — 30% */}
                  <div className="min-w-0">
                    <IndicatorLibrary
                      query={libraryQuery}
                      onQueryChange={setLibraryQuery}
                      groupFilter={libraryGroup}
                      onGroupChange={setLibraryGroup}
                      onAdd={handleAddIndicatorFromLibrary}
                      indicatorTagIdsByKey={indicatorTagIdsByKey}
                      tagsRegistry={tagsRegistry}
                      onAddTag={onAddIndicatorTag}
                    />
                  </div>

                  {/* Selected indicators (right) — 70% */}
                  <div className="min-w-0">
                <div className={cx("h-full flex flex-col", ui.builderColumn)}>
                  <div className="mb-2">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-[12px] font-medium mb-1 text-[#faf7fd]">
                          Selected Indicators
                        </div>
                        <div className={cx("text-[10px]", ui.textMuted)}>
                          Added indicators
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex-1 overflow-auto">
                    {true ? (
                      indicators.length === 0 ? (
                        <div className={cx(ui.radius, ui.panelMuted, "p-6 text-center text-[12px]", ui.textMuted)}>
                          No indicators yet. Add one from the library.
                        </div>
                      ) : (
                        <div className={selectedIndicatorsGridClass}>
                          {indicators.map((ind) => (
                              <SelectedIndicatorCard
                                key={ind.id}
                                indicator={ind}
                                variant="compact"
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
            </BuilderSectionShell>

            {/* 2. FORMULAS (Signal / Entry) */}
            <BuilderSectionShell
              sectionNum={2}
              title={stageCopy.formulaTitle}
              subtitle={`Define ${stageCopy.formulaKind} signals using python formula or builder`}
              collapsed={collapsedSections.has(2)}
              onToggle={() => toggleSection(2)}
            >
                  <FormulaEditor
                    key={stageCopy.formulaEditorKey}
                    value={stageFormula}
                    onChange={setStageFormula}
                    indicators={indicators}
                    mode={stageCopy.formulaMode}
                    editingLocked={isSignalStage && hyperoptResultsRows.length > 0}
                  />
            </BuilderSectionShell>

            {/* 3. INDICATOR RANGES */}
            <BuilderSectionShell
              sectionNum={3}
              title={`Indicator Ranges (${stageCopy.stageTag})`}
              subtitle="Min, max, and step for each selected indicator. Remove indicators in section 1."
              collapsed={collapsedSections.has(3)}
              onToggle={() => toggleSection(3)}
              headerRight={<TotalCombinationsBadge totalCombinations={totalCombinations} />}
            >
                  <IndicatorRangesPanel
                    indicators={indicators}
                    totalCombinations={totalCombinations}
                    onEditRanges={(ind) => {
                      setEditingIndicator(ind);
                      setEditIndicatorModalRangesOnly(true);
                    }}
                  />
            </BuilderSectionShell>

            </>
            )}

            {/* Hyperoptimization Parameters */}
            <BuilderSectionShell
              sectionNum={hyperoptSectionNum}
              title="Hyperoptimization Parameters"
              subtitle="Set trading pairs and time parameters"
              collapsed={collapsedSections.has(hyperoptSectionNum)}
              onToggle={() => toggleSection(hyperoptSectionNum)}
            >
              <div className="space-y-3">
                <div className={cx(ui.radius, ui.panelMuted, "p-3")}>
                  <div className="text-[12px] font-medium text-[#d9d9d9] mb-3">
                    Hyperopt type ({stageCopy.stageTag})
                  </div>
                  <div className="flex flex-wrap items-end gap-3">
                    <AppSelect
                      label="Hyperopt type"
                      value={hyperoptType}
                      onValueChange={setHyperoptType}
                      options={[{ value: "Brute Force", label: "Brute Force" }]}
                      className="min-w-[170px]"
                      triggerClassName="h-9 text-[12px]"
                    />
                    <AppSelect
                      label="Trading mode"
                      value={tradingMode}
                      onValueChange={setTradingMode}
                      options={[
                        { value: "futures", label: "futures" },
                        { value: "spot", label: "spot" },
                      ]}
                      className="min-w-[170px]"
                      triggerClassName="h-9 text-[12px]"
                    />
                    <AppSelect
                      label="Exchange"
                      value={exchange}
                      onValueChange={setExchange}
                      options={[
                        { value: "binance", label: "binance" },
                        { value: "htx", label: "htx" },
                        { value: "synthetic", label: "Synthetic dataset" },
                      ]}
                      className="min-w-[170px]"
                      triggerClassName="h-9 text-[12px]"
                    />
                    {exchange === "synthetic" ? (
                      <AppSelect
                        label="Synthetic dataset"
                        value={syntheticDataset}
                        onValueChange={setSyntheticDataset}
                        options={[
                          { value: "dataset1", label: "Dataset 1 (BTC/USDT)" },
                          { value: "dataset2", label: "Dataset 2 (ETC/USDT)" },
                        ]}
                        className="min-w-[170px]"
                        triggerClassName="h-9 text-[12px]"
                      />
                    ) : null}
                  </div>
                </div>
                <div className={cx(ui.radius, ui.panelMuted, "p-3")}>
                  <div className="text-[12px] font-medium text-[#d9d9d9] mb-3">Market configuration</div>
                  <div
                    className={cx(
                      "grid gap-2",
                      isSignalStage ? "grid-cols-1 xl:grid-cols-12" : "grid-cols-1 sm:grid-cols-4",
                    )}
                  >
                    {hasSourceBestScore ? (
                      <div ref={sourceDropdownRef} className={cx("relative", isSignalStage && "xl:col-span-4")}>
                        <label className={cx("block mb-1 text-xs", ui.textMuted)}>Source best score</label>
                        <button
                          type="button"
                          disabled={selectedSourceBestResults.length === 0}
                          onClick={() => setSourceDropdownOpen((prev) => !prev)}
                          className={cx(
                            ui.input,
                            "h-9 text-[12px] w-full flex items-center justify-between gap-2",
                            selectedSourceBestResults.length === 0 && "opacity-60 cursor-not-allowed",
                          )}
                          aria-haspopup="listbox"
                          aria-expanded={sourceDropdownOpen}
                        >
                          <span className="truncate text-left">
                            {selectedStageSource
                              ? `${selectedStageSource.label || "Best result"} · S:${formatBestMetric(selectedStageSource.score)} · MFE:${formatBestMetric(selectedStageSource.mfe)} · MAE:${formatBestMetric(selectedStageSource.mae)} · AIR:${formatBestMetric(selectedStageSource.air)} · normStability:${formatBestMetric(selectedStageSource.stability)}`
                              : "Select best score..."}
                          </span>
                          <span className="text-[#8c8c8c] text-[10px] shrink-0">{sourceDropdownOpen ? "▲" : "▼"}</span>
                        </button>
                        {sourceDropdownOpen && selectedSourceBestResults.length > 0 && (
                          <div
                            role="listbox"
                            className="absolute z-30 mt-2 w-[900px] max-w-[calc(100vw-120px)] overflow-hidden rounded-md border border-[#303030] bg-[#141414] shadow-[0_10px_30px_rgba(0,0,0,0.55)]"
                          >
                            <div className="max-h-72 overflow-auto">
                              <table className="w-full border-collapse text-[11px]">
                                <thead className="bg-[#1a1a1a] text-[#8c8c8c] sticky top-0">
                                  <tr>
                                    <th className="px-3 py-2 text-left font-medium border-b border-[#303030]">Label</th>
                                    <th className="px-3 py-2 text-left font-medium border-b border-[#303030] w-20">Score</th>
                                    <th className="px-3 py-2 text-left font-medium border-b border-[#303030] w-20">MFE</th>
                                    <th className="px-3 py-2 text-left font-medium border-b border-[#303030] w-20">MAE</th>
                                    <th className="px-3 py-2 text-left font-medium border-b border-[#303030] w-20">AIR</th>
                                    <th className="px-3 py-2 text-left font-medium border-b border-[#303030] w-28">normStability</th>
                                  </tr>
                                </thead>
                                <tbody className="text-[#d9d9d9]">
                                  {selectedSourceBestResults.map((best) => {
                                    const active = selectedSourceId === best.id;
                                    return (
                                      <tr
                                        key={best.id}
                                        role="option"
                                        aria-selected={active}
                                        onClick={() => {
                                          setSelectedSourceId(best.id);
                                          setSourceDropdownOpen(false);
                                        }}
                                        className={cx(
                                          "border-b border-[#303030]/60 cursor-pointer hover:bg-[#1a1a1a]",
                                          active && "bg-emerald-500/10 text-emerald-200",
                                        )}
                                      >
                                        <td className="px-3 py-2">
                                          <div className="truncate max-w-[420px]">{best.label || "Best result"}</div>
                                        </td>
                                        <td className="px-3 py-2 tabular-nums">{formatBestMetric(best.score)}</td>
                                        <td className="px-3 py-2 tabular-nums">{formatBestMetric(best.mfe)}</td>
                                        <td className="px-3 py-2 tabular-nums">{formatBestMetric(best.mae)}</td>
                                        <td className="px-3 py-2 tabular-nums">{formatBestMetric(best.air)}</td>
                                        <td className="px-3 py-2 tabular-nums">{formatBestMetric(best.stability)}</td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className={cx(isSignalStage && "xl:col-span-4")}>
                        <PairsDropdown value={pairs} onChange={onPairsChange} disabled={isSyntheticExchange} />
                      </div>
                    )}
                    <div className={cx(isSignalStage && "xl:col-span-2")}>
                      <label className={cx("block mb-1 text-xs", ui.textMuted)}>Time Frame</label>
                      <AppSelect
                        value={timeRange}
                        onValueChange={onTimeRangeChange}
                        disabled={hasSourceBestScore && !selectedSourceId}
                        className="w-full space-y-0"
                        triggerClassName={cx(
                          "h-9 text-[12px]",
                          hasSourceBestScore && !selectedSourceId && "opacity-60 cursor-not-allowed",
                        )}
                        options={(hasSourceBestScore ? entryAllowedTimeFrames : TIME_RANGES).map((v) => ({
                          value: v,
                          label: v,
                        }))}
                      />
                    </div>
                    {(!hasSourceBestScore || selectedSourceId) && (
                      <>
                        {hasSourceBestScore && (
                          <div>
                            <label className={cx("block mb-1 text-xs", ui.textMuted)}>Pairs</label>
                            <AppInput
                              type="text"
                              value={selectedStagePairs || "-"}
                              readOnly
                              className="h-9 text-[12px] w-full opacity-80 cursor-not-allowed"
                              wrapperClassName="space-y-0"
                            />
                          </div>
                        )}
                        <div className={cx(isSignalStage && "xl:col-span-3")}>
                          <DateRangePicker
                            label="Time Range"
                            from={hasSourceBestScore ? selectedStageTimeRangeStart : timeFrameStart}
                            to={hasSourceBestScore ? selectedStageTimeRangeEnd : timeFrameEnd}
                            onChange={({ from: nextFrom, to: nextTo }) => {
                              onTimeFrameStartChange?.(nextFrom);
                              onTimeFrameEndChange?.(nextTo);
                            }}
                            disabled={hasSourceBestScore}
                            triggerClassName="h-8 text-[11px]"
                          />
                        </div>
                        {isSignalStage && isSignalTimeRangeFilled && (
                          <div className={cx("space-y-1", isSignalStage && "xl:col-span-3")}>
                            <div className="space-y-1">
                              <label className={cx("block mb-1 text-xs", ui.textMuted)}>Fold size (candles)</label>
                              <AppInput
                                type="number"
                                min={1}
                                step={1}
                                value={signalFoldSize}
                                onChange={(e) => setSignalFoldSize(e.target.value)}
                                className="h-8 text-[12px] w-full"
                                wrapperClassName="space-y-0"
                                placeholder="e.g. 100"
                              />
                              <div className={cx("text-[10px]", ui.textMuted)}>Total candles: {totalCandles}</div>
                            </div>
                            {hasValidFoldSize && (
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                <div className="text-[10px] text-emerald-300">
                                  Completed: {completedFolds}
                                </div>
                                <div className="text-[10px] text-orange-300">Remaining: {remainingCandles}</div>
                                {remainingCandles > 0 && (
                                  <label className="inline-flex items-center gap-1.5 text-[10px] text-[#d9d9d9]">
                                    <input
                                      type="checkbox"
                                      checked={includeIncompleteFold}
                                      onChange={(e) => setIncludeIncompleteFold(e.target.checked)}
                                      className="h-3 w-3 accent-emerald-500"
                                    />
                                    Include incomplete fold
                                  </label>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  {hasSourceBestScore && selectedSourceBestResults.length === 0 && (
                    <div className={cx("mt-3 text-[11px]", ui.textMuted)}>
                      {isEntryStage
                        ? "No Stage 1 best scores found. Add results in Stage 1 first to unlock Entry market configuration."
                        : isExitStage
                          ? "No Stage 2 best scores found. Add results in Stage 2 first to unlock Exit market configuration."
                          : "No Stage 3 best scores found. Add results in Stage 3 first to unlock Risk market configuration."}
                    </div>
                  )}
                </div>

                {/* Intermediate formula and Post-processing are hidden for Brute Force (and on Risk stage) */}
                {hyperoptType !== "Brute Force" && !isRiskStage && (
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
                              <AppSelect
                                value={intermediateBlockScoreFormula}
                                onValueChange={(next) => {
                                  setIntermediateBlockScoreFormula(next);
                                  const code = INTERMEDIATE_SCORE_CODE_BY_TEMPLATE[next];
                                  if (code) setIntermediateBlockScoreFormulaCode(code);
                                }}
                                disabled={isEntryStage && signalHyperoptType === entryHyperoptType}
                                className="w-full max-w-[200px] space-y-0"
                                triggerClassName={cx(
                                  "h-9 text-[12px]",
                                  isEntryStage && signalHyperoptType === entryHyperoptType && "opacity-60 cursor-not-allowed",
                                )}
                                options={FINAL_SCORE_FORMULA_OPTIONS.map((v) => ({ value: v, label: v }))}
                              />
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
                                      <AppSelect
                                        value={row.formula}
                                        onValueChange={(next) => {
                                          row.setFormula(next);
                                          const byTemplate = INTERMEDIATE_METRIC_FORMULA_CODE_BY_TEMPLATE[row.metric];
                                          const code = byTemplate && byTemplate[next];
                                          if (code) row.setFormulaCode(code);
                                        }}
                                        disabled={isEntryStage && signalHyperoptType === entryHyperoptType}
                                        className="w-full min-w-0 space-y-0"
                                        triggerClassName={cx(
                                          "h-8 text-[12px]",
                                          isEntryStage && signalHyperoptType === entryHyperoptType && "opacity-60 cursor-not-allowed",
                                        )}
                                        options={[
                                          { value: "Formula 1", label: row.metric },
                                          { value: "Formula 2", label: "Fake formula" },
                                        ]}
                                      />
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
                {hyperoptType !== "Brute Force" && !isRiskStage && (
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
                              <AppSelect
                                value={finStabilityBlockFormula}
                                onValueChange={setFinStabilityBlockFormula}
                                disabled={isEntryStage && signalHyperoptType === entryHyperoptType}
                                className="w-full max-w-[200px] space-y-0"
                                triggerClassName="h-9 text-[12px]"
                                options={METRIC_FORMULA_OPTIONS.map((v) => ({ value: v, label: v }))}
                              />
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
                                        <AppSelect
                                          value={row.formula}
                                          onValueChange={(next) => {
                                            row.setFormula(next);
                                            const byTemplate = STABILITY_NORM_DIFF_FORMULA_CODE_BY_TEMPLATE[row.metric];
                                            const code = byTemplate && byTemplate[next];
                                            if (code) row.setFormulaCode(code);
                                          }}
                                          className="w-full min-w-0 space-y-0"
                                          triggerClassName="h-8 text-[12px]"
                                          options={[
                                            { value: "Formula 1", label: row.metric },
                                            { value: "Formula 2", label: "Fake formula" },
                                          ]}
                                        />
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
                              <AppSelect
                                value={finalScoreFormula}
                                onValueChange={(next) => {
                                  setFinalScoreFormula(next);
                                  const code = FINAL_SCORE_CODE_BY_TEMPLATE[next];
                                  if (code) setFinFinalFormulaCode(code);
                                }}
                                disabled={isEntryStage && signalHyperoptType === entryHyperoptType}
                                className="w-full max-w-[200px] space-y-0"
                                triggerClassName="h-9 text-[12px]"
                                options={FINAL_SCORE_FORMULA_OPTIONS.map((v) => ({ value: v, label: v }))}
                              />
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
                                        <AppSelect
                                          value={row.formula}
                                          onValueChange={(next) => {
                                            row.setFormula(next);
                                            const byTemplate = METRIC_FORMULA_CODE_BY_TEMPLATE[row.metric];
                                            const code = byTemplate && byTemplate[next];
                                            if (code) row.setFormulaCode(code);
                                          }}
                                          className="w-full min-w-0 space-y-0"
                                          triggerClassName="h-8 text-[12px]"
                                          options={[
                                            { value: "Formula 1", label: row.metric },
                                            { value: "Formula 2", label: "Fake formula" },
                                          ]}
                                        />
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
                )}

                {hyperoptType !== "Brute Force" && !isRiskStage && (
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
                              <AppSelect
                                value={intermediateBlockScoreFormula}
                                onValueChange={(next) => {
                                  setIntermediateBlockScoreFormula(next);
                                  const code = INTERMEDIATE_SCORE_CODE_BY_TEMPLATE[next];
                                  if (code) setIntermediateBlockScoreFormulaCode(code);
                                }}
                                disabled={isEntryStage && signalHyperoptType === entryHyperoptType}
                                className="w-full max-w-[200px] space-y-0"
                                triggerClassName={cx(
                                  "h-9 text-[12px]",
                                  isEntryStage && signalHyperoptType === entryHyperoptType && "opacity-60 cursor-not-allowed",
                                )}
                                options={FINAL_SCORE_FORMULA_OPTIONS.map((v) => ({ value: v, label: v }))}
                              />
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
                                      <AppSelect
                                        value={row.formula}
                                        onValueChange={(next) => {
                                          row.setFormula(next);
                                          const byTemplate = INTERMEDIATE_METRIC_FORMULA_CODE_BY_TEMPLATE[row.metric];
                                          const code = byTemplate && byTemplate[next];
                                          if (code) row.setFormulaCode(code);
                                        }}
                                        disabled={isEntryStage && signalHyperoptType === entryHyperoptType}
                                        className="w-full min-w-0 space-y-0"
                                        triggerClassName={cx(
                                          "h-8 text-[12px]",
                                          isEntryStage && signalHyperoptType === entryHyperoptType && "opacity-60 cursor-not-allowed",
                                        )}
                                        options={[
                                          { value: "Formula 1", label: row.metric },
                                          { value: "Formula 2", label: "Fake formula" },
                                        ]}
                                      />
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
                    disabled={
                      (isRiskStage ? totalCombinations === 0 : indicators.length === 0) ||
                      (hasSourceBestScore && !selectedSourceId)
                    }
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
            </BuilderSectionShell>

            {/* Optimization Results */}
            <BuilderSectionShell
              sectionNum={resultsSectionNum}
              title="Optimization Results"
              subtitle="Analyze optimization results, normalize scores by formula, and generate heatmaps and reports."
              collapsed={collapsedSections.has(resultsSectionNum)}
              onToggle={() => toggleSection(resultsSectionNum)}
            >
              <div className="overflow-auto space-y-4">
                {/* Block 1: Hyperopt result */}
                <div className="rounded-xl border border-[rgba(60,40,80,0.35)] overflow-hidden bg-[#120a20] shadow-[0_10px_30px_rgba(6,3,20,0.28)]">
                  <div className="px-4 py-3 border-b border-[rgba(60,40,80,0.3)] bg-[#1a1028]/85 flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-md border border-violet-500/35 bg-violet-500/10 px-2 py-0.5 text-[10px] font-semibold text-violet-200">
                          Hyperopt result
                        </span>
                        <span className="rounded-md border border-[rgba(60,40,80,0.4)] bg-[#19102b] px-2 py-0.5 text-[10px] text-[#b8aecc]">
                          {hyperoptResultsOverview.total} runs
                        </span>
                        <span className="rounded-md border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-200">
                          {hyperoptResultsOverview.completed} completed
                        </span>
                        <span className="rounded-md border border-amber-500/25 bg-amber-500/10 px-2 py-0.5 text-[10px] text-amber-200">
                          {hyperoptResultsOverview.inProgress} in progress
                        </span>
                        {hyperoptResultsOverview.other > 0 && (
                          <span className="rounded-md border border-[#303030] bg-[#140f20] px-2 py-0.5 text-[10px] text-[#a6a6a6]">
                            {hyperoptResultsOverview.other} other
                          </span>
                        )}
                        <span className="rounded-md border border-sky-500/25 bg-sky-500/10 px-2 py-0.5 text-[10px] text-sky-200">
                          {hyperoptResultsOverview.postProcessing} post-processing
                        </span>
                      </div>
                      <p className="mt-1 text-[10px] text-[#8c8c8c]">
                        Review optimization runs, filter by tags, and expand post-processing trunks inline.
                      </p>
                    </div>
                  </div>
                  <div className="px-4 py-3 border-b border-[rgba(60,40,80,0.3)] bg-[#140d24]">
                    <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-medium uppercase tracking-wide text-[#8c8c8c]">View</span>
                        <div className="inline-flex rounded-md border border-[rgba(60,40,80,0.45)] bg-[#0f0a1b] p-0.5">
                          <button
                            type="button"
                            onClick={() => setResultsViewMode("table")}
                            className={cx(
                              "h-7 w-7 inline-flex items-center justify-center rounded transition-colors",
                              resultsViewMode === "table"
                                ? "bg-violet-500 text-[#0f0d1e]"
                                : "text-[#a6a6a6] hover:text-[#d9d9d9]",
                            )}
                            aria-pressed={resultsViewMode === "table"}
                            title="Table view"
                            aria-label="Table view"
                          >
                            <TableViewIcon className="h-3.5 w-3.5 shrink-0" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setResultsViewMode("card")}
                            className={cx(
                              "h-7 w-7 inline-flex items-center justify-center rounded transition-colors",
                              resultsViewMode === "card"
                                ? "bg-violet-500 text-[#0f0d1e]"
                                : "text-[#a6a6a6] hover:text-[#d9d9d9]",
                            )}
                            aria-pressed={resultsViewMode === "card"}
                            title="Card view"
                            aria-label="Card view"
                          >
                            <CardViewIcon className="h-3.5 w-3.5 shrink-0" />
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-col items-start gap-1 lg:items-end">
                        <span className="text-[10px] font-medium uppercase tracking-wide text-[#8c8c8c]">Tags filter</span>
                        <TagMultiSelect
                          options={hyperoptTagFilterOptions}
                          value={hyperoptTagFilter}
                          onChange={setHyperoptTagFilter}
                          align="end"
                          triggerClassName="h-8 min-w-[240px] text-[10px] border-[rgba(60,40,80,0.45)] bg-[#0f0a1b]"
                          contentClassName="w-[260px] border-[rgba(60,40,80,0.45)] bg-[#0f0a1b]"
                        />
                      </div>
                    </div>
                  </div>
                  {resultsViewMode === "table" && (
                  <div className="overflow-x-auto bg-[#120b20]">
                    <table className="w-full border-collapse text-[11px]">
                      <thead className="bg-[#19102b] text-[#8c8c8c]">
                        <tr>
                          <th className="px-2 py-2 text-left font-medium border-b border-[rgba(60,40,80,0.35)] w-8"></th>
                          <th className="px-2 py-2 text-center font-medium border-b border-[rgba(60,40,80,0.35)]">#</th>
                          <th className="px-3 py-2 text-left font-medium border-b border-[rgba(60,40,80,0.35)]">Date</th>
                          {(isEntryStage || isExitStage || isRiskStage) && (
                            <th className="px-3 py-2 text-left font-medium border-b border-[rgba(60,40,80,0.35)]">Source</th>
                          )}
                          <th className="px-3 py-2 text-left font-medium border-b border-[rgba(60,40,80,0.35)]">Pairs</th>
                          <th className="px-3 py-2 text-left font-medium border-b border-[rgba(60,40,80,0.35)]">TimeFrame</th>
                          <th className="px-3 py-2 text-left font-medium border-b border-[rgba(60,40,80,0.35)]">Time Range</th>
                          <th className="px-3 py-2 text-left font-medium border-b border-[rgba(60,40,80,0.35)]">Status</th>
                          <th className="px-3 py-2 text-left font-medium border-b border-[rgba(60,40,80,0.35)]">Tags</th>
                          <th className="px-3 py-2 text-left font-medium border-b border-[rgba(60,40,80,0.35)]">Comment</th>
                          <th className="px-3 py-2 text-left font-medium border-b border-[rgba(60,40,80,0.35)]">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="text-[#d9d9d9]">
                        {filteredHyperoptResultsRows.length === 0 ? (
                          <tr>
                            <td
                              colSpan={(isEntryStage || isExitStage || isRiskStage) ? 11 : 10}
                              className="px-3 py-8 text-center text-[11px] text-[#8c8c8c]"
                            >
                              No optimization runs match the current tags filter.
                            </td>
                          </tr>
                        ) : filteredHyperoptResultsRows.map((row) => {
                          const rowTagNames = resolveTagNames(row.tagIds, tagsRegistry);
                          return (
                          <React.Fragment key={row.id}>
                            <tr className="border-b border-[rgba(60,40,80,0.22)] bg-[#140f23] hover:bg-[#1a1430] transition-colors">
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
                              <td className="px-2 py-2 text-center text-[#8c8c8c]">{row.hyperoptNumber ?? "—"}</td>
                              <td className="px-3 py-2 whitespace-nowrap">{formatHyperoptDateTime(row.date)}</td>
                              {(isEntryStage || isExitStage || isRiskStage) && (
                                <td className="px-3 py-2 max-w-[260px]">
                                  {selectedStageSource ? (
                                    <div
                                      className="flex items-start gap-2 min-w-0"
                                      title={`${selectedStageSource.label || "Best result"} · S:${formatBestMetric(selectedStageSource.score)} · MFE:${formatBestMetric(selectedStageSource.mfe)} · MAE:${formatBestMetric(selectedStageSource.mae)} · AIR:${formatBestMetric(selectedStageSource.air)} · normStability:${formatBestMetric(selectedStageSource.stability)}`}
                                    >
                                      <AppButton
                                        type="button"
                                        variant="outline"
                                        size="xs"
                                        className="shrink-0"
                                        onClick={() => {
                                          setShowSourceEpochInfoModal(true);
                                        }}
                                      >
                                        Info
                                      </AppButton>
                                    </div>
                                  ) : (
                                    <div>—</div>
                                  )}
                                </td>
                              )}
                              <td className="px-3 py-2">{row.pairs}</td>
                              <td className="px-3 py-2">{row.timeFrame}</td>
                              <td className="px-3 py-2 text-[#a6a6a6]">{row.knowRange}</td>
                              <td className="px-3 py-2">
                                <RunStatusBadge
                                  status={normalizeHyperoptRunStatus(row.status)}
                                  eta={row.estimationTime}
                                  progress={row.progress}
                                />
                              </td>
                              <td
                                className="px-3 py-2 max-w-[200px] align-top"
                                title={rowTagNames.length ? rowTagNames.join(", ") : undefined}
                              >
                                {rowTagNames.length ? (
                                  <div className="flex flex-wrap gap-1">
                                    {rowTagNames.slice(0, 3).map((t) => (
                                      <span
                                        key={t}
                                        className="rounded border border-[rgba(60,40,80,0.4)] bg-[#100b1c] px-1.5 py-0.5 text-[10px] text-[#b8aecc]"
                                      >
                                        {t}
                                      </span>
                                    ))}
                                    {rowTagNames.length > 3 && (
                                      <span className="self-center text-[10px] text-[#8c8c8c]">
                                        +{rowTagNames.length - 3}
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  "—"
                                )}
                              </td>
                              <td className="px-3 py-2 max-w-[220px] align-top">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  {row.comment?.trim() ? (
                                    <div className="truncate text-[#a6a6a6] flex-1 min-w-0" title={row.comment}>
                                      {row.comment}
                                    </div>
                                  ) : (
                                    <span className="text-[#595959] flex-1">—</span>
                                  )}
                                  <AppButton
                                    type="button"
                                    variant="outline"
                                    size="icon-xs"
                                    onClick={() => openHyperoptCommentModal(row)}
                                    title={row.comment?.trim() ? "Edit comment" : "Add comment"}
                                    aria-label={row.comment?.trim() ? "Edit comment" : "Add comment"}
                                    className="shrink-0"
                                  >
                                    <Pencil className="h-3 w-3 shrink-0" />
                                  </AppButton>
                                </div>
                              </td>
                              <td className="px-3 py-2">
                                <div className="flex items-center gap-1.5">
                                  {hyperoptRun !== "Pipeline" && !isHyperoptRawDataDeleted(row.status) && (
                                    <AppButton
                                      type="button"
                                      variant="outline"
                                      size="icon-xs"
                                      onClick={() => { setNormActiveTab("stability"); setShowNormalizationModal(true); }}
                                      title="Post-processing"
                                      aria-label="Post-processing"
                                    >
                                      <Workflow className="h-3.5 w-3.5 shrink-0" />
                                    </AppButton>
                                  )}
                                  <HyperoptDetailsTooltip
                                    iconOnly
                                    onShowDetails={() => {
                                      setHyperoptDetailsModalType("hyperopt");
                                      setShowHyperoptDetailsModal(true);
                                    }}
                                  />
                                  <AppButton
                                    type="button"
                                    variant="outline"
                                    size="icon-xs"
                                    onClick={() => openHyperoptTagsModal(row)}
                                    title="Tags"
                                    aria-label="Tags"
                                  >
                                    <Tag className="h-3.5 w-3.5 shrink-0" />
                                  </AppButton>
                                </div>
                              </td>
                            </tr>
                            {hyperoptResultsExpanded.has(row.id) && row.children && row.children.length > 0 && (
                              <tr>
                                <td colSpan={(isEntryStage || isExitStage || isRiskStage) ? 11 : 10} className="p-0 align-top bg-[#100a1a]">
                                  {/* Block 2: Normalization result (nested per expanded row) */}
                                  <div className="mx-4 mt-3 mb-3 rounded-xl border border-[rgba(60,40,80,0.35)] overflow-hidden bg-[#110b1d] shadow-[0_10px_24px_rgba(6,3,20,0.24)]">
                                    <div className="px-3 py-2 font-medium border-b border-[rgba(60,40,80,0.3)] bg-sky-500/10 text-sky-200 text-[11px] flex items-center justify-between gap-2">
                                      <span>Post-processing result</span>
                                      <span className="rounded-md border border-sky-500/25 bg-sky-500/10 px-1.5 py-0.5 text-[9px] text-sky-100">
                                        {row.children.length} analyzers
                                      </span>
                                    </div>
                                    <div className="overflow-x-auto">
                                      <table className="w-full border-collapse text-[11px]">
                                        <thead className="bg-[#19102b] text-[#8c8c8c]">
                                          <tr>
                                            <th className="px-2 py-1.5 text-left font-medium border-b border-[rgba(60,40,80,0.35)] w-8"></th>
                                            <th className="px-2 py-1.5 text-center font-medium border-b border-[rgba(60,40,80,0.35)]">#</th>
                                            <th className="px-3 py-1.5 text-left font-medium border-b border-[rgba(60,40,80,0.35)] w-24">Date</th>
                                            <th className="px-3 py-1.5 text-left font-medium border-b border-[rgba(60,40,80,0.35)]">Status</th>
                                            <th className="px-3 py-1.5 text-right font-medium border-b border-[rgba(60,40,80,0.35)]">Actions</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {row.children.map((sub) => {
                                            const heatMapId = `hyperopt-${row.id}-${sub.id}`;
                                            const level3Items = filterAnalyticsItemsForStage(sub.heatmapsAndReports, activeStage);
                                            const hasTruncData = !!sub.truncScores;
                                            const normKey = `${row.id}::${sub.id}`;
                                            const isDetailsExpanded = normalizationDetailsExpanded.has(normKey);
                                            const rawDataDeleted = isHyperoptRawDataDeleted(row.status);
                                            const showMutatingPostActions = !rawDataDeleted;

                                            return (
                                              <React.Fragment key={sub.id}>
                                                <tr className="border-b border-[rgba(60,40,80,0.22)] hover:bg-[#1a1430]">
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
                                                  <td className="px-2 py-2 text-center text-[#8c8c8c]">{sub.analyzerNumber ?? "—"}</td>
                                                  <td className="px-3 py-2 text-[#a6a6a6] whitespace-nowrap">{formatHyperoptDateTime(sub.date)}</td>
                                                  <td className="px-3 py-2">
                                                    <RunStatusBadge
                                                      status={sub.status || "Finished"}
                                                      eta={sub.estimationTime}
                                                      progress={sub.progress}
                                                    />
                                                  </td>
                                                  <td className="px-3 py-2 text-right">
                                                    <PostProcessingTableActions
                                                      showEpochs={showMutatingPostActions}
                                                      showAddTruncate={showMutatingPostActions}
                                                      showRangeNarrowing={showMutatingPostActions && !isRiskStage}
                                                      showComparisonWidget={!isSignalStage}
                                                      miniBacktestEnabled={miniBacktestEnabled}
                                                      onShowDetails={() => {
                                                        setHyperoptDetailsModalType("post-processing");
                                                        setShowHyperoptDetailsModal(true);
                                                      }}
                                                      onConfigureHeatMap={() => setHeatMapConfigModalId(heatMapId)}
                                                      onGenerateFullReport={() => setShowReportModal(true)}
                                                      onGenerateTopKReport={() => setShowReportModal(true)}
                                                      onBestEpochs={() => openBestEpochsModal(row, sub, heatMapId)}
                                                      onRunMiniBacktest={() => openMiniBacktestEpochModal(row, sub, heatMapId)}
                                                      onRangeNarrowing={() => openRangeNarrowingModalForSub(row.id, sub.id)}
                                                      onComparisonWidget={() => openComparisonWidgetForm(row.id, sub.id)}
                                                      onAddTruncate={() => {
                                                        setSelectedNormalizationRow(sub);
                                                        setShowTruncateModal(true);
                                                      }}
                                                    />
                                                  </td>
                                                </tr>
                                                {isDetailsExpanded && (
                                                  <tr>
                                                    <td colSpan={5} className="p-0 align-top bg-[#100a1a]">
                                                      {/* Branch A: Analytics (full data scope) */}
                                                      <div className="ml-4 mt-2 mb-2 rounded-xl border border-[rgba(60,40,80,0.35)] overflow-hidden bg-[#110b1d] shadow-[0_10px_24px_rgba(6,3,20,0.2)]">
                                                        <div className="px-3 py-1.5 font-medium border-b border-[rgba(60,40,80,0.3)] bg-amber-500/10 text-amber-200 text-[11px]">
                                                          Analytics
                                                        </div>
                                                        <div className="overflow-x-auto">
                                                          <table className="w-full border-collapse text-[11px]">
                                                            <thead className="bg-[#19102b] text-[#8c8c8c]">
                                                              <tr>
                                                                <th className="px-3 py-1.5 text-left font-medium border-b border-[#303030] w-24">
                                                                  Date
                                                                </th>
                                                                <th className="px-3 py-1.5 text-left font-medium border-b border-[#303030]">
                                                                  Type
                                                                </th>
                                                                <th className="px-3 py-1.5 text-left font-medium border-b border-[#303030]">
                                                                  Status
                                                                </th>
                                                                <th className="px-3 py-1.5 text-left font-medium border-b border-[#303030]">
                                                                  Actions
                                                                </th>
                                                              </tr>
                                                            </thead>
                                                            <tbody>
                                                              {level3Items.map((item) => (
                                                                <tr key={item.id} className="border-b border-[rgba(60,40,80,0.22)] hover:bg-[#1a1430]">
                                                                  <td className="px-3 py-2 text-[#a6a6a6]">{item.date}</td>
                                                                  <td className="px-3 py-2">{item.type}</td>
                                                                  <td className="px-3 py-2">
                                                                    <RunStatusBadge status={item.status || "Completed"} />
                                                                  </td>
                                                                  <td className="px-3 py-2">
                                                                    <AnalyticsItemActions
                                                                      item={item}
                                                                      heatMapId={heatMapId}
                                                                      onShowHeatmap={() => setHeatMapViewModalId(heatMapId)}
                                                                      onDownloadReport={() => setShowReportModal(true)}
                                                                      onShowItemFilters={() => setHeatmapItemFiltersModalItem(item)}
                                                                      onShowRangeNarrowingInfo={() => setRangeNarrowingInfoItem(item)}
                                                                      onShowRangeNarrowingResults={() => setRangeNarrowingResultsItem(item)}
                                                                      onShowComparisonWidget={() => openComparativeWidget(row, sub, item)}
                                                                      onShowComparisonWidgetInfo={() => setComparisonWidgetInfoItem(item)}
                                                                    />
                                                                  </td>
                                                                </tr>
                                                              ))}
                                                            </tbody>
                                                          </table>
                                                        </div>
                                                      </div>

                                                      <>
                                                      {/* Block 2.5: Normalization details (per normalization row) */}
                                                      <div className="ml-4 mt-2 mb-2 rounded-xl border border-[rgba(60,40,80,0.35)] overflow-hidden bg-[#110b1d] shadow-[0_10px_24px_rgba(6,3,20,0.2)]">
                                                        <div className="px-3 py-1.5 font-medium border-b border-[rgba(60,40,80,0.3)] bg-emerald-500/10 text-emerald-200 text-[11px]">
                                                          Post-processing trunk details
                                                        </div>
                                                        <div className="overflow-x-auto">
                                                          <table className="w-full border-collapse text-[11px]">
                                                            <thead className="bg-[#19102b] text-[#8c8c8c]">
                                                              <tr>
                                                                <th className="px-2 py-1.5 text-left font-medium border-b border-[#303030] w-8"></th>
                                                                <th className="px-3 py-1.5 text-left font-medium border-b border-[#303030] whitespace-nowrap">Date</th>
                                                                <th className="px-3 py-1.5 text-left font-medium border-b border-[#303030]">Truncated cycle size</th>
                                                                <th className="px-3 py-1.5 text-left font-medium border-b border-[#303030]">Status</th>
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
                                                                      <tr className="border-b border-[rgba(60,40,80,0.22)] hover:bg-[#1a1430]">
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
                                                                      <td className="px-3 py-2 text-[#a6a6a6] whitespace-nowrap">{formatHyperoptDateTime(sub.date)}</td>
                                                                      <td className="px-3 py-2">{sub.foldSize ?? "-"}</td>
                                                                      <td className="px-3 py-2">
                                                                        <RunStatusBadge
                                                      status={sub.status || "Finished"}
                                                      eta={sub.estimationTime}
                                                      progress={sub.progress}
                                                    />
                                                                      </td>
                                                                      <td className="px-3 py-2">
                                                                        <PostProcessingTableActions
                                                                          showEpochs={showMutatingPostActions}
                                                                          showAddTruncate={false}
                                                                          showRangeNarrowing={showMutatingPostActions && !isRiskStage}
                                                                          showComparisonWidget={!isSignalStage}
                                                                          miniBacktestEnabled={miniBacktestEnabled}
                                                                          onShowDetails={() => {
                                                                            setHyperoptDetailsModalType("post-processing");
                                                                            setShowHyperoptDetailsModal(true);
                                                                          }}
                                                                          onConfigureHeatMap={() => setHeatMapConfigModalId(heatMapId)}
                                                                          onGenerateFullReport={() => setShowReportModal(true)}
                                                                          onGenerateTopKReport={() => setShowReportModal(true)}
                                                                          onBestEpochs={() => openBestEpochsModal(row, sub, heatMapId)}
                                                                          onRunMiniBacktest={() => openMiniBacktestEpochModal(row, sub, heatMapId)}
                                                                          onRangeNarrowing={() => openRangeNarrowingModalForSub(row.id, sub.id)}
                                                                          onComparisonWidget={() => openComparisonWidgetForm(row.id, sub.id)}
                                                                        />
                                                                      </td>
                                                                      </tr>
                                                                      {isLevel3ExpandedForRow && level3Items.length > 0 && (
                                                                        <tr>
                                                                          <td colSpan={5} className="p-0 align-top bg-[#100a1a]">
                                                                          {/* Block 3: Analytics (child of Normalization details) */}
                                                                          <div className="ml-4 mt-2 mb-2 rounded-xl border border-[rgba(60,40,80,0.35)] overflow-hidden bg-[#110b1d] shadow-[0_10px_24px_rgba(6,3,20,0.2)]">
                                                                            <div className="px-3 py-1.5 font-medium border-b border-[rgba(60,40,80,0.3)] bg-amber-500/10 text-amber-200 text-[11px]">
                                                                              Analytics
                                                                            </div>
                                                                            <div className="overflow-x-auto">
                                                                              <table className="w-full border-collapse text-[11px]">
                                                                                <thead className="bg-[#19102b] text-[#8c8c8c]">
                                                                                  <tr>
                                                                                    <th className="px-3 py-1.5 text-left font-medium border-b border-[#303030] w-24">Date</th>
                                                                                    <th className="px-3 py-1.5 text-left font-medium border-b border-[#303030]">Type</th>
                                                                                    <th className="px-3 py-1.5 text-left font-medium border-b border-[#303030]">Status</th>
                                                                                    <th className="px-3 py-1.5 text-left font-medium border-b border-[#303030]">Actions</th>
                                                                                  </tr>
                                                                                </thead>
                                                                                <tbody>
                                                                                  {level3Items.map((item) => (
                                                                                    <tr key={item.id} className="border-b border-[rgba(60,40,80,0.22)] hover:bg-[#1a1430]">
                                                                                      <td className="px-3 py-2 text-[#a6a6a6]">{item.date}</td>
                                                                                      <td className="px-3 py-2">{item.type}</td>
                                                                                      <td className="px-3 py-2">
                                                                                        <RunStatusBadge status={item.status || "Completed"} />
                                                                                      </td>
                                                                                      <td className="px-3 py-2">
                                                                                        <AnalyticsItemActions
                                                                                          item={item}
                                                                                          heatMapId={heatMapId}
                                                                                          onShowHeatmap={() => setHeatMapViewModalId(heatMapId)}
                                                                                          onDownloadReport={() => setShowReportModal(true)}
                                                                                          onShowItemFilters={() => setHeatmapItemFiltersModalItem(item)}
                                                                                          onShowRangeNarrowingInfo={() => setRangeNarrowingInfoItem(item)}
                                                                                          onShowRangeNarrowingResults={() => setRangeNarrowingResultsItem(item)}
                                                                                          onShowComparisonWidget={() => openComparativeWidget(row, sub, item)}
                                                                                          onShowComparisonWidgetInfo={() => setComparisonWidgetInfoItem(item)}
                                                                                        />
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
                                                      </>
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
                  )}
                  {resultsViewMode === "card" && (
                  <div className="p-3">
                    {(() => {
                      const openRun = filteredHyperoptResultsRows.find((r) => r.id === openRunId);
                      const showSource = isEntryStage || isExitStage || isRiskStage;
                      const sourceText = selectedStageSource
                        ? (selectedStageSource.label || "Best result")
                        : "—";
                      const sourceTitle = selectedStageSource
                        ? `${selectedStageSource.label || "Best result"} · S:${formatBestMetric(selectedStageSource.score)} · MFE:${formatBestMetric(selectedStageSource.mfe)} · MAE:${formatBestMetric(selectedStageSource.mae)} · AIR:${formatBestMetric(selectedStageSource.air)} · normStability:${formatBestMetric(selectedStageSource.stability)}`
                        : "—";
                      const showPostProcessing = hyperoptRun !== "Pipeline";

                      return (
                        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[2fr_3fr]">
                          {/* Left: vertical list of runs */}
                          <div className="space-y-2">
                            {filteredHyperoptResultsRows.length === 0 ? (
                              <div className={cx(ui.radius, ui.panelMuted, "p-3 text-[11px]", ui.textMuted)}>
                                No optimization runs match the current filter.
                              </div>
                            ) : (
                              filteredHyperoptResultsRows.map((row) => (
                                <HyperoptResultListItem
                                  key={row.id}
                                  row={row}
                                  selected={row.id === openRunId}
                                  onSelect={(id) => setOpenRunId(id)}
                                  showSource={showSource}
                                  sourceText={sourceText}
                                  tagsRegistry={tagsRegistry}
                                />
                              ))
                            )}
                          </div>

                          {/* Right: inline detail drawer */}
                          <div className="lg:sticky lg:top-2 h-fit">
                            {openRun ? (
                              <HyperoptResultDrawer
                                run={openRun}
                                showSource={showSource}
                                sourceText={sourceText}
                                sourceTitle={sourceTitle}
                                showPostProcessing={showPostProcessing}
                                tagsRegistry={tagsRegistry}
                                onClose={() => setOpenRunId(null)}
                                onPostProcessing={() => { setNormActiveTab("stability"); setShowNormalizationModal(true); }}
                                onEditTags={(row) => openHyperoptTagsModal(row)}
                                onEditComment={(row) => openHyperoptCommentModal(row)}
                                onShowHyperoptDetails={() => {
                                  setHyperoptDetailsModalType("hyperopt");
                                  setShowHyperoptDetailsModal(true);
                                }}
                                onShowPostProcessingDetails={() => {
                                  setHyperoptDetailsModalType("post-processing");
                                  setShowHyperoptDetailsModal(true);
                                }}
                                onConfigureHeatMap={(heatMapId) => setHeatMapConfigModalId(heatMapId)}
                                onGenerateReport={() => setShowReportModal(true)}
                                onAddTruncate={(sub) => {
                                  setSelectedNormalizationRow(sub);
                                  setShowTruncateModal(true);
                                }}
                                onBestEpochs={(sub) => openBestEpochsModal(openRun, sub, `hyperopt-${openRun.id}-${sub.id}`)}
                                onRunMiniBacktest={(sub) =>
                                  openMiniBacktestEpochModal(openRun, sub, `hyperopt-${openRun.id}-${sub.id}`)
                                }
                                miniBacktestEnabled={miniBacktestEnabled}
                                onShowHeatmap={(heatMapId) => setHeatMapViewModalId(heatMapId)}
                                onDownloadReport={() => setShowReportModal(true)}
                                onShowItemFilters={(item) => setHeatmapItemFiltersModalItem(item)}
                                onShowComparisonWidget={(sub, item) => openComparativeWidget(openRun, sub, item)}
                                onShowComparisonWidgetInfo={(item) => setComparisonWidgetInfoItem(item)}
                                activeStage={activeStage}
                              />
                            ) : (
                              <div className={cx(ui.radius, ui.panelMuted, "p-6 text-center text-[11px]", ui.textMuted)}>
                                Select a result to see details.
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                  )}
                </div>
              </div>
            </BuilderSectionShell>

            {/* Favorite Epochs */}
            <BuilderSectionShell
              sectionNum={favoritesSectionNum}
              title={`Favorite Epochs (Stage ${stageCopy.favoriteEpochsNext})`}
              subtitle={`Select scores from the heatmap or enter manually for Stage ${stageCopy.favoriteEpochsNext}`}
              collapsed={collapsedSections.has(favoritesSectionNum)}
              onToggle={() => toggleSection(favoritesSectionNum)}
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="rounded-md border border-border bg-background px-2 py-0.5 text-[10px] text-muted-foreground">
                  {bestResults.length} saved
                </span>
              </div>
              <div className="space-y-3">
                    <div className={cx("text-[11px]", ui.textMuted)}>
                      {`Choose the best values from the heatmap to apply in Stage ${stageCopy.favoriteEpochsNext}.`}
                    </div>
                    {bestResults.length === 0 ? (
                      <div className={cx(ui.radius, ui.panelMuted, "p-3 text-[11px]", ui.textMuted)}>
                        {`No favorite epochs for Stage ${stageCopy.favoriteEpochsNext} yet. Use "☆ Save as Best" in Optimization Results or add manually.`}
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
                          <th className="px-3 py-2 text-left font-medium border-b border-[#303030]">HitRate</th>
                              <th className="px-3 py-2 text-left font-medium border-b border-[#303030]">Indicators</th>
                              <th className="px-3 py-2 text-left font-medium border-b border-[#303030]">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="text-[#d9d9d9]">
                            {bestResults.map((best) => {
                              const isMbtOpen = miniBacktestEnabled && miniBacktestExpandedEpochId === best.id;
                              const mbtResult = miniBacktestResults.find((r) => r.epochId === best.id);
                              return (
                                <React.Fragment key={best.id}>
                                  <tr className="border-b border-[#303030]/60 hover:bg-[#141414]">
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
                                          const indParams = formatIndicatorSnapshot(ind);
                                          return (
                                            <span
                                              key={ind.id}
                                              className="inline-flex items-center gap-1 rounded-full bg-[#1a1a1a] border border-[#303030] px-2 py-0.5"
                                            >
                                              <span className="text-[10px] text-[#f5f5f5]">
                                                {ind.displayName || getDefaultDisplayName(ind.type || "")}
                                              </span>
                                              {indParams && (
                                                <span className="text-[9px] text-[#a6a6a6] truncate max-w-[160px]">
                                                  {indParams}
                                                </span>
                                              )}
                                            </span>
                                          );
                                        })}
                                      </div>
                                    </td>
                                    <td className="px-3 py-2">
                                      <div className="flex items-center gap-1.5">
                                        <AppButton
                                          type="button"
                                          variant="outline"
                                          size="icon-xs"
                                          onClick={() => {
                                            setSelectedBestResult(best);
                                            setShowBestResultDetailsModal(true);
                                          }}
                                          title="View"
                                          aria-label="View"
                                        >
                                          <EyeIcon className="h-3.5 w-3.5 shrink-0" />
                                        </AppButton>
                                        {miniBacktestEnabled && (
                                          <AppButton
                                            type="button"
                                            variant="outline"
                                            size="icon-xs"
                                            onClick={() => {
                                              const stageType = STAGE_ID_TO_TYPE[activeStage];
                                              const version = getVersionById(
                                                stageVersions,
                                                selectedVersionByStage[stageType],
                                              );
                                              onOpenMiniBacktestModal(
                                                best,
                                                activeStage,
                                                version
                                                  ? {
                                                      id: version.id,
                                                      label: version.label,
                                                      lineageCode: version.lineageCode,
                                                      localVersion: version.localVersion,
                                                    }
                                                  : null,
                                                buildMiniBacktestLaunchContext({
                                                  tradingMode,
                                                  exchange,
                                                  pairs: best.pairs ?? pairs,
                                                  timeframe: best.timeframe ?? timeRange,
                                                  timeFrameStart,
                                                  timeFrameEnd,
                                                }),
                                              );
                                            }}
                                            title="Run Mini Backtest for this epoch"
                                            aria-label="Mini backtest"
                                            className={
                                              mbtResult
                                                ? "bg-amber-500/20 text-amber-200 border-amber-500/40"
                                                : undefined
                                            }
                                          >
                                            <FlaskConical className="h-3.5 w-3.5 shrink-0" />
                                          </AppButton>
                                        )}
                                        <AppButton
                                          type="button"
                                          variant="outline"
                                          size="icon-xs"
                                          onClick={() => {
                                            if (!confirm("Remove this Best result?")) return;
                                            setBestResults((prev) =>
                                              prev.filter((item) => item.id !== best.id),
                                            );
                                          }}
                                          title="Remove"
                                          aria-label="Remove"
                                          className="text-red-400 border-red-500/60 hover:bg-red-500/10"
                                        >
                                          <TrashIcon className="h-3.5 w-3.5 shrink-0" />
                                        </AppButton>
                                      </div>
                                    </td>
                                  </tr>
                                </React.Fragment>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
              </div>
            </BuilderSectionShell>

          </div>
        ) : active.id === 5 ? (
          <BacktestingStagePanel
            strategyName={strategyName}
            favoriteEpochs={riskBestResults}
            signalBestResults={signalBestResults}
            entryBestResults={entryBestResults}
            exitBestResults={exitBestResults}
            entryBestSourceId={entryBestSourceId}
            exitBestSourceId={exitBestSourceId}
            riskBestSourceId={riskBestSourceId}
            miniBacktestResults={miniBacktestResults}
            currentUser={MOCK_CURRENT_USER.login}
            onOpenMiniBacktest={
              miniBacktestEnabled
                ? (epoch) => {
                    if (!epoch?.id) return;
                    const stageType = STAGE_ID_TO_TYPE[activeStage];
                    const version = getVersionById(
                      stageVersions,
                      selectedVersionByStage[stageType],
                    );
                    onOpenMiniBacktestModal?.(
                      epoch,
                      activeStage,
                      version
                        ? {
                            id: version.id,
                            label: version.label,
                            lineageCode: version.lineageCode,
                            localVersion: version.localVersion,
                          }
                        : null,
                      buildMiniBacktestLaunchContext({
                        tradingMode,
                        exchange,
                        pairs: epoch.pairs ?? pairs,
                        timeframe: epoch.timeframe ?? epoch.timeRange ?? timeRange,
                        timeFrameStart,
                        timeFrameEnd,
                      }),
                    );
                  }
                : undefined
            }
          />
        ) : (
          <div className={cx(ui.radius, ui.panelMuted, "px-4 py-3 text-[12px]", ui.textSubtle)}>
            {active.title} — coming soon.
          </div>
        )}
        </div>
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
        <Suspense fallback={<LoadingFallback />}>
          <GenerateReportModal
            open={showReportModal}
            indicators={indicators}
            onClose={() => setShowReportModal(false)}
            onGenerate={(config) => {
              console.log('📊 Report generated:', config);
              alert(`Report generated for ${config.indicator.name}`);
            }}
          />
        </Suspense>
      )}
      {/* Formula Editor modal */}
      <AppDialog
        open={showFormulaEditor}
        onOpenChange={(next) => {
          if (!next) handleFormulaEditorCancel();
        }}
        title="Formula Editor"
        className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        <div className="flex-1 overflow-auto space-y-4 min-h-0">
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
                <AppSelect
                  value=""
                  className="flex-1 space-y-0"
                  triggerClassName="h-8 text-[12px]"
                  placeholder="Select variable…"
                  onValueChange={(v) => {
                    if (!v) return;
                    insertIntoFormulaEditor(v);
                  }}
                  options={FORMULA_EDITOR_VARIABLES.map((v) => ({ value: v, label: v }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-[11px] font-medium text-[#d9d9d9]">Functions</div>
              <div className="flex items-center gap-2">
                <AppSelect
                  value=""
                  className="flex-1 space-y-0"
                  triggerClassName="h-8 text-[12px]"
                  placeholder="Select function…"
                  onValueChange={(v) => {
                    if (!v) return;
                    insertIntoFormulaEditor(v);
                  }}
                  options={FORMULA_EDITOR_FUNCTIONS.map((fn) => ({
                    value: fn.template,
                    label: `${fn.label} — ${fn.template}`,
                  }))}
                />
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
        <div className="flex items-center justify-between gap-2 pt-2">
          <button
            type="button"
            onClick={handleFormulaEditorClear}
            className="text-[11px] text-[#8c8c8c] hover:text-[#d9d9d9]"
          >
            Clear
          </button>
          <div className="flex items-center gap-2">
            <AppButton type="button" variant="outline" size="sm" onClick={handleFormulaEditorCancel}>
              Cancel
            </AppButton>
            <AppButton type="button" variant="default" size="sm" onClick={handleFormulaEditorApply}>
              Apply
            </AppButton>
          </div>
        </div>
      </AppDialog>
      {/* Run normalization modal — same block as Normalization formulas */}
      <AppDialog
        open={showNormalizationModal}
        onOpenChange={(next) => {
          if (!next) setShowNormalizationModal(false);
        }}
        title={`Run normalization (${stageCopy.stageTag})`}
        className="max-w-[720px] max-h-[90vh] overflow-hidden flex flex-col"
      >
            {/* Tab bar */}
            <div className="flex border-b border-[#303030] shrink-0 -mt-2">
              {[
                ["stability", "Stability formula"],
                ["score", "Final score formula"],
                ...(!isRiskStage ? [["narrowing", "Range Narrowing"]] : []),
              ].map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setNormActiveTab(id)}
                  className={cx(
                    "px-3 py-2.5 text-[12px] border-b-2 -mb-px transition-colors whitespace-nowrap",
                    normActiveTab === id
                      ? "border-violet-500 text-[#d9d9d9] font-medium"
                      : "border-transparent text-[#8c8c8c] hover:text-[#d9d9d9]",
                  )}
                >{label}</button>
              ))}
            </div>
            <div className="overflow-auto flex-1 min-h-0">
              {/* ── Tab: Stability formula ── */}
              {normActiveTab === "stability" && (
              <div className="space-y-3">
                        <div className="space-y-1.5">
                          <div className="text-[11px] font-medium text-[#d9d9d9]">Stability formula</div>
                    <div className="flex flex-wrap items-center gap-3 gap-y-2">
                      <AppSelect
                        value={finStabilityBlockFormula}
                        onValueChange={setFinStabilityBlockFormula}
                        className="w-full max-w-[200px] space-y-0"
                        triggerClassName="h-9 text-[12px]"
                        options={METRIC_FORMULA_OPTIONS.map((v) => ({ value: v, label: v }))}
                      />
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
                                <AppSelect
                                  value={row.formula}
                                  onValueChange={(next) => {
                                    row.setFormula(next);
                                    const byTemplate = STABILITY_NORM_DIFF_FORMULA_CODE_BY_TEMPLATE[row.metric];
                                    const code = byTemplate && byTemplate[next];
                                    if (code) row.setFormulaCode(code);
                                  }}
                                  className="w-full min-w-0 space-y-0"
                                  triggerClassName="h-8 text-[12px]"
                                  options={[
                                    { value: "Formula 1", label: row.metric },
                                    { value: "Formula 2", label: "Fake formula" },
                                  ]}
                                />
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
              {/* ── Tab: Final score formula ── */}
              {normActiveTab === "score" && (
              <div className="space-y-3">
                        <div className="space-y-1.5">
                          <div className="text-[11px] font-medium text-[#d9d9d9]">Final score formula</div>
                          <div className="flex flex-wrap items-center gap-3 gap-y-2">
                            <AppSelect
                              value={finalScoreFormula}
                              onValueChange={(next) => {
                                setFinalScoreFormula(next);
                                const code = FINAL_SCORE_CODE_BY_TEMPLATE[next];
                                if (code) setFinFinalFormulaCode(code);
                              }}
                              className="w-full max-w-[200px] space-y-0"
                              triggerClassName="h-9 text-[12px]"
                              options={FINAL_SCORE_FORMULA_OPTIONS.map((v) => ({ value: v, label: v }))}
                            />
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
                            <AppSelect
                              value={finStabilityFormula}
                              onValueChange={(next) => {
                                setFinStabilityFormula(next);
                                const byTemplate = METRIC_FORMULA_CODE_BY_TEMPLATE.normStability;
                                const code = byTemplate && byTemplate[next];
                                if (code) setFinStabilityFormulaCode(code);
                              }}
                              className="w-full min-w-0 space-y-0"
                              triggerClassName="h-8 text-[12px]"
                              options={[
                                { value: "Formula 1", label: "normStability" },
                                { value: "Formula 2", label: "Fake formula" },
                              ]}
                            />
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
                              <AppSelect
                                value={row.formula}
                                onValueChange={(next) => {
                                  row.setFormula(next);
                                  const byTemplate = METRIC_FORMULA_CODE_BY_TEMPLATE[row.metric];
                                  const code = byTemplate && byTemplate[next];
                                  if (code) row.setFormulaCode(code);
                                }}
                                className="w-full min-w-0 space-y-0"
                                triggerClassName="h-8 text-[12px]"
                                options={[
                                  { value: "Formula 1", label: row.metric },
                                  { value: "Formula 2", label: "Fake formula" },
                                ]}
                              />
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
              {/* ── Tab: Range Narrowing ── */}
              {normActiveTab === "narrowing" && (
              <div className="space-y-4">
                {/* Toggle: Also calculate parameter range narrowing */}
                <div className="flex items-start gap-3 rounded-lg border border-[#303030] bg-[#0f0f0f]/50 p-3">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={rnEnabled}
                    onClick={() => setRnEnabled((v) => !v)}
                    className={cx(
                      "relative shrink-0 mt-0.5 h-6 w-10 rounded-full border-2 transition-colors",
                      rnEnabled ? "bg-violet-600 border-violet-500" : "bg-[#303030] border-[#404040]",
                    )}
                  >
                    <span className={cx(
                      "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform",
                      rnEnabled ? "translate-x-4 left-0.5" : "translate-x-0 left-0.5",
                    )} />
                  </button>
                  <div>
                    <div className="text-[12px] font-medium text-[#d9d9d9]">Also calculate parameter range narrowing</div>
                    <div className="text-[11px] text-[#8c8c8c] mt-0.5">Runs on top of this run&apos;s report — no extra epochs, same completed data. Off by default.</div>
                  </div>
                </div>

                {/* Info banner — always visible */}
                <div className="rounded-lg border border-violet-700/40 bg-violet-900/30 px-3 py-2.5 text-[11px] text-violet-200 leading-snug">
                  Target metric is fixed to <strong className="text-violet-100">final_score</strong>. Native step per parameter is computed automatically from this run&apos;s tested values — nothing to set here.
                </div>

                {/* All fields — only when rnEnabled */}
                {rnEnabled && (
                  <div className="space-y-4">
                    {/* Sliders row */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="text-[11px] font-medium text-[#d9d9d9]">
                          Plateau width: <span className="text-violet-300">{rnPlateauWidth}%</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          step={1}
                          value={rnPlateauWidth}
                          onChange={(e) => setRnPlateauWidth(Number(e.target.value))}
                          className="w-full h-2 accent-violet-500"
                        />
                        <div className="text-[10px] text-[#8c8c8c]">0% = peak only, 100% = whole curve.</div>
                      </div>
                      <div className="space-y-2">
                        <div className="text-[11px] font-medium text-[#d9d9d9]">
                          Min importance to keep: <span className="text-violet-300">{rnMinImportance}%</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={10}
                          step={0.5}
                          value={rnMinImportance}
                          onChange={(e) => setRnMinImportance(Number(e.target.value))}
                          className="w-full h-2 accent-violet-500"
                        />
                        <div className="text-[10px] text-[#8c8c8c]">Importance below this → parameter gets fixed.</div>
                      </div>
                    </div>

                    {/* Number fields row */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-medium text-[#d9d9d9]">Max combinations</label>
                        <AppInput
                          type="number"
                          min={1}
                          value={rnMaxCombinations}
                          onChange={(e) => setRnMaxCombinations(Number(e.target.value))}
                          className="h-9 text-[12px] w-full"
                          wrapperClassName="space-y-0"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-medium text-[#d9d9d9]">Min. epochs per value</label>
                        <AppInput
                          type="number"
                          min={1}
                          value={rnMinEpochsPerValue}
                          onChange={(e) => setRnMinEpochsPerValue(Number(e.target.value))}
                          className="h-9 text-[12px] w-full"
                          wrapperClassName="space-y-0"
                        />
                        <div className="text-[10px] text-[#8c8c8c] leading-snug">Values tested on fewer epochs than this are dropped from the curve/range (min_rows_per_value).</div>
                      </div>
                    </div>

                    {/* Toggle: Also generate config «margin» */}
                    <div className="flex items-start gap-3 rounded-lg border border-[#303030] bg-[#0f0f0f]/50 p-3">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={rnMarginEnabled}
                        onClick={() => setRnMarginEnabled((v) => !v)}
                        className={cx(
                          "relative shrink-0 mt-0.5 h-6 w-10 rounded-full border-2 transition-colors",
                          rnMarginEnabled ? "bg-violet-600 border-violet-500" : "bg-[#303030] border-[#404040]",
                        )}
                      >
                        <span className={cx(
                          "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform",
                          rnMarginEnabled ? "translate-x-4 left-0.5" : "translate-x-0 left-0.5",
                        )} />
                      </button>
                      <div>
                        <div className="text-[12px] font-medium text-[#d9d9d9]">Also generate config «margin» (safety range)</div>
                        <div className="text-[11px] text-[#8c8c8c] mt-0.5">When on, margin recalculates its own points/step and must independently fit within max combinations.</div>
                      </div>
                    </div>

                    {/* Margin widen */}
                    {rnMarginEnabled && (
                      <div className="flex flex-col gap-1.5">
                        <label className="block text-[11px] font-medium text-[#d9d9d9]">Margin widen (steps, for the &ldquo;margin&rdquo; config)</label>
                        <AppInput
                          type="number"
                          min={0}
                          value={rnMarginWiden}
                          onChange={(e) => setRnMarginWiden(Number(e.target.value))}
                          className="h-9 text-[12px] w-full max-w-[240px]"
                          wrapperClassName="space-y-0"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
              )}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <AppButton type="button" variant="outline" size="sm" onClick={() => setShowNormalizationModal(false)}>Cancel</AppButton>
              <AppButton type="button" variant="default" size="sm" onClick={() => setShowNormalizationModal(false)}>Run post-processing</AppButton>
            </div>
      </AppDialog>
      {!isRiskStage && (
      <AddRangeNarrowingModal
        open={showAddRangeNarrowingModal}
        onClose={() => {
          setShowAddRangeNarrowingModal(false);
          setRangeNarrowingContext(null);
        }}
        onRun={handleRunRangeNarrowing}
      />
      )}
      <RangeNarrowingReadOnlyModal
        open={Boolean(rangeNarrowingInfoItem)}
        runConfig={rangeNarrowingInfoItem?.runConfig}
        onClose={() => setRangeNarrowingInfoItem(null)}
      />
      <RangeNarrowingResultsModal
        open={Boolean(rangeNarrowingResultsItem)}
        item={rangeNarrowingResultsItem}
        onClose={() => setRangeNarrowingResultsItem(null)}
        onApplyRanges={handleApplyRangeNarrowingRanges}
        onRunHyperopt={handleRunHyperoptFromRangeNarrowing}
      />
      <AddComparisonWidgetModal
        open={Boolean(comparisonWidgetFormContext)}
        currentStage={activeStage}
        onClose={() => setComparisonWidgetFormContext(null)}
        onRun={handleCreateComparisonWidget}
      />
      <ComparisonWidgetReadOnlyModal
        open={Boolean(comparisonWidgetInfoItem)}
        item={comparisonWidgetInfoItem}
        onClose={() => setComparisonWidgetInfoItem(null)}
      />
      <ComparativeWidgetModal
        open={Boolean(comparativeWidgetContext)}
        context={comparativeWidgetContext}
        onClose={() => setComparativeWidgetContext(null)}
        onFiltersChange={handleComparativeWidgetFiltersChange}
      />
      {/* Add truncate modal */}
      <AppDialog
        open={showTruncateModal}
        onOpenChange={(next) => {
          if (!next) {
            setShowTruncateModal(false);
            setSelectedNormalizationRow(null);
          }
        }}
        title="Add truncate"
        className="max-w-[420px] max-h-[90vh] overflow-hidden flex flex-col"
      >
        <div className="space-y-4">
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
                <AppInput
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
                  className="mt-1 h-8 text-[12px]"
                  wrapperClassName="space-y-0"
                  placeholder="e.g. 12"
                />
              </label>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 pt-2">
          <AppButton
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setShowTruncateModal(false);
              setSelectedNormalizationRow(null);
            }}
          >
            Cancel
          </AppButton>
          <AppButton
            type="button"
            variant="default"
            size="sm"
            onClick={() => {
              // Placeholder: here in future we'll persist truncate settings
              // For now just close modal.
              setShowTruncateModal(false);
              setSelectedNormalizationRow(null);
            }}
          >
            Save
          </AppButton>
        </div>
      </AppDialog>
      <TagsEditModal
        open={Boolean(hyperoptTagsModalRowId)}
        draft={hyperoptTagsDraft}
        tagsRegistry={tagsRegistry}
        onDraftChange={setHyperoptTagsDraft}
        onCommitTag={commitHyperoptTagsDraftTag}
        onClose={closeHyperoptTagsModal}
        onSave={saveHyperoptTagsModal}
      />
      <AppDialog
        open={Boolean(hyperoptCommentModalRowId)}
        onOpenChange={(next) => {
          if (!next) closeHyperoptCommentModal();
        }}
        title="Comment"
        className="max-w-[480px] max-h-[90vh] overflow-hidden flex flex-col"
      >
        <div className="space-y-1.5">
          <label className="block text-[11px] font-medium text-[#d9d9d9]">Comment</label>
          <Textarea
            value={hyperoptCommentDraft.comment}
            onChange={(e) =>
              setHyperoptCommentDraft((prev) => ({ ...prev, comment: e.target.value }))
            }
            rows={6}
            className="w-full text-[12px] resize-y min-h-[120px] py-2"
            placeholder="Notes for this run…"
          />
        </div>
        <div className="flex items-center justify-end gap-2 pt-2">
          <AppButton
            type="button"
            variant="outline"
            size="icon-sm"
            onClick={closeHyperoptCommentModal}
            title="Cancel"
            aria-label="Cancel"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </AppButton>
          <AppButton
            type="button"
            variant="default"
            size="icon-sm"
            onClick={saveHyperoptCommentModal}
            title="Save"
            aria-label="Save"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </AppButton>
        </div>
      </AppDialog>
      {/* Add Best result manually (stage-dependent) */}
      <AppDialog
        open={showAddBestResultModal}
        onOpenChange={(next) => {
          if (!next) {
            setShowAddBestResultModal(false);
            setManualBestResultSelectionKey("");
          }
        }}
        title={`Add Best result (${stageCopy.stageTag})`}
        className="max-w-[520px] max-h-[90vh] overflow-hidden flex flex-col"
      >
        <div className="space-y-4">
          <div className={cx(ui.radius, ui.panelMuted, "p-3 space-y-3")}>
            <div className="text-[12px] font-medium text-[#d9d9d9]">Select normalization result</div>
            <p className={cx("text-[11px]", ui.textMuted)}>
              Choose a normalization result (full or trunc data). Metrics will be taken from the selected row and the
              current Signal indicators will be captured as a snapshot.
            </p>
            <AppSelect
              value={manualBestResultSelectionKey}
              onValueChange={setManualBestResultSelectionKey}
              placeholder="Select normalization result…"
              className="w-full space-y-0"
              triggerClassName="h-9 text-[12px]"
              options={hyperoptResultsRows.flatMap((row) =>
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
                  return entries.map((detail) => ({
                    value: detail.id,
                    label: `${row.pairs || pairs} · ${row.timeFrame} · ${sub.date} · ${detail.label} · score ${detail.scores?.avg ?? detail.scores?.max ?? "-"}`,
                  }));
                }),
              )}
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <AppButton
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setShowAddBestResultModal(false);
              setManualBestResultSelectionKey("");
            }}
          >
            Cancel
          </AppButton>
          <AppButton
            type="button"
            variant="default"
            size="sm"
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
                handleSaveBestResultFromDetail({
                  row: foundRow,
                  sub: foundSub,
                  detail,
                  source: "manual",
                });
                setShowAddBestResultModal(false);
                setManualBestResultSelectionKey("");
              }
            }}
          >
            Save Best result
          </AppButton>
        </div>
      </AppDialog>
      {heatmapItemFiltersModalItem && (
        <HeatmapFiltersReadOnlyModal item={heatmapItemFiltersModalItem} onClose={() => setHeatmapItemFiltersModalItem(null)} />
      )}
      {/* Formulas info modal (read-only) — opens when Details ⓘ is clicked */}
      <AppDialog
        open={showHyperoptDetailsModal}
        onOpenChange={(next) => {
          if (!next) setShowHyperoptDetailsModal(false);
        }}
        title={
          hyperoptDetailsModalType === "hyperopt"
            ? "Hyperopt Run Info"
            : "Normalization formulas (read-only)"
        }
        className="max-w-[720px] max-h-[90vh] overflow-hidden flex flex-col"
      >
            <div className="overflow-auto min-h-0 flex-1">
              {hyperoptDetailsModalType !== "hyperopt" && (
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
              )}
              {hyperoptDetailsModalType === "hyperopt" && (
              <div className="space-y-4">
                <div className="grid gap-2 sm:grid-cols-3">
                  {[
                    { label: "Exchange", value: exchange || "—" },
                    { label: "Trading mode", value: tradingMode || "—" },
                    { label: "Total epochs", value: totalCombinations.toLocaleString("en-US") },
                  ].map((entry) => (
                    <div
                      key={entry.label}
                      className="rounded-md border border-[rgba(60,40,80,0.35)] bg-[#1c1830] px-3 py-2"
                    >
                      <div className="text-[9px] font-medium uppercase tracking-[0.12em] text-[#6e6682]">{entry.label}</div>
                      <div className="mt-1 text-[12px] font-medium text-[#faf7fd]">{entry.value}</div>
                    </div>
                  ))}
                </div>

                {isRiskStage ? (
                  <div className="grid gap-3">
                    {[
                      { title: "Stoplosses", rows: riskStoplossSnapshotRows },
                      { title: "Cooldowns", rows: riskCooldownSnapshotRows },
                    ].map((section) => (
                      <div
                        key={section.title}
                        className="rounded-lg border border-[rgba(60,40,80,0.35)] bg-[#171426] p-4"
                      >
                        <div className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-violet-200">
                          {section.title}
                        </div>
                        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
                          {section.rows.map((row) => (
                            <div
                              key={row.id}
                              className="rounded-md border border-[rgba(60,40,80,0.28)] bg-[#1c1830] px-3 py-2 space-y-2"
                            >
                              <div className="text-[11px] font-medium text-[#faf7fd]">{row.label}</div>
                              <div className="grid grid-cols-3 gap-2 text-[10px] uppercase tracking-wide text-[#8c8c8c]">
                                <div>
                                  <div>Min</div>
                                  <div className="mt-1 font-mono text-[11px] normal-case tracking-normal text-[#faf7fd]">
                                    {row.min}
                                  </div>
                                </div>
                                <div>
                                  <div>Max</div>
                                  <div className="mt-1 font-mono text-[11px] normal-case tracking-normal text-[#faf7fd]">
                                    {row.max}
                                  </div>
                                </div>
                                <div>
                                  <div>Step</div>
                                  <div className="mt-1 font-mono text-[11px] normal-case tracking-normal text-[#faf7fd]">
                                    {row.step}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg border border-[rgba(60,40,80,0.35)] bg-[#171426] p-4">
                    <div className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-violet-200">Indicators</div>
                    {!hyperoptIndicatorSnapshotRows.length ? (
                      <div className={cx("text-[11px]", ui.textMuted)}>No indicators configured for the current stage.</div>
                    ) : (
                      <div className="rounded-lg border border-[rgba(60,40,80,0.28)] overflow-hidden">
                        {hyperoptIndicatorSnapshotRows.map((row) => (
                          <div
                            key={row.id}
                            className="flex flex-wrap items-center gap-x-2 gap-y-1 border-b border-[rgba(60,40,80,0.22)] bg-[#1c1830] px-4 py-3 text-[11px] last:border-b-0"
                          >
                            <span className="rounded-full bg-[rgba(168,96,240,0.18)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-violet-200">
                              {row.typeLabel}
                            </span>
                            <span className="font-mono text-[#faf7fd]">{row.paramLabel}</span>
                            <span className="rounded bg-[#332b46] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-[#d8d0ea]">
                              {row.valueType}
                            </span>
                            <span className="ml-auto flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] font-semibold uppercase tracking-wide text-[#b8aecc]">
                              <span>Min <span className="ml-1 font-mono text-[#faf7fd]">{row.min}</span></span>
                              <span>Max <span className="ml-1 font-mono text-[#faf7fd]">{row.max}</span></span>
                              <span>Step <span className="ml-1 font-mono text-[#faf7fd]">{row.step}</span></span>
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              )}
            </div>
            <div className="flex justify-end pt-2">
              {hyperoptDetailsModalType === "hyperopt" ? (
                <AppButton
                  type="button"
                  variant="default"
                  size="sm"
                  onClick={() => setShowHyperoptDetailsModal(false)}
                >
                  Reuse indicators and hyperopt parameters
                </AppButton>
              ) : (
                <AppButton
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowHyperoptDetailsModal(false)}
                >
                  Close
                </AppButton>
              )}
            </div>
      </AppDialog>
      <AppDialog
        open={Boolean(showSourceEpochInfoModal && selectedStageSourceInfo)}
        onOpenChange={(next) => {
          if (!next) {
            setShowSourceEpochInfoModal(false);
          }
        }}
        title="Source epoch info"
        description={selectedStageSourceInfo?.title}
        className="max-w-[980px] max-h-[92vh] overflow-hidden flex flex-col"
      >
        {selectedStageSourceInfo ? (
          <>
            <div className="overflow-auto space-y-5 min-h-0 flex-1">
              <div className="space-y-2">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-[#6e6682]">Dataset</div>
                <div className="rounded-lg border border-[rgba(60,40,80,0.35)] bg-[#171426] p-3">
                  <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                    {[
                      { label: "Pair", value: selectedStageSourceInfo.pair },
                      { label: "Timeframe", value: selectedStageSourceInfo.timeframe },
                      { label: "Exchange", value: selectedStageSourceInfo.exchange },
                      { label: "Trading mode", value: selectedStageSourceInfo.tradingMode },
                    ].map((entry) => (
                      <div key={entry.label} className="rounded-md border border-[rgba(60,40,80,0.35)] bg-[#1c1830] px-3 py-2">
                        <div className="text-[9px] font-medium uppercase tracking-[0.12em] text-[#6e6682]">{entry.label}</div>
                        <div className="mt-1 text-[12px] font-medium text-[#faf7fd]">{entry.value}</div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 rounded-md border border-[rgba(60,40,80,0.35)] bg-[#1c1830] px-3 py-2">
                    <div className="text-[9px] font-medium uppercase tracking-[0.12em] text-[#6e6682]">Date range</div>
                    <div className="mt-1 text-[12px] font-medium text-[#faf7fd]">{selectedStageSourceInfo.dateRange}</div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-[#6e6682]">Metrics</div>
                <div className="space-y-2 rounded-lg border border-[rgba(60,40,80,0.35)] bg-[#171426] p-3">
                  <div className="space-y-2">
                    <div className="text-[10px] font-semibold uppercase tracking-wide text-violet-200">
                      Final evaluation
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                      {selectedStageSourceInfo.finalEvaluation.map((entry) => (
                        <div
                          key={entry.label}
                          className="rounded-md border border-[rgba(60,40,80,0.35)] bg-[#1c1830] px-3 py-2"
                        >
                          <div className="text-[9px] font-medium uppercase tracking-[0.12em] text-[#6e6682]">
                            {entry.label}
                          </div>
                          <div className="mt-1 font-mono text-[20px] font-semibold tabular-nums leading-none text-[#faf7fd]">
                            {entry.value}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-2 xl:grid-cols-2">
                    {[
                      { title: "Cycle performance", columns: selectedStageSourceInfo.cyclePerformanceColumns },
                      { title: "Final score", columns: selectedStageSourceInfo.finalScoreColumns },
                      { title: "Stability", columns: selectedStageSourceInfo.stabilityColumns, fullWidth: true },
                    ].map((section) => (
                      <div
                        key={section.title}
                        className={cx(
                          "rounded-lg border border-[rgba(60,40,80,0.35)] bg-[#120b20] p-3 space-y-2",
                          section.fullWidth && "xl:col-span-2",
                        )}
                      >
                        <div className="text-[10px] font-semibold uppercase tracking-wide text-violet-200">
                          {section.title}
                        </div>
                        <div
                          className={cx(
                            "grid gap-3",
                            section.columns.length === 3 ? "xl:grid-cols-3" : "sm:grid-cols-2",
                          )}
                        >
                          {section.columns.map((column, columnIdx) => (
                            <div
                              key={`${section.title}-${columnIdx}`}
                              className="space-y-0 rounded-md border border-[rgba(60,40,80,0.28)] bg-[#171426] overflow-hidden"
                            >
                              {column.map((entry) => (
                                <div
                                  key={entry.label}
                                  className="flex items-start justify-between gap-3 border-b border-[rgba(60,40,80,0.22)] px-3 py-2 text-[11px] last:border-b-0"
                                >
                                  <span className="text-[#b8aecc]">{entry.label}</span>
                                  <span className="font-mono tabular-nums text-[#faf7fd] text-right">{entry.value}</span>
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-[#6e6682]">Indicators</div>
                <div className="rounded-lg border border-[rgba(60,40,80,0.35)] bg-[#171426] p-3">
                  {!selectedStageSourceInfo.indicatorRows.length ? (
                    <div className={cx("text-[11px]", ui.textMuted)}>No indicators captured for this source epoch.</div>
                  ) : (
                    <div className="space-y-2">
                      {selectedStageSourceInfo.indicatorRows.map((row) => (
                        <div
                          key={row.id}
                          className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-md border border-[rgba(60,40,80,0.35)] bg-[#1c1830] px-3 py-2 text-[11px]"
                        >
                          <span className="rounded bg-[rgba(168,96,240,0.18)] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-violet-200">
                            {row.indicator}
                          </span>
                          <span className="font-medium text-[#faf7fd]">{row.key}</span>
                          <span className="rounded border border-[rgba(60,40,80,0.35)] bg-[#251f3a] px-1.5 py-0.5 text-[9px] font-medium text-[#b8aecc]">
                            {row.type}
                          </span>
                          <span className="rounded bg-[#2a2440] px-2 py-0.5 font-mono tabular-nums text-[#faf7fd]">{row.value}</span>
                          <span className="ml-auto flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-[#8c8c8c]">
                            <span>Min {row.min}</span>
                            <span>Max {row.max}</span>
                            <span>Step {row.step}</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <AppButton
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowSourceEpochInfoModal(false)}
              >
                Close
              </AppButton>
            </div>
          </>
        ) : null}
      </AppDialog>
      {/* Best result details modal */}
      <AppDialog
        open={Boolean(showBestResultDetailsModal && selectedBestResult)}
        onOpenChange={(next) => {
          if (!next) {
            setShowBestResultDetailsModal(false);
            setSelectedBestResult(null);
          }
        }}
        title={
          selectedBestResult
            ? `Best result — ${selectedBestResult.label || "Signal configuration"}`
            : "Best result"
        }
        description={
          selectedBestResult
            ? `${selectedBestResult.pairs || pairs || "-"} · ${selectedBestResult.timeRange || timeRange || "-"} · ${selectedBestResult.hyperoptType || signalHyperoptType}`
            : undefined
        }
        className="max-w-[720px] max-h-[90vh] overflow-hidden flex flex-col"
      >
        {selectedBestResult ? (
          <>
            <div className="overflow-auto space-y-4 min-h-0 flex-1">
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
            <div className="flex justify-end gap-2 pt-2">
              <AppButton
                type="button"
                variant="default"
                size="sm"
                onClick={() => {
                  setShowBestResultDetailsModal(false);
                  setSelectedBestResult(null);
                }}
              >
                Close
              </AppButton>
            </div>
          </>
        ) : null}
      </AppDialog>
      {/* HeatMap configurator modal — opens when Configure HeatMap is clicked */}
      <AppDialog
        open={Boolean(heatMapConfigModalId)}
        onOpenChange={(next) => {
          if (!next) setHeatMapConfigModalId(null);
        }}
        title="Configure HeatMap"
        className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        <div className="overflow-auto min-h-0 flex-1">
          <HeatMapConfigurator
            variant={isRiskStage ? "risk" : "indicators"}
            indicators={indicators}
            riskStoplossRanges={riskStoplossRanges}
            riskHyperoptParams={riskHyperoptParams}
            onGenerate={(config) => handleGenerateHeatMap(config, heatMapConfigModalId)}
          />
        </div>
      </AppDialog>
      {/* HeatMap view modal — opens when Show heatmap is clicked */}
      <AppDialog
        open={Boolean(heatMapViewModalId)}
        onOpenChange={(next) => {
          if (!next) setHeatMapViewModalId(null);
        }}
        title="Heatmap"
        className="max-w-[min(1320px,calc(100vw-2rem))] max-h-[92vh] overflow-hidden flex flex-col bg-[#120a20] border-[rgba(60,40,80,0.35)] shadow-[0_24px_60px_rgba(6,3,20,0.55)]"
      >
        {generatedHeatMap && generatedHeatMap.runId === heatMapViewModalId ? (
          <div className="flex justify-end -mt-1">
            <AppButton
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setGeneratedHeatMap(null);
                setHeatMapViewModalId(null);
              }}
            >
              Clear HeatMap
            </AppButton>
          </div>
        ) : null}
        <div className="overflow-y-auto overflow-x-hidden flex-1 min-h-0">
          {generatedHeatMap && generatedHeatMap.runId === heatMapViewModalId ? (
            <HeatMapView
              heatMapData={currentHeatMapData}
              config={generatedHeatMap.config}
              isRiskHeatmap={isRiskStage}
              onCellClick={(cell) => handleHeatMapCellClick(cell, heatMapViewModalId)}
              onZoomOut={() => handleHeatMapZoomOut(heatMapViewModalId)}
              onResetZoom={() => handleHeatMapResetZoom(heatMapViewModalId)}
              canZoomOut={generatedHeatMap.zoomStack.length > 0}
              canReset={generatedHeatMap.zoomStack.length > 0}
              zoomLevel={generatedHeatMap.zoomStack.length}
              onSaveBest={
                bestCandidates.length > 0
                  ? handleSaveBestCandidates
                  : handleSaveBestResultFromHeatMap
              }
              saveBestLabel="Save selection"
              bestCandidates={bestCandidates}
              onRemoveCandidate={handleRemoveBestCandidate}
              onClearAllCandidates={handleClearBestCandidates}
              onApplyFilters={handleApplyHeatMapFilters}
            />
          ) : (
            <div className="py-8 text-center text-[#8c8c8c] text-[13px]">
              <p className="mb-3">No heatmap generated for this run.</p>
              <AppButton
                type="button"
                variant="default"
                size="sm"
                onClick={() => {
                  setHeatMapViewModalId(null);
                  setHeatMapConfigModalId(heatMapViewModalId);
                }}
              >
                Configure &amp; Generate HeatMap
              </AppButton>
            </div>
          )}
        </div>
        <div className="flex justify-end pt-2">
          <AppButton type="button" variant="outline" size="sm" onClick={() => setHeatMapViewModalId(null)}>
            Close
          </AppButton>
        </div>
      </AppDialog>
      {editingIndicator && (
        <EditIndicatorModal
          indicator={editingIndicator}
          rangesOnly={editIndicatorModalRangesOnly}
          onClose={() => {
            setEditingIndicator(null);
            setEditIndicatorModalRangesOnly(false);
          }}
          onSave={handleEditIndicator}
        />
      )}
      <BestEpochsModal
        open={showBestEpochsModal}
        context={bestEpochsContext}
        mode={bestEpochsModalMode}
        onClose={closeBestEpochsModal}
        onSubmit={handleBestEpochsModalSubmit}
      />
    </div>
  );
});

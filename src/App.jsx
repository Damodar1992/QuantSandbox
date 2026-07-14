import React, { useCallback, useEffect, useMemo, useRef, useState, Suspense, lazy } from "react";
import { Blocks, FlaskConical } from "lucide-react";
import { LoadingFallback } from "./components/common/LoadingFallback";
import { cx, ui } from "./constants/ui";
import { HeaderProd, TableViewIcon, CardViewIcon } from "./components/shared";
import { getFeatureFlags, setFeatureFlag } from "./constants/featureFlags";
import { SECTIONS, DISABLED_SECTIONS, PAIR_OPTIONS, TIME_RANGES, INITIAL_STRATEGIES } from "./constants/app";
import {
  INITIAL_TAGS_REGISTRY,
  INITIAL_TAG_RELATIONS,
  INITIAL_HYPEROPT_RESULTS_ROWS,
  MOCK_CURRENT_USER,
} from "./constants/tags";
import { Logo, Badge, MoreIcon, EyeIcon, MenuIcon, ModalShell } from "./components/common";
import { LoginScreen, ForgotPasswordModal } from "./components/auth";
import { BuilderStepsSidebar } from "./components/prod";
import { CreateStrategyModal, EditDescriptionModal, StrategyRow } from "./components/strategies";
import { UserActionsMenu, CreateUserModal, EditUserModal, ChangePasswordModal, ResetPasswordModal } from "./components/users";
import { IndicatorActionsMenu, AddIndicatorPageModal } from "./components/indicators";
import { MiniBacktestGlobalPage, MiniBacktestPage } from "./features/builder/components";
import { FormulaActionsMenu } from "./components/formulas";
import { useOutsideClose } from "./hooks/useOutsideClose";
import { BASE_INDICATORS } from "./constants/indicators";
const MiniBacktestModal = lazy(() =>
  import("./features/builder/components/results/MiniBacktestModal").then((m) => ({
    default: m.MiniBacktestModal,
  })),
);
const GenerateReportModalLazy = lazy(() =>
  import("./components/report/GenerateReportModal").then((m) => ({
    default: m.GenerateReportModal,
  })),
);
import {
  FORMULA_MODAL_VARIABLES,
  FORMULA_MODAL_FUNCTIONS,
  FORMULA_MODAL_OPERATORS,
  FORMULA_HYPEROPT_TYPES,
  FORMULA_TYPES,
  FORMULA_SUBTYPES,
} from "./constants/formulas";
import { buildInitialGlobalMiniBacktestResults } from "./constants/miniBacktestSeed";
import { dedupeMiniBacktestResultIds } from "./features/builder/utils/miniBacktestEngine";
import { buildMiniBacktestLaunchContext } from "./features/builder/utils/miniBacktestDisplay";
import { getStageVersionsForStrategy } from "./constants/mockStageVersionTree";
import {
  STAGE_ID_TO_TYPE,
  STAGE_TYPE_TO_ID,
  STAGE_TYPE_LABELS,
  PARENT_STAGE_TYPE,
} from "./constants/versioning";
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
} from "./features/versioning";
import {
  buildIndicatorTagIdsByKey,
  findOrCreateTagByName,
  getAvailableTagIdsForFilter,
  resolveTagNames,
  syncHyperoptTagIds,
  syncIndicatorTagIds,
  syncMiniBacktestTagIds,
  syncStrategyTagIds,
} from "./features/tags/utils/tagStore";
import { TagsPage, TagsEditModal } from "./components/tags";
import { ReleaseNotesPage, ReleaseNoteModal } from "./components/releaseNotes";
import { INITIAL_RELEASE_NOTES } from "./constants/releaseNotes";
import { BuilderStepper } from "./features/builder/BuilderStepper";
/**
 * Quant Sandbox CRM Mock — Properly structured React app
 * - Login + Forgot Password (mock)
 * - Header navigation (Backtesting disabled, Users available)
 * - Strategies list (expand versions)
 * - Strategy detail (Strategy Builder)
 * - Edit version description modal
 * - Builder: Run Optimization + Optimization Runs table + row-details HeatMap
 * 
 * Structure:
 * - constants/ - All app constants and configurations
 * - App.jsx - Main application logic and components
 */


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

  // Mini Backtest Modal state
  const [miniBacktestModalEpoch, setMiniBacktestModalEpoch] = useState(null);
  const [miniBacktestModalOpen, setMiniBacktestModalOpen] = useState(false);
  const [miniBacktestLaunchStageId, setMiniBacktestLaunchStageId] = useState(1);
  const [miniBacktestLaunchStageVersion, setMiniBacktestLaunchStageVersion] = useState(null);
  const [miniBacktestLaunchContext, setMiniBacktestLaunchContext] = useState(null);

  // Navigation
  const [activeSection, setActiveSection] = useState("Strategies");
  const [settingsSubSection, setSettingsSubSection] = useState("indicators"); // "indicators" | "formulas"

  // Strategies
  const [strategies, setStrategies] = useState(INITIAL_STRATEGIES);
  const [selected, setSelected] = useState(null); // {strategyId, versionId}

  // Indicators page (mock) — lifted early for shared tag sync with Indicator Library
  const [pageIndicators, setPageIndicators] = useState(() => [
    {
      id: 1,
      catalogKey: "RSI",
      name: "RSI - Relative Strength Index",
      description: "Momentum oscillator measuring speed and magnitude of price changes",
      type: "Momentum",
      indicatorType: "System",
      status: "Active",
      createdAt: "2025-01-10",
      tagIds: ["tag-momentum"],
    },
    {
      id: 2,
      catalogKey: "EMA",
      name: "EMA - Exponential Moving Average",
      description: "Moving average giving more weight to recent prices",
      type: "Trend",
      indicatorType: "System",
      status: "Active",
      createdAt: "2025-01-12",
      tagIds: ["tag-btc"],
    },
    {
      id: 3,
      catalogKey: "BBANDS",
      name: "BB - Bollinger Bands",
      description: "Volatility bands placed above and below a moving average",
      type: "Volatility",
      indicatorType: "System",
      status: "Archived",
      createdAt: "2024-11-05",
      tagIds: [],
    },
  ]);
  const [showAddIndicatorPage, setShowAddIndicatorPage] = useState(false);
  // Detail view
  const [actionsDropdownOpen, setActionsDropdownOpen] = useState(false);

  // Strategy detail tabs
  const [activeStrategyTab, setActiveStrategyTab] = useState("builder");

  // --- Mini Backtest Analyzer ---
  const [miniBacktestEnabled, setMiniBacktestEnabled] = useState(() => getFeatureFlags().miniBacktest);
  const [formulasEnabled, setFormulasEnabled] = useState(() => getFeatureFlags().formulas);
  const [allMiniBacktestResults, setAllMiniBacktestResults] = useState(() =>
    buildInitialGlobalMiniBacktestResults(),
  );
  const [selectedMiniBacktestId, setSelectedMiniBacktestId] = useState(null);
  const [globalMiniBacktestDetailId, setGlobalMiniBacktestDetailId] = useState(null);
  const [miniBacktestExpandedEpochId, setMiniBacktestExpandedEpochId] = useState(null);

  const miniBacktestResults = useMemo(() => {
    if (!selected?.strategyId) return [];
    return allMiniBacktestResults.filter((r) => r.strategyId === selected.strategyId);
  }, [allMiniBacktestResults, selected?.strategyId]);

  // Global tags + hyperopt results (lifted from BuilderStepper)
  const [tagsRegistry, setTagsRegistry] = useState(() => INITIAL_TAGS_REGISTRY);
  const [tagRelations, setTagRelations] = useState(() => INITIAL_TAG_RELATIONS);
  const [tagsPageCount, setTagsPageCount] = useState(null);
  const [hyperoptResultsRows, setHyperoptResultsRows] = useState(() => INITIAL_HYPEROPT_RESULTS_ROWS);
  const [hyperoptTagFilter, setHyperoptTagFilter] = useState([]);
  const [hyperoptTagsModalRowId, setHyperoptTagsModalRowId] = useState(null);
  const [hyperoptTagsDraft, setHyperoptTagsDraft] = useState({ tagIds: [], tagInput: "" });
  const [miniBacktestTagsModalEntryId, setMiniBacktestTagsModalEntryId] = useState(null);
  const [miniBacktestTagsDraft, setMiniBacktestTagsDraft] = useState({ tagIds: [], tagInput: "" });
  const [strategyTagFilter, setStrategyTagFilter] = useState([]);
  const [strategyTagFilterOpen, setStrategyTagFilterOpen] = useState(false);
  const strategyTagFilterRef = useOutsideClose(strategyTagFilterOpen, () => setStrategyTagFilterOpen(false));
  const [strategyTagsModalId, setStrategyTagsModalId] = useState(null);
  const [strategyTagsDraft, setStrategyTagsDraft] = useState({ tagIds: [], tagInput: "" });
  const [indicatorTagFilter, setIndicatorTagFilter] = useState([]);
  const [indicatorTagFilterOpen, setIndicatorTagFilterOpen] = useState(false);
  const indicatorTagFilterRef = useOutsideClose(indicatorTagFilterOpen, () => setIndicatorTagFilterOpen(false));
  const [indicatorTagsModalKey, setIndicatorTagsModalKey] = useState(null);
  const [indicatorTagsDraft, setIndicatorTagsDraft] = useState({ tagIds: [], tagInput: "" });

  const handleTagIdsRemoved = useCallback((removedIds) => {
    setHyperoptTagFilter((prev) => prev.filter((id) => !removedIds.includes(id)));
    setStrategyTagFilter((prev) => prev.filter((id) => !removedIds.includes(id)));
    setIndicatorTagFilter((prev) => prev.filter((id) => !removedIds.includes(id)));
  }, []);
  const handleTagsPageCountChange = useCallback((count) => {
    setTagsPageCount(count);
  }, []);

  const openHyperoptTagsModal = useCallback((row) => {
    setHyperoptTagsModalRowId(row.id);
    setHyperoptTagsDraft({
      tagIds: Array.isArray(row.tagIds) ? [...row.tagIds] : [],
      tagInput: "",
    });
  }, []);

  const closeHyperoptTagsModal = useCallback(() => {
    setHyperoptTagsModalRowId(null);
    setHyperoptTagsDraft({ tagIds: [], tagInput: "" });
  }, []);

  const commitHyperoptTagsDraftTag = useCallback(() => {
    const name = hyperoptTagsDraft.tagInput.trim();
    if (!name) return;

    const existing = tagsRegistry.find((tag) => tag.name === name);
    if (existing) {
      setHyperoptTagsDraft((prev) => ({
        ...prev,
        tagIds: prev.tagIds.includes(existing.id) ? prev.tagIds : [...prev.tagIds, existing.id],
        tagInput: "",
      }));
      return;
    }

    const { registry: nextRegistry, tag } = findOrCreateTagByName(
      tagsRegistry,
      name,
      MOCK_CURRENT_USER,
    );
    setTagsRegistry(nextRegistry);
    if (!tag) return;
    setHyperoptTagsDraft((prev) => ({
      ...prev,
      tagIds: prev.tagIds.includes(tag.id) ? prev.tagIds : [...prev.tagIds, tag.id],
      tagInput: "",
    }));
  }, [hyperoptTagsDraft.tagInput, tagsRegistry]);

  const saveHyperoptTagsModal = useCallback(() => {
    if (!hyperoptTagsModalRowId) return;
    const row = hyperoptResultsRows.find((item) => item.id === hyperoptTagsModalRowId);
    if (!row) return;

    const result = syncHyperoptTagIds({
      row,
      tagIds: hyperoptTagsDraft.tagIds,
      registry: tagsRegistry,
      relations: tagRelations,
      hyperoptResultsRows,
      currentUser: MOCK_CURRENT_USER,
    });

    setTagsRegistry(result.registry);
    setTagRelations(result.relations);
    setHyperoptResultsRows(result.hyperoptResultsRows);
    closeHyperoptTagsModal();
  }, [
    hyperoptTagsModalRowId,
    hyperoptResultsRows,
    hyperoptTagsDraft.tagIds,
    tagsRegistry,
    tagRelations,
    closeHyperoptTagsModal,
  ]);

  const openMiniBacktestTagsModal = useCallback((entry) => {
    setMiniBacktestTagsModalEntryId(entry.id);
    setMiniBacktestTagsDraft({
      tagIds: Array.isArray(entry.tagIds) ? [...entry.tagIds] : [],
      tagInput: "",
    });
  }, []);

  const closeMiniBacktestTagsModal = useCallback(() => {
    setMiniBacktestTagsModalEntryId(null);
    setMiniBacktestTagsDraft({ tagIds: [], tagInput: "" });
  }, []);

  const commitMiniBacktestTagsDraftTag = useCallback(() => {
    const name = miniBacktestTagsDraft.tagInput.trim();
    if (!name) return;

    const existing = tagsRegistry.find((tag) => tag.name === name);
    if (existing) {
      setMiniBacktestTagsDraft((prev) => ({
        ...prev,
        tagIds: prev.tagIds.includes(existing.id) ? prev.tagIds : [...prev.tagIds, existing.id],
        tagInput: "",
      }));
      return;
    }

    const { registry: nextRegistry, tag } = findOrCreateTagByName(
      tagsRegistry,
      name,
      MOCK_CURRENT_USER,
    );
    setTagsRegistry(nextRegistry);
    if (!tag) return;
    setMiniBacktestTagsDraft((prev) => ({
      ...prev,
      tagIds: prev.tagIds.includes(tag.id) ? prev.tagIds : [...prev.tagIds, tag.id],
      tagInput: "",
    }));
  }, [miniBacktestTagsDraft.tagInput, tagsRegistry]);

  const saveMiniBacktestTagsModal = useCallback(() => {
    if (!miniBacktestTagsModalEntryId) return;
    const entry = allMiniBacktestResults.find((item) => item.id === miniBacktestTagsModalEntryId);
    if (!entry) return;

    const result = syncMiniBacktestTagIds({
      entry,
      tagIds: miniBacktestTagsDraft.tagIds,
      registry: tagsRegistry,
      relations: tagRelations,
      miniBacktestResults: allMiniBacktestResults,
    });

    setTagsRegistry(result.registry);
    setTagRelations(result.relations);
    setAllMiniBacktestResults(result.miniBacktestResults);
    closeMiniBacktestTagsModal();
  }, [
    miniBacktestTagsModalEntryId,
    allMiniBacktestResults,
    miniBacktestTagsDraft.tagIds,
    tagsRegistry,
    tagRelations,
    closeMiniBacktestTagsModal,
  ]);

  const openStrategyTagsModal = useCallback((strategy) => {
    setStrategyTagsModalId(strategy.id);
    setStrategyTagsDraft({
      tagIds: Array.isArray(strategy.tagIds) ? [...strategy.tagIds] : [],
      tagInput: "",
    });
  }, []);

  const closeStrategyTagsModal = useCallback(() => {
    setStrategyTagsModalId(null);
    setStrategyTagsDraft({ tagIds: [], tagInput: "" });
  }, []);

  const commitStrategyTagsDraftTag = useCallback(() => {
    const name = strategyTagsDraft.tagInput.trim();
    if (!name) return;

    const existing = tagsRegistry.find((tag) => tag.name === name);
    if (existing) {
      setStrategyTagsDraft((prev) => ({
        ...prev,
        tagIds: prev.tagIds.includes(existing.id) ? prev.tagIds : [...prev.tagIds, existing.id],
        tagInput: "",
      }));
      return;
    }

    const { registry: nextRegistry, tag } = findOrCreateTagByName(
      tagsRegistry,
      name,
      MOCK_CURRENT_USER,
    );
    setTagsRegistry(nextRegistry);
    if (!tag) return;
    setStrategyTagsDraft((prev) => ({
      ...prev,
      tagIds: prev.tagIds.includes(tag.id) ? prev.tagIds : [...prev.tagIds, tag.id],
      tagInput: "",
    }));
  }, [strategyTagsDraft.tagInput, tagsRegistry]);

  const saveStrategyTagsModal = useCallback(() => {
    if (strategyTagsModalId == null) return;
    const strategy = strategies.find((item) => item.id === strategyTagsModalId);
    if (!strategy) return;

    const result = syncStrategyTagIds({
      strategy,
      tagIds: strategyTagsDraft.tagIds,
      registry: tagsRegistry,
      relations: tagRelations,
      strategies,
    });

    setTagsRegistry(result.registry);
    setTagRelations(result.relations);
    setStrategies(result.strategies);
    closeStrategyTagsModal();
  }, [
    strategyTagsModalId,
    strategies,
    strategyTagsDraft.tagIds,
    tagsRegistry,
    tagRelations,
    closeStrategyTagsModal,
  ]);

  const openIndicatorTagsModal = useCallback((indicatorOrKey, info) => {
    const catalogKey =
      typeof indicatorOrKey === "string"
        ? indicatorOrKey
        : indicatorOrKey?.catalogKey;
    if (!catalogKey) return;
    const existing =
      typeof indicatorOrKey === "object" && indicatorOrKey?.tagIds
        ? indicatorOrKey
        : pageIndicators.find((ind) => ind.catalogKey === catalogKey);
    const name =
      existing?.name ||
      info?.name ||
      BASE_INDICATORS[catalogKey]?.name ||
      catalogKey;
    setIndicatorTagsModalKey(catalogKey);
    setIndicatorTagsDraft({
      tagIds: Array.isArray(existing?.tagIds) ? [...existing.tagIds] : [],
      tagInput: "",
      name,
    });
  }, [pageIndicators]);

  const closeIndicatorTagsModal = useCallback(() => {
    setIndicatorTagsModalKey(null);
    setIndicatorTagsDraft({ tagIds: [], tagInput: "", name: "" });
  }, []);

  const commitIndicatorTagsDraftTag = useCallback(() => {
    const name = indicatorTagsDraft.tagInput.trim();
    if (!name) return;

    const existing = tagsRegistry.find((tag) => tag.name === name);
    if (existing) {
      setIndicatorTagsDraft((prev) => ({
        ...prev,
        tagIds: prev.tagIds.includes(existing.id) ? prev.tagIds : [...prev.tagIds, existing.id],
        tagInput: "",
      }));
      return;
    }

    const { registry: nextRegistry, tag } = findOrCreateTagByName(
      tagsRegistry,
      name,
      MOCK_CURRENT_USER,
    );
    setTagsRegistry(nextRegistry);
    if (!tag) return;
    setIndicatorTagsDraft((prev) => ({
      ...prev,
      tagIds: prev.tagIds.includes(tag.id) ? prev.tagIds : [...prev.tagIds, tag.id],
      tagInput: "",
    }));
  }, [indicatorTagsDraft.tagInput, tagsRegistry]);

  const saveIndicatorTagsModal = useCallback(() => {
    if (!indicatorTagsModalKey) return;
    const existing = pageIndicators.find((ind) => ind.catalogKey === indicatorTagsModalKey);
    const base = BASE_INDICATORS[indicatorTagsModalKey];
    const indicator = existing || {
      catalogKey: indicatorTagsModalKey,
      name: indicatorTagsDraft.name || base?.name || indicatorTagsModalKey,
      description: base?.description || "",
      type: base?.group || "Custom",
      group: base?.group,
    };

    const result = syncIndicatorTagIds({
      indicator,
      catalogKey: indicatorTagsModalKey,
      tagIds: indicatorTagsDraft.tagIds,
      registry: tagsRegistry,
      relations: tagRelations,
      pageIndicators,
    });

    setTagsRegistry(result.registry);
    setTagRelations(result.relations);
    setPageIndicators(result.pageIndicators);
    closeIndicatorTagsModal();
  }, [
    indicatorTagsModalKey,
    pageIndicators,
    indicatorTagsDraft.tagIds,
    indicatorTagsDraft.name,
    tagsRegistry,
    tagRelations,
    closeIndicatorTagsModal,
  ]);

  const handleSaveMiniBacktestResult = useCallback((result) => {    let nextId = result.id;
    const strategy = strategies.find((s) => s.id === selected?.strategyId);
    const finishedResult = {
      ...result,
      runStatus: result.runStatus || "Finished",
      strategyId: selected?.strategyId ?? result.strategyId ?? null,
      strategyName: strategy?.name ?? result.strategyName ?? null,
      strategyVersionId: selected?.versionId ?? result.strategyVersionId ?? null,
    };
    setAllMiniBacktestResults((prev) => {
      const scopeId = finishedResult.strategyId;
      const scoped = scopeId != null ? prev.filter((r) => r.strategyId === scopeId) : prev;
      const others = scopeId != null ? prev.filter((r) => r.strategyId !== scopeId) : [];

      const existingIdx = scoped.findIndex(
        (r) => r.epochId === finishedResult.epochId && r.paramsHash === finishedResult.paramsHash,
      );
      let nextScoped;
      if (existingIdx >= 0) {
        nextScoped = [...scoped];
        nextScoped[existingIdx] = finishedResult;
        nextId = finishedResult.id;
      } else if (scoped.some((r) => r.id === finishedResult.id)) {
        nextId = `mbt-${finishedResult.epochId}-${Date.now()}`;
        nextScoped = [...scoped, { ...finishedResult, id: nextId }];
      } else {
        nextScoped = [...scoped, { ...finishedResult, id: nextId }];
      }

      return scopeId != null ? [...others, ...nextScoped] : nextScoped;
    });
    setSelectedMiniBacktestId(nextId);
    if (miniBacktestEnabled) {
      setActiveStrategyTab("miniBacktest");
    }
  }, [selected, strategies, miniBacktestEnabled]);

  useEffect(() => {
    if (activeStrategyTab !== "miniBacktest") return;
    setAllMiniBacktestResults((prev) => dedupeMiniBacktestResultIds(prev));
  }, [activeStrategyTab]);

  const handleRemoveMiniBacktestResult = useCallback((id) => {
    setAllMiniBacktestResults((prev) => prev.filter((r) => r.id !== id));
    setSelectedMiniBacktestId((sel) => (sel === id ? null : sel));
    setGlobalMiniBacktestDetailId((sel) => (sel === id ? null : sel));
  }, []);

  const handleOpenMiniBacktestStrategy = useCallback(
    (strategyId, backtestId) => {
      if (!miniBacktestEnabled) return;
      const strategy = strategies.find((s) => s.id === strategyId);
      const version = strategy?.versions?.[0];
      if (!strategy || !version) return;
      setSelected({ strategyId, versionId: version.id });
      setActiveSection("Strategies");
      setActiveStrategyTab("miniBacktest");
      setSelectedMiniBacktestId(backtestId);
      setGlobalMiniBacktestDetailId(null);
    },
    [strategies, miniBacktestEnabled],
  );

  // Builder fields (mock)
  const [builderStage, setBuilderStage] = useState(1);
  const [builderPairs, setBuilderPairs] = useState("BTC/USDT");
  const [builderTimeRange, setBuilderTimeRange] = useState("15m");
  const [builderTimeFrameStart, setBuilderTimeFrameStart] = useState("2020-01-01");
  const [builderTimeFrameEnd, setBuilderTimeFrameEnd] = useState("2023-12-31");
  const [builderHyperoptRun, setBuilderHyperoptRun] = useState("Admin run");

  // Edit description modal
  const [showEditDescription, setShowEditDescription] = useState(false);
  const [editDescriptionDraft, setEditDescriptionDraft] = useState("");

  // Stage version tree from strategies list
  const [versionTreeListStrategy, setVersionTreeListStrategy] = useState(null);
  const [listVersionByStage, setListVersionByStage] = useState(() =>
    createDefaultVersionSelection([]),
  );

  const listStageVersions = useMemo(
    () => (versionTreeListStrategy ? getStageVersionsForStrategy(versionTreeListStrategy.id) : []),
    [versionTreeListStrategy],
  );

  useEffect(() => {
    if (!versionTreeListStrategy) return;
    setListVersionByStage(
      createDefaultVersionSelection(getStageVersionsForStrategy(versionTreeListStrategy.id)),
    );
  }, [versionTreeListStrategy]);

  const [versionComments, setVersionComments] = useState({});
  const [versionCommentTarget, setVersionCommentTarget] = useState(null);

  const handleOpenVersionComment = useCallback((version) => {
    if (!version) return;
    setVersionCommentTarget({
      id: version.id,
      label: version.label,
      lineageCode: version.lineageCode,
      stageType: version.stageType,
    });
  }, []);

  const handleSaveVersionComment = useCallback((versionId, text) => {
    setVersionComments((prev) => {
      const trimmed = text.trim();
      if (!trimmed) {
        const next = { ...prev };
        delete next[versionId];
        return next;
      }
      return { ...prev, [versionId]: trimmed };
    });
    setVersionCommentTarget(null);
  }, []);

  const handleDeleteVersionComment = useCallback((versionId) => {
    setVersionComments((prev) => {
      if (!prev[versionId]) return prev;
      const next = { ...prev };
      delete next[versionId];
      return next;
    });
  }, []);

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

  // Release notes (mock)
  const [releaseNotes, setReleaseNotes] = useState(() => INITIAL_RELEASE_NOTES);
  const [releaseNoteModalOpen, setReleaseNoteModalOpen] = useState(false);
  const [editingReleaseNote, setEditingReleaseNote] = useState(null);
  const [selectedReleaseNoteId, setSelectedReleaseNoteId] = useState(null);

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
  const [formulaDraft, setFormulaDraft] = useState({ name: "", hyperoptType: "Brute Force", type: "Score", subType: "Intermediate score", formula: "" });
  const handleOpenAddFormula = useCallback(() => {
    setFormulaEditingId(null);
    setFormulaDraft({ name: "", hyperoptType: "Brute Force", type: "Score", subType: "Intermediate score", formula: "" });
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
      if (
        strategyTagFilter.length > 0 &&
        !(strategy.tagIds || []).some((tagId) => strategyTagFilter.includes(tagId))
      ) {
        return false;
      }
      return true;
    });
  }, [strategies, filterName, filterOwner, filterStatus, strategyTagFilter]);

  const strategyAvailableTagIds = useMemo(
    () => getAvailableTagIdsForFilter(strategies, tagsRegistry, currentUserRole, MOCK_CURRENT_USER.id),
    [strategies, tagsRegistry, currentUserRole],
  );
  const activeStrategyTagNames = useMemo(
    () => resolveTagNames(strategyTagFilter, tagsRegistry),
    [strategyTagFilter, tagsRegistry],
  );

  const filteredPageIndicators = useMemo(() => {
    if (indicatorTagFilter.length === 0) return pageIndicators;
    return pageIndicators.filter((ind) =>
      (ind.tagIds || []).some((tagId) => indicatorTagFilter.includes(tagId)),
    );
  }, [pageIndicators, indicatorTagFilter]);

  const indicatorAvailableTagIds = useMemo(
    () => getAvailableTagIdsForFilter(pageIndicators, tagsRegistry, currentUserRole, MOCK_CURRENT_USER.id),
    [pageIndicators, tagsRegistry, currentUserRole],
  );
  const activeIndicatorTagNames = useMemo(
    () => resolveTagNames(indicatorTagFilter, tagsRegistry),
    [indicatorTagFilter, tagsRegistry],
  );

  const indicatorTagIdsByKey = useMemo(
    () => buildIndicatorTagIdsByKey(pageIndicators),
    [pageIndicators],
  );
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
      {
        id: Date.now(),
        catalogKey: payload.catalogKey || payload.name,
        name: payload.name,
        description: payload.description,
        type: payload.group,
        indicatorType: "System",
        status: "Active",
        createdAt: new Date().toISOString().slice(0, 10),
        tagIds: [],
      },
    ]);
    setShowAddIndicatorPage(false);
  }, []);  const handleIndicatorArchiveOrActivate = useCallback((ind) => {
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

  const handleSectionChange = useCallback((section) => {
    // Backtesting stays disabled; Strategies and Users are available
    if (section === "Backtesting") return;
    setActiveSection(section);
    setSelected(null);
    if (section !== "Mini Backtest") {
      setGlobalMiniBacktestDetailId(null);
    }
  }, []);

  const handleFeatureFlagChange = useCallback((key, value) => {
    setFeatureFlag(key, value);
    if (key === "miniBacktest") setMiniBacktestEnabled(value);
    if (key === "formulas") setFormulasEnabled(value);
  }, []);

  const headerFeatureFlags = useMemo(
    () => ({ miniBacktest: miniBacktestEnabled, formulas: formulasEnabled }),
    [miniBacktestEnabled, formulasEnabled],
  );

  useEffect(() => {
    if (!formulasEnabled && activeSection === "Settings" && settingsSubSection === "formulas") {
      setSettingsSubSection("indicators");
    }
  }, [formulasEnabled, activeSection, settingsSubSection]);

  useEffect(() => {
    if (!miniBacktestEnabled && activeSection === "Mini Backtest") {
      setActiveSection("Strategies");
      setGlobalMiniBacktestDetailId(null);
    }
  }, [miniBacktestEnabled, activeSection]);

  useEffect(() => {
    if (!miniBacktestEnabled && activeStrategyTab === "miniBacktest") {
      setActiveStrategyTab("builder");
      setSelectedMiniBacktestId(null);
    }
  }, [miniBacktestEnabled, activeStrategyTab]);

  const handleOpenReleaseNotes = useCallback(() => {
    setActiveSection("ReleaseNotes");
    setSelected(null);
  }, []);

  const handleOpenAddReleaseNote = useCallback(() => {
    setEditingReleaseNote(null);
    setReleaseNoteModalOpen(true);
  }, []);

  const handleEditReleaseNote = useCallback((note) => {
    setEditingReleaseNote(note);
    setReleaseNoteModalOpen(true);
  }, []);

  const handleSaveReleaseNote = useCallback(
    (draft) => {
      if (editingReleaseNote) {
        setReleaseNotes((prev) =>
          prev.map((n) =>
            n.id === editingReleaseNote.id
              ? { ...n, title: draft.title, releasedAt: draft.releasedAt, body: draft.body }
              : n,
          ),
        );
      } else {
        const id = `rn-${Date.now()}`;
        setReleaseNotes((prev) => [
          {
            id,
            title: draft.title,
            releasedAt: draft.releasedAt,
            body: draft.body,
            createdAt: new Date().toISOString(),
          },
          ...prev,
        ]);
        setSelectedReleaseNoteId(id);
      }
      setEditingReleaseNote(null);
    },
    [editingReleaseNote],
  );

  const handleSelectVersion = useCallback(
    (strategyId, versionId) => {
      setSelected({ strategyId, versionId });
    },
    [],
  );

  const handleOpenListVersionTree = useCallback((strategy) => {
    setVersionTreeListStrategy({ id: strategy.id, name: strategy.name });
  }, []);

  const handleListVersionTreeNodeSelect = useCallback(
    (versionId) => {
      const target = getVersionById(listStageVersions, versionId);
      if (!target || !versionTreeListStrategy) return;

      const strategy = strategies.find((s) => s.id === versionTreeListStrategy.id);
      const flatVersion = strategy?.versions[0];
      if (flatVersion) {
        handleSelectVersion(versionTreeListStrategy.id, flatVersion.id);
        setBuilderStage(STAGE_TYPE_TO_ID[target.stageType] ?? 1);
      }
      setVersionTreeListStrategy(null);
    },
    [listStageVersions, versionTreeListStrategy, strategies, handleSelectVersion],
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

  return (
    <div className={cx("min-h-screen", ui.page, "flex flex-col")}>
      <HeaderProd
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
          formulasEnabled={formulasEnabled}
          featureFlags={headerFeatureFlags}
          onFeatureFlagChange={handleFeatureFlagChange}
          releaseNotesActive={activeSection === "ReleaseNotes"}
          onOpenReleaseNotes={handleOpenReleaseNotes}
      />

      <main className="flex-1 overflow-visible p-6">
        {!(activeSection === "Strategies" && selectedStrategy) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-[16px] font-semibold text-[#f5f5f5] flex items-center gap-2">
              {activeSection === "Settings"
                ? `${activeSection} · ${settingsSubSection === "indicators" ? "Indicators" : "Formulas"}`
                : activeSection === "ReleaseNotes"
                ? "Release Notes"
                : activeSection}
              {activeSection === "Tags" && tagsPageCount != null && (
                <span className="rounded-md border border-[#303030] bg-[#0f0f0f] px-2 py-0.5 text-[10px] font-normal text-[#8c8c8c] whitespace-nowrap">
                  {tagsPageCount.shown}
                  {tagsPageCount.shown !== tagsPageCount.total ? ` / ${tagsPageCount.total}` : ""} tags
                </span>
              )}
            </h1>
            <p className={cx("mt-1 text-[12px]", ui.textMuted)}>
              {activeSection === "Users"
                ? "Manage application users (mock data only)."
                : activeSection === "Mini Backtest"
                ? "All mini backtest runs across strategies."
                : activeSection === "Tags"
                ? "View and manage tags and links to related objects (mock only)."
                : activeSection === "ReleaseNotes"
                ? "Product updates and changelog (mock only)."
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
          {formulasEnabled && activeSection === "Settings" && settingsSubSection === "formulas" && (
            <button onClick={handleOpenAddFormula} className={ui.btnPrimary}>
              Add Formula
            </button>
          )}
          {activeSection === "ReleaseNotes" && (
            <button onClick={handleOpenAddReleaseNote} className={ui.btnPrimary}>
              Add notes
            </button>
          )}
        </div>
        )}

        {/* Strategies list */}
        {activeSection === "Strategies" && !selectedStrategy && (
          <div className={cx(ui.radius, ui.panel, "overflow-hidden")}>
            <div className={cx("flex items-center gap-3 px-4 py-3", ui.panelMuted, "border-0 border-b", ui.divider)}>
              <div className={cx("text-[12px]", ui.textSubtle)}>
                {strategies.length} strategies
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

                <div className="relative" ref={strategyTagFilterRef}>
                  <button
                    type="button"
                    onClick={() => setStrategyTagFilterOpen((prev) => !prev)}
                    className={cx(
                      ui.input,
                      "h-8 min-w-[160px] px-2.5 text-[12px] inline-flex items-center justify-between gap-2",
                    )}
                    aria-expanded={strategyTagFilterOpen}
                  >
                    <span className="truncate text-left">
                      {activeStrategyTagNames.length === 0
                        ? "Tags: All"
                        : `Tags: ${activeStrategyTagNames.join(", ")}`}
                    </span>
                    <span className="text-[#8c8c8c]">{strategyTagFilterOpen ? "▲" : "▼"}</span>
                  </button>
                  {strategyTagFilterOpen && (
                    <div className="absolute right-0 z-30 mt-1 w-[220px] rounded-md border border-[#303030] bg-[#0f0f0f] shadow-lg p-1.5 space-y-1">
                      <button
                        type="button"
                        onClick={() => setStrategyTagFilter([])}
                        className="w-full h-7 px-2 rounded text-left text-[11px] text-[#d9d9d9] hover:bg-[#1a1a1a]"
                      >
                        All
                      </button>
                      {strategyAvailableTagIds.map((tagId) => {
                        const tagName = tagsRegistry.find((tag) => tag.id === tagId)?.name || tagId;
                        const checked = strategyTagFilter.includes(tagId);
                        return (
                          <label
                            key={tagId}
                            className="flex items-center gap-2 h-7 px-2 rounded text-[11px] text-[#d9d9d9] hover:bg-[#1a1a1a] cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() =>
                                setStrategyTagFilter((prev) =>
                                  prev.includes(tagId)
                                    ? prev.filter((item) => item !== tagId)
                                    : [...prev, tagId],
                                )
                              }
                              className="h-3 w-3 accent-emerald-500"
                            />
                            <span className="truncate">{tagName}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <table className="w-full border-collapse text-[12px]">
              <thead className="bg-[#1f1f1f] text-left text-[12px] text-[#8c8c8c]">
                <tr>
                  <th className="px-4 py-3 border-b border-[#303030] font-medium">Strategy name</th>
                  <th className="px-2 py-3 border-b border-[#303030] font-medium">Description</th>
                  <th className="px-2 py-3 border-b border-[#303030] font-medium">Owner</th>
                  <th className="px-2 py-3 border-b border-[#303030] font-medium">Tags</th>
                  <th className="px-2 py-3 border-b border-[#303030] font-medium">Created at</th>
                  <th className="px-2 py-3 border-b border-[#303030] font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredStrategies.map((strategy) => (
                  <StrategyRow
                    key={strategy.id}
                    strategy={strategy}
                    onSelectVersion={handleSelectVersion}
                    onOpenVersionTree={handleOpenListVersionTree}
                    tagsRegistry={tagsRegistry}
                    onAddTag={openStrategyTagsModal}
                  />
                ))}
              </tbody>
            </table>
            <StageVersionTreeModal
              open={versionTreeListStrategy != null}
              onClose={() => setVersionTreeListStrategy(null)}
              versions={listStageVersions}
              strategyName={versionTreeListStrategy?.name ?? ""}
              selectedByStage={listVersionByStage}
              commentsByVersionId={versionComments}
              onSelectNode={handleListVersionTreeNodeSelect}
            />
          </div>
        )}

        {/* Strategy detail */}
        {activeSection === "Strategies" && selectedStrategy && (
          <>
            <div className="mb-6 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-[16px] font-semibold text-[#f5f5f5] truncate">{selectedStrategy.s.name}</h2>
                </div>

                <p className={cx("mt-1 text-[12px]", ui.textMuted)}>
                  Owner: <span className="text-[#faf7fd]">{selectedStrategy.s.owner}</span>
                </p>

                <div className={cx("mt-1 flex items-start gap-2 text-[12px]", ui.textMuted)}>
                  <div className="min-w-0">
                    Description: <span className="text-[#faf7fd]">{selectedStrategy.v.description || "—"}</span>
                  </div>
                  <button
                    onClick={openEditDescription}
                    className={cx(
                      "inline-flex h-5 w-5 items-center justify-center rounded border text-[#a6a6a6] hover:bg-secondary border-[rgba(60,40,80,0.5)] bg-[#170f29]",
                    )}
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
                  <div
                    className={cx(
                      "absolute right-0 top-full z-50 mt-1 min-w-[180px] rounded-md border py-1 shadow-lg border-[rgba(60,40,80,0.5)] bg-[#170f29]",
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => { alert("Create new version (mock)"); setActionsDropdownOpen(false); }}
                      className="block w-full px-3 py-2 text-left text-[12px] text-[#d9d9d9] hover:bg-secondary"
                    >
                      Create new version
                    </button>
                    <button
                      type="button"
                      onClick={() => { alert("Duplicate strategy (mock)"); setActionsDropdownOpen(false); }}
                      className="block w-full px-3 py-2 text-left text-[12px] text-[#d9d9d9] hover:bg-secondary"
                    >
                      Duplicate strategy
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Strategy tabs */}
            <div className="mb-4 flex flex-wrap justify-start gap-2 border-b border-[rgba(60,40,80,0.35)] pb-3">
              <button
                type="button"
                onClick={() => setActiveStrategyTab("builder")}
                className={cx(
                  "inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[12px] font-medium border transition-colors",
                  activeStrategyTab === "builder"
                    ? "bg-violet-500/15 border-violet-500/40 text-violet-200"
                    : "border-[rgba(60,40,80,0.35)] text-[#8c8c8c] hover:text-[#d9d9d9]",
                )}
              >
                <Blocks className="h-3.5 w-3.5 shrink-0" aria-hidden />
                Builder
              </button>
              {miniBacktestEnabled ? (
              <button
                type="button"
                onClick={() => setActiveStrategyTab("miniBacktest")}
                className={cx(
                  "inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[12px] font-medium border transition-colors",
                  activeStrategyTab === "miniBacktest"
                    ? "bg-violet-500/15 border-violet-500/40 text-violet-200"
                    : "border-[rgba(60,40,80,0.35)] text-[#8c8c8c] hover:text-[#d9d9d9]",
                )}
              >
                <FlaskConical className="h-3.5 w-3.5 shrink-0" aria-hidden />
                Mini Backtest
                {miniBacktestResults.length > 0 && (
                  <span className="rounded-full bg-violet-500/20 text-violet-300 text-[9px] px-1.5 py-0.5">
                    {miniBacktestResults.length}
                  </span>
                )}
              </button>
              ) : null}
            </div>

            {/* Builder tab — keep mounted so indicators / heatmap / best epochs state persists */}
            <div className={activeStrategyTab !== "builder" ? "hidden" : undefined}>
              <BuilderStepper
                strategyId={selectedStrategy.s.id}
                strategyName={selectedStrategy.s.name}
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
              versionComments={versionComments}
              onOpenVersionComment={handleOpenVersionComment}
              onDeleteVersionComment={handleDeleteVersionComment}
              miniBacktestEnabled={miniBacktestEnabled}
              onMiniBacktestEnabledChange={(v) => {
                const value = typeof v === "function" ? v(miniBacktestEnabled) : v;
                setFeatureFlag("miniBacktest", value);
                setMiniBacktestEnabled(value);
              }}
              miniBacktestResults={miniBacktestResults}
              miniBacktestExpandedEpochId={miniBacktestExpandedEpochId}
              onMiniBacktestExpandedEpochIdChange={setMiniBacktestExpandedEpochId}
              onSaveMiniBacktestResult={handleSaveMiniBacktestResult}
              onRemoveMiniBacktestResult={handleRemoveMiniBacktestResult}
              onOpenMiniBacktestModal={(epoch, stageId, stageVersion, launchContext) => {
                setMiniBacktestModalEpoch(epoch);
                setMiniBacktestLaunchStageId(stageId ?? 1);
                setMiniBacktestLaunchStageVersion(stageVersion ?? null);
                setMiniBacktestLaunchContext(launchContext ?? null);
                setMiniBacktestModalOpen(true);
              }}
              onCloseMiniBacktestModal={() => {
                setMiniBacktestModalOpen(false);
                setMiniBacktestModalEpoch(null);
                setMiniBacktestLaunchStageVersion(null);
                setMiniBacktestLaunchContext(null);
              }}
              tagsRegistry={tagsRegistry}
              setTagsRegistry={setTagsRegistry}
              tagRelations={tagRelations}
              setTagRelations={setTagRelations}
              hyperoptResultsRows={hyperoptResultsRows}
              setHyperoptResultsRows={setHyperoptResultsRows}
              currentUserRole={currentUserRole}
              currentUserId={MOCK_CURRENT_USER.id}
              hyperoptTagFilter={hyperoptTagFilter}
              setHyperoptTagFilter={setHyperoptTagFilter}
              hyperoptTagsModalRowId={hyperoptTagsModalRowId}
              hyperoptTagsDraft={hyperoptTagsDraft}
              setHyperoptTagsDraft={setHyperoptTagsDraft}
              openHyperoptTagsModal={openHyperoptTagsModal}
              closeHyperoptTagsModal={closeHyperoptTagsModal}
              commitHyperoptTagsDraftTag={commitHyperoptTagsDraftTag}
              saveHyperoptTagsModal={saveHyperoptTagsModal}
              indicatorTagIdsByKey={indicatorTagIdsByKey}
              onAddIndicatorTag={openIndicatorTagsModal}
              />
            </div>
            {/* Mini Backtest tab */}
            {miniBacktestEnabled ? (
            <div className={activeStrategyTab !== "miniBacktest" ? "hidden" : undefined}>
              <MiniBacktestPage
                results={miniBacktestResults}
                selectedId={selectedMiniBacktestId}
                onSelectId={setSelectedMiniBacktestId}
                onDelete={handleRemoveMiniBacktestResult}
                onEditTags={openMiniBacktestTagsModal}
                tagsRegistry={tagsRegistry}
              />
            </div>
            ) : null}
          </>
        )}

        {miniBacktestEnabled && activeSection === "Mini Backtest" && (
          <MiniBacktestGlobalPage
            results={allMiniBacktestResults}
            detailId={globalMiniBacktestDetailId}
            onDetailIdChange={setGlobalMiniBacktestDetailId}
            onDelete={handleRemoveMiniBacktestResult}
            onOpenStrategy={handleOpenMiniBacktestStrategy}
            onEditTags={openMiniBacktestTagsModal}
            tagsRegistry={tagsRegistry}
          />
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

        {/* Tags page */}
        {activeSection === "Tags" && (
          <TagsPage
            currentUserRole={currentUserRole}
            currentUserId={MOCK_CURRENT_USER.id}
            tagsRegistry={tagsRegistry}
            setTagsRegistry={setTagsRegistry}
            tagRelations={tagRelations}
            setTagRelations={setTagRelations}
            hyperoptResultsRows={hyperoptResultsRows}
            setHyperoptResultsRows={setHyperoptResultsRows}
            strategies={strategies}
            setStrategies={setStrategies}
            pageIndicators={pageIndicators}
            setPageIndicators={setPageIndicators}
            miniBacktestResults={allMiniBacktestResults}
            setMiniBacktestResults={setAllMiniBacktestResults}
            onTagIdsRemoved={handleTagIdsRemoved}
            onCountChange={handleTagsPageCountChange}
          />
        )}
        {/* Release notes page */}
        {activeSection === "ReleaseNotes" && (
          <ReleaseNotesPage
            notes={releaseNotes}
            selectedId={selectedReleaseNoteId}
            onSelectId={setSelectedReleaseNoteId}
            onEditNote={handleEditReleaseNote}
          />
        )}

        {/* Indicators page (mock) */}
        {(activeSection === "Settings" && settingsSubSection === "indicators") && (
          <div className={cx(ui.radius, ui.panel, "overflow-hidden")}>
            <div className={cx("flex items-center justify-between gap-3 px-4 py-3", ui.panelMuted, "border-0 border-b", ui.divider)}>
              <div>
                <div className="text-[12px] font-medium text-[#d9d9d9]">Indicators</div>
                <div className={cx("text-[11px]", ui.textMuted)}>Indicator library (mock).</div>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative" ref={indicatorTagFilterRef}>
                  <button
                    type="button"
                    onClick={() => setIndicatorTagFilterOpen((prev) => !prev)}
                    className={cx(
                      ui.input,
                      "h-8 min-w-[160px] px-2.5 text-[12px] inline-flex items-center justify-between gap-2",
                    )}
                    aria-expanded={indicatorTagFilterOpen}
                  >
                    <span className="truncate text-left">
                      {activeIndicatorTagNames.length === 0
                        ? "Tags: All"
                        : `Tags: ${activeIndicatorTagNames.join(", ")}`}
                    </span>
                    <span className="text-[#8c8c8c]">{indicatorTagFilterOpen ? "▲" : "▼"}</span>
                  </button>
                  {indicatorTagFilterOpen && (
                    <div className="absolute right-0 z-30 mt-1 w-[220px] rounded-md border border-[#303030] bg-[#0f0f0f] shadow-lg p-1.5 space-y-1">
                      <button
                        type="button"
                        onClick={() => setIndicatorTagFilter([])}
                        className="w-full h-7 px-2 rounded text-left text-[11px] text-[#d9d9d9] hover:bg-[#1a1a1a]"
                      >
                        All
                      </button>
                      {indicatorAvailableTagIds.map((tagId) => {
                        const tagName = tagsRegistry.find((tag) => tag.id === tagId)?.name || tagId;
                        const checked = indicatorTagFilter.includes(tagId);
                        return (
                          <label
                            key={tagId}
                            className="flex items-center gap-2 h-7 px-2 rounded text-[11px] text-[#d9d9d9] hover:bg-[#1a1a1a] cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() =>
                                setIndicatorTagFilter((prev) =>
                                  prev.includes(tagId)
                                    ? prev.filter((item) => item !== tagId)
                                    : [...prev, tagId],
                                )
                              }
                              className="h-3 w-3 accent-emerald-500"
                            />
                            <span className="truncate">{tagName}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
                <span className="rounded-md border border-[#303030] bg-[#0f0f0f] px-2 py-0.5 text-[10px] text-[#8c8c8c]">
                  {filteredPageIndicators.length} indicators
                </span>
              </div>
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
                    <th className="px-2 py-3 border-b border-[#303030] font-medium">Tags</th>
                    <th className="px-2 py-3 border-b border-[#303030] font-medium">Created At</th>
                    <th className="px-2 py-3 border-b border-[#303030] font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPageIndicators.map((ind) => {
                    const tagNames = resolveTagNames(ind.tagIds, tagsRegistry);
                    return (
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
                        <td
                          className="px-2 py-2 border-b border-[#303030] max-w-[180px] align-top"
                          title={tagNames.length ? tagNames.join(", ") : undefined}
                        >
                          {tagNames.length ? (
                            <div className="flex flex-wrap gap-1">
                              {tagNames.slice(0, 3).map((t) => (
                                <span
                                  key={t}
                                  className="rounded border border-[#303030] bg-[#0f0f0f] px-1.5 py-0.5 text-[10px] text-[#d9d9d9]"
                                >
                                  {t}
                                </span>
                              ))}
                              {tagNames.length > 3 && (
                                <span className="self-center text-[10px] text-[#8c8c8c]">
                                  +{tagNames.length - 3}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-[#8c8c8c]">—</span>
                          )}
                        </td>
                        <td className="px-2 py-2 border-b border-[#303030] text-[#a6a6a6]">{ind.createdAt}</td>
                        <td className="px-2 py-2 border-b border-[#303030]">
                          <IndicatorActionsMenu
                            indicator={ind}
                            onArchiveOrActivate={handleIndicatorArchiveOrActivate}
                            onUpdate={handleIndicatorUpdate}
                            onAddTag={openIndicatorTagsModal}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Formulas page (Settings → Formulas) */}
        {formulasEnabled && activeSection === "Settings" && settingsSubSection === "formulas" && (
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

      <StageVersionCommentModal
        open={versionCommentTarget != null}
        target={versionCommentTarget}
        initialComment={
          versionCommentTarget ? versionComments[versionCommentTarget.id] ?? "" : ""
        }
        onClose={() => setVersionCommentTarget(null)}
        onSave={handleSaveVersionComment}
      />

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

      <ReleaseNoteModal
        open={releaseNoteModalOpen}
        onOpenChange={(open) => {
          setReleaseNoteModalOpen(open);
          if (!open) setEditingReleaseNote(null);
        }}
        editingNote={editingReleaseNote}
        onSave={handleSaveReleaseNote}
      />

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

      {/* Mini Backtest Modal (lazy-loaded) */}
      {miniBacktestModalOpen && miniBacktestModalEpoch && (
        <Suspense fallback={<LoadingFallback />}>
        <MiniBacktestModal
          epoch={miniBacktestModalEpoch}
          existingResult={
            miniBacktestResults.find(
              (r) =>
                r.epochId === miniBacktestModalEpoch.id &&
                r.id === selectedMiniBacktestId,
            ) ??
            [...miniBacktestResults]
              .filter((r) => r.epochId === miniBacktestModalEpoch.id)
              .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))[0]
          }
          open={miniBacktestModalOpen}
          launchStageId={miniBacktestLaunchStageId}
          launchStageVersion={miniBacktestLaunchStageVersion}
          launchContext={miniBacktestLaunchContext}
          onClose={() => {
            setMiniBacktestModalOpen(false);
            setMiniBacktestModalEpoch(null);
            setMiniBacktestLaunchStageVersion(null);
            setMiniBacktestLaunchContext(null);
          }}
          onSaveResult={handleSaveMiniBacktestResult}
        />
        </Suspense>
      )}

      <TagsEditModal
        open={Boolean(miniBacktestTagsModalEntryId)}
        draft={miniBacktestTagsDraft}
        tagsRegistry={tagsRegistry}
        onDraftChange={setMiniBacktestTagsDraft}
        onCommitTag={commitMiniBacktestTagsDraftTag}
        onClose={closeMiniBacktestTagsModal}
        onSave={saveMiniBacktestTagsModal}
      />

      <TagsEditModal
        open={strategyTagsModalId != null}
        draft={strategyTagsDraft}
        tagsRegistry={tagsRegistry}
        onDraftChange={setStrategyTagsDraft}
        onCommitTag={commitStrategyTagsDraftTag}
        onClose={closeStrategyTagsModal}
        onSave={saveStrategyTagsModal}
      />

      <TagsEditModal
        open={Boolean(indicatorTagsModalKey)}
        draft={indicatorTagsDraft}
        tagsRegistry={tagsRegistry}
        onDraftChange={setIndicatorTagsDraft}
        onCommitTag={commitIndicatorTagsDraftTag}
        onClose={closeIndicatorTagsModal}
        onSave={saveIndicatorTagsModal}
      />

    </div>
  );
}

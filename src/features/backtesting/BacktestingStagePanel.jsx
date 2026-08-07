import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
import { cx, ui } from "@/constants/ui";
import { BuilderSectionShell } from "@/features/builder/layout/BuilderSectionShell";
import { useCollapsedSections } from "@/features/builder/hooks/useBuilderStageState";
import {
  BT_ANALYTICS_STATUS,
  BT_CHILD_TYPE,
  BT_COPY,
} from "@/constants/backtesting";
import { useBacktestingState } from "./hooks/useBacktestingState";
import { useBacktestTreeState } from "./hooks/useBacktestTreeState";
import { deriveMiniOptions } from "./utils/miniSource";
import { resolveEpochStageConfig } from "./utils/resolveEpochStageConfig";
import { BacktestTree } from "./components/BacktestTree";
import { ConfirmModal } from "./components/ConfirmModal";
import { EpochContextPanel } from "./components/EpochContextPanel";
import { RunResultPreviewModal } from "./components/RunResultPreviewModal";
import { AnalyticsDraftModal } from "./components/forms/AnalyticsDraftModal";
import { CreateAnalyticsModal } from "./components/forms/CreateAnalyticsModal";
import { RunBacktestForm } from "./components/forms/RunBacktestForm";
import { BacktestingInfoModal } from "./components/BacktestingInfoModal";
import { BacktestingRunParamsModal } from "./components/BacktestingRunParamsModal";
import { ShuffleInfoModal } from "./components/ShuffleInfoModal";
import { SyntheticInfoModal } from "./components/SyntheticInfoModal";
import { RunShufflerModal } from "./components/forms/RunShufflerModal";
import { RunSyntheticModal } from "./components/forms/RunSyntheticModal";

const CLOSED = { kind: null };

/**
 * Stage 5 — Backtesting. Root screen: epoch context + inline run form, the
 * hierarchical table of branches, and child-run modals.
 *
 * `favoriteEpochs` are the epochs promoted out of Stage 4; the stage never
 * mixes data across epochs. Stages 1–3 indicators come from frozen snapshots
 * on the risk favorite or from the live source-chain favorites.
 */
export const BacktestingStagePanel = memo(function BacktestingStagePanel({
  strategyName,
  favoriteEpochs = [],
  signalBestResults = [],
  entryBestResults = [],
  exitBestResults = [],
  entryBestSourceId = "",
  exitBestSourceId = "",
  riskBestSourceId = "",
  miniBacktestResults = [],
  currentUser = "quant",
  onOpenMiniBacktest,
}) {
  const bt = useBacktestingState({ currentUser });
  const tree = useBacktestTreeState();
  // Stage 5 owns its own section-collapse state: its section numbering (1-2) is
  // independent from the builder sections of stages 1-4.
  const { collapsedSections, toggleSection } = useCollapsedSections();

  const [selectedEpochId, setSelectedEpochId] = useState(
    () => favoriteEpochs[0]?.id ?? null,
  );

  useEffect(() => {
    if (!favoriteEpochs.length) {
      setSelectedEpochId(null);
      return;
    }
    const exists = favoriteEpochs.some((e) => String(e.id) === String(selectedEpochId));
    if (!exists) setSelectedEpochId(favoriteEpochs[0].id);
  }, [favoriteEpochs, selectedEpochId]);

  const epoch = useMemo(
    () => favoriteEpochs.find((e) => String(e.id) === String(selectedEpochId)) || null,
    [favoriteEpochs, selectedEpochId],
  );

  const stageConfig = useMemo(
    () =>
      resolveEpochStageConfig(epoch, {
        signalBestResults,
        entryBestResults,
        exitBestResults,
        entryBestSourceId,
        exitBestSourceId,
        riskBestSourceId,
      }),
    [
      epoch,
      signalBestResults,
      entryBestResults,
      exitBestResults,
      entryBestSourceId,
      exitBestSourceId,
      riskBestSourceId,
    ],
  );

  const runs = useMemo(
    () => (selectedEpochId ? bt.getRuns(selectedEpochId) : []),
    [bt, selectedEpochId],
  );
  const savedCombos = useMemo(
    () => (selectedEpochId ? bt.savedCombinations(selectedEpochId) : new Set()),
    [bt, selectedEpochId],
  );

  const stageStatusByEpoch = useMemo(() => {
    const out = {};
    favoriteEpochs.forEach((e) => {
      out[e.id] = bt.getStageStatus(e.id);
    });
    return out;
  }, [favoriteEpochs, bt]);

  const miniOptions = useMemo(
    () => (selectedEpochId ? deriveMiniOptions(miniBacktestResults, selectedEpochId) : []),
    [miniBacktestResults, selectedEpochId],
  );

  /* ------------------------------------------------------------- modals */

  const [modal, setModal] = useState(CLOSED);
  const closeModal = useCallback(() => setModal(CLOSED), []);

  const [confirm, setConfirm] = useState(null);

  // Keep the open analytics modal in sync with the store after every mutation.
  const liveAnalytics = useMemo(() => {
    if (modal.kind !== "analytics" || !modal.analyticsId) return null;
    const parent = runs.find((r) => r.id === modal.backtestId);
    return parent?.analytics?.find((a) => a.id === modal.analyticsId) || null;
  }, [modal, runs]);

  const liveParent = useMemo(
    () => runs.find((r) => r.id === modal.backtestId) || null,
    [runs, modal.backtestId],
  );

  /* ------------------------------------------------------------ handlers */

  const handleRunBacktest = ({ params, mini }) => {
    const id = bt.runBacktest(selectedEpochId, {
      epochLabel: epoch?.label ?? null,
      params,
      mini,
    });
    tree.expandRun(id);
  };

  const handleRunShuffler = (config) => {
    const parent = liveParent;
    if (!parent) return;
    bt.runShuffler(selectedEpochId, parent.id, config, buildInherited(parent), epoch?.label);
  };

  const handleRunSynthetic = (config) => {
    const parent = liveParent;
    if (!parent) return;
    bt.runSynthetic(selectedEpochId, parent.id, config, buildInherited(parent), epoch?.label);
  };

  const confirmDeleteBacktest = (run) => {
    const saved = (run.analytics || []).filter((a) => a.status === BT_ANALYTICS_STATUS.SAVED);
    const drafts = (run.analytics || []).filter((a) => a.status === BT_ANALYTICS_STATUS.DRAFT);
    const shN = (run.shufflerRuns || []).length;
    const syN = (run.syntheticRuns || []).length;
    setConfirm({
      title: `Delete backtest ${run.id}?`,
      description: "Level 0 backtest run and its branch",
      consequences: [
        shN || syN
          ? `Removes ${shN} Shuffler and ${syN} Synthetic child run(s).`
          : "No child Shuffler / Synthetic runs.",
        drafts.length
          ? `Draft analytics ${drafts.map((a) => a.id).join(", ")} are removed.`
          : "No draft analytics.",
        saved.length
          ? `Saved analytics ${saved.map((a) => a.id).join(", ")} move to the archive (frozen matrix kept).`
          : "No saved analytics to archive.",
      ],
      confirmLabel: "Delete backtest",
      onConfirm: () => bt.deleteBacktest(selectedEpochId, run.id),
    });
  };

  const confirmDeleteChild = (type, child, parent) => {
    const field = type === BT_CHILD_TYPE.SHUFFLER ? "shufflerRunId" : "syntheticRunId";
    const affectedDrafts = (parent.analytics || []).filter(
      (a) => a.status === BT_ANALYTICS_STATUS.DRAFT && a[field] === child.id,
    );
    const inSaved = (parent.analytics || []).filter(
      (a) => a.status === BT_ANALYTICS_STATUS.SAVED && a[field] === child.id,
    );
    setConfirm({
      title: `Delete run ${child.id}?`,
      description:
        type === BT_CHILD_TYPE.SHUFFLER ? "Shuffler run" : "Synthetic backtest run",
      consequences: [
        affectedDrafts.length
          ? `Draft analytics ${affectedDrafts.map((a) => a.id).join(", ")}: this line becomes “not selected”.`
          : "No draft analytics reference this run.",
        inSaved.length
          ? `Saved analytics ${inSaved
              .map((a) => a.id)
              .join(", ")} keep their frozen matrix and are not affected.`
          : "No saved analytics reference this run.",
      ],
      confirmLabel: "Delete run",
      onConfirm: () => bt.deleteChildRun(selectedEpochId, parent.id, type, child.id),
    });
  };

  const confirmDeleteAnalytics = (item, parent) => {
    const saved = item.status === BT_ANALYTICS_STATUS.SAVED;
    setConfirm({
      title: `Delete analytics ${item.id}?`,
      description: saved ? "Saved analytics — a frozen record" : "Draft analytics",
      consequences: saved
        ? [
            "The frozen matrix, integrity snapshot, author and note are removed.",
            "In production this is a server DELETE with a permission check.",
          ]
        : ["Nothing else is affected — the runs themselves stay in the branch."],
      warning:
        saved && item.promoted
          ? "This is the promoted analytics — the epoch is left without a final result."
          : null,
      confirmLabel: "Delete analytics",
      onConfirm: () => {
        bt.deleteAnalytics(selectedEpochId, parent.id, item.id);
        if (modal.kind === "analytics" && modal.analyticsId === item.id) closeModal();
      },
    });
  };

  /* -------------------------------------------------------------- render */

  if (!favoriteEpochs.length) {
    return (
      <div className={cx(ui.radius, ui.panelMuted, "px-4 py-6 text-[12px]", ui.textSubtle)}>
        {BT_COPY.noEpoch}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <BuilderSectionShell
        sectionNum={1}
        title="Backtest parameters"
        subtitle="Backtest configuration and parameters"
        collapsed={collapsedSections?.has(1)}
        onToggle={() => toggleSection?.(1)}
      >
        <div className="space-y-5">
          <EpochContextPanel
            epochs={favoriteEpochs}
            selectedEpochId={selectedEpochId}
            onSelectEpoch={setSelectedEpochId}
            stageStatusByEpoch={stageStatusByEpoch}
            stageConfig={stageConfig}
          />
          {epoch ? (
            <div className={cx(ui.radius, "border border-[rgba(60,40,80,0.35)] bg-[#120a20] p-3")}>
              <RunBacktestForm
                active={Boolean(selectedEpochId)}
                epoch={epoch}
                strategyName={strategyName}
                miniOptions={miniOptions}
                variant="inline"
                onSubmit={handleRunBacktest}
                onRunMiniBacktest={onOpenMiniBacktest}
              />
            </div>
          ) : null}
        </div>
      </BuilderSectionShell>

      <BuilderSectionShell
        sectionNum={2}
        title="Backtest runs"
        subtitle="Backtest → Shuffler / Synthetic / Validation analytics"
        collapsed={collapsedSections?.has(2)}
        onToggle={() => toggleSection?.(2)}
      >
        <div className="mb-3">
          <span className={cx("text-[10px]", ui.textSubtle)}>
            Backtest is the only root object — Shuffler, Synthetic and Analytics live inside a branch.
            Launch a run from section 1 above.
          </span>
        </div>
        <BacktestTree
          runs={runs}
          expandedRuns={tree.expandedRuns}
          onToggleRun={tree.toggleRun}
          onOpenInfo={(run) => setModal({ kind: "info", backtestId: run.id })}
          onOpenRunParams={(run) => setModal({ kind: "runParams", backtestId: run.id })}
          onRunShuffler={(run) => setModal({ kind: "runShuffler", backtestId: run.id })}
          onRunSynthetic={(run) => setModal({ kind: "runSynthetic", backtestId: run.id })}
          onCreateAnalytics={(run) => {
            const starred = (run.shufflerRuns || []).find((r) => r.selectedForValidation);
            setModal({
              kind: "createAnalytics",
              backtestId: run.id,
              shufflerRunId: starred?.id ?? null,
            });
          }}
          onDeleteBacktest={confirmDeleteBacktest}
          onOpenChildResult={(type, child) =>
            setModal({ kind: "result", resultKind: type, run: child })
          }
          onDeleteChild={confirmDeleteChild}
          onToggleShufflerForValidation={(parent, child) =>
            bt.toggleShufflerForValidation(selectedEpochId, parent.id, child.id)
          }
          onToggleSyntheticForValidation={(parent, child) =>
            bt.toggleSyntheticForValidation(selectedEpochId, parent.id, child.id)
          }
          onOpenShuffleInfo={(child, parent) =>
            setModal({ kind: "shuffleInfo", backtestId: parent.id, run: child })
          }
          onOpenShufflerParams={(child, parent) =>
            setModal({ kind: "shufflerParams", backtestId: parent.id, run: child })
          }
          onOpenSyntheticInfo={(child, parent) =>
            setModal({ kind: "syntheticInfo", backtestId: parent.id, run: child })
          }
          onOpenSyntheticParams={(child, parent) =>
            setModal({ kind: "syntheticParams", backtestId: parent.id, run: child })
          }
          onOpenAnalytics={(item, run) =>
            setModal({ kind: "analytics", analyticsId: item.id, backtestId: run.id })
          }
          onSaveAnalytics={(item, run) =>
            setModal({ kind: "analytics", analyticsId: item.id, backtestId: run.id })
          }
          onTogglePromote={(item, run) => bt.togglePromote(selectedEpochId, run.id, item.id)}
          onDeleteAnalytics={confirmDeleteAnalytics}
        />
      </BuilderSectionShell>

      {/* Modals */}
      <BacktestingRunParamsModal
        open={modal.kind === "runParams"}
        run={liveParent}
        strategyName={strategyName}
        onClose={closeModal}
      />

      <BacktestingInfoModal
        open={modal.kind === "info"}
        run={liveParent}
        onClose={closeModal}
      />

      <RunShufflerModal
        open={modal.kind === "runShuffler"}
        parentRun={liveParent}
        onClose={closeModal}
        onSubmit={handleRunShuffler}
      />

      <RunShufflerModal
        open={modal.kind === "shufflerParams"}
        parentRun={liveParent}
        snapshotRun={modal.run}
        readOnly
        onClose={closeModal}
      />

      <ShuffleInfoModal
        open={modal.kind === "shuffleInfo"}
        run={modal.run}
        onClose={closeModal}
      />

      <RunSyntheticModal
        open={modal.kind === "runSynthetic"}
        parentRun={liveParent}
        onClose={closeModal}
        onSubmit={handleRunSynthetic}
      />

      <RunSyntheticModal
        open={modal.kind === "syntheticParams"}
        parentRun={liveParent}
        snapshotRun={modal.run}
        readOnly
        onClose={closeModal}
      />

      <SyntheticInfoModal
        open={modal.kind === "syntheticInfo"}
        run={modal.run}
        parentRun={liveParent}
        onClose={closeModal}
      />

      {/* CreateAnalyticsModal — from Shuffler Create column / Level 0 Actions */}
      <CreateAnalyticsModal
        open={modal.kind === "createAnalytics"}
        parentRun={liveParent}
        initialShufflerRunId={modal.shufflerRunId || null}
        savedCombinations={savedCombos}
        onClose={closeModal}
        onSubmit={(payload) => {
          const parentId = modal.backtestId;
          const id = bt.createAnalytics(selectedEpochId, parentId, payload);
          if (id) setModal({ kind: "analytics", analyticsId: id, backtestId: parentId });
        }}
      />

      <AnalyticsDraftModal
        open={modal.kind === "analytics" && Boolean(liveAnalytics)}
        analytics={liveAnalytics}
        parentRun={liveParent}
        epoch={epoch}
        strategyName={strategyName}
        savedCombinations={savedCombos}
        onClose={closeModal}
        onChange={(patch) =>
          bt.updateAnalytics(selectedEpochId, modal.backtestId, modal.analyticsId, patch)
        }
        onSave={({ note }) =>
          bt.saveAnalytics(selectedEpochId, modal.backtestId, modal.analyticsId, { note })
        }
        onTogglePromote={() =>
          bt.togglePromote(selectedEpochId, modal.backtestId, modal.analyticsId)
        }
        onDelete={() => {
          if (liveAnalytics && liveParent) confirmDeleteAnalytics(liveAnalytics, liveParent);
        }}
      />

      <RunResultPreviewModal
        open={modal.kind === "result"}
        kind={modal.resultKind}
        run={modal.run}
        onClose={closeModal}
      />

      <ConfirmModal
        open={Boolean(confirm)}
        title={confirm?.title}
        description={confirm?.description}
        consequences={confirm?.consequences}
        warning={confirm?.warning}
        confirmLabel={confirm?.confirmLabel}
        onClose={() => setConfirm(null)}
        onConfirm={confirm?.onConfirm}
      />
    </div>
  );
});

/** Snapshot of the parent backtest handed down to a child run (read-only). */
function buildInherited(parent) {
  const p = parent.params || {};
  const streaks = parent.result?.streaks || {};
  return {
    startingCapital: p.startingCapital,
    stakeMode: p.stakeMode,
    stakeValue: p.stakeValue,
    profitReserving: p.profitReserving,
    mode: p.mode,
    leverage: p.leverage,
    exchange: p.exchange,
    pair: p.pair,
    timeframe: p.timeframe,
    feeMaker: p.fees?.maker ?? null,
    feeTaker: p.fees?.taker ?? null,
    funding: Boolean(p.fees?.funding),
    slippage: parent.result?.slippagePct ?? null,
    stopOut: false,
    trades: parent.result?.core?.trades ?? null,
    wins: streaks.wins ?? null,
    losses: streaks.losses ?? null,
    periodFrom: p.periodFrom,
    periodTo: p.periodTo,
  };
}

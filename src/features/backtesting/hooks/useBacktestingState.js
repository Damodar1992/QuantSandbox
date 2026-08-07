// Stage 5 · in-memory store for backtest branches (no backend).
//
// Layout: { [epochId]: { runs: BacktestRun[], archive: ValidationAnalytics[] } }.
// Every mutation keeps the invariants of §4: parent FKs are never rewritten,
// at most one promoted analytics per epoch, saved analytics are immutable.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BT_ANALYTICS_STATUS,
  BT_ERROR_CODES,
  BT_RUN_STATUS,
  resolveBtFees,
} from "@/constants/backtesting";
import { newBacktestId, newShufflerId, newSyntheticId, nextAnalyticsId } from "../utils/ids";
import { checkIntegrity } from "../utils/integrity";
import { buildBacktestResult, buildShufflerResult, buildSyntheticResult } from "../utils/mockResults";
import { createBacktestingSeed } from "../utils/seed";

const EMPTY_EPOCH = { runs: [], archive: [] };
const TICK_MS = 650;

function epochSlice(state, epochId) {
  return state[epochId] || EMPTY_EPOCH;
}

function withEpoch(state, epochId, updater) {
  const slice = epochSlice(state, epochId);
  const next = updater(slice);
  if (next === slice) return state;
  return { ...state, [epochId]: next };
}

function mapRuns(slice, backtestId, updater) {
  return {
    ...slice,
    runs: slice.runs.map((run) => (run.id === backtestId ? updater(run) : run)),
  };
}

function byCreatedDesc(a, b) {
  return String(b.createdAt || "").localeCompare(String(a.createdAt || ""));
}

export function useBacktestingState({ currentUser = "quant" } = {}) {
  const [state, setState] = useState(() => createBacktestingSeed());
  const timers = useRef(new Map());

  useEffect(
    () => () => {
      timers.current.forEach((id) => clearInterval(id));
      timers.current.clear();
    },
    [],
  );

  const clearTimer = useCallback((key) => {
    const id = timers.current.get(key);
    if (id) {
      clearInterval(id);
      timers.current.delete(key);
    }
  }, []);

  /* ------------------------------------------------------------- selectors */

  const getEpoch = useCallback((epochId) => epochSlice(state, epochId), [state]);

  const getRuns = useCallback(
    (epochId) => epochSlice(state, epochId).runs.slice().sort(byCreatedDesc),
    [state],
  );

  const getArchive = useCallback(
    (epochId) => epochSlice(state, epochId).archive.slice().sort(byCreatedDesc),
    [state],
  );

  /** Which analytics of the epoch is the final one (★). */
  const getPromotedAnalytics = useCallback(
    (epochId) => {
      const slice = epochSlice(state, epochId);
      for (const run of slice.runs) {
        const hit = (run.analytics || []).find((a) => a.promoted);
        if (hit) return { analytics: hit, backtestId: run.id };
      }
      return null;
    },
    [state],
  );

  /** '—' | 'In progress' | 'Final ★' — the pipeline card status (§8.6). */
  const getStageStatus = useCallback(
    (epochId) => {
      const slice = epochSlice(state, epochId);
      if (!slice.runs.length && !slice.archive.length) return "—";
      return getPromotedAnalytics(epochId) ? "Final ★" : "In progress";
    },
    [state, getPromotedAnalytics],
  );

  /* --------------------------------------------------------- backtest runs */

  const startBacktestProgress = useCallback(
    (epochId, runId) => {
      const key = `bt:${epochId}:${runId}`;
      clearTimer(key);
      const id = setInterval(() => {
        setState((prev) =>
          withEpoch(prev, epochId, (slice) =>
            mapRuns(slice, runId, (run) => {
              if (run.status !== BT_RUN_STATUS.RUNNING && run.status !== BT_RUN_STATUS.QUEUED) {
                return run;
              }
              const pct = Math.min(100, (run.progress?.pct ?? 0) + 9 + Math.round(Math.random() * 11));
              if (pct >= 100) {
                clearTimer(key);
                const done = { ...run, status: BT_RUN_STATUS.DONE, progress: { pct: 100 } };
                done.result = buildBacktestResult(done);
                return done;
              }
              return { ...run, status: BT_RUN_STATUS.RUNNING, progress: { pct } };
            }),
          ),
        );
      }, TICK_MS);
      timers.current.set(key, id);
    },
    [clearTimer],
  );

  const runBacktest = useCallback(
    (epochId, { epochLabel, params, mini }) => {
      const id = newBacktestId();
      const fees = resolveBtFees(params.exchange, params.mode);
      const run = {
        id,
        epochId,
        epochLabel: epochLabel ?? null,
        miniId: mini?.id ?? null,
        miniName: mini?.name ?? null,
        miniParams: mini?.params ? { ...mini.params } : null,
        miniCore: mini?.core ? { ...mini.core } : null,
        manualFees: mini?.manualFees ? { ...mini.manualFees } : null,
        params: { ...params, fees },
        editedFields: params.editedFields ? [...params.editedFields] : [],
        status: BT_RUN_STATUS.QUEUED,
        progress: { pct: 0 },
        error: null,
        result: null,
        shufflerRuns: [],
        syntheticRuns: [],
        analytics: [],
        createdAt: new Date().toISOString(),
        createdBy: currentUser,
      };
      delete run.params.editedFields;
      setState((prev) =>
        withEpoch(prev, epochId, (slice) => ({ ...slice, runs: [run, ...slice.runs] })),
      );
      startBacktestProgress(epochId, id);
      return id;
    },
    [currentUser, startBacktestProgress],
  );

  const failRun = useCallback(
    (epochId, backtestId, errorKey = "ENGINE_TIMEOUT") => {
      clearTimer(`bt:${epochId}:${backtestId}`);
      setState((prev) =>
        withEpoch(prev, epochId, (slice) =>
          mapRuns(slice, backtestId, (run) => ({
            ...run,
            status: BT_RUN_STATUS.FAILED,
            error: BT_ERROR_CODES[errorKey] || BT_ERROR_CODES.ENGINE_TIMEOUT,
          })),
        ),
      );
    },
    [clearTimer],
  );

  const deleteBacktest = useCallback(
    (epochId, backtestId) => {
      clearTimer(`bt:${epochId}:${backtestId}`);
      setState((prev) =>
        withEpoch(prev, epochId, (slice) => {
          const run = slice.runs.find((r) => r.id === backtestId);
          if (!run) return slice;
          const savedAnalytics = (run.analytics || [])
            .filter((a) => a.status === BT_ANALYTICS_STATUS.SAVED)
            .map((a) => ({ ...a, archived: true, promoted: false }));
          return {
            runs: slice.runs.filter((r) => r.id !== backtestId),
            archive: [...savedAnalytics, ...slice.archive],
          };
        }),
      );
    },
    [clearTimer],
  );

  /* ---------------------------------------------------------- child  runs */

  const startShufflerProgress = useCallback(
    (epochId, backtestId, runId, totalN) => {
      const key = `sh:${epochId}:${runId}`;
      clearTimer(key);
      const step = Math.max(1, Math.round(totalN / 9));
      const id = setInterval(() => {
        setState((prev) =>
          withEpoch(prev, epochId, (slice) =>
            mapRuns(slice, backtestId, (parent) => ({
              ...parent,
              shufflerRuns: parent.shufflerRuns.map((run) => {
                if (run.id !== runId) return run;
                if (run.status === BT_RUN_STATUS.DONE || run.status === BT_RUN_STATUS.FAILED) return run;
                const doneN = Math.min(totalN, (run.progress?.doneN ?? 0) + step);
                if (doneN >= totalN) {
                  clearTimer(key);
                  const done = {
                    ...run,
                    status: BT_RUN_STATUS.DONE,
                    progress: { doneN: totalN, totalN },
                  };
                  done.result = buildShufflerResult(done, parent);
                  return done;
                }
                return { ...run, status: BT_RUN_STATUS.RUNNING, progress: { doneN, totalN } };
              }),
            })),
          ),
        );
      }, TICK_MS);
      timers.current.set(key, id);
    },
    [clearTimer],
  );

  const runShuffler = useCallback(
    (epochId, backtestId, config, inherited, epochLabel) => {
      const id = newShufflerId();
      const totalN = Number(config.shufflesN) || 0;
      const run = {
        id,
        backtestId,
        epochLabel: epochLabel ?? null,
        config: { ...config },
        inherited: { ...inherited },
        status: BT_RUN_STATUS.QUEUED,
        progress: { doneN: 0, totalN },
        error: null,
        result: null,
        selectedForValidation: false,
        createdAt: new Date().toISOString(),
        createdBy: currentUser,
      };
      setState((prev) =>
        withEpoch(prev, epochId, (slice) =>
          mapRuns(slice, backtestId, (parent) => ({
            ...parent,
            shufflerRuns: [run, ...parent.shufflerRuns],
          })),
        ),
      );
      startShufflerProgress(epochId, backtestId, id, totalN);
      return id;
    },
    [currentUser, startShufflerProgress],
  );

  const startSyntheticProgress = useCallback(
    (epochId, backtestId, runId, totalN) => {
      const key = `sy:${epochId}:${runId}`;
      clearTimer(key);
      const step = Math.max(1, Math.round(totalN / 7));
      const id = setInterval(() => {
        setState((prev) =>
          withEpoch(prev, epochId, (slice) =>
            mapRuns(slice, backtestId, (parent) => ({
              ...parent,
              syntheticRuns: parent.syntheticRuns.map((run) => {
                if (run.id !== runId) return run;
                if (run.status === BT_RUN_STATUS.DONE || run.status === BT_RUN_STATUS.FAILED) return run;
                const generationPct = Math.min(100, (run.progress?.generationPct ?? 0) + 34);
                if (generationPct < 100) {
                  return {
                    ...run,
                    status: BT_RUN_STATUS.RUNNING,
                    progress: { ...run.progress, generationPct, totalN },
                  };
                }
                const backtestsDoneN = Math.min(totalN, (run.progress?.backtestsDoneN ?? 0) + step);
                if (backtestsDoneN >= totalN) {
                  clearTimer(key);
                  const done = {
                    ...run,
                    status: BT_RUN_STATUS.DONE,
                    progress: { generationPct: 100, backtestsDoneN: totalN, totalN },
                  };
                  done.result = buildSyntheticResult(done, parent);
                  return done;
                }
                return {
                  ...run,
                  status: BT_RUN_STATUS.RUNNING,
                  progress: { generationPct: 100, backtestsDoneN, totalN },
                };
              }),
            })),
          ),
        );
      }, TICK_MS);
      timers.current.set(key, id);
    },
    [clearTimer],
  );

  const runSynthetic = useCallback(
    (epochId, backtestId, config, inherited, epochLabel) => {
      const id = newSyntheticId();
      const totalN = Number(config.nRuns) || 0;
      const run = {
        id,
        backtestId,
        epochLabel: epochLabel ?? null,
        config: { ...config },
        inherited: { ...inherited },
        status: BT_RUN_STATUS.QUEUED,
        progress: { generationPct: 0, backtestsDoneN: 0, totalN },
        error: null,
        result: null,
        selectedForValidation: false,
        createdAt: new Date().toISOString(),
        createdBy: currentUser,
      };
      setState((prev) =>
        withEpoch(prev, epochId, (slice) =>
          mapRuns(slice, backtestId, (parent) => ({
            ...parent,
            syntheticRuns: [run, ...parent.syntheticRuns],
          })),
        ),
      );
      startSyntheticProgress(epochId, backtestId, id, totalN);
      return id;
    },
    [currentUser, startSyntheticProgress],
  );

  const cancelRun = useCallback(
    (epochId, backtestId, type, runId) => {
      if (type === "backtest") {
        deleteBacktest(epochId, backtestId);
        return;
      }
      clearTimer(`${type === "shuffler" ? "sh" : "sy"}:${epochId}:${runId}`);
      setState((prev) =>
        withEpoch(prev, epochId, (slice) =>
          mapRuns(slice, backtestId, (parent) => ({
            ...parent,
            shufflerRuns:
              type === "shuffler"
                ? parent.shufflerRuns.filter((r) => r.id !== runId)
                : parent.shufflerRuns,
            syntheticRuns:
              type === "synthetic"
                ? parent.syntheticRuns.filter((r) => r.id !== runId)
                : parent.syntheticRuns,
          })),
        ),
      );
    },
    [clearTimer, deleteBacktest],
  );

  /**
   * Deleting a run leaves saved analytics untouched (their matrix is a frozen
   * copy) but resets the matching line of every draft analytics.
   */
  const deleteChildRun = useCallback(
    (epochId, backtestId, type, runId) => {
      clearTimer(`${type === "shuffler" ? "sh" : "sy"}:${epochId}:${runId}`);
      setState((prev) =>
        withEpoch(prev, epochId, (slice) =>
          mapRuns(slice, backtestId, (parent) => ({
            ...parent,
            shufflerRuns:
              type === "shuffler"
                ? parent.shufflerRuns.filter((r) => r.id !== runId)
                : parent.shufflerRuns,
            syntheticRuns:
              type === "synthetic"
                ? parent.syntheticRuns.filter((r) => r.id !== runId)
                : parent.syntheticRuns,
            analytics: parent.analytics.map((a) => {
              if (a.status === BT_ANALYTICS_STATUS.SAVED) return a;
              if (type === "shuffler" && a.shufflerRunId === runId) {
                return { ...a, shufflerRunId: null };
              }
              if (type === "synthetic" && a.syntheticRunId === runId) {
                return { ...a, syntheticRunId: null };
              }
              return a;
            }),
          })),
        ),
      );
    },
    [clearTimer],
  );

  /* ----------------------------------------------------------- analytics */

  const createAnalytics = useCallback(
    (epochId, backtestId, { shufflerRunId = null, syntheticRunId = null, note = null } = {}) => {
      let createdId = null;
      setState((prev) =>
        withEpoch(prev, epochId, (slice) =>
          mapRuns(slice, backtestId, (parent) => {
            createdId = nextAnalyticsId(parent.analytics);
            const shufflerRun = parent.shufflerRuns.find((r) => r.id === shufflerRunId) || null;
            const syntheticRun = parent.syntheticRuns.find((r) => r.id === syntheticRunId) || null;
            const analytics = {
              id: createdId,
              backtestId,
              shufflerRunId,
              syntheticRunId,
              status: BT_ANALYTICS_STATUS.DRAFT,
              integrity: checkIntegrity({ backtest: parent, shufflerRun, syntheticRun }),
              matrix: null,
              promoted: false,
              author: null,
              savedAt: null,
              note,
              archived: false,
              createdAt: new Date().toISOString(),
              createdBy: currentUser,
            };
            return { ...parent, analytics: [...parent.analytics, analytics] };
          }),
        ),
      );
      return createdId;
    },
    [currentUser],
  );

  /** Draft only: the combination and the note are editable until Save. */
  const updateAnalytics = useCallback((epochId, backtestId, analyticsId, patch) => {
    setState((prev) =>
      withEpoch(prev, epochId, (slice) =>
        mapRuns(slice, backtestId, (parent) => ({
          ...parent,
          analytics: parent.analytics.map((a) => {
            if (a.id !== analyticsId || a.status === BT_ANALYTICS_STATUS.SAVED) return a;
            const merged = { ...a, ...patch };
            const shufflerRun =
              parent.shufflerRuns.find((r) => r.id === merged.shufflerRunId) || null;
            const syntheticRun =
              parent.syntheticRuns.find((r) => r.id === merged.syntheticRunId) || null;
            merged.integrity = checkIntegrity({ backtest: parent, shufflerRun, syntheticRun });
            return merged;
          }),
        })),
      ),
    );
  }, []);

  /** Freezes the combination, the matrix, integrity, author, timestamp and note. */
  const saveAnalytics = useCallback(
    (epochId, backtestId, analyticsId, { note, matrix } = {}) => {
      setState((prev) =>
        withEpoch(prev, epochId, (slice) =>
          mapRuns(slice, backtestId, (parent) => ({
            ...parent,
            analytics: parent.analytics.map((a) =>
              a.id === analyticsId && a.status === BT_ANALYTICS_STATUS.DRAFT
                ? {
                    ...a,
                    status: BT_ANALYTICS_STATUS.SAVED,
                    note: note ?? a.note,
                    matrix: matrix ?? a.matrix,
                    author: currentUser,
                    savedAt: new Date().toISOString(),
                  }
                : a,
            ),
          })),
        ),
      );
    },
    [currentUser],
  );

  /** Promotion is exclusive across the whole epoch and reversible. */
  const togglePromote = useCallback((epochId, backtestId, analyticsId) => {
    setState((prev) =>
      withEpoch(prev, epochId, (slice) => {
        const current = slice.runs
          .flatMap((r) => r.analytics || [])
          .find((a) => a.id === analyticsId && a.backtestId === backtestId);
        const nextValue = !(current && current.promoted);
        return {
          ...slice,
          runs: slice.runs.map((run) => ({
            ...run,
            analytics: (run.analytics || []).map((a) => {
              if (a.status !== BT_ANALYTICS_STATUS.SAVED) return a;
              const isTarget = a.id === analyticsId && a.backtestId === backtestId;
              const promoted = isTarget ? nextValue : false;
              return a.promoted === promoted ? a : { ...a, promoted };
            }),
          })),
        };
      }),
    );
  }, []);

  /** Mark exactly one Shuffler run per parent for Validation analytics (star / Compare). */
  const toggleShufflerForValidation = useCallback((epochId, backtestId, shufflerRunId) => {
    setState((prev) =>
      withEpoch(prev, epochId, (slice) =>
        mapRuns(slice, backtestId, (parent) => {
          const current = (parent.shufflerRuns || []).find((r) => r.id === shufflerRunId);
          const nextValue = !(current && current.selectedForValidation);
          return {
            ...parent,
            shufflerRuns: (parent.shufflerRuns || []).map((r) => {
              const selectedForValidation = r.id === shufflerRunId ? nextValue : false;
              return r.selectedForValidation === selectedForValidation
                ? r
                : { ...r, selectedForValidation };
            }),
          };
        }),
      ),
    );
  }, []);

  /** Mark exactly one Synthetic run per parent for Validation analytics (star / Compare). */
  const toggleSyntheticForValidation = useCallback((epochId, backtestId, syntheticRunId) => {
    setState((prev) =>
      withEpoch(prev, epochId, (slice) =>
        mapRuns(slice, backtestId, (parent) => {
          const current = (parent.syntheticRuns || []).find((r) => r.id === syntheticRunId);
          const nextValue = !(current && current.selectedForValidation);
          return {
            ...parent,
            syntheticRuns: (parent.syntheticRuns || []).map((r) => {
              const selectedForValidation = r.id === syntheticRunId ? nextValue : false;
              return r.selectedForValidation === selectedForValidation
                ? r
                : { ...r, selectedForValidation };
            }),
          };
        }),
      ),
    );
  }, []);

  const deleteAnalytics = useCallback((epochId, backtestId, analyticsId) => {
    setState((prev) =>
      withEpoch(prev, epochId, (slice) =>
        mapRuns(slice, backtestId, (parent) => ({
          ...parent,
          analytics: parent.analytics.filter((a) => a.id !== analyticsId),
        })),
      ),
    );
  }, []);

  const deleteArchivedAnalytics = useCallback((epochId, analyticsId, backtestId) => {
    setState((prev) =>
      withEpoch(prev, epochId, (slice) => ({
        ...slice,
        archive: slice.archive.filter(
          (a) => !(a.id === analyticsId && a.backtestId === backtestId),
        ),
      })),
    );
  }, []);

  /** Saved combinations of the epoch — used to reject duplicates. */
  const savedCombinations = useCallback(
    (epochId) => {
      const slice = epochSlice(state, epochId);
      const fromRuns = slice.runs.flatMap((r) =>
        (r.analytics || [])
          .filter((a) => a.status === BT_ANALYTICS_STATUS.SAVED)
          .map((a) => `${a.backtestId}|${a.shufflerRunId}|${a.syntheticRunId}`),
      );
      const fromArchive = slice.archive.map(
        (a) => `${a.backtestId}|${a.shufflerRunId}|${a.syntheticRunId}`,
      );
      return new Set([...fromRuns, ...fromArchive]);
    },
    [state],
  );

  return useMemo(
    () => ({
      state,
      getEpoch,
      getRuns,
      getArchive,
      getPromotedAnalytics,
      getStageStatus,
      savedCombinations,
      runBacktest,
      failRun,
      deleteBacktest,
      runShuffler,
      runSynthetic,
      cancelRun,
      deleteChildRun,
      createAnalytics,
      updateAnalytics,
      saveAnalytics,
      togglePromote,
      toggleShufflerForValidation,
      toggleSyntheticForValidation,
      deleteAnalytics,
      deleteArchivedAnalytics,
    }),
    [
      state,
      getEpoch,
      getRuns,
      getArchive,
      getPromotedAnalytics,
      getStageStatus,
      savedCombinations,
      runBacktest,
      failRun,
      deleteBacktest,
      runShuffler,
      runSynthetic,
      cancelRun,
      deleteChildRun,
      createAnalytics,
      updateAnalytics,
      saveAnalytics,
      togglePromote,
      toggleShufflerForValidation,
      toggleSyntheticForValidation,
      deleteAnalytics,
      deleteArchivedAnalytics,
    ],
  );
}

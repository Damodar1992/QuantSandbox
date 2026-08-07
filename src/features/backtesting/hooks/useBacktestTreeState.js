// Stage 5 · expand/collapse state of the hierarchical table.
// Same immutable-Set idiom as useHyperoptResultsState.

import { useCallback, useState } from "react";

export function useBacktestTreeState(initialExpanded = []) {
  const [expandedRuns, setExpandedRuns] = useState(() => new Set(initialExpanded));

  const toggleRun = useCallback((id) => {
    setExpandedRuns((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const expandRun = useCallback((id) => {
    setExpandedRuns((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  const [archiveOpen, setArchiveOpen] = useState(false);
  const toggleArchive = useCallback(() => setArchiveOpen((prev) => !prev), []);

  return { expandedRuns, toggleRun, expandRun, archiveOpen, toggleArchive };
}

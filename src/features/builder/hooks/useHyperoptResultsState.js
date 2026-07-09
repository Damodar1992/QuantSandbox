import { useState, useCallback } from "react";

/**
 * UI expand/collapse state for the three-level hyperopt results table
 * and the normalization modal section toggles.
 */
export function useHyperoptResultsState() {
  const [normalizationDetailsExpanded, setNormalizationDetailsExpanded] = useState(() => new Set());
  const toggleNormalizationDetails = useCallback((id) => {
    setNormalizationDetailsExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const [normModalCollapsedSections, setNormModalCollapsedSections] = useState(() => new Set());
  const toggleNormModalSection = useCallback((key) => {
    setNormModalCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  // Level-1 row expand/collapse
  const [hyperoptResultsExpanded, setHyperoptResultsExpanded] = useState(() => new Set(["hr1", "hr2"]));
  const toggleHyperoptRow = useCallback((id) => {
    setHyperoptResultsExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  // Level-3 (HeatMaps & Reports) expand/collapse per level-2 row id
  const [hyperoptLevel3Expanded, setHyperoptLevel3Expanded] = useState(() => new Set(["hr1-1", "hr1-2"]));
  const toggleHyperoptLevel3 = useCallback((id) => {
    setHyperoptLevel3Expanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  return {
    normalizationDetailsExpanded,
    toggleNormalizationDetails,
    normModalCollapsedSections,
    toggleNormModalSection,
    hyperoptResultsExpanded,
    toggleHyperoptRow,
    hyperoptLevel3Expanded,
    toggleHyperoptLevel3,
  };
}

/** Pick a value by Strategy Builder stage id (1=Signal … 4=Risk). */
export function pickByStage(activeStage, { signal, entry, exit, risk }) {
  if (activeStage === 4) return risk;
  if (activeStage === 3) return exit;
  if (activeStage === 2) return entry;
  return signal;
}

/** UI copy for Builder sections that differ per stage. */
export function getBuilderStageCopy(activeStage) {
  switch (activeStage) {
    case 2:
      return {
        stageTag: "Entry",
        formulaTitle: "Entry formula",
        formulaKind: "entry validation",
        formulaMode: "entry",
        formulaEditorKey: "entry-formulas",
        favoriteEpochsNext: 3,
        heatmapSelectLabel: "Select for Stage 3",
      };
    case 3:
      return {
        stageTag: "Exit",
        formulaTitle: "Exit formula",
        formulaKind: "exit",
        formulaMode: "exit",
        formulaEditorKey: "exit-formulas",
        favoriteEpochsNext: 4,
        heatmapSelectLabel: "Select for Stage 4",
      };
    case 4:
      return {
        stageTag: "Risk",
        formulaTitle: "Formula",
        formulaKind: "strategy preview",
        formulaMode: "risk",
        formulaEditorKey: "risk-formulas",
        favoriteEpochsNext: 5,
        heatmapSelectLabel: "Select for Stage 5",
      };
    default:
      return {
        stageTag: "Signal",
        formulaTitle: "Signal Formula",
        formulaKind: "trading",
        formulaMode: "signal",
        formulaEditorKey: "signal-formulas",
        favoriteEpochsNext: 2,
        heatmapSelectLabel: "Select for Stage 2",
      };
  }
}

/** Fixed stage pipeline: Signal → Entry → Exit → Risk → Final */
export const STAGE_TYPES = ["signal", "entry", "exit", "risk", "final"];

export const STAGE_ID_TO_TYPE = {
  1: "signal",
  2: "entry",
  3: "exit",
  4: "risk",
  5: "final",
};

export const STAGE_TYPE_TO_ID = {
  signal: 1,
  entry: 2,
  exit: 3,
  risk: 4,
  final: 5,
};

export const STAGE_TYPE_LABELS = {
  signal: "Signal",
  entry: "Entry",
  exit: "Exit",
  risk: "Risk",
  final: "Final",
};

/** Parent stage type for cascade filtering (null for signal). */
export const PARENT_STAGE_TYPE = {
  signal: null,
  entry: "signal",
  exit: "entry",
  risk: "exit",
  final: "risk",
};

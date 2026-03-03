export const HEATMAP_FILTER_KEYS = [
  "cycle_count_valid",
  "median_duration_cycle",
  "median_MFE",
  "median_MAE",
  "median_AIR",
  "Hit_Rate",
  "Final Score",
  "Intermediate Score",
  "Stability Score",
];

export const FILTER_OPERATIONS = [
  { value: "EQ", label: "Equals" },
  { value: "NEQ", label: "Not Equals" },
  { value: "GT", label: "Greater Than" },
  { value: "GTE", label: "Greater Than or Equal" },
  { value: "LT", label: "Less Than" },
  { value: "LTE", label: "Less Than or Equal" },
  { value: "BETWEEN", label: "Between" },
  { value: "IN", label: "In List" },
  { value: "NOT_IN", label: "Not In List" },
  { value: "LIKE", label: "Contains" },
  { value: "IS_NULL", label: "Is Empty" },
  { value: "IS_NOT_NULL", label: "Is Not Empty" },
];

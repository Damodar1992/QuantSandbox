/**
 * Analytics table items (Heatmap / Report / Range Narrowing / Comparison Widget):
 * shared item types, per-stage visibility and factories for Comparison Widget
 * entries created from the Analytics menu.
 *
 * @typedef {{ field: string, op: string, value?: string }} FilterCondition
 * @typedef {{ logic: "and" | "or", conditions: FilterCondition[] }} FilterGroup
 * @typedef {{ logic: "and" | "or", groups: FilterGroup[] }} FiltersConfig
 */

export const HEATMAP_ITEM_TYPE = "Heatmap";
export const REPORT_ITEM_TYPE = "Report";
export const RANGE_NARROWING_ITEM_TYPE = "Range Narrowing";
export const COMPARISON_WIDGET_ITEM_TYPE = "Comparison Widget";

/**
 * Analytics items that are not applicable to the active Builder stage:
 * Range Narrowing is not offered on Risk (stage 4), and the Comparison Widget
 * needs a previous stage baseline, so it never appears on Signal (stage 1).
 *
 * Without a stage the list is returned untouched.
 *
 * @param {object[]} items
 * @param {number} [activeStage] 1 = Signal … 4 = Risk
 */
export function filterAnalyticsItemsForStage(items, activeStage) {
  const list = Array.isArray(items) ? items : [];
  const stage = Number(activeStage);
  if (!Number.isFinite(stage)) return list;

  return list.filter((item) => {
    if (item.type === RANGE_NARROWING_ITEM_TYPE) return stage !== 4;
    if (item.type === COMPARISON_WIDGET_ITEM_TYPE) return stage !== 1;
    return true;
  });
}

/** Number of conditions across all filter groups. */
export function countFilterConditions(filters) {
  if (!filters?.groups?.length) return 0;
  return filters.groups.reduce((total, group) => total + (group.conditions?.length ?? 0), 0);
}

/**
 * Analytics entry created after the quant confirms the widget filters.
 *
 * @param {{ subId: string, filters?: FiltersConfig, filterPreset?: string, date?: string }} input
 */
export function createComparisonWidgetAnalyticsItem({ subId, filters, filterPreset, date }) {
  return {
    id: `${subId}-cw-${Date.now()}`,
    date: date || new Date().toISOString().slice(0, 10),
    type: COMPARISON_WIDGET_ITEM_TYPE,
    status: "Finished",
    runConfig: {
      filters: filters ?? { logic: "and", groups: [] },
      filterPreset: filterPreset || "",
    },
  };
}

/** @type {FiltersConfig} */
const SEED_FILTERS = {
  logic: "and",
  groups: [
    {
      logic: "and",
      conditions: [
        { field: "Final Score", op: "GT", value: "0.6" },
        { field: "median_AIR", op: "GT", value: "1" },
        { field: "cycle_count_valid", op: "GTE", value: "100" },
      ],
    },
  ],
};

/** Default seed entry for the Analytics table (visible on stages 2–4). */
export function buildDefaultComparisonWidgetSeedItem(subId, date = "2024-01-15") {
  return {
    id: `${subId}-cw1`,
    date,
    type: COMPARISON_WIDGET_ITEM_TYPE,
    status: "Finished",
    runConfig: {
      filters: SEED_FILTERS,
      filterPreset: "",
    },
  };
}

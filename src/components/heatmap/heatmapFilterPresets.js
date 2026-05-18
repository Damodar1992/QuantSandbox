export const genId = () => `_${Date.now()}_${Math.random().toString(36).slice(2)}`;

export const FILTER_PRESET_BUILTIN = {
  "Super filter": () => ({
      rootLogic: "and",
      groups: [{
        id: genId(),
        logic: "and",
        conditions: [
          { id: genId(), field: "median_MFE", op: "GT", value: "" },
          { id: genId(), field: "median_MAE", op: "GT", value: "" },
          { id: genId(), field: "median_AIR", op: "GT", value: "" },
          { id: genId(), field: "Final Score", op: "GT", value: "" },
        ],
      }],
  }),
  "Tresh filter": () => ({
    rootLogic: "or",
    groups: [
      { id: genId(), logic: "or", conditions: [{ id: genId(), field: "median_MFE", op: "LT", value: "" }] },
      { id: genId(), logic: "or", conditions: [{ id: genId(), field: "median_AIR", op: "GT", value: "" }] },
      { id: genId(), logic: "or", conditions: [{ id: genId(), field: "Final Score", op: "GT", value: "" }] },
    ],
  }),
};

export const cloneFilterRootWithNewIds = (root, genIdFn = genId) => ({
  rootLogic: root.rootLogic,
  groups: root.groups.map((g) => ({
    id: genIdFn(),
    logic: g.logic,
    conditions: g.conditions.map((c) => ({ id: genIdFn(), field: c.field, op: c.op, value: c.value ?? "" })),
  })),
});

export const DEFAULT_FILTER_ROOT = () => ({
  rootLogic: "or",
  groups: [{ id: genId(), logic: "and", conditions: [] }],
});

export function filtersConfigToFilterRoot(filters) {
  if (!filters?.groups?.length) return DEFAULT_FILTER_ROOT();
  return cloneFilterRootWithNewIds({
    rootLogic: filters.logic === "or" ? "or" : "and",
    groups: filters.groups.map((g) => ({
      logic: g.logic === "or" ? "or" : "and",
      conditions: (g.conditions || []).map((c) => ({
        field: c.field,
        op: c.op,
        value: c.value ?? "",
      })),
    })),
  });
}

export function filterRootToFiltersConfig(filterRoot) {
  return {
    logic: filterRoot.rootLogic,
    groups: filterRoot.groups.map((g) => ({
      logic: g.logic,
      conditions: g.conditions.map((c) => ({ field: c.field, op: c.op, value: c.value })),
    })),
  };
}

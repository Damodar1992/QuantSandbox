import { TAG_OBJECT_TYPES } from "../../../constants/tags";

let nextTagId = 100;
let nextRelationId = 100;

function generateTagId() {
  nextTagId += 1;
  return `tag-${nextTagId}`;
}

function generateRelationId() {
  nextRelationId += 1;
  return `rel-${nextRelationId}`;
}

function stripTagIdFromItems(items, tagId) {
  return (items || []).map((row) => ({
    ...row,
    tagIds: (row.tagIds || []).filter((id) => id !== tagId),
  }));
}

function stripTagIdFromMatchedItems(items, objectId, tagId, matchFn) {
  return (items || []).map((row) => {
    if (!matchFn(row, objectId)) return row;
    return {
      ...row,
      tagIds: (row.tagIds || []).filter((id) => id !== tagId),
    };
  });
}

export function canViewTag(role, userId, tag) {
  if (!tag) return false;
  if (role === "Admin") return true;
  return tag.ownerId === userId;
}

export function canBreakRelation(role, userId, tag) {
  return canDeleteTag(role, userId, tag);
}

export function canDeleteTag(role, userId, tag) {
  if (!tag) return false;
  if (role === "Admin") return true;
  return tag.ownerId === userId;
}

export function getVisibleTags(tags, role, userId) {
  if (!Array.isArray(tags)) return [];
  if (role === "Admin") return tags;
  return tags.filter((tag) => tag.ownerId === userId);
}

export function getRelationsForTag(relations, tagId) {
  if (!Array.isArray(relations)) return [];
  return relations.filter((rel) => rel.tagId === tagId);
}

export function countLinkedObjects(relations, tagId) {
  return getRelationsForTag(relations, tagId).length;
}

export function resolveTagNames(tagIds, registry) {
  if (!Array.isArray(tagIds) || !tagIds.length) return [];
  const byId = new Map((registry || []).map((tag) => [tag.id, tag.name]));
  return tagIds.map((id) => byId.get(id)).filter(Boolean);
}

export function findTagByName(registry, name) {
  const trimmed = String(name || "").trim();
  if (!trimmed) return null;
  return (registry || []).find((tag) => tag.name === trimmed) || null;
}

export function findOrCreateTagByName(registry, name, currentUser) {
  const trimmed = String(name || "").trim();
  if (!trimmed) return { registry, tag: null, isNew: false };
  const existing = findTagByName(registry, trimmed);
  if (existing) return { registry, tag: existing, isNew: false };
  const tag = {
    id: generateTagId(),
    name: trimmed,
    ownerId: currentUser.id,
    ownerLogin: currentUser.login,
    createdAt: new Date().toISOString(),
  };
  return { registry: [...(registry || []), tag], tag, isNew: true };
}

export function buildObjectRef(hyperoptRow) {
  if (!hyperoptRow) return "";
  return `Hyperopt #${hyperoptRow.hyperoptNumber ?? "—"}`;
}

export function buildMiniBacktestObjectRef(entry) {
  if (!entry) return "";
  const epoch =
    entry.epochNumber != null
      ? `Epoch #${entry.epochNumber}`
      : entry.epochLabel || "run";
  const stage = entry.stage || (entry.stageId != null ? `Stage ${entry.stageId}` : "");
  return [stage, epoch].filter(Boolean).join(" · ") || "Mini Backtest";
}

export function buildStrategyObjectRef(strategy) {
  if (!strategy) return "";
  return `Strategy: ${strategy.name || "—"}`;
}

export function buildIndicatorObjectRef(indicator) {
  if (!indicator) return "";
  return `Indicator: ${indicator.name || indicator.catalogKey || "—"}`;
}

/**
 * Sync tagIds and relations for a hyperopt row after Tags modal save.
 * @returns {{ registry, relations, hyperoptResultsRows, tagIds }}
 */
export function syncHyperoptTagIds({
  row,
  tagIds,
  registry,
  relations,
  hyperoptResultsRows,
  currentUser,
}) {
  if (!row) {
    return { registry, relations, hyperoptResultsRows, tagIds: [] };
  }

  const desiredIds = [...new Set(tagIds || [])];
  const rowRelations = (relations || []).filter(
    (rel) =>
      rel.objectType === TAG_OBJECT_TYPES.HYPEROPT_RESULT && rel.objectId === row.id,
  );
  const existingIds = rowRelations.map((rel) => rel.tagId);
  const toAdd = desiredIds.filter((id) => !existingIds.includes(id));
  const toRemove = existingIds.filter((id) => !desiredIds.includes(id));

  let nextRelations = [...(relations || [])];
  if (toRemove.length) {
    nextRelations = nextRelations.filter(
      (rel) =>
        !(
          rel.objectType === TAG_OBJECT_TYPES.HYPEROPT_RESULT &&
          rel.objectId === row.id &&
          toRemove.includes(rel.tagId)
        ),
    );
  }

  const now = new Date().toISOString();
  const objectRef = buildObjectRef(row);
  for (const tagId of toAdd) {
    nextRelations.push({
      id: generateRelationId(),
      tagId,
      objectType: TAG_OBJECT_TYPES.HYPEROPT_RESULT,
      objectId: row.id,
      objectRef,
      assignedAt: now,
    });
  }

  const nextRows = (hyperoptResultsRows || []).map((item) =>
    item.id === row.id ? { ...item, tagIds: desiredIds } : item,
  );

  return {
    registry,
    relations: nextRelations,
    hyperoptResultsRows: nextRows,
    tagIds: desiredIds,
  };
}

/**
 * Sync tagIds and relations for a mini backtest entry after Tags modal save.
 * @returns {{ registry, relations, miniBacktestResults, tagIds }}
 */
export function syncMiniBacktestTagIds({
  entry,
  tagIds,
  registry,
  relations,
  miniBacktestResults,
}) {
  if (!entry) {
    return { registry, relations, miniBacktestResults, tagIds: [] };
  }

  const desiredIds = [...new Set(tagIds || [])];
  const entryRelations = (relations || []).filter(
    (rel) =>
      rel.objectType === TAG_OBJECT_TYPES.MINI_BACKTEST_RESULT && rel.objectId === entry.id,
  );
  const existingIds = entryRelations.map((rel) => rel.tagId);
  const toAdd = desiredIds.filter((id) => !existingIds.includes(id));
  const toRemove = existingIds.filter((id) => !desiredIds.includes(id));

  let nextRelations = [...(relations || [])];
  if (toRemove.length) {
    nextRelations = nextRelations.filter(
      (rel) =>
        !(
          rel.objectType === TAG_OBJECT_TYPES.MINI_BACKTEST_RESULT &&
          rel.objectId === entry.id &&
          toRemove.includes(rel.tagId)
        ),
    );
  }

  const now = new Date().toISOString();
  const objectRef = buildMiniBacktestObjectRef(entry);
  for (const tagId of toAdd) {
    nextRelations.push({
      id: generateRelationId(),
      tagId,
      objectType: TAG_OBJECT_TYPES.MINI_BACKTEST_RESULT,
      objectId: entry.id,
      objectRef,
      assignedAt: now,
    });
  }

  const nextResults = (miniBacktestResults || []).map((item) =>
    item.id === entry.id ? { ...item, tagIds: desiredIds } : item,
  );

  return {
    registry,
    relations: nextRelations,
    miniBacktestResults: nextResults,
    tagIds: desiredIds,
  };
}

/**
 * Sync tagIds and relations for a strategy after Tags modal save.
 * @returns {{ registry, relations, strategies, tagIds }}
 */
export function syncStrategyTagIds({
  strategy,
  tagIds,
  registry,
  relations,
  strategies,
}) {
  if (!strategy) {
    return { registry, relations, strategies, tagIds: [] };
  }

  const objectId = String(strategy.id);
  const desiredIds = [...new Set(tagIds || [])];
  const strategyRelations = (relations || []).filter(
    (rel) => rel.objectType === TAG_OBJECT_TYPES.STRATEGY && rel.objectId === objectId,
  );
  const existingIds = strategyRelations.map((rel) => rel.tagId);
  const toAdd = desiredIds.filter((id) => !existingIds.includes(id));
  const toRemove = existingIds.filter((id) => !desiredIds.includes(id));

  let nextRelations = [...(relations || [])];
  if (toRemove.length) {
    nextRelations = nextRelations.filter(
      (rel) =>
        !(
          rel.objectType === TAG_OBJECT_TYPES.STRATEGY &&
          rel.objectId === objectId &&
          toRemove.includes(rel.tagId)
        ),
    );
  }

  const now = new Date().toISOString();
  const objectRef = buildStrategyObjectRef(strategy);
  for (const tagId of toAdd) {
    nextRelations.push({
      id: generateRelationId(),
      tagId,
      objectType: TAG_OBJECT_TYPES.STRATEGY,
      objectId,
      objectRef,
      assignedAt: now,
    });
  }

  const nextStrategies = (strategies || []).map((item) =>
    String(item.id) === objectId ? { ...item, tagIds: desiredIds } : item,
  );

  return {
    registry,
    relations: nextRelations,
    strategies: nextStrategies,
    tagIds: desiredIds,
  };
}

/**
 * Sync tagIds and relations for an indicator by catalogKey after Tags modal save.
 * Shared between Settings → Indicators and Indicator Library.
 * @returns {{ registry, relations, pageIndicators, tagIds }}
 */
export function syncIndicatorTagIds({
  indicator,
  catalogKey,
  tagIds,
  registry,
  relations,
  pageIndicators,
}) {
  const key = catalogKey || indicator?.catalogKey;
  if (!key) {
    return { registry, relations, pageIndicators, tagIds: [] };
  }

  const desiredIds = [...new Set(tagIds || [])];
  const indicatorRelations = (relations || []).filter(
    (rel) => rel.objectType === TAG_OBJECT_TYPES.INDICATOR && rel.objectId === key,
  );
  const existingIds = indicatorRelations.map((rel) => rel.tagId);
  const toAdd = desiredIds.filter((id) => !existingIds.includes(id));
  const toRemove = existingIds.filter((id) => !desiredIds.includes(id));

  let nextRelations = [...(relations || [])];
  if (toRemove.length) {
    nextRelations = nextRelations.filter(
      (rel) =>
        !(
          rel.objectType === TAG_OBJECT_TYPES.INDICATOR &&
          rel.objectId === key &&
          toRemove.includes(rel.tagId)
        ),
    );
  }

  const now = new Date().toISOString();
  const objectRef = buildIndicatorObjectRef(
    indicator || { catalogKey: key, name: key },
  );
  for (const tagId of toAdd) {
    nextRelations.push({
      id: generateRelationId(),
      tagId,
      objectType: TAG_OBJECT_TYPES.INDICATOR,
      objectId: key,
      objectRef,
      assignedAt: now,
    });
  }

  let found = false;
  let nextIndicators = (pageIndicators || []).map((item) => {
    if (item.catalogKey !== key) return item;
    found = true;
    return { ...item, tagIds: desiredIds };
  });

  if (!found) {
    nextIndicators = [
      ...(pageIndicators || []),
      {
        id: Date.now(),
        catalogKey: key,
        name: indicator?.name || key,
        description: indicator?.description || "",
        type: indicator?.type || indicator?.group || "Custom",
        indicatorType: "System",
        status: "Active",
        createdAt: now.slice(0, 10),
        tagIds: desiredIds,
      },
    ];
  }

  return {
    registry,
    relations: nextRelations,
    pageIndicators: nextIndicators,
    tagIds: desiredIds,
  };
}

/**
 * Remove a single tag–object relation.
 */
export function breakRelation({
  relationId,
  tagsRegistry,
  tagRelations,
  hyperoptResultsRows = [],
  strategies = [],
  pageIndicators = [],
  miniBacktestResults = [],
  role,
  userId,
}) {
  const relation = (tagRelations || []).find((rel) => rel.id === relationId);
  if (!relation) {
    return {
      ok: false,
      error: "Relation not found",
      tagsRegistry,
      tagRelations,
      hyperoptResultsRows,
      strategies,
      pageIndicators,
      miniBacktestResults,
    };
  }

  const tag = (tagsRegistry || []).find((item) => item.id === relation.tagId);
  if (!canBreakRelation(role, userId, tag)) {
    return {
      ok: false,
      error: "Permission denied",
      tagsRegistry,
      tagRelations,
      hyperoptResultsRows,
      strategies,
      pageIndicators,
      miniBacktestResults,
    };
  }

  const nextRelations = (tagRelations || []).filter((rel) => rel.id !== relationId);
  let nextHyperopt = hyperoptResultsRows;
  let nextStrategies = strategies;
  let nextIndicators = pageIndicators;
  let nextMini = miniBacktestResults;

  if (relation.objectType === TAG_OBJECT_TYPES.HYPEROPT_RESULT) {
    nextHyperopt = stripTagIdFromMatchedItems(
      hyperoptResultsRows,
      relation.objectId,
      relation.tagId,
      (row, objectId) => row.id === objectId,
    );
  } else if (relation.objectType === TAG_OBJECT_TYPES.STRATEGY) {
    nextStrategies = stripTagIdFromMatchedItems(
      strategies,
      relation.objectId,
      relation.tagId,
      (row, objectId) => String(row.id) === String(objectId),
    );
  } else if (relation.objectType === TAG_OBJECT_TYPES.INDICATOR) {
    nextIndicators = stripTagIdFromMatchedItems(
      pageIndicators,
      relation.objectId,
      relation.tagId,
      (row, objectId) => row.catalogKey === objectId,
    );
  } else if (relation.objectType === TAG_OBJECT_TYPES.MINI_BACKTEST_RESULT) {
    nextMini = stripTagIdFromMatchedItems(
      miniBacktestResults,
      relation.objectId,
      relation.tagId,
      (row, objectId) => row.id === objectId,
    );
  }

  return {
    ok: true,
    tagsRegistry,
    tagRelations: nextRelations,
    hyperoptResultsRows: nextHyperopt,
    strategies: nextStrategies,
    pageIndicators: nextIndicators,
    miniBacktestResults: nextMini,
  };
}

/**
 * Delete a tag and all its relations globally.
 */
export function deleteTagGlobally({
  tagId,
  tagsRegistry,
  tagRelations,
  hyperoptResultsRows = [],
  strategies = [],
  pageIndicators = [],
  miniBacktestResults = [],
  role,
  userId,
}) {
  const tag = (tagsRegistry || []).find((item) => item.id === tagId);
  if (!tag) {
    return {
      ok: false,
      error: "Tag not found",
      tagsRegistry,
      tagRelations,
      hyperoptResultsRows,
      strategies,
      pageIndicators,
      miniBacktestResults,
    };
  }
  if (!canDeleteTag(role, userId, tag)) {
    return {
      ok: false,
      error: "Permission denied",
      tagsRegistry,
      tagRelations,
      hyperoptResultsRows,
      strategies,
      pageIndicators,
      miniBacktestResults,
    };
  }

  const nextRegistry = (tagsRegistry || []).filter((item) => item.id !== tagId);
  const nextRelations = (tagRelations || []).filter((rel) => rel.tagId !== tagId);

  return {
    ok: true,
    tagsRegistry: nextRegistry,
    tagRelations: nextRelations,
    hyperoptResultsRows: stripTagIdFromItems(hyperoptResultsRows, tagId),
    strategies: stripTagIdFromItems(strategies, tagId),
    pageIndicators: stripTagIdFromItems(pageIndicators, tagId),
    miniBacktestResults: stripTagIdFromItems(miniBacktestResults, tagId),
  };
}

/**
 * Collect visible tag ids used across items that carry tagIds.
 */
export function getAvailableTagIdsForFilter(items, registry, role, userId) {
  const ids = new Set();
  for (const row of items || []) {
    for (const tagId of row.tagIds || []) {
      const tag = (registry || []).find((item) => item.id === tagId);
      if (tag && canViewTag(role, userId, tag)) {
        ids.add(tagId);
      }
    }
  }
  return Array.from(ids).sort((a, b) => {
    const nameA = (registry || []).find((t) => t.id === a)?.name || "";
    const nameB = (registry || []).find((t) => t.id === b)?.name || "";
    return nameA.localeCompare(nameB);
  });
}

/**
 * Build catalogKey → tagIds map from pageIndicators (shared with Indicator Library).
 */
export function buildIndicatorTagIdsByKey(pageIndicators) {
  const map = {};
  for (const ind of pageIndicators || []) {
    if (ind?.catalogKey) {
      map[ind.catalogKey] = Array.isArray(ind.tagIds) ? [...ind.tagIds] : [];
    }
  }
  return map;
}

export function formatTagDate(iso) {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

export function formatTagObjectTypeLabel(objectType) {
  switch (objectType) {
    case TAG_OBJECT_TYPES.HYPEROPT_RESULT:
      return "HYPEROPT_RESULT";
    case TAG_OBJECT_TYPES.MINI_BACKTEST_RESULT:
      return "MINI_BACKTEST_RESULT";
    case TAG_OBJECT_TYPES.STRATEGY:
      return "STRATEGY";
    case TAG_OBJECT_TYPES.INDICATOR:
      return "INDICATOR";
    default:
      return objectType || "—";
  }
}

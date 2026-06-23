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
 * Remove a single tag–object relation.
 * @returns {{ ok: boolean, error?: string, registry, relations, hyperoptResultsRows }}
 */
export function breakRelation({
  relationId,
  tagsRegistry,
  tagRelations,
  hyperoptResultsRows,
  role,
  userId,
}) {
  const relation = (tagRelations || []).find((rel) => rel.id === relationId);
  if (!relation) {
    return { ok: false, error: "Relation not found", tagsRegistry, tagRelations, hyperoptResultsRows };
  }

  const tag = (tagsRegistry || []).find((item) => item.id === relation.tagId);
  if (!canBreakRelation(role, userId, tag)) {
    return { ok: false, error: "Permission denied", tagsRegistry, tagRelations, hyperoptResultsRows };
  }

  const nextRelations = (tagRelations || []).filter((rel) => rel.id !== relationId);
  const nextRows = (hyperoptResultsRows || []).map((row) => {
    if (row.id !== relation.objectId) return row;
    return {
      ...row,
      tagIds: (row.tagIds || []).filter((id) => id !== relation.tagId),
    };
  });

  return {
    ok: true,
    tagsRegistry,
    tagRelations: nextRelations,
    hyperoptResultsRows: nextRows,
  };
}

/**
 * Delete a tag and all its relations globally.
 * @returns {{ ok: boolean, error?: string, tagsRegistry, tagRelations, hyperoptResultsRows }}
 */
export function deleteTagGlobally({
  tagId,
  tagsRegistry,
  tagRelations,
  hyperoptResultsRows,
  role,
  userId,
}) {
  const tag = (tagsRegistry || []).find((item) => item.id === tagId);
  if (!tag) {
    return { ok: false, error: "Tag not found", tagsRegistry, tagRelations, hyperoptResultsRows };
  }
  if (!canDeleteTag(role, userId, tag)) {
    return { ok: false, error: "Permission denied", tagsRegistry, tagRelations, hyperoptResultsRows };
  }

  const nextRegistry = (tagsRegistry || []).filter((item) => item.id !== tagId);
  const nextRelations = (tagRelations || []).filter((rel) => rel.tagId !== tagId);
  const nextRows = (hyperoptResultsRows || []).map((row) => ({
    ...row,
    tagIds: (row.tagIds || []).filter((id) => id !== tagId),
  }));

  return {
    ok: true,
    tagsRegistry: nextRegistry,
    tagRelations: nextRelations,
    hyperoptResultsRows: nextRows,
  };
}

export function getAvailableTagIdsForFilter(hyperoptResultsRows, registry, role, userId) {
  const ids = new Set();
  for (const row of hyperoptResultsRows || []) {
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

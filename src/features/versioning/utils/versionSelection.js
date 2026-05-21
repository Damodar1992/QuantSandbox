import {
  STAGE_TYPES,
  PARENT_STAGE_TYPE,
  STAGE_TYPE_LABELS,
} from "../../../constants/versioning.js";

/**
 * @typedef {Object} StageVersionNode
 * @property {string} id
 * @property {number} strategyId
 * @property {'signal'|'entry'|'exit'|'risk'|'final'} stageType
 * @property {string} lineageCode
 * @property {string|null} parentVersionId
 * @property {number} localVersion
 * @property {string} label
 * @property {string[]} tagNames
 */

/** @type {Record<string, string|null>} */
export const EMPTY_VERSION_SELECTION = {
  signal: null,
  entry: null,
  exit: null,
  risk: null,
  final: null,
};

export function getVersionById(versions, versionId) {
  if (!versionId) return null;
  return versions.find((v) => v.id === versionId) ?? null;
}

export function getVersionsForStage(versions, stageType) {
  return versions.filter((v) => v.stageType === stageType);
}

function lineageDepth(lineageCode) {
  if (!lineageCode) return 0;
  return lineageCode.split(".").length;
}

/**
 * Direct children of selected parent for this stage type.
 * @param {StageVersionNode[]} versions
 * @param {string} stageType
 * @param {Record<string, string|null>} selectedByStage
 */
export function getAvailableVersions(versions, stageType, selectedByStage) {
  const parentType = PARENT_STAGE_TYPE[stageType];
  const stageVersions = getVersionsForStage(versions, stageType);

  if (!parentType) {
    return stageVersions.slice().sort((a, b) => a.localVersion - b.localVersion);
  }

  const parentId = selectedByStage[parentType];
  const parent = getVersionById(versions, parentId);
  if (!parent) return [];

  const parentDepth = lineageDepth(parent.lineageCode);
  const prefix = `${parent.lineageCode}.`;

  return stageVersions
    .filter((v) => {
      if (!v.lineageCode.startsWith(prefix)) return false;
      return lineageDepth(v.lineageCode) === parentDepth + 1;
    })
    .sort((a, b) => a.localVersion - b.localVersion);
}

export function pickDefaultChild(available) {
  return available.length > 0 ? available[0].id : null;
}

/**
 * Default selection along first available branch per stage.
 * @param {StageVersionNode[]} versions
 */
export function createDefaultVersionSelection(versions) {
  /** @type {Record<string, string|null>} */
  const next = { ...EMPTY_VERSION_SELECTION };

  for (const stageType of STAGE_TYPES) {
    const available = getAvailableVersions(versions, stageType, next);
    next[stageType] = pickDefaultChild(available);
  }

  return next;
}

/**
 * Apply version change and cascade to descendants.
 * @param {Record<string, string|null>} selectedByStage
 * @param {string} changedStageType
 * @param {string|null} versionId
 * @param {StageVersionNode[]} versions
 */
export function applyVersionChange(selectedByStage, changedStageType, versionId, versions) {
  const next = { ...selectedByStage, [changedStageType]: versionId };
  const changedIndex = STAGE_TYPES.indexOf(changedStageType);

  for (let i = changedIndex + 1; i < STAGE_TYPES.length; i++) {
    const childType = STAGE_TYPES[i];
    const available = getAvailableVersions(versions, childType, next);
    const current = next[childType];
    const stillValid = current && available.some((v) => v.id === current);
    next[childType] = stillValid ? current : pickDefaultChild(available);
  }

  return next;
}

/**
 * Select full branch from tree node click (ancestors + node + default descendants).
 * @param {StageVersionNode[]} versions
 * @param {StageVersionNode} target
 */
export function selectionFromTreeNode(versions, target) {
  /** @type {Record<string, string|null>} */
  let next = { ...EMPTY_VERSION_SELECTION };
  const chain = [];

  let current = target;
  while (current) {
    chain.unshift(current);
    current = current.parentVersionId
      ? getVersionById(versions, current.parentVersionId)
      : null;
  }

  for (const node of chain) {
    next = applyVersionChange(next, node.stageType, node.id, versions);
  }

  for (const stageType of STAGE_TYPES) {
    if (!next[stageType]) {
      const available = getAvailableVersions(versions, stageType, next);
      next[stageType] = pickDefaultChild(available);
    }
  }

  return next;
}

/**
 * Breadcrumb labels: Signal 1 → Entry 1.2 → …
 * @param {StageVersionNode[]} versions
 * @param {Record<string, string|null>} selectedByStage
 */
export function getVersionBreadcrumb(versions, selectedByStage) {
  return STAGE_TYPES.map((stageType) => {
    const v = getVersionById(versions, selectedByStage[stageType]);
    if (!v) return null;
    return `${STAGE_TYPE_LABELS[stageType]} ${v.lineageCode}`;
  }).filter(Boolean);
}

/**
 * @typedef {Object} TreeLine
 * @property {string} id
 * @property {number} depth
 * @property {string} text
 * @property {string} prefix
 * @property {'signal'|'entry'|'exit'|'risk'|'final'} stageType
 * @property {boolean} isLastSibling
 */

/**
 * Build vertical tree lines for modal (monospace).
 * @param {StageVersionNode[]} versions
 */
export function buildTreeLines(versions) {
  const byParent = new Map();
  for (const v of versions) {
    const key = v.parentVersionId ?? "__root__";
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key).push(v);
  }
  for (const list of byParent.values()) {
    list.sort((a, b) => a.localVersion - b.localVersion);
  }

  /** @type {TreeLine[]} */
  const lines = [];

  function formatTags(tagNames) {
    if (!tagNames?.length) return "";
    return ` [${tagNames.join(", ")}]`;
  }

  function walk(parentId, depth, parentPrefix) {
    const children = byParent.get(parentId ?? "__root__") ?? [];
    children.forEach((node, index) => {
      const isLast = index === children.length - 1;
      const connector = depth === 0 ? "" : isLast ? "└── " : "├── ";
      const linePrefix = depth === 0 ? "" : parentPrefix + connector;
      const tags = formatTags(node.tagNames);
      const text = `${node.label} (${node.lineageCode})${tags}`;

      lines.push({
        id: node.id,
        depth,
        text,
        prefix: linePrefix,
        stageType: node.stageType,
        isLastSibling: isLast,
      });

      const childParentPrefix =
        depth === 0 ? "" : parentPrefix + (isLast ? "    " : "│   ");
      walk(node.id, depth + 1, childParentPrefix);
    });
  }

  walk(null, 0, "");
  return lines;
}

export function formatVersionOptionTitle(version) {
  if (!version) return "";
  return `${version.label} (${version.lineageCode})`;
}

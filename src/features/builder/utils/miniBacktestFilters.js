import { MINI_BACKTEST_RUN_STATUSES } from "../../../constants/miniBacktest";
import { INITIAL_TAGS_REGISTRY } from "../../../constants/tags";
import { formatMiniBacktestStageVersion, resolveMiniBacktestRunStatus } from "./miniBacktestDisplay";
import { getStageLabel } from "./stageSelect";

const MOCK_TAG_POOL = INITIAL_TAGS_REGISTRY.map((tag) => tag.id);

/** Deterministic mock tags per run (until wired to hyperopt tag relations). */
export function resolveMiniBacktestTagIds(entry) {
  if (Array.isArray(entry?.tagIds) && entry.tagIds.length > 0) {
    return entry.tagIds;
  }

  const id = String(entry?.id ?? entry?.epochId ?? "0");
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash + id.charCodeAt(i) * (i + 1)) % 997;
  }

  const first = MOCK_TAG_POOL[hash % MOCK_TAG_POOL.length];
  const second = MOCK_TAG_POOL[(hash + 3) % MOCK_TAG_POOL.length];
  return hash % 3 === 0 ? [first, second].filter((tagId, idx, arr) => arr.indexOf(tagId) === idx) : [first];
}

export function getMiniBacktestStageKey(entry) {
  if (entry?.stageId != null) return String(entry.stageId);
  return entry?.stage || "";
}

export function getMiniBacktestVersionKey(entry) {
  return entry?.stageVersionLineage || entry?.stageVersionLabel || "";
}

export const EMPTY_MINI_BACKTEST_FILTERS = {
  stage: "",
  version: "",
  status: "",
  tags: [],
};

export function getMiniBacktestFilterOptions(results = []) {
  const stageMap = new Map();
  const versionSet = new Set();
  const statusSet = new Set();
  const tagSet = new Set();

  for (const entry of results) {
    const stageKey = getMiniBacktestStageKey(entry);
    if (stageKey) {
      const stageId = entry.stageId ?? Number(stageKey);
      const label = entry.stageId != null ? getStageLabel(entry.stageId) : entry.stage || stageKey;
      stageMap.set(stageKey, label);
    }

    const versionKey = getMiniBacktestVersionKey(entry);
    if (versionKey) versionSet.add(versionKey);

    statusSet.add(resolveMiniBacktestRunStatus(entry));

    for (const tagId of resolveMiniBacktestTagIds(entry)) {
      tagSet.add(tagId);
    }
  }

  const stages = [...stageMap.entries()]
    .map(([value, label]) => ({ value, label }))
    .sort((a, b) => Number(a.value) - Number(b.value));

  const versions = [...versionSet]
    .sort()
    .map((value) => ({
      value,
      label: value.includes(".") ? `v${value}` : value,
    }));

  const statuses = [...statusSet].sort((a, b) => {
    const order = [
      MINI_BACKTEST_RUN_STATUSES.IN_PROGRESS,
      MINI_BACKTEST_RUN_STATUSES.FINISHED,
      MINI_BACKTEST_RUN_STATUSES.FAIL,
    ];
    return order.indexOf(a) - order.indexOf(b);
  });

  const tags = [...tagSet]
    .map((id) => ({
      id,
      name: INITIAL_TAGS_REGISTRY.find((tag) => tag.id === id)?.name || id,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return { stages, versions, statuses, tags };
}

export function filterMiniBacktestResults(results = [], filters = EMPTY_MINI_BACKTEST_FILTERS) {
  const { stage, version, status, tags } = filters;

  return results.filter((entry) => {
    if (stage && getMiniBacktestStageKey(entry) !== stage) return false;
    if (version && getMiniBacktestVersionKey(entry) !== version) return false;
    if (status && resolveMiniBacktestRunStatus(entry) !== status) return false;
    if (tags.length > 0) {
      const entryTags = resolveMiniBacktestTagIds(entry);
      if (!tags.some((tagId) => entryTags.includes(tagId))) return false;
    }
    return true;
  });
}

export function countActiveMiniBacktestFilters(filters = EMPTY_MINI_BACKTEST_FILTERS) {
  let count = 0;
  if (filters.stage) count += 1;
  if (filters.version) count += 1;
  if (filters.status) count += 1;
  if (filters.tags?.length) count += 1;
  return count;
}

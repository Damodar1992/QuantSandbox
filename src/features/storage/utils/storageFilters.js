/**

 * Filtering logic for the Storage feature.

 *

 * Filters narrow visible rows; selection is independent.

 * Parent rows stay visible when at least one descendant hyperopt matches.

 */



import { STAGE_ORDER } from "../../../constants/storageMock";

import { flattenHyperopts } from "./storageTree";



export const EMPTY_FILTERS = {

  strategyName: "",

  stageTypes: [],

  timeframes: [],

  tagIds: [],

  statuses: [],

  ownerLogins: [],

  minSizeGb: "",

  maxSizeGb: "",

};



function matchesAny(value, selected) {

  if (!selected?.length) return true;

  return selected.includes(value);

}



export function hasActiveFilters(filters) {

  return Boolean(

    filters.strategyName ||

      filters.stageTypes?.length > 0 ||

      filters.timeframes?.length > 0 ||

      filters.tagIds?.length > 0 ||

      filters.statuses?.length > 0 ||

      filters.ownerLogins?.length > 0 ||

      filters.minSizeGb !== "" ||

      filters.maxSizeGb !== "",

  );

}



function hyperoptMatchesFilter(h, filters, strategy) {

  const ownerLogin = h.ownerLogin ?? strategy.ownerLogin;



  if (!matchesAny(h.timeframe, filters.timeframes)) return false;



  if (filters.tagIds?.length > 0) {

    const hTags = new Set(h.tagIds ?? []);

    if (!filters.tagIds.some((t) => hTags.has(t))) return false;

  }



  if (!matchesAny(h.status, filters.statuses)) return false;



  if (!matchesAny(ownerLogin, filters.ownerLogins)) return false;



  const min = filters.minSizeGb !== "" ? parseFloat(filters.minSizeGb) : null;

  const max = filters.maxSizeGb !== "" ? parseFloat(filters.maxSizeGb) : null;

  if (min !== null && !isNaN(min) && (h.rawSizeGb ?? 0) < min) return false;

  if (max !== null && !isNaN(max) && (h.rawSizeGb ?? 0) > max) return false;



  return true;

}



function versionMatchesFilter(sv, filters, strategy) {

  return (sv.hyperopts ?? []).some((h) => hyperoptMatchesFilter(h, filters, strategy));

}



function stageMatchesFilter(versions, stageType, filters, strategy) {

  if (filters.stageTypes?.length > 0 && !filters.stageTypes.includes(stageType)) return false;

  return versions.some((sv) => versionMatchesFilter(sv, filters, strategy));

}



function strategyMatchesFilter(strategy, filters) {

  if (filters.strategyName) {

    const q = filters.strategyName.toLowerCase();

    if (!strategy.name.toLowerCase().includes(q)) return false;

  }



  if (filters.ownerLogins?.length > 0) {

    const strategyOwnerHit = filters.ownerLogins.includes(strategy.ownerLogin);

    const hyperoptOwnerHit = flattenHyperopts(strategy).some((h) =>

      filters.ownerLogins.includes(h.ownerLogin ?? strategy.ownerLogin),

    );

    if (!strategyOwnerHit && !hyperoptOwnerHit) return false;

  }



  const stageGroups = {};

  for (const sv of strategy.stageVersions ?? []) {

    if (!stageGroups[sv.stageType]) stageGroups[sv.stageType] = [];

    stageGroups[sv.stageType].push(sv);

  }



  return Object.entries(stageGroups).some(([stageType, versions]) =>

    stageMatchesFilter(versions, stageType, filters, strategy),

  );

}



/**

 * Returns a filtered view of strategies for display.

 * Each strategy/stage/version only appears if at least one hyperopt passes.

 */

export function filterStrategies(strategies, filters) {

  if (!hasActiveFilters(filters)) return strategies;



  const result = [];

  for (const strategy of strategies) {

    if (!strategyMatchesFilter(strategy, filters)) continue;



    const filteredVersions = (strategy.stageVersions ?? [])

      .filter((sv) => {

        if (filters.stageTypes?.length > 0 && !filters.stageTypes.includes(sv.stageType)) {

          return false;

        }

        return versionMatchesFilter(sv, filters, strategy);

      })

      .map((sv) => ({

        ...sv,

        hyperopts: (sv.hyperopts ?? []).filter((h) => hyperoptMatchesFilter(h, filters, strategy)),

      }));



    result.push({ ...strategy, stageVersions: filteredVersions });

  }

  return result;

}



/** Collect distinct timeframe values across all strategies. */

export function collectTimeframes(strategies) {

  const set = new Set();

  for (const s of strategies) {

    for (const sv of s.stageVersions ?? []) {

      for (const h of sv.hyperopts ?? []) {

        if (h.timeframe) set.add(h.timeframe);

      }

    }

  }

  return [...set].sort();

}



/** Collect distinct status values. */

export function collectStatuses(strategies) {

  const set = new Set();

  for (const s of strategies) {

    for (const sv of s.stageVersions ?? []) {

      for (const h of sv.hyperopts ?? []) {

        if (h.status) set.add(h.status);

      }

    }

  }

  return [...set];

}



/** Collect distinct owner logins from strategies and hyperopts. */

export function collectOwners(strategies) {

  const set = new Set();

  for (const s of strategies ?? []) {

    if (s.ownerLogin) set.add(s.ownerLogin);

    for (const h of flattenHyperopts(s)) {

      const owner = h.ownerLogin ?? s.ownerLogin;

      if (owner) set.add(owner);

    }

  }

  return [...set].sort();

}



export const STAGE_TYPE_LABELS = {

  signal: "Signal",

  entry: "Entry",

  exit: "Exit",

  risk: "Risk",

};



export const STAGE_TYPE_OPTIONS = Object.entries(STAGE_ORDER)

  .sort(([, a], [, b]) => a - b)

  .map(([k]) => ({ value: k, label: STAGE_TYPE_LABELS[k] ?? k }));



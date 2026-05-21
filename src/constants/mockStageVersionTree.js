/**
 * Mock stage version trees per strategy (lineage from TZ example).
 * @typedef {import('../features/versioning/utils/versionSelection.js').StageVersionNode} StageVersionNode
 */

/** @type {Record<number, StageVersionNode[]>} */
export const MOCK_STAGE_VERSIONS_BY_STRATEGY = {
  1: buildEmaBounceTree(1),
  2: buildShortTree(2),
};

function node({
  id,
  strategyId,
  stageType,
  lineageCode,
  parentVersionId = null,
  localVersion,
  label,
  tagNames = [],
}) {
  return {
    id,
    strategyId,
    stageType,
    lineageCode,
    parentVersionId,
    localVersion,
    label,
    tagNames,
  };
}

/** Full tree from TZ (EMA Bounce, strategy id 1). */
function buildEmaBounceTree(strategyId) {
  const s1 = node({
    id: "sv-1-1",
    strategyId,
    stageType: "signal",
    lineageCode: "1",
    localVersion: 1,
    label: "Signal v1",
    tagNames: ["core", "trend"],
  });
  const s2 = node({
    id: "sv-1-2",
    strategyId,
    stageType: "signal",
    lineageCode: "2",
    localVersion: 2,
    label: "Signal v2",
    tagNames: ["experimental"],
  });
  const s3 = node({
    id: "sv-1-3",
    strategyId,
    stageType: "signal",
    lineageCode: "3",
    localVersion: 3,
    label: "Signal v3",
    tagNames: ["legacy"],
  });

  const versions = [s1, s2, s3];

  const addBranch = (signalId, signalLineage, entries) => {
    entries.forEach((entryDef) => {
      const entryId = `sv-${strategyId}-e-${entryDef.code.replace(/\./g, "-")}`;
      const entry = node({
        id: entryId,
        strategyId,
        stageType: "entry",
        lineageCode: entryDef.code,
        parentVersionId: signalId,
        localVersion: entryDef.local,
        label: entryDef.label,
        tagNames: entryDef.tags ?? [],
      });
      versions.push(entry);

      entryDef.exits.forEach((exitDef) => {
        const exitId = `sv-${strategyId}-x-${exitDef.code.replace(/\./g, "-")}`;
        const exit = node({
          id: exitId,
          strategyId,
          stageType: "exit",
          lineageCode: exitDef.code,
          parentVersionId: entryId,
          localVersion: exitDef.local,
          label: exitDef.label,
          tagNames: exitDef.tags ?? [],
        });
        versions.push(exit);

        const riskCode = `${exitDef.code}.1`;
        const riskId = `sv-${strategyId}-r-${riskCode.replace(/\./g, "-")}`;
        const risk = node({
          id: riskId,
          strategyId,
          stageType: "risk",
          lineageCode: riskCode,
          parentVersionId: exitId,
          localVersion: 1,
          label: "Risk v1",
          tagNames: exitDef.riskTags ?? [],
        });
        versions.push(risk);

        const finalCode = `${riskCode}.1`;
        versions.push(
          node({
            id: `sv-${strategyId}-f-${finalCode.replace(/\./g, "-")}`,
            strategyId,
            stageType: "final",
            lineageCode: finalCode,
            parentVersionId: riskId,
            localVersion: 1,
            label: "Final v1",
            tagNames: exitDef.finalTags ?? [],
          }),
        );
      });
    });
  };

  addBranch(s1.id, "1", [
    {
      code: "1.1",
      local: 1,
      label: "Entry v1",
      tags: ["conservative"],
      exits: [
        { code: "1.1.1", local: 1, label: "Exit v1", tags: ["base"] },
        { code: "1.1.2", local: 2, label: "Exit v2", tags: ["fast-exit"] },
      ],
    },
    {
      code: "1.2",
      local: 2,
      label: "Entry v2",
      tags: ["aggressive"],
      exits: [
        { code: "1.2.1", local: 1, label: "Exit v1" },
        { code: "1.2.2", local: 2, label: "Exit v2", tags: ["selected", "breakout"] },
        { code: "1.2.3", local: 3, label: "Exit v3" },
      ],
    },
    {
      code: "1.3",
      local: 3,
      label: "Entry v3",
      exits: [{ code: "1.3.1", local: 1, label: "Exit v1" }],
    },
  ]);

  addBranch(s2.id, "2", [
    {
      code: "2.1",
      local: 1,
      label: "Entry v1",
      tags: ["momentum"],
      exits: [{ code: "2.1.1", local: 1, label: "Exit v1" }],
    },
    {
      code: "2.2",
      local: 2,
      label: "Entry v2",
      exits: [{ code: "2.2.1", local: 1, label: "Exit v1" }],
    },
  ]);

  addBranch(s3.id, "3", [
    {
      code: "3.1",
      local: 1,
      label: "Entry v1",
      exits: [{ code: "3.1.1", local: 1, label: "Exit v1" }],
    },
  ]);

  return versions;
}

/** Short chain for second strategy. */
function buildShortTree(strategyId) {
  const s1 = node({
    id: `sv-${strategyId}-sig-1`,
    strategyId,
    stageType: "signal",
    lineageCode: "1",
    localVersion: 1,
    label: "Signal v1",
    tagNames: ["default"],
  });
  const e1 = node({
    id: `sv-${strategyId}-ent-1-1`,
    strategyId,
    stageType: "entry",
    lineageCode: "1.1",
    parentVersionId: s1.id,
    localVersion: 1,
    label: "Entry v1",
  });
  const x1 = node({
    id: `sv-${strategyId}-ext-1-1-1`,
    strategyId,
    stageType: "exit",
    lineageCode: "1.1.1",
    parentVersionId: e1.id,
    localVersion: 1,
    label: "Exit v1",
  });
  const r1 = node({
    id: `sv-${strategyId}-risk-1-1-1-1`,
    strategyId,
    stageType: "risk",
    lineageCode: "1.1.1.1",
    parentVersionId: x1.id,
    localVersion: 1,
    label: "Risk v1",
  });
  const f1 = node({
    id: `sv-${strategyId}-fin-1-1-1-1-1`,
    strategyId,
    stageType: "final",
    lineageCode: "1.1.1.1.1",
    parentVersionId: r1.id,
    localVersion: 1,
    label: "Final v1",
  });
  return [s1, e1, x1, r1, f1];
}

export function getStageVersionsForStrategy(strategyId) {
  return MOCK_STAGE_VERSIONS_BY_STRATEGY[strategyId] ?? MOCK_STAGE_VERSIONS_BY_STRATEGY[1];
}

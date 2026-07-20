/**
 * Hierarchical storage table.
 *
 * Levels (expandable):
 *   Strategy → Stage (grouped by stageType) → Stage Version → Hyperopt
 *
 * Columns: ☐ | Name | Owner | Pairs | Timeframe | Status | RAW Size
 * Entity type shown as a colored tag; levels differ by bg, indent, tree guides, tag color.
 */

import React, { useMemo } from "react";
import { cx, ui } from "../../constants/ui";
import { TriStateCheckbox } from "./TriStateCheckbox";
import { AppBadge } from "../common/AppBadge";
import { groupVersionsByStage, strategySize, stageSize, versionSize } from "../../features/storage/utils/storageTree";
import { STAGE_TYPE_LABELS } from "../../features/storage/utils/storageFilters";

const TD = "px-2 py-2.5 border-b border-[#303030]";
const TD_MUTED = `${TD} text-[#a6a6a6]`;
const TD_MAIN = `${TD} text-[#d9d9d9]`;

/** Depth in rem for Name indent (tree gutter width per level) */
const DEPTH_PAD = {
  strategy: "pl-0",
  stage: "pl-7",
  version: "pl-14",
  hyperopt: "pl-[5.25rem]",
};

const LEVEL = {
  strategy: {
    row: "bg-[#2a2048] hover:bg-[#34285a] transition-colors",
    tag: "border-violet-400/60 bg-violet-500/25 text-violet-200 font-semibold",
    guide: "bg-violet-400",
  },
  stage: {
    row: "bg-[#1a2438] hover:bg-[#22304a] transition-colors",
    tag: "border-sky-400/50 bg-sky-500/20 text-sky-200 font-semibold",
    guide: "bg-sky-400",
  },
  version: {
    row: "bg-[#1c1c1c] hover:bg-[#262626] transition-colors",
    tag: "border-amber-400/45 bg-amber-500/15 text-amber-200 font-semibold",
    guide: "bg-amber-400/80",
  },
  hyperopt: {
    row: "bg-[#0c0c0c] hover:bg-[#161616] transition-colors",
    tag: "border-[#505050] bg-[#1a1a1a] text-[#b0b0b0]",
    guide: "bg-[#606060]",
  },
};

function EntityTag({ type, level }) {
  return (
    <span
      className={cx(
        "shrink-0 rounded border px-1.5 py-0.5 text-[10px] uppercase tracking-wide",
        LEVEL[level]?.tag,
      )}
    >
      {type}
    </span>
  );
}

/** Tree indent gutter with a visible vertical guide bar for nested levels */
function NameCell({ level, children }) {
  const depth = level === "strategy" ? 0 : level === "stage" ? 1 : level === "version" ? 2 : 3;
  return (
    <td className={cx(TD_MAIN, "font-medium")}>
      <div className={cx("relative flex items-center gap-2 min-w-0", DEPTH_PAD[level])}>
        {depth > 0 && (
          <span
            className={cx(
              "absolute top-0 bottom-0 w-[3px] rounded-full opacity-90",
              LEVEL[level].guide,
            )}
            style={{ left: `${(depth - 1) * 1.75 + 0.35}rem` }}
            aria-hidden
          />
        )}
        {children}
      </div>
    </td>
  );
}

function SizeBar({ sizeGb, maxGb, className }) {
  if (!maxGb || maxGb === 0) return <span className="text-[#8c8c8c]">—</span>;
  const pct = Math.min((sizeGb / maxGb) * 100, 100);
  const color = sizeGb === 0 ? "bg-[#303030]" : "bg-violet-500/60";
  return (
    <div className={cx("flex items-center gap-1.5", className)}>
      <div className="w-14 h-1 rounded-full bg-[#0f0f0f] border border-[#303030] overflow-hidden flex-shrink-0">
        <div className={cx("h-full rounded-full", color)} style={{ width: `${pct}%` }} />
      </div>
      <span className="tabular-nums text-[11px] text-[#d9d9d9]">
        {sizeGb === 0 ? <span className="text-[#8c8c8c]">0 GB</span> : `${sizeGb.toFixed(1)} GB`}
      </span>
    </div>
  );
}

function Chevron({ open }) {
  return (
    <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded border border-[#404040] bg-[#141414] text-[9px] text-[#d9d9d9]" aria-hidden>
      {open ? "▼" : "▶"}
    </span>
  );
}

function OwnerCell({ ownerLogin }) {
  if (!ownerLogin) return <td className={TD} />;
  return (
    <td className={TD}>
      <span className="text-[11px] text-[#a6a6a6]">{ownerLogin}</span>
    </td>
  );
}

function HyperoptRow({ hyperopt, maxGb, checked, onChange, processing }) {
  const isProcessing = processing?.has(hyperopt.id);
  return (
    <tr className={cx(LEVEL.hyperopt.row, isProcessing && "opacity-60 animate-pulse")}>
      <td className={cx(TD, "px-4 w-10")}>
        <TriStateCheckbox
          state={checked ? "selected" : "none"}
          onChange={onChange}
          disabled={hyperopt.status === "Raw data deleted" || hyperopt.status === "Running"}
        />
      </td>
      <NameCell level="hyperopt">
        <EntityTag type="Hyperopt" level="hyperopt" />
        <span className="font-mono text-[11px] text-[#a6a6a6] truncate">{hyperopt.id}</span>
        {hyperopt.comment && (
          <span className="text-[10px] text-[#8c8c8c] italic truncate">{hyperopt.comment}</span>
        )}
      </NameCell>
      <OwnerCell ownerLogin={hyperopt.ownerLogin} />
      <td className={TD_MAIN}>
        <span className="font-mono text-[11px]">{hyperopt.pairs}</span>
      </td>
      <td className={TD}>
        <span className="rounded border border-[#303030] bg-[#0f0f0f] px-1.5 py-0.5 text-[10px] font-mono text-[#d9d9d9]">
          {hyperopt.timeframe}
        </span>
      </td>
      <td className={TD}>
        <AppBadge status={hyperopt.status} />
      </td>
      <td className={TD}>
        <SizeBar sizeGb={hyperopt.rawSizeGb} maxGb={maxGb} />
      </td>
    </tr>
  );
}

function VersionRow({ version, strategy, expanded, onToggleExpand, onToggleVersion, getVersionState, maxGb, selectedHyperoptIds, onToggleHyperopt, deleteOp }) {
  const state = getVersionState(strategy, version.id);
  const size = versionSize(version);
  const isExpanded = expanded.has(version.id);
  const stageLabel = STAGE_TYPE_LABELS[version.stageType] ?? version.stageType;

  return (
    <>
      <tr className={cx(LEVEL.version.row, "cursor-pointer")} onClick={() => onToggleExpand(version.id)}>
        <td className={cx(TD, "px-4 w-10")}>
          <div onClick={(e) => e.stopPropagation()}>
            <TriStateCheckbox
              state={state}
              onChange={() => onToggleVersion(strategy, version.id)}
            />
          </div>
        </td>
        <NameCell level="version">
          <Chevron open={isExpanded} />
          <EntityTag type="Version" level="version" />
          <span>v{version.versionNumber}</span>
          <span className="text-[10px] text-[#8c8c8c] font-normal">
            {stageLabel}
            {" · "}
            {version.hyperopts?.length ?? 0} hyperopts
          </span>
        </NameCell>
        <OwnerCell ownerLogin={null} />
        <td className={TD} />
        <td className={TD} />
        <td className={TD} />
        <td className={TD}>
          <SizeBar sizeGb={size} maxGb={maxGb} />
        </td>
      </tr>

      {isExpanded &&
        (version.hyperopts ?? []).map((h) => (
          <HyperoptRow
            key={h.id}
            hyperopt={h}
            maxGb={maxGb}
            checked={selectedHyperoptIds.has(h.id)}
            onChange={() => onToggleHyperopt(h.id)}
            processing={deleteOp?.processingIds}
          />
        ))}
    </>
  );
}

function StageRow({ stageType, versions, strategy, expanded, onToggleExpand, onToggleStage, getStageState, getVersionState, maxGb, selectedHyperoptIds, onToggleVersion, onToggleHyperopt, deleteOp }) {
  const stageKey = `stage-${strategy.id}-${stageType}`;
  const isExpanded = expanded.has(stageKey);
  const state = getStageState(strategy, stageType);
  const size = stageSize(strategy, stageType);

  return (
    <>
      <tr className={cx(LEVEL.stage.row, "cursor-pointer")} onClick={() => onToggleExpand(stageKey)}>
        <td className={cx(TD, "px-4 w-10")}>
          <div onClick={(e) => e.stopPropagation()}>
            <TriStateCheckbox
              state={state}
              onChange={() => onToggleStage(strategy, stageType)}
            />
          </div>
        </td>
        <NameCell level="stage">
          <Chevron open={isExpanded} />
          <EntityTag type="Stage" level="stage" />
          <span>{STAGE_TYPE_LABELS[stageType] ?? stageType}</span>
          <span className="text-[10px] text-[#8c8c8c] font-normal">
            ({versions.length} version{versions.length !== 1 ? "s" : ""})
          </span>
        </NameCell>
        <OwnerCell ownerLogin={null} />
        <td className={TD} />
        <td className={TD} />
        <td className={TD} />
        <td className={TD}>
          <SizeBar sizeGb={size} maxGb={maxGb} />
        </td>
      </tr>

      {isExpanded &&
        versions.map((version) => (
          <VersionRow
            key={version.id}
            version={version}
            strategy={strategy}
            expanded={expanded}
            onToggleExpand={onToggleExpand}
            onToggleVersion={onToggleVersion}
            getVersionState={getVersionState}
            maxGb={maxGb}
            selectedHyperoptIds={selectedHyperoptIds}
            onToggleHyperopt={onToggleHyperopt}
            deleteOp={deleteOp}
          />
        ))}
    </>
  );
}

function StrategyRow({ strategy, expanded, onToggleExpand, onToggleStrategy, getStrategyState, getStageState, getVersionState, maxGb, selectedHyperoptIds, onToggleStage, onToggleVersion, onToggleHyperopt, deleteOp }) {
  const isExpanded = expanded.has(strategy.id);
  const state = getStrategyState(strategy);
  const size = strategySize(strategy);
  const stageGroups = groupVersionsByStage(strategy);

  return (
    <>
      <tr className={cx(LEVEL.strategy.row, "cursor-pointer")} onClick={() => onToggleExpand(strategy.id)}>
        <td className={cx(TD, "px-4 w-10")}>
          <div onClick={(e) => e.stopPropagation()}>
            <TriStateCheckbox
              state={state}
              onChange={() => onToggleStrategy(strategy)}
            />
          </div>
        </td>
        <NameCell level="strategy">
          <Chevron open={isExpanded} />
            <EntityTag type="Strategy" level="strategy" />
            <span className="text-[13px]">{strategy.name}</span>
            <span className="text-[10px] text-[#8c8c8c] font-normal">
              {strategy.stageVersions?.length ?? 0} versions
            </span>
        </NameCell>
        <OwnerCell ownerLogin={strategy.ownerLogin} />
        <td className={TD} />
        <td className={TD} />
        <td className={TD} />
        <td className={TD}>
          <SizeBar sizeGb={size} maxGb={maxGb} />
        </td>
      </tr>

      {isExpanded &&
        stageGroups.map(([stageType, versions]) => (
          <StageRow
            key={`${strategy.id}-${stageType}`}
            stageType={stageType}
            versions={versions}
            strategy={strategy}
            expanded={expanded}
            onToggleExpand={onToggleExpand}
            onToggleStage={onToggleStage}
            getStageState={getStageState}
            getVersionState={getVersionState}
            maxGb={maxGb}
            selectedHyperoptIds={selectedHyperoptIds}
            onToggleVersion={onToggleVersion}
            onToggleHyperopt={onToggleHyperopt}
            deleteOp={deleteOp}
          />
        ))}
    </>
  );
}

export function StorageTable({
  strategies,
  allStrategies,
  selectedHyperoptIds,
  expandedIds,
  onToggleExpand,
  onToggleStrategy,
  onToggleStage,
  onToggleVersion,
  onToggleHyperopt,
  getStrategyState,
  getStageState,
  getVersionState,
  deleteOp,
}) {
  const maxGb = useMemo(() => {
    let m = 0;
    for (const s of allStrategies ?? []) {
      const sz = strategySize(s);
      if (sz > m) m = sz;
    }
    return m || 1;
  }, [allStrategies]);

  if (!strategies || strategies.length === 0) {
    return (
      <div className={cx(ui.radius, ui.panel, "overflow-hidden")}>
        <div className="px-4 py-12 text-center text-[12px] text-[#8c8c8c]">
          No strategies match the current filters.
        </div>
      </div>
    );
  }

  return (
    <div className={cx(ui.radius, ui.panel, "overflow-hidden")}>
      <div className="overflow-auto">
        <table className="w-full border-collapse text-[12px]">
          <thead className="bg-[#1f1f1f] text-left text-[12px] text-[#8c8c8c]">
            <tr>
              <th className="px-4 py-3 border-b border-[#303030] font-medium w-10" />
              <th className="px-2 py-3 border-b border-[#303030] font-medium">Name</th>
              <th className="px-2 py-3 border-b border-[#303030] font-medium">Owner</th>
              <th className="px-2 py-3 border-b border-[#303030] font-medium">Pairs</th>
              <th className="px-2 py-3 border-b border-[#303030] font-medium">Timeframe</th>
              <th className="px-2 py-3 border-b border-[#303030] font-medium">Status</th>
              <th className="px-2 py-3 border-b border-[#303030] font-medium">RAW Size</th>
            </tr>
          </thead>
          <tbody>
            {strategies.map((strategy) => (
              <StrategyRow
                key={strategy.id}
                strategy={strategy}
                expanded={expandedIds}
                onToggleExpand={onToggleExpand}
                onToggleStrategy={onToggleStrategy}
                getStrategyState={getStrategyState}
                getStageState={getStageState}
                getVersionState={getVersionState}
                maxGb={maxGb}
                selectedHyperoptIds={selectedHyperoptIds}
                onToggleStage={onToggleStage}
                onToggleVersion={onToggleVersion}
                onToggleHyperopt={onToggleHyperopt}
                deleteOp={deleteOp}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

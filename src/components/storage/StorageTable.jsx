/**
 * Hierarchical storage table.
 *
 * Levels (expandable):
 *   Strategy → Stage (grouped by stageType) → Stage Version → Hyperopt
 *
 * Columns: ☐ | Name/Info | Stage | Version | Pairs | Timeframe | Status | RAW Size | Actions
 */

import React, { useMemo } from "react";
import { cx } from "../../constants/ui";
import { TriStateCheckbox } from "./TriStateCheckbox";
import { AppBadge } from "../common/AppBadge";
import { groupVersionsByStage, strategySize, stageSize, versionSize } from "../../features/storage/utils/storageTree";
import { STAGE_TYPE_LABELS } from "../../features/storage/utils/storageFilters";

// ─── Size bar ────────────────────────────────────────────────────────────────

function SizeBar({ sizeGb, maxGb, className }) {
  if (!maxGb || maxGb === 0) return <span className="text-muted-foreground">—</span>;
  const pct = Math.min((sizeGb / maxGb) * 100, 100);
  const color = sizeGb === 0 ? "bg-muted-foreground/20" : "bg-violet-500/60";
  return (
    <div className={cx("flex items-center gap-1.5", className)}>
      <div className="w-14 h-1 rounded-full bg-white/10 overflow-hidden flex-shrink-0">
        <div className={cx("h-full rounded-full", color)} style={{ width: `${pct}%` }} />
      </div>
      <span className="tabular-nums text-[11px]">
        {sizeGb === 0 ? <span className="text-muted-foreground/50">0 GB</span> : `${sizeGb.toFixed(1)} GB`}
      </span>
    </div>
  );
}

// ─── Chevron ─────────────────────────────────────────────────────────────────

function Chevron({ open }) {
  return (
    <svg
      className={cx("h-3.5 w-3.5 transition-transform text-muted-foreground", open && "rotate-90")}
      viewBox="0 0 12 12"
      fill="none"
    >
      <path d="M4.5 3l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Hyperopt row ─────────────────────────────────────────────────────────────

function HyperoptRow({ hyperopt, maxGb, checked, onChange, processing }) {
  const isProcessing = processing?.has(hyperopt.id);
  return (
    <tr
      className={cx(
        "border-b border-border/30 text-[11px] transition-colors",
        isProcessing && "opacity-60 animate-pulse",
      )}
    >
      <td className="pl-16 pr-2 py-2 w-8">
        <TriStateCheckbox
          state={checked ? "selected" : "none"}
          onChange={onChange}
          disabled={hyperopt.status === "Raw data deleted" || hyperopt.status === "Running"}
        />
      </td>
      <td className="px-3 py-2 text-muted-foreground">
        <span className="font-mono text-[10px]">{hyperopt.id}</span>
        {hyperopt.comment && (
          <span className="ml-2 text-[10px] text-muted-foreground/60 italic">{hyperopt.comment}</span>
        )}
      </td>
      <td className="px-3 py-2 text-muted-foreground">—</td>
      <td className="px-3 py-2">
        <span className="font-mono">{hyperopt.pairs}</span>
      </td>
      <td className="px-3 py-2">
        <span className="rounded border border-border bg-background/60 px-1 py-0.5 text-[10px] font-mono">
          {hyperopt.timeframe}
        </span>
      </td>
      <td className="px-3 py-2">
        <AppBadge status={hyperopt.status} />
      </td>
      <td className="px-3 py-2">
        <SizeBar sizeGb={hyperopt.rawSizeGb} maxGb={maxGb} />
      </td>
    </tr>
  );
}

// ─── Version row ──────────────────────────────────────────────────────────────

function VersionRow({ version, strategy, expanded, onToggleExpand, onToggleVersion, getVersionState, maxGb, selectedHyperoptIds, onToggleHyperopt, deleteOp }) {
  const state = getVersionState(strategy, version.id);
  const size = versionSize(version);
  const isExpanded = expanded.has(version.id);

  return (
    <>
      <tr
        className="border-b border-border/20 bg-[#0f0a1e]/40 text-[11px] cursor-pointer hover:bg-accent/10 transition-colors"
        onClick={() => onToggleExpand(version.id)}
      >
        <td className="pl-10 pr-2 py-2 w-8">
          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            <TriStateCheckbox
              state={state}
              onChange={() => onToggleVersion(strategy, version.id)}
            />
          </div>
        </td>
        <td className="px-3 py-2 font-medium text-foreground/80">
          <div className="flex items-center gap-1.5">
            <Chevron open={isExpanded} />
            <span className="text-[10px] text-muted-foreground mr-1">v</span>
            {version.versionNumber}
          </div>
        </td>
        <td className="px-3 py-2 text-muted-foreground">
          {STAGE_TYPE_LABELS[version.stageType] ?? version.stageType}
        </td>
        <td className="px-3 py-2 text-muted-foreground font-mono text-[10px]">
          {version.parentVersionId ? `← ${version.parentVersionId.replace("sv-", "")}` : "root"}
        </td>
        <td className="px-3 py-2 text-muted-foreground">
          {version.hyperopts?.length ?? 0} hyperopts
        </td>
        <td className="px-3 py-2" />
        <td className="px-3 py-2">
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

// ─── Stage row ────────────────────────────────────────────────────────────────

function StageRow({ stageType, versions, strategy, expanded, onToggleExpand, onToggleStage, getStageState, getVersionState, maxGb, selectedHyperoptIds, onToggleVersion, onToggleHyperopt, deleteOp }) {
  const stageKey = `stage-${strategy.id}-${stageType}`;
  const isExpanded = expanded.has(stageKey);
  const state = getStageState(strategy, stageType);
  const size = stageSize(strategy, stageType);

  return (
    <>
      <tr
        className="border-b border-border/30 bg-[#110b20]/60 text-[11px] cursor-pointer hover:bg-accent/10 transition-colors"
        onClick={() => onToggleExpand(stageKey)}
      >
        <td className="pl-6 pr-2 py-2 w-8">
          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            <TriStateCheckbox
              state={state}
              onChange={() => onToggleStage(strategy, stageType)}
            />
          </div>
        </td>
        <td className="px-3 py-2 font-medium text-foreground/90" colSpan={3}>
          <div className="flex items-center gap-1.5">
            <Chevron open={isExpanded} />
            {STAGE_TYPE_LABELS[stageType] ?? stageType}
            <span className="text-[10px] text-muted-foreground">({versions.length} version{versions.length !== 1 ? "s" : ""})</span>
          </div>
        </td>
        <td className="px-3 py-2 text-muted-foreground" />
        <td className="px-3 py-2" />
        <td className="px-3 py-2">
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

// ─── Strategy row ─────────────────────────────────────────────────────────────

function StrategyRow({ strategy, expanded, onToggleExpand, onToggleStrategy, getStrategyState, getStageState, getVersionState, maxGb, selectedHyperoptIds, onToggleStage, onToggleVersion, onToggleHyperopt, deleteOp }) {
  const isExpanded = expanded.has(strategy.id);
  const state = getStrategyState(strategy);
  const size = strategySize(strategy);
  const stageGroups = groupVersionsByStage(strategy);

  return (
    <>
      <tr
        className="border-b border-border/40 bg-[#120b22]/80 text-[12px] cursor-pointer hover:bg-accent/10 transition-colors"
        onClick={() => onToggleExpand(strategy.id)}
      >
        <td className="pl-3 pr-2 py-2.5 w-8">
          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            <TriStateCheckbox
              state={state}
              onChange={() => onToggleStrategy(strategy)}
            />
          </div>
        </td>
        <td className="px-3 py-2.5 font-semibold text-foreground" colSpan={3}>
          <div className="flex items-center gap-2">
            <Chevron open={isExpanded} />
            {strategy.name}
            <span className="text-[10px] text-muted-foreground font-normal">
              by {strategy.ownerLogin}
            </span>
          </div>
        </td>
        <td className="px-3 py-2.5 text-muted-foreground text-[11px]">
          {strategy.stageVersions?.length ?? 0} versions
        </td>
        <td className="px-3 py-2.5" />
        <td className="px-3 py-2.5">
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

// ─── Main table ───────────────────────────────────────────────────────────────

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
  // Max strategy size across all (not filtered) for bar scale
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
      <div className="rounded-xl border border-border bg-card/40 py-16 text-center text-[12px] text-muted-foreground">
        No strategies match the current filters.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border overflow-hidden bg-[#0e0920]">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[11px]">
          <thead className="bg-[#0b0718] text-[10px] text-muted-foreground">
            <tr>
              <th className="w-8 px-3 py-2.5 text-left font-medium border-b border-border" />
              <th className="px-3 py-2.5 text-left font-medium border-b border-border">Name / ID</th>
              <th className="px-3 py-2.5 text-left font-medium border-b border-border">Stage</th>
              <th className="px-3 py-2.5 text-left font-medium border-b border-border">Parent</th>
              <th className="px-3 py-2.5 text-left font-medium border-b border-border">Pairs</th>
              <th className="px-3 py-2.5 text-left font-medium border-b border-border">Timeframe</th>
              <th className="px-3 py-2.5 text-left font-medium border-b border-border">Status</th>
              <th className="px-3 py-2.5 text-left font-medium border-b border-border">RAW Size</th>
            </tr>
          </thead>
          <tbody className="text-[#d9d9d9]">
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

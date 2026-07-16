/**
 * Filters panel for the Storage page.
 * Grouped: Strategy level | Stage level | Hyperopt level.
 */

import React, { useCallback, useMemo, useRef, useState } from "react";
import { cx } from "../../constants/ui";
import { useOutsideClose } from "../../hooks/useOutsideClose";
import { EMPTY_FILTERS, STAGE_TYPE_OPTIONS, collectStatuses, collectTimeframes } from "../../features/storage/utils/storageFilters";
import { INITIAL_TAGS_REGISTRY } from "../../constants/tags";

function FilterPill({ label, active, children }) {
  const [open, setOpen] = useState(false);
  const ref = useOutsideClose(open, () => setOpen(false));

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cx(
          "inline-flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-[11px] transition-colors",
          active
            ? "border-violet-500/60 bg-violet-500/10 text-violet-300"
            : "border-border bg-background/60 text-muted-foreground hover:bg-accent/30",
        )}
      >
        {label}
        {active && <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />}
        <svg className="h-3 w-3 opacity-60" viewBox="0 0 12 12" fill="none">
          <path d="M3 4.5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 top-full z-30 mt-1 min-w-[200px] rounded-lg border border-border bg-card p-3 shadow-xl">
          {children}
        </div>
      )}
    </div>
  );
}

function TextInput({ label, value, onChange, placeholder }) {
  return (
    <div className="space-y-1">
      {label && <div className="text-[10px] text-muted-foreground">{label}</div>}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded border border-border bg-background px-2 py-1.5 text-[11px] outline-none focus:border-violet-500/60"
      />
    </div>
  );
}

function SelectInput({ label, value, onChange, options }) {
  return (
    <div className="space-y-1">
      {label && <div className="text-[10px] text-muted-foreground">{label}</div>}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded border border-border bg-background px-2 py-1.5 text-[11px] outline-none focus:border-violet-500/60"
      >
        <option value="">All</option>
        {options.map((o) => (
          <option key={o.value ?? o} value={o.value ?? o}>
            {o.label ?? o}
          </option>
        ))}
      </select>
    </div>
  );
}

export function StorageFilters({ filters, updateFilter, clearFilters, strategies }) {
  const timeframes = useMemo(() => collectTimeframes(strategies ?? []), [strategies]);
  const statuses = useMemo(() => collectStatuses(strategies ?? []), [strategies]);

  const hasStrategyFilter = !!filters.strategyName;
  const hasStageFilter = !!filters.stageType;
  const hasHyperoptFilter =
    !!filters.timeframe ||
    filters.tagIds.length > 0 ||
    !!filters.status ||
    filters.minSizeGb !== "" ||
    filters.maxSizeGb !== "";

  const hasAny = hasStrategyFilter || hasStageFilter || hasHyperoptFilter;

  const toggleTag = useCallback(
    (tagId) => {
      const next = filters.tagIds.includes(tagId)
        ? filters.tagIds.filter((t) => t !== tagId)
        : [...filters.tagIds, tagId];
      updateFilter("tagIds", next);
    },
    [filters.tagIds, updateFilter],
  );

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Strategy level */}
      <FilterPill label="Strategy" active={hasStrategyFilter}>
        <TextInput
          label="Strategy name"
          value={filters.strategyName}
          onChange={(v) => updateFilter("strategyName", v)}
          placeholder="Search…"
        />
      </FilterPill>

      {/* Stage level */}
      <FilterPill label="Stage" active={hasStageFilter}>
        <SelectInput
          label="Stage type"
          value={filters.stageType}
          onChange={(v) => updateFilter("stageType", v)}
          options={STAGE_TYPE_OPTIONS}
        />
      </FilterPill>

      {/* Hyperopt level */}
      <FilterPill label="Hyperopt" active={hasHyperoptFilter}>
        <div className="space-y-3 w-52">
          <SelectInput
            label="Timeframe"
            value={filters.timeframe}
            onChange={(v) => updateFilter("timeframe", v)}
            options={timeframes}
          />

          <SelectInput
            label="Status"
            value={filters.status}
            onChange={(v) => updateFilter("status", v)}
            options={statuses}
          />

          <div className="space-y-1">
            <div className="text-[10px] text-muted-foreground">Tags</div>
            <div className="flex flex-wrap gap-1.5">
              {INITIAL_TAGS_REGISTRY.map((tag) => {
                const active = filters.tagIds.includes(tag.id);
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTag(tag.id)}
                    className={cx(
                      "rounded border px-1.5 py-0.5 text-[10px] transition-colors",
                      active
                        ? "border-violet-500/60 bg-violet-500/10 text-violet-300"
                        : "border-border text-muted-foreground hover:border-border/80",
                    )}
                  >
                    {tag.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-[10px] text-muted-foreground">Size (GB)</div>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min="0"
                value={filters.minSizeGb}
                onChange={(e) => updateFilter("minSizeGb", e.target.value)}
                placeholder="Min"
                className="w-20 rounded border border-border bg-background px-2 py-1.5 text-[11px] outline-none focus:border-violet-500/60"
              />
              <span className="text-muted-foreground text-[10px]">–</span>
              <input
                type="number"
                min="0"
                value={filters.maxSizeGb}
                onChange={(e) => updateFilter("maxSizeGb", e.target.value)}
                placeholder="Max"
                className="w-20 rounded border border-border bg-background px-2 py-1.5 text-[11px] outline-none focus:border-violet-500/60"
              />
            </div>
          </div>
        </div>
      </FilterPill>

      {hasAny && (
        <button
          type="button"
          onClick={clearFilters}
          className="text-[11px] text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}

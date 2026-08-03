/**
 * Filters panel for the Storage page.
 * Order: Strategy | Stage | Hyperopt (Timeframe/Status/Tags/Size) | User.
 * Filters narrow visible rows; they do not change selection.
 *
 * Every checkbox-based filter (Stage, Timeframe, Status, User) is rendered
 * as a self-contained multi-select dropdown: a compact trigger showing the
 * current selection summary, expanding into a checkbox list on click.
 */

import React, { useMemo } from "react";
import { cx } from "../../constants/ui";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CheckboxMultiSelect } from "@/components/common/CheckboxMultiSelect";
import {
  STAGE_TYPE_OPTIONS,
  collectOwners,
  collectStatuses,
  collectTimeframes,
} from "../../features/storage/utils/storageFilters";
import { INITIAL_TAGS_REGISTRY } from "../../constants/tags";

function ChevronIcon() {
  return (
    <svg className="h-3 w-3 opacity-60 shrink-0" viewBox="0 0 12 12" fill="none">
      <path d="M3 4.5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function FilterPill({ label, active, children }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cx(
            "inline-flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-[11px] transition-colors",
            active
              ? "border-violet-500/60 bg-violet-500/10 text-violet-300"
              : "border-border bg-background/60 text-muted-foreground hover:bg-accent/30",
          )}
        >
          {label}
          {active && <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />}
          <ChevronIcon />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="min-w-[200px] w-auto p-3"
        onInteractOutside={(e) => {
          // Nested popovers (e.g. Hyperopt → Timeframe) portal outside this node.
          if (e.target?.closest?.('[data-slot="popover-content"]')) {
            e.preventDefault();
          }
        }}
      >
        {children}
      </PopoverContent>
    </Popover>
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

function StorageMultiSelect({ label, values, onChange, options, contentClassName }) {
  const normalized = useMemo(
    () =>
      options.map((o) =>
        typeof o === "object" && o != null && "value" in o
          ? { value: o.value, label: o.label ?? String(o.value) }
          : { value: o, label: String(o) },
      ),
    [options],
  );

  const active = values.length > 0;

  return (
    <CheckboxMultiSelect
      options={normalized}
      value={values}
      onChange={onChange}
      formatSummary={(vals, opts) => {
        if (vals.length === 0) return `${label}: All`;
        if (vals.length === 1) {
          const opt = opts.find((o) => o.value === vals[0]);
          return `${label}: ${opt?.label ?? vals[0]}`;
        }
        return `${label}: ${vals.length} selected`;
      }}
      clearLabel="Clear"
      showClear={active}
      triggerClassName={cx(
        "max-w-[180px] px-2.5 py-1.5 text-[11px]",
        active
          ? "border-violet-500/60 bg-violet-500/10 text-violet-300"
          : "border-border bg-background/60 text-muted-foreground hover:bg-accent/30",
      )}
      contentClassName={cx("min-w-[180px]", contentClassName)}
      optionClassName="text-[11px]"
    />
  );
}

export function StorageFilters({ filters, updateFilter, clearFilters, strategies }) {
  const timeframes = useMemo(() => collectTimeframes(strategies ?? []), [strategies]);
  const statuses = useMemo(() => collectStatuses(strategies ?? []), [strategies]);
  const owners = useMemo(() => collectOwners(strategies ?? []), [strategies]);

  const hasStrategyFilter = !!filters.strategyName;
  const hasStageFilter = filters.stageTypes?.length > 0;
  const hasUserFilter = filters.ownerLogins?.length > 0;
  const hasHyperoptFilter =
    filters.timeframes?.length > 0 ||
    filters.tagIds?.length > 0 ||
    filters.statuses?.length > 0 ||
    filters.minSizeGb !== "" ||
    filters.maxSizeGb !== "";

  const hasAny = hasStrategyFilter || hasStageFilter || hasUserFilter || hasHyperoptFilter;

  const tagOptions = useMemo(
    () => INITIAL_TAGS_REGISTRY.map((tag) => ({ value: tag.id, label: tag.name })),
    [],
  );

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <FilterPill label="Strategy" active={hasStrategyFilter}>
        <TextInput
          label="Strategy name"
          value={filters.strategyName}
          onChange={(v) => updateFilter("strategyName", v)}
          placeholder="Search…"
        />
      </FilterPill>

      <StorageMultiSelect
        label="Stage"
        values={filters.stageTypes ?? []}
        onChange={(v) => updateFilter("stageTypes", v)}
        options={STAGE_TYPE_OPTIONS}
      />

      <FilterPill label="Hyperopt" active={hasHyperoptFilter}>
        <div className="space-y-3 w-56">
          <div className="flex flex-wrap items-center gap-1.5">
            <StorageMultiSelect
              label="Timeframe"
              values={filters.timeframes ?? []}
              onChange={(v) => updateFilter("timeframes", v)}
              options={timeframes}
              contentClassName="w-40"
            />
            <StorageMultiSelect
              label="Status"
              values={filters.statuses ?? []}
              onChange={(v) => updateFilter("statuses", v)}
              options={statuses}
              contentClassName="w-40"
            />
            <StorageMultiSelect
              label="Tags"
              values={filters.tagIds ?? []}
              onChange={(v) => updateFilter("tagIds", v)}
              options={tagOptions}
              contentClassName="w-40"
            />
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

      <StorageMultiSelect
        label="User"
        values={filters.ownerLogins ?? []}
        onChange={(v) => updateFilter("ownerLogins", v)}
        options={owners.map((login) => ({ value: login, label: login }))}
      />

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

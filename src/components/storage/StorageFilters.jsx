/**
 * Filters panel for the Storage page.
 * Order: Strategy | Stage | Hyperopt (Timeframe/Status/Tags/Size) | User.
 * Filters narrow visible rows; they do not change selection.
 *
 * Every checkbox-based filter (Stage, Timeframe, Status, User) is rendered
 * as a self-contained multi-select dropdown: a compact trigger showing the
 * current selection summary, expanding into a checkbox list on click.
 */

import React, { useCallback, useMemo, useState } from "react";
import { cx } from "../../constants/ui";
import { useOutsideClose } from "../../hooks/useOutsideClose";
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
        <ChevronIcon />
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

/**
 * Self-contained multi-select dropdown: trigger button showing a selection
 * summary, expanding into a checkbox list panel on click. Used for every
 * filter that previously rendered as a bare checkbox list.
 */
function MultiSelectDropdown({ label, values, onChange, options, panelClassName }) {
  const [open, setOpen] = useState(false);
  const ref = useOutsideClose(open, () => setOpen(false));

  const toggle = useCallback(
    (value) => {
      const next = values.includes(value) ? values.filter((v) => v !== value) : [...values, value];
      onChange(next);
    },
    [values, onChange],
  );

  const active = values.length > 0;

  const summary = useMemo(() => {
    if (values.length === 0) return "All";
    if (values.length === 1) {
      const opt = options.find((o) => (o.value ?? o) === values[0]);
      return opt?.label ?? opt ?? values[0];
    }
    return `${values.length} selected`;
  }, [values, options]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cx(
          "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[11px] transition-colors max-w-[180px]",
          active
            ? "border-violet-500/60 bg-violet-500/10 text-violet-300"
            : "border-border bg-background/60 text-muted-foreground hover:bg-accent/30",
        )}
      >
        <span className={cx(!active && "text-muted-foreground")}>{label}:</span>
        <span className={cx("truncate", active ? "font-medium text-violet-200" : "text-muted-foreground")}>
          {summary}
        </span>
        <ChevronIcon />
      </button>

      {open && (
        <div
          className={cx(
            "absolute left-0 top-full z-40 mt-1 min-w-[180px] rounded-lg border border-border bg-card p-2 shadow-xl",
            panelClassName,
          )}
        >
          <div className="flex flex-col gap-0.5 max-h-52 overflow-y-auto">
            {options.length === 0 && (
              <div className="px-1.5 py-1 text-[11px] text-muted-foreground">No options</div>
            )}
            {options.map((o) => {
              const value = o.value ?? o;
              const optionLabel = o.label ?? o;
              const checked = values.includes(value);
              return (
                <label
                  key={value}
                  className={cx(
                    "flex cursor-pointer items-center gap-2 rounded px-1.5 py-1 text-[11px] transition-colors",
                    checked ? "bg-violet-500/10 text-violet-200" : "text-muted-foreground hover:bg-accent/30",
                  )}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(value)}
                    className="h-3 w-3 rounded border-border accent-violet-500"
                  />
                  <span className="truncate">{optionLabel}</span>
                </label>
              );
            })}
          </div>

          {active && (
            <button
              type="button"
              onClick={() => onChange([])}
              className="mt-1.5 text-[10px] text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
            >
              Clear
            </button>
          )}
        </div>
      )}
    </div>
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

      <MultiSelectDropdown
        label="Stage"
        values={filters.stageTypes ?? []}
        onChange={(v) => updateFilter("stageTypes", v)}
        options={STAGE_TYPE_OPTIONS}
      />

      <FilterPill label="Hyperopt" active={hasHyperoptFilter}>
        <div className="space-y-3 w-56">
          <div className="flex flex-wrap items-center gap-1.5">
            <MultiSelectDropdown
              label="Timeframe"
              values={filters.timeframes ?? []}
              onChange={(v) => updateFilter("timeframes", v)}
              options={timeframes}
              panelClassName="w-40"
            />
            <MultiSelectDropdown
              label="Status"
              values={filters.statuses ?? []}
              onChange={(v) => updateFilter("statuses", v)}
              options={statuses}
              panelClassName="w-40"
            />
            <MultiSelectDropdown
              label="Tags"
              values={filters.tagIds ?? []}
              onChange={(v) => updateFilter("tagIds", v)}
              options={tagOptions}
              panelClassName="w-40"
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

      <MultiSelectDropdown
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

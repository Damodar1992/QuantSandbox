import React, { memo, useEffect, useMemo, useState } from "react";
import { cx, ui } from "@/constants/ui";
import { Checkbox } from "@/components/ui/checkbox";
import { fmtInt } from "../utils/format";
import { computePessimismGrid } from "../utils/pessimism";
import { buildShuffleTotalSummary } from "../utils/shuffleTotalSummary";
import { ShuffleSummarySections } from "./ShuffleSummarySections";

const SUMMARY_TABS = [
  { id: "general", label: "General" },
  { id: "recovery", label: "Recovery" },
];

const SECTION_KEYS = ["random", "L2", "L3", "L4"];

const SECTION_PILLS = [
  { key: "random", label: "Random Shuffle", summaryLabel: "Shuffle" },
  { key: "L2", label: "L2", summaryLabel: "L2" },
  { key: "L3", label: "L3", summaryLabel: "L3" },
  { key: "L4", label: "L4", summaryLabel: "L4" },
];

function simulationsFor(run, sectionKey) {
  if (sectionKey === "all") {
    const hit = (run?.result?.sections || []).find((s) => s.key === "total");
    return {
      n: hit?.n ?? Number(run?.config?.shufflesN) ?? 0,
      stopped: hit?.stoppedN ?? 0,
    };
  }
  const hit = (run?.result?.sections || []).find((s) => s.key === sectionKey);
  if (hit) return { n: hit.n, stopped: hit.stoppedN };
  if (sectionKey === "random") {
    const grid = computePessimismGrid(
      run?.config?.pessimismLevels,
      run?.config?.shufflesN,
      run?.config?.original || {},
    );
    return { n: grid.randomRunsN, stopped: 0 };
  }
  const grid = computePessimismGrid(
    run?.config?.pessimismLevels,
    run?.config?.shufflesN,
    run?.config?.original || {},
  );
  const row = grid.rows.find((r) => r.level === sectionKey);
  return { n: row?.runsN ?? 0, stopped: 0 };
}

function resolveSectionKey(selected) {
  if (selected.has("all")) return "total";
  const keys = [...selected];
  if (keys.length === 1) return keys[0];
  return "total";
}

function sectionCounts(run) {
  const total = simulationsFor(run, "all");
  const byKey = Object.fromEntries(
    SECTION_KEYS.map((key) => [key, simulationsFor(run, key).n]),
  );
  return { total: total.n, stopped: total.stopped, byKey };
}

function SectionAnalyticsFilter({ run, selected, onChange }) {
  const { total, stopped, byKey } = useMemo(() => sectionCounts(run), [run]);

  const isAll = selected.has("all");
  const isChecked = (key) => isAll || selected.has(key);

  const selectedCount = useMemo(() => {
    if (isAll) return total;
    return SECTION_KEYS.filter((key) => selected.has(key)).reduce(
      (sum, key) => sum + (byKey[key] || 0),
      0,
    );
  }, [isAll, selected, total, byKey]);

  const toggleSection = (key) => {
    if (isAll) {
      const next = new Set(SECTION_KEYS);
      next.delete(key);
      onChange(next);
      return;
    }

    const next = new Set(selected);
    next.delete("all");

    if (next.has(key)) {
      next.delete(key);
      if (next.size === 0) {
        onChange(new Set(["all"]));
        return;
      }
    } else {
      next.add(key);
      if (next.size === SECTION_KEYS.length) {
        onChange(new Set(["all"]));
        return;
      }
    }
    onChange(next);
  };

  const selectAll = () => onChange(new Set(["all"]));

  return (
    <div className="space-y-2 border-b border-[rgba(60,40,80,0.25)] pb-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="text-[10px] font-medium uppercase tracking-wide text-[#8c8c8c]">
          Include in analytics
        </span>
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
          {SECTION_PILLS.map(({ key, label }) => {
            const checked = isChecked(key);
            return (
              <button
                key={key}
                type="button"
                onClick={() => toggleSection(key)}
                aria-pressed={checked}
                className={cx(
                  "inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] transition-colors",
                  checked
                    ? "border-violet-500/45 bg-violet-500/10 text-[#faf7fd]"
                    : "border-[rgba(60,40,80,0.45)] bg-[#120b20] text-[#b8aecc] hover:border-violet-500/30",
                )}
              >
                <Checkbox
                  checked={checked}
                  tabIndex={-1}
                  aria-hidden
                  className="pointer-events-none size-3.5 border-violet-400/50 data-[state=checked]:border-violet-400 data-[state=checked]:bg-violet-500"
                />
                <span className="font-medium">{label}</span>
                <span className={cx("tabular-nums", ui.textSubtle)}>{fmtInt(byKey[key] || 0)}</span>
              </button>
            );
          })}
          <button
            type="button"
            onClick={selectAll}
            aria-pressed={isAll}
            className={cx(
              "inline-flex items-center rounded-md border border-dashed px-2.5 py-1 text-[11px] transition-colors",
              isAll
                ? "border-violet-500/45 bg-violet-500/10 text-violet-200"
                : "border-[rgba(120,100,150,0.45)] text-[#8c8c8c] hover:border-violet-500/30 hover:text-[#d9d9d9]",
            )}
          >
            all
          </button>
        </div>
      </div>

      <p className={cx("text-[11px] leading-relaxed", ui.textSubtle)}>
        Fixed split of the {fmtInt(total)} datasets –{" "}
        {SECTION_PILLS.map(({ key, summaryLabel }, i) => (
          <React.Fragment key={key}>
            {i > 0 ? " · " : null}
            {summaryLabel}{" "}
            <span className="font-semibold text-[#faf7fd]">{fmtInt(byKey[key] || 0)}</span>
          </React.Fragment>
        ))}
        . Selected:{" "}
        <span className="font-semibold text-[#faf7fd]">{fmtInt(selectedCount)}</span> of{" "}
        <span className="font-semibold text-[#faf7fd]">{fmtInt(total)}</span> runs
        {stopped > 0 ? (
          <>
            {" "}
            · <span className="font-semibold text-[#faf7fd]">{fmtInt(stopped)}</span> stopped
          </>
        ) : null}
        .
      </p>
    </div>
  );
}

/** Shuffle info → Summary (General / Recovery tabs + section checkboxes). */
export const ShuffleSectionSummaryPanel = memo(function ShuffleSectionSummaryPanel({ run }) {
  const [summaryTab, setSummaryTab] = useState("general");
  const [selectedSections, setSelectedSections] = useState(() => new Set(["all"]));

  useEffect(() => {
    setSelectedSections(new Set(["all"]));
  }, [run?.id]);

  const sectionKey = useMemo(() => resolveSectionKey(selectedSections), [selectedSections]);

  const summary = useMemo(
    () =>
      sectionKey === "total"
        ? buildShuffleTotalSummary(run)
        : buildShuffleTotalSummary(run, { sectionKey }),
    [run, sectionKey],
  );

  const visibleSections = useMemo(() => {
    if (summaryTab === "general") return summary.generalSections || [];
    return summary.recoverySections || [];
  }, [summary, summaryTab]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {SUMMARY_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setSummaryTab(tab.id)}
            className={cx(
              "rounded-full border px-4 py-1.5 text-[12px] font-medium transition-colors",
              summaryTab === tab.id
                ? "border-violet-500/45 bg-violet-500/15 text-violet-200"
                : "border-[rgba(60,40,80,0.35)] text-[#8c8c8c] hover:text-[#d9d9d9]",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <SectionAnalyticsFilter
        run={run}
        selected={selectedSections}
        onChange={setSelectedSections}
      />

      <ShuffleSummarySections
        key={summaryTab}
        sections={visibleSections}
        defaultExpanded
        nRuns={summary.simulations}
      />

      {summaryTab === "recovery" ? (
        <div className={cx("text-[10px] leading-relaxed text-violet-300/80", ui.textSubtle)}>
          Recovery time is measured by duration, not by calendar dates. After shuffling, trade close
          dates no longer form an increasing sequence. The length of a recovery phase equals the sum of
          the durations of the trades that fall inside it.
        </div>
      ) : null}
    </div>
  );
});

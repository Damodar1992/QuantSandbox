import React, { memo, useEffect, useMemo, useState } from "react";
import { cx, ui } from "@/constants/ui";
import { AppSelect } from "@/components/common/AppSelect";
import { fmtInt } from "../utils/format";
import { computePessimismGrid, shufflerSections } from "../utils/pessimism";
import { buildShuffleTotalSummary } from "../utils/shuffleTotalSummary";
import { ShuffleSummarySections } from "./ShuffleSummarySections";

function sectionOptions(run) {
  const all = { key: "all", label: "All" };
  const fromConfig = shufflerSections(run?.config).filter((s) => s.key !== "total");
  if (fromConfig.length) return [all, ...fromConfig];

  // Fallback when stress-test is off — All + Random.
  return [all, { key: "random", label: "Random Shuffle" }];
}

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

/** Shuffle info → Summary by section (dropdown + GENERAL/MACRO/MICRO). */
export const ShuffleSectionSummaryPanel = memo(function ShuffleSectionSummaryPanel({ run }) {
  const options = useMemo(() => sectionOptions(run), [run]);
  const [sectionKey, setSectionKey] = useState("all");

  useEffect(() => {
    if (!options.some((o) => o.key === sectionKey)) {
      setSectionKey(options[0]?.key || "all");
    }
  }, [options, sectionKey]);

  const summary = useMemo(
    () =>
      sectionKey === "all"
        ? buildShuffleTotalSummary(run)
        : buildShuffleTotalSummary(run, { sectionKey }),
    [run, sectionKey],
  );

  const counts = useMemo(() => simulationsFor(run, sectionKey), [run, sectionKey]);
  const simulations = counts.n || summary.simulations;
  const stopped = counts.stopped ?? summary.stopped;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap items-end gap-3">
          <div className="text-[14px] font-semibold text-[#faf7fd]">Summary by section</div>
          <div className="min-w-[180px]">
            <AppSelect
              aria-label="Section"
              value={sectionKey}
              onValueChange={setSectionKey}
              options={options.map((o) => ({ value: o.key, label: o.label }))}
              triggerClassName="h-8 text-[12px]"
            />
          </div>
        </div>
        <div className={cx("text-[11px]", ui.textSubtle)}>
          {fmtInt(simulations)} simulations · {fmtInt(stopped)} stopped
        </div>
      </div>

      <ShuffleSummarySections sections={summary.sections} />

      <div className={cx("text-[10px] leading-relaxed text-violet-300/80", ui.textSubtle)}>
        Recovery time is measured by duration, not by calendar dates. After shuffling, trade close
        dates no longer form an increasing sequence. The length of a recovery phase equals the sum of
        the durations of the trades that fall inside it.
      </div>
    </div>
  );
});

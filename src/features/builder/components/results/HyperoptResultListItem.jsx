import React, { memo } from "react";
import { cx } from "../../../../constants/ui";
import { crmAccent, crmSurface } from "../../../../constants/crmAccent";
import { formatHyperoptDateTime } from "../../utils/hyperoptFormatters";
import { resolveTagNames } from "../../../../features/tags/utils/tagStore";
import { RunStatusBadge } from "./RunStatusBadge";

/**
 * Compact full-width row for the Hyperopt results vertical list (card view).
 */
export const HyperoptResultListItem = memo(function HyperoptResultListItem({
  row,
  selected = false,
  onSelect,
  showSource = false,
  sourceText = "—",
  tagsRegistry = [],
}) {
  const ppCount = row.children?.length ?? 0;
  const tagNames = resolveTagNames(row.tagIds, tagsRegistry);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect?.(row.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect?.(row.id);
        }
      }}
      className={cx(
        "group flex flex-col gap-1.5 rounded-lg border border-l-4 p-3 cursor-pointer transition-colors",
        crmSurface.border,
        crmSurface.panel,
        selected
          ? cx(crmAccent.borderL, "bg-muted ring-2", crmAccent.ring.replace("focus:", ""))
          : cx(crmAccent.borderL, "hover:bg-muted", crmAccent.borderLHover),
        "focus:outline-none focus:ring-2",
        crmAccent.ring,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className={cx("text-[12px] font-semibold", crmSurface.textBright)}>
            {formatHyperoptDateTime(row.date)}
          </span>
          <span className="rounded bg-[#2a2a2a] px-1 py-0.5 text-[10px] font-medium text-[#a6a6a6]">#{row.hyperoptNumber ?? "—"}</span>
          <RunStatusBadge status={row.status} eta={row.estimationTime} />
        </div>
        <span className="shrink-0 text-[10px] text-[#8c8c8c]">{ppCount} post-processing</span>
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10px]">
        <span className="text-[#8c8c8c]">Pairs:</span>
        <span className="text-[#d9d9d9] truncate" title={row.pairs}>{row.pairs}</span>
        <span className="text-[#8c8c8c]">TimeFrame:</span>
        <span className="text-[#d9d9d9]">{row.timeFrame}</span>
        <span className="text-[#8c8c8c]">TimeRange:</span>
        <span className="text-[#a6a6a6] truncate" title={row.knowRange}>{row.knowRange}</span>
        {showSource && (
          <>
            <span className="text-[#8c8c8c]">Source:</span>
            <span className="text-[#d9d9d9] truncate" title={sourceText}>{sourceText}</span>
          </>
        )}
      </div>

      {tagNames.length ? (
        <div className="flex flex-wrap items-center gap-1">
          {tagNames.slice(0, 5).map((t) => (
            <span
              key={t}
              className="rounded border border-[#303030] bg-[#0f0f0f] px-1.5 py-0.5 text-[10px] text-[#a6a6a6]"
            >
              {t}
            </span>
          ))}
          {tagNames.length > 5 && (
            <span className="self-center text-[10px] text-[#8c8c8c]">+{tagNames.length - 5}</span>
          )}
        </div>
      ) : null}
    </div>
  );
});

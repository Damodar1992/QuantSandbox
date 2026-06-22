import React, { memo } from "react";
import { cx, ui } from "../../../../constants/ui";
import { crmAccent, crmSurface } from "../../../../constants/crmAccent";
import { HyperoptDetailsTooltip } from "../../../../components/heatmap";
import { AppButton } from "../../../../components/common/AppButton";
import { formatHyperoptDateTime } from "../../utils/hyperoptFormatters";
import { RunStatusBadge } from "./RunStatusBadge";

/**
 * Card representation of a single Hyperopt result (run) in the list view.
 */
export const HyperoptResultCard = memo(function HyperoptResultCard({
  row,
  showSource = false,
  sourceText = "—",
  sourceTitle = "—",
  showPostProcessing = false,
  onOpen,
  onPostProcessing,
  onTagsComments,
  onShowDetails,
}) {
  const ppCount = row.children?.length ?? 0;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen?.(row.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen?.(row.id);
        }
      }}
      className={cx(
        ui.radius,
        "group flex flex-col gap-2 border border-l-4 p-3",
        crmSurface.border,
        crmAccent.borderL,
        crmSurface.panel,
        "cursor-pointer transition-colors",
        crmAccent.borderLHover,
        "hover:bg-muted focus:outline-none focus:ring-2",
        crmAccent.ring,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className={cx("text-[12px] font-semibold", crmSurface.textBright)}>{formatHyperoptDateTime(row.date)}</div>
            <span className="rounded bg-[#2a2a2a] px-1 py-0.5 text-[10px] font-medium text-[#a6a6a6]">#{row.hyperoptNumber ?? "—"}</span>
            <RunStatusBadge status={row.status} />
          </div>
          <div className="mt-0.5 text-[10px] text-[#8c8c8c]">
            {ppCount} post-processing
          </div>
        </div>
        <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
          <HyperoptDetailsTooltip onShowDetails={() => onShowDetails?.()} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px]">
        <div className="text-[#8c8c8c]">Pairs</div>
        <div className="text-right text-[#d9d9d9] truncate" title={row.pairs}>
          {row.pairs}
        </div>
        <div className="text-[#8c8c8c]">TimeFrame</div>
        <div className="text-right text-[#d9d9d9]">{row.timeFrame}</div>
        <div className="text-[#8c8c8c]">TimeRange</div>
        <div className="text-right text-[#a6a6a6] truncate" title={row.knowRange}>
          {row.knowRange}
        </div>
        {showSource && (
          <>
            <div className="text-[#8c8c8c]">Source</div>
            <div className="text-right text-[#d9d9d9] truncate" title={sourceTitle}>
              {sourceText}
            </div>
          </>
        )}
        <div className="text-[#8c8c8c]">Tags</div>
        <div className="text-right min-w-0">
          {row.tags?.length ? (
            <div className="flex flex-wrap justify-end gap-1">
              {row.tags.slice(0, 4).map((t) => (
                <span
                  key={t}
                  className="rounded border border-[#303030] bg-[#0f0f0f] px-1.5 py-0.5 text-[10px] text-[#a6a6a6]"
                >
                  {t}
                </span>
              ))}
              {row.tags.length > 4 && (
                <span className="self-center text-[10px] text-[#8c8c8c]">
                  +{row.tags.length - 4}
                </span>
              )}
            </div>
          ) : (
            <span className="text-[#595959]">—</span>
          )}
        </div>
        <div className="text-[#8c8c8c]">Comment</div>
        <div className="text-right text-[#a6a6a6] line-clamp-2 min-w-0" title={row.comment?.trim() || undefined}>
          {row.comment?.trim() ? row.comment : <span className="text-[#595959]">—</span>}
        </div>
      </div>

      <div
        className="mt-auto flex flex-wrap items-center gap-1.5 pt-1"
        onClick={(e) => e.stopPropagation()}
      >
        {showPostProcessing && (
          <AppButton type="button" variant="default" size="xs" onClick={() => onPostProcessing?.()}>
            Post-processing
          </AppButton>
        )}
        <AppButton type="button" variant="outline" size="xs" onClick={() => onTagsComments?.(row)}>
          Tags &amp; comments
        </AppButton>
        <AppButton type="button" variant="outline" size="xs" className="ml-auto" onClick={() => onOpen?.(row.id)}>
          Open
        </AppButton>
      </div>
    </div>
  );
});

import React, { memo } from "react";
import { cx, ui } from "../../../../constants/ui";
import { HyperoptDetailsTooltip } from "../../../../components/heatmap";
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
        "group flex flex-col gap-2 border border-[#303030] border-l-4 border-l-emerald-500 bg-[#141414] p-3",
        "cursor-pointer hover:bg-[#1a1a1a] hover:border-l-emerald-400 transition-colors",
        "focus:outline-none focus:ring-2 focus:ring-emerald-500/40",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="text-[12px] font-semibold text-[#f5f5f5]">{row.date}</div>
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
          <button
            type="button"
            onClick={() => onPostProcessing?.()}
            className={cx(ui.btnPrimary, "h-7 px-2 text-[10px] whitespace-nowrap")}
          >
            Post-processing
          </button>
        )}
        <button
          type="button"
          onClick={() => onTagsComments?.(row)}
          className={cx(ui.btn, "h-7 px-2 text-[10px] whitespace-nowrap")}
        >
          Tags &amp; comments
        </button>
        <button
          type="button"
          onClick={() => onOpen?.(row.id)}
          className={cx(ui.btn, "h-7 px-2 text-[10px] whitespace-nowrap ml-auto")}
        >
          Open
        </button>
      </div>
    </div>
  );
});

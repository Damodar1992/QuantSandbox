import React, { memo, useMemo } from "react";
import { cx } from "../../constants/ui";

const STATUS_STYLES = {
  Completed: "bg-emerald-500/10 text-emerald-200 border-emerald-500/40",
  "In progress": "bg-blue-500/10 text-blue-200 border-blue-500/40",
  Fail: "bg-red-500/10 text-red-200 border-red-500/40",
};

function StatusBadge({ status }) {
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-md px-2 py-0.5 text-[11px] leading-4 border",
        STATUS_STYLES[status] || "bg-white/5 text-[#8c8c8c] border-[#303030]",
      )}
    >
      {status}
    </span>
  );
}

function buildDateTooltip({ startDate, finishDate, status }) {
  const lines = [];
  if (startDate) lines.push(`Start date: ${startDate}`);
  if (status === "Completed" && finishDate) lines.push(`Finish date: ${finishDate}`);
  return lines.join("\n");
}

export const PipelineStatusCell = memo(function PipelineStatusCell({ pipeline }) {
  const tooltip = useMemo(() => {
    if (!pipeline?.status) return "";
    return buildDateTooltip(pipeline);
  }, [pipeline]);

  if (!pipeline?.status) {
    return <span className="text-[12px] text-[#595959]">—</span>;
  }

  const hasTooltip = Boolean(tooltip);

  return (
    <span className={cx("relative inline-flex", hasTooltip && "group cursor-default")}>
      <StatusBadge status={pipeline.status} />
      {hasTooltip && (
        <span
          role="tooltip"
          className={cx(
            "pointer-events-none absolute left-0 bottom-full z-[100] mb-1.5 min-w-[10rem]",
            "rounded-md border border-[#303030] bg-[#1f1f1f] px-2.5 py-2 text-[11px] leading-relaxed text-[#d9d9d9] shadow-lg",
            "whitespace-pre-line opacity-0 transition-opacity duration-150",
            "group-hover:opacity-100",
          )}
        >
          {tooltip}
        </span>
      )}
    </span>
  );
});

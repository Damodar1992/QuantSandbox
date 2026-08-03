import React, { memo, useMemo } from "react";
import { cx } from "../../constants/ui";
import { crmAccent } from "../../constants/crmAccent";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const STATUS_STYLES = {
  Completed: `${crmAccent.bg} ${crmAccent.textStrong} ${crmAccent.border}`,
  "In progress": "bg-blue-500/10 text-blue-200 border-blue-500/40",
  Fail: "bg-red-500/10 text-red-200 border-red-500/40",
};

function StatusBadge({ status }) {
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-md px-2 py-0.5 text-[11px] leading-4 border",
        STATUS_STYLES[status] || "bg-white/5 text-muted-foreground border-border",
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
    return <span className="text-[12px] text-muted-foreground">—</span>;
  }

  const badge = <StatusBadge status={pipeline.status} />;

  if (!tooltip) return badge;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex cursor-default">{badge}</span>
      </TooltipTrigger>
      <TooltipContent side="top" className="whitespace-pre-line">
        {tooltip}
      </TooltipContent>
    </Tooltip>
  );
});

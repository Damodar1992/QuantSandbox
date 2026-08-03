import React from "react";
import { cx } from "../../../constants/ui";
import { buildVersionHoverTooltip } from "../utils/versionComments";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function VersionNodeTooltip({
  label,
  tagNames = [],
  comment = "",
  wrapperClassName,
  wrapperStyle,
  children,
}) {
  const tooltipText = buildVersionHoverTooltip({ label, tagNames, comment });
  const hasExtra = (tagNames?.length ?? 0) > 0 || Boolean(comment?.trim());

  if (!hasExtra) {
    return (
      <span className={cx("inline-flex", wrapperClassName)} style={wrapperStyle}>
        {children}
      </span>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={cx("inline-flex", wrapperClassName)} style={wrapperStyle}>
          {children}
        </span>
      </TooltipTrigger>
      <TooltipContent
        side="top"
        className="min-w-[10rem] max-w-[16rem] whitespace-pre-line text-[10px] leading-relaxed"
      >
        {tooltipText}
      </TooltipContent>
    </Tooltip>
  );
}

import React from "react";
import { cx } from "../../../constants/ui";
import { buildVersionHoverTooltip } from "../utils/versionComments";

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

  return (
    <span
      className={cx("relative inline-flex", hasExtra && "group", wrapperClassName)}
      style={wrapperStyle}
    >
      {children}
      {hasExtra && (
        <span
          role="tooltip"
          className={cx(
            "pointer-events-none absolute left-1/2 bottom-full z-[120] mb-2 -translate-x-1/2",
            "min-w-[10rem] max-w-[16rem] rounded-md border border-[#303030] bg-[#1f1f1f] px-2.5 py-2",
            "text-[10px] leading-relaxed text-[#d9d9d9] shadow-lg whitespace-pre-line",
            "opacity-0 transition-opacity duration-150 group-hover:opacity-100",
          )}
        >
          {tooltipText}
        </span>
      )}
    </span>
  );
}

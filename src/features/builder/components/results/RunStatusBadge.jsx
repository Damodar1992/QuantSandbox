import React, { memo } from "react";
import { cx } from "../../../../constants/ui";

const RUN_STATUS_STYLES = {
  "In Progress": "bg-blue-500/10 text-blue-200 border-blue-500/40",
  Done: "bg-emerald-500/10 text-emerald-200 border-emerald-500/40",
  Fail: "bg-red-500/10 text-red-200 border-red-500/40",
};

export const RunStatusBadge = memo(function RunStatusBadge({ status, className }) {
  if (!status) return null;

  return (
    <span
      className={cx(
        "inline-flex items-center rounded-md border px-1.5 py-0.5 text-[9px] leading-4 shrink-0",
        RUN_STATUS_STYLES[status] || "bg-white/5 text-[#8c8c8c] border-[#303030]",
        className,
      )}
    >
      {status}
    </span>
  );
});

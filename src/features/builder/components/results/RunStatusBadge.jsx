import React, { memo } from "react";
import { AppBadge } from "@/components/common/AppBadge";
import { cx } from "@/constants/ui";
import { isHyperoptInProgress, normalizeHyperoptRunStatus } from "../../utils/hyperoptFormatters";

export const RunStatusBadge = memo(function RunStatusBadge({ status, eta, className }) {
  if (!status) return null;
  const normalized = normalizeHyperoptRunStatus(status);
  const showEta = isHyperoptInProgress(normalized) && eta;

  return (
    <span className={cx("inline-flex items-center gap-1.5 min-w-0", className)}>
      <AppBadge status={normalized} />
      {showEta ? (
        <span className="text-[10px] text-[#8c8c8c] tabular-nums whitespace-nowrap">ETA {eta}</span>
      ) : null}
    </span>
  );
});

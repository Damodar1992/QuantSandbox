import React, { memo } from "react";
import { AppBadge } from "@/components/common/AppBadge";
import { EtaProgress } from "@/components/common/EtaProgress";
import { cx } from "@/constants/ui";
import { isHyperoptInProgress, normalizeHyperoptRunStatus } from "../../utils/hyperoptFormatters";

export const RunStatusBadge = memo(function RunStatusBadge({ status, eta, progress, className }) {
  if (!status) return null;
  const normalized = normalizeHyperoptRunStatus(status);
  const showProgress = isHyperoptInProgress(normalized) && (eta || progress != null);

  return (
    <span className={cx("inline-flex items-center gap-1.5 min-w-0", className)}>
      <AppBadge status={normalized} />
      {showProgress ? <EtaProgress eta={eta} progress={progress} /> : null}
    </span>
  );
});

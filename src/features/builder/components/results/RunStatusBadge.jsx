import React, { memo } from "react";
import { AppBadge } from "@/components/common/AppBadge";
import { normalizeHyperoptRunStatus } from "../../utils/hyperoptFormatters";

export const RunStatusBadge = memo(function RunStatusBadge({ status, className }) {
  if (!status) return null;
  return <AppBadge status={normalizeHyperoptRunStatus(status)} className={className} />;
});

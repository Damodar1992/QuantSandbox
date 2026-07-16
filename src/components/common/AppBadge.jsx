import React, { memo } from "react";
import { Badge } from "@/components/ui/badge";
import { normalizeHyperoptRunStatus } from "@/features/builder/utils/hyperoptFormatters";
import { cn } from "@/lib/utils";

const STATUS_VARIANTS = {
  Completed: "completed",
  Finished: "finished",
  "In Progress": "inProgress",
  Done: "completed",
  Fail: "failed",
  Failed: "failed",
  Warning: "warning",
  Passed: "completed",
  Draft: "warning",
  Active: "completed",
  Disabled: "muted",
  Deactivated: "failed",
  Archived: "muted",
  Trend: "inProgress",
  Momentum: "secondary",
  Volatility: "warning",
  Custom: "warning",
  Running: "inProgress",
  "Raw data deleted": "rawDeleted",
};

export const AppBadge = memo(function AppBadge({ status, variant, type, className, children }) {
  const label = children ?? status;
  if (!label) return null;

  const normalized = normalizeHyperoptRunStatus(status || label);
  const resolvedVariant =
    variant ||
    (type === "indicatorGroup"
      ? { Trend: "inProgress", Momentum: "secondary", Volatility: "warning", Custom: "warning" }[status]
      : STATUS_VARIANTS[normalized] || STATUS_VARIANTS[status] || "muted");

  return (
    <Badge variant={resolvedVariant} className={cn(className)}>
      {children ?? normalized}
    </Badge>
  );
});

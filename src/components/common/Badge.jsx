import React, { memo } from "react";
import { cx } from "../../constants/ui";

const badgeVariants = {
  status: {
    Draft: "bg-amber-500/10 text-amber-200 border-amber-500/40",
    Active: "bg-emerald-500/10 text-emerald-200 border-emerald-500/40",
    Disabled: "bg-white/5 text-[#8c8c8c] border-[#303030]",
    Deactivated: "bg-red-500/10 text-red-200 border-red-500/40",
    Archived: "bg-white/5 text-[#8c8c8c] border-[#303030]",
  },
  indicatorGroup: {
    Trend: "bg-blue-500/10 text-blue-200 border-blue-500/40",
    Momentum: "bg-purple-500/10 text-purple-200 border-purple-500/40",
    Volatility: "bg-orange-500/10 text-orange-200 border-orange-500/40",
    Custom: "bg-amber-500/10 text-amber-200 border-amber-500/40",
  },
  bias: {
    Passed: "bg-emerald-500/10 text-emerald-200 border-emerald-500/40",
    Warning: "bg-amber-500/10 text-amber-200 border-amber-500/40",
    Failed: "bg-red-500/10 text-red-200 border-red-500/40",
  },
};

export const Badge = memo(({ status, type = "status" }) => {
  const cls = badgeVariants[type]?.[status] || "bg-white/5 text-[#8c8c8c] border-[#303030]";
  return (
    <span className={cx("inline-flex items-center rounded-md px-2 py-0.5 text-[11px] leading-4 border", cls)}>
      {status}
    </span>
  );
});

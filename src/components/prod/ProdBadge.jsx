import React, { memo } from "react";
import { cx } from "@/constants/ui";

const toneMap = {
  success: "bg-[var(--crm-success-bg)] text-[var(--crm-success)] border border-emerald-500/30",
  violet: "bg-[rgba(168,96,240,0.16)] text-[#ddd6fe] border border-violet-500/30",
  muted: "bg-[#19102b] text-[#b8aecc] border border-[rgba(60,40,80,0.35)]",
  danger: "bg-red-500/10 text-red-300 border border-red-500/30",
  warning: "bg-amber-500/10 text-amber-300 border border-amber-500/30",
};

export const ProdBadge = memo(function ProdBadge({ tone = "muted", className, children }) {
  return (
    <span
      className={cx(
        "inline-flex items-center rounded px-2 py-0.5 text-[10px] font-medium",
        toneMap[tone] ?? toneMap.muted,
        className,
      )}
    >
      {children}
    </span>
  );
});

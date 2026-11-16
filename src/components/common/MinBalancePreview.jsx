import React from "react";
import { cx } from "@/constants/ui";

function formatAmount(value) {
  if (value == null || !Number.isFinite(Number(value))) return "—";
  return Number(value).toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export function MinimumBalancePreview({ preview }) {
  const metricLabel = preview.metric === "minimumStake" ? "Minimum Stake" : "Minimum Balance";
  const tone =
    preview.status === "READY"
      ? "text-green-300"
      : preview.status === "DATA PAUSED"
        ? "text-muted-foreground"
        : "text-red-400";

  return (
    <div
      className="flex flex-nowrap items-center gap-x-3 overflow-hidden rounded-md border border-border bg-muted/30 px-3 py-1.5 text-[12px]"
      role="status"
    >
      <span className="shrink-0 whitespace-nowrap">
        {metricLabel}{" "}
        <span className="font-medium tabular-nums text-[#faf7fd]">{formatAmount(preview.amount)}</span>
      </span>
      <span className={cx("shrink-0 whitespace-nowrap font-medium", tone)}>{preview.status}</span>
      <span className="min-w-0 truncate text-muted-foreground">{preview.hint}</span>
    </div>
  );
}

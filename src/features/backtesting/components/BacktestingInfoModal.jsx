import React, { memo, useEffect, useState } from "react";
import { cx } from "@/constants/ui";
import { AppDialog } from "@/components/common/AppDialog";
import { BT_INFO_DIALOG_FULLSCREEN_CLASS } from "./btInfoDialogClass";
import { ExportExcelMenu } from "./ExportExcelMenu";
import { PerformanceSummaryTab } from "./PerformanceSummaryTab";
import { TemporalSummaryTab } from "./TemporalSummaryTab";
import { TradesSummaryTab } from "./TradesSummaryTab";

const INFO_TABS = [
  { value: "performance", label: "Performance" },
  { value: "temporal", label: "Temporal" },
  { value: "trades", label: "Trades" },
];

function PillTab({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-[12px] font-medium transition-colors",
        active
          ? "border-violet-500/40 bg-violet-500/15 text-violet-200"
          : "border-[rgba(60,40,80,0.35)] text-[#8c8c8c] hover:text-[#d9d9d9]",
      )}
    >
      {children}
    </button>
  );
}

/** Backtesting info: Performance / Temporal / Trades. */
export const BacktestingInfoModal = memo(function BacktestingInfoModal({
  open,
  run,
  onClose,
}) {
  const [tab, setTab] = useState("performance");

  useEffect(() => {
    if (open) setTab("performance");
  }, [open]);

  return (
    <AppDialog
      open={!!open && Boolean(run)}
      onOpenChange={(next) => {
        if (!next) onClose?.();
      }}
      title="Backtesting info"
      description={run?.epochLabel || run?.id || "Backtest run"}
      headerAction={<ExportExcelMenu disabled={!run} />}
      className={BT_INFO_DIALOG_FULLSCREEN_CLASS}
    >
      <div className="mb-4 flex shrink-0 flex-wrap justify-start gap-2 border-b border-[rgba(60,40,80,0.35)] pb-3">
        {INFO_TABS.map((item) => (
          <PillTab key={item.value} active={tab === item.value} onClick={() => setTab(item.value)}>
            {item.label}
          </PillTab>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        {run && tab === "performance" ? <PerformanceSummaryTab run={run} /> : null}
        {run && tab === "temporal" ? <TemporalSummaryTab run={run} /> : null}
        {run && tab === "trades" ? <TradesSummaryTab run={run} /> : null}
      </div>
    </AppDialog>
  );
});

import React, { memo, useEffect, useState } from "react";
import { Download } from "lucide-react";
import { cx } from "@/constants/ui";
import { AppDialog } from "@/components/common/AppDialog";
import { AppButton } from "@/components/common/AppButton";
import { downloadShuffleInfoExcel } from "../utils/exportShuffleInfoExcel";
import { BT_INFO_DIALOG_CLASS } from "./btInfoDialogClass";
import { ShuffleChartsPanel } from "./ShuffleChartsPanel";
import { ShuffleSectionSummaryPanel } from "./ShuffleSectionSummaryPanel";

/** Shuffle info — Charts / Summary by section. */
export const ShuffleInfoModal = memo(function ShuffleInfoModal({ open, run, onClose }) {
  const [tab, setTab] = useState("charts");

  useEffect(() => {
    if (open) setTab("charts");
  }, [open]);

  return (
    <AppDialog
      open={!!open && Boolean(run)}
      onOpenChange={(next) => {
        if (!next) onClose?.();
      }}
      title="Shuffle info"
      headerAction={
        <AppButton
          type="button"
          variant="outline"
          size="sm"
          disabled={!run}
          onClick={() => downloadShuffleInfoExcel(run)}
        >
          <Download className="mr-1.5 h-3.5 w-3.5" />
          Export Excel
        </AppButton>
      }
      className={BT_INFO_DIALOG_CLASS}
    >
      <div className="mb-4 flex shrink-0 flex-wrap justify-start gap-2 border-b border-[rgba(60,40,80,0.35)] pb-3">
        {[
          { value: "charts", label: "Charts" },
          { value: "sections", label: "Summary by section" },
        ].map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => setTab(item.value)}
            className={cx(
              "inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-[12px] font-medium transition-colors",
              tab === item.value
                ? "border-violet-500/40 bg-violet-500/15 text-violet-200"
                : "border-[rgba(60,40,80,0.35)] text-[#8c8c8c] hover:text-[#d9d9d9]",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        {run && tab === "charts" ? <ShuffleChartsPanel run={run} /> : null}
        {run && tab === "sections" ? <ShuffleSectionSummaryPanel run={run} /> : null}
      </div>

      <div className="flex shrink-0 justify-end pt-2">
        <AppButton type="button" variant="outline" size="sm" onClick={onClose}>
          Close
        </AppButton>
      </div>
    </AppDialog>
  );
});

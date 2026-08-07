import React, { memo } from "react";
import { cx, ui } from "@/constants/ui";
import { AppButton } from "@/components/common/AppButton";
import { TrashIcon } from "@/components/shared/Icons";
import { BT_COPY } from "@/constants/backtesting";
import { BT_MUTED, fmtDateTime } from "../utils/format";
import { integrityLabel, integrityTone } from "../utils/integrity";

const TH = "px-3 py-2 text-left font-medium border-b border-[rgba(60,40,80,0.35)] whitespace-nowrap";
const TD = "px-3 py-2 align-top";

/**
 * Saved analytics whose branch was deleted. Read-only by construction: the
 * matrix was copied at save time, so the record survives its runs.
 */
export const AnalyticsArchivePanel = memo(function AnalyticsArchivePanel({ archive, onDelete }) {
  if (!archive || archive.length === 0) {
    return (
      <div className={cx("px-1 text-[11px]", ui.textSubtle)}>
        The archive is empty — no saved analytics has lost its branch yet.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className={cx("text-[10px]", ui.textSubtle)}>{BT_COPY.archiveHint}</div>
      <div className="overflow-x-auto rounded-lg border border-[rgba(60,40,80,0.35)] bg-[#120b20]">
        <table className="w-full border-collapse text-[11px]">
          <thead className="bg-[#19102b] text-[#8c8c8c]">
            <tr>
              <th className={TH}>ID</th>
              <th className={TH}>Deleted backtest</th>
              <th className={TH}>Combination</th>
              <th className={TH}>Integrity</th>
              <th className={TH}>Author · Saved</th>
              <th className={TH}>Note</th>
              <th className={TH}>Actions</th>
            </tr>
          </thead>
          <tbody className="text-[#d9d9d9]">
            {archive.map((item) => (
              <tr
                key={`${item.backtestId}:${item.id}`}
                className="border-b border-[rgba(60,40,80,0.22)] hover:bg-[#1a1430]"
              >
                <td className={cx(TD, "font-mono")}>
                  ▤ {item.id} <span className="text-[10px] text-[#6e6682]">🔒</span>
                </td>
                <td className={cx(TD, "font-mono text-[10px] text-[#b8aecc]")}>{item.backtestId}</td>
                <td className={cx(TD, "font-mono text-[10px]")}>
                  <div>⇄ {item.shufflerRunId || <span className={BT_MUTED}>—</span>}</div>
                  <div>∿ {item.syntheticRunId || <span className={BT_MUTED}>—</span>}</div>
                </td>
                <td className={cx(TD, "whitespace-nowrap text-[10px]", integrityTone(item.integrity?.level))}>
                  {integrityLabel(item.integrity?.level)}
                </td>
                <td className={cx(TD, "whitespace-nowrap text-[10px] text-[#b8aecc]")}>
                  <div>{item.author || "—"}</div>
                  <div className="tabular-nums text-[#6e6682]">{fmtDateTime(item.savedAt)}</div>
                </td>
                <td className={cx(TD, "max-w-[260px]")}>
                  {item.note ? (
                    <div className="truncate text-[10px] text-[#b8aecc]" title={item.note}>
                      {item.note}
                    </div>
                  ) : (
                    <span className={BT_MUTED}>—</span>
                  )}
                </td>
                <td className={TD}>
                  <AppButton
                    type="button"
                    variant="outline"
                    size="icon-xs"
                    onClick={() => onDelete?.(item)}
                    title="Delete archived analytics"
                    aria-label="Delete archived analytics"
                    className="border-red-500/60 text-red-400 hover:bg-red-500/10"
                  >
                    <TrashIcon />
                  </AppButton>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
});

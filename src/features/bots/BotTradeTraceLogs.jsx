import React, { useMemo } from "react";
import { AppButton } from "@/components/common/AppButton";
import { AppDialog } from "@/components/common/AppDialog";
import { buildTradeTraceLogs, formatTraceTime, tradeTraceHeadline } from "./botsTradeTrace";

const STATUS_MARK = {
  ok: { mark: "✓", className: "text-emerald-400" },
  sent: { mark: "→", className: "text-violet-300" },
  fail: { mark: "✗", className: "text-red-400" },
};

export function BotTradeTraceLogs({ trade, strategy, onClose }) {
  const rows = useMemo(() => buildTradeTraceLogs(trade, strategy), [trade, strategy]);
  if (!trade) return null;

  return (
    <AppDialog
      open
      onOpenChange={(open) => !open && onClose?.()}
      title="Trace logs"
      description={tradeTraceHeadline(trade)}
      className="max-w-[640px]"
    >
      <div className="overflow-x-auto rounded-lg border border-[rgba(60,40,80,0.35)] bg-[#120b20]">
        <table className="w-full min-w-[520px] border-collapse text-[12px]">
          <tbody>
            {rows.map((row, index) => {
              const status = STATUS_MARK[row.status] || STATUS_MARK.ok;
              return (
                <tr key={`${row.label}-${row.at}-${index}`} className="border-t border-[rgba(60,40,80,0.35)] first:border-t-0">
                  <td className="whitespace-nowrap px-3 py-2 align-top tabular-nums text-muted-foreground">
                    {formatTraceTime(row.at)}
                  </td>
                  <td className={`w-6 px-1 py-2 align-top text-center font-medium ${status.className}`}>
                    {status.mark}
                  </td>
                  <td className="whitespace-nowrap px-2 py-2 align-top font-medium text-violet-100">
                    {row.label}
                  </td>
                  <td className="px-3 py-2 align-top text-[#b8aecc]">
                    {row.detail}
                  </td>
                </tr>
              );
            })}
            {!rows.length ? (
              <tr>
                <td colSpan={4} className="p-6 text-center text-muted-foreground">
                  No trace events for this trade.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      <div className="flex justify-end border-t border-border pt-3">
        <AppButton onClick={onClose}>Close</AppButton>
      </div>
    </AppDialog>
  );
}

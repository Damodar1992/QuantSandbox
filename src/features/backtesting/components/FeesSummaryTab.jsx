import React, { memo, useMemo } from "react";
import { cx, ui } from "@/constants/ui";
import { BT_FEES_TOOLTIPS } from "@/constants/backtesting";
import { BT_MUTED, BT_NEGATIVE, BT_NEUTRAL } from "../utils/format";
import { buildFeesSummary, fmtMoneyUsdt } from "../utils/feesSettingsSummary";
import { BtHeaderWithHelp } from "./BtInfoTooltip";

const TH =
  "px-3 py-2 text-left text-[10px] font-medium uppercase tracking-wide border-b border-[rgba(60,40,80,0.35)] text-[#8c8c8c] whitespace-nowrap";
const TD = "px-3 py-2 align-middle text-[11px] font-mono tabular-nums whitespace-nowrap";

function feeCell(value, { naNull = true } = {}) {
  if (naNull && (value == null || value === "")) {
    return <span className={BT_MUTED}>N/A</span>;
  }
  const text = fmtMoneyUsdt(value);
  const tone = Number(value) < 0 ? BT_NEGATIVE : BT_NEUTRAL;
  return <span className={tone}>{text}</span>;
}

function FeeHeader({ tipKey, children }) {
  const tip = BT_FEES_TOOLTIPS[tipKey];
  if (!tip) return children;
  return (
    <BtHeaderWithHelp label={String(children)} tip={tip}>
      <span className="border-b border-dotted border-[#8c8c8c]/60">{children}</span>
    </BtHeaderWithHelp>
  );
}

export const FeesSummaryTab = memo(function FeesSummaryTab({ run }) {
  const fees = useMemo(() => {
    if (run?.result?.fees) return run.result.fees;
    if (!run?.result?.core) return null;
    return buildFeesSummary(run);
  }, [run]);

  if (!fees?.rows?.length) {
    return (
      <div className={cx(ui.radius, ui.panelMuted, "px-4 py-10 text-center text-[12px]", ui.textSubtle)}>
        No fees summary for this run.
      </div>
    );
  }

  const allRows = [...fees.rows, fees.total].filter(Boolean);

  return (
    <div className="space-y-3">
      <div>
        <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-[#d9d9d9]">
          Fees for open and closed orders
        </div>
        {fees.subtitle ? (
          <div className={cx("mb-3 text-[10px] leading-snug", ui.textSubtle)}>{fees.subtitle}</div>
        ) : null}
      </div>

      <div className="overflow-x-auto rounded-lg border border-[rgba(60,40,80,0.35)]">
        <table className="w-full border-collapse">
          <thead className="bg-[#19102b]">
            <tr>
              <th className={TH}>Pair</th>
              <th className={TH}>
                <FeeHeader tipKey="openTaker">Open taker fee</FeeHeader>
              </th>
              <th className={TH}>
                <FeeHeader tipKey="openMaker">Open maker fee</FeeHeader>
              </th>
              <th className={TH}>Total open fee</th>
              <th className={TH}>
                <FeeHeader tipKey="closeTaker">Close taker fee</FeeHeader>
              </th>
              <th className={TH}>
                <FeeHeader tipKey="closeMaker">Close maker fee</FeeHeader>
              </th>
              <th className={TH}>Total close fee</th>
            </tr>
          </thead>
          <tbody>
            {allRows.map((row) => {
              const isTotal = row.pair === "TOTAL";
              return (
                <tr
                  key={row.pair}
                  className={cx(
                    "border-b border-[rgba(60,40,80,0.22)] last:border-b-0",
                    isTotal && "bg-[#161022]",
                  )}
                >
                  <td
                    className={cx(
                      TD,
                      "font-sans",
                      isTotal ? "font-semibold text-[#faf7fd]" : "text-[#d9d9d9]",
                    )}
                  >
                    {row.pair}
                  </td>
                  <td className={TD}>{feeCell(row.openTaker)}</td>
                  <td className={TD}>{feeCell(row.openMaker)}</td>
                  <td className={TD}>{feeCell(row.totalOpen, { naNull: false })}</td>
                  <td className={TD}>{feeCell(row.closeTaker)}</td>
                  <td className={TD}>{feeCell(row.closeMaker)}</td>
                  <td className={TD}>{feeCell(row.totalClose, { naNull: false })}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
});

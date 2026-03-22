import React, { memo } from "react";
import { cx, ui } from "../../../constants/ui";
import { BASE_INDICATORS } from "../../../constants/indicators";

export const IndicatorItem = memo(({ indicator, index, total, onEdit, onDelete }) => {
  const baseInfo = BASE_INDICATORS[indicator.type];
  const paramsText = indicator.params
    .map((p) => `${p.label}: ${p.default} [${p.min}-${p.max}, step ${p.step}]`)
    .join(", ");
  const combinations = indicator.params.reduce((total, param) => {
    const count = Math.floor((param.max - param.min) / param.step) + 1;
    return total * count;
  }, 1);

  return (
    <div
      className={cx(
        ui.radius,
        "border p-3 transition-all",
        indicator.enabled
          ? "border-[#303030] bg-[#0f0f0f]"
          : "border-[#303030] bg-[#0f0f0f]/50 opacity-60"
      )}
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-[12px] font-medium text-[#d9d9d9]">{indicator.name}</span>
            {indicator.displayName && (
              <span className="text-[10px] px-2 py-0.5 rounded border border-emerald-500/40 bg-emerald-500/10 text-emerald-300 font-medium">
                Display: {indicator.displayName}
              </span>
            )}
            <span className="text-[10px] px-2 py-0.5 rounded border border-[#303030] bg-[#0f0f0f] text-[#8c8c8c]">
              {indicator.type}
            </span>
            {baseInfo && (
              <span
                className={cx(
                  "text-[10px] px-2 py-0.5 rounded border",
                  baseInfo.group === "Trend"
                    ? "border-blue-500/40 bg-blue-500/10 text-blue-200"
                    : baseInfo.group === "Momentum"
                      ? "border-purple-500/40 bg-purple-500/10 text-purple-200"
                      : baseInfo.group === "Volatility"
                        ? "border-orange-500/40 bg-orange-500/10 text-orange-200"
                        : "border-amber-500/40 bg-amber-500/10 text-amber-200"
                )}
              >
                {baseInfo.group}
              </span>
            )}
            <span className="text-[10px] px-2 py-0.5 rounded border border-[#303030] bg-[#0f0f0f] text-[#8c8c8c]">
              Source: {indicator.source}
            </span>
            {combinations > 1 && (
              <span className="text-[10px] px-2 py-0.5 rounded border border-emerald-500/40 bg-emerald-500/10 text-emerald-300 font-medium">
                {combinations.toLocaleString()} combinations
              </span>
            )}
          </div>
          <div className={cx("text-[11px]", ui.textMuted)}>{paramsText}</div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onEdit}
            className={cx(ui.btn, "h-7 px-2 text-[11px]")}
            title="Edit"
          >
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5">
              <path
                d="M16.9 3.7a2.1 2.1 0 0 1 3 3L8.4 18.2 4 19.4l1.2-4.4L16.9 3.7z"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            </svg>
          </button>
          <button
            onClick={onDelete}
            className={cx(ui.btn, "h-7 px-2 text-[11px] text-red-200 hover:bg-red-500/10")}
            title="Delete"
          >
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5">
              <path
                d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14z"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
});

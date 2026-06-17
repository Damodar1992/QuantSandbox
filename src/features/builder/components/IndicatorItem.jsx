import React, { memo } from "react";
import { cx, ui } from "../../../constants/ui";
import { crmAccent, crmSurface } from "../../../constants/crmAccent";
import { BASE_INDICATORS } from "../../../constants/indicators";

export const IndicatorItem = memo(({ indicator, index, total, onEdit, onDelete, variant = "default" }) => {
  const baseInfo = BASE_INDICATORS[indicator.type];
  const paramsText = (indicator.params || [])
    .map((p) => `${p.label}: ${p.default} [${p.min}-${p.max}, step ${p.step}]`)
    .join(", ");
  const combinations = (indicator.params || []).reduce((total, param) => {
    const count = Math.floor((param.max - param.min) / param.step) + 1;
    return total * count;
  }, 1);

  if (variant === "summary") {
    return (
      <div
        className={cx(
          ui.radius,
          "border p-3 transition-all",
          crmSurface.border,
          crmSurface.input,
        )}
      >
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className={cx("text-[12px] font-medium", crmSurface.text)}>{indicator.displayName || indicator.name}</span>
              <span className={cx("text-[10px] px-2 py-0.5 rounded border text-muted-foreground", crmSurface.border, crmSurface.input)}>
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
                          : "border-amber-500/40 bg-amber-500/10 text-amber-200",
                  )}
                >
                  {baseInfo.group}
                </span>
              )}
            </div>
            <div className={cx("text-[10px] line-clamp-2", ui.textMuted)}>{paramsText || "—"}</div>
          </div>
          <button
            type="button"
            onClick={onDelete}
            className={cx(ui.btn, "h-7 px-2 text-[11px] text-red-200 hover:bg-red-500/10 shrink-0")}
            title="Remove from strategy"
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
    );
  }

  return (
    <div
      className={cx(
        ui.radius,
        "border p-3 transition-all",
        indicator.enabled
          ? cx(crmSurface.border, crmSurface.input)
          : cx(crmSurface.border, crmSurface.input, "opacity-60")
      )}
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={cx("text-[12px] font-medium", crmSurface.text)}>{indicator.name}</span>
            {indicator.displayName && (
              <span className={cx("text-[10px] px-2 py-0.5 rounded border font-medium", crmAccent.border, crmAccent.bg, crmAccent.textMuted)}>
                Display: {indicator.displayName}
              </span>
            )}
            <span className={cx("text-[10px] px-2 py-0.5 rounded border text-muted-foreground", crmSurface.border, crmSurface.input)}>
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
            <span className={cx("text-[10px] px-2 py-0.5 rounded border text-muted-foreground", crmSurface.border, crmSurface.input)}>
              Source: {indicator.source}
            </span>
            {combinations > 1 && (
              <span className={cx("text-[10px] px-2 py-0.5 rounded border font-medium", crmAccent.border, crmAccent.bg, crmAccent.textMuted)}>
                {combinations.toLocaleString()} combinations
              </span>
            )}
          </div>
          <div className={cx("text-[11px]", ui.textMuted)}>{paramsText}</div>
        </div>
        <div className="flex items-center gap-1">
          {onEdit && (
            <button
              type="button"
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
          )}
          <button
            type="button"
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

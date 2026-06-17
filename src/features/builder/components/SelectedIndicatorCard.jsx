import React, { memo, useState } from "react";
import { cx } from "@/constants/ui";
import { BASE_INDICATORS } from "@/constants/indicators";
import { getDefaultDisplayName, getIndicatorOutputAliases } from "../utils/indicatorHelpers";

function groupBadgeClass(group) {
  switch (group) {
    case "Trend":
      return "border-blue-500/40 bg-blue-500/10 text-blue-300";
    case "Momentum":
      return "border-purple-500/40 bg-purple-500/10 text-purple-300";
    case "Volatility":
      return "border-orange-500/40 bg-orange-500/10 text-orange-300";
    default:
      return "border-amber-500/40 bg-amber-500/10 text-amber-300";
  }
}

function ParamPill({ children }) {
  return (
    <span className="inline-flex items-center rounded-full border border-violet-500/35 bg-[#170f29] px-2 py-0.5 text-[10px] text-[#ddd6fe] whitespace-nowrap">
      {children}
    </span>
  );
}

function SelectedIndicatorParamRow({ param }) {
  const label = (param.label || param.key || "").toUpperCase();

  return (
    <div className="space-y-1.5 rounded-lg border border-[rgba(60,40,80,0.35)] bg-[#140d22]/80 px-3 py-2">
      <span className="text-[10px] font-medium tracking-wide text-[#b8aecc]">{label}</span>
      <div className="flex flex-wrap items-center gap-1">
        <ParamPill>Default: {param.default}</ParamPill>
        <ParamPill>
          Range: {param.min} {"->"} {param.max}
        </ParamPill>
        <ParamPill>Step: {param.step}</ParamPill>
      </div>
    </div>
  );
}

export const selectedIndicatorsGridClass =
  "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 items-start";

export const indicatorRangesListClass = "flex flex-col gap-2";

export const SelectedIndicatorCard = memo(function SelectedIndicatorCard({
  indicator,
  variant = "default",
  defaultExpanded = false,
  onDelete,
  onEditRanges,
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const baseInfo = BASE_INDICATORS[indicator.type];
  const displayName =
    indicator.displayName ||
    indicator.type?.toLowerCase() ||
    getDefaultDisplayName(indicator.type);
  const outputs = getIndicatorOutputAliases({ ...indicator, enabled: true });
  const outputCount = Math.max(outputs.length, 1);
  const groupLabel = (baseInfo?.group || "Custom").toLowerCase();

  if (variant === "compact") {
    return (
      <div className="flex items-center gap-2 rounded-md border border-[rgba(60,40,80,0.35)] bg-[#19102b]/50 px-2.5 py-2">
        <div className="min-w-0 flex-1">
          <div className="truncate text-[12px] font-semibold text-[#faf7fd]">{displayName}</div>
          <span
            className={cx(
              "mt-1 inline-flex rounded-full border px-1.5 py-0 text-[9px] font-medium capitalize",
              groupBadgeClass(baseInfo?.group),
            )}
          >
            {groupLabel}
          </span>
        </div>
        {onDelete ? (
          <button
            type="button"
            onClick={onDelete}
            className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-red-400/80 hover:bg-red-500/10 hover:text-red-400"
            title="Remove indicator"
            aria-label="Remove indicator"
          >
            <svg viewBox="0 0 24 24" className="h-3 w-3" aria-hidden>
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
        ) : null}
      </div>
    );
  }

  return (
    <div className="h-full overflow-hidden rounded-lg border border-[rgba(60,40,80,0.35)] bg-[#19102b]/50">
      <div className="flex items-start justify-between gap-2 px-3 py-2.5">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="min-w-0 flex-1 text-left"
        >
          <div className="truncate text-[13px] font-semibold text-[#faf7fd]">{displayName}</div>
          <div className="mt-1.5 flex flex-wrap items-center gap-1">
            <span
              className={cx(
                "rounded-full border px-2 py-0.5 text-[10px] font-medium capitalize",
                groupBadgeClass(baseInfo?.group),
              )}
            >
              {groupLabel}
            </span>
            <span className="rounded-full border border-violet-500/35 bg-[#170f29] px-2 py-0.5 text-[10px] text-[#c4b5fd]">
              outputs: {outputCount}
            </span>
          </div>
        </button>

        <div className="flex shrink-0 items-center gap-1">
          {onEditRanges ? (
            <button
              type="button"
              onClick={() => onEditRanges(indicator)}
              className="inline-flex h-7 items-center justify-center rounded-md bg-violet-700 px-2 text-[10px] font-medium text-[#faf7fd] hover:bg-violet-600"
            >
              Edit
            </button>
          ) : onDelete ? (
            <button
              type="button"
              onClick={onDelete}
              className="inline-flex h-7 w-7 items-center justify-center rounded-md text-red-400 hover:bg-red-500/10"
              title="Remove indicator"
              aria-label="Remove indicator"
            >
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" aria-hidden>
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
          ) : null}
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-[#b8aecc] hover:bg-[#2c1b46]/60"
            aria-label={expanded ? "Collapse indicator" : "Expand indicator"}
          >
            <span className="text-[11px]">{expanded ? "▼" : "▶"}</span>
          </button>
        </div>
      </div>

      {expanded && (indicator.params?.length ?? 0) > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2 border-t border-[rgba(60,40,80,0.35)] px-3 py-3">
          {indicator.params.map((param) => (
            <SelectedIndicatorParamRow key={param.key} param={param} />
          ))}
        </div>
      ) : null}
    </div>
  );
});

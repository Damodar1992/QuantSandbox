import React, { memo } from "react";
import { CircleHelp } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cx, ui } from "../../../../constants/ui";

const FIELD_TOOLTIPS = {
  plateauWidth:
    "How far below the peak a value may fall and still be kept. Example: best value averages 0.38, worst −0.10; at 50% the cutoff is 0.14 — values averaging above 0.14 form the working zone. Only the continuous run of such values around the peak becomes the range: good values separated from the peak by a dip are dropped. Wider zone → wider ranges → more combinations.",
  minImportance:
    "Importance = share of the final score variation explained by the parameter. It is computed automatically from the broad run — not set manually. Parameters at or above the threshold stay active and get a narrowed range. Parameters below it are fixed: out of all their tested values, the one with the highest average final score is kept, all others are dropped from the next run. Example: values 0 / 1 / 2 with average scores 0.10 / 0.30 / 0.20 → fixed at 1.",
  maxCombinations:
    'Hard upper limit for the size of the next run. It is a cap, not a target — ranges are never widened just to fill it. The budget is spread by importance — more important parameters get more tested values. If the total still exceeds the limit, the parameter that currently has the most values gives them up first (its step gets coarser). If the limit cannot give every active parameter at least 2 values, the run stops with an explicit error: raise the limit or raise "Min importance to keep".',
  minEpochsPerValue:
    "The check: for every tested value of each indicator parameter the system counts how many epochs of the source run used that value. If a parameter value appears in fewer epochs than this limit, its average score is treated as unreliable — possibly a lucky accident — and it cannot enter the kept range. Example with limit 5: timeperiod = 20 was tested in only 4 epochs with average score 0.90 — skipped despite the great score; timeperiod = 10 was tested in 800 epochs — stays.",
  marginEnabled:
    'Optional second config with the same logic but slightly wider ranges — a safety net in case the true optimum sits just outside the narrowed range. How much wider is set by "Margin widen" below. Fixed parameters stay fixed. The margin config respects the same Max combinations limit.',
  marginWiden:
    "Each side of every active range is extended by this many grid steps of that parameter. Example: range 10–30, grid step 5, widen 2 → margin range 0–40 (never beyond the tested min/max). Guidance: 2 is a good default — two extra tested values per side; 1 = light safety margin; 0 = margin equals the main config. Larger values quickly grow combinations and defeat the purpose of narrowing.",
};

function FieldHelpTooltip({ text, label }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className="inline-flex shrink-0 text-violet-400 hover:text-violet-300 pointer-events-auto"
          aria-label={`Help: ${label}`}
          onClick={(e) => e.preventDefault()}
        >
          <CircleHelp className="h-3.5 w-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" sideOffset={6} className="max-w-[320px] text-[11px] leading-snug whitespace-normal">
        {text}
      </TooltipContent>
    </Tooltip>
  );
}

export const RangeNarrowingFormFields = memo(function RangeNarrowingFormFields({
  plateauWidth,
  onPlateauWidthChange,
  minImportance,
  onMinImportanceChange,
  maxCombinations,
  onMaxCombinationsChange,
  minEpochsPerValue,
  onMinEpochsPerValueChange,
  marginEnabled,
  onMarginEnabledChange,
  marginWiden,
  onMarginWidenChange,
  readOnly = false,
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#d9d9d9]">
            <span>
              Plateau width: <span className="text-violet-300">{plateauWidth}%</span>
            </span>
            <FieldHelpTooltip label="Plateau width" text={FIELD_TOOLTIPS.plateauWidth} />
          </div>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={plateauWidth}
            disabled={readOnly}
            onChange={(e) => onPlateauWidthChange(Number(e.target.value))}
            className="w-full h-2 accent-violet-500"
          />
          <div className="text-[10px] text-[#8c8c8c]">
            0% = keep the peak value only, 100% = keep the whole tested range.
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#d9d9d9]">
            <span>
              Min importance to keep: <span className="text-violet-300">{minImportance}%</span>
            </span>
            <FieldHelpTooltip label="Min importance to keep" text={FIELD_TOOLTIPS.minImportance} />
          </div>
          <input
            type="range"
            min={0}
            max={10}
            step={0.5}
            value={minImportance}
            disabled={readOnly}
            onChange={(e) => onMinImportanceChange(Number(e.target.value))}
            className="w-full h-2 accent-violet-500"
          />
          <div className="text-[10px] text-[#8c8c8c]">
            Parameters below this importance are fixed at their best value.
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="flex items-center gap-1.5 text-[11px] font-medium text-[#d9d9d9]">
            Max combinations
            <FieldHelpTooltip label="Max combinations" text={FIELD_TOOLTIPS.maxCombinations} />
          </label>
          <input
            type="number"
            min={1}
            value={maxCombinations}
            disabled={readOnly}
            onChange={(e) => onMaxCombinationsChange(Number(e.target.value))}
            className={cx(ui.input, "h-9 text-[12px] w-full")}
          />
          <div className="text-[10px] text-[#8c8c8c]">
            The generated config will never exceed this number of combinations.
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="flex items-center gap-1.5 text-[11px] font-medium text-[#d9d9d9]">
            Min epochs per value
            <FieldHelpTooltip label="Min epochs per value" text={FIELD_TOOLTIPS.minEpochsPerValue} />
          </label>
          <input
            type="number"
            min={1}
            value={minEpochsPerValue}
            disabled={readOnly}
            onChange={(e) => onMinEpochsPerValueChange(Number(e.target.value))}
            className={cx(ui.input, "h-9 text-[12px] w-full")}
          />
          <div className="text-[10px] text-[#8c8c8c] leading-snug">
            Parameter values tested on fewer epochs are ignored during range selection.
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 rounded-lg border border-[#303030] bg-[#0f0f0f]/50 p-3">
        <button
          type="button"
          role="switch"
          aria-checked={marginEnabled}
          disabled={readOnly}
          onClick={() => !readOnly && onMarginEnabledChange(!marginEnabled)}
          className={cx(
            "relative shrink-0 h-6 w-10 rounded-full border-2 transition-colors",
            marginEnabled ? "bg-violet-600 border-violet-500" : "bg-[#303030] border-[#404040]",
          )}
        >
          <span
            className={cx(
              "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform",
              marginEnabled ? "translate-x-4 left-0.5" : "translate-x-0 left-0.5",
            )}
          />
        </button>
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="text-[12px] font-medium text-[#d9d9d9]">
            Also generate config «margin» (safety range)
          </div>
          <FieldHelpTooltip
            label="Also generate config margin"
            text={FIELD_TOOLTIPS.marginEnabled}
          />
        </div>
      </div>

      {marginEnabled && (
        <div className="flex flex-col gap-1.5">
          <label className="flex items-center gap-1.5 text-[11px] font-medium text-[#d9d9d9]">
            <span>Margin widen (original grid steps per side, for the «margin» config)</span>
            <FieldHelpTooltip label="Margin widen" text={FIELD_TOOLTIPS.marginWiden} />
          </label>
          <input
            type="number"
            min={0}
            value={marginWiden}
            disabled={readOnly}
            onChange={(e) => onMarginWidenChange(Number(e.target.value))}
            className={cx(ui.input, "h-9 text-[12px] w-full")}
          />
          <div className="text-[10px] text-[#8c8c8c]">
            How many original grid steps to add on each side of every active range.
          </div>
        </div>
      )}
    </div>
  );
});

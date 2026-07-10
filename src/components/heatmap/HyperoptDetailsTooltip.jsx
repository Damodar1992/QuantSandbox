import React, { memo } from "react";
import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { AppButton } from "@/components/common/AppButton";

export const HyperoptDetailsTooltip = memo(function HyperoptDetailsTooltip({
  onShowDetails,
  title = "Formulas info",
  ariaLabel = "Show formulas info",
  label = "Info",
  iconOnly = false,
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <AppButton
          type="button"
          variant="outline"
          size={iconOnly ? "icon-xs" : "xs"}
          onClick={() => onShowDetails?.()}
          aria-label={ariaLabel}
          title={iconOnly ? title : undefined}
          className={
            iconOnly
              ? undefined
              : "h-6 rounded-full px-2 text-[10px] text-[#8c8c8c] hover:text-[#d9d9d9]"
          }
        >
          {iconOnly ? <Info className="h-3.5 w-3.5 shrink-0" /> : label}
        </AppButton>
      </TooltipTrigger>
      <TooltipContent side="top" className="text-xs">
        {title}
      </TooltipContent>
    </Tooltip>
  );
});

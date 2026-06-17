import React, { memo } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { AppButton } from "@/components/common/AppButton";

export const HyperoptDetailsTooltip = memo(function HyperoptDetailsTooltip({
  onShowDetails,
  title = "Formulas info",
  ariaLabel = "Show formulas info",
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <AppButton
          type="button"
          variant="outline"
          size="xs"
          onClick={() => onShowDetails?.()}
          aria-label={ariaLabel}
          className="h-6 rounded-full px-2 text-[10px] text-[#8c8c8c] hover:text-[#d9d9d9]"
        >
          Info
        </AppButton>
      </TooltipTrigger>
      <TooltipContent side="top" className="text-xs">
        {title}
      </TooltipContent>
    </Tooltip>
  );
});

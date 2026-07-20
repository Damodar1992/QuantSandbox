import React, { memo } from "react";
import { Star } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AppButton } from "../../../../components/common/AppButton";
import { cx, ui } from "../../../../constants/ui";

export const PostProcessingEpochMenu = memo(function PostProcessingEpochMenu({
  onBestEpochs,
  onRunMiniBacktest,
  miniBacktestEnabled = false,
  useLegacyBtn = false,
  iconOnly = false,
  showEpochs = true,
  className,
}) {
  if (!showEpochs) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {iconOnly ? (
          <AppButton
            type="button"
            variant="outline"
            size="icon-xs"
            title="Epochs"
            aria-label="Epochs"
            className={className}
          >
            <Star className="h-3.5 w-3.5 shrink-0" />
          </AppButton>
        ) : useLegacyBtn ? (
          <button type="button" className={cx(ui.btn, "h-7 px-2 text-[10px] whitespace-nowrap", className)}>
            Epochs ▾
          </button>
        ) : (
          <AppButton type="button" variant="outline" size="sm" className={className}>
            Epochs ▾
          </AppButton>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="z-[200] min-w-[168px]">
        <DropdownMenuItem className="text-xs" onClick={() => onBestEpochs?.()}>
          Best Epochs
        </DropdownMenuItem>
        {miniBacktestEnabled ? (
          <DropdownMenuItem className="text-xs" onClick={() => onRunMiniBacktest?.()}>
            Run Mini Backtest
          </DropdownMenuItem>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
});

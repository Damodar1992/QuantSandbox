import React, { memo } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AppButton } from "../../../../components/common/AppButton";

export const PostProcessingAnalyticsMenu = memo(function PostProcessingAnalyticsMenu({
  onConfigureHeatMap,
  onGenerateFullReport,
  onGenerateTopKReport,
  onAddTruncate,
  showAddTruncate = true,
  className,
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <AppButton
          type="button"
          variant="outline"
          size="sm"
          className={`h-7 px-2 text-[10px] whitespace-nowrap ${className || ""}`}
        >
          Analytics ▾
        </AppButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="z-[200] min-w-[180px]">
        <DropdownMenuItem className="text-xs" onClick={() => onConfigureHeatMap?.()}>
          Configure HeatMap
        </DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="text-xs">Generate Report</DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="z-[210] min-w-[148px]">
            <DropdownMenuItem className="text-xs" onClick={() => onGenerateFullReport?.()}>
              Full report
            </DropdownMenuItem>
            <DropdownMenuItem className="text-xs" onClick={() => onGenerateTopKReport?.()}>
              TopK report
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        {showAddTruncate ? (
          <DropdownMenuItem className="text-xs" onClick={() => onAddTruncate?.()}>
            Add truncate
          </DropdownMenuItem>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
});

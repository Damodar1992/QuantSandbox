import React, { memo } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AppButton } from "@/components/common/AppButton";
import { MoreIcon } from "../common";

export const IndicatorActionsMenu = memo(({ indicator, onArchiveOrActivate, onUpdate, align = "right" }) => {
  const isArchived = indicator.status === "Archived";
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <AppButton variant="outline" size="icon-sm" title="Actions" aria-label="Indicator actions">
          <MoreIcon className="h-4 w-4" />
        </AppButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align === "right" ? "end" : "start"} className="w-40">
        <DropdownMenuItem className="text-xs" onClick={() => onArchiveOrActivate?.(indicator)}>
          {isArchived ? "Activate" : "Archive"}
        </DropdownMenuItem>
        <DropdownMenuItem className="text-xs" onClick={() => onUpdate?.(indicator)}>Update</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
});

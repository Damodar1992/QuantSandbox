import React, { memo } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AppButton } from "@/components/common/AppButton";
import { MoreIcon } from "../common";

export const RowActionMenu = memo(({ onDuplicate, onDelete, align = "right" }) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <AppButton variant="outline" size="icon-sm" title="More" aria-label="More actions">
        <MoreIcon className="h-4 w-4" />
      </AppButton>
    </DropdownMenuTrigger>
    <DropdownMenuContent align={align === "right" ? "end" : "start"} className="w-56">
      <DropdownMenuItem
        onClick={() => onDuplicate?.()}
        className="text-xs"
      >
        Duplicate strategy
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem
        onClick={() => onDelete?.()}
        className="text-xs text-red-200 focus:text-red-200"
      >
        Delete strategy
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
));

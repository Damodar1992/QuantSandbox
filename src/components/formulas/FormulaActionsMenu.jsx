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

export const FormulaActionsMenu = memo(({ formula, onEdit, onDelete, align = "right" }) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <AppButton variant="outline" size="icon-sm" title="Actions" aria-label="Formula actions">
        <MoreIcon className="h-4 w-4" />
      </AppButton>
    </DropdownMenuTrigger>
    <DropdownMenuContent align={align === "right" ? "end" : "start"} className="w-36">
      <DropdownMenuItem className="text-xs" onClick={() => onEdit?.(formula)}>Edit</DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem className="text-xs text-red-200 focus:text-red-200" onClick={() => onDelete?.(formula)}>Delete</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
));

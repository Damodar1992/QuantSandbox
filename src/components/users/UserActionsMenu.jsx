import React, { memo } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AppButton } from "@/components/common/AppButton";
import { MoreIcon } from "../common";

export const UserActionsMenu = memo(({ user, onEdit, onChangePassword, onResetPassword, align = "right" }) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <AppButton variant="outline" size="icon-sm" title="Actions" aria-label="User actions">
        <MoreIcon className="h-4 w-4" />
      </AppButton>
    </DropdownMenuTrigger>
    <DropdownMenuContent align={align === "right" ? "end" : "start"} className="w-48">
      <DropdownMenuItem className="text-xs" onClick={() => onEdit?.(user)}>Edit user</DropdownMenuItem>
      <DropdownMenuItem className="text-xs" onClick={() => onChangePassword?.(user)}>Change password</DropdownMenuItem>
      <DropdownMenuItem className="text-xs" onClick={() => onResetPassword?.(user)}>Reset password</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
));

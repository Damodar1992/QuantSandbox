import React, { memo } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreIcon } from "@/components/common";
import { cx } from "../../../constants/ui";
import { crmAccent, crmSurface } from "../../../constants/crmAccent";

export const StageVersionActionsMenu = memo(function StageVersionActionsMenu({
  disabled = false,
  hasSelectedVersion = false,
  hasComment = false,
  onNewVersion,
  onEditComment,
  onDeleteComment,
  onArchiveVersion,
  className,
}) {
  const menuDisabled = disabled;
  const versionActionsDisabled = menuDisabled || !hasSelectedVersion;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={menuDisabled}>
        <button
          type="button"
          disabled={menuDisabled}
          onClick={(e) => e.stopPropagation()}
          title="Version actions"
          aria-label="Version actions"
          className={cx(
            "relative inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border text-muted-foreground",
            crmSurface.border,
            crmSurface.input,
            "hover:bg-secondary hover:text-foreground focus:outline-none focus:ring-2",
            crmAccent.ring,
            hasComment && cx(crmAccent.border, crmAccent.textStrong),
            menuDisabled && cx("opacity-40 cursor-not-allowed", "hover:bg-background hover:text-muted-foreground"),
            className,
          )}
        >
          <MoreIcon className="h-3.5 w-3.5" />
          {hasComment && (
            <span
              className={cx("absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full ring-2 ring-background", crmAccent.dot)}
              aria-hidden
            />
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="min-w-[220px] border-[rgba(60,40,80,0.35)] bg-[#19102b] p-1.5"
        onClick={(e) => e.stopPropagation()}
      >
        <DropdownMenuItem
          className="text-[12px] text-[#faf7fd] focus:bg-[#2c1b46] focus:text-[#faf7fd]"
          disabled={menuDisabled}
          onSelect={() => onNewVersion?.()}
        >
          New version
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-[rgba(60,40,80,0.35)]" />
        <DropdownMenuItem
          className="text-[12px] text-[#faf7fd] focus:bg-[#2c1b46] focus:text-[#faf7fd]"
          disabled={versionActionsDisabled}
          onSelect={() => onEditComment?.()}
        >
          Edit comment
        </DropdownMenuItem>
        <DropdownMenuItem
          className="text-[12px] text-[#faf7fd] focus:bg-[#2c1b46] focus:text-[#faf7fd]"
          disabled={versionActionsDisabled || !hasComment}
          onSelect={() => onDeleteComment?.()}
        >
          Delete comment
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-[rgba(60,40,80,0.35)]" />
        <DropdownMenuItem
          variant="destructive"
          className="text-[12px] focus:bg-red-500/10"
          disabled={versionActionsDisabled}
          onSelect={() => onArchiveVersion?.()}
        >
          Archive strategy version
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
});

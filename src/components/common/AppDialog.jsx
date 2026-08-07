import React, { memo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export const AppDialog = memo(function AppDialog({
  open,
  onOpenChange,
  title,
  description,
  headerAction,
  children,
  className,
  showCloseButton = true,
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(className)} showCloseButton={showCloseButton}>
        {(title || description || headerAction) && (
          <DialogHeader>
            <div className="flex items-start justify-between gap-3 pr-8">
              <div className="min-w-0 space-y-1">
                {title ? <DialogTitle>{title}</DialogTitle> : null}
                {description ? <DialogDescription>{description}</DialogDescription> : null}
              </div>
              {headerAction ? <div className="shrink-0">{headerAction}</div> : null}
            </div>
          </DialogHeader>
        )}
        {children}
      </DialogContent>
    </Dialog>
  );
});

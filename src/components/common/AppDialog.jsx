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
  children,
  className,
  showCloseButton = true,
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(className)} showCloseButton={showCloseButton}>
        {(title || description) && (
          <DialogHeader>
            {title ? <DialogTitle>{title}</DialogTitle> : null}
            {description ? <DialogDescription>{description}</DialogDescription> : null}
          </DialogHeader>
        )}
        {children}
      </DialogContent>
    </Dialog>
  );
});

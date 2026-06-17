import React, { memo } from "react";
import { AppDialog } from "./AppDialog";

/** @deprecated Use AppDialog directly in new code. Kept for backward-compatible modal API. */
export const ModalShell = memo(({ title, onClose, children }) => (
  <AppDialog open onOpenChange={(open) => !open && onClose?.()} title={title}>
    {children}
  </AppDialog>
));

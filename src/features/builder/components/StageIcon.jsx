import React from "react";
import { cx } from "../../../constants/ui";
import { crmSurface } from "../../../constants/crmAccent";

/**
 * Small presentational icon wrapper for Builder stage labels.
 */
export function StageIcon({ children }) {
  return (
    <span
      className={cx(
        "inline-flex h-7 w-7 items-center justify-center rounded-md border text-muted-foreground",
        crmSurface.input,
        crmSurface.border,
      )}
    >
      {children}
    </span>
  );
}

import * as React from "react"

import { cn } from "@/lib/utils"
import { crm } from "./crm-theme"

function Input({
  className,
  type,
  ...props
}) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        crm.input,
        "w-full min-w-0",
        crm.focusRing,
        "aria-invalid:border-destructive aria-invalid:ring-destructive/30",
        className
      )}
      {...props} />
  );
}

export { Input }

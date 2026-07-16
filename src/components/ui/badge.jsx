import * as React from "react"
import { cva } from "class-variance-authority";
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-md border px-1.5 py-0.5 text-[10px] leading-4 font-medium whitespace-nowrap transition-all [&>svg]:pointer-events-none [&>svg]:size-3",
  {
    variants: {
      variant: {
        default: "bg-primary/10 text-primary border-primary/40",
        secondary:
          "bg-secondary text-secondary-foreground border-border",
        destructive:
          "bg-red-500/10 text-red-200 border-red-500/40",
        outline:
          "border-border text-foreground bg-background",
        ghost:
          "border-transparent text-muted-foreground",
        link: "border-transparent text-primary underline-offset-4 hover:underline",
        completed: "bg-[var(--crm-success-bg)] text-[var(--crm-success)] border-emerald-500/30",
        finished: "bg-[var(--crm-success-bg)] text-[var(--crm-success)] border-emerald-500/30",
        inProgress: "bg-blue-500/10 text-blue-200 border-blue-500/40",
        failed: "bg-red-500/10 text-red-200 border-red-500/40",
        warning: "bg-amber-500/10 text-amber-200 border-amber-500/40",
        muted: "bg-white/5 text-muted-foreground border-border",
        rawDeleted: "bg-violet-500/5 text-violet-400/60 border-dashed border-violet-500/25",
      },
    },
    defaultVariants: {
      variant: "outline",
    },
  }
)

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props} />
  );
}

export { Badge, badgeVariants }

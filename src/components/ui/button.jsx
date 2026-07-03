import * as React from "react"
import { cva } from "class-variance-authority";
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"
import { crm } from "./crm-theme"

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center rounded-md border font-medium whitespace-nowrap transition-colors outline-none select-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:opacity-90 active:translate-y-px",
        outline:
          "border-border bg-transparent text-foreground hover:bg-secondary active:translate-y-px",
        secondary:
          "border-border bg-secondary text-foreground hover:bg-muted",
        ghost:
          "border-transparent bg-transparent text-foreground hover:bg-secondary",
        destructive:
          "border-red-500/30 bg-red-500/10 text-red-200 hover:bg-red-500/20",
        link: "border-transparent bg-transparent text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-8 gap-1.5 px-3 text-[12px] [&_svg:not([class*='size-'])]:size-3.5",
        xs: "h-6 gap-1 px-2 text-[10px] [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 px-2.5 text-[11px] [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-9 gap-1.5 px-3 text-[12px] [&_svg:not([class*='size-'])]:size-4",
        icon: "size-8 [&_svg:not([class*='size-'])]:size-4",
        "icon-xs": "size-6 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-7 [&_svg:not([class*='size-'])]:size-3.5",
        "icon-lg": "size-9 [&_svg:not([class*='size-'])]:size-4",
      },
    },
    defaultVariants: {
      variant: "outline",
      size: "sm",
    },
  }
)

const Button = React.forwardRef(function Button(
  {
    className,
    variant = "outline",
    size = "sm",
    asChild = false,
    ...props
  },
  ref,
) {
  const Comp = asChild ? Slot.Root : "button";

  return (
    <Comp
      ref={ref}
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size }), crm.focusRing, className)}
      {...props}
    />
  );
});

export { Button, buttonVariants }

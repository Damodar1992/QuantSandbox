import React, { memo } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** @deprecated Prefer AppButton with variant prop instead of ui.btn / ui.btnPrimary strings. */
export { buttonVariants };

export const AppButton = memo(function AppButton({
  variant = "outline",
  size = "sm",
  className,
  ...props
}) {
  return <Button variant={variant} size={size} className={cn(className)} {...props} />;
});

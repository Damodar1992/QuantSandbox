import React, { memo } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Prod visual overrides layered on kit Button variants. */
const variants = {
  ghost:
    "border-transparent bg-transparent text-[#b8aecc] hover:bg-[#1e1333] hover:text-[#faf7fd]",
  outline:
    "border-[rgba(60,40,80,0.5)] bg-transparent text-[#b8aecc] hover:bg-[#1e1333]",
  solid: "border-transparent bg-violet-700 text-[#faf7fd] hover:bg-violet-600",
  headerControl:
    "border-[rgba(60,40,80,0.5)] bg-[#170f29] text-[#b8aecc] hover:bg-[#1e1333]",
};

/** Map Prod sizes → kit sizes; keep exact prod dimensions via className. */
const sizeMap = {
  sm: "xs",
  md: "default",
  lg: "lg",
};

const sizeClasses = {
  sm: "h-6 gap-2 px-2 text-[11px]",
  md: "h-8 gap-2 px-3 text-[12px]",
  lg: "h-10 gap-2 px-4 text-[14px]",
};

/** Kit variant closest to each Prod variant (visuals fully overridden anyway). */
const kitVariantMap = {
  ghost: "ghost",
  outline: "outline",
  solid: "default",
  headerControl: "outline",
};

export const ProdButton = memo(function ProdButton({
  variant = "ghost",
  size = "md",
  className,
  children,
  ...props
}) {
  const prodVariant = variants[variant] ? variant : "ghost";
  const prodSize = sizeClasses[size] ? size : "md";

  return (
    <Button
      type="button"
      variant={kitVariantMap[prodVariant]}
      size={sizeMap[prodSize]}
      className={cn(
        "gap-2 rounded-md border font-medium transition-colors",
        variants[prodVariant],
        sizeClasses[prodSize],
        className,
      )}
      {...props}
    >
      {children}
    </Button>
  );
});

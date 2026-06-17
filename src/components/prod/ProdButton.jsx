import React, { memo } from "react";
import { cx } from "@/constants/ui";

const variants = {
  ghost:
    "border-transparent bg-transparent text-[#b8aecc] hover:bg-[#1e1333] hover:text-[#faf7fd]",
  outline:
    "border-[rgba(60,40,80,0.5)] bg-transparent text-[#b8aecc] hover:bg-[#1e1333]",
  solid: "border-transparent bg-violet-700 text-[#faf7fd] hover:bg-violet-600",
  headerControl:
    "border-[rgba(60,40,80,0.5)] bg-[#170f29] text-[#b8aecc] hover:bg-[#1e1333]",
};

const sizes = {
  sm: "h-6 px-2 text-[11px]",
  md: "h-8 px-3 text-[12px]",
  lg: "h-10 px-4 text-[14px]",
};

export const ProdButton = memo(function ProdButton({
  variant = "ghost",
  size = "md",
  className,
  children,
  ...props
}) {
  return (
    <button
      type="button"
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-md border font-medium transition-colors",
        variants[variant] ?? variants.ghost,
        sizes[size] ?? sizes.md,
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
});

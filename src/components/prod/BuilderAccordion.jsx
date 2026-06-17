import React, { memo } from "react";
import { cx, ui } from "@/constants/ui";

export const BuilderAccordion = memo(function BuilderAccordion({
  title,
  subtitle,
  sectionNum,
  collapsed,
  onToggle,
  children,
  headerRight,
  className,
}) {
  return (
    <div className={cx(ui.builderSection, "builder-section-flat", className)}>
      <button
        type="button"
        onClick={onToggle}
        className={cx(
          "builder-section-trigger w-full flex items-center justify-between gap-2 text-left px-4 py-3",
          ui.builderSectionHeader,
          "hover:opacity-95 transition-opacity",
        )}
      >
        <div>
          <div className="builder-section-title font-medium">
            {sectionNum}. {title}
          </div>
          {subtitle ? (
            <div className="builder-section-subtitle mt-0.5">{subtitle}</div>
          ) : null}
        </div>
        <div className="flex items-center gap-3">
          {headerRight}
          <span className="text-muted-foreground text-[10px]">{collapsed ? "▶" : "▼"}</span>
        </div>
      </button>
      {!collapsed ? <div className="p-4">{children}</div> : null}
    </div>
  );
});

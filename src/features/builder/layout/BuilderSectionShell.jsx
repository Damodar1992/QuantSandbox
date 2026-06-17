import React, { memo } from "react";
import { cx, ui } from "@/constants/ui";
import { isProdUi } from "@/constants/uiVariant";
import { BuilderAccordion } from "@/components/prod/BuilderAccordion";

/** Section shell: legacy collapsible header or prod BuilderAccordion. */
export const BuilderSectionShell = memo(function BuilderSectionShell({
  sectionNum,
  title,
  subtitle,
  collapsed,
  onToggle,
  children,
  headerRight,
  className,
}) {
  if (isProdUi()) {
    return (
      <BuilderAccordion
        sectionNum={sectionNum}
        title={title}
        subtitle={subtitle}
        collapsed={collapsed}
        onToggle={onToggle}
        headerRight={headerRight}
        className={className}
      >
        {children}
      </BuilderAccordion>
    );
  }

  return (
    <div className={cx(ui.radius, ui.panel, "overflow-hidden", className)}>
      <button
        type="button"
        onClick={onToggle}
        className={cx(
          "builder-section-trigger w-full px-3 py-2 flex items-center justify-between gap-2 text-left",
          ui.panelMuted,
          "border-0 border-b",
          ui.divider,
          "hover:bg-[#1a1a1a] transition-colors",
        )}
      >
        <div>
          <div className="text-[12px] font-medium text-[#d9d9d9]">
            {sectionNum}. {title}
          </div>
          {subtitle ? <div className={cx("text-[11px]", ui.textMuted)}>{subtitle}</div> : null}
        </div>
        <div className="flex items-center gap-3">
          {headerRight}
          <span className="text-[#8c8c8c] text-[10px]">{collapsed ? "▶" : "▼"}</span>
        </div>
      </button>
      {!collapsed ? <div className="p-3">{children}</div> : null}
    </div>
  );
});

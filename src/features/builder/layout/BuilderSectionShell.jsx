import React, { memo } from "react";
import { BuilderAccordion } from "@/components/prod/BuilderAccordion";

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
});

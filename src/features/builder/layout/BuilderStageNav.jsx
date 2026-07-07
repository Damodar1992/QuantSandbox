import React, { memo } from "react";
import { cx, ui } from "@/constants/ui";
import { BuilderStagePills } from "./BuilderStagePills";

/** Horizontal stage navigation (prod pill tabs). */
export const BuilderStageNavHorizontal = memo(function BuilderStageNavHorizontal({
  stages,
  activeStage,
  onStageChange,
  selectedVersionByStage,
  onStageVersionChange,
  onAddNewStageVersion,
  onOpenVersionComment,
  onOpenVersionTree,
}) {
  return (
    <div
      className={cx(
        "sticky z-10 top-[var(--header-height)]",
        ui.builderSectionDivider,
        "border-b bg-[#0f0d1e]/95 py-3 backdrop-blur supports-[backdrop-filter]:bg-[#0f0d1e]/80",
      )}
    >
      <BuilderStagePills
        stages={stages}
        activeStageId={activeStage}
        onStageChange={onStageChange}
        selectedVersionByStage={selectedVersionByStage}
        onStageVersionChange={onStageVersionChange}
        onAddNewStageVersion={onAddNewStageVersion}
        onOpenVersionComment={onOpenVersionComment}
        onOpenVersionTree={onOpenVersionTree}
      />
    </div>
  );
});

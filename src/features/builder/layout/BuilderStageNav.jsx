import React, { memo } from "react";
import { cx, ui } from "@/constants/ui";
import { isProdUi } from "@/constants/uiVariant";
import { BuilderStagePills } from "./BuilderStagePills";

/** Horizontal stage navigation — pill tabs in prod, legacy grid otherwise. */
export const BuilderStageNavHorizontal = memo(function BuilderStageNavHorizontal({
  stages,
  activeStage,
  onStageChange,
  selectedVersionByStage,
  onStageVersionChange,
  onAddNewStageVersion,
  onOpenVersionComment,
  onOpenVersionTree,
  versionBreadcrumb,
}) {
  if (isProdUi()) {
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
          versionBreadcrumb={versionBreadcrumb}
        />
      </div>
    );
  }

  return (
    <div
      className={cx(
        "sticky z-10 px-3 py-3 top-[var(--header-height)]",
        ui.panelMuted,
        "border-0 border-b",
        ui.divider,
        "bg-[#1a1a1a]/95 backdrop-blur supports-[backdrop-filter]:bg-[#1a1a1a]/80",
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
        versionBreadcrumb={versionBreadcrumb}
      />
    </div>
  );
});

import React, { memo } from "react";
import { cx, ui } from "@/constants/ui";
import { ProdButton } from "@/components/prod/ProdButton";
import { StageVersionSelect, StageVersionCommentButton } from "@/features/versioning";

export const BuilderActiveStageVersionBar = memo(function BuilderActiveStageVersionBar({
  activeStageMeta,
  selectedVersionByStage,
  onStageVersionChange,
  onAddNewStageVersion,
  onOpenVersionComment,
  onOpenVersionTree,
  versionBreadcrumb,
}) {
  const meta = activeStageMeta;
  if (!meta) return null;

  return (
    <div className="mb-4 space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <StageVersionSelect
          value={selectedVersionByStage[meta.stageType]}
          options={meta.versionOptions}
          disabled={meta.versionDisabled}
          placeholder={meta.versionDisabled ? "—" : "Select"}
          onChange={(versionId) => onStageVersionChange(meta.stageType, versionId)}
          onAddNewVersion={() => onAddNewStageVersion(meta.stageType)}
          className="w-[5.5rem]"
        />
        <StageVersionCommentButton
          disabled={meta.versionDisabled || !selectedVersionByStage[meta.stageType]}
          hasComment={meta.hasComment}
          onClick={() => onOpenVersionComment(meta.stageType)}
        />
        <ProdButton variant="outline" size="sm" onClick={onOpenVersionTree}>
          Version tree
        </ProdButton>
      </div>
      {versionBreadcrumb?.length > 0 && (
        <div className={cx("text-[11px]", ui.textMuted)}>{versionBreadcrumb.join(" → ")}</div>
      )}
    </div>
  );
});

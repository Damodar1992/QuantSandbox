import React from "react";
import { AppDialog } from "../../../components/common/AppDialog";
import { StageVersionFlowTree } from "./StageVersionFlowTree";

export function StageVersionTreeModal({
  open,
  onClose,
  versions = [],
  strategyName = "",
  selectedByStage = {},
  commentsByVersionId = {},
  onSelectNode,
}) {
  return (
    <AppDialog
      open={!!open}
      onOpenChange={(next) => {
        if (!next) onClose?.();
      }}
      title="Version tree"
      description="Click a node to select that version. Hover for tags and comments."
      className="max-w-[min(96vw,1200px)] max-h-[90vh] overflow-hidden flex flex-col"
    >
      <div className="flex-1 min-h-0 overflow-auto max-h-[min(75vh,720px)]">
        <StageVersionFlowTree
          versions={versions}
          strategyName={strategyName}
          selectedByStage={selectedByStage}
          commentsByVersionId={commentsByVersionId}
          onSelectNode={onSelectNode}
        />
      </div>
    </AppDialog>
  );
}

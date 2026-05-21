import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { cx, ui } from "../../../constants/ui";
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
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape" && typeof onClose === "function") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70"
      role="presentation"
      onClick={() => typeof onClose === "function" && onClose()}
    >
      <div
        className={cx(
          ui.radius,
          "w-full max-w-[min(96vw,1200px)] max-h-[90vh] flex flex-col border border-[#303030] bg-[#141414] shadow-xl",
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="stage-version-tree-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={cx(
            "flex items-center justify-between px-4 py-3 border-b shrink-0",
            ui.divider,
            ui.panelMuted,
          )}
        >
          <div>
            <h2 id="stage-version-tree-title" className="text-[13px] font-medium text-[#d9d9d9]">
              Version tree
            </h2>
            <p className={cx("text-[11px] mt-0.5", ui.textMuted)}>
              Click a node to select that version. Hover for tags and comments.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-[#303030] px-2 py-1 text-[11px] text-[#a6a6a6] hover:text-[#d9d9d9] hover:bg-[#1f1f1f]"
          >
            Close
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-auto p-4">
          <StageVersionFlowTree
            versions={versions}
            strategyName={strategyName}
            selectedByStage={selectedByStage}
            commentsByVersionId={commentsByVersionId}
            onSelectNode={onSelectNode}
          />
        </div>
      </div>
    </div>,
    document.body,
  );
}

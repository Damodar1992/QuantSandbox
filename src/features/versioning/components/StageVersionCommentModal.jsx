import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { cx, ui } from "../../../constants/ui";
import { STAGE_TYPE_LABELS } from "../../../constants/versioning";

/**
 * @typedef {{ id: string, label: string, lineageCode: string, stageType: string }} CommentTarget
 */

export function StageVersionCommentModal({
  open,
  target = null,
  initialComment = "",
  onClose,
  onSave,
}) {
  const [draft, setDraft] = useState("");

  useEffect(() => {
    if (open && target) {
      setDraft(initialComment ?? "");
    }
  }, [open, target, initialComment]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape" && typeof onClose === "function") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !target) return null;

  const stageLabel = STAGE_TYPE_LABELS[target.stageType] ?? target.stageType;

  return createPortal(
    <div
      className="fixed inset-0 z-[100001] flex items-center justify-center p-4 bg-black/70"
      role="presentation"
      onClick={() => typeof onClose === "function" && onClose()}
    >
      <div
        className={cx(ui.radius, "w-full max-w-md border border-[#303030] bg-[#141414] shadow-xl")}
        role="dialog"
        aria-modal="true"
        aria-labelledby="version-comment-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={cx("px-4 py-3 border-b", ui.divider, ui.panelMuted)}>
          <h2 id="version-comment-title" className="text-[13px] font-medium text-[#d9d9d9]">
            {initialComment?.trim() ? "Edit comment" : "Add comment"}
          </h2>
          <p className={cx("text-[11px] mt-1", ui.textMuted)}>
            {stageLabel} · {target.label} ({target.lineageCode})
          </p>
        </div>

        <div className="p-4 space-y-3">
          <label className="block text-[11px] font-medium text-[#d9d9d9]">
            Comment
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={4}
              placeholder="Note about this version…"
              className={cx(ui.input, "mt-1 w-full text-[12px] resize-y min-h-[88px]")}
              autoFocus
            />
          </label>
        </div>

        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-[#303030]">
          <button type="button" onClick={onClose} className={cx(ui.btnGhost, "h-8 px-3 text-[11px]")}>
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              if (typeof onSave === "function") onSave(target.id, draft);
            }}
            className={cx(ui.btnPrimary, "h-8 px-3 text-[11px]")}
          >
            Save
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

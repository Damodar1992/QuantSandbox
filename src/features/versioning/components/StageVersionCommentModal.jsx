import React, { useEffect, useState } from "react";
import { cx, ui } from "../../../constants/ui";
import { STAGE_TYPE_LABELS } from "../../../constants/versioning";
import { AppButton } from "../../../components/common/AppButton";
import { AppDialog } from "../../../components/common/AppDialog";
import { Textarea } from "../../../components/ui/textarea";

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

  const stageLabel = target ? STAGE_TYPE_LABELS[target.stageType] ?? target.stageType : "";

  return (
    <AppDialog
      open={!!open && !!target}
      onOpenChange={(next) => {
        if (!next) onClose?.();
      }}
      title={initialComment?.trim() ? "Edit comment" : "Add comment"}
      description={target ? `${stageLabel} · ${target.label} (${target.lineageCode})` : undefined}
      className="max-w-md"
    >
      <div className="space-y-3">
        <label className="block text-[11px] font-medium text-[#d9d9d9]">
          Comment
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={4}
            placeholder="Note about this version…"
            className={cx(ui.input, "mt-1 w-full text-[12px] resize-y min-h-[88px]")}
            autoFocus
          />
        </label>
        <div className="flex items-center justify-end gap-2 pt-1">
          <AppButton type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </AppButton>
          <AppButton
            type="button"
            variant="default"
            size="sm"
            onClick={() => {
              if (typeof onSave === "function" && target) onSave(target.id, draft);
            }}
          >
            Save
          </AppButton>
        </div>
      </div>
    </AppDialog>
  );
}

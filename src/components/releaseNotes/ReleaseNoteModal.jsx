import React, { memo, useEffect, useState } from "react";
import { cx, ui } from "../../constants/ui";
import { AppDialog } from "../common/AppDialog";
import { AppButton } from "../common/AppButton";

const emptyDraft = () => ({ title: "", releasedAt: "", body: "" });

export const ReleaseNoteModal = memo(function ReleaseNoteModal({
  open,
  onOpenChange,
  editingNote,
  onSave,
}) {
  const [draft, setDraft] = useState(emptyDraft);

  useEffect(() => {
    if (!open) return;
    if (editingNote) {
      setDraft({
        title: editingNote.title ?? "",
        releasedAt: editingNote.releasedAt ?? "",
        body: editingNote.body ?? "",
      });
    } else {
      setDraft(emptyDraft());
    }
  }, [open, editingNote]);

  const isValid = draft.title.trim() && draft.releasedAt && draft.body.trim();

  const handleSave = () => {
    if (!isValid) return;
    onSave?.({
      title: draft.title.trim(),
      releasedAt: draft.releasedAt,
      body: draft.body,
    });
    onOpenChange?.(false);
  };

  return (
    <AppDialog
      open={open}
      onOpenChange={onOpenChange}
      title={editingNote ? "Edit release note" : "Add release note"}
      description="Title, release date, and markdown description."
      className="max-w-lg"
    >
      <div className="space-y-4">
        <div>
          <label className={cx("block mb-1 text-xs", ui.textMuted)}>Title</label>
          <input
            value={draft.title}
            onChange={(e) => setDraft((prev) => ({ ...prev, title: e.target.value }))}
            className={cx(ui.input, "!w-full")}
            placeholder="e.g. Global Tags release"
          />
        </div>
        <div>
          <label className={cx("block mb-1 text-xs", ui.textMuted)}>Release date</label>
          <input
            type="date"
            value={draft.releasedAt}
            onChange={(e) => setDraft((prev) => ({ ...prev, releasedAt: e.target.value }))}
            className={cx(ui.input, "!w-full")}
          />
        </div>
        <div>
          <label className={cx("block mb-1 text-xs", ui.textMuted)}>Description (markdown)</label>
          <textarea
            value={draft.body}
            onChange={(e) => setDraft((prev) => ({ ...prev, body: e.target.value }))}
            rows={12}
            className={cx(
              ui.input,
              "!w-full min-h-[200px] resize-y font-mono text-[11px] leading-relaxed",
            )}
            placeholder={"## What's new\n\n- Feature one\n- Feature two"}
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <AppButton type="button" variant="outline" onClick={() => onOpenChange?.(false)}>
            Cancel
          </AppButton>
          <AppButton type="button" variant="default" onClick={handleSave} disabled={!isValid}>
            {editingNote ? "Save changes" : "Add note"}
          </AppButton>
        </div>
      </div>
    </AppDialog>
  );
});

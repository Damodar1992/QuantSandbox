import React, { memo, useEffect, useState } from "react";
import { cx, ui } from "../../constants/ui";
import { isValidReleaseVersion } from "../../constants/releaseNotes";
import { AppDialog } from "../common/AppDialog";
import { AppButton } from "../common/AppButton";
import { AppInput } from "../common/AppInput";
import { Textarea } from "../ui/textarea";

const CONTROL = "h-9 text-[12px]";
const emptyDraft = () => ({ title: "", version: "", releasedAt: "", body: "" });

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
        version: editingNote.version ?? "",
        releasedAt: editingNote.releasedAt ?? "",
        body: editingNote.body ?? "",
      });
    } else {
      setDraft(emptyDraft());
    }
  }, [open, editingNote]);

  const versionOk = isValidReleaseVersion(draft.version);
  const isValid =
    draft.title.trim() && draft.releasedAt && draft.body.trim() && versionOk;

  const handleSave = () => {
    if (!isValid) return;
    onSave?.({
      title: draft.title.trim(),
      version: draft.version.trim(),
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
      description="Title, version, release date, and markdown description."
      className="max-w-lg"
    >
      <div className="space-y-4">
        <div>
          <label className={cx("block mb-1 text-xs", ui.textMuted)}>Title</label>
          <AppInput
            value={draft.title}
            onChange={(e) => setDraft((prev) => ({ ...prev, title: e.target.value }))}
            className={cx(CONTROL, "w-full")}
            wrapperClassName="space-y-0"
            placeholder="e.g. Global Tags release"
          />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className={cx("block mb-1 text-xs", ui.textMuted)}>Release date</label>
            <AppInput
              type="date"
              value={draft.releasedAt}
              onChange={(e) => setDraft((prev) => ({ ...prev, releasedAt: e.target.value }))}
              className={cx(CONTROL, "w-full")}
              wrapperClassName="space-y-0"
            />
          </div>
          <div>
            <label className={cx("block mb-1 text-xs", ui.textMuted)}>Version</label>
            <AppInput
              value={draft.version}
              onChange={(e) => setDraft((prev) => ({ ...prev, version: e.target.value }))}
              className={cx(CONTROL, "w-full font-mono")}
              wrapperClassName="space-y-0"
              placeholder="0.1.0"
              inputMode="decimal"
              aria-invalid={draft.version ? !versionOk : undefined}
            />
            {draft.version && !versionOk ? (
              <div className="mt-1 text-[10px] text-amber-300">Use format 0.1.0</div>
            ) : (
              <div className={cx("mt-1 text-[10px]", ui.textSubtle)}>e.g. 0.1.0, 0.1.1, 0.2.0</div>
            )}
          </div>
        </div>
        <div>
          <label className={cx("block mb-1 text-xs", ui.textMuted)}>Description (markdown)</label>
          <Textarea
            value={draft.body}
            onChange={(e) => setDraft((prev) => ({ ...prev, body: e.target.value }))}
            rows={12}
            className="w-full min-h-[200px] resize-y font-mono text-[11px] leading-relaxed"
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

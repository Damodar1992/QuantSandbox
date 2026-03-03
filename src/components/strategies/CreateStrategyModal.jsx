import React, { memo } from "react";
import { cx, ui } from "../../constants/ui";
import { ModalShell } from "../common";

export const CreateStrategyModal = memo(function CreateStrategyModal({
  name,
  template,
  description,
  onNameChange,
  onTemplateChange,
  onDescriptionChange,
  onClose,
  onCreate,
}) {
  return (
    <ModalShell title="Create strategy" onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className={cx("block mb-1 text-xs", ui.textMuted)}>Strategy name</label>
          <input value={name} onChange={(e) => onNameChange(e.target.value)} className={ui.input} placeholder="e.g. EMA Bounce" />
        </div>

        <div>
          <label className={cx("block mb-1 text-xs", ui.textMuted)}>Description</label>
          <textarea
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            className="w-full rounded-md border border-[#303030] bg-[#0f0f0f] px-3 py-2 text-sm text-[#d9d9d9] placeholder:text-[#595959] focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            rows={3}
            placeholder="Optional description"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className={ui.btn}>
            Cancel
          </button>
          <button onClick={onCreate} className={ui.btnPrimary} disabled={!name.trim()} title={!name.trim() ? "Enter a strategy name" : "Create"}>
            Create
          </button>
        </div>
      </div>
    </ModalShell>
  );
});

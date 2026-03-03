import React, { memo } from "react";
import { cx, ui } from "../../constants/ui";
import { ModalShell } from "../common";

export const EditDescriptionModal = memo(({ value, onChange, onClose, onSave }) => (
  <ModalShell title="Edit description" onClose={onClose}>
    <div>
      <label className={cx("block mb-1 text-xs", ui.textMuted)}>Description</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-[#303030] bg-[#0f0f0f] px-3 py-2 text-sm text-[#d9d9d9] placeholder:text-[#595959] focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
        rows={6}
        placeholder="Describe the strategy version..."
      />
    </div>
    <div className="flex justify-end gap-2 pt-2">
      <button onClick={onClose} className={ui.btn}>
        Cancel
      </button>
      <button onClick={onSave} className={ui.btnPrimary}>
        Save
      </button>
    </div>
  </ModalShell>
));

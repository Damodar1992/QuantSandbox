import React, { memo } from "react";
import { cx, ui } from "../../constants/ui";
import { ModalShell } from "../common";

export const EditUserModal = memo(function EditUserModal({ draft, onDraftChange, onClose, onSave }) {
  if (!draft) return null;
  return (
    <ModalShell title="Edit user" onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className={cx("block mb-1 text-xs", ui.textMuted)}>Username</label>
          <input
            value={draft.username}
            onChange={(e) => onDraftChange({ ...draft, username: e.target.value })}
            className={ui.input}
          />
        </div>
        <div>
          <label className={cx("block mb-1 text-xs", ui.textMuted)}>Role</label>
          <select
            value={draft.role}
            onChange={(e) => onDraftChange({ ...draft, role: e.target.value })}
            className={cx(ui.input, "h-9")}
          >
            <option value="Admin">Admin</option>
            <option value="Quant">Quant</option>
          </select>
        </div>
        <div>
          <label className={cx("block mb-1 text-xs", ui.textMuted)}>Status</label>
          <select
            value={draft.status}
            onChange={(e) => onDraftChange({ ...draft, status: e.target.value })}
            className={cx(ui.input, "h-9")}
          >
            <option value="Active">Active</option>
            <option value="Deactivated">Deactivated</option>
          </select>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className={ui.btn}>
            Cancel
          </button>
          <button onClick={onSave} className={ui.btnPrimary}>
            Save (mock)
          </button>
        </div>
      </div>
    </ModalShell>
  );
});

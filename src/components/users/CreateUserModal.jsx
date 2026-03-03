import React, { memo } from "react";
import { cx, ui } from "../../constants/ui";
import { ModalShell } from "../common";

export const CreateUserModal = memo(function CreateUserModal({ draft, onDraftChange, onClose, onCreate }) {
  return (
    <ModalShell title="Create user" onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className={cx("block mb-1 text-xs", ui.textMuted)}>Login (email)</label>
          <input
            value={draft.login}
            onChange={(e) => onDraftChange({ ...draft, login: e.target.value })}
            className={ui.input}
            placeholder="user@example.com"
          />
        </div>
        <div>
          <label className={cx("block mb-1 text-xs", ui.textMuted)}>Username</label>
          <input
            value={draft.username}
            onChange={(e) => onDraftChange({ ...draft, username: e.target.value })}
            className={ui.input}
            placeholder="Display name"
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
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className={ui.btn}>
            Cancel
          </button>
          <button
            onClick={onCreate}
            className={ui.btnPrimary}
            disabled={!draft.login.trim() || !draft.username.trim()}
          >
            Create user (mock)
          </button>
        </div>
      </div>
    </ModalShell>
  );
});

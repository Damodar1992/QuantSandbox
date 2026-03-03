import React, { memo, useState } from "react";
import { cx, ui } from "../../constants/ui";
import { ModalShell } from "../common";

export const ChangePasswordModal = memo(function ChangePasswordModal({ user, onClose }) {
  const [password, setPassword] = useState("");
  if (!user) return null;
  return (
    <ModalShell title={`Change password — ${user.username}`} onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className={cx("block mb-1 text-xs", ui.textMuted)}>New password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={ui.input}
            placeholder="Enter new password"
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className={ui.btn}>
            Cancel
          </button>
          <button
            onClick={() => {
              alert(`Password changed for ${user.login} (mock)`);
              onClose();
            }}
            className={ui.btnPrimary}
            disabled={!password.trim()}
          >
            Change password
          </button>
        </div>
      </div>
    </ModalShell>
  );
});

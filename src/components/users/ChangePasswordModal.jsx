import React, { memo, useState } from "react";
import { ModalShell, AppInput, AppButton } from "../common";

export const ChangePasswordModal = memo(function ChangePasswordModal({ user, onClose }) {
  const [password, setPassword] = useState("");
  if (!user) return null;
  return (
    <ModalShell title={`Change password — ${user.username}`} onClose={onClose}>
      <div className="space-y-4">
        <AppInput
          label="New password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter new password"
        />
        <div className="flex justify-end gap-2 pt-2">
          <AppButton onClick={onClose} variant="outline">
            Cancel
          </AppButton>
          <AppButton
            onClick={() => {
              alert(`Password changed for ${user.login} (mock)`);
              onClose();
            }}
            variant="default"
            disabled={!password.trim()}
          >
            Change password
          </AppButton>
        </div>
      </div>
    </ModalShell>
  );
});

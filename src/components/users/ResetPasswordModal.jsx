import React, { memo } from "react";
import { ui } from "../../constants/ui";
import { ModalShell, AppButton } from "../common";

export const ResetPasswordModal = memo(function ResetPasswordModal({ user, onClose }) {
  if (!user) return null;
  return (
    <ModalShell title="Reset password" onClose={onClose}>
      <div className="space-y-4 text-[13px]">
        <p className={ui.textMuted}>
          Are you sure you want to reset the password for the user{" "}
          <span className="text-[#f5f5f5] font-medium">&quot;{user.username}&quot;</span> and send the new password to{" "}
          <span className="text-[#f5f5f5] font-medium">{user.login}</span>?
        </p>
        <div className="flex justify-end gap-2 pt-2">
          <AppButton onClick={onClose} variant="outline">
            Cancel
          </AppButton>
          <AppButton
            onClick={() => {
              alert(`Password reset email sent to ${user.login} (mock)`);
              onClose();
            }}
            variant="default"
          >
            Reset password
          </AppButton>
        </div>
      </div>
    </ModalShell>
  );
});

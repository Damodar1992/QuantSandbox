import React, { memo } from "react";
import { cx, ui } from "../../constants/ui";
import { ModalShell } from "../common";

export const ForgotPasswordModal = memo(({ email, onEmailChange, onClose, onSend }) => (
  <ModalShell title="Reset password" onClose={onClose}>
    <div className="space-y-4">
      <div className={cx("text-[12px]", ui.textSubtle)}>Enter your email and we'll send a password reset link. (Mock)</div>
      <div>
        <label className={cx("block mb-1 text-xs", ui.textMuted)}>Email</label>
        <input value={email} onChange={(e) => onEmailChange(e.target.value)} className={ui.input} placeholder="you@example.com" />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <button onClick={onClose} className={ui.btn}>
          Cancel
        </button>
        <button onClick={onSend} className={ui.btnPrimary} disabled={!email.trim()} title={!email.trim() ? "Enter an email" : "Send"}>
          Send reset link
        </button>
      </div>
    </div>
  </ModalShell>
));

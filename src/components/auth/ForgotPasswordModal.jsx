import React, { memo } from "react";
import { cx, ui } from "../../constants/ui";
import { AppButton } from "../common/AppButton";
import { AppDialog } from "../common/AppDialog";
import { AppInput } from "../common/AppInput";

export const ForgotPasswordModal = memo(({ email, onEmailChange, onClose, onSend }) => (
  <AppDialog open onOpenChange={(open) => !open && onClose?.()} title="Reset password">
    <div className="space-y-4">
      <div className={cx("text-[12px]", ui.textSubtle)}>
        Enter your email and we&apos;ll send a password reset link. (Mock)
      </div>
      <AppInput
        label="Email"
        value={email}
        onChange={(e) => onEmailChange(e.target.value)}
        placeholder="you@example.com"
      />
      <div className="flex justify-end gap-2 pt-2">
        <AppButton onClick={onClose} variant="outline">
          Cancel
        </AppButton>
        <AppButton onClick={onSend} variant="default" disabled={!email.trim()} title={!email.trim() ? "Enter an email" : "Send"}>
          Send reset link
        </AppButton>
      </div>
    </div>
  </AppDialog>
));

import React, { memo } from "react";
import { ModalShell, AppInput, AppSelect, AppButton } from "../common";

export const CreateUserModal = memo(function CreateUserModal({ draft, onDraftChange, onClose, onCreate }) {
  return (
    <ModalShell title="Create user" onClose={onClose}>
      <div className="space-y-4">
        <AppInput
          label="Login (email)"
          value={draft.login}
          onChange={(e) => onDraftChange({ ...draft, login: e.target.value })}
          placeholder="user@example.com"
        />
        <AppInput
          label="Username"
          value={draft.username}
          onChange={(e) => onDraftChange({ ...draft, username: e.target.value })}
          placeholder="Display name"
        />
        <AppSelect
          label="Role"
          value={draft.role}
          onValueChange={(role) => onDraftChange({ ...draft, role })}
          options={[
            { value: "Admin", label: "Admin" },
            { value: "Quant", label: "Quant" },
          ]}
          triggerClassName="h-9"
        />
        <div className="flex justify-end gap-2 pt-2">
          <AppButton onClick={onClose} variant="outline">
            Cancel
          </AppButton>
          <AppButton
            onClick={onCreate}
            variant="default"
            disabled={!draft.login.trim() || !draft.username.trim()}
          >
            Create user (mock)
          </AppButton>
        </div>
      </div>
    </ModalShell>
  );
});

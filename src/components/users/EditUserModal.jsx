import React, { memo } from "react";
import { ModalShell, AppInput, AppSelect, AppButton } from "../common";

export const EditUserModal = memo(function EditUserModal({ draft, onDraftChange, onClose, onSave }) {
  if (!draft) return null;
  return (
    <ModalShell title="Edit user" onClose={onClose}>
      <div className="space-y-4">
        <AppInput
          label="Username"
          value={draft.username}
          onChange={(e) => onDraftChange({ ...draft, username: e.target.value })}
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
        <AppSelect
          label="Status"
          value={draft.status}
          onValueChange={(status) => onDraftChange({ ...draft, status })}
          options={[
            { value: "Active", label: "Active" },
            { value: "Deactivated", label: "Deactivated" },
          ]}
          triggerClassName="h-9"
        />
        <div className="flex justify-end gap-2 pt-2">
          <AppButton onClick={onClose} variant="outline">
            Cancel
          </AppButton>
          <AppButton onClick={onSave} variant="default">
            Save (mock)
          </AppButton>
        </div>
      </div>
    </ModalShell>
  );
});

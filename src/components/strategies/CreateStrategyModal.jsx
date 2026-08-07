import React, { memo } from "react";
import { cx, ui } from "../../constants/ui";
import { ModalShell } from "../common";
import { AppInput } from "../common/AppInput";
import { Textarea } from "../ui/textarea";

const CONTROL = "h-9 text-[12px]";

export const CreateStrategyModal = memo(function CreateStrategyModal({
  name,
  template: _template,
  description,
  onNameChange,
  onTemplateChange: _onTemplateChange,
  onDescriptionChange,
  onClose,
  onCreate,
}) {
  return (
    <ModalShell title="Create strategy" onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className={cx("block mb-1 text-xs", ui.textMuted)}>Strategy name</label>
          <AppInput
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            className={CONTROL}
            wrapperClassName="space-y-0"
            placeholder="e.g. EMA Bounce"
          />
        </div>

        <div>
          <label className={cx("block mb-1 text-xs", ui.textMuted)}>Description</label>
          <Textarea
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            className="w-full text-[12px] min-h-[72px] resize-y"
            rows={3}
            placeholder="Optional description"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className={ui.btn}>
            Cancel
          </button>
          <button onClick={onCreate} className={ui.btnPrimary} disabled={!name.trim()} title={!name.trim() ? "Enter a strategy name" : "Create"}>
            Create
          </button>
        </div>
      </div>
    </ModalShell>
  );
});

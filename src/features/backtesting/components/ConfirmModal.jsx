import React, { memo } from "react";
import { cx, ui } from "@/constants/ui";
import { AppButton } from "@/components/common/AppButton";
import { AppDialog } from "@/components/common/AppDialog";

/**
 * Confirmation used by every delete in Stage 5. `consequences` must list what
 * disappears — the spec requires each confirm to spell out its cascade.
 */
export const ConfirmModal = memo(function ConfirmModal({
  open,
  title,
  description,
  consequences = [],
  warning,
  confirmLabel = "Delete",
  onClose,
  onConfirm,
}) {
  return (
    <AppDialog
      open={!!open}
      onOpenChange={(next) => {
        if (!next) onClose?.();
      }}
      title={title}
      description={description}
      className="max-w-[520px]"
    >
      <div className="space-y-3">
        {consequences.length > 0 ? (
          <ul className={cx("list-disc space-y-1 pl-4 text-[11px]", ui.textMuted)}>
            {consequences.map((line, idx) => (
              <li key={idx}>{line}</li>
            ))}
          </ul>
        ) : null}

        {warning ? (
          <div className="rounded-lg border border-amber-500/40 bg-amber-500/5 px-3 py-2.5 text-[11px] leading-snug text-amber-100/90">
            {warning}
          </div>
        ) : null}

        <div className="flex justify-end gap-2 pt-1">
          <AppButton type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </AppButton>
          <AppButton
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              onConfirm?.();
              onClose?.();
            }}
            className="border-red-500/60 text-red-300 hover:bg-red-500/10"
          >
            {confirmLabel}
          </AppButton>
        </div>
      </div>
    </AppDialog>
  );
});

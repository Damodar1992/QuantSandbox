import React, { memo } from "react";
import { createPortal } from "react-dom";
import { cx, ui } from "../../constants/ui";

export const ModalShell = memo(({ title, onClose, children }) => {
  // Portal to `document.body` to avoid BuilderStepper2 sticky z-index/stacking-context issues.
  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black px-4">
      <div className={cx("w-full max-w-lg", ui.radius, ui.panel, ui.shadow, "p-6 space-y-4")}>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[#f5f5f5]">{title}</h2>
          <button className={cx(ui.btn, "px-2 py-1")} onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body
  );
});

import React, { memo } from "react";
import { cx, ui } from "../../constants/ui";

export const ModalShell = memo(({ title, onClose, children }) => (
  <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/70 px-4">
    <div className={cx("w-full max-w-lg", ui.radius, ui.panel, ui.shadow, "p-6 space-y-4")}>
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[#f5f5f5]">{title}</h2>
        <button className={cx(ui.btn, "px-2 py-1")} onClick={onClose} aria-label="Close">
          ✕
        </button>
      </div>
      {children}
    </div>
  </div>
));

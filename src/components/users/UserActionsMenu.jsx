import React, { memo, useState } from "react";
import { cx } from "../../constants/ui";
import { useOutsideClose } from "../../hooks/useOutsideClose";
import { MoreIcon } from "../common";

export const UserActionsMenu = memo(({ user, onEdit, onChangePassword, onResetPassword, align = "right" }) => {
  const [open, setOpen] = useState(false);
  const rootRef = useOutsideClose(open, () => setOpen(false));

  return (
    <div ref={rootRef} className="relative inline-flex">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#303030] bg-[#0f0f0f] text-[#a6a6a6] hover:bg-[#1f1f1f] hover:text-[#d9d9d9] focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
        aria-haspopup="menu"
        aria-expanded={open}
        title="Actions"
      >
        <MoreIcon className="h-4 w-4" />
      </button>

      {open && (
        <div
          role="menu"
          className={cx(
            "absolute mt-2 w-48 overflow-hidden rounded-md border border-[#303030] bg-[#141414] shadow-[0_10px_30px_rgba(0,0,0,0.55)] z-10",
            align === "right" ? "right-0" : "left-0"
          )}
        >
          <button
            role="menuitem"
            type="button"
            onClick={() => { onEdit(user); setOpen(false); }}
            className="w-full px-3 py-2 text-left text-[12px] text-[#d9d9d9] hover:bg-[#1f1f1f]"
          >
            Edit user
          </button>
          <button
            role="menuitem"
            type="button"
            onClick={() => { onChangePassword(user); setOpen(false); }}
            className="w-full px-3 py-2 text-left text-[12px] text-[#d9d9d9] hover:bg-[#1f1f1f]"
          >
            Change password
          </button>
          <button
            role="menuitem"
            type="button"
            onClick={() => { onResetPassword(user); setOpen(false); }}
            className="w-full px-3 py-2 text-left text-[12px] text-[#d9d9d9] hover:bg-[#1f1f1f]"
          >
            Reset password
          </button>
        </div>
      )}
    </div>
  );
});

import React, { memo, useCallback, useState } from "react";
import { cx, ui } from "../../constants/ui";
import { useOutsideClose } from "../../hooks/useOutsideClose";
import { PAIR_OPTIONS } from "../../constants/app";

export const PairsDropdown = memo(({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const rootRef = useOutsideClose(open, () => setOpen(false));

  const toggle = useCallback(
    (opt) => {
      const next = value.includes(opt) ? value.filter((x) => x !== opt) : [...value, opt];
      onChange(next);
    },
    [value, onChange]
  );

  const label = value.length ? value.join(", ") : "Select pairs";

  return (
    <div ref={rootRef} className="relative">
      <label className={cx("block mb-1 text-xs", ui.textMuted)}>Pairs</label>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cx(ui.input, "h-9 text-[12px] flex items-center justify-between gap-2 hover:bg-[#141414]")}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={cx("truncate", value.length ? "text-[#d9d9d9]" : "text-[#595959]")}>{label}</span>
        <svg
          viewBox="0 0 24 24"
          className={cx("h-4 w-4 text-[#a6a6a6] transition-transform", open && "rotate-180")}
          aria-hidden="true"
        >
          <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute z-10 mt-2 w-full overflow-hidden rounded-md border border-[#303030] bg-[#141414] shadow-[0_10px_30px_rgba(0,0,0,0.55)]"
        >
          {PAIR_OPTIONS.map((opt) => {
            const checked = value.includes(opt);
            return (
              <button
                key={opt}
                type="button"
                role="option"
                aria-selected={checked}
                onClick={() => toggle(opt)}
                className={cx(
                  "w-full px-3 py-2 text-left text-[12px] flex items-center gap-2",
                  checked ? "bg-emerald-500/10 text-emerald-100" : "text-[#d9d9d9] hover:bg-[#1f1f1f]"
                )}
              >
                <span
                  className={cx(
                    "inline-flex h-4 w-4 items-center justify-center rounded border",
                    checked ? "border-emerald-500/40 bg-emerald-500/10" : "border-[#303030] bg-[#0f0f0f]"
                  )}
                >
                  {checked && (
                    <svg viewBox="0 0 24 24" className="h-3 w-3" aria-hidden="true">
                      <path d="M20 6L9 17l-5-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </span>
                <span>{opt}</span>
              </button>
            );
          })}
          <div className="h-px bg-[#303030]" />
          <div className={cx("px-3 py-2 text-[10px]", ui.textMuted)}>Multi-select dropdown (mock)</div>
        </div>
      )}
    </div>
  );
});

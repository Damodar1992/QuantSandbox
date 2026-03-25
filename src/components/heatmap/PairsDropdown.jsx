import React, { memo } from "react";
import { cx, ui } from "../../constants/ui";
import { PAIR_OPTIONS } from "../../constants/app";

export const PairsDropdown = memo(({ value, onChange }) => {
  const currentValue = value || "";

  return (
    <div className="relative">
      <label className={cx("block mb-1 text-xs", ui.textMuted)}>Pairs</label>
      <select
        value={currentValue}
        onChange={(e) => onChange(e.target.value)}
        className={cx(ui.input, "h-9 text-[12px] w-full")}
      >
        {PAIR_OPTIONS.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
});

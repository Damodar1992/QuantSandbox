import React from "react";
import { cx, ui } from "../../../constants/ui";
import { crmAccent } from "../../../constants/crmAccent";
import { formatVersionOptionTitle } from "../utils/versionSelection";

/** Sentinel value for the “Add new version” row (not a real version id). */
export const ADD_NEW_VERSION_VALUE = "__add_new_version__";

/**
 * Compact version dropdown for a builder stage tab.
 */
export function StageVersionSelect({
  value,
  options = [],
  disabled = false,
  placeholder = "—",
  onChange,
  onAddNewVersion,
  className,
}) {
  const selected = options.find((o) => o.id === value);
  const canAddNew = !disabled && typeof onAddNewVersion === "function";
  const isSelectDisabled = disabled || (options.length === 0 && !canAddNew);

  return (
    <select
      value={value ?? ""}
      disabled={isSelectDisabled}
      title={selected ? formatVersionOptionTitle(selected) : placeholder}
      onClick={(e) => e.stopPropagation()}
      onChange={(e) => {
        e.stopPropagation();
        const next = e.target.value || null;
        if (next === ADD_NEW_VERSION_VALUE) {
          onAddNewVersion?.();
          return;
        }
        if (typeof onChange === "function") onChange(next);
      }}
      className={cx(
        ui.select,
        "h-7 min-w-0 max-w-full px-1.5 text-[10px]",
        crmAccent.ring,
        isSelectDisabled && "opacity-50 cursor-not-allowed",
        className,
      )}
    >
      {canAddNew && (
        <option value={ADD_NEW_VERSION_VALUE} className={crmAccent.textMuted}>
          Add new version
        </option>
      )}
      {options.length === 0 ? (
        !canAddNew && <option value="">{placeholder}</option>
      ) : (
        options.map((opt) => (
          <option key={opt.id} value={opt.id} title={formatVersionOptionTitle(opt)}>
            {opt.lineageCode}
          </option>
        ))
      )}
    </select>
  );
}

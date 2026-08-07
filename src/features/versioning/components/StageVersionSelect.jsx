import React, { useMemo } from "react";
import { cx } from "../../../constants/ui";
import { crmAccent } from "../../../constants/crmAccent";
import { AppSelect } from "../../../components/common/AppSelect";
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
  triggerClassName,
}) {
  const selected = options.find((o) => o.id === value);
  const canAddNew = !disabled && typeof onAddNewVersion === "function";
  const isSelectDisabled = disabled || (options.length === 0 && !canAddNew);

  const selectOptions = useMemo(() => {
    const items = [];
    if (canAddNew) {
      items.push({ value: ADD_NEW_VERSION_VALUE, label: "Add new version" });
    }
    if (options.length === 0) {
      if (!canAddNew) items.push({ value: "", label: placeholder });
    } else {
      for (const opt of options) {
        items.push({ value: opt.id, label: opt.lineageCode });
      }
    }
    return items;
  }, [canAddNew, options, placeholder]);

  return (
    <AppSelect
      value={value ?? ""}
      disabled={isSelectDisabled}
      placeholder={placeholder}
      options={selectOptions}
      size="xs"
      onValueChange={(next) => {
        if (next === ADD_NEW_VERSION_VALUE) {
          onAddNewVersion?.();
          return;
        }
        if (typeof onChange === "function") onChange(next || null);
      }}
      className={className}
      triggerClassName={cx(
        "w-[4.25rem] shrink-0 justify-center tabular-nums",
        crmAccent.ring,
        isSelectDisabled && "cursor-not-allowed opacity-50",
        triggerClassName,
      )}
      aria-label={selected ? formatVersionOptionTitle(selected) : placeholder}
    />
  );
}

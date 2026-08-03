import React, { memo, useCallback } from "react";
import { CheckboxMultiSelect } from "./CheckboxMultiSelect";
import { cn } from "@/lib/utils";
import { ui } from "../../constants/ui";

/**
 * Tag filter multi-select with "Tags: …" summary convention.
 * @param {{ value: string, label: string }[]} options
 * @param {string[]} value
 */
export const TagMultiSelect = memo(function TagMultiSelect({
  options = [],
  value = [],
  onChange,
  className,
  triggerClassName,
  contentClassName,
  align = "end",
  clearLabel = "All",
  emptySummary = "Tags: All",
  summaryPrefix = "Tags",
}) {
  const formatSummary = useCallback(
    (vals, opts) => {
      if (!vals?.length) return emptySummary;
      const names = opts
        .filter((o) => vals.includes(o.value))
        .map((o) => o.label);
      return `${summaryPrefix}: ${names.join(", ")}`;
    },
    [emptySummary, summaryPrefix],
  );

  return (
    <CheckboxMultiSelect
      options={options}
      value={value}
      onChange={onChange}
      formatSummary={formatSummary}
      clearLabel={clearLabel}
      showClear
      align={align}
      className={className}
      triggerClassName={cn(
        ui.input,
        "h-8 min-w-[160px] w-auto px-2.5 text-[12px]",
        triggerClassName,
      )}
      contentClassName={contentClassName}
    />
  );
});

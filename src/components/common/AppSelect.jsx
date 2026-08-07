import React, { memo, useMemo } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/** Radix Select.Item forbids empty string; map "" ↔ sentinel at the bridge. */
const EMPTY_SENTINEL = "__qs_empty__";

function toItemValue(value) {
  if (value === "") return EMPTY_SENTINEL;
  return String(value);
}

function fromItemValue(value) {
  if (value === EMPTY_SENTINEL) return "";
  return value;
}

export const AppSelect = memo(function AppSelect({
  label,
  value,
  onValueChange,
  placeholder = "Select…",
  options = [],
  className,
  triggerClassName,
  size = "sm",
  disabled = false,
  "aria-label": ariaLabel,
}) {
  const items = useMemo(
    () =>
      options.map((opt) => ({
        value: toItemValue(opt.value),
        label: opt.label,
      })),
    [options],
  );

  const selectValue =
    value === undefined || value === null ? undefined : toItemValue(value);

  const select = (
    <Select
      value={selectValue}
      onValueChange={(v) => onValueChange?.(fromItemValue(v))}
      disabled={disabled}
    >
      <SelectTrigger
        size={size}
        className={cn("w-full", triggerClassName)}
        aria-label={ariaLabel}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {items.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  /* No wrapper when unlabeled — keeps trigger in parent flex for alignment. */
  if (!label) {
    return className ? <div className={cn("contents", className)}>{select}</div> : select;
  }

  return (
    <div className={cn("space-y-1", className)}>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {select}
    </div>
  );
});

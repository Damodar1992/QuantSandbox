import React, { memo, useMemo } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

function defaultSummary(value, options, placeholder) {
  if (!value?.length) return placeholder;
  if (value.length === 1) {
    const opt = options.find((o) => o.value === value[0]);
    return opt?.label ?? value[0];
  }
  return `${value.length} selected`;
}

/**
 * Multi-select dropdown built on Popover + Checkbox.
 * @param {{ value: string, label: string }[]} options
 * @param {string[]} value
 * @param {(next: string[]) => void} onChange
 */
export const CheckboxMultiSelect = memo(function CheckboxMultiSelect({
  label,
  placeholder = "All",
  options = [],
  value = [],
  onChange,
  className,
  triggerClassName,
  contentClassName,
  align = "start",
  showClear = true,
  clearLabel = "Clear",
  emptyText = "No options",
  formatSummary,
  optionClassName,
}) {
  const summary = useMemo(() => {
    if (typeof formatSummary === "function") return formatSummary(value, options);
    return defaultSummary(value, options, placeholder);
  }, [value, options, placeholder, formatSummary]);

  const active = value.length > 0;

  const toggle = (optValue) => {
    const next = value.includes(optValue)
      ? value.filter((v) => v !== optValue)
      : [...value, optValue];
    onChange?.(next);
  };

  return (
    <div className={cn(label ? "flex flex-col gap-1" : undefined, className)}>
      {label ? <span className="text-[10px] text-muted-foreground">{label}</span> : null}
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              "inline-flex items-center justify-between gap-2 rounded-md border px-2.5 text-left transition-colors",
              triggerClassName,
            )}
            data-active={active ? "true" : undefined}
            aria-haspopup="listbox"
          >
            <span className="truncate">{summary}</span>
            <span className="shrink-0 text-[10px] opacity-60" aria-hidden>
              ▼
            </span>
          </button>
        </PopoverTrigger>
        <PopoverContent
          align={align}
          className={cn("w-[220px] gap-0.5 p-1.5", contentClassName)}
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          {showClear ? (
            <button
              type="button"
              onClick={() => onChange?.([])}
              className="w-full h-7 rounded px-2 text-left text-[11px] text-[#d9d9d9] hover:bg-[#1a1a1a]"
            >
              {clearLabel}
            </button>
          ) : null}

          {options.length === 0 ? (
            <div className="px-2 py-1.5 text-[11px] text-muted-foreground">{emptyText}</div>
          ) : (
            <div className="flex max-h-52 flex-col gap-0.5 overflow-y-auto">
              {options.map((opt) => {
                const checked = value.includes(opt.value);
                return (
                  <label
                    key={opt.value}
                    className={cn(
                      "flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-[11px] text-[#d9d9d9] hover:bg-[#1a1a1a]",
                      checked && "bg-violet-500/10 text-violet-200",
                      optionClassName,
                    )}
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() => toggle(opt.value)}
                      className="size-3.5 border-[#505050]"
                    />
                    <span className="truncate">{opt.label}</span>
                  </label>
                );
              })}
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
});

import React, { memo, useMemo, useState } from "react";
import {
  format,
  isValid,
  parseISO,
  subMonths,
  subWeeks,
  subYears,
} from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Default “All dataset” bounds used when caller doesn’t pass dataset range. */
export const DEFAULT_DATASET_RANGE = {
  from: "2019-01-01",
  to: "2024-12-31",
};

function parseYmd(value) {
  if (!value || typeof value !== "string") return undefined;
  const d = parseISO(value);
  return isValid(d) ? d : undefined;
}

function toYmd(date) {
  if (!date || !isValid(date)) return "";
  return format(date, "yyyy-MM-dd");
}

function formatTriggerLabel(from, to) {
  if (from && to) return `${from} – ${to}`;
  if (from) return `${from} – …`;
  return "Select range…";
}

function buildPresets(datasetFrom, datasetTo, anchor) {
  const end = anchor && isValid(anchor) ? anchor : new Date();
  return [
    {
      id: "all-dataset",
      label: "All dataset",
      getRange: () => ({
        from: parseYmd(datasetFrom) ?? parseYmd(DEFAULT_DATASET_RANGE.from),
        to: parseYmd(datasetTo) ?? parseYmd(DEFAULT_DATASET_RANGE.to),
      }),
    },
    {
      id: "last-year",
      label: "Last year",
      getRange: () => ({ from: subYears(end, 1), to: end }),
    },
    {
      id: "last-quarter",
      label: "Last quarter",
      getRange: () => ({ from: subMonths(end, 3), to: end }),
    },
    {
      id: "last-month",
      label: "Last month",
      getRange: () => ({ from: subMonths(end, 1), to: end }),
    },
    {
      id: "last-week",
      label: "Last week",
      getRange: () => ({ from: subWeeks(end, 1), to: end }),
    },
  ];
}

/**
 * Date range picker: trigger + popover with presets sidebar and month calendar.
 * Values are ISO `yyyy-MM-dd` strings (same contract as native `<input type="date">`).
 */
export const DateRangePicker = memo(function DateRangePicker({
  label = "Time Range",
  from = "",
  to = "",
  onChange,
  disabled = false,
  datasetFrom = DEFAULT_DATASET_RANGE.from,
  datasetTo = DEFAULT_DATASET_RANGE.to,
  className,
  triggerClassName,
  placeholder,
}) {
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(() => parseYmd(to) || parseYmd(from) || new Date());

  const selected = useMemo(
    () => ({
      from: parseYmd(from),
      to: parseYmd(to),
    }),
    [from, to],
  );

  const presets = useMemo(
    () => buildPresets(datasetFrom, datasetTo, parseYmd(datasetTo) || new Date()),
    [datasetFrom, datasetTo],
  );

  const activePresetId = useMemo(() => {
    if (!from || !to) return null;
    for (const preset of presets) {
      const range = preset.getRange();
      if (toYmd(range.from) === from && toYmd(range.to) === to) return preset.id;
    }
    return null;
  }, [from, to, presets]);

  const emit = (nextFrom, nextTo) => {
    onChange?.({ from: nextFrom || "", to: nextTo || "" });
  };

  const applyPreset = (preset) => {
    const range = preset.getRange();
    const nextFrom = toYmd(range.from);
    const nextTo = toYmd(range.to);
    emit(nextFrom, nextTo);
    if (range.to) setMonth(range.to);
    else if (range.from) setMonth(range.from);
  };

  const handleSelect = (range) => {
    const nextFrom = toYmd(range?.from);
    const nextTo = toYmd(range?.to);
    emit(nextFrom, nextTo);
    if (range?.to) setMonth(range.to);
    else if (range?.from) setMonth(range.from);
  };

  const handleReset = () => {
    emit("", "");
  };

  const summary = placeholder || formatTriggerLabel(from, to);
  const hasValue = Boolean(from || to);

  return (
    <div className={cn("space-y-1.5", className)}>
      {label ? (
        <label className="block text-xs text-muted-foreground">{label}</label>
      ) : null}
      <Popover open={disabled ? false : open} onOpenChange={disabled ? undefined : setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            disabled={disabled}
            className={cn(
              "flex h-9 w-full items-center justify-between gap-2 rounded-md border border-[rgba(60,40,80,0.5)] bg-[#170f29] px-2.5 text-left text-[12px] text-[#faf7fd] transition-colors",
              "hover:bg-[#1e1333] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40",
              "disabled:cursor-not-allowed disabled:opacity-80",
              !hasValue && "text-[#8c8c8c]",
              triggerClassName,
            )}
            aria-label={label || "Date range"}
          >
            <span className="truncate tabular-nums">{summary}</span>
            <CalendarIcon className="size-3.5 shrink-0 text-[#b8aecc]" aria-hidden />
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          sideOffset={6}
          className="w-auto max-w-[calc(100vw-2rem)] gap-0 overflow-hidden rounded-lg border border-[rgba(60,40,80,0.45)] bg-[#120a20] p-0 text-[#faf7fd] shadow-[0_16px_40px_rgba(6,3,20,0.55)]"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <div className="flex min-w-0 flex-col sm:flex-row">
            <aside className="flex w-full flex-col border-b border-[rgba(60,40,80,0.35)] sm:w-[132px] sm:border-b-0 sm:border-r">
              <div className="flex flex-1 flex-col gap-0.5 p-2">
                {presets.map((preset) => {
                  const active = activePresetId === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => applyPreset(preset)}
                      className={cn(
                        "rounded-md px-2.5 py-1.5 text-left text-[12px] transition-colors",
                        active
                          ? "bg-[rgba(168,96,240,0.22)] text-[#ddd6fe]"
                          : "text-[#b8aecc] hover:bg-[#1e1333] hover:text-[#faf7fd]",
                      )}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
              <div className="p-2 pt-0">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                  className="h-8 w-full border-[rgba(60,40,80,0.5)] bg-transparent text-[12px] text-[#b8aecc] hover:bg-[#1e1333] hover:text-[#faf7fd]"
                >
                  Reset
                </Button>
              </div>
            </aside>

            <div className="p-2 sm:p-3">
              <Calendar
                mode="range"
                numberOfMonths={1}
                weekStartsOn={1}
                captionLayout="dropdown"
                month={month}
                onMonthChange={setMonth}
                selected={selected}
                onSelect={handleSelect}
                defaultMonth={selected.to || selected.from || month}
                startMonth={new Date(2015, 0)}
                endMonth={new Date(2035, 11)}
                className="bg-transparent p-0 [--cell-size:2.125rem]"
                classNames={{
                  range_start: "rounded-l-full bg-[rgba(168,96,240,0.22)]",
                  range_middle: "rounded-none bg-[rgba(168,96,240,0.22)]",
                  range_end: "rounded-r-full bg-[rgba(168,96,240,0.22)]",
                  today: "bg-[#1e1333] text-[#ddd6fe]",
                }}
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
});

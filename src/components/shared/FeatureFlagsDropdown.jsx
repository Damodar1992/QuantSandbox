import React, { memo } from "react";
import { cx, ui } from "../../constants/ui";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { setFeatureFlag } from "../../constants/featureFlags";

const FEATURES = [
  { key: "miniBacktest", label: "Mini Backtest" },
  { key: "formulas", label: "Formulas" },
];

export const FeatureFlagsDropdown = memo(function FeatureFlagsDropdown({
  flags = {},
  onFlagChange,
}) {
  const handleToggle = (key, next) => {
    setFeatureFlag(key, next);
    onFlagChange?.(key, next);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cx(
            ui.input,
            "h-10 px-2.5 text-[12px] flex items-center gap-1.5 min-w-[80px] w-auto",
          )}
          title="Feature flags"
          aria-label="Feature flags"
        >
          <span className="text-[13px]">⚙</span>
          <span>Features</span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-56 gap-0 p-1">
        {FEATURES.map((feature) => {
          const checked = Boolean(flags[feature.key]);
          return (
            <div
              key={feature.key}
              className="flex items-center justify-between gap-2 rounded-sm px-2 py-1.5 text-[12px] hover:bg-accent"
            >
              <span className="text-foreground">{feature.label}</span>
              <Switch
                size="sm"
                checked={checked}
                onCheckedChange={(next) => handleToggle(feature.key, next)}
                aria-label={feature.label}
              />
            </div>
          );
        })}
      </PopoverContent>
    </Popover>
  );
});

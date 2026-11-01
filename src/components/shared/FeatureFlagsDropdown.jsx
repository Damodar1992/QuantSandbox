import React, { memo } from "react";
import { Settings } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { setFeatureFlag } from "../../constants/featureFlags";

const FEATURES = [
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
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-[rgba(60,40,80,0.5)] bg-[#170f29] text-[#b8aecc] hover:bg-[#1e1333]"
          title="Feature flags"
          aria-label="Feature flags"
        >
          <Settings className="size-4" aria-hidden="true" />
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

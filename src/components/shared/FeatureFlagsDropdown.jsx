import React, { memo, useState } from "react";
import { cx, ui } from "../../constants/ui";
import { useOutsideClose } from "../../hooks/useOutsideClose";
import { getFeatureFlags, setFeatureFlag } from "../../constants/featureFlags";

const FEATURES = [
  { key: "miniBacktest", label: "Mini Backtest" },
];

export const FeatureFlagsDropdown = memo(function FeatureFlagsDropdown({
  miniBacktestEnabled,
  onMiniBacktestEnabledChange,
}) {
  const [open, setOpen] = useState(false);
  const ref = useOutsideClose(open, () => setOpen(false));

  const handleToggle = (key, currentValue) => {
    const newValue = !currentValue;
    setFeatureFlag(key, newValue);
    if (key === "miniBacktest") {
      onMiniBacktestEnabledChange?.(newValue);
    }
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cx(
          ui.input,
          "h-10 px-2.5 text-[12px] flex items-center gap-1.5 min-w-[80px]",
          open && "ring-1 ring-border"
        )}
        title="Feature flags"
        aria-label="Feature flags"
        aria-expanded={open}
      >
        <span className="text-[13px]">⚙</span>
        <span>Features</span>
      </button>

      {open && (
        <div
          className={cx(
            "absolute right-0 top-full mt-1 z-50 w-56 rounded-md border bg-popover p-1 shadow-md",
            ui.border,
          )}
          role="menu"
        >
          {FEATURES.map((feature) => {
            const checked = feature.key === "miniBacktest" ? miniBacktestEnabled : false;
            return (
              <div
                key={feature.key}
                role="menuitemcheckbox"
                aria-checked={checked}
                className="flex items-center justify-between gap-2 rounded-sm px-2 py-1.5 text-[12px] hover:bg-accent cursor-pointer"
                onClick={() => handleToggle(feature.key, checked)}
              >
                <span className="text-foreground">{feature.label}</span>
                <span
                  className={cx(
                    "relative inline-flex h-4 w-7 items-center rounded-full transition-colors",
                    checked ? "bg-emerald-500" : "bg-[#303030]"
                  )}
                >
                  <span
                    className={cx(
                      "inline-block h-3 w-3 rounded-full bg-white transition-transform",
                      checked ? "translate-x-3.5" : "translate-x-0.5"
                    )}
                  />
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});

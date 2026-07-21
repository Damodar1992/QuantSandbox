import React, { memo } from "react";
import { cx, ui } from "../../../constants/ui";
import { RISK_HYPEROPT_PARAM_DEFS } from "../../../constants/risk";

export const RiskHyperoptParamsPanel = memo(function RiskHyperoptParamsPanel({ params, onChange }) {
  const enabled = !!params?.loss_streak_cooldown_enabled;

  const handleChange = (key, raw) => {
    const num = parseInt(raw, 10);
    onChange((prev) => ({
      ...prev,
      [key]: Number.isFinite(num) ? num : 0,
    }));
  };

  const handleToggleEnabled = (checked) => {
    onChange((prev) => ({
      ...prev,
      loss_streak_cooldown_enabled: checked,
    }));
  };

  return (
    <div className="space-y-3">
      <label className="inline-flex items-center gap-2 text-[12px] font-medium text-[#d9d9d9] cursor-pointer">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => handleToggleEnabled(e.target.checked)}
          className="h-3.5 w-3.5 accent-emerald-500"
        />
        Loss streak &amp; cooldown
      </label>

      {enabled ? (
        <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
          {RISK_HYPEROPT_PARAM_DEFS.map((def) => {
            const min = params?.[def.minKey] ?? def.minFloor;
            const max = params?.[def.maxKey] ?? 0;
            const step = params?.[def.stepKey] ?? 1;
            const invalid = min < def.minFloor || max < min || step <= 0;
            return (
              <div key={def.paramKey} className="space-y-1">
                <div className="text-[11px] font-medium text-[#f0f0f0]">{def.label}</div>
                <div className="flex items-end gap-2">
                  <div className="space-y-1">
                    <label className={cx("block text-[10px]", ui.textMuted)}>Min</label>
                    <input
                      type="number"
                      min={def.minFloor}
                      step={1}
                      value={min}
                      onChange={(e) => handleChange(def.minKey, e.target.value)}
                      className={cx(ui.input, "h-8 text-[11px] w-24 font-mono", invalid && "border-amber-500/50")}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className={cx("block text-[10px]", ui.textMuted)}>Max</label>
                    <input
                      type="number"
                      min={def.minFloor}
                      step={1}
                      value={max}
                      onChange={(e) => handleChange(def.maxKey, e.target.value)}
                      className={cx(ui.input, "h-8 text-[11px] w-24 font-mono", invalid && "border-amber-500/50")}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className={cx("block text-[10px]", ui.textMuted)}>Step</label>
                    <input
                      type="number"
                      min={1}
                      step={1}
                      value={step}
                      onChange={(e) => handleChange(def.stepKey, e.target.value)}
                      className={cx(ui.input, "h-8 text-[11px] w-24 font-mono", invalid && "border-amber-500/50")}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
});

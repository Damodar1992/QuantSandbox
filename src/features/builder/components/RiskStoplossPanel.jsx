import React, { memo } from "react";
import { cx, ui } from "../../../constants/ui";
import { RISK_STOPLOSS_KEYS, RISK_STOPLOSS_LABELS } from "../../../constants/risk";
import { AppInput } from "../../../components/common/AppInput";

const CONTROL = "h-8 text-[12px] w-full font-mono";

export const RiskStoplossPanel = memo(function RiskStoplossPanel({ ranges, onChange }) {
  const handleChange = (key, field, raw) => {
    const num = parseFloat(raw);
    onChange((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: Number.isFinite(num) ? num : 0,
      },
    }));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
      {RISK_STOPLOSS_KEYS.map((key) => {
        const row = ranges[key] || { min: 0, max: 0, step: 0.001 };
        const invalid = row.min > row.max || row.step <= 0;
        return (
          <div key={key} className={cx(ui.radius, ui.panelMuted, "p-3 min-w-0")}>
            <div className="text-[12px] font-medium text-[#d9d9d9] mb-3">{RISK_STOPLOSS_LABELS[key]}</div>
            <div className="flex items-end gap-2">
              <div className="space-y-1 flex-1 min-w-0">
                <label className={cx("block text-[10px]", ui.textMuted)}>Min</label>
                <AppInput
                  type="number"
                  step="any"
                  value={row.min}
                  onChange={(e) => handleChange(key, "min", e.target.value)}
                  className={cx(CONTROL, invalid && "border-amber-500/50")}
                  wrapperClassName="space-y-0"
                />
              </div>
              <div className="space-y-1 flex-1 min-w-0">
                <label className={cx("block text-[10px]", ui.textMuted)}>Max</label>
                <AppInput
                  type="number"
                  step="any"
                  value={row.max}
                  onChange={(e) => handleChange(key, "max", e.target.value)}
                  className={cx(CONTROL, invalid && "border-amber-500/50")}
                  wrapperClassName="space-y-0"
                />
              </div>
              <div className="space-y-1 flex-1 min-w-0">
                <label className={cx("block text-[10px]", ui.textMuted)}>Step</label>
                <AppInput
                  type="number"
                  step="any"
                  value={row.step}
                  onChange={(e) => handleChange(key, "step", e.target.value)}
                  className={cx(CONTROL, invalid && "border-amber-500/50")}
                  wrapperClassName="space-y-0"
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
});

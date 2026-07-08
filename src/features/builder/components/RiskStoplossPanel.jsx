import React, { memo, useMemo } from "react";
import { cx, ui } from "../../../constants/ui";
import { RISK_STOPLOSS_KEYS, RISK_STOPLOSS_LABELS } from "../../../constants/risk";
import { countRiskCombinations } from "../utils/riskCombinations";

export const RiskStoplossPanel = memo(function RiskStoplossPanel({ ranges, onChange }) {
  const totalCombinations = useMemo(() => countRiskCombinations(ranges), [ranges]);

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
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
        {RISK_STOPLOSS_KEYS.map((key) => {
          const row = ranges[key] || { min: 0, max: 0, step: 0.001 };
          const invalid = row.min > row.max || row.step <= 0;
          return (
            <div key={key} className="space-y-1">
              <div className="text-[11px] font-medium text-[#f0f0f0]">{RISK_STOPLOSS_LABELS[key]}</div>
              <div className="flex items-end gap-2">
                <div className="space-y-1">
                  <label className={cx("block text-[10px]", ui.textMuted)}>Min</label>
                  <input
                    type="number"
                    step="any"
                    value={row.min}
                    onChange={(e) => handleChange(key, "min", e.target.value)}
                    className={cx(ui.input, "h-8 text-[11px] w-24 font-mono", invalid && "border-amber-500/50")}
                  />
                </div>
                <div className="space-y-1">
                  <label className={cx("block text-[10px]", ui.textMuted)}>Max</label>
                  <input
                    type="number"
                    step="any"
                    value={row.max}
                    onChange={(e) => handleChange(key, "max", e.target.value)}
                    className={cx(ui.input, "h-8 text-[11px] w-24 font-mono", invalid && "border-amber-500/50")}
                  />
                </div>
                <div className="space-y-1">
                  <label className={cx("block text-[10px]", ui.textMuted)}>Step</label>
                  <input
                    type="number"
                    step="any"
                    value={row.step}
                    onChange={(e) => handleChange(key, "step", e.target.value)}
                    className={cx(ui.input, "h-8 text-[11px] w-24 font-mono", invalid && "border-amber-500/50")}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className={cx("text-[11px]", ui.textMuted)}>
        Hyperopt grid:{" "}
        <span className="font-mono text-emerald-300">{totalCombinations.toLocaleString()}</span> combinations
      </div>
    </div>
  );
});

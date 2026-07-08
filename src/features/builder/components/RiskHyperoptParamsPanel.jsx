import React, { memo, useMemo } from "react";
import { cx, ui } from "../../../constants/ui";
import { RISK_HYPEROPT_PARAM_DEFS } from "../../../constants/risk";
import { countRiskHyperoptParamCombinations } from "../utils/riskCombinations";

export const RiskHyperoptParamsPanel = memo(function RiskHyperoptParamsPanel({ params, onChange }) {
  const totalCombinations = useMemo(() => countRiskHyperoptParamCombinations(params), [params]);

  const handleChange = (key, raw) => {
    const num = parseInt(raw, 10);
    onChange((prev) => ({
      ...prev,
      [key]: Number.isFinite(num) ? num : 0,
    }));
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
        {RISK_HYPEROPT_PARAM_DEFS.map((def) => {
          const value = params?.[def.valueKey] ?? 0;
          const step = params?.[def.stepKey] ?? 1;
          const invalid = value < def.minFloor || step <= 0;
          return (
            <div key={def.valueKey} className="space-y-1">
              <div className="text-[11px] font-medium text-[#f0f0f0]">{def.label}</div>
              <div className="flex items-end gap-2">
                <div className="space-y-1">
                  <label className={cx("block text-[10px]", ui.textMuted)}>Value</label>
                  <input
                    type="number"
                    min={def.minFloor}
                    step={1}
                    value={value}
                    onChange={(e) => handleChange(def.valueKey, e.target.value)}
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
      <div className={cx("text-[11px]", ui.textMuted)}>
        Grid (min → value, step):{" "}
        <span className="font-mono text-emerald-300">{totalCombinations.toLocaleString()}</span> combinations
      </div>
    </div>
  );
});

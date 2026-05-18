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
      <div className="overflow-x-auto border border-[#303030] rounded-lg">
        <table className="w-full text-[11px] border-collapse">
          <thead className="bg-[#1a1a1a] text-[#8c8c8c]">
            <tr>
              <th className="px-3 py-2 text-left font-medium border-b border-[#303030]">Parameter</th>
              <th className="px-3 py-2 text-left font-medium border-b border-[#303030] w-28">Min</th>
              <th className="px-3 py-2 text-left font-medium border-b border-[#303030] w-28">Max</th>
              <th className="px-3 py-2 text-left font-medium border-b border-[#303030] w-28">Step</th>
            </tr>
          </thead>
          <tbody className="text-[#d9d9d9]">
            {RISK_STOPLOSS_KEYS.map((key) => {
              const row = ranges[key] || { min: 0, max: 0, step: 0.001 };
              const invalid = row.min > row.max || row.step <= 0;
              return (
                <tr key={key} className="border-b border-[#303030]/60">
                  <td className="px-3 py-2 font-medium text-[#f0f0f0]">{RISK_STOPLOSS_LABELS[key]}</td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      step="any"
                      value={row.min}
                      onChange={(e) => handleChange(key, "min", e.target.value)}
                      className={cx(ui.input, "h-8 text-[11px] w-full font-mono", invalid && "border-amber-500/50")}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      step="any"
                      value={row.max}
                      onChange={(e) => handleChange(key, "max", e.target.value)}
                      className={cx(ui.input, "h-8 text-[11px] w-full font-mono", invalid && "border-amber-500/50")}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      step="any"
                      value={row.step}
                      onChange={(e) => handleChange(key, "step", e.target.value)}
                      className={cx(ui.input, "h-8 text-[11px] w-full font-mono", invalid && "border-amber-500/50")}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className={cx("text-[11px]", ui.textMuted)}>
        Hyperopt grid:{" "}
        <span className="font-mono text-emerald-300">{totalCombinations.toLocaleString()}</span> combinations
      </div>
    </div>
  );
});

import React, { memo } from "react";
import { cx, ui } from "../../../constants/ui";
import { RISK_STOPLOSS_KEYS, RISK_STOPLOSS_LABELS } from "../../../constants/risk";
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "@/components/ui/input-group";

function fracToPctInput(frac) {
  const n = Number(frac);
  if (!Number.isFinite(n)) return "";
  return String(Number((n * 100).toFixed(4)));
}

function pctToFrac(raw) {
  const n = parseFloat(raw);
  if (!Number.isFinite(n)) return 0;
  return n / 100;
}

export const RiskStoplossPanel = memo(function RiskStoplossPanel({ ranges, onChange }) {
  const handleChange = (key, field, raw) => {
    onChange((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: pctToFrac(raw),
      },
    }));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
      {RISK_STOPLOSS_KEYS.map((key) => {
        const row = ranges[key] || { min: 0, max: 0, step: 0.005 };
        const invalid = row.min > row.max || row.step <= 0;
        return (
          <div key={key} className={cx(ui.radius, ui.panelMuted, "p-3 min-w-0")}>
            <div className="text-[12px] font-medium text-[#d9d9d9] mb-3">{RISK_STOPLOSS_LABELS[key]}</div>
            <div className="flex items-end gap-2">
              {[
                { field: "min", label: "Min" },
                { field: "max", label: "Max" },
                { field: "step", label: "Step" },
              ].map((item) => (
                <div key={item.field} className="space-y-1 flex-1 min-w-0">
                  <label className={cx("block text-[10px]", ui.textMuted)}>{item.label}</label>
                  <InputGroup className={cx("h-8", invalid && "border-amber-500/50")}>
                    <InputGroupInput
                      type="number"
                      step="0.1"
                      value={fracToPctInput(row[item.field])}
                      onChange={(e) => handleChange(key, item.field, e.target.value)}
                      className="h-8 text-[12px] font-mono"
                    />
                    <InputGroupAddon align="inline-end">
                      <InputGroupText className="text-[10px] text-[#8c8c8c]">%</InputGroupText>
                    </InputGroupAddon>
                  </InputGroup>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
});

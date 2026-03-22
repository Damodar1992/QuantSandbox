import React, { memo, useState } from "react";
import { cx, ui } from "../../../constants/ui";
import { SOURCE_OPTIONS } from "../../../constants/indicators";
import { getDefaultDisplayName } from "../utils/indicatorHelpers";

export const EditIndicatorModal = memo(({ indicator, onClose, onSave }) => {
  const [params, setParams] = useState(indicator.params.map((p) => ({ ...p })));
  const [source, setSource] = useState(indicator.source);
  const [displayName, setDisplayName] = useState(
    indicator.displayName || getDefaultDisplayName(indicator.type)
  );
  const [customFormula, setCustomFormula] = useState(indicator.customFormula || "");

  const handleParamChange = (index, field, value) => {
    setParams((prev) =>
      prev.map((p, i) => (i === index ? { ...p, [field]: parseFloat(value) || 0 } : p))
    );
  };

  const handleSave = () => {
    const updatedIndicator = {
      ...indicator,
      params,
      source,
      displayName: displayName.trim(),
    };
    if (indicator.type === "CUSTOM_FORMULA") {
      updatedIndicator.customFormula = customFormula.trim();
    }
    onSave(updatedIndicator);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/70 px-4">
      <div className={cx("w-full max-w-2xl", ui.radius, ui.panel, ui.shadow, "p-6 space-y-4")}>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[#f5f5f5]">
            Edit Indicator: {indicator.name}
          </h2>
          <button className={cx(ui.btn, "px-2 py-1")} onClick={onClose}>
            ✕
          </button>
        </div>
        <div>
          <label className={cx("block mb-1 text-xs", ui.textMuted)}>Source</label>
          <select
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className={cx(ui.input, "h-9")}
          >
            {SOURCE_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={cx("block mb-1 text-xs", ui.textMuted)}>Display Name</label>
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className={ui.input}
            placeholder="e.g., rsi, ema, my_indicator"
          />
          <div className={cx("text-[10px]", ui.textMuted, "mt-1")}>
            This name will be used in formulas (e.g., {displayName || "indicator"}_close_14)
          </div>
        </div>
        {indicator.type === "CUSTOM_FORMULA" && (
          <div>
            <label className={cx("block mb-1 text-xs", ui.textMuted)}>Custom Formula</label>
            <textarea
              value={customFormula}
              onChange={(e) => setCustomFormula(e.target.value)}
              className={cx(ui.input, "min-h-[120px] font-mono text-[11px]")}
              placeholder={`Enter Python code for your custom indicator, e.g.:\ndataframe["ema_slope_20"] = dataframe["ema_close_20"].diff(1)\ndataframe["rsi_ma_14"] = dataframe["rsi_close_14"].rolling(14).mean()`}
            />
            <div className={cx("text-[10px]", ui.textMuted, "mt-1")}>
              Python code snippet to calculate custom indicator values
            </div>
          </div>
        )}
        {indicator.type !== "CUSTOM_FORMULA" && (
          <div className="space-y-3">
            {params.map((param, idx) => (
              <div key={idx} className={cx(ui.radius, ui.panelMuted, "p-3")}>
                <div className="text-[12px] font-medium text-[#d9d9d9] mb-2">{param.label}</div>
                <div className="grid grid-cols-4 gap-3">
                  <div>
                    <label className={cx("block mb-1 text-[10px]", ui.textMuted)}>Default</label>
                    <input
                      type="number"
                      value={param.default}
                      readOnly
                      className={cx(ui.input, "h-8 text-[12px] cursor-not-allowed bg-[#181818]")}
                    />
                  </div>
                  <div>
                    <label className={cx("block mb-1 text-[10px]", ui.textMuted)}>Min</label>
                    <input
                      type="number"
                      value={param.min}
                      onChange={(e) => handleParamChange(idx, "min", e.target.value)}
                      className={cx(ui.input, "h-8 text-[12px]")}
                    />
                  </div>
                  <div>
                    <label className={cx("block mb-1 text-[10px]", ui.textMuted)}>Max</label>
                    <input
                      type="number"
                      value={param.max}
                      onChange={(e) => handleParamChange(idx, "max", e.target.value)}
                      className={cx(ui.input, "h-8 text-[12px]")}
                    />
                  </div>
                  <div>
                    <label className={cx("block mb-1 text-[10px]", ui.textMuted)}>Step</label>
                    <input
                      type="number"
                      step="0.1"
                      value={param.step}
                      onChange={(e) => handleParamChange(idx, "step", e.target.value)}
                      className={cx(ui.input, "h-8 text-[12px]")}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className={ui.btn}>
            Cancel
          </button>
          <button onClick={handleSave} className={ui.btnPrimary}>
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
});

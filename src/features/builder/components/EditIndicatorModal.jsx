import React, { memo, useMemo, useState } from "react";
import { cx, ui } from "../../../constants/ui";
import { AppButton } from "../../../components/common/AppButton";
import { AppDialog } from "../../../components/common/AppDialog";
import { AppInput } from "../../../components/common/AppInput";
import { AppSelect } from "../../../components/common/AppSelect";
import { Textarea } from "../../../components/ui/textarea";
import { SOURCE_OPTIONS } from "../../../constants/indicators";
import { getDefaultDisplayName } from "../utils/indicatorHelpers";

const CONTROL = "h-9 text-[12px]";
const DENSE = "h-8 text-[12px]";

export const EditIndicatorModal = memo(({ indicator, onClose, onSave, rangesOnly = false }) => {
  const [params, setParams] = useState(() => (indicator.params || []).map((p) => ({ ...p })));
  const [source, setSource] = useState(indicator.source);
  const [displayName, setDisplayName] = useState(
    indicator.displayName || getDefaultDisplayName(indicator.type)
  );
  const [customFormula, setCustomFormula] = useState(indicator.customFormula || "");

  const sourceOptions = useMemo(
    () => SOURCE_OPTIONS.map((opt) => ({ value: opt, label: opt })),
    [],
  );

  const handleParamChange = (index, field, value) => {
    setParams((prev) =>
      prev.map((p, i) => (i === index ? { ...p, [field]: parseFloat(value) || 0 } : p))
    );
  };

  const handleSave = () => {
    if (rangesOnly) {
      const updatedIndicator = { ...indicator, params };
      if (indicator.type === "CUSTOM_FORMULA") {
        updatedIndicator.customFormula = customFormula.trim();
      }
      onSave(updatedIndicator);
      onClose();
      return;
    }
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

  const title = rangesOnly
    ? `Parameter ranges: ${indicator.displayName || indicator.name}`
    : `Edit Indicator: ${indicator.displayName || indicator.name}`;

  return (
    <AppDialog
      open
      onOpenChange={(next) => {
        if (!next) onClose?.();
      }}
      title={title}
      description={
        rangesOnly ? `${indicator.name} · ${indicator.type}` : undefined
      }
      className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
    >
      <div className="space-y-4 overflow-auto max-h-[min(70vh,560px)]">
        {!rangesOnly && (
          <>
            <div>
              <label className={cx("block mb-1 text-xs", ui.textMuted)}>Source</label>
              <AppSelect
                value={source}
                onValueChange={setSource}
                options={sourceOptions}
                className="space-y-0"
                triggerClassName={CONTROL}
              />
            </div>
            <div>
              <label className={cx("block mb-1 text-xs", ui.textMuted)}>Display Name</label>
              <AppInput
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className={CONTROL}
                wrapperClassName="space-y-0"
                placeholder="e.g., rsi, ema, my_indicator"
              />
              <div className={cx("text-[10px]", ui.textMuted, "mt-1")}>
                This name will be used in formulas (e.g., {displayName || "indicator"}_close_14)
              </div>
            </div>
            {indicator.type === "CUSTOM_FORMULA" && (
              <div>
                <label className={cx("block mb-1 text-xs", ui.textMuted)}>Custom Formula</label>
                <Textarea
                  value={customFormula}
                  onChange={(e) => setCustomFormula(e.target.value)}
                  className="min-h-[120px] font-mono text-[11px]"
                  placeholder={`Enter Python code for your custom indicator, e.g.:\ndataframe["ema_slope_20"] = dataframe["ema_close_20"].diff(1)\ndataframe["rsi_ma_14"] = dataframe["rsi_close_14"].rolling(14).mean()`}
                />
                <div className={cx("text-[10px]", ui.textMuted, "mt-1")}>
                  Python code snippet to calculate custom indicator values
                </div>
              </div>
            )}
          </>
        )}
        {rangesOnly && indicator.type === "CUSTOM_FORMULA" && (
          <div>
            <label className={cx("block mb-1 text-xs", ui.textMuted)}>Custom Formula</label>
            <Textarea
              value={customFormula}
              onChange={(e) => setCustomFormula(e.target.value)}
              className="min-h-[120px] font-mono text-[11px]"
              placeholder="Python code for custom indicator"
            />
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
                    <AppInput
                      type="number"
                      value={param.default}
                      readOnly
                      className={cx(DENSE, "cursor-not-allowed bg-[#181818]")}
                      wrapperClassName="space-y-0"
                    />
                  </div>
                  <div>
                    <label className={cx("block mb-1 text-[10px]", ui.textMuted)}>Min</label>
                    <AppInput
                      type="number"
                      value={param.min}
                      onChange={(e) => handleParamChange(idx, "min", e.target.value)}
                      className={DENSE}
                      wrapperClassName="space-y-0"
                    />
                  </div>
                  <div>
                    <label className={cx("block mb-1 text-[10px]", ui.textMuted)}>Max</label>
                    <AppInput
                      type="number"
                      value={param.max}
                      onChange={(e) => handleParamChange(idx, "max", e.target.value)}
                      className={DENSE}
                      wrapperClassName="space-y-0"
                    />
                  </div>
                  <div>
                    <label className={cx("block mb-1 text-[10px]", ui.textMuted)}>Step</label>
                    <AppInput
                      type="number"
                      step="0.1"
                      value={param.step}
                      onChange={(e) => handleParamChange(idx, "step", e.target.value)}
                      className={DENSE}
                      wrapperClassName="space-y-0"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <AppButton type="button" variant="outline" size="sm" onClick={onClose}>
          Cancel
        </AppButton>
        <AppButton type="button" variant="default" size="sm" onClick={handleSave}>
          {rangesOnly ? "Save ranges" : "Save Changes"}
        </AppButton>
      </div>
    </AppDialog>
  );
});

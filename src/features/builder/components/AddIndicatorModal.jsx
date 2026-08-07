import React, { memo, useEffect, useMemo, useState } from "react";
import { cx, ui } from "../../../constants/ui";
import { AppButton } from "../../../components/common/AppButton";
import { AppDialog } from "../../../components/common/AppDialog";
import { AppInput } from "../../../components/common/AppInput";
import { AppSelect } from "../../../components/common/AppSelect";
import { Textarea } from "../../../components/ui/textarea";
import { BASE_INDICATORS, SOURCE_OPTIONS } from "../../../constants/indicators";
import { getDefaultDisplayName } from "../utils/indicatorHelpers";

const CONTROL = "h-9 text-[12px]";
const DENSE = "h-8 text-[12px]";

export const AddIndicatorModal = memo(({ onClose, onAdd, initialType = "RSI" }) => {
  const [selectedType, setSelectedType] = useState(initialType);
  const [displayName, setDisplayName] = useState(() => getDefaultDisplayName(initialType));
  const [source, setSource] = useState(
    () => BASE_INDICATORS[initialType]?.defaultSource || "Close"
  );
  const [params, setParams] = useState(
    () => BASE_INDICATORS[initialType]?.params?.map((p) => ({ ...p })) || []
  );
  const [customFormula, setCustomFormula] = useState("");

  useEffect(() => {
    const baseIndicator = BASE_INDICATORS[selectedType];
    if (baseIndicator) {
      setParams(baseIndicator.params.map((p) => ({ ...p })));
      setSource(baseIndicator.defaultSource);
      setDisplayName(getDefaultDisplayName(selectedType));
      setCustomFormula("");
    }
  }, [selectedType]);

  const [advancedOpen, setAdvancedOpen] = useState(false);

  const typeOptions = useMemo(
    () =>
      Object.entries(BASE_INDICATORS).map(([key, info]) => ({
        value: key,
        label: info.name,
      })),
    [],
  );

  const sourceOptions = useMemo(
    () => SOURCE_OPTIONS.map((opt) => ({ value: opt, label: opt })),
    [],
  );

  const handleAdd = () => {
    if (!displayName.trim()) {
      alert("Enter indicator display name");
      return;
    }
    if (selectedType === "CUSTOM_FORMULA" && !customFormula.trim()) {
      alert("Enter custom formula for Custom Formula indicator");
      return;
    }
    const baseIndicator = BASE_INDICATORS[selectedType];
    const indicator = {
      id: Date.now(),
      type: selectedType,
      name: baseIndicator.name,
      displayName: displayName.trim(),
      source,
      params,
      metrics: [...(baseIndicator.metrics || [])],
      ...(selectedType === "CUSTOM_FORMULA" && { customFormula: customFormula.trim() }),
    };
    onAdd(indicator);
    onClose();
  };

  return (
    <AppDialog
      open
      onOpenChange={(next) => {
        if (!next) onClose?.();
      }}
      title="Add Indicator"
      className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
    >
      <div className="space-y-4 overflow-auto max-h-[min(70vh,640px)]">
        <div>
          <label className={cx("block mb-1 text-xs font-medium text-[#d9d9d9]")}>Display Name</label>
          <AppInput
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className={CONTROL}
            wrapperClassName="space-y-0"
            placeholder="e.g., rsi, ema, my_indicator"
          />
          <div className={cx("text-[10px]", ui.textMuted, "mt-1")}>
            Used in formulas (e.g., {displayName || "indicator"}_close_14). Type, source, and parameter ranges use defaults unless you expand options below.
          </div>
        </div>
        {selectedType === "CUSTOM_FORMULA" && (
          <div>
            <label className={cx("block mb-1 text-xs", ui.textMuted)}>Custom Formula</label>
            <Textarea
              value={customFormula}
              onChange={(e) => setCustomFormula(e.target.value)}
              className="font-mono text-[11px] min-h-[120px]"
              rows={6}
              placeholder={'dataframe["ema_slope_20"] = dataframe["ema_close_20"].diff(1)\ndataframe["macd_slope"] = dataframe["macd_close"].diff(1)'}
            />
            <div className={cx("text-[10px]", ui.textMuted, "mt-1")}>
              Enter Python code to calculate custom indicators. You can use multiple lines.
            </div>
          </div>
        )}
        <details
          className={cx(ui.radius, "border border-[#303030] bg-[#141414] overflow-hidden")}
          open={advancedOpen}
          onToggle={(e) => setAdvancedOpen(e.target.open)}
        >
          <summary className="cursor-pointer select-none px-3 py-2 text-[11px] text-[#a6a6a6] hover:bg-[#1a1a1a]">
            Type, source &amp; parameter ranges (defaults from catalog)
          </summary>
          <div className="p-3 pt-0 space-y-3 border-t border-[#303030]">
            <div>
              <label className={cx("block mb-1 text-xs", ui.textMuted)}>Indicator Type</label>
              <AppSelect
                value={selectedType}
                onValueChange={setSelectedType}
                options={typeOptions}
                className="space-y-0"
                triggerClassName={CONTROL}
              />
            </div>
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
            {selectedType !== "CUSTOM_FORMULA" && (
              <div>
                <div className={cx("text-xs font-medium text-[#d9d9d9] mb-2")}>Parameter Ranges (defaults)</div>
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
                            readOnly
                            className={cx(DENSE, "cursor-not-allowed bg-[#181818]")}
                            wrapperClassName="space-y-0"
                          />
                        </div>
                        <div>
                          <label className={cx("block mb-1 text-[10px]", ui.textMuted)}>Max</label>
                          <AppInput
                            type="number"
                            value={param.max}
                            readOnly
                            className={cx(DENSE, "cursor-not-allowed bg-[#181818]")}
                            wrapperClassName="space-y-0"
                          />
                        </div>
                        <div>
                          <label className={cx("block mb-1 text-[10px]", ui.textMuted)}>Step</label>
                          <AppInput
                            type="number"
                            step="0.1"
                            value={param.step}
                            readOnly
                            className={cx(DENSE, "cursor-not-allowed bg-[#181818]")}
                            wrapperClassName="space-y-0"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </details>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <AppButton type="button" variant="outline" size="sm" onClick={onClose}>
          Cancel
        </AppButton>
        <AppButton type="button" variant="default" size="sm" onClick={handleAdd}>
          Add Indicator
        </AppButton>
      </div>
    </AppDialog>
  );
});

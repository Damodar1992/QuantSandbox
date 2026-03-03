import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
import { cx, ui } from "../../constants/ui";
import { useOutsideClose } from "../../hooks/useOutsideClose";
import { BASE_INDICATORS } from "../../constants/indicators";
import { getReportParamLabel } from "../../utils/indicators";

export const GenerateReportModal = memo(({ indicators, onClose, onGenerate }) => {
  const [selectedIndicatorIds, setSelectedIndicatorIds] = useState([]);
  const [parameterRoles, setParameterRoles] = useState({});
  const [fixedValues, setFixedValues] = useState({});
  const [openIndicatorDropdown, setOpenIndicatorDropdown] = useState(false);
  const indicatorDropdownRef = useOutsideClose(openIndicatorDropdown, () => setOpenIndicatorDropdown(false));

  const selectedIndicators = useMemo(() =>
    indicators.filter(ind => selectedIndicatorIds.includes(ind.id)),
    [indicators, selectedIndicatorIds]
  );

  const availableParams = useMemo(() => {
    if (selectedIndicators.length === 0) return [];
    const out = [];
    selectedIndicators.forEach(ind => {
      const baseDef = BASE_INDICATORS[ind.type];
      const baseParams = baseDef?.params ?? [];
      const userParams = Array.isArray(ind.params) ? ind.params : [];
      const paramByKey = {};
      userParams.forEach(p => { paramByKey[p.key] = p; });
      baseParams.forEach(baseParam => {
        const param = { ...baseParam, ...paramByKey[baseParam.key] };
        const compositeKey = `${ind.id}_${param.key}`;
        out.push({
          ...param,
          compositeKey,
          label: getReportParamLabel(ind, param),
          indicatorId: ind.id
        });
      });
    });
    return out;
  }, [selectedIndicators]);

  const fixedParams = useMemo(() => {
    return availableParams.filter(p => parameterRoles[p.compositeKey]?.fixed);
  }, [availableParams, parameterRoles]);

  const getParamValues = useCallback((param) => {
    const values = [];
    for (let val = param.min; val <= param.max; val += param.step) {
      values.push(val);
    }
    return values;
  }, []);

  const paramsKey = useMemo(() => availableParams.map(p => p.compositeKey).sort().join(","), [availableParams]);
  useEffect(() => {
    if (selectedIndicators.length > 0 && availableParams.length > 0) {
      const newRoles = {};
      const newFixedValues = {};
      availableParams.forEach((param, index) => {
        newRoles[param.compositeKey] = { x: index === 0, y: index === 1, fixed: index >= 2 };
        newFixedValues[param.compositeKey] = param.default;
      });
      setParameterRoles(newRoles);
      setFixedValues(newFixedValues);
    }
  }, [paramsKey]);

  const toggleIndicator = useCallback((id) => {
    setSelectedIndicatorIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  }, []);

  const handleRoleToggle = useCallback((compositeKey, role) => {
    setParameterRoles(prev => ({
      ...prev,
      [compositeKey]: { ...prev[compositeKey], [role]: !prev[compositeKey]?.[role] }
    }));
  }, []);

  const handleGenerate = () => {
    if (selectedIndicators.length === 0) {
      alert("Please select at least one indicator");
      return;
    }
    const xParams = availableParams.filter(p => parameterRoles[p.compositeKey]?.x).map(p => p.compositeKey);
    const yParams = availableParams.filter(p => parameterRoles[p.compositeKey]?.y).map(p => p.compositeKey);
    if (xParams.length === 0 || yParams.length === 0) {
      alert("Please assign at least one parameter to X and Y axes");
      return;
    }
    onGenerate({
      indicators: selectedIndicators,
      xAxis: xParams,
      yAxis: yParams,
      fixedParams: fixedParams.reduce((acc, p) => {
        acc[p.compositeKey] = fixedValues[p.compositeKey];
        return acc;
      }, {})
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className={cx(ui.radius, ui.panel, "w-full max-w-2xl max-h-[90vh] overflow-auto")}>
        <div className={cx("px-4 py-3 flex items-center justify-between", ui.panelMuted, "border-0 border-b", ui.divider)}>
          <div>
            <div className="text-[14px] font-medium text-[#d9d9d9]">Generate Report</div>
            <div className={cx("text-[11px]", ui.textMuted)}>Configure parameters for report generation</div>
          </div>
          <button onClick={onClose} className={cx(ui.btn, "h-7 px-2 text-[11px]")}>
            ✕ Close
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div ref={indicatorDropdownRef} className="relative">
            <label className={cx("block mb-1 text-xs", ui.textMuted)}>Select Indicator</label>
            <button
              type="button"
              onClick={() => setOpenIndicatorDropdown(v => !v)}
              className={cx(ui.input, "h-9 text-[12px] w-full text-left flex items-center justify-between gap-2")}
            >
              <span className={cx("truncate", !selectedIndicatorIds.length && "text-[#595959]")}>
                {selectedIndicatorIds.length
                  ? indicators.filter(ind => selectedIndicatorIds.includes(ind.id)).map(ind => ind.name).join(", ")
                  : "Select indicators..."}
              </span>
              <span className="text-[10px] shrink-0">{openIndicatorDropdown ? "▲" : "▼"}</span>
            </button>
            {openIndicatorDropdown && (
              <div className="absolute z-50 mt-1 w-full rounded-md border border-[#303030] bg-[#1a1a1a] shadow-lg max-h-64 overflow-y-auto">
                {indicators.map(ind => (
                  <label key={ind.id} className="flex items-center gap-2 py-2 px-3 cursor-pointer hover:bg-[#252525] border-0 border-b border-[#303030] last:border-0">
                    <input
                      type="checkbox"
                      checked={selectedIndicatorIds.includes(ind.id)}
                      onChange={() => toggleIndicator(ind.id)}
                      className="w-3.5 h-3.5"
                    />
                    <span className="text-[11px] text-[#d9d9d9]">{ind.name}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {selectedIndicators.length > 0 && availableParams.length > 0 && (
            <>
              <div>
                <label className={cx("block mb-2 text-xs font-medium text-[#d9d9d9]")}>
                  Assign Parameter Roles
                </label>
                <div className={cx(ui.radius, ui.panelMuted, "p-3 space-y-2")}>
                  {availableParams.map(param => (
                    <div key={param.compositeKey} className="flex items-center gap-3">
                      <div className="flex-1 text-[11px] text-[#d9d9d9]">
                        {param.label}
                      </div>
                      <div className="flex gap-2">
                        <label className="flex items-center gap-1 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={parameterRoles[param.compositeKey]?.x || false}
                            onChange={() => handleRoleToggle(param.compositeKey, 'x')}
                            className="w-3 h-3"
                          />
                          <span className="text-[10px] text-[#8c8c8c]">X Axis</span>
                        </label>
                        <label className="flex items-center gap-1 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={parameterRoles[param.compositeKey]?.y || false}
                            onChange={() => handleRoleToggle(param.compositeKey, 'y')}
                            className="w-3 h-3"
                          />
                          <span className="text-[10px] text-[#8c8c8c]">Y Axis</span>
                        </label>
                        <label className="flex items-center gap-1 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={parameterRoles[param.compositeKey]?.fixed || false}
                            onChange={() => handleRoleToggle(param.compositeKey, 'fixed')}
                            className="w-3 h-3"
                          />
                          <span className="text-[10px] text-[#8c8c8c]">Fixed</span>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {fixedParams.length > 0 && (
                <div>
                  <label className={cx("block mb-2 text-xs font-medium text-[#d9d9d9]")}>
                    Fixed Parameters
                  </label>
                  <div className={cx(ui.radius, ui.panelMuted, "p-3")}>
                    <div className={cx("text-[10px]", ui.textMuted, "mb-2")}>
                      Select values for fixed parameters
                    </div>
                    <div className="space-y-2">
                      {fixedParams.map(param => {
                        const possibleValues = getParamValues(param);
                        return (
                          <div key={param.compositeKey}>
                            <label className={cx("block mb-1 text-[10px]", ui.textMuted)}>
                              {param.label}
                            </label>
                            <select
                              value={fixedValues[param.compositeKey] ?? param.default}
                              onChange={(e) => setFixedValues(prev => ({
                                ...prev,
                                [param.compositeKey]: parseFloat(e.target.value)
                              }))}
                              className={cx(ui.input, "h-8 text-[11px]")}
                            >
                              {possibleValues.map(val => (
                                <option key={val} value={val}>{val}</option>
                              ))}
                            </select>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              <button onClick={handleGenerate} className={cx(ui.btnPrimary, "w-full h-9")}>
                📊 Generate Report
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
});

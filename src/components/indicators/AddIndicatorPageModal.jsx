import React, { memo, useState } from "react";
import { cx, ui } from "../../constants/ui";
import { ModalShell } from "../common";

const DEFAULT_CUSTOM_CODE =
  "import pandas as pd\n\ndef run(df: pd.DataFrame, **kwargs):\n    # Indicator implementation\n    return {}";

const PARAM_TYPES = ["int", "float", "enum", "bool"];

const INDICATOR_CATEGORIES = [
  "Trend",
  "Momentum",
  "Volatility",
  "Volume",
  "Structure",
  "Stat & Math",
  "Risk",
  "Liquidity",
  "Sentiment",
  "Composite",
  "Utility",
];

export const AddIndicatorPageModal = memo(function AddIndicatorPageModal({ onClose, onAdd }) {
  const [displayName, setDisplayName] = useState("");
  const [description, setDescription] = useState("");
  const [indicatorCategory, setIndicatorCategory] = useState("Trend");
  const [code, setCode] = useState(DEFAULT_CUSTOM_CODE);
  const [parameters, setParameters] = useState(() => [
    { name: "", type: "int", default_value: "", min: "", max: "", step: "" },
  ]);

  const updateParam = (index, field, value) => {
    setParameters((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const addParam = () => {
    setParameters((prev) => [
      ...prev,
      { name: "", type: "int", default_value: "", min: "", max: "", step: "" },
    ]);
  };

  const removeParam = (index) => {
    setParameters((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAdd = () => {
    onAdd({
      name: displayName,
      description,
      code,
      parameters: parameters
        .filter((p) => String(p.name ?? "").trim() !== "")
        .map((p) => ({
          name: String(p.name ?? "").trim(),
          type: p.type ?? "int",
          default_value: p.default_value ?? "",
          min: p.min ?? "",
          max: p.max ?? "",
          step: p.step ?? "",
        })),
      group: indicatorCategory,
    });
    onClose();
  };

  return (
    <ModalShell title="Add custom indicator" onClose={onClose}>
      <div className="space-y-4 max-h-[70vh] overflow-auto">
        <div>
          <label className={cx("block mb-1 text-xs", ui.textMuted)}>Display name</label>
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className={ui.input}
            placeholder="Display name"
          />
        </div>
        <div>
          <label className={cx("block mb-1 text-xs", ui.textMuted)}>Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={cx(ui.input, "w-full min-h-[60px]")}
            placeholder="Description"
            rows={2}
          />
        </div>
        <div>
          <label className={cx("block mb-1 text-xs", ui.textMuted)}>Indicator category</label>
          <select
            value={indicatorCategory}
            onChange={(e) => setIndicatorCategory(e.target.value)}
            className={cx(ui.input, "h-9 w-full")}
          >
            {INDICATOR_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={cx("block mb-2 text-xs", ui.textMuted)}>Parameters</label>
          <div className="border border-[#303030] rounded-lg overflow-hidden">
            <table className="w-full text-[11px] border-collapse">
              <thead className="bg-[#1f1f1f] text-[#8c8c8c]">
                <tr>
                  <th className="px-2 py-1.5 text-left font-medium">Param name</th>
                  <th className="px-2 py-1.5 text-left font-medium">Param type</th>
                  <th className="px-2 py-1.5 text-left font-medium">Default value</th>
                  <th className="px-2 py-1.5 text-left font-medium">Min</th>
                  <th className="px-2 py-1.5 text-left font-medium">Max</th>
                  <th className="px-2 py-1.5 text-left font-medium">Step</th>
                  <th className="px-2 py-1.5 w-8" />
                </tr>
              </thead>
              <tbody className="text-[#d9d9d9]">
                {parameters.map((p, idx) => (
                  <tr key={idx} className="border-t border-[#303030]">
                    <td className="px-2 py-1.5">
                      <input
                        type="text"
                        value={p.name}
                        onChange={(e) => updateParam(idx, "name", e.target.value)}
                        placeholder="name"
                        className={cx(ui.input, "h-7 min-w-[80px] text-[11px] font-mono")}
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <select
                        value={p.type}
                        onChange={(e) => updateParam(idx, "type", e.target.value)}
                        className={cx(ui.input, "h-7 text-[11px] min-w-[72px]")}
                      >
                        {PARAM_TYPES.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-2 py-1.5">
                      <input
                        type="text"
                        value={p.default_value}
                        onChange={(e) => updateParam(idx, "default_value", e.target.value)}
                        className={cx(ui.input, "h-7 w-16 text-[11px]")}
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <input
                        type="text"
                        value={p.min}
                        onChange={(e) => updateParam(idx, "min", e.target.value)}
                        className={cx(ui.input, "h-7 w-14 text-[11px]")}
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <input
                        type="text"
                        value={p.max}
                        onChange={(e) => updateParam(idx, "max", e.target.value)}
                        className={cx(ui.input, "h-7 w-14 text-[11px]")}
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <input
                        type="text"
                        value={p.step}
                        onChange={(e) => updateParam(idx, "step", e.target.value)}
                        className={cx(ui.input, "h-7 w-14 text-[11px]")}
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <button
                        type="button"
                        onClick={() => removeParam(idx)}
                        className="text-[#8c8c8c] hover:text-[#d9d9d9] p-1"
                        title="Remove"
                        aria-label="Remove"
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-2 py-1.5 border-t border-[#303030] bg-[#1f1f1f]">
              <button
                type="button"
                onClick={addParam}
                className={cx("text-[11px]", ui.textMuted, "hover:text-[#d9d9d9]")}
              >
                + Add parameter
              </button>
            </div>
          </div>
        </div>
        <div>
          <label className={cx("block mb-1 text-xs", ui.textMuted)}>Code</label>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className={cx(
              "text-[11px] font-mono text-[#a6a6a6] p-3 rounded-lg bg-[#0f0f0f] border border-[#303030] w-full min-h-[140px] max-h-40 resize-y",
              ui.input
            )}
            placeholder="Indicator code..."
            spellCheck={false}
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className={ui.btn}>
            Cancel
          </button>
          <button onClick={handleAdd} className={ui.btnPrimary} disabled={!displayName.trim()}>
            Add indicator
          </button>
        </div>
      </div>
    </ModalShell>
  );
});

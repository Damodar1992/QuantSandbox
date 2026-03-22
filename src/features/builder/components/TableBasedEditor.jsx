import React, { memo, useCallback } from "react";
import { cx, ui } from "../../../constants/ui";
import { CollapsibleSelect } from "./CollapsibleSelect";

export const TableBasedEditor = memo(({ rules, onChange, groupedVars }) => {
  const handleAddRule = useCallback(() => {
    onChange([
      ...rules,
      {
        id: Date.now(),
        conditions: [{ variable: "Close", operator: ">", value: "Close", logic: "AND" }],
      },
    ]);
  }, [rules, onChange]);

  const handleDeleteRule = useCallback(
    (ruleId) => {
      onChange(rules.filter((r) => r.id !== ruleId));
    },
    [rules, onChange]
  );

  const handleAddCondition = useCallback(
    (ruleId) => {
      onChange(
        rules.map((rule) =>
          rule.id === ruleId
            ? {
                ...rule,
                conditions: [
                  ...rule.conditions,
                  { variable: "Close", operator: ">", value: "Close", logic: "AND" },
                ],
              }
            : rule
        )
      );
    },
    [rules, onChange]
  );

  const handleDeleteCondition = useCallback(
    (ruleId, condIndex) => {
      onChange(
        rules.map((rule) =>
          rule.id === ruleId
            ? {
                ...rule,
                conditions: rule.conditions.filter((_, i) => i !== condIndex),
              }
            : rule
        )
      );
    },
    [rules, onChange]
  );

  const handleUpdateCondition = useCallback(
    (ruleId, condIndex, field, value) => {
      onChange(
        rules.map((rule) =>
          rule.id === ruleId
            ? {
                ...rule,
                conditions: rule.conditions.map((cond, i) =>
                  i === condIndex ? { ...cond, [field]: value } : cond
                ),
              }
            : rule
        )
      );
    },
    [rules, onChange]
  );

  const handleUpdateAction = useCallback(
    (ruleId, action) => {
      onChange(
        rules.map((rule) => (rule.id === ruleId ? { ...rule, action } : rule))
      );
    },
    [rules, onChange]
  );

  return (
    <div className="space-y-3">
      {rules.map((rule, ruleIndex) => (
        <div key={rule.id} className={cx(ui.radius, ui.panel, "overflow-hidden")}>
          <div
            className={cx(
              "flex items-center justify-between px-3 py-2",
              ui.panelMuted,
              "border-0 border-b",
              ui.divider
            )}
          >
            <div className="text-[12px] font-medium text-[#d9d9d9]">
              Rule #{ruleIndex + 1}
            </div>
            <button
              onClick={() => handleDeleteRule(rule.id)}
              className={cx(ui.btn, "h-7 px-2 text-[10px] text-red-400 hover:text-red-300")}
              title="Delete rule"
            >
              ✕ Delete
            </button>
          </div>
          <div className="p-3 space-y-2">
            <div className="space-y-2">
              {rule.conditions.map((condition, condIndex) => (
                <div key={condIndex} className="flex items-center gap-2">
                  <div className="w-20 shrink-0">
                    {condIndex > 0 ? (
                      <select
                        value={condition.logic}
                        onChange={(e) =>
                          handleUpdateCondition(rule.id, condIndex, "logic", e.target.value)
                        }
                        className={cx(ui.input, "w-full h-8 text-[11px]")}
                      >
                        <option value="AND">AND</option>
                        <option value="OR">OR</option>
                      </select>
                    ) : null}
                  </div>
                  <div className="flex-1 min-w-0">
                    <CollapsibleSelect
                      value={condition.variable}
                      onChange={(newValue) =>
                        handleUpdateCondition(rule.id, condIndex, "variable", newValue)
                      }
                      groupedVars={groupedVars}
                    />
                  </div>
                  <div className="w-20 shrink-0">
                    <select
                      value={condition.operator}
                      onChange={(e) =>
                        handleUpdateCondition(rule.id, condIndex, "operator", e.target.value)
                      }
                      className={cx(ui.input, "w-full h-8 text-[11px]")}
                    >
                      <option value=">">{">"}</option>
                      <option value="<">{"<"}</option>
                      <option value=">=">{">="}</option>
                      <option value="<=">{"<="}</option>
                      <option value="==">{"=="}</option>
                      <option value="!=">{"!="}</option>
                    </select>
                  </div>
                  <div className="flex-1 min-w-0">
                    <CollapsibleSelect
                      value={condition.value}
                      onChange={(newValue) =>
                        handleUpdateCondition(rule.id, condIndex, "value", newValue)
                      }
                      groupedVars={groupedVars}
                    />
                  </div>
                  <div className="w-8 shrink-0">
                    {rule.conditions.length > 1 && (
                      <button
                        onClick={() => handleDeleteCondition(rule.id, condIndex)}
                        className={cx(
                          ui.btn,
                          "w-full h-8 text-[11px] text-red-400 hover:text-red-300"
                        )}
                        title="Delete condition"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => handleAddCondition(rule.id)}
              className={cx(ui.btn, "h-7 px-2 text-[10px] w-full")}
            >
              + Add Condition
            </button>
            <div className="flex items-center gap-2 pt-2 border-t border-[#303030]">
              <span className="text-[11px] text-[#8c8c8c]">THEN</span>
              <select
                value={rule.action}
                onChange={(e) => handleUpdateAction(rule.id, e.target.value)}
                className={cx(ui.input, "flex-1 h-8 text-[11px] font-medium text-emerald-400")}
              >
                <option value="SIGNAL">Signal = True</option>
              </select>
            </div>
          </div>
        </div>
      ))}
      <button
        onClick={handleAddRule}
        className={cx(ui.btn, "h-10 px-4 text-[12px] w-full", ui.radius)}
      >
        + Add New Rule
      </button>
      {rules.length === 0 && (
        <div className={cx(ui.panel, ui.radius, "p-8 text-center")}>
          <div className="text-[#595959] text-[12px]">
            No rules defined. Click &quot;Add New Rule&quot; to create your first trading rule.
          </div>
        </div>
      )}
    </div>
  );
});

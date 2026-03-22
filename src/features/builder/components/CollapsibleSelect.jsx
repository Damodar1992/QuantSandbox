import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import { cx, ui } from "../../../constants/ui";

export const CollapsibleSelect = memo(({ value, onChange, groupedVars }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState(new Set());
  const [dropdownPosition, setDropdownPosition] = useState(null);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 4,
        left: rect.left,
        width: Math.max(rect.width, 350),
      });
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const toggleGroup = useCallback((groupName) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupName)) next.delete(groupName);
      else next.add(groupName);
      return next;
    });
  }, []);

  const handleSelect = useCallback(
    (varName) => {
      onChange(varName);
      setIsOpen(false);
    },
    [onChange]
  );

  return (
    <div ref={dropdownRef} className="relative w-full">
      <div ref={buttonRef} className="relative w-full">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsOpen(true)}
          className={cx(ui.input, "w-full h-8 text-[11px] pr-8")}
          placeholder="Enter value or select from list"
        />
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="absolute right-1 top-1/2 -translate-y-1/2 px-2 py-1 text-[#8c8c8c] hover:text-[#d9d9d9] transition-colors"
        >
          {isOpen ? "▲" : "▼"}
        </button>
      </div>
      {isOpen && groupedVars && dropdownPosition && (
        <div
          className={cx(
            "fixed z-[9999]",
            "rounded border border-[#303030] bg-[#1a1a1a] shadow-lg"
          )}
          style={{
            top: dropdownPosition.top,
            left: dropdownPosition.left,
            width: dropdownPosition.width,
            maxHeight: "400px",
            overflowY: "auto",
            overflowX: "hidden",
          }}
        >
          {groupedVars.map(([groupName, vars]) => (
            <div key={groupName}>
              <button
                type="button"
                onClick={() => toggleGroup(groupName)}
                className={cx(
                  "w-full px-3 py-2 text-left text-[12px] font-medium",
                  "flex items-center justify-between",
                  "hover:bg-[#252525] transition-colors",
                  "border-b border-[#303030]",
                  "sticky top-0 bg-[#1f1f1f] z-10"
                )}
              >
                <span className="text-[#a6a6a6]">
                  {expandedGroups.has(groupName) ? "▼" : "▶"} {groupName}
                </span>
                <span className="text-[#595959] text-[11px]">({vars.length})</span>
              </button>
              {expandedGroups.has(groupName) && (
                <div>
                  {vars.map((varName) => (
                    <button
                      key={varName}
                      type="button"
                      onClick={() => handleSelect(varName)}
                      className={cx(
                        "w-full px-4 py-2 text-left text-[12px]",
                        "hover:bg-[#2a2a2a] transition-colors",
                        varName === value
                          ? "bg-emerald-500/20 text-emerald-300 font-medium"
                          : "text-[#d9d9d9]"
                      )}
                    >
                      {varName}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

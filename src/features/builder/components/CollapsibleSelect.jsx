import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import { cx } from "../../../constants/ui";
import { crmAccent } from "../../../constants/crmAccent";
import { Input } from "@/components/ui/input";
import { AppButton } from "@/components/common/AppButton";

export const CollapsibleSelect = memo(({ value, onChange, groupedVars }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState(new Set());
  const containerRef = useRef(null);
  const justSelectedRef = useRef(false);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
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
      justSelectedRef.current = true;
      onChange(varName);
      setIsOpen(false);
    },
    [onChange],
  );

  const handleInputFocus = useCallback(() => {
    if (justSelectedRef.current) {
      justSelectedRef.current = false;
      return;
    }
    setIsOpen(true);
  }, []);

  return (
    <div ref={containerRef} className="relative w-full">
      <Input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={handleInputFocus}
        className="h-8 w-full pr-8 text-[11px]"
        placeholder="Enter value or select from list"
      />
      <AppButton
        type="button"
        variant="ghost"
        size="icon-xs"
        onMouseDown={(e) => {
          // prevent input blur→focus cycle
          e.preventDefault();
          setIsOpen((v) => !v);
        }}
        className="absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground"
      >
        {isOpen ? "▲" : "▼"}
      </AppButton>

      {isOpen && groupedVars && groupedVars.length > 0 && (
        <div
          className="absolute left-0 top-full z-50 mt-1 w-[min(100vw-2rem,28rem)] max-h-[360px] overflow-y-auto rounded-md border border-border bg-popover text-xs shadow-lg"
          onMouseDown={(e) => e.preventDefault()} // keep input focus
        >
          {groupedVars.map(([groupName, vars]) => (
            <div key={groupName}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => toggleGroup(groupName)}
                className={cx(
                  "flex w-full items-center justify-between border-b border-border px-3 py-2 text-left text-xs font-medium",
                  "sticky top-0 bg-muted hover:bg-muted/80",
                )}
              >
                <span className="text-muted-foreground">
                  {expandedGroups.has(groupName) ? "▼" : "▶"} {groupName}
                </span>
                <span className="text-[11px] text-muted-foreground">({vars.length})</span>
              </button>
              {expandedGroups.has(groupName) && (
                <div>
                  {vars.map((varName) => (
                    <button
                      key={varName}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => handleSelect(varName)}
                      className={cx(
                        "w-full px-4 py-2 text-left text-xs hover:bg-muted",
                        varName === value
                          ? cx(crmAccent.bgMedium, "font-medium", crmAccent.textMuted)
                          : "text-foreground",
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

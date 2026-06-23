import React, { memo, useCallback, useMemo, useState } from "react";
import { cx, ui } from "../../../constants/ui";
import { crmSurface } from "../../../constants/crmAccent";
import { BASE_INDICATORS, INDICATOR_GROUPS } from "../../../constants/indicators";

export const IndicatorLibrary = memo(({ query, onQueryChange, groupFilter, onGroupChange, onAdd }) => {
  const [recentlyUsed, setRecentlyUsed] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("recentIndicators") || "[]");
    } catch {
      return [];
    }
  });
  const [expandedGroups, setExpandedGroups] = useState(() => ({
    "Recently Used": true,
  }));

  const handleAdd = useCallback(
    (key) => {
      setRecentlyUsed((prev) => {
        const newRecent = [key, ...prev.filter((k) => k !== key)].slice(0, 10);
        localStorage.setItem("recentIndicators", JSON.stringify(newRecent));
        return newRecent;
      });
      onAdd(key);
    },
    [onAdd],
  );

  const toggleGroup = useCallback((group) => {
    setExpandedGroups((prev) => ({ ...prev, [group]: !prev[group] }));
  }, []);

  const filteredIndicators = useMemo(() => {
    const q = query.trim().toLowerCase();
    return Object.entries(BASE_INDICATORS).filter(([key, info]) => {
      const matchesGroup = groupFilter === "All" || info.group === groupFilter;
      const matchesQuery =
        q.length === 0 ||
        `${info.name} ${info.description} ${info.group} ${info.talib}`.toLowerCase().includes(q);
      return matchesGroup && matchesQuery;
    });
  }, [query, groupFilter]);

  const groupedIndicators = useMemo(() => {
    const groups = {};
    const recentIndicators = filteredIndicators
      .filter(([key]) => recentlyUsed.includes(key))
      .sort((a, b) => recentlyUsed.indexOf(a[0]) - recentlyUsed.indexOf(b[0]));
    if (recentIndicators.length > 0) groups["Recently Used"] = recentIndicators;
    INDICATOR_GROUPS.filter((g) => g !== "All").forEach((group) => {
      const groupIndicators = filteredIndicators.filter(
        ([key, info]) => info.group === group && !recentlyUsed.includes(key),
      );
      if (groupIndicators.length > 0) groups[group] = groupIndicators;
    });
    return groups;
  }, [filteredIndicators, recentlyUsed]);

  const renderIndicator = useCallback(
    ([key, info]) => (
      <div
        key={key}
        className={cx("flex items-center gap-2 py-1.5 px-2 rounded group hover:bg-muted")}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={cx("text-[11px] font-medium", crmSurface.text)}>{info.name}</span>
            <span
              className={cx(
                "text-[9px] px-1.5 py-0.5 rounded",
                info.group === "Trend"
                  ? "bg-blue-500/10 text-blue-300"
                  : info.group === "Momentum"
                    ? "bg-purple-500/10 text-purple-300"
                    : info.group === "Volatility"
                      ? "bg-orange-500/10 text-orange-300"
                      : "bg-amber-500/10 text-amber-300",
              )}
            >
              {info.group}
            </span>
          </div>
        </div>
        <button
          onClick={() => handleAdd(key)}
          className={cx(ui.btnPrimary, "h-6 px-2 text-[10px] whitespace-nowrap")}
        >
          + Add
        </button>
      </div>
    ),
    [handleAdd],
  );

  return (
    <div className={cx("h-full flex flex-col", ui.builderColumn)}>
      <div className="mb-2">
        <div className={cx("text-[12px] font-medium mb-1", crmSurface.textHeading)}>
          Indicator Library
        </div>
        <div className={cx("text-[10px]", ui.textMuted, "mb-2")}>
          {filteredIndicators.length} of {Object.keys(BASE_INDICATORS).length} indicators
        </div>
        <div className="relative">
          <svg
            viewBox="0 0 24 24"
            className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#595959]"
          >
            <circle cx="11" cy="11" r="8" fill="none" stroke="currentColor" strokeWidth="2" />
            <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            className={cx(ui.input, "h-7 pl-8 text-[11px]")}
            placeholder="Search indicators..."
          />
        </div>
      </div>
      <div className="flex-1 overflow-auto">
        {Object.entries(groupedIndicators).length === 0 ? (
          <div
            className={cx(
              ui.panelMuted,
              "m-3 p-6 text-center text-[11px] rounded",
              ui.textMuted,
            )}
          >
            No indicators found. Try different filters.
          </div>
        ) : (
          <div className="p-2">
            {Object.entries(groupedIndicators).map(([groupName, indicators]) => {
              const isExpanded = expandedGroups[groupName];
              const isRecentlyUsed = groupName === "Recently Used";
              return (
                <div key={groupName} className="mb-1">
                  <button
                    onClick={() => toggleGroup(groupName)}
                    className={cx(
                      "w-full flex items-center justify-between px-2 py-1.5 rounded hover:bg-muted transition-colors",
                      isRecentlyUsed && crmSurface.panelMuted,
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-[#b8aecc]">
                        {isExpanded ? "▼" : "▶"}
                      </span>
                      <span className={cx("text-[11px] font-medium", crmSurface.textHeading)}>
                        {isRecentlyUsed && "⏱ "}
                        {groupName}
                      </span>
                      <span className="text-[10px] text-[#8c7da3]">({indicators.length})</span>
                    </div>
                  </button>
                  {isExpanded && (
                    <div className="mt-0.5 space-y-0.5">
                      {indicators.map(renderIndicator)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
});

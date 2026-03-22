import React, { memo, useCallback, useMemo, useState } from "react";
import { cx, ui } from "../../../constants/ui";
import { BASE_INDICATORS, INDICATOR_GROUPS } from "../../../constants/indicators";

export const IndicatorLibrary = memo(({ query, onQueryChange, groupFilter, onGroupChange, onAdd }) => {
  const [favorites, setFavorites] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("favoriteIndicators") || "[]");
    } catch {
      return [];
    }
  });
  const [recentlyUsed, setRecentlyUsed] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("recentIndicators") || "[]");
    } catch {
      return [];
    }
  });
  const [expandedGroups, setExpandedGroups] = useState(() => ({
    Favorites: true,
    "Recently Used": true,
  }));
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  const toggleFavorite = useCallback((key) => {
    setFavorites((prev) => {
      const newFavorites = prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key];
      localStorage.setItem("favoriteIndicators", JSON.stringify(newFavorites));
      return newFavorites;
    });
  }, []);

  const handleAdd = useCallback(
    (key) => {
      setRecentlyUsed((prev) => {
        const newRecent = [key, ...prev.filter((k) => k !== key)].slice(0, 10);
        localStorage.setItem("recentIndicators", JSON.stringify(newRecent));
        return newRecent;
      });
      onAdd(key);
    },
    [onAdd]
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
      const matchesFavorites = !showFavoritesOnly || favorites.includes(key);
      return matchesGroup && matchesQuery && matchesFavorites;
    });
  }, [query, groupFilter, showFavoritesOnly, favorites]);

  const groupedIndicators = useMemo(() => {
    const groups = {};
    const favIndicators = filteredIndicators.filter(([key]) => favorites.includes(key));
    if (favIndicators.length > 0) groups["Favorites"] = favIndicators;
    const recentIndicators = filteredIndicators
      .filter(([key]) => recentlyUsed.includes(key) && !favorites.includes(key))
      .sort((a, b) => recentlyUsed.indexOf(a[0]) - recentlyUsed.indexOf(b[0]));
    if (recentIndicators.length > 0) groups["Recently Used"] = recentIndicators;
    INDICATOR_GROUPS.filter((g) => g !== "All").forEach((group) => {
      const groupIndicators = filteredIndicators.filter(
        ([key, info]) =>
          info.group === group && !favorites.includes(key) && !recentlyUsed.includes(key)
      );
      if (groupIndicators.length > 0) groups[group] = groupIndicators;
    });
    return groups;
  }, [filteredIndicators, favorites, recentlyUsed]);

  const renderIndicator = useCallback(
    ([key, info]) => {
      const isFavorite = favorites.includes(key);
      return (
        <div
          key={key}
          className="flex items-center gap-2 py-1.5 px-2 hover:bg-[#1a1a1a] rounded group"
        >
          <button
            onClick={() => toggleFavorite(key)}
            className={cx(
              "text-[14px] transition-colors",
              isFavorite ? "text-amber-400" : "text-[#404040] group-hover:text-[#8c8c8c]"
            )}
            title={isFavorite ? "Remove from favorites" : "Add to favorites"}
          >
            {isFavorite ? "★" : "☆"}
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-medium text-[#d9d9d9]">{info.name}</span>
              <span
                className={cx(
                  "text-[9px] px-1.5 py-0.5 rounded",
                  info.group === "Trend"
                    ? "bg-blue-500/10 text-blue-300"
                    : info.group === "Momentum"
                      ? "bg-purple-500/10 text-purple-300"
                      : info.group === "Volatility"
                        ? "bg-orange-500/10 text-orange-300"
                        : "bg-amber-500/10 text-amber-300"
                )}
              >
                {info.group}
              </span>
            </div>
          </div>
          <button
            onClick={() => handleAdd(key)}
            className={cx(
              ui.btnPrimary,
              "h-6 px-2 text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity"
            )}
          >
            + Add
          </button>
        </div>
      );
    },
    [favorites, toggleFavorite, handleAdd]
  );

  return (
    <div className={cx(ui.radius, ui.panel, "overflow-hidden h-full flex flex-col")}>
      <div className={cx("px-3 py-2.5", ui.panelMuted, "border-0 border-b", ui.divider)}>
        <div className="text-[11px] font-medium text-[#d9d9d9] mb-1">Indicator Library</div>
        <div className={cx("text-[10px]", ui.textMuted, "mb-2")}>
          {Object.keys(BASE_INDICATORS).length} indicators • {favorites.length} favorites
        </div>
        <div className="space-y-2">
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
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showFavoritesOnly}
              onChange={(e) => setShowFavoritesOnly(e.target.checked)}
              className="w-3.5 h-3.5"
            />
            <span className="text-[10px] text-[#d9d9d9]">Show only favorites</span>
          </label>
        </div>
      </div>
      <div className="flex-1 overflow-auto">
        {Object.entries(groupedIndicators).length === 0 ? (
          <div
            className={cx(
              ui.panelMuted,
              "m-3 p-6 text-center text-[11px] rounded",
              ui.textMuted
            )}
          >
            No indicators found. Try different filters.
          </div>
        ) : (
          <div className="p-2">
            {Object.entries(groupedIndicators).map(([groupName, indicators]) => {
              const isExpanded = expandedGroups[groupName];
              const isSpecialGroup = groupName === "Favorites" || groupName === "Recently Used";
              return (
                <div key={groupName} className="mb-1">
                  <button
                    onClick={() => toggleGroup(groupName)}
                    className={cx(
                      "w-full flex items-center justify-between px-2 py-1.5 rounded hover:bg-[#1a1a1a] transition-colors",
                      isSpecialGroup && "bg-[#1a1a1a]"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-[#8c8c8c]">
                        {isExpanded ? "▼" : "▶"}
                      </span>
                      <span className="text-[11px] font-medium text-[#d9d9d9]">
                        {groupName === "Favorites" && "★ "}
                        {groupName === "Recently Used" && "⏱ "}
                        {groupName}
                      </span>
                      <span className="text-[9px] text-[#595959]">({indicators.length})</span>
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

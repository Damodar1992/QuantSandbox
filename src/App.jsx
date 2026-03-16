import React, { memo, useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import Editor from "@monaco-editor/react";

// Import constants from separate files
import { cx, ui } from "./constants/ui";
import { SECTIONS, DISABLED_SECTIONS, PAIR_OPTIONS, TIME_RANGES, INITIAL_STRATEGIES } from "./constants/app";
import { SOURCE_OPTIONS, MA_TYPES, INDICATOR_GROUPS, BASE_INDICATORS } from "./constants/indicators";
import { HEATMAP_FILTER_KEYS, FILTER_OPERATIONS } from "./constants/heatmap";
import { FORMULA_OPTIONS, HYPEROPT_DETAILS_TOOLTIP_TEXT } from "./constants/formulas";
import { clamp, lerp, quantile, computeRanges, normalizeParam, buildHeatMap, formatScore, heatmapScoreToColor, HEATMAP_LEGEND_STOPS, HEATMAP_CELL_PX, HEATMAP_GAP_PX, EMPTY_CELL_BG } from "./utils/heatmap";
import { getParamValuesFromDef, getParamDefForCompositeKey, getParamLabel, getReportParamLabel, getIndicatorTemplate } from "./utils/indicators";
import { generatePythonCode } from "./utils/pythonCode";
import { generateMockResults } from "./utils/mockResults";
import { useOutsideClose } from "./hooks/useOutsideClose";
import { Logo, Badge, MoreIcon, EyeIcon, MenuIcon, ModalShell } from "./components/common";
import { LoginScreen, ForgotPasswordModal } from "./components/auth";
import { Header } from "./components/shared";
import { CreateStrategyModal, EditDescriptionModal, StrategyRow } from "./components/strategies";
import { GenerateReportModal } from "./components/report";
import { HeatMapView, HeatMapConfigurator, PairsDropdown, HeatMapGrid, HyperoptDetailsTooltip } from "./components/heatmap";
import { FormulaActionsMenu } from "./components/formulas";
import { UserActionsMenu, CreateUserModal, EditUserModal, ChangePasswordModal, ResetPasswordModal } from "./components/users";
import { IndicatorActionsMenu } from "./components/indicators";

/**
 * Quant Sandbox CRM Mock — Properly structured React app
 * - Login + Forgot Password (mock)
 * - Header navigation (Backtesting disabled, Users available)
 * - Strategies list (expand versions)
 * - Strategy detail (tabs: Strategy Builder / Strategy Code)
 * - Edit version description modal
 * - Builder: Run Optimization + Optimization Runs table + row-details HeatMap
 * 
 * Structure:
 * - constants/ - All app constants and configurations
 * - App.jsx - Main application logic and components
 */

const MOCK_OPTIMIZATION_RUNS = [
  {
    id: "run-1",
    date: "2026-01-23 23:00:00",
    pairs: ["BTC/USDT", "ETH/USDT"],
    timeRange: "15m",
    timeFrameStart: "2020-01-23",
    timeFrameEnd: "2023-01-23",
    status: "completed",
    indicators: ["rsi_close", "ema_close", "macd"],
    profit: "+18.5%",
    trades: 245,
    winRate: "64%"
  },
  {
    id: "run-2",
    date: "2026-01-20 15:30:00",
    pairs: ["BTC/USDT"],
    timeRange: "1h",
    timeFrameStart: "2021-06-01",
    timeFrameEnd: "2023-12-31",
    status: "completed",
    indicators: ["bulinger", "macd", "ema_slope_20", "ema_trend_close_200_close"],
    profit: "+25.3%",
    trades: 187,
    winRate: "71%"
  }
];

/* ====================== Builder Stepper ====================== */

const StageIcon = ({ children }) => (
  <span className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-[#303030] bg-[#0f0f0f] text-[#a6a6a6]">
    {children}
  </span>
);

/* ====================== Indicator Management ====================== */

const IndicatorLibrary = memo(({ query, onQueryChange, groupFilter, onGroupChange, onAdd }) => {
  const [favorites, setFavorites] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('favoriteIndicators') || '[]');
    } catch {
      return [];
    }
  });
  const [recentlyUsed, setRecentlyUsed] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('recentIndicators') || '[]');
    } catch {
      return [];
    }
  });
  const [expandedGroups, setExpandedGroups] = useState(() => {
    // Start with Favorites and Recently Used expanded
    return { 'Favorites': true, 'Recently Used': true };
  });
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  
  // Toggle favorite
  const toggleFavorite = useCallback((key) => {
    setFavorites(prev => {
      const newFavorites = prev.includes(key) 
        ? prev.filter(k => k !== key)
        : [...prev, key];
      localStorage.setItem('favoriteIndicators', JSON.stringify(newFavorites));
      return newFavorites;
    });
  }, []);
  
  // Add to recently used
  const handleAdd = useCallback((key) => {
    setRecentlyUsed(prev => {
      const newRecent = [key, ...prev.filter(k => k !== key)].slice(0, 10);
      localStorage.setItem('recentIndicators', JSON.stringify(newRecent));
      return newRecent;
    });
    onAdd(key);
  }, [onAdd]);
  
  // Toggle group expansion
  const toggleGroup = useCallback((group) => {
    setExpandedGroups(prev => ({ ...prev, [group]: !prev[group] }));
  }, []);
  
  // Filter indicators
  const filteredIndicators = useMemo(() => {
    const q = query.trim().toLowerCase();
    return Object.entries(BASE_INDICATORS).filter(([key, info]) => {
      const matchesGroup = groupFilter === "All" || info.group === groupFilter;
      const matchesQuery = q.length === 0 || 
        `${info.name} ${info.description} ${info.group} ${info.talib}`.toLowerCase().includes(q);
      const matchesFavorites = !showFavoritesOnly || favorites.includes(key);
      return matchesGroup && matchesQuery && matchesFavorites;
    });
  }, [query, groupFilter, showFavoritesOnly, favorites]);
  
  // Group indicators by category
  const groupedIndicators = useMemo(() => {
    const groups = {};
    
    // Favorites group
    const favIndicators = filteredIndicators.filter(([key]) => favorites.includes(key));
    if (favIndicators.length > 0) {
      groups['Favorites'] = favIndicators;
    }
    
    // Recently Used group
    const recentIndicators = filteredIndicators.filter(([key]) => 
      recentlyUsed.includes(key) && !favorites.includes(key)
    ).sort((a, b) => recentlyUsed.indexOf(a[0]) - recentlyUsed.indexOf(b[0]));
    if (recentIndicators.length > 0) {
      groups['Recently Used'] = recentIndicators;
    }
    
    // Other groups
    INDICATOR_GROUPS.filter(g => g !== "All").forEach(group => {
      const groupIndicators = filteredIndicators.filter(([key, info]) => 
        info.group === group && !favorites.includes(key) && !recentlyUsed.includes(key)
      );
      if (groupIndicators.length > 0) {
        groups[group] = groupIndicators;
      }
    });
    
    return groups;
  }, [filteredIndicators, favorites, recentlyUsed]);
  
  // Render compact indicator item
  const renderIndicator = useCallback(([key, info]) => {
    const isFavorite = favorites.includes(key);
    
    return (
      <div key={key} className="flex items-center gap-2 py-1.5 px-2 hover:bg-[#1a1a1a] rounded group">
        <button
          onClick={() => toggleFavorite(key)}
          className={cx(
            "text-[14px] transition-colors",
            isFavorite ? "text-amber-400" : "text-[#404040] group-hover:text-[#8c8c8c]"
          )}
          title={isFavorite ? "Remove from favorites" : "Add to favorites"}
        >
          {isFavorite ? '★' : '☆'}
        </button>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium text-[#d9d9d9]">{info.name}</span>
            <span className={cx(
              "text-[9px] px-1.5 py-0.5 rounded",
              info.group === "Trend" ? "bg-blue-500/10 text-blue-300" :
              info.group === "Momentum" ? "bg-purple-500/10 text-purple-300" :
              info.group === "Volatility" ? "bg-orange-500/10 text-orange-300" :
              "bg-amber-500/10 text-amber-300"
            )}>
              {info.group}
            </span>
          </div>
        </div>
        
        <button 
          onClick={() => handleAdd(key)} 
          className={cx(ui.btnPrimary, "h-6 px-2 text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity")}
        >
          + Add
        </button>
      </div>
    );
  }, [favorites, toggleFavorite, handleAdd]);
  
  return (
    <div className={cx(ui.radius, ui.panel, "overflow-hidden h-full flex flex-col")}>
      <div className={cx("px-3 py-2.5", ui.panelMuted, "border-0 border-b", ui.divider)}>
        <div className="text-[11px] font-medium text-[#d9d9d9] mb-1">Indicator Library</div>
        <div className={cx("text-[10px]", ui.textMuted, "mb-2")}>
          {Object.keys(BASE_INDICATORS).length} indicators • {favorites.length} favorites
        </div>
        
        <div className="space-y-2">
          <div className="relative">
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#595959]">
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
          <div className={cx(ui.panelMuted, "m-3 p-6 text-center text-[11px] rounded", ui.textMuted)}>
            No indicators found. Try different filters.
          </div>
        ) : (
          <div className="p-2">
            {Object.entries(groupedIndicators).map(([groupName, indicators]) => {
              const isExpanded = expandedGroups[groupName];
              const isSpecialGroup = groupName === 'Favorites' || groupName === 'Recently Used';
              
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
                        {isExpanded ? '▼' : '▶'}
                      </span>
                      <span className="text-[11px] font-medium text-[#d9d9d9]">
                        {groupName === 'Favorites' && '★ '}
                        {groupName === 'Recently Used' && '⏱ '}
                        {groupName}
                      </span>
                      <span className="text-[9px] text-[#595959]">
                        ({indicators.length})
                      </span>
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

const IndicatorItem = memo(({ indicator, index, total, onEdit, onDelete }) => {
  const baseInfo = BASE_INDICATORS[indicator.type];
  const paramsText = indicator.params.map(p => `${p.label}: ${p.default} [${p.min}-${p.max}, step ${p.step}]`).join(", ");
  
  // Calculate combinations
  const combinations = indicator.params.reduce((total, param) => {
    const count = Math.floor((param.max - param.min) / param.step) + 1;
    return total * count;
  }, 1);
  
  // Debug: log combinations
  console.log(`Indicator ${indicator.name}: ${combinations} combinations`, indicator.params);
  
  return (
    <div className={cx(
      ui.radius, 
      "border p-3 transition-all",
      indicator.enabled ? "border-[#303030] bg-[#0f0f0f]" : "border-[#303030] bg-[#0f0f0f]/50 opacity-60"
    )}>
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-[12px] font-medium text-[#d9d9d9]">{indicator.name}</span>
            {indicator.displayName && (
              <span className="text-[10px] px-2 py-0.5 rounded border border-emerald-500/40 bg-emerald-500/10 text-emerald-300 font-medium">
                Display: {indicator.displayName}
              </span>
            )}
            <span className="text-[10px] px-2 py-0.5 rounded border border-[#303030] bg-[#0f0f0f] text-[#8c8c8c]">
              {indicator.type}
            </span>
            {baseInfo && (
              <span className={cx(
                "text-[10px] px-2 py-0.5 rounded border",
                baseInfo.group === "Trend" ? "border-blue-500/40 bg-blue-500/10 text-blue-200" :
                baseInfo.group === "Momentum" ? "border-purple-500/40 bg-purple-500/10 text-purple-200" :
                baseInfo.group === "Volatility" ? "border-orange-500/40 bg-orange-500/10 text-orange-200" :
                "border-amber-500/40 bg-amber-500/10 text-amber-200"
              )}>
                {baseInfo.group}
              </span>
            )}
            <span className="text-[10px] px-2 py-0.5 rounded border border-[#303030] bg-[#0f0f0f] text-[#8c8c8c]">
              Source: {indicator.source}
            </span>
            {combinations > 1 && (
              <span className="text-[10px] px-2 py-0.5 rounded border border-emerald-500/40 bg-emerald-500/10 text-emerald-300 font-medium">
                {combinations.toLocaleString()} combinations
              </span>
            )}
          </div>
          <div className={cx("text-[11px]", ui.textMuted)}>{paramsText}</div>
        </div>
        
        {/* Actions */}
        <div className="flex items-center gap-1">
          <button onClick={onEdit} className={cx(ui.btn, "h-7 px-2 text-[11px]")} title="Edit">
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5">
              <path d="M16.9 3.7a2.1 2.1 0 0 1 3 3L8.4 18.2 4 19.4l1.2-4.4L16.9 3.7z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
            </svg>
          </button>
          
          <button onClick={onDelete} className={cx(ui.btn, "h-7 px-2 text-[11px] text-red-200 hover:bg-red-500/10")} title="Delete">
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5">
              <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
});

// Helper function to generate default display name (outside component)
const getDefaultDisplayName = (type) => {
  const nameMap = {
    "RSI": "rsi",
    "EMA": "ema",
    "MACD": "macd",
    "BBANDS": "bb",
    "GC_DW": "gc",
    "CUSTOM_FORMULA": "custom"
  };
  return nameMap[type] || type.toLowerCase();
};

const AddIndicatorModal = memo(({ onClose, onAdd, initialType = "RSI" }) => {
  const [selectedType, setSelectedType] = useState(initialType);
  const [displayName, setDisplayName] = useState(() => {
    const defaultName = getDefaultDisplayName(initialType);
    console.log("🔍 Initial displayName:", defaultName);
    return defaultName;
  });
  const [source, setSource] = useState(() => {
    return BASE_INDICATORS[initialType]?.defaultSource || "Close";
  });
  const [params, setParams] = useState(() => {
    return BASE_INDICATORS[initialType]?.params.map(p => ({...p})) || [];
  });
  const [customFormula, setCustomFormula] = useState("");
  
  useEffect(() => {
    const baseIndicator = BASE_INDICATORS[selectedType];
    setParams(baseIndicator.params.map(p => ({...p})));
    setSource(baseIndicator.defaultSource);
    // Auto-generate display name when type changes
    setDisplayName(getDefaultDisplayName(selectedType));
    // Clear custom formula when changing indicator type
    setCustomFormula("");
  }, [selectedType]);
  
  const handleParamChange = (index, field, value) => {
    setParams(prev => prev.map((p, i) => i === index ? {...p, [field]: parseFloat(value) || 0} : p));
  };
  
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
      source: source,
      params: params,
      metrics: [...(baseIndicator.metrics || [])],
      ...(selectedType === "CUSTOM_FORMULA" && { customFormula: customFormula.trim() })
    };
    
    onAdd(indicator);
    onClose();
  };
  
  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/70 px-4">
      <div className={cx("w-full max-w-3xl max-h-[90vh] overflow-auto", ui.radius, ui.panel, ui.shadow, "p-6 space-y-4")}>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[#f5f5f5]">Add Indicator</h2>
          <button className={cx(ui.btn, "px-2 py-1")} onClick={onClose}>✕</button>
        </div>
        
        <div>
          <label className={cx("block mb-1 text-xs", ui.textMuted)}>Indicator Type</label>
          <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)} className={cx(ui.input, "h-9")}>
            {Object.entries(BASE_INDICATORS).map(([key, info]) => (
              <option key={key} value={key}>{info.name}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className={cx("block mb-1 text-xs", ui.textMuted)}>Source</label>
          <select value={source} onChange={(e) => setSource(e.target.value)} className={cx(ui.input, "h-9")}>
            {SOURCE_OPTIONS.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className={cx("block mb-1 text-xs", ui.textMuted)}>
            Display Name [DEBUG: value="{displayName}"]
          </label>
          <input 
            value={displayName} 
            onChange={(e) => setDisplayName(e.target.value)} 
            className={ui.input} 
            placeholder="e.g., rsi, ema, my_indicator"
            style={{ backgroundColor: displayName ? '#1a3a1a' : '#3a1a1a' }}
          />
          <div className={cx("text-[10px]", ui.textMuted, "mt-1")}>
            This name will be used in formulas (e.g., {displayName || 'indicator'}_close_14)
          </div>
        </div>
        
        {selectedType === "CUSTOM_FORMULA" && (
          <div>
            <label className={cx("block mb-1 text-xs", ui.textMuted)}>Custom Formula</label>
            <textarea
              value={customFormula}
              onChange={(e) => setCustomFormula(e.target.value)}
              className={cx(ui.input, "font-mono text-[11px]")}
              rows={6}
              placeholder={'dataframe["ema_slope_20"] = dataframe["ema_close_20"].diff(1)\ndataframe["macd_slope"] = dataframe["macd_close"].diff(1)'}
            />
            <div className={cx("text-[10px]", ui.textMuted, "mt-1")}>
              Enter Python code to calculate custom indicators. You can use multiple lines.
            </div>
          </div>
        )}
        
        {selectedType !== "CUSTOM_FORMULA" && (
          <div>
            <div className={cx("text-xs font-medium text-[#d9d9d9] mb-2")}>Parameter Ranges</div>
            <div className="space-y-3">
              {params.map((param, idx) => (
              <div key={idx} className={cx(ui.radius, ui.panelMuted, "p-3")}>
                <div className="text-[12px] font-medium text-[#d9d9d9] mb-2">{param.label}</div>
                <div className="grid grid-cols-4 gap-3">
                  <div>
                    <label className={cx("block mb-1 text-[10px]", ui.textMuted)}>Default</label>
                    <input type="number" value={param.default} 
                      onChange={(e) => handleParamChange(idx, "default", e.target.value)}
                      className={cx(ui.input, "h-8 text-[12px]")} />
                  </div>
                  <div>
                    <label className={cx("block mb-1 text-[10px]", ui.textMuted)}>Min</label>
                    <input type="number" value={param.min} 
                      onChange={(e) => handleParamChange(idx, "min", e.target.value)}
                      className={cx(ui.input, "h-8 text-[12px]")} />
                  </div>
                  <div>
                    <label className={cx("block mb-1 text-[10px]", ui.textMuted)}>Max</label>
                    <input type="number" value={param.max} 
                      onChange={(e) => handleParamChange(idx, "max", e.target.value)}
                      className={cx(ui.input, "h-8 text-[12px]")} />
                  </div>
                  <div>
                    <label className={cx("block mb-1 text-[10px]", ui.textMuted)}>Step</label>
                    <input type="number" step="0.1" value={param.step} 
                      onChange={(e) => handleParamChange(idx, "step", e.target.value)}
                      className={cx(ui.input, "h-8 text-[12px]")} />
                  </div>
                </div>
              </div>
            ))}
            </div>
          </div>
        )}
        
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className={ui.btn}>Cancel</button>
          <button onClick={handleAdd} className={ui.btnPrimary}>Add Indicator</button>
        </div>
      </div>
    </div>
  );
});

const EditIndicatorModal = memo(({ indicator, onClose, onSave }) => {
  const [params, setParams] = useState(indicator.params.map(p => ({...p})));
  const [source, setSource] = useState(indicator.source);
  const [displayName, setDisplayName] = useState(
    indicator.displayName || getDefaultDisplayName(indicator.type)
  );
  const [customFormula, setCustomFormula] = useState(indicator.customFormula || "");
  
  const handleParamChange = (index, field, value) => {
    setParams(prev => prev.map((p, i) => i === index ? {...p, [field]: parseFloat(value) || 0} : p));
  };
  
  const handleSave = () => {
    const updatedIndicator = {
      ...indicator, 
      params, 
      source, 
      displayName: displayName.trim()
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
          <h2 className="text-sm font-semibold text-[#f5f5f5]">Edit Indicator: {indicator.name}</h2>
          <button className={cx(ui.btn, "px-2 py-1")} onClick={onClose}>✕</button>
        </div>
        
        <div>
          <label className={cx("block mb-1 text-xs", ui.textMuted)}>Source</label>
          <select value={source} onChange={(e) => setSource(e.target.value)} className={cx(ui.input, "h-9")}>
            {SOURCE_OPTIONS.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
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
            This name will be used in formulas (e.g., {displayName || 'indicator'}_close_14)
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
                  <input type="number" value={param.default} 
                    onChange={(e) => handleParamChange(idx, "default", e.target.value)}
                    className={cx(ui.input, "h-8 text-[12px]")} />
                </div>
                <div>
                  <label className={cx("block mb-1 text-[10px]", ui.textMuted)}>Min</label>
                  <input type="number" value={param.min} 
                    onChange={(e) => handleParamChange(idx, "min", e.target.value)}
                    className={cx(ui.input, "h-8 text-[12px]")} />
                </div>
                <div>
                  <label className={cx("block mb-1 text-[10px]", ui.textMuted)}>Max</label>
                  <input type="number" value={param.max} 
                    onChange={(e) => handleParamChange(idx, "max", e.target.value)}
                    className={cx(ui.input, "h-8 text-[12px]")} />
                </div>
                <div>
                  <label className={cx("block mb-1 text-[10px]", ui.textMuted)}>Step</label>
                  <input type="number" step="0.1" value={param.step} 
                    onChange={(e) => handleParamChange(idx, "step", e.target.value)}
                    className={cx(ui.input, "h-8 text-[12px]")} />
                </div>
              </div>
            </div>
          ))}
          </div>
        )}
        
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className={ui.btn}>Cancel</button>
          <button onClick={handleSave} className={ui.btnPrimary}>Save Changes</button>
        </div>
      </div>
    </div>
  );
});

/* ====================== Collapsible Variable Select ====================== */

const CollapsibleSelect = memo(({ value, onChange, groupedVars }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState(new Set()); // All groups collapsed by default
  const [dropdownPosition, setDropdownPosition] = useState(null);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);
  
  // Calculate dropdown position when opened
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 4,
        left: rect.left,
        width: Math.max(rect.width, 350)
      });
    }
  }, [isOpen]);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);
  
  const toggleGroup = useCallback((groupName) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupName)) {
        next.delete(groupName);
      } else {
        next.add(groupName);
      }
      return next;
    });
  }, []);
  
  const handleSelect = useCallback((varName) => {
    onChange(varName);
    setIsOpen(false);
  }, [onChange]);
  
  return (
    <div ref={dropdownRef} className="relative w-full">
      <div 
        ref={buttonRef}
        className="relative w-full"
      >
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsOpen(true)}
          className={cx(
            ui.input,
            "w-full h-8 text-[11px] pr-8"
          )}
          placeholder="Enter value or select from list"
        />
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="absolute right-1 top-1/2 -translate-y-1/2 px-2 py-1 text-[#8c8c8c] hover:text-[#d9d9d9] transition-colors"
        >
          {isOpen ? '▲' : '▼'}
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
            maxHeight: '400px',
            overflowY: 'auto',
            overflowX: 'hidden'
          }}
        >
          {groupedVars.map(([groupName, vars]) => (
            <div key={groupName}>
              {/* Group Header */}
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
                  {expandedGroups.has(groupName) ? '▼' : '▶'} {groupName}
                </span>
                <span className="text-[#595959] text-[11px]">({vars.length})</span>
              </button>
              
              {/* Group Items */}
              {expandedGroups.has(groupName) && (
                <div>
                  {vars.map(varName => (
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

/* ====================== Table-Based Editor ====================== */

const TableBasedEditor = memo(({ rules, onChange, groupedVars }) => {
  const handleAddRule = useCallback(() => {
    onChange([...rules, {
      id: Date.now(),
      conditions: [{ variable: 'Close', operator: '>', value: 'Close', logic: 'AND' }]
    }]);
  }, [rules, onChange]);
  
  const handleDeleteRule = useCallback((ruleId) => {
    onChange(rules.filter(r => r.id !== ruleId));
  }, [rules, onChange]);
  
  const handleAddCondition = useCallback((ruleId) => {
    onChange(rules.map(rule => 
      rule.id === ruleId 
        ? { ...rule, conditions: [...rule.conditions, { variable: 'Close', operator: '>', value: 'Close', logic: 'AND' }] }
        : rule
    ));
  }, [rules, onChange]);
  
  const handleDeleteCondition = useCallback((ruleId, condIndex) => {
    onChange(rules.map(rule => 
      rule.id === ruleId 
        ? { ...rule, conditions: rule.conditions.filter((_, i) => i !== condIndex) }
        : rule
    ));
  }, [rules, onChange]);
  
  const handleUpdateCondition = useCallback((ruleId, condIndex, field, value) => {
    onChange(rules.map(rule => 
      rule.id === ruleId 
        ? { 
            ...rule, 
            conditions: rule.conditions.map((cond, i) => 
              i === condIndex ? { ...cond, [field]: value } : cond
            ) 
          }
        : rule
    ));
  }, [rules, onChange]);
  
  const handleUpdateAction = useCallback((ruleId, action) => {
    onChange(rules.map(rule => rule.id === ruleId ? { ...rule, action } : rule));
  }, [rules, onChange]);
  
  return (
    <div className="space-y-3">
      {rules.map((rule, ruleIndex) => (
        <div key={rule.id} className={cx(ui.radius, ui.panel, "overflow-hidden")}>
          <div className={cx("flex items-center justify-between px-3 py-2", ui.panelMuted, "border-0 border-b", ui.divider)}>
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
            {/* Conditions */}
            <div className="space-y-2">
              {rule.conditions.map((condition, condIndex) => (
                <div key={condIndex} className="flex items-center gap-2">
                  {/* Column 1: AND/OR Logic (80px) */}
                  <div className="w-20 shrink-0">
                    {condIndex > 0 ? (
                      <select
                        value={condition.logic}
                        onChange={(e) => handleUpdateCondition(rule.id, condIndex, 'logic', e.target.value)}
                        className={cx(ui.input, "w-full h-8 text-[11px]")}
                      >
                        <option value="AND">AND</option>
                        <option value="OR">OR</option>
                      </select>
                    ) : null}
                  </div>
                  
                  {/* Column 2: First Indicator (flex) */}
                  <div className="flex-1 min-w-0">
                    <CollapsibleSelect
                      value={condition.variable}
                      onChange={(newValue) => handleUpdateCondition(rule.id, condIndex, 'variable', newValue)}
                      groupedVars={groupedVars}
                    />
                  </div>
                  
                  {/* Column 3: Operator (80px) */}
                  <div className="w-20 shrink-0">
                    <select
                      value={condition.operator}
                      onChange={(e) => handleUpdateCondition(rule.id, condIndex, 'operator', e.target.value)}
                      className={cx(ui.input, "w-full h-8 text-[11px]")}
                    >
                      <option value=">">{'>'}</option>
                      <option value="<">{'<'}</option>
                      <option value=">=">{'>='}</option>
                      <option value="<=">{'<='}</option>
                      <option value="==">{'=='}</option>
                      <option value="!=">{'!='}</option>
                    </select>
                  </div>
                  
                  {/* Column 4: Second Indicator (flex) */}
                  <div className="flex-1 min-w-0">
                    <CollapsibleSelect
                      value={condition.value}
                      onChange={(newValue) => handleUpdateCondition(rule.id, condIndex, 'value', newValue)}
                      groupedVars={groupedVars}
                    />
                  </div>
                  
                  {/* Column 5: Delete Button (32px) */}
                  <div className="w-8 shrink-0">
                    {rule.conditions.length > 1 && (
                      <button
                        onClick={() => handleDeleteCondition(rule.id, condIndex)}
                        className={cx(ui.btn, "w-full h-8 text-[11px] text-red-400 hover:text-red-300")}
                        title="Delete condition"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Add Condition Button */}
            <button
              onClick={() => handleAddCondition(rule.id)}
              className={cx(ui.btn, "h-7 px-2 text-[10px] w-full")}
            >
              + Add Condition
            </button>
            
            {/* Action */}
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
      
      {/* Add Rule Button */}
      <button
        onClick={handleAddRule}
        className={cx(ui.btn, "h-10 px-4 text-[12px] w-full", ui.radius)}
      >
        + Add New Rule
      </button>
      
      {rules.length === 0 && (
        <div className={cx(ui.panel, ui.radius, "p-8 text-center")}>
          <div className="text-[#595959] text-[12px]">
            No rules defined. Click "Add New Rule" to create your first trading rule.
          </div>
        </div>
      )}
    </div>
  );
});

/* ====================== Formula Editor ====================== */

const FormulaEditor = memo(({ value, onChange, indicators }) => {
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const [editorMode, setEditorMode] = useState('python'); // 'python' | 'table'
  const [tableRules, setTableRules] = useState([]);
  const [pythonCodeManuallyEdited, setPythonCodeManuallyEdited] = useState(false);
  const [generatedPythonCode, setGeneratedPythonCode] = useState('');
  
  // Initialize table rules if empty
  useEffect(() => {
    if (tableRules.length === 0) {
      setTableRules([
        {
          id: Date.now(),
          conditions: [{ variable: 'Close', operator: '>', value: 'Close', logic: 'AND' }]
        }
      ]);
    }
  }, [tableRules.length]);
  
  // Generate available variables from indicators (with ranges)
  const availableVars = useMemo(() => {
    const vars = new Set(["Close", "Open", "High", "Low", "Volume", "BUY", "SELL"]);
    
    indicators.forEach(ind => {
      if (!ind.enabled) return;
      
      const src = ind.source.toLowerCase();
      const displayName = ind.displayName || (ind.type === "RSI" ? "rsi" : ind.type === "EMA" ? "ema" : ind.type === "MACD" ? "macd" : ind.type === "BBANDS" ? "bb" : ind.type === "GC_DW" ? "gc" : ind.type.toLowerCase());
      
      // Add simple indicator variables without parameter details
      if (ind.type === "RSI") {
        vars.add(`${displayName}_${src}`);
      } else if (ind.type === "EMA") {
        vars.add(`${displayName}_${src}`);
      } else if (ind.type === "MACD") {
        vars.add(`${displayName}`);
        vars.add(`${displayName}_signal`);
        vars.add(`${displayName}_hist`);
      } else if (ind.type === "BBANDS") {
        vars.add(`${displayName}_upper`);
        vars.add(`${displayName}_middle`);
        vars.add(`${displayName}_lower`);
        vars.add(`${displayName}_width`);
      } else if (ind.type === "GC_DW") {
        vars.add(`${displayName}_mid`);
        vars.add(`${displayName}_upper`);
        vars.add(`${displayName}_lower`);
      } else if (ind.type === "CUSTOM_FORMULA") {
        // For custom formulas, add a generic variable
        vars.add(`${displayName}`);
      }
    });
    
    return Array.from(vars).sort();
  }, [indicators]);
  
  // Group variables hierarchically for dropdown
  const groupedVars = useMemo(() => {
    const groups = {
      'Price Data': []
    };
    
    // Create groups dynamically based on indicators
    indicators.forEach(ind => {
      if (ind.enabled && ind.displayName) {
        const groupName = ind.displayName.charAt(0).toUpperCase() + ind.displayName.slice(1);
        if (!groups[groupName]) {
          groups[groupName] = [];
        }
      }
    });
    
    // Add a Custom group for any unmatched variables
    groups['Custom'] = [];
    
    availableVars.forEach(varName => {
      if (['Close', 'Open', 'High', 'Low', 'Volume'].includes(varName)) {
        groups['Price Data'].push(varName);
      } else {
        // Find which indicator this variable belongs to
        let found = false;
        for (const ind of indicators) {
          if (ind.enabled && ind.displayName) {
            // Check if variable matches exactly or starts with displayName_
            const matches = varName === ind.displayName || varName.startsWith(ind.displayName + '_');
            if (matches) {
              const groupName = ind.displayName.charAt(0).toUpperCase() + ind.displayName.slice(1);
              if (!groups[groupName]) {
                groups[groupName] = [];
              }
              groups[groupName].push(varName);
              found = true;
              break;
            }
          }
        }
        if (!found) {
          groups['Custom'].push(varName);
        }
      }
    });
    
    // Remove empty groups
    return Object.entries(groups).filter(([_, vars]) => vars.length > 0);
  }, [availableVars, indicators]);
  
  // Configure Monaco Editor
  const handleEditorWillMount = useCallback((monaco) => {
    monacoRef.current = monaco;
    
    // Register custom language for trading formulas
    monaco.languages.register({ id: 'tradingFormula' });
    
    // Define syntax highlighting
    monaco.languages.setMonarchTokensProvider('tradingFormula', {
      keywords: ['IF', 'THEN', 'ELIF', 'ELSE', 'END', 'AND', 'OR', 'NOT', 'BUY', 'SELL', 'TRUE', 'FALSE'],
      operators: ['>', '<', '>=', '<=', '==', '!=', '=', '+', '-', '*', '/', '%'],
      
      tokenizer: {
        root: [
          [/#.*$/, 'comment'],
          [/\b(?:IF|THEN|ELIF|ELSE|END|AND|OR|NOT)\b/, 'keyword'],
          [/\b(?:BUY|SELL)\b/, 'keyword.control'],
          [/\b(?:TRUE|FALSE)\b/, 'constant.language'],
          [/\b\d+\.?\d*\b/, 'number'],
          [/[<>=!]+/, 'operator'],
          [/[+\-*/%]/, 'operator'],
          [/[()]/, 'delimiter.parenthesis'],
        ]
      }
    });
    
    // Define theme
    monaco.editor.defineTheme('tradingDark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6A9955', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'C586C0' },
        { token: 'keyword.control', foreground: '10B981', fontStyle: 'bold' },
        { token: 'constant.language', foreground: '569CD6' },
        { token: 'number', foreground: 'B5CEA8' },
        { token: 'operator', foreground: 'D4D4D4' },
      ],
      colors: {
        'editor.background': '#0f0f0f',
        'editor.foreground': '#d9d9d9',
        'editorLineNumber.foreground': '#595959',
        'editor.lineHighlightBackground': '#1f1f1f',
        'editor.selectionBackground': '#264f78',
        'editorCursor.foreground': '#10B981',
      }
    });
    
    // Register completion provider for autocomplete
    monaco.languages.registerCompletionItemProvider('tradingFormula', {
      provideCompletionItems: (model, position) => {
        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn
        };
        
        const suggestions = [
          // Keywords
          ...['IF', 'THEN', 'ELIF', 'ELSE', 'END', 'AND', 'OR', 'NOT'].map(keyword => ({
            label: keyword,
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: keyword,
            range: range,
            documentation: `Keyword: ${keyword}`
          })),
          
          // Actions
          ...['BUY', 'SELL'].map(action => ({
            label: action,
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: `${action} = True`,
            range: range,
            documentation: `Action: ${action}`
          })),
          
          // Variables from indicators
          ...availableVars.map(varName => ({
            label: varName,
            kind: monaco.languages.CompletionItemKind.Variable,
            insertText: varName,
            range: range,
            documentation: `Variable: ${varName}`
          })),
          
          // Operators
          ...['>', '<', '>=', '<=', '==', '!='].map(op => ({
            label: op,
            kind: monaco.languages.CompletionItemKind.Operator,
            insertText: op,
            range: range,
            documentation: `Operator: ${op}`
          })),
          
          // Snippets
          {
            label: 'if-then',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: 'IF ${1:condition} THEN\n  ${2:action}\nEND',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range: range,
            documentation: 'IF-THEN statement'
          }
        ];
        
        return { suggestions };
      }
    });
  }, [availableVars]);
  
  const handleEditorDidMount = useCallback((editor, monaco) => {
    editorRef.current = editor;
    
    // Configure editor options
    editor.updateOptions({
      fontSize: 13,
      lineHeight: 20,
      fontFamily: 'Monaco, Menlo, "Courier New", monospace',
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      renderLineHighlight: 'all',
      renderWhitespace: 'none',
      automaticLayout: true,
    });
    
    // Set dark theme for Python editor
    monaco.editor.setTheme('vs-dark');
  }, []);
  
  // Convert code to table rules
  const parseCodeToRules = useCallback((code) => {
    const rules = [];
    const lines = (code || '').split('\n').filter(l => l.trim() && !l.trim().startsWith('#'));
    
    let currentConditions = [];
    let currentAction = null;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line.startsWith('IF ')) {
        // Parse condition
        const condPart = line.replace('IF ', '').replace(' THEN', '').trim();
        const conditions = parseConditions(condPart);
        currentConditions = conditions;
        
        // Check if action is on the same line
        if (line.includes('THEN') && i + 1 < lines.length) {
          const nextLine = lines[i + 1].trim();
          if (nextLine.includes('BUY') || nextLine.includes('SELL')) {
            currentAction = nextLine.includes('BUY') ? 'BUY' : 'SELL';
            rules.push({
              id: Date.now() + rules.length,
              conditions: currentConditions,
              action: currentAction
            });
            currentConditions = [];
            currentAction = null;
          }
        }
      } else if (line.includes('BUY') || line.includes('SELL')) {
        currentAction = line.includes('BUY') ? 'BUY' : 'SELL';
        if (currentConditions.length > 0) {
          rules.push({
            id: Date.now() + rules.length,
            conditions: currentConditions,
            action: currentAction
          });
          currentConditions = [];
          currentAction = null;
        }
      }
    }
    
    return rules;
  }, []);
  
  // Parse conditions string
  const parseConditions = (condStr) => {
    const conditions = [];
    const parts = condStr.split(/\s+(AND|OR)\s+/);
    
    for (let i = 0; i < parts.length; i += 2) {
      const part = parts[i].trim().replace(/[()]/g, '');
      const logic = i > 0 ? parts[i - 1] : 'AND';
      
      // Parse condition: variable operator value
      const match = part.match(/(\S+)\s*([><=!]+)\s*(.+)/);
      if (match) {
        conditions.push({
          variable: match[1],
          operator: match[2],
          value: match[3],
          logic: logic
        });
      }
    }
    
    return conditions;
  };
  
  // Convert table rules to code (legacy IF-THEN format)
  const convertRulesToCode = useCallback((rules) => {
    if (!rules || rules.length === 0) {
      return '# Define your trading signals\n';
    }
    
    let code = '# Trading signals\n\n';
    
    rules.forEach((rule, index) => {
      // Build conditions
      const conditionsStr = rule.conditions.map((cond, i) => {
        const prefix = i > 0 ? ` ${cond.logic} ` : '';
        return `${prefix}${cond.variable} ${cond.operator} ${cond.value}`;
      }).join('');
      
      code += `# Rule ${index + 1}\n`;
      code += `IF ${conditionsStr} THEN\n`;
      code += `  ${rule.action} = True\n`;
      code += `END\n\n`;
    });
    
    return code;
  }, []);
  
  // Generate Python code for Freqtrade from table rules
  const generatePythonSignalCode = useCallback((rules) => {
    if (!rules || rules.length === 0) {
      return `def populate_entry_trend(self, dataframe: pd.DataFrame, metadata: dict) -> pd.DataFrame:
    """
    Populate entry trend signals.
    Add your signal conditions here.
    """
    # Initialize signal column
    dataframe.loc[:, 'signal'] = False
    
    return dataframe
`;
    }
    
    let code = `def populate_entry_trend(self, dataframe: pd.DataFrame, metadata: dict) -> pd.DataFrame:
    """
    Populate entry trend signals.
    Based on the following conditions:
`;
    
    // Add rule descriptions
    rules.forEach((rule, index) => {
      const conditionsDesc = rule.conditions.map((cond, i) => {
        const prefix = i > 0 ? ` ${cond.logic} ` : '';
        return `${prefix}${cond.variable} ${cond.operator} ${cond.value}`;
      }).join('');
      code += `    - Rule ${index + 1}: ${conditionsDesc}\n`;
    });
    
    code += `    """
    # Initialize signal column
    dataframe.loc[:, 'signal'] = False
    
`;
    
    // Generate conditions for each rule
    rules.forEach((rule, index) => {
      code += `    # Rule ${index + 1}\n`;
      
      // Build Python condition expression with each condition on a new line
      if (rule.conditions.length === 1) {
        // Single condition - keep it on one line
        const cond = rule.conditions[0];
        
        // Handle value - could be a number or another dataframe column
        let valueExpr;
        const valueStr = String(cond.value).trim();
        
        // Check if it's a dataframe column (starts with indicator prefix or is a price column)
        if (['Close', 'Open', 'High', 'Low', 'Volume'].includes(valueStr) || 
            valueStr.startsWith('ema_') || valueStr.startsWith('rsi_') || 
            valueStr.startsWith('macd_') || valueStr.startsWith('bb_') || 
            valueStr.startsWith('gc_') || valueStr.startsWith('custom_')) {
          // It's a dataframe column
          valueExpr = `dataframe['${valueStr}']`;
        } else {
          // Check if it's a numeric value
          const numValue = parseFloat(valueStr);
          if (!isNaN(numValue) && isFinite(numValue)) {
            // It's a numeric value
            valueExpr = numValue.toString();
          } else {
            // It's a string value (shouldn't happen in normal flow, but handle it)
            valueExpr = `'${valueStr}'`;
          }
        }
        
        // Handle operator conversion
        let operator = cond.operator;
        if (operator === '=') operator = '==';
        
        code += `    condition${index + 1} = (dataframe['${cond.variable}'] ${operator} ${valueExpr})\n`;
      } else {
        // Multiple conditions - each on a new line
        code += `    condition${index + 1} = (\n`;
        
        rule.conditions.forEach((cond, i) => {
          const logicOp = cond.logic === 'OR' ? '|' : '&';
          
          // Handle value - could be a number or another dataframe column
          let valueExpr;
          const valueStr = String(cond.value).trim();
          
          // Check if it's a dataframe column (starts with indicator prefix or is a price column)
          if (['Close', 'Open', 'High', 'Low', 'Volume'].includes(valueStr) || 
              valueStr.startsWith('ema_') || valueStr.startsWith('rsi_') || 
              valueStr.startsWith('macd_') || valueStr.startsWith('bb_') || 
              valueStr.startsWith('gc_') || valueStr.startsWith('custom_')) {
            // It's a dataframe column
            valueExpr = `dataframe['${valueStr}']`;
          } else {
            // Check if it's a numeric value
            const numValue = parseFloat(valueStr);
            if (!isNaN(numValue) && isFinite(numValue)) {
              // It's a numeric value
              valueExpr = numValue.toString();
            } else {
              // It's a string value (shouldn't happen in normal flow, but handle it)
              valueExpr = `'${valueStr}'`;
            }
          }
          
          // Handle operator conversion
          let operator = cond.operator;
          if (operator === '=') operator = '==';
          
          if (i === 0) {
            // First condition
            code += `        (dataframe['${cond.variable}'] ${operator} ${valueExpr})`;
          } else {
            // Subsequent conditions with logic operator
            code += ` ${logicOp}\n        (dataframe['${cond.variable}'] ${operator} ${valueExpr})`;
          }
        });
        
        code += `\n    )\n`;
      }
      
      code += `    dataframe.loc[condition${index + 1}, 'signal'] = True\n\n`;
    });
    
    code += `    return dataframe
`;
    
    return code;
  }, []);
  
  // Generate Python code when table rules change
  useEffect(() => {
    if (tableRules.length > 0) {
      const pythonCode = generatePythonSignalCode(tableRules);
      setGeneratedPythonCode(pythonCode);
      if (!pythonCodeManuallyEdited) {
        onChange(pythonCode);
      }
    }
  }, [tableRules, generatePythonSignalCode, pythonCodeManuallyEdited, onChange]);
  
  // Handle mode switch
  const handleModeSwitch = useCallback((newMode) => {
    if (newMode === 'table' && editorMode === 'python') {
      // Switching from Python to Table - keep table rules as is
      // (no conversion needed, table rules are source of truth)
    } else if (newMode === 'python' && editorMode === 'table') {
      // Switching from Table to Python - generate Python code from table rules
      const pythonCode = generatePythonSignalCode(tableRules);
      setGeneratedPythonCode(pythonCode);
      setPythonCodeManuallyEdited(false);
      onChange(pythonCode);
    }
    setEditorMode(newMode);
  }, [editorMode, tableRules, generatePythonSignalCode, onChange]);
  
  // Handle table rules update
  const handleTableRulesChange = useCallback((newRules) => {
    setTableRules(newRules);
    // Python code will be regenerated via useEffect
  }, []);
  
  // Handle Python code manual edit
  const handlePythonCodeChange = useCallback((newCode) => {
    setPythonCodeManuallyEdited(true);
    onChange(newCode);
  }, [onChange]);
  
  // Reset to generated Python code
  const handleResetPythonCode = useCallback(() => {
    setPythonCodeManuallyEdited(false);
    onChange(generatedPythonCode);
  }, [generatedPythonCode, onChange]);
  
  return (
    <div className={cx(ui.radius, ui.panel, "overflow-hidden")}>
      <div className={cx("flex items-center justify-between px-3 py-2", ui.panelMuted, "border-0 border-b", ui.divider)}>
        <div className="flex-1">
          <div className="text-[12px] font-medium text-[#d9d9d9]">Signal Formulas</div>
          <div className={cx("text-[10px]", ui.textMuted)}>
            {editorMode === 'python' ? (
              <>Python code for Freqtrade • {tableRules.length} rules defined • {pythonCodeManuallyEdited ? '⚠️ Manually edited' : 'Auto-generated'}</>
            ) : (
              <>Visual rule builder • {tableRules.length} rules defined</>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Mode Switcher */}
          <div className="flex border border-[#303030] rounded overflow-hidden">
            <button
              onClick={() => handleModeSwitch('python')}
              className={cx(
                "h-7 px-3 text-[10px] transition-colors",
                editorMode === 'python' 
                  ? "bg-emerald-500/20 text-emerald-300 font-medium" 
                  : "bg-[#1a1a1a] text-[#8c8c8c] hover:text-[#d9d9d9]"
              )}
              title="Python Code Editor"
            >
              🐍 Python
            </button>
            <button
              onClick={() => handleModeSwitch('table')}
              className={cx(
                "h-7 px-3 text-[10px] transition-colors border-l border-[#303030] inline-flex items-center gap-1.5",
                editorMode === 'table' 
                  ? "bg-emerald-500/20 text-emerald-300 font-medium" 
                  : "bg-[#1a1a1a] text-[#8c8c8c] hover:text-[#d9d9d9]"
              )}
              title="Builder"
            >
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
              </svg>
              Builder
            </button>
          </div>
          
          {editorMode === 'python' && (
            <>
              {pythonCodeManuallyEdited && (
                <button 
                  onClick={handleResetPythonCode}
                  className={cx(ui.btn, "h-7 px-2 text-[10px] bg-amber-500/20 text-amber-300 hover:bg-amber-500/30")}
                  title="Reset to auto-generated code"
                >
                  Reset
                </button>
              )}
            </>
          )}
        </div>
      </div>
      
      {editorMode === 'python' ? (
        <>
          {pythonCodeManuallyEdited && (
            <div className={cx("mx-3 mt-3 p-2 rounded border border-amber-500/30 bg-amber-500/10 text-[11px]", ui.textMuted)}>
              ⚠️ <strong>Warning:</strong> This code has been manually edited. Changes made in Table mode will overwrite your manual edits. 
              Click <button onClick={handleResetPythonCode} className="text-amber-300 underline hover:text-amber-200">Reset</button> to restore auto-generated code.
            </div>
          )}
          <div className="relative" style={{ height: '400px' }}>
            <Editor
              height="400px"
              defaultLanguage="python"
              language="python"
              theme="vs-dark"
              value={value}
              onChange={(newValue) => handlePythonCodeChange(newValue || '')}
              onMount={handleEditorDidMount}
              options={{
                fontSize: 13,
                lineHeight: 20,
                fontFamily: 'Monaco, Menlo, "Courier New", monospace',
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                renderLineHighlight: 'all',
                renderWhitespace: 'none',
                automaticLayout: true,
                wordWrap: 'on',
                lineNumbers: 'on',
                glyphMargin: false,
                folding: true,
                lineDecorationsWidth: 0,
                lineNumbersMinChars: 3,
                renderValidationDecorations: 'on',
                tabSize: 4,
                insertSpaces: true,
              }}
            />
          </div>
          
          <div className={cx("px-3 py-2 border-0 border-t", ui.divider, "flex justify-end")}>
            <button type="button" className={cx(ui.btnPrimary, "h-8 px-3 text-[11px]")}>
              Validate
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="p-3" style={{ maxHeight: '600px', overflowY: 'auto' }}>
            <TableBasedEditor 
              rules={tableRules}
              onChange={handleTableRulesChange}
              groupedVars={groupedVars}
            />
          </div>
          
          <div className={cx("px-3 py-2 text-[10px]", ui.textMuted, "border-0 border-t", ui.divider)}>
            💡 <strong>Tips:</strong> Click "Add New Rule" to create trading conditions • 
            Combine multiple conditions with <code className="text-amber-300">AND</code>/<code className="text-amber-300">OR</code> • 
            Switch to Code mode to see generated formula
          </div>
        </>
      )}
    </div>
  );
});

/* ====================== HeatMap Configuration (imported from components/heatmap) ====================== */

const BuilderStepper = memo(function BuilderStepper({
  activeStage,
  pairs,
  onPairsChange,
  timeRange,
  onTimeRangeChange,
  timeFrameStart,
  onTimeFrameStartChange,
  timeFrameEnd,
  onTimeFrameEndChange,
}) {
  // Indicators state
  const [indicators, setIndicators] = useState([]);
  const [editingIndicator, setEditingIndicator] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addModalType, setAddModalType] = useState("RSI");
  const [libraryQuery, setLibraryQuery] = useState("");
  const [libraryGroup, setLibraryGroup] = useState("All");
  const [selectedTab, setSelectedTab] = useState("list"); // list or code

  // Total combinations from indicator params (product of param value counts per enabled indicator)
  const totalCombinations = useMemo(() => {
    if (indicators.length === 0) return 0;
    return indicators.reduce((product, ind) => {
      if (!ind.enabled || !Array.isArray(ind.params)) return product;
      const perIndicator = ind.params.reduce((p, param) => p * getParamValuesFromDef(param).length, 1);
      return product * Math.max(1, perIndicator);
    }, 1);
  }, [indicators]);
  
  // Hyperoptimization progress
  const [isRunningOptimization, setIsRunningOptimization] = useState(false);
  const [optimizationProgress, setOptimizationProgress] = useState(0);
  // Technical params (Market / Technical blocks)
  const [tEndTrunc, setTEndTrunc] = useState("");
  const [foldSize, setFoldSize] = useState("12");
  const [maxPossibleStd, setMaxPossibleStd] = useState("");
  const [unknowTimeRangeStart, setUnknowTimeRangeStart] = useState("");
  const [unknowTimeRangeEnd, setUnknowTimeRangeEnd] = useState("");
  const [hyperoptType, setHyperoptType] = useState("BIAS");
  
  // Normalization formulas: Intermediate + Final (tables shown after dropdown selection)
  const [intermediateScoreFormula, setIntermediateScoreFormula] = useState("Formula 1");
  const [finalScoreFormula, setFinalScoreFormula] = useState("Formula 1");
  const setWeightCapped = useCallback((setter, value, othersSum) => {
    const n = Math.max(0, Math.min(100, Number(value)));
    setter(Math.min(n, 100 - othersSum));
  }, []);
  const DEFAULT_FORMULA_CODE = "1 / (1 + exp( -k * ( (MFE - median(MFE)) / median(|MFE - median(MFE)|) ) ))";
  const DEFAULT_FINAL_SCORE_FORMULA = "weightMFE * normMFE - weightMAE * normMAE + weightAIR * normAIR + weightHitRate * normHitRate";
  const DEFAULT_STABILITY_FORMULA = "1/(1+EXP(-1*(Stability - MEDIAN(Stability)) / (QUARTILE.INC(Stability,3) - QUARTILE.INC(Stability,1))))";
  const DEFAULT_MFE_FORMULA = "1/(1+EXP(-1*(MFE - MEDIAN(MFE)) / (QUARTILE.INC(MFE,3) - QUARTILE.INC(MFE,1))))";
  const DEFAULT_MAE_FORMULA = "1/(1+EXP(1*(MAE - MEDIAN(MAE)) / (QUARTILE.INC(MAE,3) - QUARTILE.INC(MAE,1))))";
  const DEFAULT_AIR_FORMULA = "1/(1+EXP(-1*(AIR - MEDIAN(AIR)) / (QUARTILE.INC(AIR,3) - QUARTILE.INC(AIR,1))))";
  const DEFAULT_HITRATE_FORMULA = "1/(1+EXP(-1*(HitRate - MEDIAN(HitRate)) / (QUARTILE.INC(HitRate,3) - QUARTILE.INC(HitRate,1))))";
  const FORMULA_VARIABLES = ["median", "MFE", "MAE", "AIR", "exp", "k"];
  // Intermediate metrics table (after user selects Normalization global formula)
  const [intMfeFormula, setIntMfeFormula] = useState("Formula 1");
  const [intMaeFormula, setIntMaeFormula] = useState("Formula 1");
  const [intAirFormula, setIntAirFormula] = useState("Formula 1");
  const [intHitRateFormula, setIntHitRateFormula] = useState("Formula 1");
  const [intMfeFormulaCode, setIntMfeFormulaCode] = useState(DEFAULT_FORMULA_CODE);
  const [intMaeFormulaCode, setIntMaeFormulaCode] = useState(DEFAULT_FORMULA_CODE);
  const [intAirFormulaCode, setIntAirFormulaCode] = useState(DEFAULT_FORMULA_CODE);
  const [intHitRateFormulaCode, setIntHitRateFormulaCode] = useState(DEFAULT_FORMULA_CODE);
  const [intMfeWeight, setIntMfeWeight] = useState(0);
  const [intMaeWeight, setIntMaeWeight] = useState(0);
  const [intAirWeight, setIntAirWeight] = useState(0);
  const [intHitRateWeight, setIntHitRateWeight] = useState(0);
  const intWeightsSum = intMfeWeight + intMaeWeight + intAirWeight + intHitRateWeight;
  // Final metrics table (after user selects Final Score Formula): 5 rows, Stability row has 4 sub-weights
  const [finStabilityFormula, setFinStabilityFormula] = useState("Formula 1");
  const [finMfeFormula, setFinMfeFormula] = useState("Formula 1");
  const [finMaeFormula, setFinMaeFormula] = useState("Formula 1");
  const [finAirFormula, setFinAirFormula] = useState("Formula 1");
  const [finHitRateFormula, setFinHitRateFormula] = useState("Formula 1");
  const [finFinalFormulaCode, setFinFinalFormulaCode] = useState(DEFAULT_FINAL_SCORE_FORMULA);
  const [finStabilityFormulaCode, setFinStabilityFormulaCode] = useState(DEFAULT_STABILITY_FORMULA);
  const [finMfeFormulaCode, setFinMfeFormulaCode] = useState(DEFAULT_MFE_FORMULA);
  const [finMaeFormulaCode, setFinMaeFormulaCode] = useState(DEFAULT_MAE_FORMULA);
  const [finAirFormulaCode, setFinAirFormulaCode] = useState(DEFAULT_AIR_FORMULA);
  const [finHitRateFormulaCode, setFinHitRateFormulaCode] = useState(DEFAULT_HITRATE_FORMULA);
  const [finStabMfeWeight, setFinStabMfeWeight] = useState(0);
  const [finStabMaeWeight, setFinStabMaeWeight] = useState(0);
  const [finStabAirWeight, setFinStabAirWeight] = useState(0);
  const [finStabHitRateWeight, setFinStabHitRateWeight] = useState(0);
  const [finStabilityWeight, setFinStabilityWeight] = useState(0);
  const [finMfeWeight, setFinMfeWeight] = useState(0);
  const [finMaeWeight, setFinMaeWeight] = useState(0);
  const [finAirWeight, setFinAirWeight] = useState(0);
  const [finHitRateWeight, setFinHitRateWeight] = useState(0);
  const finStabWeightsSum = finStabMfeWeight + finStabMaeWeight + finStabAirWeight + finStabHitRateWeight;
  const finWeightsSum = finStabilityWeight + finMfeWeight + finMaeWeight + finAirWeight + finHitRateWeight;

  // Formula Editor helpers (for Score formula)
  const FORMULA_EDITOR_VARIABLES = [
    "MFE",
    "MAE",
    "AIR",
    "HitRate",
    "Stability",
    "weightMFE",
    "normMFE",
    "weightMAE",
    "normMAE",
    "weightAIR",
    "normAIR",
    "weightHitRate",
    "normHitRate",
  ];
  const FORMULA_EDITOR_FUNCTIONS = [
    { label: "IF", template: "IF(cond; a; b)" },
    { label: "IFS", template: "IFS(c1; v1; c2; v2; default)" },
    { label: "AND", template: "AND(a; b; c)" },
    { label: "OR", template: "OR(a; b)" },
    { label: "NOT", template: "NOT(a)" },
    { label: "IFERROR", template: "IFERROR(expr; fallback)" },
    { label: "ABS", template: "ABS(x)" },
    { label: "MIN", template: "MIN(a; b; c)" },
    { label: "MAX", template: "MAX(a; b; c)" },
    { label: "ROUND", template: "ROUND(x; digits)" },
  ];
  const FORMULA_EDITOR_OPERATORS = [
    "+",
    "-",
    "*",
    "/",
    "^",
    "=",
    "<>",
    "<",
    "<=",
    ">",
    ">=",
  ];

  const [showFormulaEditor, setShowFormulaEditor] = useState(false);
  const [formulaEditorValue, setFormulaEditorValue] = useState("");
  const formulaEditorRef = useRef(null);
  const formulaEditorMirrorRef = useRef(null);
  const [formulaEditorSelection, setFormulaEditorSelection] = useState({ start: 0, end: 0 });

  const formulaEditorVariableRegex = useMemo(
    () => new RegExp("\\b(" + [...FORMULA_EDITOR_VARIABLES].sort((a, b) => b.length - a.length).join("|") + ")\\b", "g"),
    [],
  );
  const renderFormulaEditorWithVariables = useCallback(
    (text) => {
      if (!text) return null;
      const parts = text.split(formulaEditorVariableRegex);
      return parts.map((part, i) =>
        FORMULA_EDITOR_VARIABLES.includes(part) ? (
          <span key={i} className="rounded bg-emerald-500/25 px-0.5 text-emerald-400">
            {part}
          </span>
        ) : (
          part
        ),
      );
    },
    [formulaEditorVariableRegex],
  );
  const [formulaEditorApplyFn, setFormulaEditorApplyFn] = useState(null);

  const openFormulaEditor = useCallback((initialValue, applyFn) => {
    setFormulaEditorValue(initialValue || "");
    setFormulaEditorApplyFn(() => applyFn);
    setShowFormulaEditor(true);
  }, []);

  const handleFormulaEditorChange = useCallback((e) => {
    const { value, selectionStart, selectionEnd } = e.target;
    setFormulaEditorValue(value);
    setFormulaEditorSelection({
      start: selectionStart ?? value.length,
      end: selectionEnd ?? selectionStart ?? value.length,
    });
  }, []);

  const handleFormulaEditorSelect = useCallback((e) => {
    const { selectionStart, selectionEnd } = e.target;
    setFormulaEditorSelection({
      start: selectionStart ?? 0,
      end: selectionEnd ?? selectionStart ?? 0,
    });
  }, []);

  const insertIntoFormulaEditor = useCallback(
    (snippet) => {
      setFormulaEditorValue((prev) => {
        const textarea = formulaEditorRef.current;
        const start = textarea?.selectionStart ?? formulaEditorSelection.start ?? prev.length;
        const end = textarea?.selectionEnd ?? formulaEditorSelection.end ?? start;
        const before = prev.slice(0, start);
        const after = prev.slice(end);
        const next = `${before}${snippet}${after}`;
        const newPos = start + snippet.length;

        queueMicrotask(() => {
          const el = formulaEditorRef.current;
          if (el) {
            el.focus();
            el.selectionStart = newPos;
            el.selectionEnd = newPos;
          }
          setFormulaEditorSelection({ start: newPos, end: newPos });
        });

        return next;
      });
    },
    [formulaEditorSelection.start, formulaEditorSelection.end],
  );

  const handleFormulaEditorApply = useCallback(() => {
    if (typeof formulaEditorApplyFn === "function") {
      formulaEditorApplyFn(formulaEditorValue);
    }
    setShowFormulaEditor(false);
  }, [formulaEditorApplyFn, formulaEditorValue]);

  const handleFormulaEditorCancel = useCallback(() => {
    setShowFormulaEditor(false);
  }, []);

  const handleFormulaEditorClear = useCallback(() => {
    setFormulaEditorValue("");
    setFormulaEditorSelection({ start: 0, end: 0 });
    const el = formulaEditorRef.current;
    if (el) {
      el.focus();
      el.selectionStart = 0;
      el.selectionEnd = 0;
    }
  }, []);

  // Formula state (unified)
  const [signalFormula, setSignalFormula] = useState(`# Define your trading signals
# Example:
IF RSI < 30 AND Close > EMA THEN BUY
IF RSI > 70 OR Close < EMA THEN SELL

# You can use:
# - Indicators: RSI, EMA, MACD, BB, CG_DW
# - Price data: Close, Open, High, Low, Volume
# - Operators: <, >, <=, >=, ==, !=
# - Logic: AND, OR, NOT
# - Actions: BUY, SELL`);
  
  // HeatMap state
  const [showHeatMapConfig, setShowHeatMapConfig] = useState(false);
  const [heatMapConfigModalId, setHeatMapConfigModalId] = useState(null);
  const [heatMapViewModalId, setHeatMapViewModalId] = useState(null);
  const [generatedHeatMap, setGeneratedHeatMap] = useState(null);
  const [showTruncateModal, setShowTruncateModal] = useState(false);
  const [selectedNormalizationRow, setSelectedNormalizationRow] = useState(null);
  const [truncateForm, setTruncateForm] = useState({
    tEndTrunc: "",
    foldSize: "12",
  });
  const [normalizationDetailsExpanded, setNormalizationDetailsExpanded] = useState(() => new Set());
  const toggleNormalizationDetails = useCallback((id) => {
    setNormalizationDetailsExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);
  
  // Report Modal state
  const [showReportModal, setShowReportModal] = useState(false);
  // Hyperopt Results: Run normalization modal (same content as Normalization formulas block)
  const [showNormalizationModal, setShowNormalizationModal] = useState(false);
  const [showHyperoptDetailsModal, setShowHyperoptDetailsModal] = useState(false);
  // Hyperopt Results: which level-1 rows are expanded (collapse/expand)
  const [hyperoptResultsExpanded, setHyperoptResultsExpanded] = useState(() => new Set(["hr1", "hr2"]));
  const toggleHyperoptRow = useCallback((id) => {
    setHyperoptResultsExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);
  // Level 3 (HeatMaps & Reports) expanded per level-2 row id
  const [hyperoptLevel3Expanded, setHyperoptLevel3Expanded] = useState(() => new Set(["hr1-1", "hr1-2"]));
  const toggleHyperoptLevel3 = useCallback((id) => {
    setHyperoptLevel3Expanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);
  // Hyperopt Results three-level table data (level 1: runs; level 2: normalization results; level 3: HeatMaps & Reports)
  const [hyperoptResultsRows, setHyperoptResultsRows] = useState(() => [
    { id: "hr1", date: "2024-01-15", pairs: "BTC/USDT", timeFrame: "1h", knowRange: "2020-01-01 – 2023-06-01", unknowRange: "2023-06-01 – 2023-12-31", children: [
      { id: "hr1-1", date: "2024-01-15", minScore: "0.20", avgScore: "0.55", maxScore: "0.89", foldSize: "24", truncScores: { min: "-0.14", avg: "-0.45", max: "0.84" }, heatmapsAndReports: [
        { id: "hr1-1-h1", date: "2024-01-15", type: "Heatmap" },
        { id: "hr1-1-r1", date: "2024-01-15", type: "Report" },
      ]},
      { id: "hr1-2", date: "2024-01-16", minScore: "0.18", avgScore: "0.52", maxScore: "0.87", heatmapsAndReports: [
        { id: "hr1-2-h1", date: "2024-01-16", type: "Heatmap" },
      ]},
    ]},
    { id: "hr2", date: "2024-01-14", pairs: "ETH/USDT", timeFrame: "4h", knowRange: "2021-01-01 – 2023-09-01", unknowRange: "2023-09-01 – 2024-01-01", children: [
      { id: "hr2-1", date: "2024-01-14", minScore: "0.22", avgScore: "0.58", maxScore: "0.91", heatmapsAndReports: [
        { id: "hr2-1-h1", date: "2024-01-14", type: "Heatmap" },
        { id: "hr2-1-r1", date: "2024-01-14", type: "Report" },
      ]},
    ]},
  ]);
  
  // Collapsed sections in Strategy Builder (1–5)
  const [collapsedSections, setCollapsedSections] = useState(() => new Set());
  const toggleSection = useCallback((num) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(num)) next.delete(num);
      else next.add(num);
      return next;
    });
  }, []);
  // Collapsed subsections inside Normalization formulas (intermediate / final)
  const [collapsedNormSections, setCollapsedNormSections] = useState(() => new Set());
  const toggleNormSection = useCallback((key) => {
    setCollapsedNormSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const formulaDisplayVariableRegex = useMemo(
    () => new RegExp("\\b(" + [...FORMULA_EDITOR_VARIABLES].sort((a, b) => b.length - a.length).join("|") + ")\\b", "g"),
    [],
  );
  const renderFormulaWithVariables = useCallback(
    (code) => {
      if (!code) return null;
      const parts = code.split(formulaDisplayVariableRegex);
      return parts.map((part, i) =>
        FORMULA_EDITOR_VARIABLES.includes(part) ? (
          <span key={i} className="rounded bg-emerald-500/25 px-0.5 text-emerald-400">
            {part}
          </span>
        ) : (
          part
        )
      );
    },
    [formulaDisplayVariableRegex],
  );

  const handleAddIndicatorFromLibrary = useCallback((indicatorKey) => {
    setAddModalType(indicatorKey);
    setShowAddModal(true);
  }, []);
  
  const handleAddIndicator = useCallback((indicator) => {
    setIndicators(prev => [...prev, { ...indicator, id: Date.now() + Math.random(), enabled: true }]);
    setShowAddModal(false);
  }, []);
  
  const handleEditIndicator = useCallback((updated) => {
    setIndicators(prev => prev.map(ind => ind.id === updated.id ? updated : ind));
  }, []);
  
  const handleDeleteIndicator = useCallback((id) => {
    if (confirm("Delete this indicator?")) {
      setIndicators(prev => prev.filter(ind => ind.id !== id));
      if (editingIndicator?.id === id) setEditingIndicator(null);
    }
  }, [editingIndicator]);
  
  const handleMoveIndicator = useCallback((id, direction) => {
    setIndicators(prev => {
      const idx = prev.findIndex(ind => ind.id === id);
      if (idx === -1) return prev;
      
      const newIdx = direction === "up" ? idx - 1 : idx + 1;
      if (newIdx < 0 || newIdx >= prev.length) return prev;
      
      const next = [...prev];
      [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
      return next;
    });
  }, []);
  
  const handleToggleIndicator = useCallback((id, enabled) => {
    setIndicators(prev => prev.map(ind => ind.id === id ? {...ind, enabled} : ind));
  }, []);
  
  const handleGenerateHeatMap = useCallback((config, runId) => {
    if (!config || runId == null) return;
    try {
      const fullResults = generateMockResults(config, runId);
      setGeneratedHeatMap({
        runId,
        config,
        fullResults,
        zoomStack: [],
      });
      setShowHeatMapConfig(null);
      setHeatMapConfigModalId(null);
    } catch (err) {
      console.error("HeatMap generation failed:", err);
      alert("HeatMap generation failed. Check console for details.");
    }
  }, []);

  const handleHeatMapCellClick = useCallback((cell, runId) => {
    setGeneratedHeatMap((prev) => {
      if (!prev || prev.runId !== runId || !prev.config) return prev;
      if (!cell.count || !cell.zoomRanges || !Object.keys(cell.zoomRanges).length) return prev;
      const label = `Zoom: cell (${cell.xi + 1}, ${cell.yi + 1}) • n=${cell.count}`;
      return {
        ...prev,
        zoomStack: [...prev.zoomStack, { label, zoomRanges: cell.zoomRanges }],
      };
    });
  }, []);

  const handleHeatMapZoomOut = useCallback((runId) => {
    setGeneratedHeatMap((prev) => {
      if (!prev || prev.runId !== runId || prev.zoomStack.length === 0) return prev;
      return { ...prev, zoomStack: prev.zoomStack.slice(0, -1) };
    });
  }, []);

  const handleHeatMapResetZoom = useCallback((runId) => {
    setGeneratedHeatMap((prev) => {
      if (!prev || prev.runId !== runId) return prev;
      return { ...prev, zoomStack: [] };
    });
  }, []);

  const heatMapZoomRanges = useMemo(() => {
    if (!generatedHeatMap?.zoomStack?.length) return null;
    return generatedHeatMap.zoomStack[generatedHeatMap.zoomStack.length - 1].zoomRanges;
  }, [generatedHeatMap?.zoomStack]);

  const currentHeatMapData = useMemo(() => {
    if (!generatedHeatMap?.fullResults || !generatedHeatMap?.config) return null;
    return buildHeatMap(generatedHeatMap.fullResults, generatedHeatMap.config, heatMapZoomRanges);
  }, [generatedHeatMap?.fullResults, generatedHeatMap?.config, heatMapZoomRanges]);
  const stages = useMemo(
    () => [
      {
        id: 1,
        label: "Signal",
        title: "STAGE 1: SIGNAL GENERATOR",
        locked: false,
        icon: (
          <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
            <path d="M4 19V5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M4 19h16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M7 15l4-4 3 3 5-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="7" cy="15" r="1.4" fill="currentColor" />
            <circle cx="11" cy="11" r="1.4" fill="currentColor" />
            <circle cx="14" cy="14" r="1.4" fill="currentColor" />
            <circle cx="19" cy="7" r="1.4" fill="currentColor" />
          </svg>
        ),
      },
      {
        id: 2,
        label: "Entry",
        title: "STAGE 2: ENTRY VALIDATION",
        locked: true,
        icon: (
          <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
            <path d="M4 12h10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M10 8l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M14 4h6v16h-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ),
      },
      {
        id: 3,
        label: "Exit",
        title: "STAGE 3: EXIT LOGIC",
        locked: true,
        icon: (
          <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
            <path d="M20 12H10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M14 8l-4 4 4 4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M10 4H4v16h6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ),
      },
      {
        id: 4,
        label: "Risk",
        title: "STAGE 4: RISK MANAGEMENT",
        locked: true,
        icon: (
          <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
            <path d="M12 2l9 5v10l-9 5-9-5V7l9-5z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
            <path d="M12 8v5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <circle cx="12" cy="16.5" r="1" fill="currentColor" />
          </svg>
        ),
      },
      {
        id: 5,
        label: "Final",
        title: "STAGE 5: FINAL VALIDATION",
        locked: true,
        icon: (
          <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
            <path d="M20 6L9 17l-5-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ),
      },
    ],
    []
  );

  const active = stages.find((s) => s.id === activeStage) ?? stages[0];

  const [openRunId, setOpenRunId] = useState(null);

  return (
    <div className={cx(ui.radius, ui.panel, "overflow-hidden")}>
      <div className={cx("flex items-center justify-between px-3 py-2", ui.panelMuted, "border-0 border-b", ui.divider)}>
        <div className="flex items-center gap-2">
          <StageIcon>
            <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
              <path d="M5 7h14M5 12h10M5 17h14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </StageIcon>
          <div>
            <div className="text-[12px] font-medium text-[#d9d9d9]">Strategy Builder</div>
            <div className={cx("text-[11px]", ui.textMuted)}>Stages are read-only (only Stage 1 has fields).</div>
          </div>
        </div>
        <span className="rounded-md border border-[#303030] bg-[#0f0f0f] px-2 py-0.5 text-[10px] text-[#8c8c8c]">mock</span>
      </div>

      {/* Horizontal stepper */}
      <div className={cx("px-3 py-3", ui.panelMuted, "border-0 border-b", ui.divider)}>
        <div className="grid grid-cols-5 gap-2">
          {stages.map((s) => {
            const isActive = s.id === activeStage;
            return (
              <div
                key={s.id}
                className={cx(
                  "rounded-lg border px-2 py-2 flex items-center gap-2",
                  isActive ? "border-emerald-500/40 bg-emerald-500/10" : "border-[#303030] bg-[#0f0f0f]",
                  s.locked && "opacity-80"
                )}
                title={s.title}
              >
                <span
                  className={cx(
                    "inline-flex h-7 w-7 items-center justify-center rounded-md border",
                    isActive ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200" : "border-[#303030] bg-[#141414] text-[#a6a6a6]"
                  )}
                >
                  {s.icon}
                </span>
                <div className="min-w-0">
                  <div className={cx("text-[12px] font-medium truncate", isActive ? "text-emerald-100" : "text-[#d9d9d9]")}>
                    {s.label}
                  </div>
                  <div className={cx("text-[10px] truncate", ui.textMuted)}>{s.locked ? "locked" : "active"}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Stage content */}
      <div className="p-3">
        {active.id !== 1 ? (
          <div className={cx(ui.radius, ui.panelMuted, "px-4 py-3 text-[12px]", ui.textSubtle)}>{active.title} — coming soon.</div>
        ) : (
          <div className="space-y-4">
            {/* 1. INDICATORS */}
            <div className={cx(ui.radius, ui.panel, "overflow-hidden")}>
              <button
                type="button"
                onClick={() => toggleSection(1)}
                className={cx("w-full px-3 py-2 flex items-center justify-between gap-2 text-left", ui.panelMuted, "border-0 border-b", ui.divider, "hover:bg-[#1a1a1a] transition-colors")}
              >
                <div>
                  <div className="text-[12px] font-medium text-[#d9d9d9]">1. Indicators</div>
                  <div className={cx("text-[11px]", ui.textMuted)}>Indicator Library and Selected Indicators</div>
                </div>
                <span className="text-[#8c8c8c] text-[10px]">
                  {collapsedSections.has(1) ? "▶" : "▼"}
                </span>
              </button>
              {!collapsedSections.has(1) && (
              <div className="p-3">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                  {/* Library (left) */}
                  <div className="lg:col-span-5">
                    <IndicatorLibrary
                      query={libraryQuery}
                      onQueryChange={setLibraryQuery}
                      groupFilter={libraryGroup}
                      onGroupChange={setLibraryGroup}
                      onAdd={handleAddIndicatorFromLibrary}
                    />
                  </div>

                  {/* Selected indicators (right) */}
                  <div className="lg:col-span-7">
                <div className={cx(ui.radius, ui.panel, "overflow-hidden h-full flex flex-col")}>
                  <div className={cx("px-4 py-3", ui.panelMuted, "border-0 border-b", ui.divider)}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-[12px] font-medium text-[#d9d9d9] mb-1">Selected Indicators</div>
                      </div>
                      <div className={cx(
                        "text-[11px] shrink-0 rounded-md border px-2 py-1.5",
                        totalCombinations > 10_000_000 ? "border-red-500/50 bg-red-500/10 text-red-400" : totalCombinations > 0 ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400" : "border-[#303030] bg-[#0f0f0f] text-[#8c8c8c]"
                      )}>
                        Total combinations: <span className="font-medium">{totalCombinations.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex-1 overflow-auto p-3">
                    {true ? (
                      indicators.length === 0 ? (
                        <div className={cx(ui.radius, ui.panelMuted, "p-6 text-center text-[12px]", ui.textMuted)}>
                          No indicators yet. Add one from the library.
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {indicators.map((ind, idx) => (
                            <IndicatorItem 
                              key={ind.id} 
                              indicator={ind}
                              index={idx}
                              total={indicators.length}
                              onEdit={() => setEditingIndicator(ind)}
                              onDelete={() => handleDeleteIndicator(ind.id)}
                            />
                          ))}
                        </div>
                      )
                    ) : (
                      <div className={cx(ui.radius, ui.panelMuted, "p-4")}>
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <div className="text-[12px] font-medium text-[#d9d9d9]">populate_indicators() preview</div>
                            <div className={cx("text-[11px]", ui.textMuted)}>Python code based on selected indicators</div>
                          </div>
                          <button className={cx(ui.btn, "h-7 px-2 text-[10px]")} onClick={() => {
                            const code = generatePythonCode(indicators);
                            navigator.clipboard?.writeText(code);
                          }}>
                            Copy
                          </button>
                        </div>
                        <pre className="text-[11px] font-mono text-[#a6a6a6] whitespace-pre-wrap overflow-auto max-h-96 p-3 rounded-lg bg-[#0f0f0f] border border-[#303030]">
                          {generatePythonCode(indicators)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              </div>
                </div>
              </div>
              )}
            </div>

            {/* 2. SIGNAL FORMULAS */}
            <div className={cx(ui.radius, ui.panel, "overflow-hidden")}>
              <button
                type="button"
                onClick={() => toggleSection(2)}
                className={cx("w-full px-3 py-2 flex items-center justify-between gap-2 text-left", ui.panelMuted, "border-0 border-b", ui.divider, "hover:bg-[#1a1a1a] transition-colors")}
              >
                <div>
                  <div className="text-[12px] font-medium text-[#d9d9d9]">2. Signal Formulas</div>
                  <div className={cx("text-[11px]", ui.textMuted)}>Define trading signals using python formula or builder</div>
                </div>
                <span className="text-[#8c8c8c] text-[10px]">{collapsedSections.has(2) ? "▶" : "▼"}</span>
              </button>
              {!collapsedSections.has(2) && (
              <div className="p-3">
                <FormulaEditor 
                  value={signalFormula}
                  onChange={setSignalFormula}
                  indicators={indicators}
                />
              </div>
              )}
            </div>

            {/* 3. HYPEROPTIMIZATION PARAMETERS */}
            <div className={cx(ui.radius, ui.panel, "overflow-hidden")}>
              <button
                type="button"
                onClick={() => toggleSection(3)}
                className={cx("w-full px-3 py-2 flex items-center justify-between gap-2 text-left", ui.panelMuted, "border-0 border-b", ui.divider, "hover:bg-[#1a1a1a] transition-colors")}
              >
                <div>
                  <div className="text-[12px] font-medium text-[#d9d9d9]">3. Hyperoptimization Parameters</div>
                  <div className={cx("text-[11px]", ui.textMuted)}>Set trading pairs and time parameters</div>
                </div>
                <span className="text-[#8c8c8c] text-[10px]">{collapsedSections.has(3) ? "▶" : "▼"}</span>
              </button>
              {!collapsedSections.has(3) && (
              <div className="p-3 space-y-3">
                <div className={cx(ui.radius, ui.panelMuted, "p-3")}>
                  <div className="text-[12px] font-medium text-[#d9d9d9] mb-3">Market configuration</div>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <PairsDropdown value={pairs} onChange={onPairsChange} />
                    <div>
                      <label className={cx("block mb-1 text-xs", ui.textMuted)}>Time Frame</label>
                      <select value={timeRange} onChange={(e) => onTimeRangeChange(e.target.value)} className={cx(ui.input, "h-9 text-[12px] w-full")}>
                        {TIME_RANGES.map((v) => (
                          <option key={v} value={v}>{v}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className={cx("block mb-1 text-xs", ui.textMuted)}>Know Time Range</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="date"
                          value={timeFrameStart}
                          onChange={(e) => onTimeFrameStartChange(e.target.value)}
                          className={cx(ui.input, "h-9 text-[12px] flex-1 min-w-0")}
                          title="From"
                        />
                        <span className="text-[#8c8c8c] text-xs shrink-0">–</span>
                        <input
                          type="date"
                          value={timeFrameEnd}
                          onChange={(e) => onTimeFrameEndChange(e.target.value)}
                          className={cx(ui.input, "h-9 text-[12px] flex-1 min-w-0")}
                          title="To"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className={cx("block mb-1 text-xs", ui.textMuted)}>Unknow Time Range</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="date"
                          value={unknowTimeRangeStart}
                          onChange={(e) => setUnknowTimeRangeStart(e.target.value)}
                          className={cx(ui.input, "h-9 text-[12px] flex-1 min-w-0")}
                          title="From"
                        />
                        <span className="text-[#8c8c8c] text-xs shrink-0">–</span>
                        <input
                          type="date"
                          value={unknowTimeRangeEnd}
                          onChange={(e) => setUnknowTimeRangeEnd(e.target.value)}
                          className={cx(ui.input, "h-9 text-[12px] flex-1 min-w-0")}
                          title="To"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className={cx(ui.radius, ui.panelMuted, "p-3")}>
                  <div className="text-[12px] font-medium text-[#d9d9d9] mb-3">Technical params</div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className={cx("block mb-1 text-xs", ui.textMuted)}>Max possible std</label>
                      <input
                        type="text"
                        value={maxPossibleStd}
                        onChange={(e) => setMaxPossibleStd(e.target.value)}
                        placeholder="Max possible std"
                        className={cx(ui.input, "h-9 text-[12px] w-full")}
                      />
                    </div>
                  </div>
                </div>

                <div className={cx(ui.radius, ui.panelMuted, "p-3")}>
                  <div className="text-[12px] font-medium text-[#d9d9d9] mb-3">Hyperopt type</div>
                  <select value={hyperoptType} onChange={(e) => setHyperoptType(e.target.value)} className={cx(ui.input, "h-9 text-[12px] w-full max-w-[200px]")}>
                    <option value="BIAS">BIAS</option>
                    <option value="Brute Force">Brute Force</option>
                  </select>
                </div>

                {/* Normalization formulas — shown only when Hyperopt type is not Brute Force */}
                {hyperoptType !== "Brute Force" && (
                <div className={cx(ui.radius, ui.panelMuted, "p-3")}>
                  <div className="text-[12px] font-medium text-[#d9d9d9] mb-3">Normalization formulas</div>
                  <div className="p-3 pt-0 space-y-3 border-t border-[#303030]">
                          <div className="space-y-1.5">
                          <div className="text-[11px] font-medium text-[#d9d9d9]">Score formula</div>
                            <div className="flex flex-wrap items-center gap-3 gap-y-2">
                              <select value={finalScoreFormula} onChange={(e) => setFinalScoreFormula(e.target.value)} className={cx(ui.input, "h-9 text-[12px] w-full max-w-[200px]")}>
                                {FORMULA_OPTIONS.map((v) => <option key={v} value={v}>{v}</option>)}
                              </select>
                              <div className="min-w-[200px] flex-1 max-w-[400px]">
                                <div className="relative rounded-md border border-[#303030] bg-[#0f0f0f] h-9 overflow-hidden">
                                  <div data-formula-mirror className="absolute left-0 top-0 bottom-0 right-8 pl-3 overflow-x-auto overflow-y-hidden whitespace-nowrap py-2 text-[11px] font-mono text-[#d9d9d9] pointer-events-none flex items-center [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }} aria-hidden>
                                    <span className="inline-block min-w-full">{finFinalFormulaCode ? renderFormulaWithVariables(finFinalFormulaCode) : <span className="text-[#595959]">e.g. 1 / (1 + exp(-k * ...))</span>}</span>
                                  </div>
                                  <input
                                    type="text"
                                    value={finFinalFormulaCode}
                                    onChange={(e) => setFinFinalFormulaCode(e.target.value)}
                                    onScroll={(e) => {
                                      const m = e.target.parentElement?.querySelector("[data-formula-mirror]");
                                      if (m) m.scrollLeft = e.target.scrollLeft;
                                    }}
                                    placeholder="Formula code"
                                    className="relative z-10 w-full h-full bg-transparent text-transparent caret-[#d9d9d9] rounded-md border-0 pl-3 pr-8 py-2 text-[11px] font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:ring-inset"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => openFormulaEditor(finFinalFormulaCode, setFinFinalFormulaCode)}
                                    className="absolute right-0 top-0 bottom-0 z-20 flex items-center justify-center w-8 h-full bg-emerald-600 text-white hover:bg-emerald-500 active:bg-emerald-700 rounded-r-md"
                                    title="Формула"
                                  >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                                      <path fillRule="nonzero" d="M5 4.5C5 3.672 5.672 3 6.5 3h11c.828 0 1.5.672 1.5 1.5V5c0 .552-.448 1-1 1s-1-.448-1-1V5H7v.54l6.562 5.625c.512.44.512 1.232 0 1.671L7 18.46V19h10c.552 0 1 .448 1 1s-.448 1-1 1H6.5C5.672 21 5 20.328 5 19.5v-1.27c0-.438.191-.854.524-1.139l5.94-4.091L5.524 6.909C5.191 6.624 5 6.208 5 5.77V4.5z" />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="text-[11px] font-medium text-[#d9d9d9]">Normalization metrics formulas and weights</div>
                          <div className="overflow-x-auto border border-[#303030] rounded-lg">
                            <table className="w-full text-[11px] border-collapse">
                              <thead>
                                <tr className="bg-[#1a1a1a] text-[#8c8c8c]">
                                  <th className="px-3 py-2 text-left font-medium border-b border-[#303030] w-24">Metrics</th>
                                  <th className="px-3 py-2 text-left font-medium border-b border-[#303030] w-32">Formula</th>
                                  <th className="px-3 py-2 text-left font-medium border-b border-[#303030] min-w-[200px]">Formula Code</th>
                                  <th className="px-3 py-2 text-left font-medium border-b border-[#303030]">Weight</th>
                                </tr>
                              </thead>
                              <tbody className="text-[#d9d9d9]">
                                {[
                                  { metric: "MFE", formula: finMfeFormula, setFormula: setFinMfeFormula, formulaCode: finMfeFormulaCode, setFormulaCode: setFinMfeFormulaCode, weight: finMfeWeight, setWeight: setFinMfeWeight, others: finMaeWeight + finAirWeight + finHitRateWeight },
                                  { metric: "MAE", formula: finMaeFormula, setFormula: setFinMaeFormula, formulaCode: finMaeFormulaCode, setFormulaCode: setFinMaeFormulaCode, weight: finMaeWeight, setWeight: setFinMaeWeight, others: finMfeWeight + finAirWeight + finHitRateWeight },
                                  { metric: "AIR", formula: finAirFormula, setFormula: setFinAirFormula, formulaCode: finAirFormulaCode, setFormulaCode: setFinAirFormulaCode, weight: finAirWeight, setWeight: setFinAirWeight, others: finMfeWeight + finMaeWeight + finHitRateWeight },
                                  { metric: "Hit rate", formula: finHitRateFormula, setFormula: setFinHitRateFormula, formulaCode: finHitRateFormulaCode, setFormulaCode: setFinHitRateFormulaCode, weight: finHitRateWeight, setWeight: setFinHitRateWeight, others: finMfeWeight + finMaeWeight + finAirWeight },
                                ].map((row) => (
                                  <tr key={row.metric} className="border-b border-[#303030]">
                                    <td className="px-3 py-2 text-[#a6a6a6] align-top">{row.metric}</td>
                                    <td className="px-3 py-2 w-32 align-top">
                                      <select value={row.formula} onChange={(e) => row.setFormula(e.target.value)} className={cx(ui.input, "h-8 text-[11px] w-full min-w-0")}>
                                        {FORMULA_OPTIONS.map((v) => <option key={v} value={v}>{v}</option>)}
                                      </select>
                                    </td>
                                    <td className="px-3 py-2 align-top min-w-[200px]">
                                      <div className="relative rounded-md border border-[#303030] bg-[#0f0f0f] h-8 overflow-hidden min-w-[200px]">
                                        <div
                                          data-formula-mirror
                                          className="absolute left-0 top-0 bottom-0 right-8 pl-3 overflow-x-auto overflow-y-hidden whitespace-nowrap py-2 text-[11px] font-mono text-[#d9d9d9] pointer-events-none flex items-center [&::-webkit-scrollbar]:hidden"
                                          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                                          aria-hidden
                                        >
                                          <span className="inline-block min-w-full">
                                            {row.formulaCode
                                              ? renderFormulaWithVariables(row.formulaCode)
                                              : <span className="text-[#595959]">e.g. 1 / (1 + exp(-k * ...))</span>}
                                          </span>
                                        </div>
                                        <input
                                          type="text"
                                          value={row.formulaCode}
                                          onChange={(e) => row.setFormulaCode(e.target.value)}
                                          onScroll={(e) => {
                                            const m = e.target.parentElement?.querySelector("[data-formula-mirror]");
                                            if (m) m.scrollLeft = e.target.scrollLeft;
                                          }}
                                          className="relative z-10 w-full h-full bg-transparent text-transparent caret-[#d9d9d9] rounded-md border-0 pl-3 pr-8 py-2 text-[11px] font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:ring-inset"
                                        />
                                        <button
                                          type="button"
                                          onClick={() => openFormulaEditor(row.formulaCode, row.setFormulaCode)}
                                          className="absolute right-0 top-0 bottom-0 z-20 flex items-center justify-center w-8 h-full bg-emerald-600 text-white hover:bg-emerald-500 active:bg-emerald-700 rounded-r-md"
                                          title="Формула"
                                        >
                                          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                                            <path fillRule="nonzero" d="M5 4.5C5 3.672 5.672 3 6.5 3h11c.828 0 1.5.672 1.5 1.5V5c0 .552-.448 1-1 1s-1-.448-1-1V5H7v.54l6.562 5.625c.512.44.512 1.232 0 1.671L7 18.46V19h10c.552 0 1 .448 1 1s-.448 1-1 1H6.5C5.672 21 5 20.328 5 19.5v-1.27c0-.438.191-.854.524-1.139l5.94-4.091L5.524 6.909C5.191 6.624 5 6.208 5 5.77V4.5z" />
                                          </svg>
                                        </button>
                                      </div>
                                    </td>
                                    <td className="px-3 py-2 align-top">
                                      <div className="flex items-center gap-2">
                                        <input type="range" min={0} max={100} step={1} value={row.weight} onChange={(e) => setWeightCapped(row.setWeight, e.target.value, row.others)} className="flex-1 max-w-[120px] h-2 accent-emerald-500" />
                                        <span className="text-[#8c8c8c] w-7">{row.weight}%</span>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                              <tfoot>
                                <tr className="bg-[#1a1a1a]">
                                  <td colSpan={3} className="px-3 py-2 text-right text-[11px] font-medium text-[#8c8c8c]">Total</td>
                                  <td className={cx("px-3 py-2 text-[11px] font-medium", (finMfeWeight + finMaeWeight + finAirWeight + finHitRateWeight) === 100 ? "text-emerald-500" : (finMfeWeight + finMaeWeight + finAirWeight + finHitRateWeight) > 100 ? "text-amber-500" : "text-[#8c8c8c]")}>{finMfeWeight + finMaeWeight + finAirWeight + finHitRateWeight}%</td>
                                </tr>
                              </tfoot>
                            </table>
                          </div>
                  </div>
                </div>
                )}

                {!isRunningOptimization ? (
                  <button 
                    type="button" 
                    className={cx(ui.btnPrimary, "h-9 w-full")}
                    onClick={() => {
                      setIsRunningOptimization(true);
                      setOptimizationProgress(0);
                      
                      // Simulate progress over 3 seconds
                      const duration = 3000;
                      const interval = 50;
                      const steps = duration / interval;
                      let currentStep = 0;
                      
                      const timer = setInterval(() => {
                        currentStep++;
                        setOptimizationProgress((currentStep / steps) * 100);
                        
                        if (currentStep >= steps) {
                          clearInterval(timer);
                          setTimeout(() => {
                            setIsRunningOptimization(false);
                            setOptimizationProgress(0);
                          }, 200);
                        }
                      }, interval);
                    }}
                    disabled={indicators.length === 0}
                  >
                    ⚡ Run Hyperoptimization
                  </button>
                ) : (
                  <div className={cx(ui.radius, ui.panelMuted, "p-4")}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[12px] text-[#d9d9d9] font-medium">
                        ⚡ Hyperoptimization running...
                      </span>
                      <span className="text-[11px] text-[#8c8c8c]">
                        {Math.round(optimizationProgress)}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-[#0f0f0f] rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500 transition-all duration-100 ease-linear rounded-full"
                        style={{ width: `${optimizationProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
              )}
            </div>

            {/* 4. HYPEROPT RESULTS (two-level table + Run normalization modal) */}
            <div className={cx(ui.radius, ui.panel, "overflow-hidden")}>
              <button
                type="button"
                onClick={() => toggleSection(4)}
                className={cx("w-full px-3 py-2 flex items-center justify-between gap-2 text-left", ui.panelMuted, "border-0 border-b", ui.divider, "hover:bg-[#1a1a1a] transition-colors")}
              >
                <div>
                  <div className="text-[12px] font-medium text-[#d9d9d9]">4. Hyperopt Results</div>
                  <div className={cx("text-[11px]", ui.textMuted)}>Two-level table: runs and scores</div>
                </div>
                <span className="flex items-center gap-2">
                  <span className="rounded-md border border-[#303030] bg-[#0f0f0f] px-2 py-0.5 text-[10px] text-[#8c8c8c]">
                    {hyperoptResultsRows.length} runs
                  </span>
                  <span className="text-[#8c8c8c] text-[10px]">{collapsedSections.has(4) ? "▶" : "▼"}</span>
                </span>
              </button>
              {!collapsedSections.has(4) && (
              <div className="overflow-auto p-3 space-y-4">
                {/* Block 1: Hyperopt result */}
                <div className="rounded-lg border border-[#303030] overflow-hidden border-l-4 border-l-emerald-500">
                  <div className="px-3 py-2 font-medium border-b border-[#303030] bg-emerald-500/10 text-emerald-200 text-[12px]">
                    Hyperopt result
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-[11px]">
                      <thead className="bg-[#1a1a1a] text-[#8c8c8c]">
                        <tr>
                          <th className="px-2 py-2 text-left font-medium border-b border-[#303030] w-8"></th>
                          <th className="px-3 py-2 text-left font-medium border-b border-[#303030]">Date</th>
                          <th className="px-3 py-2 text-left font-medium border-b border-[#303030]">Pairs</th>
                          <th className="px-3 py-2 text-left font-medium border-b border-[#303030]">TimeFrame</th>
                          <th className="px-3 py-2 text-left font-medium border-b border-[#303030]">KnowRange</th>
                          <th className="px-3 py-2 text-left font-medium border-b border-[#303030]">UnknowRange</th>
                          <th className="px-3 py-2 text-left font-medium border-b border-[#303030]">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="text-[#d9d9d9]">
                        {hyperoptResultsRows.map((row) => (
                          <React.Fragment key={row.id}>
                            <tr className="border-b border-[#303030] bg-[#141414] hover:bg-[#1f1f1f]">
                              <td className="px-2 py-2 align-middle">
                                <button
                                  type="button"
                                  onClick={() => toggleHyperoptRow(row.id)}
                                  className="text-[#8c8c8c] hover:text-[#d9d9d9] p-0.5 rounded"
                                  aria-label={hyperoptResultsExpanded.has(row.id) ? "Collapse" : "Expand"}
                                >
                                  {hyperoptResultsExpanded.has(row.id) ? "▼" : "▶"}
                                </button>
                              </td>
                              <td className="px-3 py-2">{row.date}</td>
                              <td className="px-3 py-2">{row.pairs}</td>
                              <td className="px-3 py-2">{row.timeFrame}</td>
                              <td className="px-3 py-2 text-[#a6a6a6]">{row.knowRange}</td>
                              <td className="px-3 py-2 text-[#a6a6a6]">{row.unknowRange}</td>
                              <td className="px-3 py-2">
                                <button
                                  type="button"
                                  onClick={() => setShowNormalizationModal(true)}
                                  className={cx(ui.btnPrimary, "h-7 px-2 text-[10px] whitespace-nowrap")}
                                >
                                  Run normalization
                                </button>
                              </td>
                            </tr>
                            {hyperoptResultsExpanded.has(row.id) && row.children && row.children.length > 0 && (
                              <tr>
                                <td colSpan={7} className="p-0 align-top bg-[#0f0f0f]">
                                  {/* Block 2: Normalization result (nested per expanded row) */}
                                  <div className="ml-4 mt-2 mb-2 rounded-lg border border-[#303030] overflow-hidden border-l-4 border-l-sky-500">
                                    <div className="px-3 py-1.5 font-medium border-b border-[#303030] bg-sky-500/10 text-sky-200 text-[11px]">
                                      Normalization result
                                      <span className="ml-2 text-[#8c8c8c] font-normal">— {row.date} · {row.pairs}</span>
                                    </div>
                                    <div className="overflow-x-auto">
                                      <table className="w-full border-collapse text-[11px]">
                                        <thead className="bg-[#1a1a1a] text-[#8c8c8c]">
                                          <tr>
                                            <th className="px-2 py-1.5 text-left font-medium border-b border-[#303030] w-8"></th>
                                            <th className="px-3 py-1.5 text-left font-medium border-b border-[#303030] w-24">Date</th>
                                            <th className="px-3 py-1.5 text-left font-medium border-b border-[#303030]">Normalization formula info</th>
                                            <th className="px-3 py-1.5 text-left font-medium border-b border-[#303030]">Actions</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {row.children.map((sub) => {
                                            const heatMapId = `hyperopt-${row.id}-${sub.id}`;
                                            const level3Items = sub.heatmapsAndReports || [];
                                            const isLevel3Expanded = hyperoptLevel3Expanded.has(sub.id);
                                            const hasTruncData = !!sub.truncScores;
                                            const isDetailsExpanded = normalizationDetailsExpanded.has(sub.id);

                                            return (
                                              <React.Fragment key={sub.id}>
                                                <tr className="border-b border-[#303030]/50 hover:bg-[#1a1a1a]">
                                                  <td className="px-2 py-2 align-middle">
                                                    <button
                                                      type="button"
                                                      onClick={() => toggleNormalizationDetails(sub.id)}
                                                      className="text-[#8c8c8c] hover:text-[#d9d9d9] p-0.5 rounded"
                                                      aria-label={isDetailsExpanded ? "Collapse" : "Expand"}
                                                    >
                                                      {isDetailsExpanded ? "▼" : "▶"}
                                                    </button>
                                                  </td>
                                                  <td className="px-3 py-2 text-[#a6a6a6]">{sub.date}</td>
                                                  <td className="px-3 py-2">
                                                    <HyperoptDetailsTooltip onShowDetails={() => setShowHyperoptDetailsModal(true)} />
                                                  </td>
                                                  <td className="px-3 py-2">
                                                    <button
                                                      type="button"
                                                      onClick={() => {
                                                        setSelectedNormalizationRow(sub);
                                                        setShowTruncateModal(true);
                                                      }}
                                                      className={cx(ui.btn, "h-7 px-2 text-[10px] whitespace-nowrap")}
                                                    >
                                                      Add truncate
                                                    </button>
                                                  </td>
                                                </tr>
                                                {isDetailsExpanded && (
                                                  <tr>
                                                    <td colSpan={4} className="p-0 align-top bg-[#0f0f0f]">
                                                      {/* Block 2.5: Normalization details (per normalization row) */}
                                                      <div className="ml-4 mt-2 mb-2 rounded-lg border border-[#303030] overflow-hidden border-l-4 border-l-emerald-500 bg-[#111111]">
                                                        <div className="px-3 py-1.5 font-medium border-b border-[#303030] bg-emerald-500/10 text-emerald-200 text-[11px]">
                                                          Normalization details
                                                        </div>
                                                        <div className="overflow-x-auto">
                                                          <table className="w-full border-collapse text-[11px]">
                                                            <thead className="bg-[#1a1a1a] text-[#8c8c8c]">
                                                              <tr>
                                                                <th className="px-2 py-1.5 text-left font-medium border-b border-[#303030] w-8"></th>
                                                                <th className="px-3 py-1.5 text-left font-medium border-b border-[#303030] w-24">Date</th>
                                                                <th className="px-3 py-1.5 text-left font-medium border-b border-[#303030]">Data period</th>
                                                                <th className="px-3 py-1.5 text-left font-medium border-b border-[#303030]">Min score</th>
                                                                <th className="px-3 py-1.5 text-left font-medium border-b border-[#303030]">AVG score</th>
                                                                <th className="px-3 py-1.5 text-left font-medium border-b border-[#303030]">Max score</th>
                                                                <th className="px-3 py-1.5 text-left font-medium border-b border-[#303030]">Fold size</th>
                                                                <th className="px-3 py-1.5 text-left font-medium border-b border-[#303030]">Actions</th>
                                                              </tr>
                                                            </thead>
                                                            <tbody>
                                                              {[
                                                                {
                                                                  id: `${sub.id}-full`,
                                                                  label: "Full data",
                                                                  scores: {
                                                                    min: sub.minScore,
                                                                    avg: sub.avgScore,
                                                                    max: sub.maxScore,
                                                                  },
                                                                },
                                                                hasTruncData && {
                                                                  id: `${sub.id}-trunc`,
                                                                  label: "Trunc data",
                                                                  scores: sub.truncScores,
                                                                },
                                                              ]
                                                                .filter(Boolean)
                                                                .map((detail) => (
                                                                  <React.Fragment key={detail.id}>
                                                                    <tr className="border-b border-[#303030]/50 hover:bg-[#1a1a1a]">
                                                                      <td className="px-2 py-2 align-middle">
                                                                        {level3Items.length > 0 && (
                                                                          <button
                                                                            type="button"
                                                                            onClick={() => toggleHyperoptLevel3(sub.id)}
                                                                            className="text-[#8c8c8c] hover:text-[#d9d9d9] p-0.5 rounded"
                                                                            aria-label={isLevel3Expanded ? "Collapse" : "Expand"}
                                                                          >
                                                                            {isLevel3Expanded ? "▼" : "▶"}
                                                                          </button>
                                                                        )}
                                                                      </td>
                                                                      <td className="px-3 py-2 text-[#a6a6a6]">{sub.date}</td>
                                                                      <td className="px-3 py-2">{detail.label}</td>
                                                                      <td className="px-3 py-2">{detail.scores?.min ?? "-"}</td>
                                                                      <td className="px-3 py-2">{detail.scores?.avg ?? "-"}</td>
                                                                      <td className="px-3 py-2">{detail.scores?.max ?? "-"}</td>
                                                                      <td className="px-3 py-2">
                                                                        {detail.label === "Trunc data" ? sub.foldSize ?? "-" : "-"}
                                                                      </td>
                                                                      <td className="px-3 py-2">
                                                                        <div className="flex items-center gap-2">
                                                                          <button
                                                                            type="button"
                                                                            onClick={() => setHeatMapConfigModalId(heatMapId)}
                                                                            className={cx(ui.btn, "h-7 px-2 text-[10px] whitespace-nowrap")}
                                                                          >
                                                                            Configure HeatMap
                                                                          </button>
                                                                          <button
                                                                            type="button"
                                                                            onClick={() => setShowReportModal(true)}
                                                                            className={cx(ui.btn, "h-7 px-2 text-[10px] whitespace-nowrap")}
                                                                          >
                                                                            Generate Report
                                                                          </button>
                                                                        </div>
                                                                      </td>
                                                                    </tr>
                                                                    {isLevel3Expanded && level3Items.length > 0 && (
                                                                      <tr>
                                                                        <td colSpan={8} className="p-0 align-top bg-[#0a0a0a]">
                                                                          {/* Block 3: HeatMaps & Reports (child of Normalization details) */}
                                                                          <div className="ml-4 mt-2 mb-2 rounded-lg border border-[#303030] overflow-hidden border-l-4 border-l-amber-500">
                                                                            <div className="px-3 py-1.5 font-medium border-b border-[#303030] bg-amber-500/10 text-amber-200 text-[11px]">
                                                                              HeatMaps &amp; Reports
                                                                            </div>
                                                                            <div className="overflow-x-auto">
                                                                              <table className="w-full border-collapse text-[11px]">
                                                                                <thead className="bg-[#1a1a1a] text-[#8c8c8c]">
                                                                                  <tr>
                                                                                    <th className="px-3 py-1.5 text-left font-medium border-b border-[#303030] w-24">Date</th>
                                                                                    <th className="px-3 py-1.5 text-left font-medium border-b border-[#303030]">Type</th>
                                                                                    <th className="px-3 py-1.5 text-left font-medium border-b border-[#303030]">Details</th>
                                                                                    <th className="px-3 py-1.5 text-left font-medium border-b border-[#303030]">Actions</th>
                                                                                  </tr>
                                                                                </thead>
                                                                                <tbody>
                                                                                  {level3Items.map((item) => (
                                                                                    <tr key={item.id} className="border-b border-[#303030]/30 hover:bg-[#141414]">
                                                                                      <td className="px-3 py-2 text-[#a6a6a6]">{item.date}</td>
                                                                                      <td className="px-3 py-2">{item.type}</td>
                                                                                      <td className="px-3 py-2">
                                                                                        <button
                                                                                          type="button"
                                                                                          title="info"
                                                                                          className="text-[#8c8c8c] hover:text-[#d9d9d9] p-1 rounded inline-flex items-center justify-center"
                                                                                          aria-label="Info"
                                                                                        >
                                                                                          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>
                                                                                        </button>
                                                                                      </td>
                                                                                      <td className="px-3 py-2">
                                                                                        {item.type === "Heatmap" ? (
                                                                                          <button
                                                                                            type="button"
                                                                                            onClick={() => setHeatMapViewModalId(heatMapId)}
                                                                                            className={cx(ui.btn, "h-7 px-2 text-[10px] whitespace-nowrap")}
                                                                                          >
                                                                                            Show heatmap
                                                                                          </button>
                                                                                        ) : (
                                                                                          <button
                                                                                            type="button"
                                                                                            onClick={() => setShowReportModal(true)}
                                                                                            className={cx(ui.btn, "h-7 px-2 text-[10px] whitespace-nowrap")}
                                                                                          >
                                                                                            Download report
                                                                                          </button>
                                                                                        )}
                                                                                      </td>
                                                                                    </tr>
                                                                                  ))}
                                                                                </tbody>
                                                                              </table>
                                                                            </div>
                                                                          </div>
                                                                        </td>
                                                                      </tr>
                                                                    )}
                                                                  </React.Fragment>
                                                                ))}
                                                            </tbody>
                                                          </table>
                                                        </div>
                                                      </div>
                                                    </td>
                                                  </tr>
                                                )}
                                              </React.Fragment>
                                            );
                                          })}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              )}
            </div>

          </div>
        )}
      </div>
      
      {/* Modals */}
      {showAddModal && (
        <AddIndicatorModal 
          initialType={addModalType}
          onClose={() => setShowAddModal(false)} 
          onAdd={handleAddIndicator} 
        />
      )}
      
      {showReportModal && (
        <GenerateReportModal 
          indicators={indicators}
          onClose={() => setShowReportModal(false)} 
          onGenerate={(config) => {
            console.log('📊 Report generated:', config);
            // TODO: Handle report generation
            alert(`Report generated for ${config.indicator.name}`);
          }} 
        />
      )}
      {/* Formula Editor modal */}
      {showFormulaEditor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={handleFormulaEditorCancel}>
          <div
            className={cx(
              ui.radius,
              "bg-[#141414] border border-[#303030] max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-xl"
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#303030]">
              <span className="text-[14px] font-medium text-[#d9d9d9]">Formula Editor</span>
              <button
                type="button"
                onClick={handleFormulaEditorCancel}
                className="text-[#8c8c8c] hover:text-[#d9d9d9] p-1"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4 space-y-4">
              {/* Textarea */}
              <div className="space-y-1.5">
                <div className="text-[11px] font-medium text-[#d9d9d9]">Score formula</div>
                <div className="relative min-h-[140px] rounded-md border border-[#303030] bg-[#0f0f0f] overflow-hidden">
                  <div
                    ref={formulaEditorMirrorRef}
                    className="absolute inset-0 overflow-auto px-3 py-2 text-[11px] font-mono text-[#d9d9d9] whitespace-pre-wrap break-words pointer-events-none [&::-webkit-scrollbar]:hidden"
                    style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                    aria-hidden
                  >
                    {formulaEditorValue ? (
                      renderFormulaEditorWithVariables(formulaEditorValue)
                    ) : (
                      <span className="text-[#595959]">Enter formula...</span>
                    )}
                  </div>
                  <textarea
                    ref={formulaEditorRef}
                    value={formulaEditorValue}
                    onChange={handleFormulaEditorChange}
                    onSelect={handleFormulaEditorSelect}
                    onScroll={(e) => {
                      const m = formulaEditorMirrorRef.current;
                      if (m) {
                        m.scrollTop = e.target.scrollTop;
                        m.scrollLeft = e.target.scrollLeft;
                      }
                    }}
                    className={cx(
                      "relative z-10 w-full min-h-[140px] resize-y rounded-md border-0 bg-transparent px-3 py-2 text-[11px] font-mono text-transparent caret-[#d9d9d9] focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:ring-inset"
                    )}
                    placeholder="Enter formula..."
                  />
                </div>
              </div>
              {/* Variables & Functions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="text-[11px] font-medium text-[#d9d9d9]">Variables</div>
                  <div className="flex items-center gap-2">
                    <select
                      className={cx(ui.input, "h-8 text-[11px] flex-1")}
                      onChange={(e) => {
                        if (!e.target.value) return;
                        insertIntoFormulaEditor(e.target.value);
                        e.target.selectedIndex = 0;
                      }}
                    >
                      <option value="">Select variable…</option>
                      {FORMULA_EDITOR_VARIABLES.map((v) => (
                        <option key={v} value={v}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-[11px] font-medium text-[#d9d9d9]">Functions</div>
                  <div className="flex items-center gap-2">
                    <select
                      className={cx(ui.input, "h-8 text-[11px] flex-1")}
                      onChange={(e) => {
                        if (!e.target.value) return;
                        insertIntoFormulaEditor(e.target.value);
                        e.target.selectedIndex = 0;
                      }}
                    >
                      <option value="">Select function…</option>
                      {FORMULA_EDITOR_FUNCTIONS.map((fn) => (
                        <option key={fn.label} value={fn.template}>
                          {fn.label} — {fn.template}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              {/* Operators */}
              <div className="space-y-2">
                <div className="text-[11px] font-medium text-[#d9d9d9]">Operators</div>
                <div className="flex flex-wrap gap-1.5">
                  {FORMULA_EDITOR_OPERATORS.map((op) => (
                    <button
                      key={op}
                      type="button"
                      onClick={() => insertIntoFormulaEditor(op)}
                      className="inline-flex items-center justify-center rounded-md border border-[#303030] bg-[#0f0f0f] px-2.5 py-1 text-[11px] text-[#d9d9d9] hover:bg-[#1f1f1f] active:translate-y-[0.5px]"
                    >
                      {op}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between gap-2 px-4 py-3 border-t border-[#303030] bg-[#111111]">
              <button
                type="button"
                onClick={handleFormulaEditorClear}
                className="text-[11px] text-[#8c8c8c] hover:text-[#d9d9d9]"
              >
                Clear
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleFormulaEditorCancel}
                  className={cx(ui.btn, "h-8 px-3 text-[11px]")}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleFormulaEditorApply}
                  className={cx(ui.btnPrimary, "h-8 px-3 text-[11px]")}
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Run normalization modal — same block as Normalization formulas */}
      {showNormalizationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => setShowNormalizationModal(false)}>
          <div className={cx(ui.radius, "bg-[#141414] border border-[#303030] max-w-[720px] w-full max-h-[90vh] overflow-hidden flex flex-col shadow-xl")} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#303030]">
              <span className="text-[14px] font-medium text-[#d9d9d9]">Run normalization</span>
              <button type="button" onClick={() => setShowNormalizationModal(false)} className="text-[#8c8c8c] hover:text-[#d9d9d9] p-1">✕</button>
            </div>
            <div className="overflow-auto p-4">
              <div className={cx(ui.radius, ui.panelMuted, "p-3")}>
                <div className="text-[12px] font-medium text-[#d9d9d9] mb-3">Normalization formulas</div>
                <div className="p-3 pt-0 space-y-3 border-t border-[#303030]">
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-medium text-[#d9d9d9]">Score formula</div>
                    <div className="flex flex-wrap items-center gap-3 gap-y-2">
                      <select value={finalScoreFormula} onChange={(e) => setFinalScoreFormula(e.target.value)} className={cx(ui.input, "h-9 text-[12px] w-full max-w-[200px]")}>
                        {FORMULA_OPTIONS.map((v) => <option key={v} value={v}>{v}</option>)}
                      </select>
                      <div className="min-w-[200px] flex-1 max-w-[400px]">
                        <div className="relative rounded-md border border-[#303030] bg-[#0f0f0f] h-9 overflow-hidden">
                          <div data-formula-mirror className="absolute left-0 top-0 bottom-0 right-8 pl-3 overflow-x-auto overflow-y-hidden whitespace-nowrap py-2 text-[11px] font-mono text-[#d9d9d9] pointer-events-none flex items-center [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }} aria-hidden>
                            <span className="inline-block min-w-full">{finFinalFormulaCode ? renderFormulaWithVariables(finFinalFormulaCode) : <span className="text-[#595959]">e.g. 1 / (1 + exp(-k * ...))</span>}</span>
                          </div>
                          <input
                            type="text"
                            value={finFinalFormulaCode}
                            onChange={(e) => setFinFinalFormulaCode(e.target.value)}
                            onScroll={(e) => {
                              const m = e.target.parentElement?.querySelector("[data-formula-mirror]");
                              if (m) m.scrollLeft = e.target.scrollLeft;
                            }}
                            placeholder="Formula code"
                            className="relative z-10 w-full h-full bg-transparent text-transparent caret-[#d9d9d9] rounded-md border-0 pl-3 pr-8 py-2 text-[11px] font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:ring-inset"
                          />
                          <button
                            type="button"
                            onClick={() => openFormulaEditor(finFinalFormulaCode, setFinFinalFormulaCode)}
                            className="absolute right-0 top-0 bottom-0 z-20 flex items-center justify-center w-8 h-full bg-emerald-600 text-white hover:bg-emerald-500 active:bg-emerald-700 rounded-r-md"
                            title="Формула"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                              <path fillRule="nonzero" d="M5 4.5C5 3.672 5.672 3 6.5 3h11c.828 0 1.5.672 1.5 1.5V5c0 .552-.448 1-1 1s-1-.448-1-1V5H7v.54l6.562 5.625c.512.44.512 1.232 0 1.671L7 18.46V19h10c.552 0 1 .448 1 1s-.448 1-1 1H6.5C5.672 21 5 20.328 5 19.5v-1.27c0-.438.191-.854.524-1.139l5.94-4.091L5.524 6.909C5.191 6.624 5 6.208 5 5.77V4.5z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-medium text-[#d9d9d9]">Stability Formula</div>
                    <div className="flex flex-wrap items-center gap-3 gap-y-2">
                      <select value={finStabilityFormula} onChange={(e) => setFinStabilityFormula(e.target.value)} className={cx(ui.input, "h-9 text-[12px] w-full max-w-[200px]")}>
                        {FORMULA_OPTIONS.map((v) => <option key={v} value={v}>{v}</option>)}
                      </select>
                      <div className="min-w-[200px] flex-1 max-w-[400px]">
                        <div className="relative rounded-md border border-[#303030] bg-[#0f0f0f] h-9 overflow-hidden">
                          <div data-formula-mirror className="absolute left-0 top-0 bottom-0 right-8 pl-3 overflow-x-auto overflow-y-hidden whitespace-nowrap py-2 text-[11px] font-mono text-[#d9d9d9] pointer-events-none flex items-center [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }} aria-hidden>
                            <span className="inline-block min-w-full">{finStabilityFormulaCode ? renderFormulaWithVariables(finStabilityFormulaCode) : <span className="text-[#595959]">e.g. 1 / (1 + exp(-k * ...))</span>}</span>
                          </div>
                          <input type="text" value={finStabilityFormulaCode} onChange={(e) => setFinStabilityFormulaCode(e.target.value)} onScroll={(e) => { const m = e.target.parentElement?.querySelector("[data-formula-mirror]"); if (m) m.scrollLeft = e.target.scrollLeft; }} className="relative z-10 w-full h-full bg-transparent text-transparent caret-[#d9d9d9] rounded-md border-0 pl-3 pr-8 py-2 text-[11px] font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:ring-inset" />
                          <button type="button" onClick={() => openFormulaEditor(finStabilityFormulaCode, setFinStabilityFormulaCode)} className="absolute right-0 top-0 bottom-0 z-20 flex items-center justify-center w-8 h-full bg-emerald-600 text-white hover:bg-emerald-500 active:bg-emerald-700 rounded-r-md" title="Формула">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                              <path fillRule="nonzero" d="M5 4.5C5 3.672 5.672 3 6.5 3h11c.828 0 1.5.672 1.5 1.5V5c0 .552-.448 1-1 1s-1-.448-1-1V5H7v.54l6.562 5.625c.512.44.512 1.232 0 1.671L7 18.46V19h10c.552 0 1 .448 1 1s-.448 1-1 1H6.5C5.672 21 5 20.328 5 19.5v-1.27c0-.438.191-.854.524-1.139l5.94-4.091L5.524 6.909C5.191 6.624 5 6.208 5 5.77V4.5z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-[11px] font-medium text-[#d9d9d9]">Stability weights (sum ≤ 100%)</div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-4">
                      {[
                        { label: "StabWeightMFE", val: finStabMfeWeight, set: setFinStabMfeWeight, others: finStabMaeWeight + finStabAirWeight + finStabHitRateWeight },
                        { label: "StabWeightMAE", val: finStabMaeWeight, set: setFinStabMaeWeight, others: finStabMfeWeight + finStabAirWeight + finStabHitRateWeight },
                        { label: "StabWeightAIR", val: finStabAirWeight, set: setFinStabAirWeight, others: finStabMfeWeight + finStabMaeWeight + finStabHitRateWeight },
                        { label: "StabWeightHitRate", val: finStabHitRateWeight, set: setFinStabHitRateWeight, others: finStabMfeWeight + finStabMaeWeight + finStabAirWeight },
                      ].map((s) => (
                        <div key={s.label} className="flex items-center gap-2">
                          <span className="text-[10px] text-[#8c8c8c] shrink-0">{s.label}</span>
                          <input type="range" min={0} max={100} step={1} value={s.val} onChange={(e) => setWeightCapped(s.set, e.target.value, s.others)} className="flex-1 min-w-0 h-2 accent-emerald-500" />
                          <span className="text-[#8c8c8c] text-[10px] w-8">{s.val}%</span>
                        </div>
                      ))}
                    </div>
                    <div className="text-[10px] text-[#8c8c8c]">Total: {finStabWeightsSum}%</div>
                  </div>
                  <div className="text-[11px] font-medium text-[#d9d9d9]">Normalization metrics formulas and weights</div>
                  <div className="overflow-x-auto border border-[#303030] rounded-lg">
                    <table className="w-full text-[11px] border-collapse">
                      <thead>
                        <tr className="bg-[#1a1a1a] text-[#8c8c8c]">
                          <th className="px-3 py-2 text-left font-medium border-b border-[#303030] w-24">Metrics</th>
                          <th className="px-3 py-2 text-left font-medium border-b border-[#303030] w-32">Formula</th>
                          <th className="px-3 py-2 text-left font-medium border-b border-[#303030] min-w-[200px]">Formula Code</th>
                          <th className="px-3 py-2 text-left font-medium border-b border-[#303030]">Weight</th>
                        </tr>
                      </thead>
                      <tbody className="text-[#d9d9d9]">
                        <tr className="border-b border-[#303030]">
                          <td className="px-3 py-2 text-[#a6a6a6] align-top">Stability</td>
                          <td className="px-3 py-2 w-32 align-top">
                            <select value={finStabilityFormula} onChange={(e) => setFinStabilityFormula(e.target.value)} className={cx(ui.input, "h-8 text-[11px] w-full min-w-0")}>
                              {FORMULA_OPTIONS.map((v) => <option key={v} value={v}>{v}</option>)}
                            </select>
                          </td>
                          <td className="px-3 py-2 align-top min-w-[200px]">
                            <div className="relative rounded-md border border-[#303030] bg-[#0f0f0f] h-8 overflow-hidden min-w-[200px]">
                              <div data-formula-mirror className="absolute left-0 top-0 bottom-0 right-8 pl-3 overflow-x-auto overflow-y-hidden whitespace-nowrap py-2 text-[11px] font-mono text-[#d9d9d9] pointer-events-none flex items-center [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }} aria-hidden>
                                <span className="inline-block min-w-full">{finStabilityFormulaCode ? renderFormulaWithVariables(finStabilityFormulaCode) : <span className="text-[#595959]">e.g. 1 / (1 + exp(-k * ...))</span>}</span>
                              </div>
                              <input type="text" value={finStabilityFormulaCode} onChange={(e) => setFinStabilityFormulaCode(e.target.value)} onScroll={(e) => { const m = e.target.parentElement?.querySelector("[data-formula-mirror]"); if (m) m.scrollLeft = e.target.scrollLeft; }} className="relative z-10 w-full h-full bg-transparent text-transparent caret-[#d9d9d9] rounded-md border-0 pl-3 pr-8 py-2 text-[11px] font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:ring-inset" />
                              <button type="button" onClick={() => openFormulaEditor(finStabilityFormulaCode, setFinStabilityFormulaCode)} className="absolute right-0 top-0 bottom-0 z-20 flex items-center justify-center w-8 h-full bg-emerald-600 text-white hover:bg-emerald-500 active:bg-emerald-700 rounded-r-md" title="Формула">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                                  <path fillRule="nonzero" d="M5 4.5C5 3.672 5.672 3 6.5 3h11c.828 0 1.5.672 1.5 1.5V5c0 .552-.448 1-1 1s-1-.448-1-1V5H7v.54l6.562 5.625c.512.44.512 1.232 0 1.671L7 18.46V19h10c.552 0 1 .448 1 1s-.448 1-1 1H6.5C5.672 21 5 20.328 5 19.5v-1.27c0-.438.191-.854.524-1.139l5.94-4.091L5.524 6.909C5.191 6.624 5 6.208 5 5.77V4.5z" />
                                </svg>
                              </button>
                            </div>
                          </td>
                          <td className="px-3 py-2 align-top">
                            <div className="flex items-center gap-2">
                              <input type="range" min={0} max={100} step={1} value={finStabilityWeight} onChange={(e) => setWeightCapped(setFinStabilityWeight, e.target.value, finMfeWeight + finMaeWeight + finAirWeight + finHitRateWeight)} className="flex-1 max-w-[120px] h-2 accent-emerald-500" />
                              <span className="text-[#8c8c8c] w-7">{finStabilityWeight}%</span>
                            </div>
                          </td>
                        </tr>
                        {[
                          { metric: "MFE", formula: finMfeFormula, setFormula: setFinMfeFormula, formulaCode: finMfeFormulaCode, setFormulaCode: setFinMfeFormulaCode, weight: finMfeWeight, setWeight: setFinMfeWeight, others: finStabilityWeight + finMaeWeight + finAirWeight + finHitRateWeight },
                          { metric: "MAE", formula: finMaeFormula, setFormula: setFinMaeFormula, formulaCode: finMaeFormulaCode, setFormulaCode: setFinMaeFormulaCode, weight: finMaeWeight, setWeight: setFinMaeWeight, others: finStabilityWeight + finMfeWeight + finAirWeight + finHitRateWeight },
                          { metric: "AIR", formula: finAirFormula, setFormula: setFinAirFormula, formulaCode: finAirFormulaCode, setFormulaCode: setFinAirFormulaCode, weight: finAirWeight, setWeight: setFinAirWeight, others: finStabilityWeight + finMfeWeight + finMaeWeight + finHitRateWeight },
                          { metric: "Hit rate", formula: finHitRateFormula, setFormula: setFinHitRateFormula, formulaCode: finHitRateFormulaCode, setFormulaCode: setFinHitRateFormulaCode, weight: finHitRateWeight, setWeight: setFinHitRateWeight, others: finStabilityWeight + finMfeWeight + finMaeWeight + finAirWeight },
                        ].map((row) => (
                          <tr key={row.metric} className="border-b border-[#303030]">
                            <td className="px-3 py-2 text-[#a6a6a6] align-top">{row.metric}</td>
                            <td className="px-3 py-2 w-32 align-top">
                              <select value={row.formula} onChange={(e) => row.setFormula(e.target.value)} className={cx(ui.input, "h-8 text-[11px] w-full min-w-0")}>
                                {FORMULA_OPTIONS.map((v) => <option key={v} value={v}>{v}</option>)}
                              </select>
                            </td>
                            <td className="px-3 py-2 align-top min-w-[200px]">
                              <div className="relative rounded-md border border-[#303030] bg-[#0f0f0f] h-8 overflow-hidden min-w-[200px]">
                                <div data-formula-mirror className="absolute left-0 top-0 bottom-0 right-8 pl-3 overflow-x-auto overflow-y-hidden whitespace-nowrap py-2 text-[11px] font-mono text-[#d9d9d9] pointer-events-none flex items-center [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }} aria-hidden>
                                  <span className="inline-block min-w-full">{row.formulaCode ? renderFormulaWithVariables(row.formulaCode) : <span className="text-[#595959]">e.g. 1 / (1 + exp(-k * ...))</span>}</span>
                                </div>
                                <input type="text" value={row.formulaCode} onChange={(e) => row.setFormulaCode(e.target.value)} onScroll={(e) => { const m = e.target.parentElement?.querySelector("[data-formula-mirror]"); if (m) m.scrollLeft = e.target.scrollLeft; }} className="relative z-10 w-full h-full bg-transparent text-transparent caret-[#d9d9d9] rounded-md border-0 pl-3 pr-8 py-2 text-[11px] font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:ring-inset" />
                                <button type="button" onClick={() => openFormulaEditor(row.formulaCode, row.setFormulaCode)} className="absolute right-0 top-0 bottom-0 z-20 flex items-center justify-center w-8 h-full bg-emerald-600 text-white hover:bg-emerald-500 active:bg-emerald-700 rounded-r-md" title="Формула">
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                                    <path fillRule="nonzero" d="M5 4.5C5 3.672 5.672 3 6.5 3h11c.828 0 1.5.672 1.5 1.5V5c0 .552-.448 1-1 1s-1-.448-1-1V5H7v.54l6.562 5.625c.512.44.512 1.232 0 1.671L7 18.46V19h10c.552 0 1 .448 1 1s-.448 1-1 1H6.5C5.672 21 5 20.328 5 19.5v-1.27c0-.438.191-.854.524-1.139l5.94-4.091L5.524 6.909C5.191 6.624 5 6.208 5 5.77V4.5z" />
                                  </svg>
                                </button>
                              </div>
                            </td>
                            <td className="px-3 py-2 align-top">
                              <div className="flex items-center gap-2">
                                <input type="range" min={0} max={100} step={1} value={row.weight} onChange={(e) => setWeightCapped(row.setWeight, e.target.value, row.others)} className="flex-1 max-w-[120px] h-2 accent-emerald-500" />
                                <span className="text-[#8c8c8c] w-7">{row.weight}%</span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-[#1a1a1a]">
                          <td colSpan={3} className="px-3 py-2 text-right text-[11px] font-medium text-[#8c8c8c]">Total</td>
                          <td className={cx("px-3 py-2 text-[11px] font-medium", finWeightsSum === 100 ? "text-emerald-500" : finWeightsSum > 100 ? "text-amber-500" : "text-[#8c8c8c]")}>{finWeightsSum}%</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>
            </div>
            <div className="px-4 py-3 border-t border-[#303030] flex justify-end">
              <button type="button" onClick={() => setShowNormalizationModal(false)} className={cx(ui.btnPrimary, "h-8 px-3 text-[11px]")}>Apply</button>
            </div>
          </div>
        </div>
      )}
      {/* Add truncate modal */}
      {showTruncateModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
          onClick={() => {
            setShowTruncateModal(false);
            setSelectedNormalizationRow(null);
          }}
        >
          <div
            className={cx(
              ui.radius,
              "bg-[#141414] border border-[#303030] max-w-[420px] w-full max-h-[90vh] overflow-hidden flex flex-col shadow-xl",
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#303030]">
              <span className="text-[14px] font-medium text-[#d9d9d9]">Add truncate</span>
              <button
                type="button"
                onClick={() => {
                  setShowTruncateModal(false);
                  setSelectedNormalizationRow(null);
                }}
                className="text-[#8c8c8c] hover:text-[#d9d9d9] p-1"
              >
                ✕
              </button>
            </div>
            <div className="overflow-auto p-4 space-y-4">
              {selectedNormalizationRow && (
                <div className="text-[11px] text-[#8c8c8c]">
                  <div className="font-medium text-[#d9d9d9] mb-1">Normalization context</div>
                  <div>Date: {selectedNormalizationRow.date}</div>
                </div>
              )}
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-medium text-[#d9d9d9]">
                    t_end_trunc
                    <input
                      type="number"
                      value={truncateForm.tEndTrunc}
                      onChange={(e) =>
                        setTruncateForm((prev) => ({
                          ...prev,
                          tEndTrunc: e.target.value,
                        }))
                      }
                      className={cx(ui.input, "mt-1 h-8 text-[12px]")}
                      placeholder="Enter t_end_trunc"
                    />
                  </label>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-medium text-[#d9d9d9]">
                    Fold size
                    <select
                      value={truncateForm.foldSize}
                      onChange={(e) =>
                        setTruncateForm((prev) => ({
                          ...prev,
                          foldSize: e.target.value,
                        }))
                      }
                      className={cx(ui.input, "mt-1 h-8 text-[12px]")}
                    >
                      <option value="12">12</option>
                      <option value="24">24</option>
                      <option value="48">48</option>
                    </select>
                  </label>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-[#303030] px-4 py-3 bg-[#101010]">
              <button
                type="button"
                onClick={() => {
                  setShowTruncateModal(false);
                  setSelectedNormalizationRow(null);
                }}
                className={cx(ui.btnGhost, "h-8 px-3 text-[12px]")}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  // Placeholder: here in future we'll persist truncate settings
                  // For now just close modal.
                  setShowTruncateModal(false);
                  setSelectedNormalizationRow(null);
                }}
                className={cx(ui.btn, "h-8 px-3 text-[12px]")}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Formulas info modal (read-only) — opens when Details ⓘ is clicked */}
      {showHyperoptDetailsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => setShowHyperoptDetailsModal(false)}>
          <div className={cx(ui.radius, "bg-[#141414] border border-[#303030] max-w-[720px] w-full max-h-[90vh] overflow-hidden flex flex-col shadow-xl")} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#303030]">
              <span className="text-[14px] font-medium text-[#d9d9d9]">Formulas info (read-only)</span>
              <button type="button" onClick={() => setShowHyperoptDetailsModal(false)} className="text-[#8c8c8c] hover:text-[#d9d9d9] p-1">✕</button>
            </div>
            <div className="overflow-auto p-4">
              <div className={cx(ui.radius, ui.panelMuted, "p-3")}>
                <div className="text-[12px] font-medium text-[#d9d9d9] mb-3">Normalization formulas</div>
                <div className="p-3 pt-0 space-y-3 border-t border-[#303030]">
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-medium text-[#d9d9d9]">Score formula</div>
                    <div className="flex flex-wrap items-center gap-3 gap-y-2">
                      <span className="text-[11px] text-[#a6a6a6]">{finalScoreFormula}</span>
                      <div className="min-w-[200px] flex-1 max-w-[400px] rounded-md border border-[#303030] bg-[#0f0f0f] px-3 py-2 text-[11px] font-mono text-[#d9d9d9]">
                        {finFinalFormulaCode ? renderFormulaWithVariables(finFinalFormulaCode) : <span className="text-[#595959]">—</span>}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-medium text-[#d9d9d9]">Stability Formula</div>
                    <div className="flex flex-wrap items-center gap-3 gap-y-2">
                      <span className="text-[11px] text-[#a6a6a6]">{finStabilityFormula}</span>
                      <div className="min-w-[200px] flex-1 max-w-[400px] rounded-md border border-[#303030] bg-[#0f0f0f] px-3 py-2 text-[11px] font-mono text-[#d9d9d9]">
                        {finStabilityFormulaCode ? renderFormulaWithVariables(finStabilityFormulaCode) : <span className="text-[#595959]">—</span>}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-[11px] font-medium text-[#d9d9d9]">Stability weights (sum ≤ 100%)</div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-4">
                      {[
                        { label: "StabWeightMFE", val: finStabMfeWeight },
                        { label: "StabWeightMAE", val: finStabMaeWeight },
                        { label: "StabWeightAIR", val: finStabAirWeight },
                        { label: "StabWeightHitRate", val: finStabHitRateWeight },
                      ].map((s) => (
                        <div key={s.label} className="flex items-center gap-2">
                          <span className="text-[10px] text-[#8c8c8c] shrink-0">{s.label}</span>
                          <span className="text-[#d9d9d9] text-[11px]">{s.val}%</span>
                        </div>
                      ))}
                    </div>
                    <div className="text-[10px] text-[#8c8c8c]">Total: {finStabWeightsSum}%</div>
                  </div>
                  <div className="text-[11px] font-medium text-[#d9d9d9]">Normalization metrics formulas and weights</div>
                  <div className="overflow-x-auto border border-[#303030] rounded-lg">
                    <table className="w-full text-[11px] border-collapse">
                      <thead>
                        <tr className="bg-[#1a1a1a] text-[#8c8c8c]">
                          <th className="px-3 py-2 text-left font-medium border-b border-[#303030] w-24">Metrics</th>
                          <th className="px-3 py-2 text-left font-medium border-b border-[#303030] w-32">Formula</th>
                          <th className="px-3 py-2 text-left font-medium border-b border-[#303030] min-w-[200px]">Formula Code</th>
                          <th className="px-3 py-2 text-left font-medium border-b border-[#303030]">Weight</th>
                        </tr>
                      </thead>
                      <tbody className="text-[#d9d9d9]">
                        <tr className="border-b border-[#303030]">
                          <td className="px-3 py-2 text-[#a6a6a6] align-top">Stability</td>
                          <td className="px-3 py-2 align-top">{finStabilityFormula}</td>
                          <td className="px-3 py-2 align-top min-w-[200px]">
                            <div className="rounded border border-[#303030] bg-[#0f0f0f] px-2 py-1.5 text-[11px] font-mono">
                              {finStabilityFormulaCode ? renderFormulaWithVariables(finStabilityFormulaCode) : <span className="text-[#595959]">—</span>}
                            </div>
                          </td>
                          <td className="px-3 py-2 align-top">{finStabilityWeight}%</td>
                        </tr>
                        {[
                          { metric: "MFE", formula: finMfeFormula, formulaCode: finMfeFormulaCode, weight: finMfeWeight },
                          { metric: "MAE", formula: finMaeFormula, formulaCode: finMaeFormulaCode, weight: finMaeWeight },
                          { metric: "AIR", formula: finAirFormula, formulaCode: finAirFormulaCode, weight: finAirWeight },
                          { metric: "Hit rate", formula: finHitRateFormula, formulaCode: finHitRateFormulaCode, weight: finHitRateWeight },
                        ].map((row) => (
                          <tr key={row.metric} className="border-b border-[#303030]">
                            <td className="px-3 py-2 text-[#a6a6a6] align-top">{row.metric}</td>
                            <td className="px-3 py-2 align-top">{row.formula}</td>
                            <td className="px-3 py-2 align-top min-w-[200px]">
                              <div className="rounded border border-[#303030] bg-[#0f0f0f] px-2 py-1.5 text-[11px] font-mono">
                                {row.formulaCode ? renderFormulaWithVariables(row.formulaCode) : <span className="text-[#595959]">—</span>}
                              </div>
                            </td>
                            <td className="px-3 py-2 align-top">{row.weight}%</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-[#1a1a1a]">
                          <td colSpan={3} className="px-3 py-2 text-right text-[11px] font-medium text-[#8c8c8c]">Total</td>
                          <td className={cx("px-3 py-2 text-[11px] font-medium", finWeightsSum === 100 ? "text-emerald-500" : finWeightsSum > 100 ? "text-amber-500" : "text-[#8c8c8c]")}>{finWeightsSum}%</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>
            </div>
            <div className="px-4 py-3 border-t border-[#303030] flex justify-end">
              <button type="button" onClick={() => setShowHyperoptDetailsModal(false)} className={cx(ui.btn, "h-8 px-3 text-[11px]")}>Close</button>
            </div>
          </div>
        </div>
      )}
      {/* HeatMap configurator modal — opens when Configure HeatMap is clicked */}
      {heatMapConfigModalId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => setHeatMapConfigModalId(null)}>
          <div className={cx(ui.radius, "bg-[#141414] border border-[#303030] w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-xl")} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#303030]">
              <span className="text-[14px] font-medium text-[#d9d9d9]">Configure HeatMap</span>
              <button type="button" onClick={() => setHeatMapConfigModalId(null)} className="text-[#8c8c8c] hover:text-[#d9d9d9] p-1">✕</button>
            </div>
            <div className="overflow-auto p-4">
              <HeatMapConfigurator
                indicators={indicators}
                onGenerate={(config) => handleGenerateHeatMap(config, heatMapConfigModalId)}
              />
            </div>
          </div>
        </div>
      )}
      {/* HeatMap view modal — opens when Show heatmap is clicked */}
      {heatMapViewModalId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => setHeatMapViewModalId(null)}>
          <div className={cx(ui.radius, "bg-[#141414] border border-[#303030] w-full max-w-[95vw] max-h-[90vh] overflow-hidden flex flex-col shadow-xl")} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#303030]">
              <span className="text-[14px] font-medium text-[#d9d9d9]">Heatmap</span>
              <div className="flex items-center gap-2">
                {generatedHeatMap && generatedHeatMap.runId === heatMapViewModalId && (
                  <button type="button" onClick={() => { setGeneratedHeatMap(null); setHeatMapViewModalId(null); }} className={cx(ui.btn, "h-7 px-2 text-[10px]")}>
                    Clear HeatMap
                  </button>
                )}
                <button type="button" onClick={() => setHeatMapViewModalId(null)} className="text-[#8c8c8c] hover:text-[#d9d9d9] p-1">✕</button>
              </div>
            </div>
            <div className="overflow-auto p-4 flex-1 min-h-0">
              {generatedHeatMap && generatedHeatMap.runId === heatMapViewModalId ? (
                <HeatMapView
                  heatMapData={currentHeatMapData}
                  config={generatedHeatMap.config}
                  onCellClick={(cell) => handleHeatMapCellClick(cell, heatMapViewModalId)}
                  onZoomOut={() => handleHeatMapZoomOut(heatMapViewModalId)}
                  onResetZoom={() => handleHeatMapResetZoom(heatMapViewModalId)}
                  canZoomOut={generatedHeatMap.zoomStack.length > 0}
                  canReset={generatedHeatMap.zoomStack.length > 0}
                  zoomLevel={generatedHeatMap.zoomStack.length}
                  zoomLevelLabel={generatedHeatMap.zoomStack.length > 0 ? generatedHeatMap.zoomStack[generatedHeatMap.zoomStack.length - 1].label : "Full heatmap"}
                />
              ) : (
                <div className="py-8 text-center text-[#8c8c8c] text-[13px]">
                  <p className="mb-3">No heatmap generated for this run.</p>
                  <button type="button" onClick={() => { setHeatMapViewModalId(null); setHeatMapConfigModalId(heatMapViewModalId); }} className={cx(ui.btnPrimary, "h-8 px-3 text-[12px]")}>
                    Configure &amp; Generate HeatMap
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {editingIndicator && (
        <EditIndicatorModal 
          indicator={editingIndicator} 
          onClose={() => setEditingIndicator(null)} 
          onSave={handleEditIndicator} 
        />
      )}
    </div>
  );
});

/* ====================== Code Editor ====================== */

const CodeEditor = memo(({ value, onChange, language = "python" }) => {
  const lines = useMemo(() => {
    const count = (value || "").split("\n").length;
    return Array.from({ length: Math.max(1, count) }, (_, i) => i + 1);
  }, [value]);

  const copy = useCallback(() => {
    try {
      navigator.clipboard?.writeText(value || "");
    } catch {
      // no-op
    }
  }, [value]);

  return (
    <div className={cx(ui.radius, ui.panel, "overflow-hidden")}>
      <div className={cx("flex items-center justify-between px-3 py-2", ui.panelMuted, "border-0 border-b", ui.divider)}>
        <div className="flex items-center gap-2">
          <span className="rounded-md border border-[#303030] bg-[#0f0f0f] px-2 py-0.5 text-[10px] text-[#a6a6a6]">{language}</span>
          <span className="text-[10px] text-[#8c8c8c]">Monospace • Tabs preserved</span>
        </div>
        <button type="button" onClick={copy} className={cx(ui.btn, "px-2 py-1 text-[10px]")}>
          Copy
        </button>
      </div>

      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 w-12 border-r border-[#303030] bg-[#0f0f0f] px-2 py-2 text-right text-[10px] text-[#595959] select-none">
          {lines.map((n) => (
            <div key={n} className="leading-5">
              {n}
            </div>
          ))}
        </div>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          spellCheck={false}
          className="block w-full resize-none bg-[#0f0f0f] px-3 py-2 pl-14 text-[12px] font-mono leading-5 text-[#d9d9d9] focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
          rows={18}
        />
      </div>
    </div>
  );
});

/* ====================== Modals ====================== */


const DEFAULT_CUSTOM_CODE = "import pandas as pd\n\ndef run(df: pd.DataFrame, **kwargs):\n    # Indicator implementation\n    return {}";

const PARAM_TYPES = ["int", "float", "enum", "bool"];

const INDICATOR_CATEGORIES = [
  "Trend", "Momentum", "Volatility", "Volume", "Structure",
  "Stat & Math", "Risk", "Liquidity", "Sentiment", "Composite", "Utility",
];

const AddIndicatorPageModal = memo(function AddIndicatorPageModal({ onClose, onAdd }) {
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
    setParameters((prev) => [...prev, { name: "", type: "int", default_value: "", min: "", max: "", step: "" }]);
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
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Parameters (first) */}
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
                          <option key={t} value={t}>{t}</option>
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
              <button type="button" onClick={addParam} className={cx("text-[11px]", ui.textMuted, "hover:text-[#d9d9d9]")}>
                + Add parameter
              </button>
            </div>
          </div>
        </div>

        {/* Code (editable, second) */}
        <div>
          <label className={cx("block mb-1 text-xs", ui.textMuted)}>Code</label>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className={cx("text-[11px] font-mono text-[#a6a6a6] p-3 rounded-lg bg-[#0f0f0f] border border-[#303030] w-full min-h-[140px] max-h-40 resize-y", ui.input)}
            placeholder="Indicator code..."
            spellCheck={false}
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className={ui.btn}>Cancel</button>
          <button onClick={handleAdd} className={ui.btnPrimary} disabled={!displayName.trim()}>
            Add indicator
          </button>
        </div>
      </div>
    </ModalShell>
  );
});

/* ====================== Main App ====================== */

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);

  // Forgot password (mock)
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");

  // Create strategy modal (mock)
  const [showCreate, setShowCreate] = useState(false);
  const [newStrategyName, setNewStrategyName] = useState("");
  const [newStrategyTemplate, setNewStrategyTemplate] = useState("Strategy Builder");
  const [newStrategyDescription, setNewStrategyDescription] = useState("");

  // Navigation
  const [activeSection, setActiveSection] = useState("Strategies");
  const [settingsSubSection, setSettingsSubSection] = useState("indicators"); // "indicators" | "formulas"

  // Strategies
  const [strategies, setStrategies] = useState(INITIAL_STRATEGIES);
  const [expandedStrategies, setExpandedStrategies] = useState(() => new Set());
  const [selected, setSelected] = useState(null); // {strategyId, versionId}
  const [strategyCode, setStrategyCode] = useState("");

  // Detail tabs
  const [detailTab, setDetailTab] = useState("Strategy Builder"); // "Strategy Builder" | "Strategy Code"
  const [actionsDropdownOpen, setActionsDropdownOpen] = useState(false);

  // Builder fields (mock)
  const [builderStage] = useState(1);
  const [builderPairs, setBuilderPairs] = useState(["BTC/USDT"]);
  const [builderTimeRange, setBuilderTimeRange] = useState("15m");
  const [builderTimeFrameStart, setBuilderTimeFrameStart] = useState("2020-01-01");
  const [builderTimeFrameEnd, setBuilderTimeFrameEnd] = useState("2023-12-31");

  // Edit description modal
  const [showEditDescription, setShowEditDescription] = useState(false);
  const [editDescriptionDraft, setEditDescriptionDraft] = useState("");

  // Filters
  const [filterName, setFilterName] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterOwner, setFilterOwner] = useState("All");

  // Queue panel (header): list of jobs with drag-and-drop reorder
  const [showQueuePanel, setShowQueuePanel] = useState(false);
  const [queueItems, setQueueItems] = useState(() => [
    { id: "q1", strategyName: "Hyperopt Ema bounce", version: "v1", status: "In progress", estimationTime: "5m" },
    { id: "q2", strategyName: "Hyperopt Ema bounce", version: "v2", status: "Waiting", estimationTime: "10m" },
    { id: "q3", strategyName: "RSI Mean Reversion", version: "v1", status: "Waiting", estimationTime: "13m" },
  ]);
  const handleQueueReorder = useCallback((newOrder) => {
    setQueueItems(newOrder);
  }, []);
  const handleQueueRemove = useCallback((id) => {
    setQueueItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  // Mock role
  const currentUserRole = "Admin";

  // Mock users management (Users section)
  const [users, setUsers] = useState(() => [
    {
      id: 1,
      login: "admin@example.com",
      username: "Admin User",
      role: "Admin",
      status: "Active",
      createdOn: "2025-01-01",
    },
    {
      id: 2,
      login: "quant@example.com",
      username: "Quant Trader",
      role: "Quant",
      status: "Active",
      createdOn: "2025-02-15",
    },
    {
      id: 3,
      login: "old@example.com",
      username: "Old User",
      role: "Quant",
      status: "Deactivated",
      createdOn: "2024-06-10",
    },
  ]);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [userDraft, setUserDraft] = useState({ login: "", username: "", role: "Quant" });
  const [userToEdit, setUserToEdit] = useState(null);
  const [editUserDraft, setEditUserDraft] = useState({ username: "", role: "Quant", status: "Active" });
  const [userToChangePassword, setUserToChangePassword] = useState(null);
  const [userToResetPassword, setUserToResetPassword] = useState(null);

  // Indicators page (mock)
  const [pageIndicators, setPageIndicators] = useState(() => [
    { id: 1, name: "RSI - Relative Strength Index", description: "Momentum oscillator measuring speed and magnitude of price changes", type: "Momentum", indicatorType: "System", status: "Active", createdAt: "2025-01-10" },
    { id: 2, name: "EMA - Exponential Moving Average", description: "Moving average giving more weight to recent prices", type: "Trend", indicatorType: "System", status: "Active", createdAt: "2025-01-12" },
    { id: 3, name: "BB - Bollinger Bands", description: "Volatility bands placed above and below a moving average", type: "Volatility", indicatorType: "System", status: "Archived", createdAt: "2024-11-05" },
  ]);
  const [showAddIndicatorPage, setShowAddIndicatorPage] = useState(false);

  // Formulas (Settings → Formulas)
  const FORMULA_HYPEROPT_TYPES = ["BIAS", "Brute Force"];
  const FORMULA_TYPES = ["Score", "Metric", "Stability"];
  const FORMULA_SUBTYPES = ["Intermediate score", "Final score", "Stability", "MFE", "MAE", "AIR", "HitRate"];
  const FORMULA_MODAL_VARIABLES = [
    "MFE", "MAE", "AIR", "HitRate", "Stability",
    "weightMFE", "normMFE", "weightMAE", "normMAE", "weightAIR", "normAIR", "weightHitRate", "normHitRate",
    "midMFE", "midMAE", "midAIR", "midHitRate",
  ];
  const FORMULA_MODAL_FUNCTIONS = [
    { label: "IF", template: "IF(cond; a; b)" },
    { label: "IFS", template: "IFS(c1; v1; c2; v2; default)" },
    { label: "AND", template: "AND(a; b; c)" },
    { label: "OR", template: "OR(a; b)" },
    { label: "NOT", template: "NOT(a)" },
    { label: "IFERROR", template: "IFERROR(expr; fallback)" },
    { label: "ABS", template: "ABS(x)" },
    { label: "MIN", template: "MIN(a; b; c)" },
    { label: "MAX", template: "MAX(a; b; c)" },
    { label: "ROUND", template: "ROUND(x; digits)" },
  ];
  const FORMULA_MODAL_OPERATORS = ["+", "-", "*", "/", "^", "=", "<>", "<", "<=", ">", ">="];
  const formulaModalFormulaRef = useRef(null);
  const formulaModalMirrorRef = useRef(null);
  const [formulaModalSelection, setFormulaModalSelection] = useState({ start: 0, end: 0 });
  const formulaModalVariableRegex = useMemo(
    () => new RegExp("\\b(" + [...FORMULA_MODAL_VARIABLES].sort((a, b) => b.length - a.length).join("|") + ")\\b", "g"),
    [],
  );
  const renderFormulaModalWithVariables = useCallback(
    (text) => {
      try {
        const str = typeof text === "string" ? text : String(text ?? "");
        if (!str) return null;
        const parts = str.split(formulaModalVariableRegex);
        return parts.map((part, i) =>
          FORMULA_MODAL_VARIABLES.includes(part) ? (
            <span key={i} className="rounded bg-emerald-500/25 px-0.5 text-emerald-400">{part}</span>
          ) : (
            part
          )
        );
      } catch {
        return typeof text === "string" ? text : null;
      }
    },
    [formulaModalVariableRegex],
  );
  const insertIntoFormulaModal = useCallback((snippet) => {
    setFormulaDraft((prev) => {
      const textarea = formulaModalFormulaRef.current;
      const start = textarea?.selectionStart ?? formulaModalSelection.start ?? (prev.formula ?? "").length;
      const end = textarea?.selectionEnd ?? formulaModalSelection.end ?? start;
      const formula = prev.formula ?? "";
      const before = formula.slice(0, start);
      const after = formula.slice(end);
      const next = before + snippet + after;
      const newPos = start + snippet.length;
      queueMicrotask(() => {
        const el = formulaModalFormulaRef.current;
        if (el) {
          el.focus();
          el.selectionStart = newPos;
          el.selectionEnd = newPos;
        }
        setFormulaModalSelection({ start: newPos, end: newPos });
      });
      return { ...prev, formula: next };
    });
  }, [formulaModalSelection.start, formulaModalSelection.end]);
  const [formulas, setFormulas] = useState(() => [
    { id: 1, name: "Intermediate score", hyperoptType: "Brute Force", type: "Score", subType: "Intermediate score", formula: "  weightMFE * normMFE\n- weightMAE * normMAE\n+ weightAIR * normAIR\n+ weightHitRate * normHitRate", owner: "System" },
    { id: 2, name: "MFE", hyperoptType: "Brute Force", type: "Metric", subType: "MFE", formula: "1/(1+EXP(-1*(MFE - MEDIAN(MFE)) / (QUARTILE.INC(MFE,3) - QUARTILE.INC(MFE,1))))", owner: "System" },
    { id: 3, name: "MAE", hyperoptType: "Brute Force", type: "Metric", subType: "MAE", formula: "1/(1+EXP(1*(MAE - MEDIAN(MAE)) / (QUARTILE.INC(MAE,3) - QUARTILE.INC(MAE,1))))", owner: "System" },
    { id: 4, name: "AIR", hyperoptType: "Brute Force", type: "Metric", subType: "AIR", formula: "1/(1+EXP(-1*(AIR - MEDIAN(AIR)) / (QUARTILE.INC(AIR,3) - QUARTILE.INC(AIR,1))))", owner: "System" },
    { id: 5, name: "HitRate", hyperoptType: "Brute Force", type: "Metric", subType: "HitRate", formula: "1/(1+EXP(-1*(HitRate - MEDIAN(HitRate)) / (QUARTILE.INC(HitRate,3) - QUARTILE.INC(HitRate,1))))", owner: "System" },
    { id: 6, name: "Final score", hyperoptType: "Brute Force", type: "Score", subType: "Final score", formula: "  weightMFE * normMFE\n- weightMAE * normMAE\n+ weightAIR * normAIR\n+ weightHitRate * normHitRate", owner: "System" },
    { id: 7, name: "Stability (formula)", hyperoptType: "Brute Force", type: "Stability", subType: "Stability", formula: "Your Stability formula can be placed here 😁", owner: "System" },
    { id: 8, name: "Stability (metric)", hyperoptType: "Brute Force", type: "Metric", subType: "Stability", formula: "1/(1+EXP(-1*(Stability - MEDIAN(Stability)) / (QUARTILE.INC(Stability,3) - QUARTILE.INC(Stability,1))))", owner: "System" },
  ]);
  const [showFormulaModal, setShowFormulaModal] = useState(false);
  const [formulaEditingId, setFormulaEditingId] = useState(null);
  const [formulaDraft, setFormulaDraft] = useState({ name: "", hyperoptType: "BIAS", type: "Score", subType: "Intermediate score", formula: "" });
  const handleOpenAddFormula = useCallback(() => {
    setFormulaEditingId(null);
    setFormulaDraft({ name: "", hyperoptType: "BIAS", type: "Score", subType: "Intermediate score", formula: "" });
    setShowFormulaModal(true);
  }, []);
  const handleEditFormula = useCallback((formula) => {
    setFormulaEditingId(formula.id);
    setFormulaDraft({ name: formula.name ?? "", hyperoptType: formula.hyperoptType, type: formula.type, subType: formula.subType, formula: formula.formula });
    setShowFormulaModal(true);
  }, []);
  const handleSaveFormula = useCallback(() => {
    if (formulaEditingId != null) {
      setFormulas((prev) => prev.map((f) => (f.id === formulaEditingId ? { ...f, ...formulaDraft } : f)));
    } else {
      setFormulas((prev) => [...prev, { id: Date.now(), owner: "bogdan", ...formulaDraft }]);
    }
    setShowFormulaModal(false);
  }, [formulaDraft, formulaEditingId]);
  const handleDeleteFormula = useCallback((formula) => {
    setFormulas((prev) => prev.filter((f) => f.id !== formula.id));
  }, []);

  const owners = useMemo(() => Array.from(new Set(strategies.map((s) => s.owner))), [strategies]);
  const totalVersions = useMemo(() => strategies.reduce((acc, s) => acc + s.versions.length, 0), [strategies]);

  const selectedStrategy = useMemo(() => {
    if (!selected) return null;
    const s = strategies.find((x) => x.id === selected.strategyId);
    const v = s?.versions.find((x) => x.id === selected.versionId);
    if (!s || !v) return null;
    return { s, v };
  }, [selected, strategies]);

  const filteredStrategies = useMemo(() => {
    return strategies.filter((strategy) => {
      if (filterName && !strategy.name.toLowerCase().includes(filterName.toLowerCase())) return false;
      if (filterOwner !== "All" && strategy.owner !== filterOwner) return false;

      if (filterStatus !== "All") {
        const hasStatus = strategy.versions.some((v) => {
          if (filterStatus === "Published") return v.status === "Active";
          if (filterStatus === "Deactivated") return v.status === "Disabled";
          if (filterStatus === "Not Verified") return false;
          return v.status === filterStatus;
        });
        if (!hasStatus) return false;
      }
      return true;
    });
  }, [strategies, filterName, filterOwner, filterStatus]);

  // Users helpers (mock)
  const handleOpenCreateUser = useCallback(() => {
    setUserDraft({ login: "", username: "", role: "Quant" });
    setShowCreateUser(true);
  }, []);

  const handleCreateUser = useCallback(() => {
    const now = new Date();
    const createdOn = now.toISOString().slice(0, 10);
    setUsers((prev) => [
      ...prev,
      {
        id: Date.now(),
        login: userDraft.login,
        username: userDraft.username,
        role: userDraft.role,
        status: "Active",
        createdOn,
      },
    ]);
    setShowCreateUser(false);
  }, [userDraft, setUsers]);

  const handleOpenEditUser = useCallback((user) => {
    setUserToEdit(user);
    setEditUserDraft({ username: user.username, role: user.role, status: user.status });
  }, []);

  const handleSaveEditUser = useCallback(() => {
    if (!userToEdit) return;
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userToEdit.id
          ? { ...u, username: editUserDraft.username, role: editUserDraft.role, status: editUserDraft.status }
          : u
      )
    );
    setUserToEdit(null);
  }, [userToEdit, editUserDraft]);

  const handleCloseChangePassword = useCallback(() => setUserToChangePassword(null), []);
  const handleCloseResetPassword = useCallback(() => setUserToResetPassword(null), []);

  const handleAddPageIndicator = useCallback((payload) => {
    setPageIndicators((prev) => [
      ...prev,
      { id: Date.now(), name: payload.name, description: payload.description, type: payload.group, status: "Active", createdAt: new Date().toISOString().slice(0, 10) },
    ]);
    setShowAddIndicatorPage(false);
  }, []);
  const handleIndicatorArchiveOrActivate = useCallback((ind) => {
    setPageIndicators((prev) => prev.map((i) => (i.id === ind.id ? { ...i, status: i.status === "Archived" ? "Active" : "Archived" } : i)));
  }, []);
  const handleIndicatorUpdate = useCallback(() => { /* mock: no action */ }, []);

  // In-app sanity tests
  useEffect(() => {
    console.assert(Array.isArray(strategies) && strategies.length > 0, "[Test] strategies should be a non-empty array");
    console.assert(typeof totalVersions === "number" && totalVersions > 0, "[Test] totalVersions should be > 0");
    const ids = strategies.map((s) => s.id);
    console.assert(new Set(ids).size === ids.length, "[Test] strategy ids should be unique");
    console.assert(SECTIONS.includes("Strategies"), "[Test] sections include Strategies");
  }, [strategies, totalVersions]);

  const toggleExpanded = useCallback((id) => {
    setExpandedStrategies((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const handleSectionChange = useCallback((section) => {
    // Backtesting stays disabled; Strategies and Users are available
    if (section === "Backtesting") return;
    setActiveSection(section);
    setSelected(null);
  }, []);

  const handleSelectVersion = useCallback(
    (strategyId, versionId) => {
      setSelected({ strategyId, versionId });
      const s = strategies.find((x) => x.id === strategyId);
      const v = s?.versions.find((x) => x.id === versionId);
      setStrategyCode(v?.code ?? "");
      setDetailTab("Strategy Builder");
    },
    [strategies]
  );

  const openEditDescription = useCallback(() => {
    if (!selectedStrategy) return;
    setEditDescriptionDraft(selectedStrategy.v.description || "");
    setShowEditDescription(true);
  }, [selectedStrategy]);

  const saveEditDescription = useCallback(() => {
    if (!selectedStrategy) return;
    const { s, v } = selectedStrategy;
    setStrategies((prev) =>
      prev.map((st) => {
        if (st.id !== s.id) return st;
        return {
          ...st,
          versions: st.versions.map((ver) => (ver.id === v.id ? { ...ver, description: editDescriptionDraft } : ver)),
        };
      })
    );
    setShowEditDescription(false);
  }, [editDescriptionDraft, selectedStrategy]);

  const handleCreateStrategy = useCallback(() => {
    // mock behavior: just close + reset
    setShowCreate(false);
    setNewStrategyName("");
    setNewStrategyTemplate("Strategy Builder");
    setNewStrategyDescription("");
  }, []);

  const handleLogin = useCallback(() => setLoggedIn(true), []);

  const handleForgotSend = useCallback(() => {
    alert(`Reset link sent to: ${forgotEmail || "(empty)"}`);
    setShowForgot(false);
    setForgotEmail("");
  }, [forgotEmail]);

  const handleLogout = useCallback(() => {
    setLoggedIn(false);
    setSelected(null);
    setActiveSection("Strategies");
    setExpandedStrategies(new Set());
  }, []);

  if (!loggedIn) {
    return (
      <>
        <LoginScreen onLogin={handleLogin} onForgotPassword={() => setShowForgot(true)} />
        {showForgot && (
          <ForgotPasswordModal
            email={forgotEmail}
            onEmailChange={setForgotEmail}
            onClose={() => {
              setShowForgot(false);
              setForgotEmail("");
            }}
            onSend={handleForgotSend}
          />
        )}
      </>
    );
  }

  const current = selectedStrategy?.s ?? null;
  const versions = current?.versions ?? [];

  return (
    <div className={cx("min-h-screen", ui.page, "flex flex-col")}>
      <Header
        onLogout={handleLogout}
        sections={SECTIONS}
        activeSection={activeSection}
        onSectionChange={handleSectionChange}
        settingsSubSection={settingsSubSection}
        onSettingsSubChange={setSettingsSubSection}
        strategiesCount={strategies.length}
        disabledSections={DISABLED_SECTIONS}
        queueOpen={showQueuePanel}
        onQueueToggle={() => setShowQueuePanel((v) => !v)}
        onQueueClose={() => setShowQueuePanel(false)}
        queueItems={queueItems}
        onQueueReorder={handleQueueReorder}
        onQueueRemove={handleQueueRemove}
      />

      <main className="flex-1 overflow-auto p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-[16px] font-semibold text-[#f5f5f5]">{activeSection === "Settings" ? `${activeSection} · ${settingsSubSection === "indicators" ? "Indicators" : "Formulas"}` : activeSection}</h1>
            <p className={cx("mt-1 text-[12px]", ui.textMuted)}>
              {activeSection === "Users"
                ? "Manage application users (mock data only)."
                : activeSection === "Settings" && settingsSubSection === "indicators"
                ? "Manage indicator library (mock)."
                : activeSection === "Settings" && settingsSubSection === "formulas"
                ? "Manage formulas (Hyperopt Type, Type, SubType)."
                : "Manage and configure your strategies."}
            </p>
          </div>

          {activeSection === "Strategies" && !selectedStrategy && (
            <button onClick={() => setShowCreate(true)} className={ui.btnPrimary}>
              + Add strategy
            </button>
          )}

          {activeSection === "Users" && (
            <button onClick={handleOpenCreateUser} className={ui.btnPrimary}>
              + Create user
            </button>
          )}
          {activeSection === "Settings" && settingsSubSection === "indicators" && (
            <button onClick={() => setShowAddIndicatorPage(true)} className={ui.btnPrimary}>
              Add indicator
            </button>
          )}
          {activeSection === "Settings" && settingsSubSection === "formulas" && (
            <button onClick={handleOpenAddFormula} className={ui.btnPrimary}>
              Add Formula
            </button>
          )}
        </div>

        {/* Strategies list */}
        {activeSection === "Strategies" && !selectedStrategy && (
          <div className={cx(ui.radius, ui.panel, "overflow-hidden")}>
            <div className={cx("flex items-center gap-3 px-4 py-3", ui.panelMuted, "border-0 border-b", ui.divider)}>
              <div className={cx("text-[12px]", ui.textSubtle)}>
                {strategies.length} strategies / {totalVersions} versions
              </div>

              <div className="ml-auto flex items-center gap-3">
                <input
                  value={filterName}
                  onChange={(e) => setFilterName(e.target.value)}
                  className={cx(ui.input, "h-8 w-64 text-[12px]")}
                  placeholder="Search strategy..."
                />

                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className={ui.select}>
                  <option value="All">All statuses</option>
                  <option value="Draft">Draft</option>
                  <option value="Not Verified">Not Verified</option>
                  <option value="Published">Published</option>
                  <option value="Deactivated">Deactivated</option>
                </select>

                {currentUserRole === "Admin" && (
                  <select value={filterOwner} onChange={(e) => setFilterOwner(e.target.value)} className={ui.select}>
                    <option value="All">All owners</option>
                    {owners.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            <table className="w-full border-collapse text-[12px]">
              <thead className="bg-[#1f1f1f] text-left text-[12px] text-[#8c8c8c]">
                <tr>
                  <th className="px-4 py-3 border-b border-[#303030] font-medium">Strategy name</th>
                  <th className="px-2 py-3 border-b border-[#303030] font-medium">Description</th>
                  <th className="px-2 py-3 border-b border-[#303030] font-medium">Current stage</th>
                  <th className="px-2 py-3 border-b border-[#303030] font-medium">Status</th>
                  <th className="px-2 py-3 border-b border-[#303030] font-medium">Owner</th>
                  <th className="px-2 py-3 border-b border-[#303030] font-medium">Created at</th>
                  <th className="px-2 py-3 border-b border-[#303030] font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredStrategies.map((strategy) => (
                  <StrategyRow
                    key={strategy.id}
                    strategy={strategy}
                    isExpanded={expandedStrategies.has(strategy.id)}
                    onToggle={toggleExpanded}
                    onSelectVersion={handleSelectVersion}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Strategy detail */}
        {activeSection === "Strategies" && selectedStrategy && (
          <div className={cx(ui.radius, ui.panel, "p-5 space-y-5")}>
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-[14px] font-semibold text-[#f5f5f5] truncate">{selectedStrategy.s.name}</h2>

                  <select
                    value={selectedStrategy.v.id}
                    onChange={(e) => handleSelectVersion(selectedStrategy.s.id, Number(e.target.value))}
                    className={ui.select}
                    aria-label="Version"
                    title="Version"
                  >
                    {versions.map((v) => (
                      <option key={v.id} value={v.id}>
                        v{v.version}
                      </option>
                    ))}
                  </select>

                  <Badge status={selectedStrategy.v.status} />
                </div>

                <p className={cx("mt-1 text-[12px]", ui.textMuted)}>
                  Owner: <span className="text-[#d9d9d9]">{selectedStrategy.s.owner}</span>
                </p>

                <div className={cx("mt-1 flex items-start gap-2 text-[12px]", ui.textMuted)}>
                  <div className="min-w-0">
                    Description: <span className="text-[#d9d9d9]">{selectedStrategy.v.description || "—"}</span>
                  </div>
                  <button
                    onClick={openEditDescription}
                    className="inline-flex h-5 w-5 items-center justify-center rounded border border-[#303030] bg-[#0f0f0f] text-[#a6a6a6] hover:bg-[#1f1f1f]"
                    title="Edit description"
                    aria-label="Edit description"
                  >
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" aria-hidden="true">
                      <path
                        d="M16.9 3.7a2.1 2.1 0 0 1 3 3L8.4 18.2 4 19.4l1.2-4.4L16.9 3.7z"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinejoin="round"
                        strokeLinecap="round"
                      />
                      <path d="M14.7 5.9l3.4 3.4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
              </div>

              <div
                className="relative"
                onMouseEnter={() => setActionsDropdownOpen(true)}
                onMouseLeave={() => setActionsDropdownOpen(false)}
              >
                <button type="button" className={ui.btnPrimary} aria-haspopup="true" aria-expanded={actionsDropdownOpen}>
                  Actions
                </button>
                {actionsDropdownOpen && (
                  <div className="absolute right-0 top-full z-50 mt-1 min-w-[180px] rounded-md border border-[#303030] bg-[#1a1a1a] py-1 shadow-lg">
                    <button
                      type="button"
                      onClick={() => { alert("Create new version (mock)"); setActionsDropdownOpen(false); }}
                      className="block w-full px-3 py-2 text-left text-[12px] text-[#d9d9d9] hover:bg-[#252525]"
                    >
                      Create new version
                    </button>
                    <button
                      type="button"
                      onClick={() => { alert("Duplicate strategy (mock)"); setActionsDropdownOpen(false); }}
                      className="block w-full px-3 py-2 text-left text-[12px] text-[#d9d9d9] hover:bg-[#252525]"
                    >
                      Duplicate strategy
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Tabs */}
            <div className={cx("border-0 border-b", ui.divider)}>
              <nav className="-mb-px flex gap-4 text-[13px]">
                <button
                  type="button"
                  onClick={() => setDetailTab("Strategy Builder")}
                  className={cx(
                    "px-2 py-2 border-b-2 transition",
                    detailTab === "Strategy Builder"
                      ? "border-emerald-500 text-emerald-200"
                      : "border-transparent text-[#8c8c8c] hover:text-[#d9d9d9]"
                  )}
                >
                  Strategy Builder
                </button>

                <button
                  type="button"
                  onClick={() => setDetailTab("Strategy Code")}
                  className={cx(
                    "px-2 py-2 border-b-2 transition",
                    detailTab === "Strategy Code"
                      ? "border-emerald-500 text-emerald-200"
                      : "border-transparent text-[#8c8c8c] hover:text-[#d9d9d9]"
                  )}
                >
                  Strategy Code
                </button>
              </nav>
            </div>

            {/* Content */}
            {detailTab === "Strategy Builder" && (
              <div className="space-y-4">
                <BuilderStepper
                  activeStage={builderStage}
                  pairs={builderPairs}
                  onPairsChange={setBuilderPairs}
                  timeRange={builderTimeRange}
                  onTimeRangeChange={setBuilderTimeRange}
                  timeFrameStart={builderTimeFrameStart}
                  onTimeFrameStartChange={setBuilderTimeFrameStart}
                  timeFrameEnd={builderTimeFrameEnd}
                  onTimeFrameEndChange={setBuilderTimeFrameEnd}
                />
              </div>
            )}

            {detailTab === "Strategy Code" && (
              <div className="space-y-3">
                <div>
                  <div className="text-[12px] font-medium text-[#d9d9d9]">Strategy code</div>
                  <div className={cx("text-[11px]", ui.textMuted)}>Displayed as Python code.</div>
                </div>
                <CodeEditor value={strategyCode} onChange={setStrategyCode} language="python" />
              </div>
            )}
          </div>
        )}

        {/* Users page (mock) */}
        {activeSection === "Users" && (
          <div className={cx(ui.radius, ui.panel, "overflow-hidden")}>
            <div className={cx("flex items-center justify-between px-4 py-3", ui.panelMuted, "border-0 border-b", ui.divider)}>
              <div>
                <div className="text-[12px] font-medium text-[#d9d9d9]">Users</div>
                <div className={cx("text-[11px]", ui.textMuted)}>Manage logins, roles, and status (mock only).</div>
              </div>
              <span className="rounded-md border border-[#303030] bg-[#0f0f0f] px-2 py-0.5 text-[10px] text-[#8c8c8c]">
                {users.length} users
              </span>
            </div>

            <div className="overflow-auto">
              <table className="w-full border-collapse text-[12px]">
                <thead className="bg-[#1f1f1f] text-left text-[12px] text-[#8c8c8c]">
                  <tr>
                    <th className="px-4 py-3 border-b border-[#303030] font-medium">Login</th>
                    <th className="px-2 py-3 border-b border-[#303030] font-medium">Username</th>
                    <th className="px-2 py-3 border-b border-[#303030] font-medium">Role</th>
                    <th className="px-2 py-3 border-b border-[#303030] font-medium">Status</th>
                    <th className="px-2 py-3 border-b border-[#303030] font-medium">Created On</th>
                    <th className="px-2 py-3 border-b border-[#303030] font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="bg-[#141414] hover:bg-[#1f1f1f] transition-colors">
                      <td className="px-4 py-2 border-b border-[#303030] text-[#d9d9d9]">{user.login}</td>
                      <td className="px-2 py-2 border-b border-[#303030] text-[#d9d9d9]">{user.username}</td>
                      <td className="px-2 py-2 border-b border-[#303030] text-[#a6a6a6]">{user.role}</td>
                      <td className="px-2 py-2 border-b border-[#303030]">
                        <Badge status={user.status} type="status" />
                      </td>
                      <td className="px-2 py-2 border-b border-[#303030] text-[#a6a6a6]">{user.createdOn}</td>
                      <td className="px-2 py-2 border-b border-[#303030]">
                        <UserActionsMenu
                          user={user}
                          onEdit={handleOpenEditUser}
                          onChangePassword={setUserToChangePassword}
                          onResetPassword={setUserToResetPassword}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Indicators page (mock) */}
        {(activeSection === "Settings" && settingsSubSection === "indicators") && (
          <div className={cx(ui.radius, ui.panel, "overflow-hidden")}>
            <div className={cx("flex items-center justify-between px-4 py-3", ui.panelMuted, "border-0 border-b", ui.divider)}>
              <div>
                <div className="text-[12px] font-medium text-[#d9d9d9]">Indicators</div>
                <div className={cx("text-[11px]", ui.textMuted)}>Indicator library (mock).</div>
              </div>
              <span className="rounded-md border border-[#303030] bg-[#0f0f0f] px-2 py-0.5 text-[10px] text-[#8c8c8c]">
                {pageIndicators.length} indicators
              </span>
            </div>

            <div className="overflow-auto">
              <table className="w-full border-collapse text-[12px]">
                <thead className="bg-[#1f1f1f] text-left text-[12px] text-[#8c8c8c]">
                  <tr>
                    <th className="px-4 py-3 border-b border-[#303030] font-medium">Indicator</th>
                    <th className="px-2 py-3 border-b border-[#303030] font-medium">Description</th>
                    <th className="px-2 py-3 border-b border-[#303030] font-medium">Category</th>
                    <th className="px-2 py-3 border-b border-[#303030] font-medium">Type</th>
                    <th className="px-2 py-3 border-b border-[#303030] font-medium">Status</th>
                    <th className="px-2 py-3 border-b border-[#303030] font-medium">Created At</th>
                    <th className="px-2 py-3 border-b border-[#303030] font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pageIndicators.map((ind) => (
                    <tr key={ind.id} className="bg-[#141414] hover:bg-[#1f1f1f] transition-colors">
                      <td className="px-4 py-2 border-b border-[#303030] text-[#d9d9d9]">{ind.name}</td>
                      <td className="px-2 py-2 border-b border-[#303030] text-[#a6a6a6] max-w-[200px] truncate" title={ind.description}>{ind.description}</td>
                      <td className="px-2 py-2 border-b border-[#303030]">
                        <Badge status={ind.type} type="indicatorGroup" />
                      </td>
                      <td className="px-2 py-2 border-b border-[#303030] text-[#d9d9d9]">{ind.indicatorType ?? "System"}</td>
                      <td className="px-2 py-2 border-b border-[#303030]">
                        <Badge status={ind.status} type="status" />
                      </td>
                      <td className="px-2 py-2 border-b border-[#303030] text-[#a6a6a6]">{ind.createdAt}</td>
                      <td className="px-2 py-2 border-b border-[#303030]">
                        <IndicatorActionsMenu
                          indicator={ind}
                          onArchiveOrActivate={handleIndicatorArchiveOrActivate}
                          onUpdate={handleIndicatorUpdate}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Formulas page (Settings → Formulas) */}
        {(activeSection === "Settings" && settingsSubSection === "formulas") && (
          <div className={cx(ui.radius, ui.panel, "overflow-hidden")}>
            <div className={cx("flex items-center justify-between px-4 py-3", ui.panelMuted, "border-0 border-b", ui.divider)}>
              <div>
                <div className="text-[12px] font-medium text-[#d9d9d9]">Formulas</div>
                <div className={cx("text-[11px]", ui.textMuted)}>Hyperopt Type, Type, SubType, Formula</div>
              </div>
              <span className="rounded-md border border-[#303030] bg-[#0f0f0f] px-2 py-0.5 text-[10px] text-[#8c8c8c]">
                {formulas.length} formulas
              </span>
            </div>
            <div className="overflow-auto">
              <table className="w-full border-collapse text-[12px]">
                <thead className="bg-[#1f1f1f] text-left text-[12px] text-[#8c8c8c]">
                  <tr>
                    <th className="px-3 py-2 border-b border-[#303030] font-medium">Name</th>
                    <th className="px-3 py-2 border-b border-[#303030] font-medium">Hyperopt Type</th>
                    <th className="px-3 py-2 border-b border-[#303030] font-medium">Type</th>
                    <th className="px-3 py-2 border-b border-[#303030] font-medium">SubType</th>
                    <th className="px-3 py-2 border-b border-[#303030] font-medium min-w-[200px]">Formula</th>
                    <th className="px-3 py-2 border-b border-[#303030] font-medium">Owner</th>
                    <th className="px-3 py-2 border-b border-[#303030] font-medium w-20">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {formulas.map((f) => (
                    <tr key={f.id} className="bg-[#141414] hover:bg-[#1f1f1f] transition-colors">
                      <td className="px-3 py-2 border-b border-[#303030] text-[#d9d9d9]">{f.name ?? "—"}</td>
                      <td className="px-3 py-2 border-b border-[#303030] text-[#d9d9d9]">{f.hyperoptType}</td>
                      <td className="px-3 py-2 border-b border-[#303030] text-[#d9d9d9]">{f.type}</td>
                      <td className="px-3 py-2 border-b border-[#303030] text-[#a6a6a6]">{f.subType}</td>
                      <td className="px-3 py-2 border-b border-[#303030] text-[#a6a6a6] max-w-[280px] truncate font-mono text-[11px]" title={f.formula}>{f.formula || "—"}</td>
                      <td className="px-3 py-2 border-b border-[#303030] text-[#a6a6a6]">{f.owner ?? "—"}</td>
                      <td className="px-3 py-2 border-b border-[#303030]">
                        <FormulaActionsMenu formula={f} onEdit={handleEditFormula} onDelete={handleDeleteFormula} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {formulas.length === 0 && (
                <div className={cx("py-12 text-center text-[12px]", ui.textMuted)}>No formulas yet. Click &quot;Add Formula&quot; to create one.</div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      {showCreate && (
        <CreateStrategyModal
          name={newStrategyName}
          template={newStrategyTemplate}
          description={newStrategyDescription}
          onNameChange={setNewStrategyName}
          onTemplateChange={setNewStrategyTemplate}
          onDescriptionChange={setNewStrategyDescription}
          onClose={() => setShowCreate(false)}
          onCreate={handleCreateStrategy}
        />
      )}

      {showEditDescription && (
        <EditDescriptionModal
          value={editDescriptionDraft}
          onChange={setEditDescriptionDraft}
          onClose={() => setShowEditDescription(false)}
          onSave={saveEditDescription}
        />
      )}

      {showForgot && (
        <ForgotPasswordModal
          email={forgotEmail}
          onEmailChange={setForgotEmail}
          onClose={() => {
            setShowForgot(false);
            setForgotEmail("");
          }}
          onSend={handleForgotSend}
        />
      )}

      {showCreateUser && (
        <CreateUserModal
          draft={userDraft}
          onDraftChange={setUserDraft}
          onClose={() => setShowCreateUser(false)}
          onCreate={handleCreateUser}
        />
      )}

      {userToEdit && (
        <EditUserModal
          draft={editUserDraft}
          onDraftChange={setEditUserDraft}
          onClose={() => setUserToEdit(null)}
          onSave={handleSaveEditUser}
        />
      )}

      {userToChangePassword && (
        <ChangePasswordModal user={userToChangePassword} onClose={handleCloseChangePassword} />
      )}

      {userToResetPassword && (
        <ResetPasswordModal user={userToResetPassword} onClose={handleCloseResetPassword} />
      )}

      {showAddIndicatorPage && (
        <AddIndicatorPageModal
          onClose={() => setShowAddIndicatorPage(false)}
          onAdd={handleAddPageIndicator}
        />
      )}

      {showFormulaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => setShowFormulaModal(false)}>
          <div className={cx(ui.radius, "bg-[#141414] border border-[#303030] max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col shadow-xl")} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#303030]">
              <span className="text-[14px] font-medium text-[#d9d9d9]">{formulaEditingId != null ? "Edit Formula" : "Add Formula"}</span>
              <button type="button" onClick={() => setShowFormulaModal(false)} className="text-[#8c8c8c] hover:text-[#d9d9d9] p-1">✕</button>
            </div>
            <div className="overflow-auto p-4 space-y-4">
              <div>
                <label className={cx("block mb-1 text-xs", ui.textMuted)}>Name</label>
                <input type="text" value={formulaDraft.name ?? ""} onChange={(e) => setFormulaDraft((d) => ({ ...d, name: e.target.value }))} placeholder="Formula name" className={cx(ui.input, "h-9 text-[12px] w-full")} />
              </div>
              <div>
                <label className={cx("block mb-1 text-xs", ui.textMuted)}>Hyperopt Type</label>
                <select value={formulaDraft.hyperoptType} onChange={(e) => setFormulaDraft((d) => ({ ...d, hyperoptType: e.target.value }))} className={cx(ui.input, "h-9 text-[12px] w-full")}>
                  {FORMULA_HYPEROPT_TYPES.map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className={cx("block mb-1 text-xs", ui.textMuted)}>Type</label>
                <select value={formulaDraft.type} onChange={(e) => setFormulaDraft((d) => ({ ...d, type: e.target.value }))} className={cx(ui.input, "h-9 text-[12px] w-full")}>
                  {FORMULA_TYPES.map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className={cx("block mb-1 text-xs", ui.textMuted)}>SubType</label>
                <select value={formulaDraft.subType} onChange={(e) => setFormulaDraft((d) => ({ ...d, subType: e.target.value }))} className={cx(ui.input, "h-9 text-[12px] w-full")}>
                  {FORMULA_SUBTYPES.map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className={cx("block mb-1 text-xs", ui.textMuted)}>Formula</label>
                <div className="relative min-h-[120px] rounded-md border border-[#303030] bg-[#0f0f0f] overflow-hidden">
                  <div
                    ref={formulaModalMirrorRef}
                    className="absolute inset-0 overflow-auto px-3 py-2 text-[11px] font-mono text-[#d9d9d9] whitespace-pre-wrap break-words pointer-events-none [&::-webkit-scrollbar]:hidden"
                    style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                    aria-hidden
                  >
                    {formulaDraft.formula ? (
                      renderFormulaModalWithVariables(formulaDraft.formula)
                    ) : (
                      <span className="text-[#595959]">Formula expression...</span>
                    )}
                  </div>
                  <textarea
                    ref={formulaModalFormulaRef}
                    value={formulaDraft.formula ?? ""}
                    onChange={(e) => {
                      const { value, selectionStart, selectionEnd } = e.target;
                      setFormulaDraft((d) => ({ ...d, formula: value }));
                      setFormulaModalSelection({ start: selectionStart ?? value.length, end: selectionEnd ?? value.length });
                    }}
                    onSelect={(e) => {
                      const { selectionStart, selectionEnd } = e.target;
                      setFormulaModalSelection({ start: selectionStart ?? 0, end: selectionEnd ?? 0 });
                    }}
                    onScroll={(e) => {
                      const m = formulaModalMirrorRef.current;
                      if (m) {
                        m.scrollTop = e.target.scrollTop;
                        m.scrollLeft = e.target.scrollLeft;
                      }
                    }}
                    rows={6}
                    placeholder="Formula expression..."
                    className="relative z-10 w-full min-h-[120px] resize-y rounded-md border-0 bg-transparent px-3 py-2 text-[11px] font-mono text-transparent caret-[#d9d9d9] focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:ring-inset"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="text-[11px] font-medium text-[#d9d9d9]">Functions</div>
                  <select
                    className={cx(ui.input, "h-8 text-[11px] flex-1 w-full")}
                    onChange={(e) => {
                      if (!e.target.value) return;
                      insertIntoFormulaModal(e.target.value);
                      e.target.selectedIndex = 0;
                    }}
                  >
                    <option value="">Select function…</option>
                    {FORMULA_MODAL_FUNCTIONS.map((fn) => (
                      <option key={fn.label} value={fn.template}>
                        {fn.label} — {fn.template}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-[11px] font-medium text-[#d9d9d9]">Variables</div>
                <div className="flex flex-wrap gap-1.5">
                  {FORMULA_MODAL_VARIABLES.map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => insertIntoFormulaModal(v)}
                      className="inline-flex items-center justify-center rounded-md border border-[#303030] bg-[#0f0f0f] px-2.5 py-1 text-[11px] text-[#d9d9d9] hover:bg-[#1f1f1f] active:translate-y-[0.5px]"
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-[11px] font-medium text-[#d9d9d9]">Operators</div>
                <div className="flex flex-wrap gap-1.5">
                  {FORMULA_MODAL_OPERATORS.map((op) => (
                    <button
                      key={op}
                      type="button"
                      onClick={() => insertIntoFormulaModal(op)}
                      className="inline-flex items-center justify-center rounded-md border border-[#303030] bg-[#0f0f0f] px-2.5 py-1 text-[11px] text-[#d9d9d9] hover:bg-[#1f1f1f] active:translate-y-[0.5px]"
                    >
                      {op}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="px-4 py-3 border-t border-[#303030] flex justify-end gap-2">
              <button type="button" onClick={() => setShowFormulaModal(false)} className={cx(ui.btn, "h-8 px-3 text-[11px]")}>Cancel</button>
              <button type="button" onClick={handleSaveFormula} className={cx(ui.btnPrimary, "h-8 px-3 text-[11px]")}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { memo, useCallback, useEffect, useState } from "react";
import { cx, ui } from "../../constants/ui";
import { useOutsideClose } from "../../hooks/useOutsideClose";
import { Logo, MenuIcon } from "../common";
import { QueueIcon, DragHandleIcon, TrashIcon } from "./Icons";

export const Header = memo(function Header({
  onLogout,
  sections,
  activeSection,
  onSectionChange,
  settingsSubSection,
  onSettingsSubChange,
  strategiesCount,
  disabledSections,
  queueOpen,
  onQueueToggle,
  onQueueClose,
  queueItems = [],
  onQueueReorder,
  onQueueRemove,
  hyperoptRun = "Pipeline",
  onHyperoptRunChange,
}) {
  const queueRef = useOutsideClose(queueOpen, onQueueClose);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [panelEnter, setPanelEnter] = useState(false);
  useEffect(() => {
    if (queueOpen) {
      setPanelEnter(false);
      const t = setTimeout(() => setPanelEnter(true), 20);
      return () => clearTimeout(t);
    }
  }, [queueOpen]);

  const handleDragStart = useCallback((e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(index));
    e.dataTransfer.setDragImage(e.currentTarget, 0, 0);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const handleDrop = useCallback(
    (e, dropIndex) => {
      e.preventDefault();
      const dragIndex = Number(e.dataTransfer.getData("text/plain"));
      if (Number.isNaN(dragIndex) || dragIndex === dropIndex) {
        setDraggedIndex(null);
        return;
      }
      const next = [...queueItems];
      const [removed] = next.splice(dragIndex, 1);
      next.splice(dropIndex, 0, removed);
      onQueueReorder?.(next);
      setDraggedIndex(null);
    },
    [queueItems, onQueueReorder]
  );

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null);
  }, []);

  return (
    <header className={cx("h-14 sticky top-0 z-40", ui.panelMuted, "border-0 border-b", ui.divider)}>
      <div className="h-full px-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <Logo className="h-9 w-auto max-w-[180px]" />
          </div>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-2" aria-label="Primary">
            {sections.map((item) => {
              if (item === "Users" && hyperoptRun === "Pipeline") {
                return null;
              }
              const isDisabled = disabledSections.has(item);
              const active = !isDisabled && activeSection === item;
              const isSettings = item === "Settings";

              if (isSettings) {
                const showFormulas = hyperoptRun !== "Pipeline";
                const indicatorsActive = activeSection === "Settings" && settingsSubSection === "indicators";
                const formulasActive = activeSection === "Settings" && settingsSubSection === "formulas";
                return (
                  <div key={item} className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => !isDisabled && (onSectionChange("Settings"), onSettingsSubChange?.("indicators"))}
                      disabled={isDisabled}
                      aria-disabled={isDisabled}
                      className={cx(
                        "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] border transition",
                        indicatorsActive
                          ? "bg-emerald-500/10 text-emerald-200 border-emerald-500/40"
                          : isDisabled
                          ? "bg-transparent text-[#595959] border-transparent cursor-not-allowed opacity-70"
                          : "bg-transparent text-[#d9d9d9] border-transparent hover:bg-[#1f1f1f]"
                      )}
                      title="Indicators"
                    >
                      <MenuIcon name="Indicators" active={indicatorsActive} />
                      <span className="whitespace-nowrap">Indicators</span>
                    </button>
                    {showFormulas && (
                      <button
                        type="button"
                        onClick={() => !isDisabled && (onSectionChange("Settings"), onSettingsSubChange?.("formulas"))}
                        disabled={isDisabled}
                        aria-disabled={isDisabled}
                        className={cx(
                          "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] border transition",
                          formulasActive
                            ? "bg-emerald-500/10 text-emerald-200 border-emerald-500/40"
                            : isDisabled
                            ? "bg-transparent text-[#595959] border-transparent cursor-not-allowed opacity-70"
                            : "bg-transparent text-[#d9d9d9] border-transparent hover:bg-[#1f1f1f]"
                        )}
                        title="Formulas"
                      >
                        <MenuIcon name="Formulas" active={formulasActive} />
                        <span className="whitespace-nowrap">Formulas</span>
                      </button>
                    )}
                  </div>
                );
              }

              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => !isDisabled && onSectionChange(item)}
                  disabled={isDisabled}
                  aria-disabled={isDisabled}
                  className={cx(
                    "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] border transition",
                    active
                      ? "bg-emerald-500/10 text-emerald-200 border-emerald-500/40"
                      : isDisabled
                      ? "bg-transparent text-[#595959] border-transparent cursor-not-allowed opacity-70"
                      : "bg-transparent text-[#d9d9d9] border-transparent hover:bg-[#1f1f1f]"
                  )}
                  title={isDisabled ? `${item} (disabled)` : item}
                >
                  <MenuIcon name={item} active={active} />
                  <span className="whitespace-nowrap">{item}</span>
                  {item === "Strategies" && (
                    <span className="ml-1 rounded-md border border-[#303030] bg-[#0f0f0f] px-2 py-0.5 text-[11px] text-[#a6a6a6]">
                      {strategiesCount}
                    </span>
                  )}
                  {isDisabled && (
                    <span className="ml-1 rounded-md border border-[#303030] bg-[#0f0f0f] px-2 py-0.5 text-[10px] text-[#8c8c8c]">
                      soon
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div ref={queueRef} className="relative flex items-center gap-3">
          <select
            value={hyperoptRun}
            onChange={(e) => onHyperoptRunChange?.(e.target.value)}
            className={cx(ui.input, "h-8 text-[12px] w-[140px]")}
            title="Hyperopt run"
          >
            <option value="Pipeline">Quant</option>
            <option value="Admin run">Admin</option>
          </select>
          <span className="hidden sm:inline-flex items-center gap-2 rounded-md border border-[#303030] bg-[#0f0f0f] px-2 py-1 text-[12px] text-[#d9d9d9]">
            <span className={ui.textMuted}>User:</span> <span className="font-medium">bogdan</span>
          </span>
          <button
            type="button"
            onClick={onQueueToggle}
            className={cx(ui.btn, "px-3 py-1.5", queueOpen && "bg-[#1f1f1f]")}
            title="Queue"
            aria-expanded={queueOpen}
            aria-label="Open queue"
          >
            <QueueIcon />
          </button>
          {queueOpen && (
            <>
              <div
                className="fixed inset-0 z-20 bg-black/50 transition-opacity duration-300"
                onClick={onQueueClose}
                onKeyDown={(e) => e.key === "Escape" && onQueueClose()}
                aria-hidden
              />
              <div
                className={cx(
                  "fixed right-0 top-0 bottom-0 z-30 w-[320px] flex flex-col overflow-hidden border-0 border-l border-[#303030] bg-[#141414] shadow-[-8px_0_24px_rgba(0,0,0,0.4)] transition-transform duration-300 ease-out",
                  panelEnter ? "translate-x-0" : "translate-x-full"
                )}
              >
                <div className="shrink-0 p-3 border-b border-[#303030] text-[12px] font-medium text-[#d9d9d9]">Queue</div>
                <div className="flex-1 overflow-auto min-h-0">
                  <table className="w-full text-[11px] border-collapse">
                    <thead>
                      <tr className="bg-[#1a1a1a] text-[#8c8c8c] sticky top-0">
                        <th className="px-2 py-2 text-left font-medium border-b border-[#303030] w-9" aria-label="Drag" />
                        <th className="px-3 py-2 text-left font-medium border-b border-[#303030]">Strategy · Version</th>
                        <th className="px-3 py-2 text-left font-medium border-b border-[#303030] w-20">Estimation time</th>
                        <th className="px-3 py-2 text-left font-medium border-b border-[#303030] w-24">Status</th>
                        <th className="px-2 py-2 text-right font-medium border-b border-[#303030] w-9" aria-label="Remove" />
                      </tr>
                    </thead>
                    <tbody className="text-[#d9d9d9]">
                      {queueItems.map((item, index) => (
                        <tr
                          key={item.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, index)}
                          onDragOver={(e) => handleDragOver(e)}
                          onDrop={(e) => handleDrop(e, index)}
                          onDragEnd={handleDragEnd}
                          className={cx(
                            "border-b border-[#303030] hover:bg-[#1a1a1a] transition-colors cursor-grab active:cursor-grabbing",
                            draggedIndex === index && "opacity-50 bg-[#1a1a1a]"
                          )}
                        >
                          <td className="px-2 py-2 align-middle w-9 text-[#8c8c8c]">
                            <DragHandleIcon />
                          </td>
                          <td className="px-3 py-2">
                            <a href="#" className="text-emerald-400 hover:text-emerald-300 hover:underline" onClick={(e) => e.preventDefault()}>
                              {item.strategyName} {item.version}
                            </a>
                          </td>
                          <td className="px-3 py-2 text-[#a6a6a6]">
                            {item.estimationTime ?? "—"}
                          </td>
                          <td className="px-3 py-2">
                            <span
                              className={cx(
                                "inline-block rounded px-2 py-0.5 text-[10px] font-medium",
                                item.status === "In progress"
                                  ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                                  : "bg-[#303030] text-[#a6a6a6] border border-[#404040]"
                              )}
                            >
                              {item.status}
                            </span>
                          </td>
                          <td className="px-2 py-2 align-middle w-9 text-right">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onQueueRemove?.(item.id);
                              }}
                              className="p-1 rounded text-[#8c8c8c] hover:text-red-400 hover:bg-red-500/10 transition-colors"
                              title="Remove from queue"
                              aria-label="Remove from queue"
                            >
                              <TrashIcon />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
          <button className={cx(ui.btn, "px-3 py-1.5")} onClick={onLogout}>
            Logout
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      <div className={cx("md:hidden border-0 border-t", ui.divider)}>
        <div className="px-3 py-2 flex items-center gap-2 overflow-auto">
          {sections.map((item) => {
            if (item === "Users" && hyperoptRun === "Pipeline") {
              return null;
            }
            const isDisabled = disabledSections.has(item);
            const active = !isDisabled && activeSection === item;
            if (item === "Settings") {
              const showFormulas = hyperoptRun !== "Pipeline";
              const indicatorsActive = activeSection === "Settings" && settingsSubSection === "indicators";
              const formulasActive = activeSection === "Settings" && settingsSubSection === "formulas";
              return (
                <React.Fragment key={item}>
                  <button
                    type="button"
                    onClick={() => !isDisabled && (onSectionChange("Settings"), onSettingsSubChange?.("indicators"))}
                    disabled={isDisabled}
                    className={cx(
                      "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] border transition",
                      indicatorsActive
                        ? "bg-emerald-500/10 text-emerald-200 border-emerald-500/40"
                        : isDisabled
                        ? "bg-transparent text-[#595959] border-transparent cursor-not-allowed opacity-70"
                        : "bg-transparent text-[#d9d9d9] border-transparent hover:bg-[#1f1f1f]"
                    )}
                  >
                    <MenuIcon name="Indicators" active={indicatorsActive} />
                    <span className="whitespace-nowrap">Indicators</span>
                  </button>
                  {showFormulas && (
                    <button
                      type="button"
                      onClick={() => !isDisabled && (onSectionChange("Settings"), onSettingsSubChange?.("formulas"))}
                      disabled={isDisabled}
                      className={cx(
                        "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] border transition",
                        formulasActive
                          ? "bg-emerald-500/10 text-emerald-200 border-emerald-500/40"
                          : isDisabled
                          ? "bg-transparent text-[#595959] border-transparent cursor-not-allowed opacity-70"
                          : "bg-transparent text-[#d9d9d9] border-transparent hover:bg-[#1f1f1f]"
                      )}
                    >
                      <MenuIcon name="Formulas" active={formulasActive} />
                      <span className="whitespace-nowrap">Formulas</span>
                    </button>
                  )}
                </React.Fragment>
              );
            }
            return (
              <button
                key={item}
                type="button"
                onClick={() => !isDisabled && onSectionChange(item)}
                disabled={isDisabled}
                className={cx(
                  "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] border transition",
                  active
                    ? "bg-emerald-500/10 text-emerald-200 border-emerald-500/40"
                    : isDisabled
                    ? "bg-transparent text-[#595959] border-transparent cursor-not-allowed opacity-70"
                    : "bg-transparent text-[#d9d9d9] border-transparent hover:bg-[#1f1f1f]"
                )}
              >
                <MenuIcon name={item} active={active} />
                <span className="whitespace-nowrap">{item}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
});

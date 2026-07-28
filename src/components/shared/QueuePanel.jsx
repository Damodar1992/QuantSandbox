import React, { memo, useCallback, useEffect, useState } from "react";
import { cx, ui } from "../../constants/ui";
import { DragHandleIcon, TrashIcon } from "./Icons";

export const QUEUE_TABS = [
  { id: "hyperopt", label: "Hyperopt" },
  { id: "postProcessing", label: "Post-processing" },
];

const STATUS_STYLES = {
  "In progress": "bg-blue-500/10 text-blue-200 border-blue-500/40",
  Queued: "bg-white/5 text-muted-foreground border-border",
};

function QueueStatusBadge({ status }) {
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] leading-4 border",
        STATUS_STYLES[status] || "bg-white/5 text-muted-foreground border-border",
      )}
    >
      {status}
    </span>
  );
}

export const QueuePanel = memo(function QueuePanel({
  open,
  onClose,
  panelEnter,
  itemsByTab = { hyperopt: [], postProcessing: [] },
  onReorder,
  onRemove,
}) {
  const [activeTab, setActiveTab] = useState("hyperopt");
  const [draggedIndex, setDraggedIndex] = useState(null);

  useEffect(() => {
    if (!open) setDraggedIndex(null);
  }, [open]);

  const items = itemsByTab[activeTab] || [];

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
      const next = [...items];
      const [removed] = next.splice(dragIndex, 1);
      next.splice(dropIndex, 0, removed);
      onReorder?.(activeTab, next);
      setDraggedIndex(null);
    },
    [items, activeTab, onReorder],
  );

  const handleDragEnd = useCallback(() => setDraggedIndex(null), []);

  return (
    <>
      <div className="fixed inset-0 z-20 bg-black/50" onClick={onClose} aria-hidden />
      <div
        className={cx(
          "fixed right-0 top-0 bottom-0 z-30 w-[320px] flex flex-col overflow-hidden border-l bg-card shadow-[-8px_0_24px_rgba(0,0,0,0.4)] transition-transform duration-300",
          ui.divider,
          panelEnter ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className={cx("shrink-0 p-3 border-b text-[12px] font-medium", ui.divider)}>Queue</div>

        <div className={cx("shrink-0 flex gap-1 p-2 border-b", ui.divider)} role="tablist">
          {QUEUE_TABS.map((tab) => {
            const count = (itemsByTab[tab.id] || []).length;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setActiveTab(tab.id)}
                className={cx(
                  "flex-1 rounded-md px-2 py-1.5 text-[11px] font-medium transition",
                  active
                    ? "bg-[rgba(168,96,240,0.16)] text-[#ddd6fe]"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5",
                )}
              >
                {tab.label}
                {count > 0 ? (
                  <span className="ml-1 tabular-nums text-[10px] opacity-70">{count}</span>
                ) : null}
              </button>
            );
          })}
        </div>

        <div className="flex-1 overflow-auto min-h-0">
          {items.length === 0 ? (
            <div className="p-4 text-[11px] text-muted-foreground">No jobs in this queue.</div>
          ) : (
            <ul className="divide-y divide-[rgba(60,40,80,0.35)]">
              {items.map((item, index) => (
                <li
                  key={item.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                  className={cx(
                    "flex items-start gap-2 px-2 py-2.5 cursor-grab active:cursor-grabbing",
                    draggedIndex === index && "opacity-50",
                  )}
                >
                  <span className="mt-0.5 shrink-0 text-muted-foreground">
                    <DragHandleIcon />
                  </span>
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="truncate text-[11px] font-medium text-violet-300">
                      {item.strategyName} {item.version}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-muted-foreground">
                      <span>{item.stageName || "—"}</span>
                      <span aria-hidden>·</span>
                      <span>ETA {item.estimationTime ?? "—"}</span>
                    </div>
                    <QueueStatusBadge status={item.status || "Queued"} />
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemove?.(activeTab, item.id)}
                    aria-label="Remove from queue"
                    className="shrink-0 mt-0.5 text-muted-foreground hover:text-foreground"
                  >
                    <TrashIcon />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
});

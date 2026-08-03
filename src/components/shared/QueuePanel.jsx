import React, { memo, useCallback, useEffect, useState } from "react";
import { EtaProgress } from "../common/EtaProgress";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "../ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { DragHandleIcon, TrashIcon } from "./Icons";
import { cx } from "../../constants/ui";

export const QUEUE_TABS = [
  { id: "hyperopt", label: "Hyperopt" },
  { id: "postProcessing", label: "Post-processing" },
];

const STATUS_STYLES = {
  "In progress": "bg-blue-500/10 text-blue-200 border-blue-500/40",
  "In Progress": "bg-blue-500/10 text-blue-200 border-blue-500/40",
  Queued: "bg-white/5 text-muted-foreground border-border",
};

function isQueueInProgress(status) {
  return status === "In progress" || status === "In Progress";
}

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

function QueueList({
  items,
  tabId,
  draggedIndex,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onRemove,
}) {
  if (items.length === 0) {
    return <div className="p-4 text-[11px] text-muted-foreground">No jobs in this queue.</div>;
  }

  return (
    <ul className="divide-y divide-[rgba(60,40,80,0.35)]">
      {items.map((item, index) => (
        <li
          key={item.id}
          draggable
          onDragStart={(e) => onDragStart(e, index)}
          onDragOver={onDragOver}
          onDrop={(e) => onDrop(e, index)}
          onDragEnd={onDragEnd}
          className={cx(
            "flex items-start gap-2 px-2 py-2.5 cursor-grab active:cursor-grabbing",
            draggedIndex === index && "opacity-50",
          )}
        >
          <span className="mt-0.5 shrink-0 text-muted-foreground">
            <DragHandleIcon />
          </span>
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="truncate text-[11px] font-medium text-violet-300">
              {item.strategyName} {item.version}
              <span className="text-muted-foreground font-normal">
                {" · "}
                {item.stageName || "—"}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 min-w-0">
              <QueueStatusBadge status={item.status || "Queued"} />
              {isQueueInProgress(item.status) ? (
                <EtaProgress eta={item.estimationTime} progress={item.progress} />
              ) : null}
            </div>
          </div>
          <button
            type="button"
            onClick={() => onRemove?.(tabId, item.id)}
            aria-label="Remove from queue"
            className="shrink-0 mt-0.5 text-muted-foreground hover:text-foreground"
          >
            <TrashIcon />
          </button>
        </li>
      ))}
    </ul>
  );
}

export const QueuePanel = memo(function QueuePanel({
  open,
  onClose,
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

  const listProps = {
    draggedIndex,
    onDragStart: handleDragStart,
    onDragOver: handleDragOver,
    onDrop: handleDrop,
    onDragEnd: handleDragEnd,
    onRemove,
  };

  return (
    <Sheet
      open={!!open}
      onOpenChange={(next) => {
        if (!next) onClose?.();
      }}
    >
      <SheetContent
        side="right"
        showCloseButton
        className="w-[320px] sm:max-w-[320px] p-0 gap-0 flex flex-col"
      >
        <SheetHeader className="shrink-0 border-b border-border p-3 space-y-0">
          <SheetTitle className="text-[12px] font-medium">Queue</SheetTitle>
        </SheetHeader>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex flex-1 flex-col min-h-0 gap-0 data-horizontal:flex-col"
        >
          <TabsList className="w-full shrink-0 rounded-none border-b border-border bg-transparent p-2 h-auto gap-1">
            {QUEUE_TABS.map((tab) => {
              const count = (itemsByTab[tab.id] || []).length;
              return (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="flex-1 rounded-md px-2 py-1.5 text-[11px] data-active:bg-[rgba(168,96,240,0.16)] data-active:text-[#ddd6fe]"
                >
                  {tab.label}
                  {count > 0 ? (
                    <span className="ml-1 tabular-nums text-[10px] opacity-70">{count}</span>
                  ) : null}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {QUEUE_TABS.map((tab) => (
            <TabsContent
              key={tab.id}
              value={tab.id}
              className="flex-1 overflow-auto min-h-0 mt-0"
            >
              <QueueList
                items={itemsByTab[tab.id] || []}
                tabId={tab.id}
                {...listProps}
              />
            </TabsContent>
          ))}
        </Tabs>
      </SheetContent>
    </Sheet>
  );
});

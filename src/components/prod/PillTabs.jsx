import React, { memo } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export const PillTabs = memo(function PillTabs({
  items,
  activeId,
  onChange,
  disabledIds = new Set(),
  renderBadge,
  className,
}) {
  return (
    <Tabs
      value={activeId}
      onValueChange={(id) => onChange?.(id)}
      orientation="horizontal"
      className={cn(
        "inline-flex gap-0 data-horizontal:flex-row",
        className,
      )}
    >
      <TabsList
        className={cn(
          "inline-flex h-auto w-auto items-center gap-1 rounded-full p-1",
          "bg-[var(--crm-nav-pill)]",
          "group-data-horizontal/tabs:h-auto",
        )}
      >
        {items.map((item) => {
          const disabled = disabledIds.has(item.id);
          return (
            <TabsTrigger
              key={item.id}
              value={item.id}
              disabled={disabled}
              className={cn(
                "inline-flex h-auto flex-none items-center gap-2 rounded-full border-transparent px-3 py-2 text-[13px] font-normal shadow-none transition",
                "text-[#b8aecc] hover:text-[#faf7fd]",
                "data-active:bg-[rgba(168,96,240,0.16)] data-active:text-[#ddd6fe] data-active:shadow-none",
                "dark:data-active:border-transparent dark:data-active:bg-[rgba(168,96,240,0.16)] dark:data-active:text-[#ddd6fe]",
                "disabled:cursor-not-allowed disabled:opacity-70 disabled:text-[#6e6682] disabled:pointer-events-none",
                "after:hidden",
              )}
            >
              {item.icon}
              <span className="whitespace-nowrap">{item.label}</span>
              {renderBadge?.(item)}
            </TabsTrigger>
          );
        })}
      </TabsList>
    </Tabs>
  );
});

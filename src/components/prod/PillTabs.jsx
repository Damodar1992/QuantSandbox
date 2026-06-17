import React, { memo } from "react";
import { cx } from "@/constants/ui";

export const PillTabs = memo(function PillTabs({
  items,
  activeId,
  onChange,
  disabledIds = new Set(),
  renderBadge,
  className,
}) {
  return (
    <div
      className={cx(
        "inline-flex items-center gap-1 rounded-full p-1",
        "bg-[var(--crm-nav-pill)]",
        className,
      )}
      role="tablist"
    >
      {items.map((item) => {
        const disabled = disabledIds.has(item.id);
        const active = !disabled && activeId === item.id;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={active}
            disabled={disabled}
            onClick={() => !disabled && onChange?.(item.id)}
            className={cx(
              "inline-flex items-center gap-2 rounded-full px-3 py-2 text-[13px] transition",
              active
                ? "bg-[rgba(168,96,240,0.16)] text-[#ddd6fe]"
                : disabled
                ? "text-[#6e6682] cursor-not-allowed opacity-70"
                : "text-[#b8aecc] hover:text-[#faf7fd]",
            )}
          >
            {item.icon}
            <span className="whitespace-nowrap">{item.label}</span>
            {renderBadge?.(item)}
          </button>
        );
      })}
    </div>
  );
});

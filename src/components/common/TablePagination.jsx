import React, { memo } from "react";
import { cx, ui } from "../../constants/ui";

export const TablePagination = memo(function TablePagination({
  page,
  totalPages,
  totalItems,
  pageSize,
  onPrev,
  onNext,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50],
  className,
}) {
  if (totalItems === 0) return null;

  return (
    <div
      className={cx(
        "flex flex-wrap items-center justify-between gap-2 px-3 py-2 border-t border-[#303030] bg-[#141414] text-[11px]",
        className,
      )}
    >
      <span className="text-[#8c8c8c]">
        {totalItems} item{totalItems === 1 ? "" : "s"}
      </span>
      <div className="flex items-center gap-2">
        {onPageSizeChange && (
          <label className="flex items-center gap-1.5 text-[#8c8c8c]">
            <span>Per page</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className={cx(ui.select, "h-7 text-[11px] py-0")}
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
        )}
        <span className="text-[#a6a6a6]">
          Page {page} of {totalPages}
        </span>
        <button
          type="button"
          onClick={onPrev}
          disabled={page <= 1}
          className={cx(ui.btn, "h-7 px-2 text-[11px]", page <= 1 && "opacity-40 cursor-not-allowed")}
        >
          Prev
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={page >= totalPages}
          className={cx(
            ui.btn,
            "h-7 px-2 text-[11px]",
            page >= totalPages && "opacity-40 cursor-not-allowed",
          )}
        >
          Next
        </button>
      </div>
    </div>
  );
});

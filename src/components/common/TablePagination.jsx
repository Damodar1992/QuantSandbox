import React, { memo, useMemo } from "react";
import { cx, ui } from "../../constants/ui";
import { AppSelect } from "./AppSelect";
import { AppButton } from "./AppButton";

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
  const sizeOptions = useMemo(
    () => pageSizeOptions.map((size) => ({ value: String(size), label: String(size) })),
    [pageSizeOptions],
  );

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
          <div className="flex items-center gap-1.5 text-[#8c8c8c]">
            <span>Per page</span>
            <AppSelect
              value={String(pageSize)}
              onValueChange={(v) => onPageSizeChange(Number(v))}
              options={sizeOptions}
              className="w-[72px]"
              triggerClassName="h-7 text-[11px]"
              aria-label="Items per page"
            />
          </div>
        )}
        <span className="text-[#a6a6a6]">
          Page {page} of {totalPages}
        </span>
        <AppButton
          type="button"
          variant="outline"
          size="sm"
          onClick={onPrev}
          disabled={page <= 1}
          className={cx("h-7 px-2 text-[11px]", page <= 1 && "opacity-40 cursor-not-allowed")}
        >
          Prev
        </AppButton>
        <AppButton
          type="button"
          variant="outline"
          size="sm"
          onClick={onNext}
          disabled={page >= totalPages}
          className={cx(
            "h-7 px-2 text-[11px]",
            page >= totalPages && "opacity-40 cursor-not-allowed",
          )}
        >
          Next
        </AppButton>
      </div>
    </div>
  );
});

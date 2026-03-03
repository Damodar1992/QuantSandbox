import React, { memo, useMemo } from "react";
import { cx } from "../../constants/ui";

export const HeatMapGrid = memo(() => {
  const cells = useMemo(() => Array.from({ length: 80 }, (_, i) => i), []);
  return (
    <div className="grid grid-cols-10 gap-1">
      {cells.map((i) => (
        <div
          key={i}
          className={cx(
            "h-4 rounded-sm border border-[#303030]",
            i % 9 === 0
              ? "bg-emerald-500/25"
              : i % 7 === 0
              ? "bg-emerald-500/15"
              : i % 5 === 0
              ? "bg-amber-500/15"
              : i % 3 === 0
              ? "bg-red-500/15"
              : "bg-[#0f0f0f]"
          )}
          title={`cell ${i + 1}`}
        />
      ))}
    </div>
  );
});

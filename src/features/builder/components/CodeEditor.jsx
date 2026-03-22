import React, { memo, useCallback, useMemo } from "react";
import { cx, ui } from "../../../constants/ui";

export const CodeEditor = memo(({ value, onChange, language = "python" }) => {
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

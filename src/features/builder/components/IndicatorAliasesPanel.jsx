import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
import { cx, ui } from "../../../constants/ui";
import {
  buildIndicatorAliasTree,
  formatAliasTreeText,
} from "../utils/indicatorHelpers";

const PANEL_WIDTH = 300;

function AliasTreeBlock({ indicatorAlias, outputAliases }) {
  return (
    <div className="mb-4 last:mb-0">
      <div className="text-[#d9d9d9] font-medium">{indicatorAlias}</div>
      {outputAliases.length > 0 && (
        <div className="mt-1 space-y-0.5 text-[#a6a6a6]">
          {outputAliases.map((alias, i) => (
            <div key={alias}>
              {i === outputAliases.length - 1 ? " └─ " : " ├─ "}
              {alias}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export const IndicatorAliasesPanel = memo(function IndicatorAliasesPanel({
  indicators,
  open,
  onClose,
  className,
}) {
  const tree = useMemo(() => buildIndicatorAliasTree(indicators), [indicators]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) setCopied(false);
  }, [open]);

  useEffect(() => {
    if (!copied) return undefined;
    const t = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(t);
  }, [copied]);

  const handleCopy = useCallback(async () => {
    if (!tree.length) return;
    const text = formatAliasTreeText(tree);
    try {
      await navigator.clipboard?.writeText(text);
      setCopied(true);
    } catch {
      // no-op
    }
  }, [tree]);

  return (
    <div
      className={cx(
        "shrink-0 flex flex-col border-[#303030] bg-[#141414] overflow-hidden transition-[width,opacity] duration-200 ease-out",
        open ? "border-l opacity-100" : "w-0 opacity-0 border-l-0",
        className,
      )}
      style={{ width: open ? PANEL_WIDTH : 0 }}
      aria-hidden={!open}
    >
      <div className="flex flex-col h-full min-w-[300px]" style={{ width: PANEL_WIDTH }}>
        <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-[#303030] shrink-0">
          <span className="text-[11px] font-medium text-[#d9d9d9]">Indicator Alias List</span>
          <button
            type="button"
            onClick={onClose}
            className="text-[#8c8c8c] hover:text-[#d9d9d9] p-0.5 text-[12px]"
            aria-label="Close aliases panel"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-3 font-mono text-[12px] leading-relaxed min-h-0">
          {tree.length === 0 ? (
            <p className={cx("text-[11px]", ui.textMuted)}>
              Add and enable indicators in section 1 to see aliases here.
            </p>
          ) : (
            tree.map((node) => (
              <AliasTreeBlock
                key={node.indicatorAlias}
                indicatorAlias={node.indicatorAlias}
                outputAliases={node.outputAliases}
              />
            ))
          )}
        </div>

        <div className="shrink-0 px-3 py-2 border-t border-[#303030] flex flex-col gap-1.5">
          {copied && (
            <span className="text-[10px] text-emerald-400">Copied to clipboard</span>
          )}
          <button
            type="button"
            onClick={handleCopy}
            disabled={!tree.length}
            className={cx(
              ui.btn,
              "h-7 w-full text-[10px]",
              !tree.length && "opacity-50 cursor-not-allowed",
              copied && "border-emerald-500/50 text-emerald-300",
            )}
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>
    </div>
  );
});

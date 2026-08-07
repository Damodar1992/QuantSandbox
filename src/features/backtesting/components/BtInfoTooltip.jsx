import React, { memo } from "react";
import { CircleHelp } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cx } from "@/constants/ui";

/** Split `**bold**` markers into plain / emphasized spans. */
function renderRichText(text) {
  if (!text) return null;
  const parts = String(text).split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-[#faf7fd]">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <React.Fragment key={i}>{part}</React.Fragment>;
  });
}

function normalizeTip(tip) {
  if (!tip) return null;
  if (typeof tip === "string") return { text: tip, formula: null };
  const formula = tip.formula
    ? Array.isArray(tip.formula)
      ? tip.formula.filter(Boolean)
      : [tip.formula]
    : null;
  if (!tip.text && !(formula && formula.length)) return null;
  return { text: tip.text || null, formula: formula?.length ? formula : null };
}

/** Shared Performance / metric help body: optional FORMULA box + description. */
export function BtTooltipBody({ text, formula, showFormulaLabel = true }) {
  const lines = formula
    ? Array.isArray(formula)
      ? formula.filter(Boolean)
      : [formula]
    : [];

  return (
    <div className="space-y-2">
      {lines.length ? (
        <div className="rounded-md border border-[rgba(60,40,80,0.45)] bg-[#100a1a] px-2.5 py-2">
          {showFormulaLabel ? (
            <div className="mb-1.5 text-[9px] font-semibold uppercase tracking-wide text-violet-300">
              Formula
            </div>
          ) : null}
          <div className="space-y-1 font-mono text-[10px] leading-snug text-[#d9d9d9]">
            {lines.map((line) => (
              <div key={line}>{line}</div>
            ))}
          </div>
        </div>
      ) : null}
      {text ? (
        <div className="text-[11px] leading-snug text-[#c8c0d4]">{renderRichText(text)}</div>
      ) : null}
    </div>
  );
}

/** Help icon with a text tooltip. Rendered in a Radix portal, so it escapes tables. */
export const BtInfoTooltip = memo(function BtInfoTooltip({
  label,
  text,
  formula,
  tip,
  className,
}) {
  const resolved = normalizeTip(tip) || normalizeTip({ text, formula });
  if (!resolved) return null;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className={cx("inline-flex shrink-0 text-violet-400 hover:text-violet-300", className)}
          aria-label={`Help: ${label || "info"}`}
          onClick={(e) => e.preventDefault()}
        >
          <CircleHelp className="h-3.5 w-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent
        side="top"
        sideOffset={6}
        className="max-w-[380px] border-[rgba(60,40,80,0.5)] bg-[#170f29] p-2.5 text-[11px] leading-snug whitespace-normal shadow-lg"
      >
        <BtTooltipBody text={resolved.text} formula={resolved.formula} />
      </TooltipContent>
    </Tooltip>
  );
});

/** Wraps any node into a tooltip trigger — used for metric values and N/A tags. */
export const BtValueTooltip = memo(function BtValueTooltip({ text, formula, children, className }) {
  if (!text && !formula) return children;
  const labeled = Array.isArray(formula);
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={cx("inline-flex cursor-default", className)}>{children}</span>
      </TooltipTrigger>
      <TooltipContent
        side="top"
        sideOffset={6}
        className="max-w-[380px] border-[rgba(60,40,80,0.5)] bg-[#170f29] p-2.5 text-[11px] leading-snug whitespace-normal shadow-lg"
      >
        <BtTooltipBody text={text} formula={formula} showFormulaLabel={labeled} />
      </TooltipContent>
    </Tooltip>
  );
});

export const BtHeaderWithHelp = memo(function BtHeaderWithHelp({
  children,
  label,
  text,
  formula,
  tip,
}) {
  return (
    <span className="inline-flex items-center gap-1">
      {children}
      <BtInfoTooltip label={label} text={text} formula={formula} tip={tip} />
    </span>
  );
});

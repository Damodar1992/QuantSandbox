import React, { memo } from "react";
import { CircleHelp } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { strategyUiTooltip } from "@/constants/strategyTooltips";
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

const TIP_CONTENT_CLASS =
  "pointer-events-none z-[100001] max-w-[440px] border-[rgba(60,40,80,0.5)] bg-[#170f29] p-2.5 text-[11px] leading-snug shadow-lg";

/** Approved catalog body: one field, with paragraph breaks and **bold**. */
function CatalogTooltipBody({ text }) {
  const normalized = String(text)
    .replace(/\r\n/g, "\n")
    .replace(/<br\s*\/?>/gi, "\n");
  return (
    <div className="whitespace-pre-wrap text-[11px] leading-snug text-[#c8c0d4]">
      {renderRichText(normalized)}
    </div>
  );
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
const HELP_BUTTON_CLASS =
  "inline-flex shrink-0 rounded-sm text-violet-400 hover:text-violet-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400";
const VALUE_TRIGGER_CLASS =
  "inline-flex cursor-default rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400";
const DOTTED_LABEL =
  "underline decoration-dotted underline-offset-2 decoration-[#6e6682]";

export const BtInfoTooltip = memo(function BtInfoTooltip({
  label,
  text,
  formula,
  tip,
  content,
  className,
}) {
  const catalog = typeof content === "string" && content.trim() ? content : null;
  const resolved = catalog ? null : normalizeTip(tip) || normalizeTip({ text, formula });
  if (!catalog && !resolved) return null;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className={cx(HELP_BUTTON_CLASS, className)}
          aria-label={`Help: ${label || "info"}`}
          onClick={(e) => e.preventDefault()}
        >
          <CircleHelp className="h-3.5 w-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent
        side="top"
        sideOffset={6}
        collisionPadding={12}
        className={cx(TIP_CONTENT_CLASS, catalog ? "whitespace-pre-wrap" : "whitespace-normal")}
      >
        {catalog ? (
          <CatalogTooltipBody text={catalog} />
        ) : (
          <BtTooltipBody text={resolved.text} formula={resolved.formula} />
        )}
      </TooltipContent>
    </Tooltip>
  );
});

/** Wraps any node into a tooltip trigger — used for metric values and N/A tags. */
export const BtValueTooltip = memo(function BtValueTooltip({
  text,
  formula,
  content,
  children,
  className,
}) {
  const catalog = typeof content === "string" && content.trim() ? content : null;
  if (!catalog && !text && !formula) return children;
  const labeled = Array.isArray(formula);
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span tabIndex={0} className={cx(VALUE_TRIGGER_CLASS, className)}>
          {children}
        </span>
      </TooltipTrigger>
      <TooltipContent
        side="top"
        sideOffset={6}
        collisionPadding={12}
        className={cx(TIP_CONTENT_CLASS, catalog ? "whitespace-pre-wrap" : "whitespace-normal")}
      >
        {catalog ? (
          <CatalogTooltipBody text={catalog} />
        ) : (
          <BtTooltipBody text={text} formula={formula} showFormulaLabel={labeled} />
        )}
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
  content,
}) {
  return (
    <span className="inline-flex items-center gap-1">
      {children}
      <BtInfoTooltip label={label} text={text} formula={formula} tip={tip} content={content} />
    </span>
  );
});

/** Dotted label tooltip for an approved strategy field. No trigger when the stage does not apply. */
export function StrategyUiTip({ block, field, stage, children, className }) {
  const text = strategyUiTooltip(block, field, stage);
  if (!text) return children;
  return (
    <BtValueTooltip content={text}>
      <span className={cx(DOTTED_LABEL, className)}>{children}</span>
    </BtValueTooltip>
  );
}

/** One help-icon trigger beside a form label. */
export function StrategyUiHelp({ block, field, stage, label, children, className }) {
  const text = strategyUiTooltip(block, field, stage);
  return (
    <span className={cx("inline-flex items-center gap-1", className)}>
      {children}
      {text ? <BtInfoTooltip label={label} content={text} /> : null}
    </span>
  );
}

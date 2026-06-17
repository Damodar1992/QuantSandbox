import React from "react";
import { cx } from "../../../constants/ui";
import { crmAccent, crmSurface } from "../../../constants/crmAccent";

function CommentIcon({ className }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );
}

export function StageVersionCommentButton({
  disabled = false,
  hasComment = false,
  onClick,
  className,
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        if (typeof onClick === "function") onClick();
      }}
      title={hasComment ? "Edit comment" : "Add comment"}
      aria-label={hasComment ? "Edit comment" : "Add comment"}
      className={cx(
        "relative inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border text-muted-foreground",
        crmSurface.border,
        crmSurface.input,
        "hover:bg-secondary hover:text-foreground focus:outline-none focus:ring-2",
        crmAccent.ring,
        hasComment && cx(crmAccent.border, crmAccent.textStrong),
        disabled && cx("opacity-40 cursor-not-allowed", "hover:bg-background hover:text-muted-foreground"),
        className,
      )}
    >
      <CommentIcon className="h-3.5 w-3.5" />
      {hasComment && (
        <span
          className={cx("absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full ring-2 ring-background", crmAccent.dot)}
          aria-hidden
        />
      )}
    </button>
  );
}

import React, { memo } from "react";
import { cx } from "@/constants/ui";
import { toggleUiVariant, resolveUiVariant, isProdUi } from "@/constants/uiVariant";

export const UiVariantToggle = memo(function UiVariantToggle({ className }) {
  const variant = resolveUiVariant();
  return (
    <button
      type="button"
      onClick={toggleUiVariant}
      className={cx(
        "rounded-md border border-border px-2 py-1 text-[10px] text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors",
        className,
      )}
      title="Switch UI theme (reloads page)"
    >
      UI: {variant === "prod" ? "Prod" : "Legacy"}
    </button>
  );
});

export { isProdUi };

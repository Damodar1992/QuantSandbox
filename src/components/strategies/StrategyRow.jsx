import React, { memo } from "react";
import { cx, ui } from "../../constants/ui";
import { crmSurface } from "../../constants/crmAccent";
import { EyeIcon } from "../common";
import { RowActionMenu } from "./RowActionMenu";

function getLatestVersion(strategy) {
  const versions = strategy.versions ?? [];
  return versions[versions.length - 1] ?? null;
}

export const StrategyRow = memo(({ strategy, onSelectVersion, onOpenVersionTree }) => {
  const version = getLatestVersion(strategy);

  return (
    <tr className={cx(crmSurface.panel, "hover:bg-secondary transition-colors")}>
      <td className={cx("px-4 py-2 border-b", crmSurface.border)}>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className={cx(
              "inline-flex h-8 w-8 items-center justify-center rounded-md border text-muted-foreground hover:bg-secondary",
              crmSurface.border,
              crmSurface.input,
            )}
            onClick={() => version && onSelectVersion(strategy.id, version.id)}
            title="View"
            aria-label="View"
            disabled={!version}
          >
            <EyeIcon />
          </button>
          <span className="font-medium">{strategy.name}</span>
        </div>
      </td>
      <td className={cx("px-2 py-2 border-b text-[12px] text-muted-foreground", crmSurface.border)}>
        {version?.description ?? "—"}
      </td>
      <td className={cx("px-2 py-2 border-b text-[12px]", crmSurface.border, crmSurface.text)}>{strategy.owner}</td>
      <td className={cx("px-2 py-2 border-b text-[12px] text-muted-foreground", crmSurface.border)}>
        {version?.createdAt ?? "—"}
      </td>
      <td className={cx("px-2 py-2 border-b", crmSurface.border)}>
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => typeof onOpenVersionTree === "function" && onOpenVersionTree(strategy)}
            className={cx(ui.btn, "h-8 px-2 text-[10px] whitespace-nowrap")}
            title="Show stage version tree"
          >
            Version tree
          </button>
          <RowActionMenu
            onDuplicate={() => alert(`Duplicate strategy: ${strategy.name}`)}
            onDelete={() => alert(`Delete strategy: ${strategy.name}`)}
          />
        </div>
      </td>
    </tr>
  );
});

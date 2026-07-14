import React, { memo } from "react";
import { cx, ui } from "../../constants/ui";
import { crmSurface } from "../../constants/crmAccent";
import { EyeIcon } from "../common";
import { resolveTagNames } from "../../features/tags/utils/tagStore";
import { RowActionMenu } from "./RowActionMenu";

function getLatestVersion(strategy) {
  const versions = strategy.versions ?? [];
  return versions[versions.length - 1] ?? null;
}

export const StrategyRow = memo(({
  strategy,
  onSelectVersion,
  onOpenVersionTree,
  tagsRegistry = [],
  onAddTag,
}) => {
  const version = getLatestVersion(strategy);
  const tagNames = resolveTagNames(strategy.tagIds, tagsRegistry);

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
      <td
        className={cx("px-2 py-2 border-b text-[12px] max-w-[200px] align-top", crmSurface.border)}
        title={tagNames.length ? tagNames.join(", ") : undefined}
      >
        {tagNames.length ? (
          <div className="flex flex-wrap gap-1">
            {tagNames.slice(0, 3).map((t) => (
              <span
                key={t}
                className="rounded border border-[#303030] bg-[#0f0f0f] px-1.5 py-0.5 text-[10px] text-[#d9d9d9]"
              >
                {t}
              </span>
            ))}
            {tagNames.length > 3 && (
              <span className="self-center text-[10px] text-[#8c8c8c]">+{tagNames.length - 3}</span>
            )}
          </div>
        ) : (
          <span className="text-[#8c8c8c]">—</span>
        )}
      </td>
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
            onAddTag={() => onAddTag?.(strategy)}
          />
        </div>
      </td>
    </tr>
  );
});

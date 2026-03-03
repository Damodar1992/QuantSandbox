import React, { memo } from "react";
import { Badge, EyeIcon } from "../common";
import { RowActionMenu } from "./RowActionMenu";

export const StrategyRow = memo(({ strategy, isExpanded, onToggle, onSelectVersion }) => (
  <>
    <tr className="bg-[#141414] hover:bg-[#1f1f1f] transition-colors">
      <td className="px-4 py-2 border-b border-[#303030]">
        <button className="inline-flex items-center gap-2 text-emerald-300 hover:text-emerald-200" onClick={() => onToggle(strategy.id)}>
          <span className="flex h-4 w-4 items-center justify-center rounded border border-[#303030] bg-[#0f0f0f] text-[11px] text-[#a6a6a6]">
            {isExpanded ? "-" : "+"}
          </span>
          <span className="font-medium">{strategy.name}</span>
          <span className="text-[11px] text-[#8c8c8c]">({strategy.versions.length} versions)</span>
        </button>
      </td>
      <td colSpan={6} className="border-b border-[#303030]" />
    </tr>

    {isExpanded &&
      strategy.versions.map((version) => (
        <tr key={version.id} className="bg-[#141414] hover:bg-[#1f1f1f] transition-colors">
          <td className="px-6 py-2 border-b border-[#303030]">
            <div className="flex items-center gap-2">
              <span className="rounded-md border border-[#303030] bg-[#0f0f0f] px-2 py-0.5 text-[11px] text-[#a6a6a6]">v{version.version}</span>
              <button
                type="button"
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#303030] bg-[#0f0f0f] text-[#a6a6a6] hover:bg-[#1f1f1f]"
                onClick={() => onSelectVersion(strategy.id, version.id)}
                title="View"
                aria-label="View"
              >
                <EyeIcon />
              </button>
            </div>
          </td>
          <td className="px-2 py-2 border-b border-[#303030] text-[12px] text-[#a6a6a6]">{version.description}</td>
          <td className="px-2 py-2 border-b border-[#303030] text-[12px] text-[#d9d9d9]">{version.currentStage ?? "Signal"}</td>
          <td className="px-2 py-2 border-b border-[#303030]">
            <Badge status={version.status} />
          </td>
          <td className="px-2 py-2 border-b border-[#303030] text-[12px] text-[#d9d9d9]">{strategy.owner}</td>
          <td className="px-2 py-2 border-b border-[#303030] text-[12px] text-[#a6a6a6]">{version.createdAt}</td>
          <td className="px-2 py-2 border-b border-[#303030]">
            <RowActionMenu
              onDuplicate={() => alert(`Duplicate strategy: ${strategy.name} v${version.version}`)}
              onDelete={() => alert(`Delete strategy: ${strategy.name}`)}
            />
          </td>
        </tr>
      ))}
  </>
));

import React, { useMemo } from "react";
import { cx } from "../../../constants/ui";
import {
  buildVersionForest,
  formatTreeNodeLabel,
  getConnectorPath,
  layoutVersionForest,
  TREE_NODE_HEIGHT,
  TREE_NODE_WIDTH,
  TREE_PADDING,
} from "../utils/versionTreeLayout";
import { VersionNodeTooltip } from "./VersionNodeTooltip";

export function StageVersionFlowTree({
  versions = [],
  strategyName = "",
  selectedByStage = {},
  commentsByVersionId = {},
  onSelectNode,
}) {
  const layout = useMemo(() => {
    const forest = buildVersionForest(versions);
    return layoutVersionForest(forest);
  }, [versions]);

  if (layout.nodes.length === 0) {
    return <p className="text-[12px] text-[#8c8c8c]">No versions for this strategy.</p>;
  }

  return (
    <div className="overflow-auto rounded-lg border border-[#303030] bg-[#0a0a0a]">
      <div
        className="relative mx-auto"
        style={{
          width: layout.width,
          height: layout.height,
          minWidth: "100%",
        }}
      >
        <svg
          className="absolute left-0 top-0 pointer-events-none"
          width={layout.width}
          height={layout.height}
          aria-hidden
        >
          <defs>
            <marker
              id="version-tree-arrow"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#d9d9d9" />
            </marker>
          </defs>
          <g transform={`translate(${TREE_PADDING}, ${TREE_PADDING})`}>
            {layout.edges.map((edge) => (
              <path
                key={`${edge.from.id}-${edge.to.id}`}
                d={getConnectorPath(edge)}
                fill="none"
                stroke="#d9d9d9"
                strokeWidth="1.5"
                markerEnd="url(#version-tree-arrow)"
              />
            ))}
          </g>
        </svg>

        <div
          className="absolute left-0 top-0"
          style={{ width: layout.width, height: layout.height }}
        >
          {layout.nodes.map((node) => {
            const isSelected = selectedByStage[node.stageType] === node.id;
            const label = formatTreeNodeLabel(node, strategyName);
            const comment = commentsByVersionId[node.id] ?? "";

            return (
              <VersionNodeTooltip
                key={node.id}
                label={label}
                tagNames={node.tagNames}
                comment={comment}
                wrapperStyle={{
                  position: "absolute",
                  left: node.x + TREE_PADDING,
                  top: node.y + TREE_PADDING,
                  width: TREE_NODE_WIDTH,
                  height: TREE_NODE_HEIGHT,
                }}
              >
                <button
                  type="button"
                  onClick={() => typeof onSelectNode === "function" && onSelectNode(node.id)}
                  title={!comment?.trim() && !node.tagNames?.length ? label : undefined}
                  className={cx(
                    "flex h-full w-full items-center justify-center rounded-md border px-2 text-center transition-colors",
                    "bg-[#1a1a1a] hover:bg-[#242424] focus:outline-none focus:ring-2 focus:ring-emerald-500/40",
                    isSelected
                      ? "border-emerald-500/70 ring-1 ring-emerald-500/30 text-emerald-50"
                      : "border-[#4a4a4a] text-[#f0f0f0]",
                    comment?.trim() && "ring-1 ring-amber-500/25",
                  )}
                >
                  <span className="text-[10px] font-medium leading-tight line-clamp-2">{label}</span>
                </button>
              </VersionNodeTooltip>
            );
          })}
        </div>
      </div>
    </div>
  );
}

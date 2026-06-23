import React, { memo } from "react";
import { cx, ui } from "@/constants/ui";
import { StageVersionSelect, StageVersionCommentButton } from "@/features/versioning";
import { ProdButton } from "@/components/prod/ProdButton";

export const BuilderStagePills = memo(function BuilderStagePills({
  stages,
  activeStageId,
  onStageChange,
  getStageStatus,
  selectedVersionByStage,
  onStageVersionChange,
  onAddNewStageVersion,
  onOpenVersionComment,
  onOpenVersionTree,
  versionBreadcrumb,
  className,
}) {
  return (
    <div className={cx("space-y-2", className)}>
      <div className="flex items-center gap-2">
        <nav className="grid min-w-0 flex-1 grid-cols-5 gap-2" aria-label="Strategy stages">
          {stages.map((stage) => {
            const isActive = stage.id === activeStageId;
            const isLocked = stage.locked;
            const status = getStageStatus?.(stage);
            const stageType = stage.stageType;
            const cardTitle = status ? `${stage.title} (${status})` : stage.title;

            return (
              <div
                key={stage.id}
                className={cx(
                  "flex min-w-0 items-center gap-1.5 rounded-lg border px-2 py-1.5 transition",
                  isActive
                    ? "border-violet-500/55 bg-[#1e1333] shadow-[inset_0_1px_0_rgba(221,214,254,0.08)]"
                    : "border-[rgba(60,40,80,0.5)] bg-[#19102b]/90 hover:border-[rgba(60,40,80,0.75)]",
                  isLocked && "opacity-60",
                )}
                title={cardTitle}
              >
                <div
                  role="button"
                  tabIndex={isLocked ? -1 : 0}
                  onClick={() => {
                    if (!isLocked && typeof onStageChange === "function") onStageChange(stage.id);
                  }}
                  onKeyDown={(e) => {
                    if (isLocked) return;
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      if (typeof onStageChange === "function") onStageChange(stage.id);
                    }
                  }}
                  className={cx(
                    "flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden",
                    isLocked ? "cursor-not-allowed" : "cursor-pointer",
                  )}
                >
                  <span
                    className={cx(
                      "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md border [&_svg]:h-3 [&_svg]:w-3",
                      isActive
                        ? "border-violet-400/40 bg-[#2c1b46] text-[#ddd6fe]"
                        : "border-[rgba(60,40,80,0.45)] bg-[#2c1b46] text-[#b8aecc]",
                    )}
                  >
                    {stage.icon}
                  </span>
                  <span
                    className={cx(
                      "truncate text-[11px] font-semibold leading-tight",
                      isActive ? "text-[#faf7fd]" : "text-[#b8aecc]",
                    )}
                  >
                    {stage.label}
                  </span>
                </div>

                {stageType ? (
                  <div className="flex shrink-0 items-center gap-1 border-l border-[rgba(60,40,80,0.45)] pl-1.5">
                    <StageVersionSelect
                      value={selectedVersionByStage?.[stageType]}
                      options={stage.versionOptions}
                      disabled={stage.versionDisabled}
                      placeholder={stage.versionDisabled ? "—" : "…"}
                      onChange={(versionId) => onStageVersionChange?.(stageType, versionId)}
                      onAddNewVersion={() => onAddNewStageVersion?.(stageType)}
                      className="h-6 w-[3.5rem] shrink-0 px-1 text-[9px]"
                    />
                    <StageVersionCommentButton
                      disabled={stage.versionDisabled || !selectedVersionByStage?.[stageType]}
                      hasComment={stage.hasComment}
                      onClick={() => onOpenVersionComment?.(stageType)}
                      className="h-6 w-6 shrink-0 [&_svg]:h-2.5 [&_svg]:w-2.5"
                    />
                  </div>
                ) : null}
              </div>
            );
          })}
        </nav>

        <ProdButton
          variant="outline"
          size="sm"
          onClick={onOpenVersionTree}
          className="shrink-0 whitespace-nowrap"
          title="Show full version hierarchy"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-3.5 w-3.5 shrink-0"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <circle cx="6" cy="6" r="2.5" />
            <circle cx="6" cy="18" r="2.5" />
            <circle cx="18" cy="12" r="2.5" />
            <path d="M6 8.5v7M6 12h8.5a2.5 2.5 0 0 0 0-5H6" />
          </svg>
          Version tree
        </ProdButton>
      </div>

      {versionBreadcrumb?.length > 0 ? (
        <div className={cx("text-[11px]", ui.textMuted)}>{versionBreadcrumb.join(" → ")}</div>
      ) : null}
    </div>
  );
});

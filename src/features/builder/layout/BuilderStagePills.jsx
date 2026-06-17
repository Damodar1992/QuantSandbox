import React, { memo } from "react";
import { cx, ui } from "@/constants/ui";
import { isProdUi } from "@/constants/uiVariant";
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
  const prod = isProdUi();

  return (
    <div className={cx("space-y-2", className)}>
      <div className="flex items-center gap-2">
        <nav
          className="grid min-w-0 flex-1 grid-cols-5 gap-2"
          aria-label="Strategy stages"
        >
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
                    ? prod
                      ? "border-violet-500/55 bg-[#1e1333] shadow-[inset_0_1px_0_rgba(221,214,254,0.08)]"
                      : "border-emerald-500/40 bg-emerald-500/10"
                    : prod
                      ? "border-[rgba(60,40,80,0.5)] bg-[#19102b]/90 hover:border-[rgba(60,40,80,0.75)]"
                      : cx("border-[#303030] bg-[#141414] hover:bg-[#1a1a1a]"),
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
                      "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md border",
                      isActive
                        ? prod
                          ? "border-violet-400/40 bg-[#2c1b46] text-[#ddd6fe]"
                          : ui.stepIconActive
                        : prod
                          ? "border-[rgba(60,40,80,0.45)] bg-[#2c1b46] text-[#b8aecc]"
                          : ui.stepIconIdle,
                      "[&_svg]:h-3 [&_svg]:w-3",
                    )}
                  >
                    {stage.icon}
                  </span>
                  <span
                    className={cx(
                      "truncate text-[11px] font-semibold leading-tight",
                      isActive
                        ? prod
                          ? "text-[#faf7fd]"
                          : "text-emerald-100"
                        : prod
                          ? "text-[#b8aecc]"
                          : "text-[#d9d9d9]",
                    )}
                  >
                    {stage.label}
                  </span>
                </div>

                {stageType ? (
                  <div
                    className={cx(
                      "flex shrink-0 items-center gap-1 border-l pl-1.5",
                      prod ? "border-[rgba(60,40,80,0.45)]" : "border-[#303030]",
                    )}
                  >
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

        {prod ? (
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
        ) : (
          <button
            type="button"
            onClick={onOpenVersionTree}
            className={cx(ui.btn, "h-7 shrink-0 px-2 text-[10px] whitespace-nowrap")}
            title="Show full version hierarchy"
          >
            <span className="inline-flex items-center gap-1.5">
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
            </span>
          </button>
        )}
      </div>

      {versionBreadcrumb?.length > 0 ? (
        <div className={cx("text-[11px]", ui.textMuted)}>{versionBreadcrumb.join(" → ")}</div>
      ) : null}
    </div>
  );
});

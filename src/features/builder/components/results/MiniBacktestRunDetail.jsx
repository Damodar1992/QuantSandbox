import React, { memo } from "react";
import { MiniBacktestDashboard } from "./MiniBacktestDashboard";
import { MiniBacktestInProgressPanel } from "./MiniBacktestInProgressPanel";
import { MiniBacktestFailPanel } from "./MiniBacktestFailPanel";
import { AppButton } from "../../../../components/common/AppButton";
import { TrashIcon } from "../../../../components/shared";
import { resolveMiniBacktestRunStatus } from "../../utils/miniBacktestDisplay";
import { MINI_BACKTEST_RUN_STATUSES } from "../../../../constants/miniBacktest";

function MiniBacktestDeleteButton({ entry, onDelete }) {
  if (!onDelete || !entry) return null;
  return (
    <div className="mb-3 flex justify-end">
      <AppButton
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onDelete(entry.id)}
        title="Delete mini backtest"
        aria-label="Delete mini backtest"
        className="shrink-0 text-red-400/90 hover:text-red-300"
      >
        <TrashIcon />
        Delete
      </AppButton>
    </div>
  );
}

export const MiniBacktestRunDetail = memo(function MiniBacktestRunDetail({
  entry,
  onDelete,
  onEditTags,
  tagsRegistry = [],
}) {
  if (!entry) {
    return (
      <div className="flex items-center justify-center min-h-[320px] text-[12px] text-[#8c8c8c]">
        Select a mini backtest run
      </div>
    );
  }

  const status = resolveMiniBacktestRunStatus(entry);

  if (status === MINI_BACKTEST_RUN_STATUSES.IN_PROGRESS) {
    return (
      <>
        <MiniBacktestDeleteButton entry={entry} onDelete={onDelete} />
        <MiniBacktestInProgressPanel entry={entry} />
      </>
    );
  }
  if (status === MINI_BACKTEST_RUN_STATUSES.FAIL) {
    return (
      <>
        <MiniBacktestDeleteButton entry={entry} onDelete={onDelete} />
        <MiniBacktestFailPanel entry={entry} />
      </>
    );
  }
  return (
    <MiniBacktestDashboard
      entry={entry}
      onDelete={onDelete}
      onEditTags={onEditTags}
      tagsRegistry={tagsRegistry}
    />
  );
});

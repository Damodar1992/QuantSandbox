/**
 * Delete operation progress and result modal.
 *
 * States:
 *   preparing       – spinner with "Preparing…"
 *   deleting        – spinner with "Deleting RAW data…"
 *   done/completed  – success summary
 *   done/partially  – partial success with error list
 *   done/failed     – full failure with error list
 */

import React from "react";
import { AppButton } from "../common";
import { AppDialog } from "../common/AppDialog";

function fmt(gb) {
  if (gb >= 1000) return `${(gb / 1000).toFixed(2)} TB`;
  return `${gb.toFixed(2)} GB`;
}

function Spinner() {
  return (
    <svg className="h-8 w-8 animate-spin text-violet-400" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

function SuccessIcon() {
  return (
    <div className="h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
      <svg className="h-5 w-5 text-emerald-400" viewBox="0 0 20 20" fill="none">
        <path d="M4 10l4 4 8-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

function PartialIcon() {
  return (
    <div className="h-10 w-10 rounded-full bg-amber-500/20 flex items-center justify-center">
      <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="none">
        <path d="M10 3v7M10 14h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </div>
  );
}

function FailIcon() {
  return (
    <div className="h-10 w-10 rounded-full bg-red-500/20 flex items-center justify-center">
      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="none">
        <path d="M6 6l8 8M14 6l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </div>
  );
}

export function StorageDeleteProgressModal({ deleteOp, onDismiss }) {
  const { phase, result, processingIds } = deleteOp;
  const isDone = phase === "done";
  const inProgress = phase === "preparing" || phase === "deleting";
  const resultStatus = result?.status;

  return (
    <AppDialog
      open
      onOpenChange={(next) => {
        if (!next && isDone) onDismiss?.();
      }}
      title={inProgress ? "Deleting RAW Data" : "Deletion Result"}
      className="max-w-[480px]"
      showCloseButton={isDone}
    >
      <div className="flex flex-col items-center gap-4 text-center py-1">
        {inProgress && (
          <>
            <Spinner />
            <div>
              <div className="text-[13px] font-medium text-foreground">
                {phase === "preparing" ? "Preparing…" : "Deleting RAW data…"}
              </div>
              {phase === "deleting" && processingIds && (
                <div className="text-[11px] text-muted-foreground mt-1">
                  Processing {processingIds.size} hyperopt{processingIds.size !== 1 ? "s" : ""}
                </div>
              )}
            </div>
          </>
        )}

        {isDone && resultStatus === "completed" && (
          <>
            <SuccessIcon />
            <div>
              <div className="text-[14px] font-semibold text-emerald-400">Deletion completed</div>
              <div className="text-[12px] text-muted-foreground mt-1">
                {result.succeededIds.length} hyperopt{result.succeededIds.length !== 1 ? "s" : ""} deleted successfully.
                {result.released > 0 && (
                  <> <span className="text-emerald-400 font-medium">{fmt(result.released)}</span> freed.</>
                )}
              </div>
            </div>
          </>
        )}

        {isDone && resultStatus === "partiallyCompleted" && (
          <>
            <PartialIcon />
            <div className="w-full space-y-3">
              <div>
                <div className="text-[14px] font-semibold text-amber-400">Partially completed</div>
                <div className="text-[12px] text-muted-foreground mt-1">
                  <span className="text-emerald-400 font-medium">{result.succeededIds.length} succeeded</span>
                  {" · "}
                  <span className="text-red-400 font-medium">{result.failedIds.length} failed</span>
                  {result.released > 0 && <> · {fmt(result.released)} freed</>}
                </div>
              </div>
              {result.errors?.length > 0 && (
                <div className="text-left rounded-lg border border-red-500/25 bg-red-500/5 p-3 space-y-1.5">
                  <div className="text-[10px] font-medium text-red-400 uppercase tracking-wide">Failed hyperopts</div>
                  {result.errors.map((e) => (
                    <div key={e.hyperoptId} className="text-[11px] text-red-300/80">
                      <span className="font-mono">{e.hyperoptId}</span>
                      {" — "}
                      <span className="text-muted-foreground">{e.reason}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {isDone && resultStatus === "failed" && (
          <>
            <FailIcon />
            <div className="w-full space-y-3">
              <div>
                <div className="text-[14px] font-semibold text-red-400">Deletion failed</div>
                <div className="text-[12px] text-muted-foreground mt-1">
                  All {result.failedIds.length} hyperopt{result.failedIds.length !== 1 ? "s" : ""} failed to delete.
                </div>
              </div>
              {result.errors?.length > 0 && (
                <div className="text-left rounded-lg border border-red-500/25 bg-red-500/5 p-3 space-y-1.5">
                  <div className="text-[10px] font-medium text-red-400 uppercase tracking-wide">Errors</div>
                  {result.errors.map((e) => (
                    <div key={e.hyperoptId} className="text-[11px] text-red-300/80">
                      <span className="font-mono">{e.hyperoptId}</span>
                      {" — "}
                      <span className="text-muted-foreground">{e.reason}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {isDone && (
        <div className="flex justify-end pt-2">
          <AppButton variant="outline" size="sm" onClick={onDismiss}>
            Close
          </AppButton>
        </div>
      )}
    </AppDialog>
  );
}

/**
 * How It Works modal for the Storage page.
 * Provides step-by-step instructions for selecting what to clean up and expectations.
 */

import React from "react";
import { AppButton } from "../common";

export function StorageHowItWorksModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="rounded-lg bg-[#141414] border border-[#303030] max-w-[760px] w-full max-h-[90vh] overflow-hidden flex flex-col shadow-xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#303030]">
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4 text-violet-400" viewBox="0 0 16 16" fill="none" aria-hidden>
              <path
                d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM6.6 6.2h2.3v.7c0 1-.8 1.4-1.2 1.7-.4.3-.5.4-.5.9v.3h-.9v-.4c0-.8.5-1.2.9-1.5.4-.3.9-.5.9-1.1v-.3H6.6V6.2z"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
              />
            </svg>
            <span className="text-[13px] font-semibold text-foreground">How it Works</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Close"
          >
            <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" aria-hidden>
              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="overflow-auto p-4 flex-1 min-h-0">
          <div className="space-y-4">
            <div className="text-[12px] text-muted-foreground">
              Use this page to review disk usage and free up space by deleting Hyperopt RAW data.
            </div>

            <div className="rounded-lg border border-[#303030] bg-[#0f0f0f]/40 p-3 space-y-2">
              <div className="flex items-start gap-2">
                <span className="text-[12px] font-semibold text-violet-300">1.</span>
                <div className="text-[12px] font-semibold text-foreground">Select What to Clean Up</div>
              </div>
              <div className="text-[11px] text-muted-foreground space-y-2">
                <div>You can select records at any hierarchy level:</div>
                <ul className="list-disc list-inside space-y-1">
                  <li><strong>Hyperopt Run</strong> — deletes RAW data only for the selected run.</li>
                  <li><strong>Stage Version</strong> — deletes RAW data for all Hyperopt Runs in that version.</li>
                  <li><strong>Stage</strong> — deletes RAW data for all Hyperopt Runs across all versions of that Stage.</li>
                  <li><strong>Strategy</strong> — deletes RAW data for all Hyperopt Runs across all Stages and versions of that Strategy.</li>
                </ul>
                <div>You can deselect individual records before confirming the operation.</div>
              </div>
            </div>

            <div className="rounded-lg border border-[#303030] bg-[#0f0f0f]/40 p-3 space-y-2">
              <div className="flex items-start gap-2">
                <span className="text-[12px] font-semibold text-violet-300">2.</span>
                <div className="text-[12px] font-semibold text-foreground">Review the Impact</div>
              </div>
              <div className="text-[11px] text-muted-foreground space-y-2">
                <div>Before deletion, the system shows:</div>
                <ul className="list-disc list-inside space-y-1">
                  <li>Number of affected Hyperopt Runs</li>
                  <li>Total disk space to be released</li>
                </ul>
                <div>
                  Each Hyperopt Run is counted only once, even if it is included through multiple selected levels.
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-[#303030] bg-[#0f0f0f]/40 p-3 space-y-2">
              <div className="flex items-start gap-2">
                <span className="text-[12px] font-semibold text-violet-300">3.</span>
                <div className="text-[12px] font-semibold text-foreground">What Is Deleted</div>
              </div>
              <div className="text-[11px] text-muted-foreground space-y-2">
                <div><strong>Only Hyperopt RAW data</strong> is deleted.</div>
                <div>The following data remains available:</div>
                <ul className="list-disc list-inside space-y-1">
                  <li>Strategy</li>
                  <li>Stage</li>
                  <li>Stage Version</li>
                  <li>Hyperopt Run</li>
                  <li>Analyzer results</li>
                  <li>Epoch metrics</li>
                  <li>existing Reports</li>
                  <li>existing Heatmaps</li>
                </ul>
                <div>
                  After deletion, the Hyperopt Run is marked as <strong>Raw data deleted</strong>.
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-[#303030] bg-[#0f0f0f]/40 p-3 space-y-2">
              <div className="flex items-start gap-2">
                <span className="text-[12px] font-semibold text-violet-300">4.</span>
                <div className="text-[12px] font-semibold text-foreground">What Becomes Unavailable</div>
              </div>
              <div className="text-[11px] text-muted-foreground space-y-2">
                <ul className="list-disc list-inside space-y-1">
                  <li>New post-processing cannot be started for the affected Hyperopt Runs.</li>
                  <li>New Favorite Epochs cannot be selected from the Epoch table or Heatmap.</li>
                  <li>Existing Favorite Epochs are marked as <strong>Raw data deleted</strong>.</li>
                  <li>Affected Epochs cannot be used to start a Hyperopt Run on the next Stage.</li>
                </ul>
              </div>
            </div>

            <div className="rounded-lg border border-[#303030] bg-[#0f0f0f]/40 p-3 space-y-2">
              <div className="flex items-start gap-2">
                <span className="text-[12px] font-semibold text-violet-300">5.</span>
                <div className="text-[12px] font-semibold text-foreground">What Remains Available</div>
              </div>
              <div className="text-[11px] text-muted-foreground space-y-2">
                <div>You can still:</div>
                <ul className="list-disc list-inside space-y-1">
                  <li>Review existing Analyzer results</li>
                  <li>View existing Reports and Heatmaps</li>
                  <li>Create new Reports and Heatmaps from previously saved results</li>
                  <li>Review saved Epoch parameters and metrics</li>
                </ul>
              </div>
            </div>

            <div className="rounded-lg border border-violet-500/30 bg-violet-500/5 p-3 text-[11px] text-muted-foreground">
              <div className="text-[12px] font-semibold text-violet-200">Important</div>
              <div className="mt-1">Deleted RAW data cannot be restored.</div>
            </div>
          </div>
        </div>

        <div className="px-4 py-3 border-t border-[#303030] flex justify-end gap-2">
          <AppButton variant="outline" size="sm" onClick={onClose}>
            Close
          </AppButton>
        </div>
      </div>
    </div>
  );
}


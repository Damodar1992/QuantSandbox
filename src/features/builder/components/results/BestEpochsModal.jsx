import React, { memo, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { cx, ui } from "../../../../constants/ui";
import { AppButton } from "../../../../components/common/AppButton";

export function parseEpochNumbersInput(input) {
  const parsed = String(input || "")
    .split(/[,;\s]+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => Number(part))
    .filter((n) => Number.isFinite(n) && n > 0);
  return [...new Set(parsed)];
}

export const BestEpochsModal = memo(function BestEpochsModal({
  open,
  context,
  mode = "add-favorites",
  onClose,
  onSubmit,
}) {
  const [input, setInput] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setInput("");
      setError("");
    }
  }, [open, context]);

  if (!open) return null;

  const isMiniBacktest = mode === "mini-backtest";

  const handleSubmit = () => {
    const epochs = parseEpochNumbersInput(input);
    if (epochs.length === 0) {
      setError(
        isMiniBacktest
          ? "Enter an epoch number."
          : "Enter one or more epoch numbers separated by commas.",
      );
      return;
    }
    if (isMiniBacktest && epochs.length !== 1) {
      setError("Enter a single epoch number for Mini Backtest.");
      return;
    }
    onSubmit?.(epochs);
  };

  const subtitle = context
    ? `Hyperopt #${context.row?.hyperoptNumber ?? "—"} · Analyzer #${context.sub?.analyzerNumber ?? "—"}`
    : "";

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div
        className={cx(
          ui.radius,
          "bg-[#141414] border border-[#303030] max-w-[480px] w-full shadow-xl",
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#303030]">
          <div>
            <div className="text-[14px] font-medium text-[#d9d9d9]">
              {isMiniBacktest ? "Run Mini Backtest" : "Best Epochs"}
            </div>
            {subtitle && <div className={cx("text-[11px] mt-0.5", ui.textMuted)}>{subtitle}</div>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#8c8c8c] hover:text-[#d9d9d9] p-1"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="p-4 space-y-3">
          <p className={cx("text-[11px]", ui.textMuted)}>
            {isMiniBacktest
              ? "Enter the epoch number to configure and run a Mini Backtest for this hyperopt result."
              : "Enter epoch numbers separated by commas. They will be added to Favorite Epochs for this stage."}
          </p>
          <div>
            <label className="block text-[11px] text-[#8c8c8c] mb-1">
              {isMiniBacktest ? "Epoch number" : "Epoch numbers"}
            </label>
            <input
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                setError("");
              }}
              className={cx(ui.input, "h-9 w-full text-[12px]")}
              placeholder={isMiniBacktest ? "e.g. 3" : "e.g. 1, 3, 5"}
              autoFocus
            />
            {error && <p className="mt-1.5 text-[11px] text-red-400">{error}</p>}
          </div>
        </div>

        <div className="px-4 py-3 border-t border-[#303030] flex justify-end gap-2">
          <AppButton type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </AppButton>
          <AppButton type="button" variant="default" size="sm" onClick={handleSubmit}>
            {isMiniBacktest ? "Continue" : "Add to Favorite Epochs"}
          </AppButton>
        </div>
      </div>
    </div>,
    document.body,
  );
});

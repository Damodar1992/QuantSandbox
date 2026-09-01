import React, { memo, useEffect, useState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import { cx, ui } from "@/constants/ui";
import { AppButton } from "@/components/common/AppButton";
import { Progress } from "@/components/ui/progress";

const COMPILE_ERROR = {
  code: "STRATEGY_COMPILE_FAILED",
  message: "Strategy code could not be compiled for the validation engine.",
  hint: "Check the exported Python strategy and retry compilation.",
};

const BAR =
  "h-2 w-full max-w-md rounded-full bg-[#0f0f0f] border border-[rgba(60,40,80,0.35)] " +
  "[&_[data-slot=progress-indicator]]:bg-violet-600 " +
  "[&_[data-slot=progress-indicator]]:transition-[transform] [&_[data-slot=progress-indicator]]:duration-500 " +
  "[&_[data-slot=progress-indicator]]:ease-out";

/** Stage 5 — strategy code is compiling (validation version 1.1.1.1.2). */
export const ValidationCompilingPanel = memo(function ValidationCompilingPanel() {
  const [progress, setProgress] = useState(18);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setProgress((prev) => (prev >= 92 ? prev : prev + Math.floor(Math.random() * 4) + 1));
    }, 1400);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div
      className={cx(
        ui.radius,
        "flex min-h-[280px] flex-col items-center justify-center border border-[rgba(60,40,80,0.35)] bg-[#170f29] px-6 py-10 text-center",
      )}
    >
      <Loader2 className="mb-4 size-8 animate-spin text-violet-300" aria-hidden />
      <div className="text-[13px] font-medium text-[#faf7fd]">Strategy code compiling, please wait</div>
      <div className={cx("mt-1 max-w-md text-[11px] leading-relaxed", ui.textSubtle)}>
        The validation engine is building your strategy package from the Stage 4 favorite epoch.
      </div>
      <div className="mt-6 flex w-full max-w-md flex-col items-center gap-2">
        <Progress value={progress} aria-label={`Compilation progress ${progress}%`} className={BAR} />
        <div className="flex items-center gap-2 text-[11px] tabular-nums text-[#8c8c8c]">
          <span>{progress}%</span>
          <span aria-hidden>·</span>
          <span>~4 min</span>
        </div>
      </div>
    </div>
  );
});

/** Stage 5 — strategy compile failed (validation version 1.1.1.1.3). */
export const ValidationErrorPanel = memo(function ValidationErrorPanel({ onRetry }) {
  return (
    <div
      className={cx(
        ui.radius,
        "flex min-h-[280px] flex-col items-center justify-center border border-red-500/35 bg-[#170f29] px-6 py-10 text-center",
      )}
    >
      <AlertCircle className="mb-4 size-8 text-red-400" aria-hidden />
      <div className="text-[13px] font-medium text-red-200">Strategy compilation failed</div>
      <div className="mt-4 w-full max-w-lg rounded-lg border border-red-500/40 bg-red-500/5 px-4 py-3 text-left text-[11px] leading-snug text-red-100/90">
        <div className="font-medium text-red-300">
          <span className="font-mono">{COMPILE_ERROR.code}</span>
        </div>
        <div className="mt-1">{COMPILE_ERROR.message}</div>
        <div className="mt-1 text-[#d9d9d9]">What to do: {COMPILE_ERROR.hint}</div>
      </div>
      <AppButton type="button" variant="outline" size="sm" className="mt-6" onClick={onRetry}>
        Retry
      </AppButton>
    </div>
  );
});

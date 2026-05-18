import React, { memo, useEffect, useState } from "react";
import { cx, ui } from "../../constants/ui";
import { Logo } from "../common";

export const LoginScreen = memo(({ onLogin, onForgotPassword }) => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setIsReady(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div className={cx("min-h-screen", ui.page, "flex items-center justify-center px-4")}>
      <div className="w-full max-w-md">
        <div
          className={cx(
            "mb-6 text-center transform-gpu transition-all duration-500 ease-out motion-reduce:transform-none motion-reduce:transition-none",
            isReady ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
          )}
        >
          <Logo className="mx-auto h-14 w-auto max-w-[280px]" />
        </div>

        <div
          className={cx(
            ui.radius,
            ui.panel,
            "px-6 py-6 transform-gpu transition-all duration-500 ease-out delay-75 motion-reduce:transform-none motion-reduce:transition-none",
            ui.shadow,
            isReady ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
          )}
        >
          <div className="space-y-4">
            <div>
              <label className={cx("block mb-1 text-xs", ui.textMuted)}>Login</label>
              <input
                className={cx(
                  ui.input,
                  "transition-all duration-200 ease-out hover:border-[#3a3a3a] focus:scale-[1.01] motion-reduce:transform-none"
                )}
                placeholder="email or username"
              />
            </div>
            <div>
              <label className={cx("block mb-1 text-xs", ui.textMuted)}>Password</label>
              <input
                type="password"
                className={cx(
                  ui.input,
                  "transition-all duration-200 ease-out hover:border-[#3a3a3a] focus:scale-[1.01] motion-reduce:transform-none"
                )}
                placeholder="••••••••"
              />
              <div className="mt-2 flex justify-end">
                <button
                  type="button"
                  onClick={onForgotPassword}
                  className="text-[11px] text-emerald-300 underline underline-offset-4 transition-colors duration-200 ease-out hover:text-emerald-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
                >
                  Forgot password?
                </button>
              </div>
            </div>
            <button
              onClick={onLogin}
              className={cx(
                "mt-2 w-full h-9 transition-all duration-200 ease-out hover:scale-[1.01] active:scale-[0.99] motion-reduce:transform-none",
                ui.btnPrimary
              )}
            >
              Sign In
            </button>
          </div>
        </div>

        <div className={cx("mt-4 text-center text-[10px]", ui.textMuted)}>v0.1 mock</div>
      </div>
    </div>
  );
});

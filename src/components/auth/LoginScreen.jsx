import React, { memo } from "react";
import { cx, ui } from "../../constants/ui";
import { Logo } from "../common";

export const LoginScreen = memo(({ onLogin, onForgotPassword }) => (
  <div className={cx("min-h-screen", ui.page, "flex items-center justify-center px-4")}>
    <div className="w-full max-w-md">
      <div className="mb-6 text-center">
        <Logo className="mx-auto h-14 w-auto max-w-[280px]" />
      </div>

      <div className={cx(ui.radius, ui.panel, "px-6 py-6", ui.shadow)}>
        <div className="space-y-4">
          <div>
            <label className={cx("block mb-1 text-xs", ui.textMuted)}>Login</label>
            <input className={ui.input} placeholder="email or username" />
          </div>
          <div>
            <label className={cx("block mb-1 text-xs", ui.textMuted)}>Password</label>
            <input type="password" className={ui.input} placeholder="••••••••" />
            <div className="mt-2 flex justify-end">
              <button
                type="button"
                onClick={onForgotPassword}
                className="text-[11px] text-emerald-300 hover:text-emerald-200 underline underline-offset-4"
              >
                Forgot password?
              </button>
            </div>
          </div>
          <button onClick={onLogin} className={cx("mt-2 w-full h-9", ui.btnPrimary)}>
            Sign In
          </button>
        </div>
      </div>

      <div className={cx("mt-4 text-center text-[10px]", ui.textMuted)}>v0.1 mock</div>
    </div>
  </div>
));

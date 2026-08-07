import React, { memo, useMemo } from "react";
import { cx, ui } from "@/constants/ui";
import { BT_NEGATIVE, BT_NEUTRAL } from "../utils/format";
import { buildSettingsSummary } from "../utils/feesSettingsSummary";

export const SettingsSummaryTab = memo(function SettingsSummaryTab({ run }) {
  const settings = useMemo(() => {
    if (run?.result?.settings) return run.result.settings;
    if (!run?.result?.core) return null;
    return buildSettingsSummary(run);
  }, [run]);

  if (!settings?.panels?.length) {
    return (
      <div className={cx(ui.radius, ui.panelMuted, "px-4 py-10 text-center text-[12px]", ui.textSubtle)}>
        No run settings for this run.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-wide text-[#d9d9d9]">
          Run settings
        </div>
        {settings.subtitle ? (
          <div className={cx("mt-0.5 text-[10px]", ui.textSubtle)}>{settings.subtitle}</div>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {settings.panels.map((panel) => (
          <div
            key={panel.key}
            className={cx(
              ui.radius,
              "border border-[rgba(60,40,80,0.35)] bg-[#120b20] p-3 space-y-2",
            )}
          >
            <div className="text-[10px] font-semibold uppercase tracking-wide text-[#9b8ec4]">
              {panel.title}
            </div>
            <ul className="space-y-1.5">
              {panel.rows.map((row) => (
                <li
                  key={`${panel.key}-${row.key}`}
                  className="flex items-baseline justify-between gap-3 text-[11px]"
                >
                  <span className="text-[#8c8c8c]">{row.label}</span>
                  <span
                    className={cx(
                      "max-w-[60%] break-all text-right font-mono tabular-nums",
                      row.tone === "neg" ? BT_NEGATIVE : BT_NEUTRAL,
                    )}
                  >
                    {row.value}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
});

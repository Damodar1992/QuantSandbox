import React, { memo, useMemo } from "react";
import { cx, ui } from "@/constants/ui";
import { AppInput } from "@/components/common/AppInput";
import { Checkbox } from "@/components/ui/checkbox";
import { BT_PESSIMISM_DEFAULT_SHARES, BT_STREAK_METRICS } from "@/constants/backtesting";
import { computePessimismGrid } from "../../utils/pessimism";
import { BtValueTooltip } from "../BtInfoTooltip";

const LABEL_DOTTED =
  "underline decoration-dotted underline-offset-2 decoration-[#6e6682]";

const TH = "px-2 py-1.5 text-left font-medium border-b border-[rgba(60,40,80,0.3)] whitespace-nowrap";
const TD = "px-2 py-1.5 align-middle whitespace-nowrap";

const METRIC_TITLES = {
  mcl: "Max Consec. Losses",
  mcw: "Max Consec. Wins",
  acl: "Avg Consec. Losses",
  acw: "Avg Consec. Wins",
};

function formatTarget(metricKey, targets) {
  if (!targets) return "—";
  if (metricKey === "acl") return targets.aclRange || String(targets.acl ?? "—");
  if (metricKey === "acw") return targets.acwRange || String(targets.acw ?? "—");
  return targets[metricKey] ?? "—";
}

function TargetCell({ metricKey, targets, achievable, original }) {
  const display = formatTarget(metricKey, targets);
  const hit = achievable?.[metricKey];
  const unreachable = hit !== undefined;
  const sameAsOriginal =
    metricKey === "mcw" &&
    targets?.mcw != null &&
    original?.mcw != null &&
    Number(targets.mcw) === Number(original.mcw);

  if (unreachable) {
    return (
      <td className={cx(TD, "font-mono tabular-nums")}>
        <BtValueTooltip
          text={`Level not reachable. Achievable ${METRIC_TITLES[metricKey] || metricKey.toUpperCase()} is ${hit}.`}
        >
          <span className="inline-flex flex-col items-start gap-0.5">
            <span>
              <span className="text-red-400">{display}</span>
              <span className="text-[#8c8c8c]"> → </span>
              <span className="text-red-400">{hit}</span>
            </span>
          </span>
        </BtValueTooltip>
      </td>
    );
  }

  return (
    <td className={cx(TD, "font-mono tabular-nums text-[#d9d9d9]")}>
      <span className="inline-flex flex-col items-start gap-0.5">
        <span>{display}</span>
        {sameAsOriginal ? (
          <span className={cx("max-w-[140px] whitespace-normal text-[9px] leading-snug", ui.textSubtle)}>
            same as Original — rounding absorbs the step
          </span>
        ) : null}
      </span>
    </td>
  );
}

/**
 * Pessimism Stress-Test grid: level toggles, editable shares, computed runs and
 * targets derived from the Original streaks of the parent backtest.
 */
export const PessimismGrid = memo(function PessimismGrid({
  levels,
  shufflesN,
  original,
  onChangeLevel,
  readOnly = false,
}) {
  const grid = useMemo(
    () => computePessimismGrid(levels, shufflesN, original),
    [levels, shufflesN, original],
  );

  const defaultsLabel = Object.entries(BT_PESSIMISM_DEFAULT_SHARES)
    .map(([level, share]) => `${level} ${share}`)
    .join(" · ");

  return (
    <div className="space-y-2">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-[#d9d9d9]">
        {readOnly
          ? "Pessimism Stress-Test — snapshot"
          : "Pessimism Stress-Test — set the share of runs per level"}
      </div>

      <div className="overflow-x-auto rounded-lg border border-[rgba(60,40,80,0.35)]">
        <table className="w-full border-collapse text-[11px]">
          <thead className="bg-[#19102b] text-[#8c8c8c]">
            <tr>
              <th className={cx(TH, "w-8")} aria-label="Enabled" />
              <th className={TH}>Level</th>
              <th className={TH}>Share</th>
              <th className={TH}>
                <BtValueTooltip text="Runs = floor(share × shuffles).">
                  <span className={LABEL_DOTTED}>Runs</span>
                </BtValueTooltip>
              </th>
              {BT_STREAK_METRICS.map((m) => (
                <th key={m.key} className={TH}>
                  <BtValueTooltip
                    text={`${m.title}${m.enforced ? "" : " — never forced"}`}
                  >
                    <span className={LABEL_DOTTED}>{m.label}</span>
                  </BtValueTooltip>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="text-[#d9d9d9]">
            <tr className="border-b border-[rgba(60,40,80,0.22)] bg-[#140f23]">
              <td className={TD} />
              <td className={cx(TD, "font-medium text-sky-300")}>Original</td>
              <td className={cx(TD, "text-[#8c8c8c]")}>—</td>
              <td className={cx(TD, "text-[#8c8c8c]")}>—</td>
              {BT_STREAK_METRICS.map((m) => (
                <td key={m.key} className={cx(TD, "font-mono tabular-nums text-sky-300")}>
                  {original?.[m.key] != null ? Number(original[m.key]).toFixed(2) : "—"}
                </td>
              ))}
            </tr>

            {grid.rows.map((row) => (
              <tr key={row.level} className="border-b border-[rgba(60,40,80,0.22)] hover:bg-[#1a1430]">
                <td className={TD}>
                  <Checkbox
                    checked={row.enabled}
                    disabled={readOnly}
                    onCheckedChange={(checked) =>
                      onChangeLevel?.(row.level, { enabled: Boolean(checked) })
                    }
                    className="size-3.5 border-[#505050]"
                    aria-label={`Enable ${row.level}`}
                  />
                </td>
                <td className={cx(TD, "font-medium")}>{row.level}</td>
                <td className={TD}>
                  <div className="inline-flex items-center gap-1">
                    <AppInput
                      type="number"
                      min={0}
                      max={100}
                      value={row.sharePct}
                      disabled={readOnly || !row.enabled}
                      readOnly={readOnly}
                      onChange={(e) =>
                        onChangeLevel?.(row.level, { sharePct: Number(e.target.value) })
                      }
                      className="h-8 w-[64px] px-2 text-[12px]"
                      wrapperClassName="space-y-0"
                      aria-label={`${row.level} share percent`}
                    />
                    <span className={ui.textSubtle}>%</span>
                  </div>
                </td>
                <td className={cx(TD, "font-mono tabular-nums")}>
                  {row.enabled ? row.runsN : "—"}
                </td>
                {BT_STREAK_METRICS.map((m) => (
                  <TargetCell
                    key={m.key}
                    metricKey={m.key}
                    targets={row.targets}
                    achievable={row.achievable}
                    original={original}
                  />
                ))}
              </tr>
            ))}

            <tr className="bg-[#140f23]">
              <td className={TD} />
              <td className={cx(TD, "font-medium text-[#b8aecc]")}>Random</td>
              <td className={TD}>
                <span
                  className={cx(
                    "inline-flex h-7 min-w-[64px] items-center justify-center rounded-md border border-dashed border-[rgba(120,100,160,0.45)] px-2 font-mono tabular-nums text-[#b8aecc]",
                  )}
                >
                  {grid.randomSharePct}%
                </span>
              </td>
              <td className={cx(TD, "font-mono tabular-nums text-[#b8aecc]")}>{grid.randomRunsN}</td>
              <td className={cx(TD, "text-[10px] text-[#6e6682]")} colSpan={BT_STREAK_METRICS.length}>
                —
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {grid.error ? <div className="text-[11px] text-red-400">{grid.error}</div> : null}

      {!readOnly ? (
        <div className={cx("space-y-1 text-[10px] leading-snug", ui.textSubtle)}>
          <div>
            Shares are editable. Defaults: {defaultsLabel} — remainder goes to random shuffle. Targets
            derive from the Original, rounded as floor(x + 0.5).
          </div>
          <div className="flex items-start gap-1.5 text-[#d9d9d9]">
            <span className="mt-0.5 inline-flex h-2.5 w-2.5 shrink-0 rounded-sm bg-red-400" />
            <span>
              <span className="text-red-400">Red</span> is the value the run will actually reach — the
              target cannot be built from this dataset.
            </span>
          </div>
        </div>
      ) : null}
    </div>
  );
});

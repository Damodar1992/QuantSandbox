import React, { memo, useEffect, useMemo, useState } from "react";
import { cx, ui } from "@/constants/ui";
import { AppButton } from "@/components/common/AppButton";
import { AppDialog } from "@/components/common/AppDialog";
import { AppInput } from "@/components/common/AppInput";
import { AppSelect } from "@/components/common/AppSelect";
import { Textarea } from "@/components/ui/textarea";
import {
  BT_ANALYTICS_STATUS,
  BT_INTEGRITY_LEVEL,
  BT_RUN_STATUS,
  BT_SYNTHETIC_METHODS,
} from "@/constants/backtesting";
import { fmtDateTime, fmtInt } from "../../utils/format";
import {
  checkIntegrity,
  combinationCompleteness,
  integrityLabel,
  integrityTone,
  saveBlockers,
} from "../../utils/integrity";
import { formatPessimismSummary } from "../../utils/pessimism";
import { BT_FORM_CONTROL } from "./formControl";

const NONE = "";

function Line({ label, children }) {
  return (
    <div className="grid gap-1.5 sm:grid-cols-[110px_minmax(0,1fr)] sm:items-center">
      <div className={cx("text-[11px]", ui.textMuted)}>{label}</div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

function shufflerSummary(run) {
  if (!run) return "not selected";
  const mode = run.config?.simulationMode === "dynamic" ? "DYNAMIC" : "STATIC";
  const pessimism = formatPessimismSummary(run.config);
  return `${run.id} · ${mode} · ${fmtInt(run.config?.shufflesN)} shuffles${
    pessimism === "off" ? "" : ` · ${pessimism}`
  }`;
}

function syntheticSummary(run) {
  if (!run) return "not selected";
  const method = BT_SYNTHETIC_METHODS.find((m) => m.value === run.config?.method)?.label ?? "—";
  return `${run.id} · ${method} · N=${fmtInt(run.config?.nRuns)}`;
}

/**
 * Validation analytics view — draft (combination editable) and saved (frozen).
 * The three-line metric matrix (§6.4) arrives with the result views; the
 * combination, integrity and freeze-on-save semantics are complete here.
 */
export const AnalyticsDraftModal = memo(function AnalyticsDraftModal({
  open,
  analytics,
  parentRun,
  epoch,
  strategyName,
  savedCombinations,
  onClose,
  onChange,
  onSave,
  onDelete,
  onTogglePromote,
}) {
  const saved = analytics?.status === BT_ANALYTICS_STATUS.SAVED;
  const [shufflerRunId, setShufflerRunId] = useState(NONE);
  const [syntheticRunId, setSyntheticRunId] = useState(NONE);
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!open || !analytics) return;
    setShufflerRunId(analytics.shufflerRunId || NONE);
    setSyntheticRunId(analytics.syntheticRunId || NONE);
    setNote(analytics.note || "");
  }, [open, analytics]);

  const doneShufflers = useMemo(
    () => (parentRun?.shufflerRuns || []).filter((r) => r.status === BT_RUN_STATUS.DONE),
    [parentRun],
  );
  const doneSynthetics = useMemo(
    () => (parentRun?.syntheticRuns || []).filter((r) => r.status === BT_RUN_STATUS.DONE),
    [parentRun],
  );

  const shufflerRun = doneShufflers.find((r) => r.id === shufflerRunId) || null;
  const syntheticRun = doneSynthetics.find((r) => r.id === syntheticRunId) || null;

  const integrity = useMemo(
    () =>
      saved
        ? analytics?.integrity || { level: BT_INTEGRITY_LEVEL.OK, items: [] }
        : checkIntegrity({ backtest: parentRun, shufflerRun, syntheticRun }),
    [saved, analytics, parentRun, shufflerRun, syntheticRun],
  );

  const draftShape = { shufflerRunId: shufflerRunId || null, syntheticRunId: syntheticRunId || null };
  const filled = combinationCompleteness(draftShape);
  const duplicate =
    !saved &&
    Boolean(savedCombinations) &&
    savedCombinations.has(`${parentRun?.id}|${draftShape.shufflerRunId}|${draftShape.syntheticRunId}`);

  const blockers = saveBlockers({
    analytics: draftShape,
    integrityLevel: integrity.level,
    duplicate,
  });

  const applyCombination = (patch) => {
    if (saved) return;
    onChange?.(patch);
  };

  return (
    <AppDialog
      open={!!open}
      onOpenChange={(next) => {
        if (!next) onClose?.();
      }}
      title={`Validation analytics ${analytics?.id || ""}`}
      description={`${strategyName || "Strategy"} · ${epoch?.label || "epoch"} · Backtest ${
        parentRun?.id || "—"
      }`}
      className="max-w-[860px] max-h-[90vh] overflow-hidden flex flex-col"
    >
      <div className="min-h-0 flex-1 space-y-4 overflow-auto">
        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          <span
            className={cx(
              "rounded border px-1.5 py-0.5 text-[10px]",
              saved
                ? "border-green-500/40 bg-green-500/10 text-green-300"
                : "border-amber-500/40 bg-amber-500/10 text-amber-200",
            )}
          >
            {saved ? "🔒 saved" : "draft"}
          </span>
          {saved ? (
            <>
              <span className={ui.textMuted}>{analytics.author}</span>
              <span className={cx("tabular-nums", ui.textSubtle)}>{fmtDateTime(analytics.savedAt)}</span>
              <AppButton
                type="button"
                variant="outline"
                size="xs"
                onClick={() => onTogglePromote?.()}
                title="Promote as the final result of the epoch"
              >
                {analytics.promoted ? "★ Promoted — unpromote" : "☆ Promote"}
              </AppButton>
            </>
          ) : null}
        </div>

        <section className={cx(ui.radius, ui.panelMuted, "space-y-3 p-3")}>
          <div className="text-[12px] font-medium text-[#faf7fd]">Combination</div>

          <Line label="Backtest">
            <AppInput
              readOnly
              value={`${parentRun?.id || "—"} · ${parentRun?.params?.periodFrom || "?"} → ${
                parentRun?.params?.periodTo || "?"
              } · ${parentRun?.miniName ? `from ${parentRun.miniName}` : "standalone"}`}
              className={cx(BT_FORM_CONTROL, "cursor-not-allowed font-mono opacity-70")}
              wrapperClassName="space-y-0"
            />
          </Line>

          <Line label="Shuffler">
            {saved ? (
              <AppInput
                readOnly
                value={shufflerSummary(
                  (parentRun?.shufflerRuns || []).find((r) => r.id === analytics.shufflerRunId),
                )}
                className={cx(BT_FORM_CONTROL, "cursor-not-allowed font-mono opacity-70")}
                wrapperClassName="space-y-0"
              />
            ) : (
              <AppSelect
                value={shufflerRunId}
                onValueChange={(value) => {
                  setShufflerRunId(value);
                  applyCombination({ shufflerRunId: value || null });
                }}
                options={[
                  { value: NONE, label: "— not selected —" },
                  ...doneShufflers.map((r) => ({ value: r.id, label: shufflerSummary(r) })),
                ]}
                disabled={doneShufflers.length === 0}
                placeholder={doneShufflers.length ? "Select a run…" : "No finished Shuffler runs"}
                triggerClassName={BT_FORM_CONTROL}
              />
            )}
          </Line>

          <Line label="Synthetic">
            {saved ? (
              <AppInput
                readOnly
                value={syntheticSummary(
                  (parentRun?.syntheticRuns || []).find((r) => r.id === analytics.syntheticRunId),
                )}
                className={cx(BT_FORM_CONTROL, "cursor-not-allowed font-mono opacity-70")}
                wrapperClassName="space-y-0"
              />
            ) : (
              <AppSelect
                value={syntheticRunId}
                onValueChange={(value) => {
                  setSyntheticRunId(value);
                  applyCombination({ syntheticRunId: value || null });
                }}
                options={[
                  { value: NONE, label: "— not selected —" },
                  ...doneSynthetics.map((r) => ({ value: r.id, label: syntheticSummary(r) })),
                ]}
                disabled={doneSynthetics.length === 0}
                placeholder={doneSynthetics.length ? "Select a run…" : "No finished Synthetic runs"}
                triggerClassName={BT_FORM_CONTROL}
              />
            )}
          </Line>

          <div className="flex flex-wrap items-center gap-3 text-[11px]">
            <span className={ui.textMuted}>Completeness</span>
            <span className={cx("font-mono tabular-nums", filled === 3 ? "text-green-400" : "text-amber-300")}>
              {filled} / 3 lines
            </span>
            <span className={ui.textMuted}>Integrity</span>
            <span className={integrityTone(integrity.level)}>{integrityLabel(integrity.level)}</span>
          </div>
        </section>

        {integrity.level !== BT_INTEGRITY_LEVEL.OK ? (
          <div
            className={cx(
              "rounded-lg border px-3 py-2.5 text-[11px] leading-snug",
              integrity.level === BT_INTEGRITY_LEVEL.BLOCK
                ? "border-red-500/40 bg-red-500/5 text-red-100/90"
                : "border-amber-500/40 bg-amber-500/5 text-amber-100/90",
            )}
          >
            <div className="font-medium">
              {integrity.level === BT_INTEGRITY_LEVEL.BLOCK
                ? "⛔ Lines are not comparable — cannot be saved"
                : "⚠ Lines are only partly comparable"}
            </div>
            <ul className="mt-1 list-disc space-y-0.5 pl-4 text-[10px]">
              {(integrity.items || []).map((item) => (
                <li key={item.field}>
                  {item.label} differs: Backtest = {item.valuesByLine.backtest} · Shuffler ={" "}
                  {item.valuesByLine.shuffler} · Synthetic = {item.valuesByLine.synthetic}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <section className="space-y-1.5">
          <div className="text-[12px] font-medium text-[#faf7fd]">Note</div>
          {saved ? (
            <div className={cx(ui.radius, ui.panelMuted, "px-3 py-2 text-[11px]", ui.textMuted)}>
              {analytics.note || "—"}
              <div className={cx("mt-1 text-[10px]", ui.textSubtle)}>— {analytics.author}</div>
            </div>
          ) : (
            <Textarea
              value={note}
              onChange={(e) => {
                setNote(e.target.value);
                onChange?.({ note: e.target.value.trim() ? e.target.value : null });
              }}
              rows={3}
              placeholder="What does this combination tell you? The system never issues a verdict."
              className="min-h-[4.5rem] text-[12px]"
            />
          )}
        </section>

        <div className={cx(ui.radius, ui.panelMuted, "px-3 py-2 text-[10px] leading-snug", ui.textSubtle)}>
          The metric matrix over the three lines — Backtest “earns and reproduces”, Shuffler “holds
          under any trade order”, Synthetic “works on unseen data” — is rendered in the full analytics
          view. Saving freezes a copy of it, so the record survives deletion of its runs.
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
        <div className={cx("text-[10px]", blockers.length ? "text-amber-300" : ui.textSubtle)}>
          {saved
            ? `Saved ${fmtDateTime(analytics.savedAt)} · runs: Backtest ${parentRun?.id} · Shuffler ${
                analytics.shufflerRunId || "—"
              } · Synthetic ${analytics.syntheticRunId || "—"}`
            : blockers.length
              ? `Blocked: ${blockers.join(" · ")}`
              : "Ready to save — the combination will be frozen."}
        </div>
        <div className="flex gap-2">
          <AppButton type="button" variant="outline" size="sm" onClick={onClose}>
            Close
          </AppButton>
          <AppButton
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onDelete?.()}
            className="border-red-500/60 text-red-300 hover:bg-red-500/10"
          >
            Delete
          </AppButton>
          {!saved ? (
            <AppButton
              type="button"
              variant="default"
              size="sm"
              disabled={blockers.length > 0}
              title={blockers.length ? blockers.join(" · ") : undefined}
              onClick={() => onSave?.({ note: note.trim() ? note.trim() : null })}
            >
              Save
            </AppButton>
          ) : null}
        </div>
      </div>
    </AppDialog>
  );
});

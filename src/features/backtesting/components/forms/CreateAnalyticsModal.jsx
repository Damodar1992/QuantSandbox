import React, { memo, useEffect, useMemo, useState } from "react";
import { cx, ui } from "@/constants/ui";
import { AppButton } from "@/components/common/AppButton";
import { AppDialog } from "@/components/common/AppDialog";
import { AppInput } from "@/components/common/AppInput";
import { AppSelect } from "@/components/common/AppSelect";
import { Textarea } from "@/components/ui/textarea";
import {
  BT_RUN_STATUS,
  BT_SYNTHETIC_METHODS,
} from "@/constants/backtesting";
import { fmtDateTime, fmtInt } from "../../utils/format";
import { checkIntegrity, integrityLabel, integrityTone } from "../../utils/integrity";
import { formatPessimismSummary } from "../../utils/pessimism";
import { BT_FORM_CONTROL } from "./formControl";

const NONE = "";

function shufflerLabel(run) {
  const mode = run.config?.simulationMode === "dynamic" ? "DYNAMIC" : "STATIC";
  const approach =
    run.config?.approach === "block_by_streak"
      ? "block"
      : run.config?.approach === "levels"
        ? "levels"
        : "full";
  const pessimism = formatPessimismSummary(run.config);
  return `${run.id} · ${mode} · ${approach} (${fmtInt(run.config?.shufflesN)})${
    pessimism === "off" ? "" : ` · ${pessimism}`
  } · ${fmtDateTime(run.createdAt)}`;
}

function syntheticLabel(run) {
  const method = BT_SYNTHETIC_METHODS.find((m) => m.value === run.config?.method)?.label ?? "—";
  return `${run.id} · ${method} · N=${fmtInt(run.config?.nRuns)} · ${fmtDateTime(run.createdAt)}`;
}

export const CreateAnalyticsModal = memo(function CreateAnalyticsModal({
  open,
  parentRun,
  initialShufflerRunId = null,
  savedCombinations,
  onClose,
  onSubmit,
}) {
  const [shufflerRunId, setShufflerRunId] = useState(NONE);
  const [syntheticRunId, setSyntheticRunId] = useState(NONE);
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!open) return;
    setShufflerRunId(initialShufflerRunId || NONE);
    setSyntheticRunId(NONE);
    setNote("");
  }, [open, initialShufflerRunId]);

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
    () => checkIntegrity({ backtest: parentRun, shufflerRun, syntheticRun }),
    [parentRun, shufflerRun, syntheticRun],
  );

  const filled = 1 + (shufflerRunId ? 1 : 0) + (syntheticRunId ? 1 : 0);
  const duplicate =
    Boolean(savedCombinations) &&
    savedCombinations.has(`${parentRun?.id}|${shufflerRunId || null}|${syntheticRunId || null}`);

  return (
    <AppDialog
      open={!!open}
      onOpenChange={(next) => {
        if (!next) onClose?.();
      }}
      title="Create validation analytics"
      description={`Backtest ${parentRun?.id || "—"} — the parent line is fixed`}
      className="max-w-[720px] max-h-[90vh] overflow-hidden flex flex-col"
    >
      <div className="min-h-0 flex-1 space-y-3 overflow-auto">
        <div className="space-y-1">
          <label className={cx("block text-[11px]", ui.textMuted)}>Backtest</label>
          <AppInput
            readOnly
            value={`${parentRun?.id || "—"} · ${parentRun?.params?.periodFrom || "?"} → ${
              parentRun?.params?.periodTo || "?"
            }${parentRun?.miniName ? ` · from ${parentRun.miniName}` : " · standalone"}`}
            className={cx(BT_FORM_CONTROL, "cursor-not-allowed font-mono opacity-70")}
            wrapperClassName="space-y-0"
          />
        </div>

        <AppSelect
          label="Shuffler run · optional"
          value={shufflerRunId}
          onValueChange={setShufflerRunId}
          options={[
            { value: NONE, label: "— not selected —" },
            ...doneShufflers.map((r) => ({ value: r.id, label: shufflerLabel(r) })),
          ]}
          placeholder={doneShufflers.length ? "Select a run…" : "No finished Shuffler runs"}
          disabled={doneShufflers.length === 0}
          triggerClassName={BT_FORM_CONTROL}
        />

        <AppSelect
          label="Synthetic run · optional"
          value={syntheticRunId}
          onValueChange={setSyntheticRunId}
          options={[
            { value: NONE, label: "— not selected —" },
            ...doneSynthetics.map((r) => ({ value: r.id, label: syntheticLabel(r) })),
          ]}
          placeholder={doneSynthetics.length ? "Select a run…" : "No finished Synthetic runs"}
          disabled={doneSynthetics.length === 0}
          triggerClassName={BT_FORM_CONTROL}
        />

        <div className="space-y-1">
          <label className={cx("block text-[11px]", ui.textMuted)}>Note · optional</label>
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="Draft note — you can extend it when saving."
            className="min-h-[4.5rem] text-[12px]"
          />
        </div>

        <div className={cx(ui.radius, ui.panelMuted, "space-y-1.5 p-3 text-[11px]")}>
          <div className="flex flex-wrap items-center gap-3">
            <span className={ui.textMuted}>Completeness</span>
            <span className={cx("font-mono tabular-nums", filled === 3 ? "text-green-400" : "text-amber-300")}>
              {filled} / 3 lines
            </span>
            <span className={ui.textMuted}>Integrity</span>
            <span className={integrityTone(integrity.level)}>{integrityLabel(integrity.level)}</span>
          </div>
          {integrity.items.length > 0 ? (
            <ul className={cx("list-disc space-y-0.5 pl-4 text-[10px]", ui.textMuted)}>
              {integrity.items.map((item) => (
                <li key={item.field}>
                  {item.label} differs: Backtest = {item.valuesByLine.backtest} · Shuffler ={" "}
                  {item.valuesByLine.shuffler} · Synthetic = {item.valuesByLine.synthetic}
                </li>
              ))}
            </ul>
          ) : (
            <div className={cx("text-[10px]", ui.textSubtle)}>
              All lines originate from backtest {parentRun?.id} — every comparable field matches.
            </div>
          )}
          {duplicate ? (
            <div className="text-[10px] text-amber-300">
              ⚠ This exact combination is already saved. A duplicate cannot be saved — only cancelled.
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 pt-2">
        <div className={cx("text-[10px]", ui.textSubtle)}>
          A draft can be created even with an incomplete combination — Save requires 3 / 3.
        </div>
        <div className="flex gap-2">
          <AppButton type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </AppButton>
          <AppButton
            type="button"
            variant="default"
            size="sm"
            onClick={() => {
              onSubmit?.({
                shufflerRunId: shufflerRunId || null,
                syntheticRunId: syntheticRunId || null,
                note: note.trim() ? note.trim() : null,
              });
              onClose?.();
            }}
          >
            Create draft
          </AppButton>
        </div>
      </div>
    </AppDialog>
  );
});

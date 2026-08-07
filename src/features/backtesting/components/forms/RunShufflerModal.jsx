import React, { memo, useEffect, useMemo, useState } from "react";
import { cx, ui } from "@/constants/ui";
import { AppButton } from "@/components/common/AppButton";
import { AppDialog } from "@/components/common/AppDialog";
import { AppSelect } from "@/components/common/AppSelect";
import {
  BT_SHUFFLES_DEFAULT,
  BT_SHUFFLES_PRESETS,
  BT_SHUFFLE_APPROACHES,
  BT_SIM_MODES,
  BT_SIM_MODE_TIP,
} from "@/constants/backtesting";
import { computePessimismGrid, createDefaultPessimismLevels } from "../../utils/pessimism";
import { BtHeaderWithHelp } from "../BtInfoTooltip";
import { BT_FORM_CONTROL } from "./formControl";
import { PessimismGrid } from "./PessimismGrid";

const SHUFFLES_OPTIONS = BT_SHUFFLES_PRESETS.map((n) => ({
  value: String(n),
  label: String(n),
}));

function levelsFromConfig(config) {
  if (Array.isArray(config?.pessimismLevels) && config.pessimismLevels.length) {
    return config.pessimismLevels.map((l) => ({ ...l }));
  }
  return createDefaultPessimismLevels();
}

export const RunShufflerModal = memo(function RunShufflerModal({
  open,
  parentRun,
  snapshotRun = null,
  readOnly = false,
  onClose,
  onSubmit,
}) {
  const [simulationMode, setSimulationMode] = useState("static");
  const [shufflesN, setShufflesN] = useState(BT_SHUFFLES_DEFAULT);
  const [approach, setApproach] = useState("full");
  const [levels, setLevels] = useState(() => createDefaultPessimismLevels());

  useEffect(() => {
    if (!open) return;
    if (readOnly && snapshotRun?.config) {
      const cfg = snapshotRun.config;
      setSimulationMode(cfg.simulationMode || "static");
      setShufflesN(Number(cfg.shufflesN) || BT_SHUFFLES_DEFAULT);
      setApproach(cfg.approach || "full");
      setLevels(levelsFromConfig(cfg));
      return;
    }
    setSimulationMode("static");
    setShufflesN(BT_SHUFFLES_DEFAULT);
    setApproach("full");
    setLevels(createDefaultPessimismLevels());
  }, [open, readOnly, snapshotRun]);

  const original = useMemo(() => {
    if (readOnly && snapshotRun?.config?.original) return snapshotRun.config.original;
    return parentRun?.result?.streaks || {};
  }, [readOnly, snapshotRun, parentRun]);

  const grid = useMemo(
    () => computePessimismGrid(levels, shufflesN, original),
    [levels, shufflesN, original],
  );

  const changeLevel = (level, patch) => {
    if (readOnly) return;
    setLevels((prev) => prev.map((row) => (row.level === level ? { ...row, ...patch } : row)));
  };

  const canRun = !readOnly && Number(shufflesN) > 0 && !grid.error;

  const handleSubmit = () => {
    if (!canRun) return;
    onSubmit?.({
      simulationMode,
      shufflesN: Number(shufflesN),
      approach,
      stressTestEnabled: true,
      pessimismLevels: levels.map((l) => ({ ...l })),
      exportRepresentatives: false,
      original,
    });
    onClose?.();
  };

  const title = readOnly ? "Run Shuffler parameters" : "Run Shuffler";
  const description = readOnly
    ? undefined
    : `Trades source — trades from the backtest run ${parentRun?.id || "—"}`;

  return (
    <AppDialog
      open={!!open}
      onOpenChange={(next) => {
        if (!next) onClose?.();
      }}
      title={title}
      description={description}
      className="max-w-[960px] max-h-[90vh] overflow-hidden flex flex-col"
    >
      <div className="min-h-0 flex-1 space-y-4 overflow-auto">
        <section className="space-y-2">
          <div className="text-[12px] font-medium text-[#faf7fd]">1 · Shuffle settings</div>
          <div className={cx(ui.radius, ui.panelMuted, "grid gap-3 p-3 sm:grid-cols-3")}>
            <div className="space-y-1">
              <BtHeaderWithHelp label="Simulation Mode" tip={BT_SIM_MODE_TIP}>
                <span className={cx("text-[11px]", ui.textMuted)}>Simulation Mode</span>
              </BtHeaderWithHelp>
              <AppSelect
                aria-label="Simulation Mode"
                value={simulationMode}
                onValueChange={setSimulationMode}
                options={BT_SIM_MODES}
                disabled={readOnly}
                triggerClassName={BT_FORM_CONTROL}
              />
            </div>

            <AppSelect
              label="Shuffles"
              value={String(shufflesN)}
              onValueChange={(v) => setShufflesN(Number(v))}
              options={SHUFFLES_OPTIONS}
              disabled={readOnly}
              triggerClassName={BT_FORM_CONTROL}
            />

            <AppSelect
              label="Shuffle Approach"
              value={approach}
              onValueChange={setApproach}
              options={BT_SHUFFLE_APPROACHES}
              disabled={readOnly}
              triggerClassName={BT_FORM_CONTROL}
            />
          </div>
        </section>

        <section className="space-y-2">
          <div className="text-[12px] font-medium text-[#faf7fd]">2 · Pessimism Stress-Test</div>
          <PessimismGrid
            levels={levels}
            shufflesN={shufflesN}
            original={original}
            onChangeLevel={changeLevel}
            readOnly={readOnly}
          />
        </section>
      </div>

      <div className="flex items-center justify-between gap-2 pt-2">
        <div className={cx("text-[10px]", grid.error ? "text-red-400" : ui.textSubtle)}>
          {grid.error || `${shufflesN} shuffles · ${grid.randomRunsN} random + pessimism levels`}
        </div>
        <div className="flex gap-2">
          {readOnly ? (
            <AppButton type="button" variant="outline" size="sm" onClick={onClose}>
              Close
            </AppButton>
          ) : (
            <>
              <AppButton type="button" variant="outline" size="sm" onClick={onClose}>
                Cancel
              </AppButton>
              <AppButton
                type="button"
                variant="default"
                size="sm"
                disabled={!canRun}
                onClick={handleSubmit}
              >
                ▶ Run Shuffler
              </AppButton>
            </>
          )}
        </div>
      </div>
    </AppDialog>
  );
});

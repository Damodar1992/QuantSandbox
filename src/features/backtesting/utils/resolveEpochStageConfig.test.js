import { describe, expect, it } from "vitest";
import {
  resolveEpochStageConfig,
  riskParamsFromHeatmap,
} from "./resolveEpochStageConfig";

const ind = (name, period) => ({
  id: name,
  type: "BBANDS",
  displayName: name,
  paramsSnapshot: { timeperiod: period },
});

describe("riskParamsFromHeatmap", () => {
  it("extracts known risk keys and ignores others", () => {
    expect(
      riskParamsFromHeatmap({
        stoploss: -0.04,
        trailing_activation: 0.02,
        profit_factor: 1.5,
        loss_streak_threshold: 2,
      }),
    ).toEqual({
      stoploss: -0.04,
      trailing_activation: 0.02,
      loss_streak_threshold: 2,
    });
  });

  it("returns null when nothing usable", () => {
    expect(riskParamsFromHeatmap(null)).toBeNull();
    expect(riskParamsFromHeatmap({ profit_factor: 1 })).toBeNull();
  });
});

describe("resolveEpochStageConfig", () => {
  const signal = {
    id: "sig-1",
    label: "Signal ep",
    indicators: [ind("bb-sig", 20)],
  };
  const entry = {
    id: "ent-1",
    label: "Entry ep",
    indicators: [ind("bb-ent", 14)],
  };
  const exit = {
    id: "ex-1",
    label: "Exit ep",
    indicators: [ind("bb-ex", 10)],
  };

  const ctx = {
    signalBestResults: [signal],
    entryBestResults: [entry],
    exitBestResults: [exit],
    entryBestSourceId: "sig-1",
    exitBestSourceId: "ent-1",
    riskBestSourceId: "ex-1",
  };

  it("prefers frozen indicatorsByStage over live chain", () => {
    const frozenSig = [ind("frozen-sig", 99)];
    const epoch = {
      id: "risk-1",
      riskParams: { stoploss: -0.035 },
      lineage: { signalId: "sig-1", entryId: "ent-1", exitId: "ex-1" },
      indicatorsByStage: {
        signal: { label: "Frozen signal", indicators: frozenSig },
        entry: { label: "Frozen entry", indicators: [ind("frozen-ent", 5)] },
        exit: { label: "Frozen exit", indicators: [ind("frozen-ex", 3)] },
      },
    };

    const resolved = resolveEpochStageConfig(epoch, ctx);
    expect(resolved.stage1.indicators[0].displayName).toBe("frozen-sig");
    expect(resolved.stage2.label).toBe("Frozen entry");
    expect(resolved.stage3.indicators[0].paramsSnapshot.timeperiod).toBe(3);
    expect(resolved.stage4.riskParams.stoploss).toBe(-0.035);
    expect(resolved.lineage).toEqual({
      signalId: "sig-1",
      entryId: "ent-1",
      exitId: "ex-1",
    });
  });

  it("walks live source-chain when nothing frozen", () => {
    const epoch = { id: "risk-2" };
    const resolved = resolveEpochStageConfig(epoch, ctx);
    expect(resolved.stage1.indicators[0].displayName).toBe("bb-sig");
    expect(resolved.stage2.indicators[0].displayName).toBe("bb-ent");
    expect(resolved.stage3.indicators[0].displayName).toBe("bb-ex");
    expect(resolved.lineage).toEqual({
      signalId: "sig-1",
      entryId: "ent-1",
      exitId: "ex-1",
    });
    expect(resolved.stage4.riskParams).toBeNull();
  });

  it("derives riskParams from heatmapParams when top-level missing", () => {
    const epoch = {
      id: "risk-3",
      meta: {
        heatmapParams: {
          stoploss: -0.05,
          trailing_distance: 0.01,
          post_loss_cooldown_candles: 4,
        },
      },
    };
    const resolved = resolveEpochStageConfig(epoch, ctx);
    expect(resolved.stage4.riskParams).toEqual({
      stoploss: -0.05,
      trailing_distance: 0.01,
      post_loss_cooldown_candles: 4,
    });
  });

  it("returns empty indicator lists when stage favorites are missing", () => {
    const resolved = resolveEpochStageConfig(
      { id: "risk-4" },
      { signalBestResults: [], entryBestResults: [], exitBestResults: [] },
    );
    expect(resolved.stage1.indicators).toEqual([]);
    expect(resolved.stage2.indicators).toEqual([]);
    expect(resolved.stage3.indicators).toEqual([]);
    expect(resolved.lineage).toEqual({
      signalId: null,
      entryId: null,
      exitId: null,
    });
  });

  it("accepts raw indicator arrays in frozen indicatorsByStage", () => {
    const epoch = {
      id: "risk-5",
      indicatorsByStage: {
        signal: [ind("raw-sig", 7)],
        entry: [ind("raw-ent", 8)],
        exit: [ind("raw-ex", 9)],
      },
    };
    const resolved = resolveEpochStageConfig(epoch, {});
    expect(resolved.stage1.indicators[0].displayName).toBe("raw-sig");
    expect(resolved.stage2.indicators[0].displayName).toBe("raw-ent");
    expect(resolved.stage3.indicators[0].displayName).toBe("raw-ex");
  });
});

import { describe, expect, it } from "vitest";
import { buildSyntheticPerformanceSummary } from "./syntheticPerformanceSummary";

describe("buildSyntheticPerformanceSummary", () => {
  it("fills distribution columns for almost all metrics", () => {
    const run = {
      id: "sy-1",
      config: { nRuns: 1000 },
      result: {
        core: [
          { metric: "roi", real: 9.02 },
          { metric: "pnl", real: 902 },
          { metric: "maxdd", real: 22 },
          { metric: "pf", real: 1.1 },
          { metric: "winrate", real: 43 },
          { metric: "trades", real: 1400 },
        ],
      },
    };
    const parent = {
      params: { pair: "BTC/USDT", startingCapital: 10000 },
      result: {
        core: { roi: 9.02, pnl: 902, maxdd: 22, pf: 1.1, winrate: 43, trades: 1400 },
        streaks: { wins: 600, losses: 800 },
      },
    };

    const summary = buildSyntheticPerformanceSummary(run, parent);
    const rows = summary.sections.flatMap((s) => s.rows);
    const empty = rows.filter(
      (r) => r.percentile == null || r.min == null || r.mean == null || r.max == null,
    );

    // Only drawdown window timestamps stay text-only.
    expect(empty.map((r) => r.key).sort()).toEqual(["ddEnd", "ddStart"]);
    expect(rows.length).toBeGreaterThan(40);
  });
});

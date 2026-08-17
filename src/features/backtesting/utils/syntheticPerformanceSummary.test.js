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

    const expectancy = rows.find((r) => r.key === "expectancy");
    expect(expectancy?.textOnly).toBe(false);
    expect(expectancy?.percentile).toEqual(expect.any(Number));
    expect(String(expectancy?.original)).toMatch(/^-?\d+\.\d{2} \(-?\d+\.\d{2}\)$/);
    expect(String(expectancy?.min)).toMatch(/^-?\d+\.\d{2} \(-?\d+\.\d{2}\)$/);

    for (const key of [
      "maxLossN",
      "avgLossN",
      "maxWinN",
      "avgWinN",
      "ddHighLow",
      "ddStart",
      "ddEnd",
      "avgDurWinners",
      "avgDurLosers",
      "longShortCounts",
    ]) {
      const row = rows.find((r) => r.key === key);
      expect(row?.textOnly, key).toBe(false);
      expect(row?.percentile, key).toEqual(expect.any(Number));
      expect(row?.min, key).toBeTruthy();
      expect(row?.max, key).toBeTruthy();
    }

    const netPlShort = rows.find((r) => r.key === "netPlShort");
    expect(netPlShort?.textOnly).toBe(false);
    expect(String(netPlShort?.original)).toMatch(/^[+-]?\d+\.\d{2}% \/ [+-]/);

    // Short-off placeholders stay text-only when the parent is spot.
    expect(empty.every((r) => typeof r.original === "string" || r.original == null)).toBe(true);
    expect(rows.length).toBeGreaterThan(30);
  });
});

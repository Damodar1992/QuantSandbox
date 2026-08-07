import React, { memo } from "react";
import { cx } from "@/constants/ui";

const TONES = {
  ok: "border-violet-700/40 bg-violet-900/30 text-violet-200",
  edited: "border-amber-500/40 bg-amber-500/5 text-amber-100/90",
  standalone: "border-[rgba(60,40,80,0.45)] bg-[#19102b] text-[#b8aecc]",
};

/**
 * Explains, above the parameter grid, what the run inherits and what Δ will
 * actually measure. Three states — ok / edited / standalone (§5.1).
 */
export const InheritanceBar = memo(function InheritanceBar({
  state,
  miniName,
  manualFees,
  derivedFees,
  editedLabels = [],
  criticalEdits = [],
  epochNumber,
}) {
  const feeGap =
    manualFees && derivedFees
      ? `mini had ${manualFees.maker}/${manualFees.taker}, the backtest applies ${derivedFees.maker}/${derivedFees.taker}${
          derivedFees.funding ? " + funding" : ""
        }`
      : null;

  return (
    <div
      className={cx(
        "rounded-lg border px-3 py-2.5 text-[11px] leading-snug",
        TONES[state] || TONES.standalone,
      )}
    >
      {state === "ok" ? (
        <>
          <strong className="font-medium">✓ The run will reproduce {miniName} one to one.</strong>{" "}
          The only difference is fees: {feeGap || "they always come from exchange + mode"} — that gap
          is exactly what Δ will measure.
        </>
      ) : null}

      {state === "edited" ? (
        <>
          <strong className="font-medium">
            ✎ {editedLabels.length} parameter{editedLabels.length === 1 ? "" : "s"} changed against{" "}
            {miniName} — no longer a straight reproduction.
          </strong>{" "}
          Δ now mixes the fee gap with your edits: {editedLabels.join(", ")}.
          {criticalEdits.length > 0 ? (
            <div className="mt-1.5 text-amber-300">
              ⚠ {criticalEdits.join(", ")} changed — this is not the same experiment any more.
            </div>
          ) : null}
        </>
      ) : null}

      {state === "standalone" ? (
        <>
          <strong className="font-medium">
            ✎ Backtest without a mini on Epoch #{epochNumber ?? "—"}
          </strong>{" "}
          — nothing to inherit, parameters are entered by hand. No mini column and no Δ.
        </>
      ) : null}
    </div>
  );
});

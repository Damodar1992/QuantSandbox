// Stage 5 · id generators. Server owns ids in production; these mimic the shapes.

const HEX = "0123456789abcdef";

function hex(len) {
  let out = "";
  for (let i = 0; i < len; i += 1) {
    out += HEX[Math.floor(Math.random() * 16)];
  }
  return out;
}

/** `oos-xxxxxxxxxxxx` — Level 0 backtest run. */
export function newBacktestId() {
  return `oos-${hex(12)}`;
}

/** Bare hex id — Shuffler run. */
export function newShufflerId() {
  return hex(10);
}

/** `soc-xxxxxxxxxx` — Synthetic run. */
export function newSyntheticId() {
  return `soc-${hex(10)}`;
}

/** `A-N`, sequential inside a branch. */
export function nextAnalyticsId(existing = []) {
  const used = existing
    .map((a) => Number(String(a.id || "").replace(/^A-/, "")))
    .filter((n) => Number.isFinite(n));
  const next = used.length ? Math.max(...used) + 1 : 1;
  return `A-${next}`;
}

/** Short display form of a long id: `oos-1a2b…9f`. */
export function shortId(id, head = 8, tail = 2) {
  const value = String(id ?? "");
  if (value.length <= head + tail + 1) return value;
  return `${value.slice(0, head)}…${value.slice(-tail)}`;
}

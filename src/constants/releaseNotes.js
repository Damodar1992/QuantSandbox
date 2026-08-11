/** @typedef {{ id: string, title: string, version: string, releasedAt: string, body: string, createdAt: string }} ReleaseNote */

/** @type {ReleaseNote[]} */
export const INITIAL_RELEASE_NOTES = [
  {
    id: "rn-3",
    title: "Global Tags & Prod-only UI",
    version: "0.3.0",
    releasedAt: "2026-06-22",
    createdAt: "2026-06-22T10:00:00",
    body: `## Highlights

- **Global Tags page** with two-level table and relation management
- Split **Tags** and **Comment** actions on Hyperopt results
- **Formulas** feature flag in header dropdown
- Removed legacy UI theme — **prod violet theme only**

### Tags

- View tags, owners, linked Hyperopt results
- Break relations or delete tags globally (mock permissions)

### Other

- Mini Backtest analyzer (feature flag)
- Release Notes page`,
  },
  {
    id: "rn-2",
    title: "Mini Backtest Analyzer",
    version: "0.2.0",
    releasedAt: "2026-06-15",
    createdAt: "2026-06-15T14:30:00",
    body: `## What's new

- Mini Backtest modal from Favorite Epochs
- Summary tab on strategy detail
- Feature flags dropdown in header

\`\`\`text
Run Mini BT → configure params → save result to summary table
\`\`\`

> Available when **Mini Backtest** flag is enabled.`,
  },
  {
    id: "rn-1",
    title: "Prod UI & Builder improvements",
    version: "0.1.0",
    releasedAt: "2026-05-01",
    createdAt: "2026-05-01T09:00:00",
    body: `## Builder

- Sidebar stage navigation
- BuilderAccordion sections
- Card view for Optimization Results

## CRM

- Violet prod theme aligned with reference design
- shadcn/ui primitives bridge`,
  },
];

/** Semver-like: 0.1.0, 0.1.1, 1.2.3 */
export const RELEASE_VERSION_PATTERN = /^\d+\.\d+\.\d+$/;

export function isValidReleaseVersion(value) {
  return RELEASE_VERSION_PATTERN.test(String(value || "").trim());
}

/** Ensure older mock notes still expose a version after HMR / partial drafts. */
export function normalizeReleaseNotes(notes = []) {
  const seedById = new Map(INITIAL_RELEASE_NOTES.map((n) => [n.id, n]));
  return notes.map((note, index) => {
    if (note?.version && isValidReleaseVersion(note.version)) return note;
    const seeded = seedById.get(note?.id)?.version;
    const fallback = seeded || `0.${Math.max(1, notes.length - index)}.0`;
    return { ...note, version: fallback };
  });
}

export function sortReleaseNotesByDate(notes) {
  return [...notes].sort((a, b) => b.releasedAt.localeCompare(a.releasedAt));
}

export function formatReleaseDate(isoDate) {
  if (!isoDate) return "—";
  try {
    return new Date(`${isoDate}T00:00:00`).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return isoDate;
  }
}

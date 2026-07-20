/**
 * Formats hyperopt run timestamps as DD.MM.YYYY HH:mm (prod table style).
 * Accepts ISO strings, "YYYY-MM-DD HH:mm", or date-only "YYYY-MM-DD".
 */
export function formatHyperoptDateTime(value) {
  if (value == null || value === "") return "—";

  const raw = String(value).trim();
  if (!raw) return "—";

  const normalized = raw.includes("T") ? raw : raw.replace(" ", "T");
  const parsed = new Date(normalized);

  if (!Number.isNaN(parsed.getTime())) {
    const pad = (n) => String(n).padStart(2, "0");
    return `${pad(parsed.getDate())}.${pad(parsed.getMonth() + 1)}.${parsed.getFullYear()} ${pad(parsed.getHours())}:${pad(parsed.getMinutes())}`;
  }

  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
  if (dateOnly) {
    return `${dateOnly[3]}.${dateOnly[2]}.${dateOnly[1]}`;
  }

  return raw;
}

/** Maps legacy mock labels to prod-style table status. */
export function normalizeHyperoptRunStatus(status) {
  if (!status) return "Completed";
  if (status === "Done") return "Completed";
  return status;
}

/** True when hyperopt RAW data was deleted — re-run actions are locked. */
export function isHyperoptRawDataDeleted(status) {
  return normalizeHyperoptRunStatus(status) === "Raw data deleted";
}

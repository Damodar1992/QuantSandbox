// Lightweight Excel-compatible export for Shuffle info (SpreadsheetML .xls).

import { buildShuffleTotalSummary } from "./shuffleTotalSummary";
import { shufflerSections } from "./pessimism";

function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function sheetXml(name, rows) {
  const safeName = String(name || "Sheet").slice(0, 31);
  const body = rows
    .map(
      (row) =>
        `<Row>${row
          .map((cell) => `<Cell><Data ss:Type="String">${esc(cell)}</Data></Cell>`)
          .join("")}</Row>`,
    )
    .join("");
  return `<Worksheet ss:Name="${esc(safeName)}"><Table>${body}</Table></Worksheet>`;
}

function fmtCell(value) {
  if (value == null || value === "") return "";
  return String(value);
}

function summarySheetRows(summary) {
  const rows = [["Section", "Metric", "Original", "Original pct", "Mean", "Median", "Max", "Min"]];
  for (const section of summary?.sections || []) {
    for (const row of section.rows || []) {
      rows.push([
        section.title,
        row.label,
        fmtCell(row.original),
        row.originalPct == null ? "N/A" : `${row.originalPct}%`,
        fmtCell(row.mean),
        fmtCell(row.median),
        fmtCell(row.max),
        fmtCell(row.min),
      ]);
    }
  }
  return rows;
}

function sectionSheetName(label, key) {
  const raw = label || key || "Section";
  return String(raw).replace(/[\\/?*[\]]/g, " ").slice(0, 31);
}

export function downloadShuffleInfoExcel(run) {
  if (!run) return;

  const cfg = run.config || {};
  const overview = [
    ["Field", "Value"],
    ["Run ID", run.id],
    ["Parent backtest", run.backtestId || ""],
    ["Epoch", run.epochLabel || ""],
    ["Simulation mode", cfg.simulationMode === "dynamic" ? "DYNAMIC" : "STATIC"],
    ["Shuffles N", cfg.shufflesN ?? ""],
    ["Approach", cfg.approach || ""],
    ["Stress test", cfg.stressTestEnabled ? "on" : "off"],
    ["Created at", run.createdAt || ""],
    ["Created by", run.createdBy || ""],
  ];

  const sheets = [sheetXml("Overview", overview)];

  // All / Total summary
  const allSummary = buildShuffleTotalSummary(run);
  sheets.push(sheetXml("Summary All", summarySheetRows(allSummary)));

  const sections = shufflerSections(cfg).filter((s) => s.key !== "total");
  for (const section of sections) {
    const summary = buildShuffleTotalSummary(run, { sectionKey: section.key });
    sheets.push(sheetXml(sectionSheetName(section.label, section.key), summarySheetRows(summary)));
  }

  const xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
${sheets.join("\n")}
</Workbook>`;

  const blob = new Blob([xml], { type: "application/vnd.ms-excel;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `shuffle-info-${run.id || "run"}.xls`;
  a.click();
  URL.revokeObjectURL(url);
}

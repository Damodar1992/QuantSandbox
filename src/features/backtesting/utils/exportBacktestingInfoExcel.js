// Lightweight Excel-compatible export (SpreadsheetML .xls) — no extra deps.

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

function performanceRows(run) {
  const perf = run?.result?.performance || {};
  const rows = [["Section", "Metric", "Total", "Detail"]];

  for (const item of perf.hero || []) {
    const value =
      item.suffix === "%"
        ? `${Number(item.value) > 0 ? "+" : ""}${Number(item.value).toFixed(2)}%`
        : item.value;
    rows.push(["OVERVIEW", item.label, value, item.sub || ""]);
  }

  const sections =
    perf.columns?.length > 0
      ? perf.columns.flatMap((col) => col.sections || [])
      : perf.sections || [];

  for (const section of sections) {
    for (const row of section.rows || []) {
      rows.push([section.title, row.label, row.total, row.sub || ""]);
    }
  }
  return rows;
}

function tradesRows(run) {
  const trades = (run?.result?.tradesList?.trades || []).filter((t) => t.direction !== "Short");
  const rows = [
    [
      "Direction",
      "Pair",
      "Amount",
      "Stake",
      "Leverage",
      "Open rate",
      "Close rate",
      "Stop loss",
      "Liq. price",
      "Net P/L %",
      "Net P/L USDT",
      "Reserved",
      "Open date",
      "Close date",
      "Exit reason",
    ],
  ];
  for (const t of trades) {
    rows.push([
      t.direction,
      t.pair,
      t.amount,
      t.stakeAmount,
      t.leverage,
      t.openRate,
      t.closeRate,
      t.stopLoss,
      t.liqPrice,
      t.netPlPct,
      t.netPlUsdt,
      t.reserved,
      t.openDate,
      t.closeDate,
      t.exitReason,
    ]);
  }
  return rows;
}

function settingsRows(run) {
  const panels = run?.result?.settings?.panels || [];
  const rows = [["Panel", "Field", "Value"]];
  for (const panel of panels) {
    for (const row of panel.rows || []) {
      rows.push([panel.title, row.label, row.value]);
    }
  }
  return rows;
}

function feesRows(run) {
  const fees = run?.result?.fees;
  const rows = [
    [
      "Pair",
      "Open taker",
      "Open maker",
      "Total open",
      "Close taker",
      "Close maker",
      "Total close",
    ],
  ];
  if (!fees) return rows;
  const all = [...(fees.rows || []), fees.total].filter(Boolean);
  for (const r of all) {
    rows.push([
      r.pair,
      r.openTaker ?? "N/A",
      r.openMaker ?? "N/A",
      r.totalOpen,
      r.closeTaker ?? "N/A",
      r.closeMaker ?? "N/A",
      r.totalClose,
    ]);
  }
  return rows;
}

export function downloadBacktestingInfoExcel(run) {
  if (!run) return;

  const overview = [
    ["Field", "Value"],
    ["Run ID", run.id],
    ["Epoch", run.epochLabel || ""],
    ["Pair", run.params?.pair || ""],
    ["Timeframe", run.params?.timeframe || ""],
    ["Period from", run.params?.periodFrom || ""],
    ["Period to", run.params?.periodTo || ""],
    ["Exchange", run.params?.exchange || ""],
    ["Mode", run.params?.mode || ""],
  ];

  const xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
${sheetXml("Overview", overview)}
${sheetXml("Performance", performanceRows(run))}
${sheetXml("Fees", feesRows(run))}
${sheetXml("Settings", settingsRows(run))}
${sheetXml("Trades", tradesRows(run))}
</Workbook>`;

  const blob = new Blob([xml], { type: "application/vnd.ms-excel;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `backtesting-info-${run.id || "run"}.xls`;
  a.click();
  URL.revokeObjectURL(url);
}

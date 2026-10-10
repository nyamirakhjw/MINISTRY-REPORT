import type ExcelJS from "exceljs";

// §12.2 Excel spec: navy header row, white bold text, thin gold bottom border; frozen header (+ first column
// on Detail); auto-filter; whole-number formats; A4 landscape with the header row repeated on every printed page.
export const NAVY = "FF0B2E6B";
export const GOLD = "FFF2C14E";

export function styleHeaderRow(row: ExcelJS.Row) {
  row.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: NAVY } };
    cell.border = { bottom: { style: "thin", color: { argb: GOLD } } };
    cell.alignment = { vertical: "middle" };
  });
  row.height = 20;
}

export function setupPrint(ws: ExcelJS.Worksheet, headerRow = 1) {
  ws.pageSetup = { orientation: "landscape", paperSize: 9, fitToPage: true, fitToWidth: 1, fitToHeight: 0 };
  ws.pageSetup.printTitlesRow = `${headerRow}:${headerRow}`;
}

export function autofitColumns(ws: ExcelJS.Worksheet, widths: number[]) {
  widths.forEach((w, i) => { ws.getColumn(i + 1).width = w; });
}

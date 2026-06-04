/**
 * Excel (.xlsx) export — A4-landscape "before-after comparison table" form.
 *
 * Layout (one worksheet):
 *   Row 1: title "新旧対照表", centered across the full table width.
 *   Row 2: column headers.
 *   Row 3+: one row per comparison block.
 *
 * Rows 1-2 are set as print title rows, so the title and headers repeat at the
 * top of every printed page (page 2 onward included).
 *
 * Print setup is fixed to A4 landscape, scaled to one page wide; long documents
 * simply flow onto more pages.
 *
 * Only *added* text is emphasized: text that is new in the "after" side is shown
 * red + underline. Removed / before-side text is left as normal black.
 *
 * Row heights are estimated from the wrapped line count so long cells are not
 * clipped on print. The font is Noto Sans JP.
 */

import ExcelJS from "exceljs";
import { ComparisonRow } from "../diff";
import { Locale, changeTypeLabel } from "../report";

const RED = "FFFF0000";
const FONT_NAME = "Noto Sans JP";
const BASE_SIZE = 10;
const TITLE_SIZE = 16;
const LINE_POINTS = 16; // height per wrapped line at 10pt JP

interface XlsxOptions {
  locale: Locale;
  changedOnly: boolean;
}

interface Segment {
  text: string;
  changed: boolean;
}

/**
 * Character-level LCS, returning the "after" side split into segments
 * (changed = inserted text that is new compared with "before").
 */
function addedSegments(before: string, after: string): Segment[] {
  const a = Array.from(before);
  const b = Array.from(after);
  const n = a.length;
  const m = b.length;

  const dp: number[][] = Array.from({ length: n + 1 }, () =>
    new Array<number>(m + 1).fill(0)
  );
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] =
        a[i] === b[j]
          ? dp[i + 1][j + 1] + 1
          : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  const segs: Segment[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      pushChar(segs, b[j], false);
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      i++; // removed from old — not shown on the after side
    } else {
      pushChar(segs, b[j], true); // added in new
      j++;
    }
  }
  while (j < m) pushChar(segs, b[j++], true);

  return segs;
}

/** Append a char to the segment list, merging into the last run when possible. */
function pushChar(segs: Segment[], ch: string, changed: boolean): void {
  const last = segs[segs.length - 1];
  if (last && last.changed === changed) {
    last.text += ch;
  } else {
    segs.push({ text: ch, changed });
  }
}

const baseFont = { name: FONT_NAME, size: BASE_SIZE };
const addedFont = {
  name: FONT_NAME,
  size: BASE_SIZE,
  color: { argb: RED },
  underline: true as const,
};

/** Convert "after" segments to a cell value (rich text only when something is added). */
function afterCellValue(
  segs: Segment[]
): string | ExcelJS.CellRichTextValue {
  if (!segs.some((s) => s.changed)) {
    return segs.map((s) => s.text).join("");
  }
  return {
    richText: segs.map((s) => ({
      text: s.text,
      font: s.changed ? addedFont : baseFont,
    })),
  };
}

/** Whole "after" cell highlighted as added (for new sections). */
function addedWhole(text: string): string | ExcelJS.CellRichTextValue {
  if (text.length === 0) return "";
  return { richText: [{ text, font: addedFont }] };
}

const TITLE: Record<Locale, string> = {
  en: "Before-After Comparison Table",
  ja: "新旧対照表",
};

const HEADERS: Record<Locale, string[]> = {
  en: ["Section", "After (new)", "Before (current)", "Change", "Notes"],
  ja: ["条項", "改定後（新）", "改定前（現行）", "変更区分", "備考"],
};

const COL_WIDTHS = [12, 53, 53, 11, 11];

/** Cell text from a string or rich-text value. */
function cellText(value: string | ExcelJS.CellRichTextValue): string {
  return typeof value === "string"
    ? value
    : value.richText.map((r) => r.text).join("");
}

/** Estimate wrapped line count of one cell given the chars that fit per line. */
function lineCount(text: string, charsPerLine: number): number {
  if (text.length === 0) return 1;
  return text.split("\n").reduce((acc, line) => {
    const len = Array.from(line).length;
    return acc + Math.max(1, Math.ceil(len / charsPerLine));
  }, 0);
}

/**
 * Write the comparison rows to an .xlsx file. Returns the number of data rows.
 */
export async function writeXlsx(
  rows: ComparisonRow[],
  options: XlsxOptions,
  outputPath: string
): Promise<number> {
  const { locale, changedOnly } = options;
  const visible = changedOnly
    ? rows.filter((r) => r.changeType !== "unchanged")
    : rows;

  // Characters per line per column, estimated conservatively (assume fewer
  // characters fit than the raw width, so rows are sized tall enough to print).
  const divisor = locale === "ja" ? 2.45 : 1.3;
  const charsPerLine = COL_WIDTHS.map((w) => Math.max(1, Math.floor(w / divisor)));

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(TITLE[locale], {
    pageSetup: {
      orientation: "landscape",
      paperSize: 9, // A4
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      horizontalCentered: true,
      margins: {
        left: 0.3,
        right: 0.3,
        top: 0.35,
        bottom: 0.35,
        header: 0.2,
        footer: 0.2,
      },
    },
  });

  sheet.columns = COL_WIDTHS.map((w) => ({ width: w }));

  // Row 1: title centered across the whole table width (A1:E1).
  sheet.mergeCells("A1:E1");
  const titleCell = sheet.getCell("A1");
  titleCell.value = TITLE[locale];
  titleCell.font = { name: FONT_NAME, size: TITLE_SIZE, bold: true };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };
  sheet.getRow(1).height = 24;

  // Row 2: column headers.
  const headerRow = sheet.getRow(2);
  HEADERS[locale].forEach((h, idx) => {
    const cell = headerRow.getCell(idx + 1);
    cell.value = h;
    cell.font = { name: FONT_NAME, size: BASE_SIZE, bold: true };
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFF2F2F2" },
    };
    cell.border = allBorders();
  });
  headerRow.height = 18;

  // Data rows (start at row 3).
  visible.forEach((row, idx) => {
    const r = sheet.getRow(3 + idx);

    let afterValue: string | ExcelJS.CellRichTextValue;
    if (row.changeType === "modified") {
      afterValue = afterCellValue(addedSegments(row.before, row.after));
    } else if (row.changeType === "added") {
      afterValue = addedWhole(row.after);
    } else {
      afterValue = row.after; // unchanged / removed: plain (no emphasis)
    }
    const beforeValue = row.before; // before side is never emphasized

    r.getCell(1).value = row.section;
    r.getCell(2).value = afterValue;
    r.getCell(3).value = beforeValue;
    r.getCell(4).value = changeTypeLabel(locale, row.changeType);
    r.getCell(5).value = "";

    // Plain cells get the base font; rich-text cells carry fonts per run.
    [1, 3, 4, 5].forEach((c) => {
      r.getCell(c).font = baseFont;
    });
    if (typeof afterValue === "string") {
      r.getCell(2).font = baseFont;
    }

    r.getCell(1).alignment = { vertical: "top", wrapText: true };
    r.getCell(2).alignment = { vertical: "top", wrapText: true };
    r.getCell(3).alignment = { vertical: "top", wrapText: true };
    r.getCell(4).alignment = {
      vertical: "top",
      horizontal: "center",
      wrapText: true,
    };
    r.getCell(5).alignment = { vertical: "top", wrapText: true };
    for (let c = 1; c <= 5; c++) {
      r.getCell(c).border = allBorders();
    }

    // Set the row height from the tallest cell so text is not clipped on print.
    const lines = Math.max(
      lineCount(row.section, charsPerLine[0]),
      lineCount(cellText(afterValue), charsPerLine[1]),
      lineCount(beforeValue, charsPerLine[2])
    );
    r.height = Math.max(17, lines * LINE_POINTS + 4);
  });

  // Repeat title + headers on every printed page.
  sheet.pageSetup.printTitlesRow = "1:2";

  await workbook.xlsx.writeFile(outputPath);
  return visible.length;
}

function allBorders(): Partial<ExcelJS.Borders> {
  const side = { style: "thin" as const, color: { argb: "FFBFBFBF" } };
  return { top: side, left: side, bottom: side, right: side };
}

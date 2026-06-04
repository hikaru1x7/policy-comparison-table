/**
 * CSV export.
 *
 * Produces CSV that opens cleanly in Excel and Google Sheets:
 *   - Fields containing commas, quotes, or line breaks are quoted.
 *   - Embedded double quotes are doubled per RFC 4180.
 *   - Long multi-line cell text is preserved (kept inside quoted fields).
 *   - CRLF row endings for broad spreadsheet compatibility.
 *   - Optional UTF-8 BOM so Excel detects UTF-8 automatically.
 */

import { Table } from "../report";

const UTF8_BOM = "﻿";

function escapeField(value: string): string {
  const needsQuoting = /[",\r\n]/.test(value);
  if (!needsQuoting) {
    return value;
  }
  return `"${value.replace(/"/g, '""')}"`;
}

export interface CsvOptions {
  /** Prepend a UTF-8 BOM (recommended for Excel). Default: true. */
  bom?: boolean;
}

export function toCsv(table: Table, options: CsvOptions = {}): string {
  const bom = options.bom ?? true;
  const allRows = [table.headers, ...table.rows];
  const body = allRows
    .map((row) => row.map(escapeField).join(","))
    .join("\r\n");
  return (bom ? UTF8_BOM : "") + body + "\r\n";
}

/**
 * Markdown table export.
 *
 * Produces a GitHub-flavored Markdown table. Because a Markdown table cell
 * cannot contain a raw line break, multi-line cell text is joined with <br>.
 * Pipe characters are escaped so they do not break the table layout.
 */

import { Table } from "../report";

function escapeCell(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\|/g, "\\|")
    .replace(/\r?\n/g, "<br>")
    .trim();
}

export function toMarkdown(table: Table): string {
  const header = `| ${table.headers.map(escapeCell).join(" | ")} |`;
  const divider = `| ${table.headers.map(() => "---").join(" | ")} |`;
  const rows = table.rows.map(
    (row) => `| ${row.map(escapeCell).join(" | ")} |`
  );
  return [header, divider, ...rows].join("\n") + "\n";
}

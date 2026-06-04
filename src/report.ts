/**
 * Report building.
 *
 * Turns comparison rows into a localized table (headers + string cells),
 * including rule-based summaries and change-type labels.
 */

import { ChangeType, ComparisonRow } from "./diff";

export type Locale = "en" | "ja";

export interface Table {
  headers: string[];
  rows: string[][];
}

const HEADERS: Record<Locale, string[]> = {
  en: ["Section", "Before", "After", "Change Type", "Summary", "Notes"],
  ja: ["条項", "改定前", "改定後", "変更区分", "変更内容", "備考"],
};

const CHANGE_LABELS: Record<Locale, Record<ChangeType, string>> = {
  en: {
    unchanged: "unchanged",
    modified: "modified",
    added: "added",
    removed: "removed",
  },
  ja: {
    unchanged: "変更なし",
    modified: "変更",
    added: "追加",
    removed: "削除",
  },
};

const SUMMARIES: Record<Locale, Record<ChangeType, string>> = {
  en: {
    unchanged: "No material change detected.",
    modified: "Text modified.",
    added: "Section added.",
    removed: "Section removed.",
  },
  ja: {
    unchanged: "変更なし",
    modified: "文言を変更",
    added: "条項を追加",
    removed: "条項を削除",
  },
};

export interface ReportOptions {
  locale: Locale;
  changedOnly: boolean;
}

/** Localized label for a change type (reused by the xlsx exporter). */
export function changeTypeLabel(locale: Locale, type: ChangeType): string {
  return CHANGE_LABELS[locale][type];
}

/** Build a localized table from comparison rows. */
export function buildTable(
  rows: ComparisonRow[],
  options: ReportOptions
): Table {
  const { locale, changedOnly } = options;

  const visibleRows = changedOnly
    ? rows.filter((row) => row.changeType !== "unchanged")
    : rows;

  const tableRows = visibleRows.map((row) => [
    row.section,
    row.before,
    row.after,
    CHANGE_LABELS[locale][row.changeType],
    SUMMARIES[locale][row.changeType],
    "", // Notes: left blank for the reviewer to fill in.
  ]);

  return {
    headers: HEADERS[locale],
    rows: tableRows,
  };
}

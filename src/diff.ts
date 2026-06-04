/**
 * Block comparison.
 *
 * Matches before/after blocks by their key and classifies each comparison row
 * as unchanged, modified, added, or removed.
 *
 * The matching is intentionally simple: blocks are paired by key (heading text
 * for headings, position for paragraphs). This is reliable for heading-based
 * documents such as policies and contracts, which is the primary use case.
 */

import { Block, normalizeContent } from "./parser";

export type ChangeType = "unchanged" | "modified" | "added" | "removed";

export interface ComparisonRow {
  /** Section label for display (heading text or a derived paragraph label). */
  section: string;
  before: string;
  after: string;
  changeType: ChangeType;
}

/** Truncate text for use as a section label when no heading is available. */
function deriveLabel(content: string, index: number): string {
  const firstLine = content.split("\n")[0]?.trim() ?? "";
  if (firstLine.length === 0) {
    return `(paragraph ${index + 1})`;
  }
  return firstLine.length > 50 ? `${firstLine.slice(0, 50)}…` : firstLine;
}

function sectionLabel(block: Block, index: number): string {
  return block.title.length > 0 ? block.title : deriveLabel(block.content, index);
}

/**
 * Compare two ordered lists of blocks and produce comparison rows.
 *
 * Output order: follows the "after" document, with any removed blocks inserted
 * at the position where their preceding matched block appears, falling back to
 * appending leftover removed blocks at the end.
 */
export function diffBlocks(
  beforeAll: Block[],
  afterAll: Block[]
): ComparisonRow[] {
  // A document title / preamble (any text before the first heading) is not a
  // clause; drop it so it does not appear as the first comparison row.
  const before = beforeAll.filter((b) => b.key !== "p:preamble");
  const after = afterAll.filter((a) => a.key !== "p:preamble");

  const beforeByKey = new Map<string, Block>();
  before.forEach((block) => {
    if (!beforeByKey.has(block.key)) {
      beforeByKey.set(block.key, block);
    }
  });

  const matchedBeforeKeys = new Set<string>();
  const rows: ComparisonRow[] = [];

  after.forEach((afterBlock, index) => {
    const match = beforeByKey.get(afterBlock.key);
    if (match) {
      matchedBeforeKeys.add(afterBlock.key);
      const changed =
        normalizeContent(match.content) !== normalizeContent(afterBlock.content);
      rows.push({
        section: sectionLabel(afterBlock, index),
        before: match.content,
        after: afterBlock.content,
        changeType: changed ? "modified" : "unchanged",
      });
    } else {
      rows.push({
        section: sectionLabel(afterBlock, index),
        before: "",
        after: afterBlock.content,
        changeType: "added",
      });
    }
  });

  // Any before block that was never matched has been removed.
  before.forEach((beforeBlock, index) => {
    if (!matchedBeforeKeys.has(beforeBlock.key)) {
      rows.push({
        section: sectionLabel(beforeBlock, index),
        before: beforeBlock.content,
        after: "",
        changeType: "removed",
      });
    }
  });

  // Drop rows that have no text on either side (e.g. a heading-only title
  // block such as a Markdown "# Title" with nothing under it).
  return rows.filter(
    (r) => !(r.before.trim() === "" && r.after.trim() === "")
  );
}

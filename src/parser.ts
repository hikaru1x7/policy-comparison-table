/**
 * Document parser.
 *
 * Splits a plain-text or Markdown document into practical comparison blocks.
 * A block is a logical section: a heading and the body text that follows it.
 *
 * Splitting priority:
 *   1. Markdown headings            (#, ##, ...)
 *   2. Japanese policy sections     (第1章, 第1条, ...)
 *   3. English Article / Section    (Article 1, Section 2, ...)
 *   4. Numbered headings            (1. , 1.1 , 2.3.4 ...)
 *   5. Paragraphs (blank-line separated) as a fallback
 *
 * The logic is intentionally simple. It aims to be useful for real document
 * revision work, not to be a perfect document model.
 */

export interface Block {
  /** Display title for the section. Empty for paragraph fallback blocks. */
  title: string;
  /** Body text of the block (may be multi-line, may be empty). */
  content: string;
  /** Internal key used to match before/after blocks. */
  key: string;
}

const HEADING_MATCHERS: Array<(line: string) => boolean> = [
  // Markdown heading: #, ##, ... up to ######
  (line) => /^#{1,6}\s+\S/.test(line),
  // Japanese policy sections: 第1章, 第12条, 第1節 etc.
  (line) => /^第\s*\d+\s*[章条節項]/.test(line),
  // English Article / Section / Chapter / Clause headings
  (line) => /^(Article|Section|Chapter|Clause)\s+\d+/i.test(line),
  // Numbered headings: "1. ", "1.1 ", "2.3.4 Title"
  (line) => /^\d+(\.\d+)*\.?\s+\S/.test(line),
];

function isHeading(line: string): boolean {
  return HEADING_MATCHERS.some((match) => match(line));
}

/** Strip leading Markdown heading markers (#) for a clean display title. */
function cleanTitle(line: string): string {
  return line.replace(/^#{1,6}\s+/, "").trim();
}

/** Normalize a string for matching purposes only (not for display). */
export function normalizeForMatch(text: string): string {
  return text.trim().replace(/\s+/g, " ").toLowerCase();
}

/** Normalize body text so equality ignores trailing whitespace differences. */
export function normalizeContent(text: string): string {
  return text
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+$/g, ""))
    .join("\n")
    .trim();
}

/**
 * Parse a document into ordered blocks.
 */
export function parseDocument(raw: string): Block[] {
  const text = raw.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = text.split("\n");

  const hasHeadings = lines.some((line) => isHeading(line.trim()));
  if (!hasHeadings) {
    return parseByParagraph(text);
  }

  const blocks: Block[] = [];
  const titleCounts = new Map<string, number>();

  let currentTitle: string | null = null;
  let currentBody: string[] = [];
  let preamble: string[] = [];

  const pushBlock = (rawTitle: string, bodyLines: string[]) => {
    const title = cleanTitle(rawTitle);
    const content = normalizeContent(bodyLines.join("\n"));
    const baseKey = normalizeForMatch(title);
    const occurrence = (titleCounts.get(baseKey) ?? 0) + 1;
    titleCounts.set(baseKey, occurrence);
    blocks.push({
      title,
      content,
      key: `h:${baseKey}#${occurrence}`,
    });
  };

  for (const rawLine of lines) {
    const line = rawLine;
    if (isHeading(line.trim())) {
      if (currentTitle === null) {
        // Flush any preamble text before the first heading.
        const pre = normalizeContent(preamble.join("\n"));
        if (pre.length > 0) {
          blocks.push({ title: "", content: pre, key: "p:preamble" });
        }
      } else {
        pushBlock(currentTitle, currentBody);
      }
      currentTitle = line.trim();
      currentBody = [];
    } else if (currentTitle === null) {
      preamble.push(line);
    } else {
      currentBody.push(line);
    }
  }

  if (currentTitle !== null) {
    pushBlock(currentTitle, currentBody);
  } else {
    const pre = normalizeContent(preamble.join("\n"));
    if (pre.length > 0) {
      blocks.push({ title: "", content: pre, key: "p:preamble" });
    }
  }

  return blocks;
}

/** Fallback: split on blank lines into paragraph blocks, keyed by position. */
function parseByParagraph(text: string): Block[] {
  const paragraphs = text
    .split(/\n{2,}/)
    .map((p) => normalizeContent(p))
    .filter((p) => p.length > 0);

  return paragraphs.map((content, index) => ({
    title: "",
    content,
    key: `p:${index}`,
  }));
}

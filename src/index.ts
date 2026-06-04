#!/usr/bin/env node
/**
 * policy-comparison-table
 *
 * Local CLI that compares two document versions (.txt / .md / .docx) and
 * exports the differences as a before-after comparison table
 * (CSV, Markdown, or an A4-landscape Excel form).
 *
 * Everything runs locally. No files are uploaded anywhere.
 */

import { readFileSync, writeFileSync } from "fs";
import { extname } from "path";
import mammoth from "mammoth";
import { parseDocument } from "./parser";
import { diffBlocks } from "./diff";
import { buildTable, Locale } from "./report";
import { toCsv } from "./export/csv";
import { toMarkdown } from "./export/markdown";
import { writeXlsx } from "./export/xlsx";

type Format = "csv" | "markdown" | "xlsx";

interface CliOptions {
  beforePath: string;
  afterPath: string;
  format: Format;
  locale: Locale;
  changedOnly: boolean;
  output: string | null;
}

const USAGE = `policy-comparison-table — before/after document comparison table

Usage:
  policy-comparison-table <before> <after> [options]

Options:
  --format <csv|markdown|xlsx>  Output format (default: markdown)
                                xlsx = A4-landscape "before-after" form
  --output <file>               Write to a file instead of stdout
                                (required for xlsx)
  --locale <en|ja>              Column/label language (default: en)
  --changed-only                Exclude unchanged rows
  --preset ja-policy            Shortcut: --locale ja --changed-only --format csv
                                (writes comparison.csv unless --output is given)
  -h, --help                    Show this help

Examples:
  policy-comparison-table before.md after.md
  policy-comparison-table before.md after.md --format csv --output comparison.csv
  policy-comparison-table before.md after.md --locale ja --changed-only
  policy-comparison-table before.md after.md --preset ja-policy
  policy-comparison-table before.docx after.docx --locale ja --changed-only --format xlsx --output 対照表.xlsx
`;

function fail(message: string): never {
  process.stderr.write(`Error: ${message}\n\n${USAGE}`);
  process.exit(1);
}

function parseArgs(argv: string[]): CliOptions {
  if (argv.includes("-h") || argv.includes("--help")) {
    process.stdout.write(USAGE);
    process.exit(0);
  }

  const positionals: string[] = [];
  let format: Format | null = null;
  let locale: Locale = "en";
  let changedOnly = false;
  let output: string | null = null;
  let preset: string | null = null;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    switch (arg) {
      case "--format": {
        const value = argv[++i];
        if (value !== "csv" && value !== "markdown" && value !== "xlsx") {
          fail(`invalid --format "${value ?? ""}" (use csv, markdown, or xlsx)`);
        }
        format = value;
        break;
      }
      case "--locale": {
        const value = argv[++i];
        if (value !== "en" && value !== "ja") {
          fail(`invalid --locale "${value ?? ""}" (use en or ja)`);
        }
        locale = value;
        break;
      }
      case "--output":
        output = argv[++i] ?? null;
        if (output === null) {
          fail("--output requires a file path");
        }
        break;
      case "--changed-only":
        changedOnly = true;
        break;
      case "--preset":
        preset = argv[++i] ?? null;
        if (preset !== "ja-policy") {
          fail(`unknown preset "${preset ?? ""}" (available: ja-policy)`);
        }
        break;
      default:
        if (arg.startsWith("-")) {
          fail(`unknown option "${arg}"`);
        }
        positionals.push(arg);
    }
  }

  // Apply the ja-policy preset, letting explicit flags take precedence.
  if (preset === "ja-policy") {
    locale = "ja";
    changedOnly = true;
    if (format === null) {
      format = "csv";
    }
    if (output === null) {
      output = "comparison.csv";
    }
  }

  if (positionals.length !== 2) {
    fail("expected exactly two input files: <before> <after>");
  }

  return {
    beforePath: positionals[0],
    afterPath: positionals[1],
    format: format ?? "markdown",
    locale,
    changedOnly,
    output,
  };
}

async function readDocument(path: string): Promise<string> {
  if (extname(path).toLowerCase() === ".docx") {
    try {
      const result = await mammoth.extractRawText({ path });
      return result.value;
    } catch {
      fail(`could not read DOCX file "${path}"`);
    }
  }
  try {
    return readFileSync(path, "utf8");
  } catch {
    fail(`could not read file "${path}"`);
  }
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));

  const beforeRaw = await readDocument(options.beforePath);
  const afterRaw = await readDocument(options.afterPath);

  const beforeBlocks = parseDocument(beforeRaw);
  const afterBlocks = parseDocument(afterRaw);

  const rows = diffBlocks(beforeBlocks, afterBlocks);

  // xlsx is a binary, styled form — it must be written to a file.
  if (options.format === "xlsx") {
    if (!options.output) {
      fail("--format xlsx requires --output (e.g. --output 対照表.xlsx)");
    }
    const count = await writeXlsx(
      rows,
      { locale: options.locale, changedOnly: options.changedOnly },
      options.output
    );
    process.stdout.write(
      `Wrote ${count} comparison row(s) to ${options.output}\n`
    );
    return;
  }

  const table = buildTable(rows, {
    locale: options.locale,
    changedOnly: options.changedOnly,
  });

  const out =
    options.format === "csv" ? toCsv(table) : toMarkdown(table);

  if (options.output) {
    writeFileSync(options.output, out, "utf8");
    process.stdout.write(
      `Wrote ${table.rows.length} comparison row(s) to ${options.output}\n`
    );
  } else {
    process.stdout.write(out);
  }
}

main().catch((err) => {
  process.stderr.write(`Unexpected error: ${String(err)}\n`);
  process.exit(1);
});

# CLAUDE.md

Instructions for Claude Code working in this repository.

## Project summary

`policy-comparison-table` is a local TypeScript CLI that compares two document
versions (`.txt` / `.md` / `.docx`) and exports a before-after comparison table
(CSV, Markdown, or an A4-landscape Excel form) for document revision work. It
runs entirely locally.

## Working rules

- **Keep changes focused and incremental.** Modify only what the task needs.
- **Avoid over-engineering.** Choose the simplest solution that works. If 50
  lines do the job, do not write 200.
- **Do not expand scope** unless explicitly requested. The MVP excludes Web UI,
  PDF, AI APIs, servers, databases, authentication, and cloud features — these
  belong in the roadmap only.
- **Do not introduce frameworks or runtime dependencies** unless clearly
  necessary and agreed. Runtime dependencies are `mammoth` (`.docx` text
  extraction) and `exceljs` (`.xlsx` output); the build uses TypeScript.
- **Preserve the local, CLI-first design.** No network calls at runtime.
- **Match the existing style.** Don't rename, reformat, or refactor unrelated
  code while making a change.

## Architecture

Pipeline: `parser.ts` → `diff.ts` → `report.ts` → `export/csv.ts` |
`export/markdown.ts`, orchestrated by `index.ts`.

- `parser.ts` splits a document into comparison blocks (headings, `第1条` /
  `Article` style sections, numbered headings, paragraph fallback).
- `diff.ts` matches blocks by key and classifies rows as unchanged / modified /
  added / removed.
- `report.ts` produces localized headers, labels, and rule-based summaries.
- `export/*` serializes the output. `csv.ts` / `markdown.ts` render the
  localized table (CSV must remain Excel/Sheets-safe); `xlsx.ts` builds the
  A4-landscape Excel form with inline (character-level) diff highlighting.

## Definition of done for a change

1. `npm run build` succeeds with no type errors.
2. Running the CLI against `examples/` produces the expected table.
3. CSV output still opens cleanly in Excel/Sheets (escaping intact).
4. `README.md` and `examples/` are updated if behavior changed.

## Commands

```bash
npm install
npm run build
node dist/index.js examples/before.md examples/after.md
node dist/index.js examples/japanese-before.md examples/japanese-after.md --preset ja-policy
```

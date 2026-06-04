# AGENTS.md

Guidance for AI coding agents working on **policy-comparison-table**.

## What this project is

A small, local, dependency-light TypeScript CLI that compares two document
versions (`.txt` / `.md` / `.docx`) and exports a before-after comparison table
as CSV, Markdown, or an A4-landscape Excel form. It is a tool for document
revision work — not a raw diff viewer and not a hosted product.

## Core principles

- **Keep it small and practical.** The value is a reliable comparison table,
  not architectural sophistication.
- **Prefer simple, readable TypeScript** over clever abstractions. A junior
  engineer should be able to read any file top to bottom and understand it.
- **Stay dependency-light.** Runtime dependencies are `mammoth` (`.docx` text
  extraction) and `exceljs` (`.xlsx` output). Do not add further runtime
  dependencies without a strong reason.
- **Prioritize correct output.** CSV must stay safe for Excel and Google Sheets
  (proper escaping of commas, quotes, line breaks; UTF-8 with BOM). Markdown
  tables must stay valid (escape pipes, collapse line breaks to `<br>`).

## Out of scope for the MVP

Do **not** add any of the following unless the maintainer explicitly asks:

- AI / LLM API integration
- Web UI
- PDF support
- Database or persistence layer
- Authentication
- Server / hosted service
- Cloud storage or file-upload backend

These appear only in the roadmap. Preserve the local, CLI-first design.

## Project layout

```
src/
  index.ts          CLI: argument parsing, input reading (.txt/.md/.docx), orchestration
  parser.ts         Splits a document into comparison blocks
  diff.ts           Matches blocks and classifies change types
  report.ts         Builds the localized table (headers, labels, summaries)
  export/
    csv.ts          CSV serialization (Excel/Sheets-safe)
    markdown.ts     Markdown table serialization
    xlsx.ts         A4-landscape Excel form + inline diff highlighting
examples/           Realistic before/after documents and expected tables
```

Data flow: `parser` → `diff` → `report` → `export/*`.

## When making changes

- Keep changes focused and incremental; touch only what the task requires.
- Match the existing code style; do not reformat or rename unrelated code.
- If you add a feature, update `README.md` and the relevant `examples/`.
- Keep summaries rule-based and deterministic — no network calls, no AI.
- Verify with `npm run build` and run the CLI against the files in `examples/`.

## Build & run

```bash
npm install
npm run build
node dist/index.js examples/before.md examples/after.md
```

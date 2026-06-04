# Contributing

Thanks for your interest in **policy-comparison-table**. This is a small,
local-first CLI, and contributions that keep it simple and practical are
welcome.

## Project philosophy

- Keep it small, readable, and dependency-light.
- Prioritize reliable comparison-table output (CSV / Markdown / Excel).
- Stay local-first: no servers, no document uploads, no AI APIs at runtime.

See [AGENTS.md](AGENTS.md) for the scope guardrails (also followed by AI coding
agents) and [CLAUDE.md](CLAUDE.md) for working rules.

## Development setup

```bash
npm install
npm run build
node dist/index.js examples/before.md examples/after.md
```

Useful scripts:

| Script | Purpose |
| --- | --- |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run the built CLI |
| `npm run dev` | Run from source with ts-node |

## Before opening a pull request

1. `npm run build` succeeds with no type errors.
2. The CLI still produces correct tables for the files in `examples/`
   (CSV, Markdown, and `--format xlsx`).
3. CSV output remains safe for Excel / Google Sheets (escaping intact).
4. Update `README.md`, `docs/manual-ja.md`, and `examples/` if behavior changed.
5. Keep changes focused; do not reformat or refactor unrelated code.

## Out of scope (roadmap only)

Please do not add the following without prior discussion: Web UI, AI / LLM APIs,
PDF input, server, database, authentication, or cloud features. These belong in
the roadmap, not the MVP.

## Reporting issues

When filing an issue, include the input files (or a minimal example), the exact
command you ran, the OS and Node.js version, and what you expected versus what
happened.

## License

By contributing, you agree that your contributions are licensed under the
[MIT License](LICENSE).

# Screenshots

These images are shown in the main [README](../../README.md).

| File | Content |
| --- | --- |
| `sample-output.jpg` | Print preview (A4 landscape) — the form handed to reviewers |
| `sample-excel.jpg` | The same table opened in Excel (editable) |

To refresh them, regenerate a form and re-capture:

```bash
node dist/index.js examples/japanese-long-before.docx examples/japanese-long-after.docx \
  --locale ja --format xlsx --output sample.xlsx
```

Open `sample.xlsx` in Excel, capture the print preview and the worksheet, and
overwrite the two files above (keep the same names so the README links keep
working).

# Screenshots

`sample-output.png` is a **placeholder**. To show a real result in the main
README, replace it with an actual Excel screenshot:

1. Generate a sample form:

   ```bash
   node dist/index.js examples/japanese-before.docx examples/japanese-after.docx \
     --locale ja --changed-only --format xlsx --output sample.xlsx
   ```

2. Open `sample.xlsx` in Excel and use **File → Print Preview** (A4 landscape).
3. Take a screenshot and save it as `docs/images/sample-output.png`
   (keep the same file name so the README image link keeps working).

A second screenshot of the multi-page layout (using the
`examples/japanese-long-*.docx` files) is also useful to show page breaks and
the repeated header.

# policy-comparison-table 日本語マニュアル

2つの文書（改定前・改定後）を比較し、**Excel／Google スプレッドシートで開ける
新旧対照表**を作成するローカル CLI ツールです。生の diff ではなく、条項ごとに
「改定前／改定後／変更区分」を並べた、規程改定の実務で使える対照表を出力します。

すべて **手元の PC で処理**され、文書がどこかにアップロードされることはありません。

---

## 目次

1. [動作環境](#動作環境)
2. [インストール](#インストール)
3. [基本的な使い方](#基本的な使い方)
4. [コマンドオプション](#コマンドオプション)
5. [Excel 新旧対照表（--format xlsx）](#excel-新旧対照表---format-xlsx)
6. [クリック実行（ターミナル不要）](#クリック実行ターミナル不要)
7. [対応ファイル形式](#対応ファイル形式)
8. [仕組み（ブロック分割と対応付け）](#仕組みブロック分割と対応付け)
9. [トラブルシューティング](#トラブルシューティング)
10. [よくある質問](#よくある質問)

---

## 動作環境

- Node.js 18 以上
- Windows / macOS / Linux
- `.docx` を比較する場合も追加設定は不要（同梱の依存で処理します）

---

## インストール

```bash
git clone https://github.com/<your-account>/policy-comparison-table.git
cd policy-comparison-table
npm install
npm run build
```

ビルド後、次で実行できます。

```bash
node dist/index.js before.md after.md
```

毎回 `node dist/index.js` と打つのが面倒な場合は、グローバル登録しておくと
`policy-comparison-table` という短い名前で呼べます。

```bash
npm link
policy-comparison-table before.md after.md
```

> Windows で `node` / `npm` が「認識されません」と出る場合は、Node.js が
> インストールされていないか、PATH が通っていません。Node.js LTS を
> インストールし、ターミナルを開き直してください。

---

## 基本的な使い方

```bash
policy-comparison-table <改定前ファイル> <改定後ファイル> [オプション]
```

代表的なパターン:

| やりたいこと | コマンド |
| --- | --- |
| 画面に Markdown 表で確認 | `policy-comparison-table before.md after.md --locale ja` |
| Excel 新旧対照表を出力 | `policy-comparison-table before.docx after.docx --locale ja --changed-only --format xlsx --output 新旧対照表.xlsx` |
| CSV を出力 | `policy-comparison-table before.md after.md --preset ja-policy` |

---

## コマンドオプション

| オプション | 説明 |
| --- | --- |
| `--format <csv \| markdown \| xlsx>` | 出力形式（既定: markdown）。`xlsx` は A4 横の新旧対照表 |
| `--output <ファイル>` | ファイルに書き出す（既定: 画面表示）。`xlsx` では必須 |
| `--locale <en \| ja>` | 列名・ラベルの言語（既定: en） |
| `--changed-only` | 「変更なし」の行を除外 |
| `--preset ja-policy` | `--locale ja --changed-only --format csv` のまとめ指定 |
| `-h`, `--help` | ヘルプ表示 |

変更区分は `変更なし` / `変更` / `追加` / `削除` の4種類で自動判定されます。

---

## Excel 新旧対照表（--format xlsx）

`--format xlsx` は、印刷してそのまま使える新旧対照表を出力します（`--output` 必須）。

- **A4 横**に固定。条項が多い場合は自動で複数ページに送られます。
- タイトル「新旧対照表」を**ページ幅で中央寄せ**。
- タイトル行と見出し行は**印刷タイトル行**に設定され、2ページ目以降も各ページ
  先頭に繰り返されます。
- 列の並びは **左＝改定後（新）／右＝改定前（現行）**。
- **追加された箇所のみ**を赤字＋下線で強調します（削除・変更前側は通常表示）。
- 行の高さは本文量に合わせて自動調整され、文字が切れないようにします。
- フォントは **Noto Sans JP**（未インストールの場合は代替フォントで表示）。

出力後、Excel で開いて `ファイル → 印刷` でそのまま印刷できます。備考欄は記入用に
空けてあります。

---

## クリック実行（ターミナル不要）

コマンド入力に慣れていない場合のため、[`examples/`](../examples/) に実行用
スクリプトを同梱しています。

- `run_comparison.ps1` … PowerShell 本体（ファイル名を書き換える）
- `run_comparison.bat` … ダブルクリック用（Windows）
- `run_comparison.sh` … macOS / Linux / Git Bash 用

### 手順（Windows）

1. `run_comparison.bat` と `run_comparison.ps1` を、**新旧ファイルと同じ
   フォルダ**にコピーする。
2. `run_comparison.ps1` をメモ帳で開き、先頭の項目を書き換える。

   ```powershell
   $Before = "旧.docx"          # 改定前ファイル名
   $After  = "新.docx"          # 改定後ファイル名
   $Output = "新旧対照表.xlsx"   # 出力ファイル名
   $ChangedOnly = $true          # $true=変更箇所のみ / $false=全条
   ```

3. `run_comparison.bat` をダブルクリックする。同じフォルダに対照表が出力されます。

`$Node` / `$Tool` のパスは、Node.js とこのツールの `dist/index.js` の場所を
指します。ツールを移動した場合のみ書き換えてください。

### 手順（macOS / Linux）

`run_comparison.sh` 内の `TOOL` をツールの場所に合わせ、`BEFORE` / `AFTER` /
`OUTPUT` を設定してから実行します。

```bash
bash run_comparison.sh
```

---

## 対応ファイル形式

| | 形式 |
| --- | --- |
| 入力 | プレーンテキスト（`.txt`）、Markdown（`.md`）、Word（`.docx`） |
| 出力 | CSV、Markdown 表、Excel（`.xlsx`） |

- `.docx` は本文テキストを抽出して比較します。画像・表・複雑な書式は無視されます。
- Word の**変更履歴は確定（反映）してから**比較してください。
- CSV は UTF-8（BOM 付き）で出力し、Excel でも文字化けしません。

---

## 仕組み（ブロック分割と対応付け）

1. 改定前・改定後のファイルを読み込む。
2. 各文書を比較ブロックに分割する。分割の優先順位:
   - Markdown 見出し（`#`, `##` …）
   - 日本語の条見出し（`第1章`, `第1条` …）
   - 英語の `Article 1` / `Section 1`
   - 番号見出し（`1.`, `1.1` …）
   - 見出しが無ければ段落単位
3. 見出しテキストでブロックを対応付け、本文を比較する。
4. 各行を `変更なし` / `変更` / `追加` / `削除` に分類する。
5. 対照表として出力する。

> 文書冒頭のタイトル（最初の条見出しより前の文）は条項ではないため、対照表から
> 除外されます。

---

## トラブルシューティング

| 症状 | 原因と対処 |
| --- | --- |
| `node`/`npm` が認識されない | Node.js 未インストール、または PATH 未設定。Node.js LTS を入れて開き直す |
| 出力ファイルに書き込めない（EBUSY） | 出力先の Excel ファイルを開いたまま実行している。Excel を閉じてから再実行 |
| 条番号がずれて「追加＋削除」になる | 見出しテキストで対応付けるため。条見出しの表記を新旧で揃えると精度が上がる |
| `.docx` がうまく比較できない | 本文に条見出しのテキスト（`第1条` 等）があるか確認。変更履歴は確定しておく |
| 1ページに条項が少ししか入らない | 本文が長い場合は自動でページが増えます。`--changed-only` で変更条のみに絞れます |

---

## よくある質問

**Q. 文書はどこかに送信されますか？**
A. いいえ。すべて手元の PC で処理され、ネットワーク送信は行いません。

**Q. Word ファイル同士を比較できますか？**
A. できます。`.docx` をそのまま渡してください（本文テキストを抽出して比較します）。

**Q. 列の順番や差分の色を変えたい。**
A. 現状は「左＝改定後／右＝改定前」「追加箇所のみ赤＋下線」が既定です。コードの
`src/export/xlsx.ts` で調整できます。

**Q. PDF や DOCX 出力に対応していますか？**
A. PDF 入力・XLSX 以外のリッチ出力はロードマップ段階です。README を参照してください。

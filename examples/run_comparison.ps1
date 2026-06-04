# ============================================================
#  新旧対照表 作成スクリプト (PowerShell)
#  使い方:
#   1. このファイルと run_comparison.bat を、新旧ファイルと
#      同じフォルダにコピーする
#   2. このファイルをメモ帳で開き、下の4項目を書き換える
#   3. run_comparison.bat をダブルクリックする
# ============================================================

# ▼▼▼ ここをメモ帳で書き換える ▼▼▼
$Before = "旧.docx"            # 改定前ファイル名
$After  = "新.docx"            # 改定後ファイル名
$Output = "新旧対照表.xlsx"     # 出力ファイル名
$ChangedOnly = $true            # $true=変更箇所のみ / $false=全条を出力
# ▲▲▲ ここまで ▲▲▲

# 環境設定 (通常は変更不要。Node とツールの場所)
$Node = "C:\Program Files\nodejs\node.exe"
$Tool = "C:\Users\hikar\policy-comparison-table\dist\index.js"

Set-Location -LiteralPath $PSScriptRoot
$cliArgs = @($Before, $After, "--locale", "ja", "--format", "xlsx", "--output", $Output)
if ($ChangedOnly) { $cliArgs += "--changed-only" }

Write-Host "作成中: $Before / $After"
& $Node $Tool @cliArgs
Write-Host ""
Write-Host "完了しました: $Output"
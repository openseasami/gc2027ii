# 開発基盤 v2.6.0（プレビュー）

## 実施内容
- `TEST_MATRIX.json` は効果グループ横断の **163 条件**を列挙する機械可読仕様書。
- `test-generated-matrix.js` は全条件を `battle-core.js` に対して実行する自動テスト。従来テストと同様に `test-*.js` として発見される。
- 採用率基準の境界値、天候延長、ターン減少、かるわざ、タイプによる状態異常耐性、接触系特性の発動確率を扱う。
- 開発用の総合ゲート `gc_release_gate.py` はテストと網羅率を分けて判定する。

## 実行（ZIPを展開してから）
```bash
node test-generated-matrix.js
python gc_release_gate.py --source . --output ../gc_reports --manifest effect_evidence.json --package-preview
```
※後者は Python スクリプトと `gc_pipeline.py` と `gc_coverage_gate.py` をアプリ直下に置いた場合。`tools/` フォルダには全て同梱済みのため、通常は以下を使用：
```bash
python tools/gc_release_gate.py --source . --output ../gc_reports --manifest tools/effect_evidence.json --package-preview
```

## 重要な判定原則
- 自動テスト全合格と工程③④完成は別。
- 採用率未収集の種は対象外としない。
- 既存アプリの画面実行、外部の正解値と照合した精度はこのテストで証明されない。

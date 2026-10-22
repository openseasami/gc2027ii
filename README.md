# Global Challenge 2027 II 支援サイト — v2.9.6

**開発途中です。完成判定は false。** 開発ブランチは `codex-development`。

現在の実装内容・制約・再開手順は [DEVELOPMENT_CHECKPOINT.md](DEVELOPMENT_CHECKPOINT.md)、
完成条件の評価は [COMPLETION_REPORT.md](COMPLETION_REPORT.md) を参照してください。

- [実装台帳](IMPLEMENTATION_LEDGER.json): 特性・技・持ち物・メガの登録/部分実装/検証証拠。
- [未対応・未検証一覧](DEVELOPMENT_BACKLOG.json): 優先度・依存関係・残件。
- [テスト実行結果](TEST_RESULTS.json): 終了コード・ログ・ソースSHA-256。
- [開発ゲート](DEVELOPMENT_GATES.md): 完成判定の条件。
- [網羅性監査](COVERAGE_AUDIT.md): 1,149候補の5分類と元91件の調査範囲。

## 開発検証

Node.js、Python、`/usr/bin/chromium` を使用します。

```sh
python -m venv --system-site-packages work/test-venv
work/test-venv/bin/python -m pip install -r requirements-dev.txt
npm ci --ignore-scripts --cache work/npm-cache
work/test-venv/bin/python run-development-checks.py
python build-development-release.py
```

テスト成功だけでは、対象大会の使用可否、全効果の実装、公式ゲームとの一致を保証しません。
ブラウザー検証はローカルHTTPを使用します。実行範囲の詳細は完成判定レポートに記録しています。

## 公開用ファイル

`release/gc2027ii-v2.9.6-development.zip` に静的サイト一式を保存しています。
ビルドは不要です。同梱のHTML、全外部JS、Service Worker、manifest、アイコンを同じ場所に配置してください。
`release/RELEASE_MANIFEST.json` と `release/SHA256SUMS.txt` で内容を確認できます。

この開発作業では `main` と公開サイトを更新していません。公開ブランチの変更・デプロイは行っていません。
保存先のURLが変わる場合の対戦データ移行には、既存のJSON出力/復元機能を使用できます。

## 自動継続開発

[継続開発の操作と権限範囲](DEVELOPMENT_AUTOMATION.md)、[実行契約](AGENTS.md) を参照。
短い再開指示と依存グループ選択、失敗・証拠・チェックポイント保存を用意。定期実行は未有効化。

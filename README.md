# Global Challenge 2027 II 支援サイト — v2.9.14

**開発途中です。完成判定は false。** 開発ブランチは `codex-development`。

最新は**v2.9.14の大会前練習・検証専用版**です。[実戦操作/推奨監査](LIVE_PRACTICAL_AUDIT.md)に従い、最後の1体の推奨、採点の非単調性、確実な単体2KOの評価、行動仮説の偏り、既存KO枠の重複入力を限定修正しました。既存UIとカタログ/採用データは保持しています。

配布は[gc2027ii-v2.9.14-practice-verification.zip](release/practice-v2.9.14/gc2027ii-v2.9.14-practice-verification.zip)。[SHA-256](release/practice-v2.9.14/SHA256SUMS.txt)、[実ZIP展開後の検証](release/practice-v2.9.14/ARTIFACT_VERIFICATION.json)、[起動](PC_TRIAL_START.md)、[JSONバックアップ/移行](JSON_BACKUP.md)、[未確認条件](UNCONFIRMED_CONDITIONS.md)を参照してください。公式一覧・規約の追加調査は今回の対象外で、対戦中の外部ツール利用許可は未確認です。

旧v2.9.13練習ZIPはrelease/practice-v2.9.13/、それ以前の大会試用ZIPはrelease/tournament-v2.9.13/にバックアップとして保持し、上書きしません。タスキ・18半減実の修正は最新版にも含みます。古い大会用判定と練習専用配布の合格を混同しないでください。

現在の実装内容・制約・再開手順は [DEVELOPMENT_CHECKPOINT.md](DEVELOPMENT_CHECKPOINT.md)、
PC試用版の起動は [PC_TRIAL_START.md](PC_TRIAL_START.md)、判定は [PC_TRIAL_ACCEPTANCE.json](PC_TRIAL_ACCEPTANCE.json)。
完成条件の評価は [COMPLETION_REPORT.md](COMPLETION_REPORT.md) を参照してください。

- [実装台帳](IMPLEMENTATION_LEDGER.json): 特性・技・持ち物・メガの登録/部分実装/検証証拠。
- [未対応・未検証一覧](DEVELOPMENT_BACKLOG.json): 優先度・依存関係・残件。
- [テスト実行結果](TEST_RESULTS.json): 終了コード・ログ・ソースSHA-256。
- [開発ゲート](DEVELOPMENT_GATES.md): 完成判定の条件。
- [大会実用版の合格条件](TOURNAMENT_PRACTICAL_GATES.md): 候補網羅を停止し、上位120の重大不具合へ集中。
- [大会実用版の検証結果](TOURNAMENT_PRACTICAL_RESULTS.json): ローカル合格と未確認事項を区別。
- [網羅性監査](COVERAGE_AUDIT.md): 1,149候補の5分類と元91件の調査範囲。

## 開発検証

Node.js、Python、`/usr/bin/chromium` を使用します。

```sh
python -m venv --system-site-packages work/test-venv
work/test-venv/bin/python -m pip install -r requirements-dev.txt
npm ci --ignore-scripts --cache work/npm-cache
work/test-venv/bin/python run-development-checks.py
python evaluate-tournament-practical.py
python evaluate-practice-release.py
python build-practice-release.py
work/test-venv/bin/python verify-practice-release.py
```

テスト成功だけでは、対象大会の使用可否、全効果の実装、公式ゲームとの一致を保証しません。

確定ZIPを理由なく上書きしないでください。再生成には現在の成功結果と
PRACTICE_RELEASE_READINESS.jsonの最新ソース照合が必要です。固定対象はFROZEN_BASELINE.jsonに記録しています。
ブラウザー検証はローカルHTTPを使用します。実行範囲の詳細は完成判定レポートに記録しています。

## ローカル練習用ファイル

`release/practice-v2.9.14/gc2027ii-v2.9.14-practice-verification.zip` に静的サイト一式を保存しています。
ビルドは不要です。同梱のHTML、全外部JS、Service Worker、manifest、アイコンを同じ場所に配置してください。
`release/practice-v2.9.14/RELEASE_MANIFEST.json` と `release/practice-v2.9.14/SHA256SUMS.txt` で内容を確認できます。

この開発作業では `main` と公開サイトを更新していません。公開ブランチの変更・デプロイは行っていません。
保存先のURLが変わる場合の対戦データ移行には、既存のJSON出力/復元機能を使用できます。

## 自動継続開発

[継続開発の操作と権限範囲](DEVELOPMENT_AUTOMATION.md)、[実行契約](AGENTS.md) を参照。
短い再開指示と依存グループ選択、失敗・証拠・チェックポイント保存を用意。定期実行は未有効化。

最新の精度検証は [MAIN_MATCHUP_VALIDATION.md](MAIN_MATCHUP_VALIDATION.md)。PC実機操作はユーザー確認済み、UIを維持し、主要対面と重大不具合だけを検証・修正しています。

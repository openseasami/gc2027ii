# Global Challenge 2027 II 支援サイト — v2.9.13

**開発途中です。完成判定は false。** 開発ブランチは `codex-development`。

最新の[最終ZIP前一括監査](FINAL_PREZIP_AUDIT.md)は技術面で合格（全140回帰＋展開検査4/4）です。`64d8d75`のタスキ修正に加え、登録済み半減実の除外漏れを修正しました。公式一覧の全件照合・独立ツール利用許可が未確認のため、新しい大会用ZIPは作成していません。旧ZIPはバックアップで、最新補正を含みません。修正済みソースの起動は[PC_TRIAL_START.md](PC_TRIAL_START.md)、判定は[FINAL_PREZIP_AUDIT_RESULTS.json](FINAL_PREZIP_AUDIT_RESULTS.json)を参照してください。

前回の[ダメージ・種族値・KO境界監査](FINAL_DAMAGE_KO_AUDIT.md)で、小数HPの被ダメージ計算時のタスキ判定を1件修正しました。新機能/UI/検証済みデータは変更していません。修正は開発ブランチのソースに含まれます。下記の元の固定ZIPは未更新で、この修正を含みません。修正を使う場合は本監査コミットの一式を取得し、ルートのstart-pc-trial.cmdから起動してください。

**大会基準版はv2.9.13に固定し、追加機能を停止しました。** 指定ZIPは
[gc2027ii-v2.9.13-tournament-trial.zip](release/tournament-v2.9.13/gc2027ii-v2.9.13-tournament-trial.zip)
の1つです。[最終回帰判定](TOURNAMENT_BASELINE_REPORT.md)、
[SHA-256](release/tournament-v2.9.13/SHA256SUMS.txt)、[JSONバックアップ/移行](JSON_BACKUP.md)、
[未確認条件](UNCONFIRMED_CONDITIONS.md)を参照してください。旧ZIP/RC1は履歴用です。

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
python build-frozen-trial.py
work/test-venv/bin/python verify-frozen-trial.py
```

テスト成功だけでは、対象大会の使用可否、全効果の実装、公式ゲームとの一致を保証しません。

確定ZIPを理由なく上書きしないでください。再生成には現在の成功結果と
TOURNAMENT_BASELINE_RESULTS.jsonの更新が必要です。固定対象はFROZEN_BASELINE.jsonに記録しています。
ブラウザー検証はローカルHTTPを使用します。実行範囲の詳細は完成判定レポートに記録しています。

## 公開用ファイル

`release/gc2027ii-v2.9.13-development.zip` に静的サイト一式を保存しています。
ビルドは不要です。同梱のHTML、全外部JS、Service Worker、manifest、アイコンを同じ場所に配置してください。
`release/RELEASE_MANIFEST.json` と `release/SHA256SUMS.txt` で内容を確認できます。

この開発作業では `main` と公開サイトを更新していません。公開ブランチの変更・デプロイは行っていません。
保存先のURLが変わる場合の対戦データ移行には、既存のJSON出力/復元機能を使用できます。

## 自動継続開発

[継続開発の操作と権限範囲](DEVELOPMENT_AUTOMATION.md)、[実行契約](AGENTS.md) を参照。
短い再開指示と依存グループ選択、失敗・証拠・チェックポイント保存を用意。定期実行は未有効化。

最新の精度検証は [MAIN_MATCHUP_VALIDATION.md](MAIN_MATCHUP_VALIDATION.md)。PC実機操作はユーザー確認済み、UIを維持し、主要対面と重大不具合だけを検証・修正しています。

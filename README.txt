v2.9.17
最終の大会前練習・検証専用版。計画開発工程は今回で終了。全仕様completion:false。
起動: PC_TRIAL_START.md / start-pc-trial.cmd（Python 3）
データ移行: JSON_BACKUP.md（移行前後にJSONを保管）
最終判定・制約: FINAL_PRACTICE_CONFIRMATION.md / COMPLETION_REPORT.md
検証: TEST_RESULTS.json / SERIES_MATCH_RESULTS.json / VERSION_MIGRATION_RESULTS.json
旧ZIPを保持。対戦中の外部ツール利用許可は未確認。公式一覧・規約の追加調査なし。
配布: release/practice-v2.9.17/gc2027ii-v2.9.17-practice-verification.zip
再検証用: python run-development-checks.py → evaluate-series-matches.py → evaluate-tournament-practical.py → evaluate-practice-release.py
mainと公開サイトは変更しない。新しい計画開発段階を追加しない。

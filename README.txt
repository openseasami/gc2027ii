v2.9.16
PC起動: PC_TRIAL_START.md / start-pc-trial.cmd（Python 3）
大会前の練習・検証専用。全仕様completion:false。
連続模擬対戦・状態管理の最終検証: SERIES_MATCH_AUDIT.md / SERIES_MATCH_RESULTS.json
検証結果・残件・再開: TEST_RESULTS.json / DEVELOPMENT_CHECKPOINT.md / COMPLETION_REPORT.md
旧版v2.9.15/v2.9.14/v2.9.13 ZIPはバックアップとして維持する。
公式一覧と大会規約の追加調査は対象外。対戦中の外部ツール利用許可は未確認。
全回帰: work/test-venv/bin/python run-development-checks.py
練習版判定: python evaluate-series-matches.py / python evaluate-tournament-practical.py / python evaluate-practice-release.py
配布: release/practice-v2.9.16/gc2027ii-v2.9.16-practice-verification.zip
mainと公開サイトは変更しない。
PC操作改善の測定: PC_OPERATION_AUDIT.md / PC_OPERATION_RESULTS.json（自動操作のみ、人間45秒認定なし）

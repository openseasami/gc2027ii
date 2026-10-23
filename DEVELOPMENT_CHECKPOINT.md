# v2.9.13 練習・検証専用版 — 45cf644から公式再照合

全仕様completion:false。基点45cf64448234612268e0c7ba08bc5b3af7a5fe19。今回の実行ファイル15件は基点とバイト一致し、UI・種族値・技・持ち物・採用データを変更していない。64d8d75のタスキKO修正と45cf644の半減実18種修正を含む。新規の重大不具合は検出しなかった。

全140/140回帰成功。Linux Chromium/Windows Chrome・Edge UAのPC E2E、45秒操作、相手2体分の固定計算欄、HP/交代再計算、保存/巻き戻し/JSON、旧v2.9.1/10/12移行を再実行した。対象344形態の種族値2,064値、主要168技の限定基本計算・16乱数・KO境界は成功。Windows製品版全体や公式ゲームの全戦闘仕様は認定しない。

## 公式再照合

OFFICIAL_CATALOG_REVIEW.md/OFFICIAL_CATALOG_COMPARISON.jsonが最新。M-C告知、大会告知、リンク経由の大会詳細は取得でき、M-Cダブル・4体選出・メガ1回/石・持ち物重複禁止・20分/7分/45秒/90秒を確認した。6メガ名称は部分根拠だけを記録した。

公式ポケモン/技/持ち物の一覧は見出しのみで本体未取得。ローカル344形態・515技（習得510＋メタデータのみ5）・166持ち物の全件適合は未確認。候補ごとに記録し、公式総件数・不一致件数はnull。既存UIのM-C区分は今回の公式再認定ではない。対戦中の独立ブラウザツール利用許可は未確認で、許可済みと表示しない。問い合わせ送信はしていない。

## 確定した練習専用ZIP

最新ユーザー指示により、公式未確認を明記した大会前の練習・検証専用配布を作成した。大会用認定ZIPではない。

- release/practice-v2.9.13/gc2027ii-v2.9.13-practice-verification.zip（46ファイル）
- SHA-256: a1113c059faada5cada8b28b57d44227e18ae1aeeeb3932069ed739335d298da
- 実ZIPのCRC/内部全SHA/固定指紋確認後、展開後の起動・PC・表示/オフライン・完全観測試合が4/4成功。
- ZIP自身のSHA256SUMS.txtとARTIFACT_VERIFICATION.jsonは同じフォルダー。内部ファイルSHA、140回帰結果、公式未確認記録、起動/JSON手順を同梱した。
- PRACTICE_RELEASE_READINESS.jsonは技術判定、PRACTICE_RELEASE_RESULTS.jsonは最終結果。旧大会用判定のFINAL_PREZIP_AUDIT_RESULTS.jsonとは用途を区別する。

旧大会ZIPはSHA3cc7b8d9ca186e3a543f8aa0b514e094b253f90d119e716aef2229b6d7d95a90のままバックアップ保持。旧ZIPにタスキ・半減実修正は含まれない。古いbuild-frozen-trial.pyは実行しない。

全展開し、Python3のあるPCでstart-pc-trial.cmdまたはpy -3 launch-pc-trial.pyを起動する。Chrome/Edgeのhttp://127.0.0.1:8765/index.htmlで開く。初回HTTP読込後のオフラインを検証済み。旧版と移行先の双方を先にJSON出力し、JSON_BACKUP.mdに従い復元する。版番号だけで旧ZIPと見分けず、START_HERE.txtとSHAを確認する。

## 再開条件

新機能・1,149候補の網羅・他11技の実装へ戻らない。公式一覧本文または主催者の明確な根拠を取得できた場合だけ、未確認項目を根拠に基づき更新する。既存の6メガ部分根拠を全件適合に拡大しない。次回監査は全140回帰とPC E2Eを維持し、テスト後のソースSHAを一致させる。配布再判定は練習専用の範囲と公式大会使用の判定を混同せず、確定済みZIPを上書きしない。

未確認11主要技・全追加効果・全相互作用・完全試合オラクル・多ターン推奨は従来どおり未完。全仕様completion:false。作業はcodex-developmentへ通常commit/pushし、main/公開サイト/デプロイ/定期実行を変更しない。

# v2.9.14 実戦操作・推奨判断の修正版

大会前の練習・検証用。全仕様completion:false。公式適合と対戦中の外部ツール利用許可は未確認のまま引き継ぐ。今回、公式一覧・規約の追加調査は行っていない。

基点c089a19のv2.9.13から、最後の1体で推奨が消える処理、採点の非単調性、確実な単体2KOと命中不足の範囲技の偏り、相手行動仮説の偏り、既存KO枠の再入力を限定修正した。UI構成/CSS、6種族値・技・持ち物・採用データは維持。64d8d75のタスキ・45cf644の18半減実修正も保持する。詳しくはLIVE_PRACTICAL_AUDIT.md。

**全142/142回帰、追加48/48条件、局所Showdown差分の不一致0を確認した。** TEST_RESULTS.jsonに既存140＋追加2の全回帰結果と現在ソースSHAを同梱する。追加試験は36盤面＋12制約の48条件、独立Showdownの576ダメージ/72素早さ/36優先度/72順序比較と、戦闘状態を注入しない連続PC操作。既存168技の限定基本計算・344形態の種族値2,064値・120プロフィール境界・実際の16主要対面の差分・PC/スマートフォン・保存/巻き戻し/オフラインを維持する。旧版移行はv2.9.1/10/12とc089a19のv2.9.13の4版。

PRACTICE_RELEASE_READINESS.jsonが作成前の技術判定。実ZIPの最終検査はZIPと同じフォルダーのARTIFACT_VERIFICATION.jsonで、展開後に起動/PC/表示・オフライン/完全観測試合/連続操作の5件を実行する。全試合の正解オラクルや推奨最適性の完成には読み替えない。

配布はrelease/practice-v2.9.14/gc2027ii-v2.9.14-practice-verification.zipの1つ。全展開後、Python3のあるPCでstart-pc-trial.cmdまたはpy -3 launch-pc-trial.pyを起動し、Chrome/Edgeでhttp://127.0.0.1:8765/index.htmlを開く。PC_TRIAL_START.mdとJSON_BACKUP.mdを先に読む。旧版と移行先の双方で更新前のJSONバックアップを保管する。

ZIP自身のSHA-256は隣のSHA256SUMS.txt。自己参照を避け、内部には各ファイルのSHA256SUMS_CONTENTS.txtを同梱する。今回の公式未確認事項は再確認済みとは扱わず、c089a19のOFFICIAL_CATALOG_REVIEW.md等を履歴根拠として同梱する。

旧v2.9.13練習ZIP（SHAa1113c059faada5cada8b28b57d44227e18ae1aeeeb3932069ed739335d298da）とさらに前の大会試用ZIPは上書きせず保持。main/公開サイト/デプロイ/定期実行に変更はない。

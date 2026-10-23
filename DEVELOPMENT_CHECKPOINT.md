# 未確認20技監査チェックポイント — v2.9.12

completion:false。基点63c00636be95da872325e5828c37477edaab3f79、codex-development。main・公開サイトは変更しない。

最新依頼は主要179技中の未確認20技のデータ・基本計算・対象数補正の集中監査。追加効果、行動推奨、複数ターン最適化は対象外。一般候補1,149件の網羅や新規の戦術実装へ戻らない。

20技すべての元の未確認理由を分類し、威力/タイプ/分類/命中/対象指定を固定外部資料と照合した。全20技の通常の対象数補正は1.0で、範囲技0.75を適用しない。ドラゴンアローの2体への振り分けは未対応として分離。

新規4経路：つけあがる（全7正ランク）、ひゃっきやこう（Champions65/異常時130・ぜったいねむり）、アイアンローラー（フィールド成立条件）、ポルターガイスト（所持既知のみ計算、未知は保留）。既存2経路：ツインビーム/ダブルウイングの2連続計算を再使用。

6技について1,440条件、ダメージ16,320、命中5,100、成立/保留1,440、2連続合計分布2,066比較が不一致0。全体では既存159＋新たな6＝165/179技が明示条件で計算照合成功。残る14技はPENDING_TWENTY_AUDIT_RESULTS.jsonに理由付きで保存しcatalogOnly維持。履歴不足/専用計算不足を威力固定で埋めない。メタデータの一致だけで計算完成にしない。

全131/131コマンド成功（既存129＋条件単体＋20技実ブラウザ差分）。CSS/マークアップ、NATIONAL_DEX/NATIONAL_MOVES/REGULATION_MCの指紋と採用データ120件を維持。選択可能344種類（メガ82）の2,064種族値は二資料一致・未確認0のまま。参考カタログ内5非対象形態の第二資料未確認も維持。こだわりハチマキ/メガネは今回の大会向け検証に含めない。

試用版release/gc2027ii-v2.9.12-development.zip。PC_TRIAL_START.mdの手順でPython3のローカルサーバーを起動しChrome/Edgeで使用する。旧RC1は更新せず現行認定から外す。全回帰のPC E2Eに加え、展開した試用版のPC操作/完全観測試合テスト結果をrelease/DEVELOPMENT_ARTIFACT_VERIFICATION.jsonへ保存する。

次回はPENDING_TWENTY_AUDIT.mdとJSONの14技別の必要状態/専用処理から再開。単純な多段登録だけでドラゴンアロー・ネズミざん・トリプルアクセルを通常の固定連続技へ混ぜない。公式Championsエンジン/使用可能範囲/AP/一部形態は引き続き未確定。追加効果/行動推奨はユーザーの新規指示があるまで対象外。

再検証：node test-pending-move-conditions.js → work/test-venv/bin/python browser_pending_twenty_test.py → work/test-venv/bin/python browser_stats_moves_test.py。全回帰→evaluate-tournament-practical.py→build-development-release.py→ZIP展開操作確認→devコミット/push。最新ソースと照合器/原文SHAが一致し、不一致0の限定証拠だけを台帳へ取り込む。

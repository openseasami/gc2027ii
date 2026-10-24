# 最終確定 — v2.9.17 大会前練習・検証版

全153/153回帰、30試合218ターン、Showdown差分不一致0、PC E2E、過去6版とv2.9.16の計7版からの移行、実ZIP展開後8/8試験に成功しました。指定検証範囲に重大な既知不具合はありません。今回で計画開発を終了し、新しい段階を追加しません。全仕様completion:falseを維持します。

配布: release/practice-v2.9.17/gc2027ii-v2.9.17-practice-verification.zip

SHA-256: `80f84e56aa16f2faa654bbcfab6f1bcf2aec8a48c8d70a39327735149a0b4d91`

基点: fe26ed5fec5a165909c2f4d6979df7ca27d8cb92。保存コミットは `git log -1 --format=%H codex-development` とソース指紋で特定。詳細はFINAL_PRACTICE_CONFIRMATION.md、TEST_RESULTS.json、release/practice-v2.9.17/FINAL_CONFIRMATION.json / ARTIFACT_VERIFICATION.json。起動・移行はPC_TRIAL_START.md/JSON_BACKUP.mdを同梱しました。旧ZIPを保持し、main/公開サイト/デプロイ/定期実行を操作していません。

検証対象外/制約:

- 自動操作時間は人間の読解/判断や実ゲーム操作を含まず、人間の45秒達成を保証しない。
- Linux ChromiumとWindows Chrome/Edge UAによる互換試験。Windows製品版全構成の実機認定ではない。
- 推奨は参考推定。最適方策や全複数ターン勝ち筋を今回の完成条件に含めない。
- 全戦闘仕様は未完成。11主要技、全特性/持ち物/追加効果、未知の相手配分、Champions全エンジン一致は未確認。
- 30試合のHP/status/残余HP/二次ランク/一部持ち物は観測入力。全戦闘処理の自動一致を認定しない。決着時の自動場/能力残余は照合対象外。
- 既に旧版の途中試合へ記録された誤状態を推測で遡及補正しない。未試験の全旧保存形式/破損データまで互換性を保証しない。
- 公式一覧/大会規約の追加調査なし。対戦中の外部ツール使用許可を認定しない。
- オフラインは正常な初回HTTP読込/キャッシュ後の基本動作。初回未キャッシュ、破損キャッシュ、file://直接起動は未確認。

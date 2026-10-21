# v2.0.3 real-function integration audit

- 実際の applyObservedSubstituteStrike / confirmedSubstituteStrike / applyObservedMoveEffects / commitTurnActions を抽出して実行。
- みがわり破壊・貫通、天候、壁、行動履歴、双方交代の実関数経路をテスト。
- 交代時の特性・入場効果はスタブのため、完全なブラウザE2Eではない。
- バージョン整合性と既存テストを再実行。

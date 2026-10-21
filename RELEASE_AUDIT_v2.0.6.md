# v2.0.6 回帰検証
- v2.0.5の戦闘ロジックを維持。新たに `test-ko-replacement-real.js` を追加。
- 実際の `pendingSwitchDestinations`、`recordForcedReplacement`、`pendingKOReplacements`、`nextKOReplacement`、`hasPendingKOReplacement` を抽出して12件を確認。
- 両陣営のKO時の相手先行の補充案内、交代先の記録、登場時特性解決の遅延、通常HPでの不正な強制交代防止、交代先予約の重複防止を検証。
- 45秒画面のDOM操作、特性の実発動、セーブデータのブラウザ復元、実際の対戦は本テストの対象外。
- 他の既存自動テスト、配布前整合性テストの結果は別途コマンド実行結果を参照。

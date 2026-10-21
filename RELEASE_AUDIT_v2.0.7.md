# v2.0.7 KO後登場時特性の実関数テスト
- 変更: `test-ko-entry-actual.js` を追加。実際の `applyPostTurnEntries`、`resolveEntryEvents`、`triggerEntryAbility` を抽出実行。
- 新規10項目: ひでり/あめふらしの素早さ順、後発の天候優先、天候ターン設定、登場待機フラグ解除、freshEntry、相手目撃記録、二重発動防止、いかくによるランク低下。
- 既存 `test-*.js` と `verify-release.js` を実行しすべて正常終了。戦闘ロジック変更なし。
- 制限: 45秒モードの実DOM操作、実ブラウザ保存、同速ランダム順、全特性・実対戦の再現は未検証。

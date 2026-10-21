# v2.8.2 — 技使用イベントの画面接続

## 実装
- 既存の `applyObservedMoveEffects` に分散していた天候変更4技・フィールド変更4技・追い風・トリックルーム・リフレクター・ひかりのかべ、計12技を `effect-engine.js` の `moveDefinitions` で一元管理。
- `EffectEngine.evaluate('on_move_used', {move, succeeded:true})` の返却イベントから画面の天候/フィールド/各種残りターン/壁を更新。
- `commitTurnActions` は失敗済みの技をこの関数へ渡さない。共通エンジンも `succeeded !== true` なら発動を確定しない。
- 既存の特性14定義・技以外の処理（くろいきり・能力変化・技後交代等）を維持。

## 検証
- Node.js回帰テスト 62/62 合格（`test-v282-move-field-registry.js` を追加）。
- `verify-release.js`: 10/10 合格。
- 内蔵 JavaScript の構文検証合格。
- 旧テスト `test-engine-real-functions.js` が独立した共通エンジンを読み込まない問題を修正。

## 非対応・留意事項
- 今回の12技が採用率10%以上であるという主張はしていない。既存の共通処理重複を先に解消。
- 技の命中/発動失敗を正しく観測したかは既存の入力に依存する。ゲーム仕様の独立照合未了。
- 262種類中6種類のみ採用率調査済み。高採用率効果の全件実装、ダメージ計算の独立検証、実ブラウザE2Eは未完了。
- 公開GitHub Pagesへのアップロードは実施していない。

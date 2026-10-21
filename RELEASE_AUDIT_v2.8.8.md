# v2.8.8 — 仕様照合に基づく一括修正

## 修正した実装
1. トリックルーム中の4体実効素早さ表示: 以前は説明文だけ「低速順」で実際には高速順のままだった。トリックルーム有効時は低速順、通常時は高速順に統一。これは技優先度を含む確定行動順の表示ではない。
2. クイックドロウ: 攻撃技の場合のみ30%の先行可能性を考慮。既知の補助技は確率効果に含めない。未知の技分類は引き続き不確実。
3. 行動順独立検証器にもクイックドロウの技分類判定を追加。模擬ターン生成時に既存のダメージ技・補助技の分類を渡す。
4. 配布前監査で前版ZIPにHTML・README・Service Workerの表記がv2.8.4のまま残っていたことを検出。今回v2.8.8へ同期し、オフラインキャッシュも更新。

## 外部仕様照合元
- Pokémon Showdown Pokédex — Quick Draw: 「30% chance to move first in priority bracket with attacking moves」 https://dex.pokemonshowdown.com/abilities/quickdraw
- Pokémon Showdown Pokédex — Lagging Tail: 最後に行動するのは同一優先度内 https://dex.pokemonshowdown.com/items/laggingtail
- Smogon Pokemon Damage Calculator 公式実装: https://github.com/smogon/damage-calc (ダメージの実機照合に今後用いる候補、今回の外部ダメージ対照値としては使用していない)

## 検証
- Node.js自動テスト 69/69成功（旧68本 + 新規境界・統合検証1本）
- verify-release.js 10/10成功
- 新規8項目: 攻撃技/補助技へのクイックドロウ、せんせいのツメとの違い、共通判定、TR時と通常時の4体表示順
- コード差分の単体/静的試験であり、実ブラウザ・実機との完全一致は未検証

## 工程③④の未完了
- 採用率データは6/262種のサンプルのみ。採用率10%以上の技/7%超の特性の全件確定不可
- 独立したダメージ計算の外部正解データ照合、推奨行動の精度測定は未完了
- フィールド・天候・特性・持ち物を含む実戦対戦条件の網羅は未完了

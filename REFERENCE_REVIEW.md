# 今回の効果定義の参照確認

確認対象: Pokémon Showdown の一般ルール実装。固定リビジョン:
`b19c6f7a98810f2aa509e8003fa37844076972fd`。

- [items.ts](https://github.com/smogon/pokemon-showdown/blob/b19c6f7a98810f2aa509e8003fa37844076972fd/data/items.ts): 各フィールドシードは対応フィールドに反応し、接地判定を要求しない。グラス・エレキは防御、サイコ・ミストは特防を1段階変化させる。
- [moves.ts](https://github.com/smogon/pokemon-showdown/blob/b19c6f7a98810f2aa509e8003fa37844076972fd/data/moves.ts): からにこもる=防御+1、かくばる/ヨガのポーズ=攻撃+1、ロックカット=素早さ+2、つめとぎ=攻撃/命中+1、ギアチェンジ=攻撃+1/素早さ+2。リフレクター・ひかりのかべは通常5ターン、ひかりのねんどで8ターン。
- [conditions.ts](https://github.com/smogon/pokemon-showdown/blob/b19c6f7a98810f2aa509e8003fa37844076972fd/data/conditions.ts): 対応するいわを所持した天候の持続は8ターン。

これは上記の一般的な機構と期待値の参照確認であり、公式ゲーム実行、Showdownとの試合全体の差分実行、Champions固有ルールや対象大会の使用可否の検証ではない。対象大会のメガシンカ82形態をこの資料で正当化していない。参照ソースの取得成功を完全対戦再現の証拠にはしない。

## v2.9.2 — 実行可能な独立エンジンとの比較

- 比較エンジンは npm `pokemon-showdown@0.11.10`。`package.json` と `package-lock.json` に固定し、ローカルの隔離されたテスト用依存としてのみ利用する。公開サイトのランタイムへ組み込まない。
- `test-rank-differential.js`: 実際の `Battle.boost` に、同一の能力ランク・特性・持ち物・発生源を設定して比較。17種類の特性状態、クリアチャーム有無、5種類の初期ランク、自己/味方/相手、単独/複数の変化、いかくの組合せから2,720ケース。
- `test-item-differential.js`: 実際の `Battle.eachEvent('Update')` によるしろいハーブ消費・負のランク復元を、通常/あまのじゃく/たんじゅん/ぶきよう/かるわざ、マジックルーム有無と比較。60ケース。
- 差分から、まけんき/かちきは実際に下がった各能力ごとに反応すること、ミラーアーマーは対象の下限で制限された低下量を反射すること、ばんけんとクリアチャームの処理順を確認して修正した。
- 結果は `RANK_DIFFERENTIAL_RESULTS.json` と `ITEM_DIFFERENTIAL_RESULTS.json`。両方とも `completion=false`。局所的な一般第9世代ルールの比較であり、Championsの完全試合・対象大会の使用可否の証拠ではない。
- 静的参照も `smogon/pokemon-showdown` のコミット `8476966bb71714001e836571e41723219c4c2dd3` に固定して確認した。最新版と固定npm版ではイベント入口が異なる部分があるため、すべてのタイミングが一致すると主張しない。

クリアチャームは現行 `REGULATION_MC.items` の166件に含まれていない。一般エンジンとの比較ケースとして残すが、使用可能リストへ追加していない。`MECHANICS_EVIDENCE.json` の `outOfCatalogEvidence` で区別する。

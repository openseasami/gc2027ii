# 今回の効果定義の参照確認

確認対象: Pokémon Showdown の一般ルール実装。固定リビジョン:
`b19c6f7a98810f2aa509e8003fa37844076972fd`。

- [items.ts](https://github.com/smogon/pokemon-showdown/blob/b19c6f7a98810f2aa509e8003fa37844076972fd/data/items.ts): 各フィールドシードは対応フィールドに反応し、接地判定を要求しない。グラス・エレキは防御、サイコ・ミストは特防を1段階変化させる。
- [moves.ts](https://github.com/smogon/pokemon-showdown/blob/b19c6f7a98810f2aa509e8003fa37844076972fd/data/moves.ts): からにこもる=防御+1、かくばる/ヨガのポーズ=攻撃+1、ロックカット=素早さ+2、つめとぎ=攻撃/命中+1、ギアチェンジ=攻撃+1/素早さ+2。リフレクター・ひかりのかべは通常5ターン、ひかりのねんどで8ターン。
- [conditions.ts](https://github.com/smogon/pokemon-showdown/blob/b19c6f7a98810f2aa509e8003fa37844076972fd/data/conditions.ts): 対応するいわを所持した天候の持続は8ターン。

これは上記の一般的な機構と期待値の参照確認であり、公式ゲーム実行、Showdownとの試合全体の差分実行、Champions固有ルールや対象大会の使用可否の検証ではない。対象大会のメガシンカ82形態をこの資料で正当化していない。参照ソースの取得成功を完全対戦再現の証拠にはしない。

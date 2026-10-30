# 出典と採用基準（2026-10-29）

ユーザー指示で実機計算との照合と公式本文取得を判定条件から除外しました。これらを保留理由にしません。現在の対象は非公式サイトで比較したM-Cの範囲です。採否はMC_ROSTER.mdと機械可読監査を参照してください。

## M-Cの対象

- [Serebii 登場一覧](https://www.serebii.net/pokemonchampions/pokemon.shtml)と[M-C追加対象](https://www.serebii.net/pokemonchampions/rankedbattle/regulationm-c.shtml)
- [育成考察Wiki M-C一覧](https://champions.pokewiki.net/レギュレーションM-Cの使用可能ポケモン)
- [Bulbapedia Regulation Set M-C](https://bulbapedia.bulbagarden.net/wiki/Regulation_Set_M-C)
- [RotomLabs Champions メガニャオニクス♀](https://rotomlabs.net/dex/champions/meowstic/mega-female)
- SerebiiのChampions個別図鑑：フラエッテ、ニャオニクス、ポットデス、イッカネズミ、ヤバソチャ、ミミッキュ、モルペコ。

総数・形態粒度が違うため、単純な数字の一致や一サイトの不掲載だけで判定していません。正規化した名称・図鑑番号・形態と証拠の粒度を記録。同じ発行元の補完は独立した別サイトとは数えません。

取得日・URL・事実データはreports/mc-roster/。検索サービスで本文を取得しました。実行環境の直接HTTPは403でしたが、ネットワーク設定やアクセス制限を回避する取得は行っていません。公式ページの新たな取得も行っていません。

## 計算と画像

- [Smogon damage-calc](https://github.com/smogon/damage-calc)：npm @smogon/calc@0.12.0のChampions（世代0）。既存エンジンを維持。
- [Pokémon Showdown](https://github.com/smogon/pokemon-showdown)：コミット1242c1e2d9763ba5b85d33f13aecb89bae19ae3d、Champions mod。既存の比較対象・種族値出典です。エンジンの候補判定だけでM-C対象にしません。
- 能力値はレベル50、HP＝種族値＋ポイント＋75、その他＝floor((種族値＋ポイント＋20)×性格)。HP種族値1の例外あり。独立したChampions実装間の比較を確認範囲とし、実機照合は要求しません。
- 日本語名称・画像IDは既存対応表を利用。元v8の採用率は出典・集計日不明のため表示しません。
- [PokeAPI/sprites](https://github.com/PokeAPI/sprites)：元版の画像を維持しHTMLに内蔵。SHA-256で同梱内容を固定。
- Microsoft Edge Linux 142.0.3595.94：公式配布フィードのハッシュと照合した実ブラウザで試験。Windows実機で実行したという意味ではありません。

## 過去の確認記録

初版v9で公式一覧本文を取得できなかった事実は旧ZIPとGit履歴に保持。現在の非公式資料基準の採否を公式認定へ読み替えません。大会中の外部ツール使用可否の認定も行いません。

## 2026-10-30 技採用率

PokéKit公開オープンデータ https://poke.itlibra.com/opendata/usage-champions.json を単独の技統計ソースとして採用。説明・再配布条件は https://poke.itlibra.com/ja/opendata 。Smogon / Pokémon Showdown（集計元）・PokéKit（整形）を明記。2026年9月・Champions VGC reg.MCダブル・基準1760・1,631,943戦。統計をゲーム内公式ランキングと同一視しません。150形態、各10技（変化技込み）の上限と206形態の未取得を明示。詳細はUSAGE_MOVES.md。

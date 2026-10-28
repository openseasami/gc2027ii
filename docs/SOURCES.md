# 出典・確認状態（2026-10-28）

## 公式資料

- [GC2027II公式案内](https://champions-news.pokemon-home.com/ja/page/848.html)：取得。M-Cダブルバトルと対象リストへのリンクを確認。
- [M-C公式案内](https://champions-news.pokemon-home.com/en/page/816.html)：取得。対象期間・メガシンカ・持ち物重複等の案内を確認。
- [大会対象ポケモン一覧](https://web-view.app.pokemonchampions.jp/battle/pages/events/ic178955798491frplcz/ja/pokemon.html)：検索サービスでは見出しのみ。動的な一覧の本文は取得できず、実行環境の直接取得も403。**使用可能全件の確認には使っていません。**
- [M-C対象ポケモン一覧](https://web-view.app.pokemonchampions.jp/battle/pages/events/rs178713870219xeaaio/en/pokemon.html)：同様に一覧本文を取得できず未確認。
- [公式育成案内](https://www.pokemonchampions.jp/ja/training/)：取得。能力・技・特性等を調整できることは確認しましたが、能力ポイントの数式・上限・端数処理の数値資料にはなっていません。

閲覧できなかった一覧を確認済みとは扱いません。公式サイトへの403を回避する取得は行っていません。対戦中の外部ツール使用可否を本成果物は認定しません。

## 計算・データの一次コード

- [Smogon damage-calc](https://github.com/smogon/damage-calc)：npm `@smogon/calc@0.12.0` のChampions（世代0）を使用。`calc/src/stats.ts` と `calc/src/mechanics/champions.ts` を確認。npmの完全性ハッシュはpackage-lock.jsonに保存。
- [Pokémon Showdown](https://github.com/smogon/pokemon-showdown)：コミット `1242c1e2d9763ba5b85d33f13aecb89bae19ae3d`。`data/mods/champions` と `gen9championsvgc2026regmc` を使用。別実装のネイティブダメージ処理・能力値処理を計算結果の比較対象にしています。
- 能力値モデル：HP＝種族値＋ポイント＋75、その他＝floor((種族値＋ポイント＋20)×性格)、レベル50。HP種族値1の例外あり。**コミュニティ実装間の一致であり、公式実機での数式認証ではありません。**
- 日本語名称・ID・一部画像IDは既存資産の対応表から取得。公式適合判定には使用していません。原v8の採用率は出典未確認のため表示を停止。
- [PokeAPI/sprites](https://github.com/PokeAPI/sprites)：346PNGを取得して内蔵。形態に固有画像がない場合は基礎形態画像を共用。配布HTML・参照画像データのハッシュで同梱内容を固定。取得元masterのコミット固定は未実施です。
- Microsoft Edge Linuxの公式配布パッケージ：バージョン142.0.3595.94、配布フィード記載SHA-256と照合。`reports/EDGE_PROVENANCE.json` を参照。ブラウザ本体は配布ZIPには含みません。

上記モデルで得られた386形態を候補として収録しました。公式M-Cの完全な許可一覧であるとは表示していません。29形態はdamage-calcに直接の種族別名がなく、Showdown側の種族値・タイプ・重量を明示的に渡します。24の装飾形態は一次コードの英語形態名で区別します。実機未確認値を推測で補ってはいません。

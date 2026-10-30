# 開発チェックポイント

対象は添付v8を基準にした独立ビューアです。旧リポジトリ `openseasami/gc2027ii` の対戦支援システムは再開せず、main・公開サイトを変更していません。ローカル専用ブランチは `viewer-v9-development`。GitHubのviewer-v9-developmentに保存しています。main・codex-development・既存公開サイトへの書込みは行いません。

## 保存内容

`source/core.cjs` は純粋計算・条件比較・入力検証、`source/app.cjs` はUI・保存・移行、`source/template.html` はv8ベースの表示、`source/data.json` と `images.json` は固定データです。`build.cjs` で単一HTMLを生成します。元v8と指示書はsourceに保存しました。配布ZIPの通常動作に開発環境は不要です。

## 再現

Node.js 20以上、Python 3、gitを使用します。外部通信が許可された環境で依存取得が必要です。権限・ネットワークポリシーを迂回してはいけません。

```sh
npm ci --cache .npm-cache
mkdir -p work
git clone https://github.com/smogon/pokemon-showdown.git work/showdown
git -C work/showdown checkout 1242c1e2d9763ba5b85d33f13aecb89bae19ae3d
```

`work/showdown` 内で同リポジトリのREADMEに従い依存を入れ、`node build` を実行します。固定コミットのChampions modが必要で、古いnpmのsimだけを比較対象に置き換えてはいけません。通常の再ビルドは `npm run build`。固定データの再抽出は `npm run data`（対応表は既にreferenceに保持）です。`source/inspect-data.cjs` は任意の読取専用旧資産から名称表を作る一回限りの補助で、通常ビルドに旧対戦支援リポジトリは不要です。

```sh
npm test
python3 -m venv work/test-venv
work/test-venv/bin/pip install playwright
work/test-venv/bin/python tests/browser.py
python3 source/generate-reports.py
python3 source/package-release.py
python3 tests/artifact.py
```

ブラウザ試験には実Chromiumと実Microsoft Edge Linuxが必要です。`tests/browser.py` の `VIEWER_CHROMIUM` / `VIEWER_EDGE` 環境変数で実行ファイルを指定できます。実行できない環境は未実行として扱います。ブラウザ本体は配布物に含みません。ポートは試験用に動的割当、利用者向け起動は127.0.0.1:8766固定です。

## 残件・再開時の注意

`docs/UNCONFIRMED.md` と `reference/UNCONFIRMED.json` を読み、実行済み `*_RESULTS.json` と混同しないでください。2026-10-29のユーザー指示で公式本文取得と実機計算照合を判定条件から除外しました。非公式資料の事実データを npm run audit:roster → npm run data で再現し、356形態に限定します。旧ZIPはrelease/archive/v9-20261028に保持。未取得資料を確認済みとは扱いません。

名称登録を効果実装完了としません。登録済み6体・SP移行・全8対面・場と控えの特性源・メガストーンの整合性を維持します。calcの空文字特性はclone時に初期特性に戻るため、無効化時は内部用 `No Ability` を使います。シードや登場時特性で入力済みランクを二重に変更してはいけません。

AI・完全試合・履歴・ターン・HP追跡は今回の対象外です。これらを追加完成条件や次の開発段階として扱いません。

## てだすけ・バー対応

source/core.cjsは攻撃者ごとのisHelpingHandを既存エンジンへ一度だけ渡します。source/app.cjsは4受け手の一時状態・2対面共有・控え分離・変化技除外・範囲バーを実装。tests/helping-hand.cjsの独立比較とtests/helping_hand_browser.pyの実DOM検証を通常の全試験へ組み込みました。JSONバージョンと登録データ、M-C対象は不変です。前版ZIPはrelease/archive/v9-MC-before-helping-handに保持しています。

## 形態別採用技・折りたたみ・色（2026-10-30）

source/usage.jsonはreference/usage/pokekit-champions-2026-09.jsonからnpm run data:usageで再生成。完全一致IDのみ、通常/メガ/Z間のフォールバックを禁止。変化技除外後の上位5攻撃技と6～10位の折りたたみをsource/app.cjsで表示。色はsource/colors.cjs共通。全356形態の照合はtests/usage.cjs、実操作はtests/usage_browser.py。公開150形態・変化技込み10技の上限を隠さず、未取得分を捏造しません。統計に含まれる種族値等は計算データへ反映しません。前のてだすけ版ZIPはrelease/archive/v9-before-usage-movesに保持します。

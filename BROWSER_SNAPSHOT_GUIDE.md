# 上位120種類：ブラウザ一括スナップショット方式

## 実装目的
開発コンテナでは `www.pokemon-zone.com` の名前解決が失敗するため、同サイトを開ける通常のブラウザ上で同一オリジンの7ページを一括保存する代替経路を追加。

## 使い方（開発者向け）
1. ブラウザで `https://www.pokemon-zone.com/` を開く。
2. 開発者ツールのConsoleで `export-stats-browser.js` の内容を一度実行する。信頼できるコードか確認してから実行する。
3. `GC2027II_stats_7pages.json` が1ファイルで保存される。7ページのうち1件でも失敗すると保存しない。
4. `python collect-120-source.py --browser-snapshot GC2027II_stats_7pages.json --out adoption-source-120.json` を実行する。

## 制限
- これは実データを取得済みとするものではない。まだスナップショット未受領のため、アプリ登録済みは16種類。
- 大会上位30位は大会データ、ランク統計はシーズン6 M-C ダブルの順位であり、大会31〜120位と等しいと断定できない。順位同定ができないデータを大会31〜120位と偽称して登録しない。
- 技・特性の英語名を日本語キーに写像する工程、および実エンジンへの接続は別途必要。
- ブラウザ上で実行するコードは必ず内容を確認すること。

## 出典
- https://www.pokemon-zone.com/champions/championships/ic178714271270xvovwl/
- https://www.pokemon-zone.com/champions/ranked-seasons/ssn6_rd178713989559pruusy/

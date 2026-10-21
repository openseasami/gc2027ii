# v2.0.12 検証基盤改善・完成判定

## 実施済み
- Node.js の既存 test-*.js 28本を再実行
- verify-release.js 静的検証9項目
- Chromium document-level portable smoke 5項目を実行（localStorageは模擬、click()はDOMイベント呼出）
- browser_dom_test.py に残っていた特定作業ディレクトリの絶対パスを、スクリプトに相対的なパスへ修正
- index.html, sw.js, README.txt のバージョンを一致させた

## 完成条件別判定
| 条件 | 判定 |
|---|---|
| Node個別回帰テスト | 合格 |
| 静的配布検証 | 合格 |
| Chromium document-level 起動と45秒表示・模擬保存復元 | 合格 |
| 実HTTP/HTTPSナビゲーションと永続localStorage | 未検証（ERR_BLOCKED_BY_ADMINISTRATOR） |
| KO交代、特性、ターン操作の画面一気通貫E2E | 未検証 |
| 全技・全特性・全持ち物の正確性とレギュレーション使用可否照合 | 未達 |
| 行動推奨の公式仕様との定量比較 | 未達 |

## 再実行手順
````
for f in test-*.js; do node "$f" || exit 1; done
node verify-release.js
python browser_smoke_portable.py
python browser_dom_test.py
````

## 完成判定
**未完成**。本リリースは動作確認基盤の保守と、すでにあるテストの再実行可能性向上。戦闘ロジック自体は未変更。

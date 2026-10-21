# v2.8.9 — 採用率データの一括取込・証拠管理

## 用途
これまでの6/262種類の手入力を、複数ポケモンまとめて入力できるようにするオフライン取込ツール。推測による統計の補完は**行わない**。

- 元統計：2027 Global Challenge I / Masters（2026年9月25〜28日）、URLは `PRIORITY_POLICY.json` の `primarySource.url`。Global Challenge II の開催前の**代理統計**であり、IIの実績として扱わない。
- `adoption-import-template.csv` に実際に確認した1項目につき1行を入力。kindは `move` または `ability`、rateは%（例 52.6）。日本語の名称は `NATIONAL_DEX` に準拠。
- URL・イベント名が違う情報は誤って混ぜないように拒否する。イベントが異なる場合はデータセットを分離する必要がある。
- `python3 import-adoption-batch.py adoption-import-template.csv` で**変更なし**の事前検査。実データを入力してから `--commit` を付けて保存。
- `node audit-target-coverage.js` で実装優先一覧を再生成。
- 既存データとの値の衝突、重複、0〜100外、出典不一致、日英名の不一致は取込拒否。正当な訂正が確認できた場合だけ `--allow-overwrite` を使う。
- CSVに存在しない技・特性は「採用率が低い」とみなさず**未調査**のまま残る。ポケモン1種類について技や特性の一部だけ取り込んだ場合、種単位の調査完了として誤認しないよう注意。

## 外部の正解値による検証
ダメージ計算器の外部基準候補: https://github.com/smogon/damage-calc / https://calc.pokemonshowdown.com/
現在の環境では外部JavaScriptパッケージ/ウェブページをプログラムから取得できないため、外部ダメージの正解値照合は未着手。既存の内部一致テストを外部検証と呼ばない。

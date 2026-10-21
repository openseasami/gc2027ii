# 大会順位別の採用率統計取込（監査付き）

- 大会1～30位：GC2027 I マスター部門の実測値だけを使用。
- 大会31～262位：レギュレーションM-C、シーズン6、ダブルバトル（2026-10-07更新）の数値を代理統計として使用可能。
- **ランクバトルで31位以下だったという情報は、大会31位以下の証拠にならない。** `tournament-ranking-verified.json` の順位にはGC2027 Iの確認済み順位のみを登録する。
- 大会ページは上位30体だけの詳細を表示する。31位以下の完全な順位表が未取得の場合、未知順位の種は取込拒否とする。ソースの数値や順位を想像して埋めない。
- CSVは `species,english,kind,name,rate,source_url,event` の7列。日本語名を使用する。
- `python3 import-adoption-mixed.py data.csv --manifest tournament-ranking-verified.json` は事前検証のみ。
- `--commit` によって `PRIORITY_POLICY.json` に原子的に反映する。`observationSources` は技・特性ごとにURLを保存。
- 新たな大会統計の真値で既存観測を変更する場合だけ `--allow-overwrite` を検討する。内容確認なしの上書きは禁止。
- **この更新では代替統計の実観測の新規登録は0件。** 大会順位31以下の証拠を未取得のため。収集完了ではない。

出典：
https://www.pokemon-zone.com/champions/championships/ic178714271270xvovwl/
https://www.pokemon-zone.com/champions/ranked-seasons/ssn6_rd178713989559pruusy/

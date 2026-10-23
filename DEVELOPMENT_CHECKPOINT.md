# v2.9.13 最終ダメージ/KO監査チェックポイント

completion:false。基点ee6a7cc98f464d39c414cfc1eb7330e19000d122。新機能/候補網羅/他11技の追加監査は停止。今回のユーザー指示で独立照合の不一致だけを修正した。

全137/137回帰成功。KO_BOUNDARY_AUDIT_RESULTS.json：120プロフィール、4,320条件、ダメージ523,312比較、HP境界28,387、KO42,539比較、不一致0。能力値1,073,520比較も一致。対象344/メガ82の種族値2,064値は二資料一致、対象内未確認0。PC固定欄/45秒/保存復元/巻き戻し/3旧版移行も成功。

修正1件：被ダメージのタスキ判定だけがHP％>=100を使い、整数換算で満タンになる小数HP境界のKO確率が1だった。整数満タン条件へ統一して独立PSの0と一致。index.htmlのこの2行だけを変更し、UI/CSS/種族値/採用データは維持。FROZEN_BASELINE.jsonは元の指紋をoriginalRuntimeSha256へ保持し、auditAmendmentsで再現した不具合修正を例外として記録。

詳細FINAL_DAMAGE_KO_AUDIT.md、失敗原因/検体訂正KO_BOUNDARY_AUDIT_INCIDENTS.json、全回帰TEST_RESULTS.json。確定1発/乱数1発は全16乱数の生存判定で分け、命中率込み確率と命中時確率を分離。APは既存の0〜32/合計66。標準EVとの対応は個別能力の数値照合で公式AP/合計EV/合法性認定ではない。未知配分/追加効果/全特性・アイテム/公式規則/最適推奨などは未確認のまま参考推定とする。

## 元の固定ZIPと再開

release/tournament-v2.9.13/gc2027ii-v2.9.13-tournament-trial.zipは上書きせず元のSHAを維持。**そのZIPには今回の補正は含まれない。** 使用するなら本監査の開発コミットを取得し、ルートのstart-pc-trial.cmdから起動。同じURL/プロフィールを使い、先にJSON出力しておく。今回の依頼は監査/開発ブランチ保存であり、新ZIP生成は行っていない。

再開時も新機能へ進まない。明示された追加監査か再現した不一致だけを扱う。work/test-venv/bin/python browser_ko_boundary_test.py→全回帰→evaluate-tournament-practical.py。元ZIPを修正済みソースの検証証拠に流用しない。main/公開サイトは変更せずcodex-developmentへ保存。completion:falseを維持する。

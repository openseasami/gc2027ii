# 継続開発契約

## v2.9.13 大会基準版の固定（最新ユーザー指示）

最新の一括監査はFINAL_PREZIP_AUDIT.md/FINAL_PREZIP_AUDIT_RESULTS.jsonを先に読む。64d8d75のタスキ修正を保持し、登録済み半減実18種の除外漏れという重大な計算差を最小修正した。全140回帰＋一時ZIP展開4/4は成功。公式ポケモン/持ち物一覧の本体と独立ツール利用許可が未確認のため、新大会用ZIPは合格未達で未作成。旧ZIPをバックアップとして保持し、修正済みと混同しない。一時検証ZIPは削除済み。公式根拠が揃うまでは一般実装へ戻らず、古いpackagerでバックアップを上書きしない。

最終KO監査で再現した小数HP/タスキの不一致1件を修正済み。FINAL_DAMAGE_KO_AUDIT.mdとKO_BOUNDARY_AUDIT_INCIDENTS.jsonを先に読む。FROZEN_BASELINE.jsonは元の指紋をoriginalRuntimeSha256へ保持し、auditAmendmentsでこの修正だけを許可する。元の固定ZIPは上書きせず、修正済みソースと同一とは扱わない。旧ZIP用の合格記録からbuild-frozen-trial.pyで再生成しない。本監査は新ZIPを作らず開発ブランチへ修正/検証記録を保存した。

追加機能・候補網羅・他11技の監査を停止する。FROZEN_BASELINE.jsonのsourceCommitとruntimeSha256が基準。168技の明示条件の基本計算、344種類の種族値、現在のPC UI、固定欄、保存/旧版移行だけを最終回帰する。一般planのグループはclaimしない。新たな実装依頼または再現した重大不具合なしに実行ファイルを変更しない。

配布物はrelease/tournament-v2.9.13/gc2027ii-v2.9.13-tournament-trial.zipの1つを使用し、旧development ZIP/RC1は履歴として保持する。再検証は固定全回帰→evaluate-tournament-practical.py→build-frozen-trial.py→verify-frozen-trial.py。既存のbuild-development-release.pyによる別の候補ZIP生成/バックログ再生成は今回不要。TOURNAMENT_BASELINE_RESULTS.jsonの限定試用合格と全仕様completion:false、公式大会適合の未確認を混同しない。ZIP自体のSHAは同じフォルダーのSHA256SUMS.txt、内部はSHA256SUMS_CONTENTS.txtを参照する。

作業ブランチは `codex-development` のみ。`main`、公開サイト、デプロイ、定期実行の有効化を操作しない。completion:falseを維持する。

「開発チェックポイントから未完了作業を再開し、実行可能な範囲で連続実装・検証・保存してください。」という指示で以下の全工程を実行する。

1. 作業ツリーとブランチを確認し、開発ブランチをfetch/fast-forward。ユーザーの未保存変更を上書きしない。
2. DEVELOPMENT_CHECKPOINT.md、DEVELOPMENT_AUTOMATION.md、台帳・残件・開発ゲートを読む。
3. `python development-automation.py plan` と `status` を読む。activeがあれば着手済みを先に再開する。recommendedActionがrevalidate-existing-scopeの場合は既存実装を再利用して再検証だけを行う。新規は実行可能な最優先グループを `claim --group ID` で確保する。固定件数で切らず、同じ依存イベントの処理をまとめる。
4. 関連ソース・既存テスト・調査済みスコープを追跡してから実装。未確定の公式仕様は該当IDだけblockし、他の実行可能な作業へ進む。既存共通経路を再実装しない。
5. 個別の意味のある単体・統合・Showdownテストを追加。MECHANICS_EVIDENCE.jsonには対象名・経路・テスト・限定スコープと残課題を記録する。
6. 固定の `work/test-venv/bin/python run-development-checks.py` を実行。ID別のscope/remaining/testsをJSONに書き、`verify --ids ... --evidence PATH` へ渡す。失敗時は記録された原因を調べ、修正後に再実行。同一入力での無制限再試行はしない。
7. 成功した範囲だけ台帳に認定。失敗や未確認を完成扱いしない。`checkpoint --reason ...` 後に再びplanを読み、実行可能な次のグループへ連続して進む。数件という理由で確認を求めたり停止したりしない。
8. 実行限界・全候補保留・解決不能な権限問題に到達したら、未完了をactiveまたはblockedとして理由と再開方法を保存。バックログ、テスト、チェックポイント、完了レポートを更新し、`python build-development-release.py` で検証済みパッケージを作る。実行失敗時はリリースせず失敗結果を保存。
9. git status/diffを確認し、開発ブランチへコミット・通常pushする。force pushしない。遠隔mainが変更されていないことを確認して報告する。

このCLIはコーディングエージェントや常駐実行器ではない。API認証や権限、実行時間上限を迂回するループを作らない。定期実行の設計・承認事項はDEVELOPMENT_AUTOMATION.mdを参照。

## 大会実用版スプリント（ユーザーの最新方針を優先）

`TOURNAMENT_PRACTICAL_GATES.json` が現在の優先条件。合計約120分の開発予算を使い、1,149候補の網羅・再分類をいったん停止する。一般planの大きな実装/調査グループを追加claimしない。既存activeも上位120プロフィールのダメージ・素早さ・行動順・重要な特性/持ち物・45秒操作の重大不具合に関連する範囲だけ継続する。残る網羅作業は削除せず保留理由をチェックポイントへ保存する。

再開時はチェックポイントの累積所要時間・残り予算と大会向け残課題を先に読む。全回帰後に `python evaluate-tournament-practical.py` を実行し、ローカル合格と大会使用可否の未確認を区別する。未検証の計算/推奨は参考推定として表示し、completion:falseを維持する。公開サイトの更新は行わない。

## PC優先（最新ユーザー方針）

PCブラウザの固定ダメージ欄・相手2枠同時表示・45秒のクリック操作・保存復元を最優先する。スマートフォンは回帰維持。PC_BROWSER_RESULTS.jsonとPC_TRIAL_START.mdを読み、Windows実機検証とLinux Chromium/Windows UA互換試験を混同しない。

## 実機操作確認後の最終方針

ユーザーがPC実機操作に問題なしと確認。現在のUIを維持し、UI_PRESERVATION_BASELINE.jsonとtest-ui-preservation.pyでCSS/マークアップを固定する。上位120の主要対面の計算・順序・相互作用・推奨を検証し、重大な不具合だけ修正する。ユーザー確認の範囲をWindows版製品の自動テスト結果に読み替えない。

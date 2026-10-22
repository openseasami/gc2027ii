# 自動継続型の開発基盤

`completion: false`。自動化対象は作業選択、依存ゲート、状態・失敗・限定スコープの証拠保存。コードの実装・原因分析はCodexが行う。CLIを常駐させるだけで新しいコードが生成される仕組みではない。

## 短い再開指示

> 開発チェックポイントから未完了作業を再開し、実行可能な範囲で連続実装・検証・保存してください。

AGENTS.mdが実行手順を定義する。各機能ごとの確認を要求せず、実行限界、実行可能候補なし、解決できないアクセス問題まで依存グループを順次処理する。

## 操作

```sh
python development-automation.py plan > work/development-plan.json
python development-automation.py status
python development-automation.py claim --group hit:implement
# Codex: 対象経路の追跡、実装、テスト、MECHANICS_EVIDENCE.json更新
work/test-venv/bin/python run-development-checks.py
python development-automation.py verify --ids TASK_ID --evidence work/evidence.json
python development-automation.py checkpoint --reason '検証済み範囲と残件を保存'
python development-automation.py plan
```

グループ名・IDは必ずplanの出力から取得する。例のIDを固定使用しない。全件の一括完了は要求しない。依存でつながるグループを確保し、完了したIDごとにverifyし、残りはactiveから再開する。

証拠ファイルの例（各IDについて必須）:

```json
{
  "TASK_ID": {
    "scope": "確認済み命中時の能力ランク変化だけを検証",
    "remaining": "全ダメージ・大会固有仕様・試合全体は未検証",
    "tests": ["test-hit-event-multiturn.js"]
  }
}
```

検証はTEST_RESULTS.jsonの実行成否・ソースSHAを確認し、対象名にMECHANICS_EVIDENCE.jsonで登録したテストだけ受理する。全回帰が失敗した状態、古いソース、無関係な成功テストではverified-scopeにしない。テストとスコープの意味的な対応のレビューはCodexが担い、単なる登録で正しさを保証しない。

台帳の更新は既存implementation-ledger.js/coverage-assessment.jsへ一本化。CLIは証拠なしに台帳を書き換えない。verified-scopeは全機能完成ではなく、記録した範囲の履歴。ソース変更後は過去の証拠を現在の成功扱いにせず再検証する。テスト実行中にはソースを編集しない。

## 優先度・依存関係・重複防止

- 未実装はimplement、要調査はresearch、部分実装/別経路はextendとして区別する。
- 優先対象を先に、既存採用率の最大観測率を影響の目安として並べる。unknownは対象外にしない。この値は種族別採用率を統合した完全な人口加重指標ではない。
- 一般Gen9の参照フックから主要イベントをグループ化する。公式大会仕様の確定には使わない。タスクにはバックログの分類・依存能力・検証範囲を保持する。
- DEVELOPMENT_AUTOMATION_POLICY.jsonでイベントごとの前提能力を管理する。現在のtrueは既存の限定的な共通経路が存在するという意味。全組合せの完成を示さない。公式根拠が必要なmegaはfalseで保留する。
- 同一の名前・フェーズ・意味のある経路/証拠スコープから安定IDを生成。行番号だけの移動で再調査しない。着手済みはactive、検証済みは履歴として保存し、同じ入力を新規選択しない。スコープが変わると新IDになる。
- 排他ロックとatomic replaceで状態を保存。ロックが残った場合は実行プロセスを確認してから手動回復する。無断で別作業のロックを削除しない。

## 失敗・保留・再開

verifyで回帰失敗があると、コマンド・終了コード・stdout/stderr末尾・入力指紋・対象IDを失敗履歴に保存しretry-neededへ戻す。原因の自動断定はしない。

同一入力での再試行は最大3回。予算を使い切ったら原因を調べ、コード修正で入力指紋が変わるまで再選択しない。sleepで無限再試行したり、権限エラーを別経路で迂回したりしない。

```sh
python development-automation.py block --ids TASK_ID --reason '公式根拠未確認。再開条件: 公式資料取得'
python development-automation.py release --ids TASK_ID --reason '根拠を取得したため保留解除'
```

blockは対象IDだけに適用。他の実行可能グループを進める。releaseは着手/保留を解除するが同一入力の試行予算を消さない。状態はDEVELOPMENT_AUTOMATION_STATE.json、失敗結果はTEST_RESULTS.jsonにも保存する。チェックポイントには基点コミットと状態件数を記録する。checkpoint直後の保存コミットIDはgit logで確認できる。

## 実装・検証・pushの範囲

codex-development内の可逆なソース変更、調査、ローカルテスト、記録更新、通常コミット・pushを対象とする。CLIはコードを実行する任意コマンド受付、git push、認証設定、デプロイを行わない。保存はCodexがbranch/status/diff確認後に実行する。main・公開サイト・force pushは対象外。

## 定期実行の設計（未有効化）

`.github/workflow-templates/development-validation.yml` は実行されない配置の検証用テンプレート。読取専用checkout、回帰/Showdown/ブラウザー検証、結果artifact保存のみを行い、書込み・push・デプロイの権限を持たない。CI環境とChromiumの導入は未検証。現在Actionsを起動・定期実行していない。

有効化前にユーザーが決める事項:

1. 頻度・タイムゾーン、月間実行時間/料金、同時実行数、タイムアウト、失敗通知先。
2. Actionsの許可ポリシー、Python/Node/Chromium実行環境、artifact保持期間。テンプレートの試験実行を行う。
3. workflow_dispatchとscheduleは通常デフォルトブランチ上のworkflowを必要とする。mainを変更しない現条件では、そのまま配置して動作すると約束できない。既存の許可された外部起動基盤か、別の自動化用リポジトリを承認・設定する必要がある。mainへ勝手に配置しない。
4. コード生成も定期化する場合は、Codex実行環境・API/サービス利用枠・最小限の開発ブランチ書込み認証・期限・監査・停止方法を別途設定する。GitHub Actionsの検証だけでは実装は進まない。
5. このセッションではChatGPTのautomationsツールが利用可能だが、バックグラウンドCodexのcheckout/検証/pushまで実行できることは未確認。再開通知や起動指示の候補であり、権限継承を仮定しない。スケジュールは作成していない。

定期実行を有効にする承認は今回求めず、具体的な設定を選べる設計とテンプレートまでを保存する。実行上限・アクセス制御・ユーザー承認を回避する方式は使わない。

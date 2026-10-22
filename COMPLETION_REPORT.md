# 推奨行動の検証判定 — v2.9.9

**限定した戦術条件は合格。全機能は開発途中、completion:false。**

- 相手の行動後のKO、守る/交代での空振り、無効な妨害への勝ち筋阻止の過大加点を修正。
- 実ページ28条件と11単体境界が成功。うち4条件は第一推奨のKO対象/集中攻撃を確認。旧採点の対照は9失敗を再現。
- 全125/125コマンド成功。既存Showdown差分、主要16対面、PC/45秒、保存、履歴、巻き戻し、完全試合UI E2Eも成功。
- PC用CSS・HTML構造、既存120件データとカタログを維持。UI変更・公開サイト更新なし。

相手予測確率、複数ターン最適性、味方被害を含む範囲技の共同評価、公式C/M-C・メガ仕様などは未検証。推奨の参考推定表示を維持し、一般的な勝率保証はしない。

未実装58、部分実装195、別経路10、要調査886、対象外0。全仕様完成0、未検証1,149。今回の採点修正で候補網羅の分類は昇格していない。

詳細はRECOMMENDATION_STRATEGY_VALIDATION.md、RECOMMENDATION_STRATEGY_RESULTS.json、TEST_RESULTS.json。実装a537fdf8d6350312b43e908e091d1a86b8c21eba、保存先codex-development。試用版release/gc2027ii-v2.9.9-development.zip、起動方法PC_TRIAL_START.md。main・公開サイトは変更していない。

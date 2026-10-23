# 大会実用版リリース候補の判定 — v2.9.10 rc1

**限定した参考用途で条件付き合格。全仕様は開発途中、completion:false。**

判定基点codex-development / 3fc189b8d77ed15fd4dc7552408c8417a3c45edf。アプリ本体・確認済みPC UI・既存データに変更なし。main・公開サイトは変更していない。

全127/127回帰テストとローカル整合性ゲートが成功。既存の主要16対面・計算/速度/順序・戦術28+17条件・保存/巻き戻し・PC E2Eを再確認した。候補ZIPの展開後も、起動、PC操作/8画面サイズ、45秒自動入力、保存/JSON復元/巻き戻し、完全試合UIの3/3検証コマンドが成功。梱包ハッシュとCRCも一致。

受入範囲は観測した対戦状態の手動入力、チーム/保存/履歴/巻き戻し、明示した条件での計算参考、参考推定としての行動候補。検証済み条件の範囲で未解決の再現済み重大阻害不具合はない。これは全条件で不具合が存在しない保証ではない。

未確認：公式C/M-C・メガ使用可否/能力値、全120×120対面、一般的な複数ターン最適性、相手選択確率、厳密な共同KO順序、全追加効果/味方コンボ。Windows製品版詳細・人間の45秒判断時間は自動認定していない。PC実機操作のユーザー確認とLinux Chromium互換試験を区別する。全仕様未検証1,149を維持。

候補ZIPは1つ作成：release/rc1/gc2027ii-v2.9.10-tournament-rc1.zip。SHA-256：6d5155a328319c3153e23472cdfadd38e5faebefcf8e2650208b652698e6635a。過去の開発ZIPは履歴として維持し、新しい配布候補はrc1だけ。

詳細はRELEASE_CANDIDATE_DECISION.md、機械判定はRELEASE_CANDIDATE_RESULTS.json、展開検証はrelease/rc1/RC_ARTIFACT_VERIFICATION.json。ZIP内READ_ME_FIRST.md/PC_TRIAL_START.mdを読み、Python 3でstart-pc-trial.cmd、Chrome/Edgeでhttp://127.0.0.1:8765/index.htmlを使用する。全機能完成・公式大会使用可否の認定は行っていない。

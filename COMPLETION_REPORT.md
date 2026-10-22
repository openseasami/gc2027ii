# PCブラウザ向け大会試用版の判定 — v2.9.7

**条件付き合格：PC相当Chromiumでの限定試用検査。completion:false。**

全120/120コマンド成功。Windows Chrome/Edge UA互換プロファイル2件×4画面サイズで、幅300px固定のダメージ欄、相手2枠の同時表示、通常スクロール、非重複、文字/横はみ出しを検証した。交代・HP・ターン・巻き戻し・保存再読込・JSON復元も実ブラウザー操作で成功。既存の戦闘計算差分・スマートフォン回帰・4対4完全試合UI E2Eも成功。

修正は、最良対面1件しか見えない概要、固定欄とヘッダー/入力外領域の重なり、PC保存ボタンの非表示。ダメージ・KO・推奨は参考推定として表示し、確定表示へ戻していない。

1ターンは自動6クリック、4.706秒/5.030秒。これはLinux Chromium 154.0.8037.57での自動操作時間。**Windows実機のChrome/Edge製品版、人間の判断込みの45秒操作、Windows cmdそのものは未検証**であり、合格へ読み替えない。

検証範囲で未解決の重大PC UI不具合は検出していない。残る重大な確認事項は公式C/M-C・メガの使用可否/能力値、他の半減実・オーロラベール等の未検証計算と全戦闘組み合わせ、完全試合エンジン照合。全仕様未検証1,149、完成0を維持する。

試用版：release/gc2027ii-v2.9.7-development.zip。全展開後、Python 3が使えるPCでstart-pc-trial.cmdを起動し、Chrome/Edgeでhttp://127.0.0.1:8765/index.htmlを開く。詳細はPC_TRIAL_START.md。公開サイトのデータはJSON出力/復元で移行する。

実装ce3e3b8、ブランチcodex-development。結果はPC_BROWSER_RESULTS.json、PC_TRIAL_ACCEPTANCE.json、TEST_RESULTS.json。mainと公開サイトは変更していない。

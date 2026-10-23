# 指定3攻撃技の最終追加実装 — v2.9.13

completion:false。基点90a5292a9187dd04c72d6ff0a743323712390e9a、codex-development。現在のUIと種族値を維持し、main・公開サイトは変更しない。

今回の追加実装/監査はやけっぱち・トリプルアクセル・ネズミざんのみ。その他11技は対象外。既存候補1,149件の網羅や他の未確認技の実装へ戻らない。

やけっぱちはターン番号付きの直前結果を保存し、成功/失敗/交代/不明を区別。75/150を正しい条件で使い、不明なら両方を参考表示して確定KOを返さない。交代の共通リセットで過去の失敗を解除する。相手側の未知条件も既存プレビューへ両値を表示し、自動HP適用/自動予測から保留。実際の保存/復元とトランザクション巻き戻しを検査した。

トリプルアクセルは20/40/60、ネズミざんは各20×最大10。既存の各ヒット16乱数計算を再利用し、1〜3/1〜10の各合計、途中KO、タスキ/がんじょう/じきゅうりょくを追跡。各打撃の失敗で終了し、ダイスは初撃判定と4〜10回（Population Bomb）、スキルリンク等は別条件として扱う。テクニシャン＋レンズ/ダイス/命の珠等も外部エンジンで比較。被弾記録の5回上限が残っていた不具合を10回対応へ修正した。

3技の基本計算は明示条件で外部照合成功。2,608条件、ダメージ158,592、合計HP分布47,891、命中回数分布690で不一致0。別途、全13×13ランクと6条件の初撃/後続命中4,056比較が一致。公式実機の混合命中ランクの丸めを認定せず、追加判定のある該当条件は参考推定とする。途中の接触反応・回復実等の全反応は未実装で、認識できる該当条件は確定KOを禁止。通常の表示KO率は非急所条件であり、急所別シナリオの検証と区別する。

全134/134コマンド成功。Windows UAの既存PC E2Eに加え、3技の実結果を4画面サイズで表示検査した。CSS/マークアップ、NATIONAL_DEX/NATIONAL_MOVES/REGULATION_MC、採用120件の指紋は維持。対象344種類（メガ82）の2,064種族値は前回の照合状態のまま。大会アイテム一覧を広げず、こだわりハチマキ/メガネを追加しない。

主要179技の累積は、前回165＋今回3＝168が限定条件で照合成功。11技は今回対象外の未確認として残す。旧20技マトリクス単体の「6/20成功・14未確認」はそのテストの範囲であり、現在集計の証拠には今回3技の別レポートを加える。全仕様の完成判定にはしない。

詳細THREE_ATTACKS_AUDIT.md、機械結果THREE_ATTACKS_AUDIT_RESULTS.json、集計STATS_MOVES_AUDIT_RESULTS.json、回帰TEST_RESULTS.json。固定原文/URL/SHAはreference-data/three-attacks/PROVENANCE.json。Showdown一般第9世代の局所照合とChampions/公式大会認定を混同しない。

試用版release/gc2027ii-v2.9.13-development.zip。PC_TRIAL_START.mdに従いPython3のstart-pc-trial.cmdからChrome/Edgeでhttp://127.0.0.1:8765/index.htmlを開く。旧RC1は変更しない。ZIP展開後の起動/PC/完全観測試合フローの結果はrelease/DEVELOPMENT_ARTIFACT_VERIFICATION.json。

次回もユーザーの対象3技に限定する。他11技へ進むには対象変更の指示が必要。未確認反応/命中ランクの公式根拠がなければ、参考推定を確定表示へ昇格させない。再実行はnode test-three-attack-effects.js、node test-three-attack-accuracy-differential.js、work/test-venv/bin/python browser_three_attacks_test.py。全回帰→evaluate-tournament-practical.py→build-development-release.py→ZIP展開確認→開発ブランチへ通常pushする。

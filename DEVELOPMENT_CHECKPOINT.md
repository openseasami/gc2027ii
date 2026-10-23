# 大会基準版固定 — v2.9.13

completion:false。最新ユーザー方針により追加実装・候補網羅・他11技の調査を停止する。一般planの作業をclaimしない。基準コミット3a4362fdf01968dc452b5b7f8b17206e2984b00b、実装コミット042aa330e1353f6d88756bd80e43c3569b13eb3b。codex-developmentのみ、main/公開サイトは変更しない。

FROZEN_BASELINE.jsonが固定実行ファイル15個、対象168技、対象344種類の名前/ハッシュを定義する。実行ファイル・UI・種族値・データは変更0。最終回帰136/136成功。対象168技の限定基本計算に不一致0、対象344/メガ82の2,064種族値に不一致/未確認0。PC互換2プロフィール×4画面の固定欄・45秒・保存復元と旧版3版×2経路の移行・巻き戻しが成功。詳細TOURNAMENT_BASELINE_REPORT.md/RESULTS.json、TEST_RESULTS.json、VERSION_MIGRATION_RESULTS.json。

残る11技と168技内の未確認条件はUNCONFIRMED_CONDITIONS.md。追加効果・最適推奨・完全試合オラクル・公式大会規則/AP・Windows製品版自体の認定は未完。PC実機操作はユーザー報告の範囲で維持。全1,149候補の台帳状態を完了へ昇格しない。

指定試用版はrelease/tournament-v2.9.13/gc2027ii-v2.9.13-tournament-trial.zipの1つ。隣のSHA256SUMS.txtでZIP自体、内部のSHA256SUMS_CONTENTS.txtで各ファイルを照合する。旧development ZIP/RC1は履歴。起動PC_TRIAL_START.md、バックアップ/移行JSON_BACKUP.md。

## 再開時

追加実装を自動再開しない。明示的な新依頼または再現した重大不具合がある場合だけ範囲を確認する。基準版を再検証する場合はwork/test-venv/bin/python run-development-checks.py→python evaluate-tournament-practical.py。配布物を再生成する必要がある場合はレポートを更新し、python build-frozen-trial.py→work/test-venv/bin/python verify-frozen-trial.py。再生成すればSHAが変わるため別の検証記録を残す。今回確定したZIPを理由なく上書きしない。旧build-development-release.pyは別候補ZIP/バックログを生成するので今回使用しない。通常commit/pushはcodex-developmentのみ。全仕様completion:falseを維持する。

最終ZIP展開検査：3/3成功、35同梱ハッシュ一致、固定実行ファイル15個一致。確定SHA-256：3cc7b8d9ca186e3a543f8aa0b514e094b253f90d119e716aef2229b6d7d95a90。単一指定配布物はFROZEN_RELEASE.jsonを参照。

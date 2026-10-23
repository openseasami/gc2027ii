# v2.9.13 最終ZIP前監査 — 技術合格・大会ZIP保留

completion:false。基点64d8d75bc6a7466c788a35327f6f0f7c84e415f6のタスキKO修正を保持。今回、登録済み半減実がヨプ/ナモ以外は無視される重大な計算差を修正した。18種の共通表へ入口と補正を集約し、ホズの例外を含め既存の消費/連続打撃経路を再利用。UI/種族値/採用データ/操作機能は変更していない。

全140/140回帰成功、別途一時ZIP展開の起動/PC/オフライン/完全観測試合4/4成功。最新監査FINAL_PREZIP_AUDIT.md、機械判定FINAL_PREZIP_AUDIT_RESULTS.json、公式根拠OFFICIAL_MC_AUDIT.json。168技の限定基本計算・344種族値・82メガ前後164参照・6別形態・16乱数/確定1発と乱数1発/確定2発・18半減実・3指定攻撃技・PC保存/巻き戻し/旧3版移行を確認した。全仕様の完成にはしない。

## 現在の未達条件

公式ニュースと大会詳細は取得でき、M-Cダブル、選出4、メガ1回、持ち物重複禁止、20分/7分/45秒/90秒を確認。しかし公式ポケモン/持ち物の一覧本体は見出しだけで全件照合未完。独立ブラウザツールの利用許可も未確認。規約違反と断定せず、許諾も推測しない。これら3条件が未達のため新大会用ZIPは作成していない。一時的な検証用ZIPは削除済み。

元のrelease/tournament-v2.9.13/gc2027ii-v2.9.13-tournament-trial.zipはバックアップとして保持し上書きしない。旧ZIPには今回と64d8d75の補正が含まれない。修正済みソースはこの開発ブランチの監査コミット一式を取得し、ルートのstart-pc-trial.cmdから起動する。初回は127.0.0.1:8765へHTTPで開いてキャッシュを用意。同じURL/プロフィールで保存し、JSON_BACKUP.mdに従い更新前/移行先を先にJSON出力する。大会での利用可否は未確定。

## 次回

新機能・一般候補網羅・他11技の実装を開始しない。未確認の公式一覧とツール利用可否の根拠を揃えて照合し、work/test-venv/bin/python run-development-checks.py→python evaluate-tournament-practical.py→work/test-venv/bin/python verify-prezip-staging.py→python evaluate-prezip-audit.py。根拠のない公式チェックをtrueにしない。新ZIPの合格条件を満たしたときだけ旧ZIPと別の場所へ作り、全結果/未確認条件/起動/JSONバックアップ/ファイルSHAを同梱し、ZIP自体のSHAを外付けする。古いbuild-frozen-trial.pyの歴史的判定で旧ZIPを上書きしない。

main/公開サイトは変更せず、codex-developmentへ通常commit/push。全仕様completion:falseを維持する。

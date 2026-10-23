# 大会基準版 v2.9.13 の起動

追加機能の開発を停止した固定試用版です。全仕様completion:false。対象168技の明示条件での基本計算と対象344種類の種族値を検証します。全追加効果・最適推奨・公式大会規則は保証しません。TOURNAMENT_BASELINE_REPORT.mdとUNCONFIRMED_CONDITIONS.mdを参照してください。

1. 確定するZIPは **gc2027ii-v2.9.13-tournament-trial.zip** の1つです。リポジトリではrelease/tournament-v2.9.13/にあります。過去のdevelopment.zipやRC1は履歴用です。
2. ZIPをすべて新しいフォルダーへ展開します。旧フォルダーへの上書きやJSの一部だけのコピーは避けてください。旧版からは先にJSONバックアップを保存します。
3. Python 3が使えるWindows PCで **start-pc-trial.cmd** をダブルクリックします。手動起動は展開先で `py -3 launch-pc-trial.py`。macOS/Linuxでは `python3 launch-pc-trial.py`。
4. Chrome/Edgeで **http://127.0.0.1:8765/index.html** を開き、タイトルがv2.9.13であることを確認します。別サーバーが8765番を使用中なら終了してから起動します。
5. 表示倍率100%、横幅1,280px以上を推奨。固定欄は幅300px、相手2体を同時表示し、入力はページを通常スクロールします。自分2体×相手2体の4行を1,093×614〜1,920×1,080で検証します。
6. 終了はサーバーのウィンドウでCtrl+C。次回も同じURL・ブラウザ・プロフィールを使い、試合前後にJSONバックアップも保存します。

HTMLの直接起動（file://）は検証対象外です。サーバーはこのPCの127.0.0.1だけで待ち受け、公開サイトを変更しません。初回は必ず上記URLへ接続し版番号を確認します。古いオフラインキャッシュだけで開いた画面を基準版と判断しないでください。

保存領域はブラウザ・プロフィール・ホスト名・ポートごとに異なります。公開サイトやlocalhost表記、別ポートから移行する場合はJSON_BACKUP.mdの手順で転送します。復元は現在のチーム・試合・履歴を置き換えます。

ZIPのSHA-256は隣のSHA256SUMS.txtで照合します。PowerShellで `Get-FileHash .\gc2027ii-v2.9.13-tournament-trial.zip -Algorithm SHA256` を実行し、64桁の一致を確認してください。ZIP内部には各同梱ファイルのSHA256SUMS_CONTENTS.txtとRELEASE_MANIFEST.jsonがあります。ZIP自体のハッシュは自己参照を避けて外付けです。

自動試験はLinux ChromiumとWindows Chrome/EdgeのUser-Agent互換プロファイルで、Windows製品版の認定ではありません。PC実機操作に問題なしというユーザー報告（2026-10-23、OS/ブラウザ版詳細なし）とは区別します。自動クリック45秒未満は人間の判断時間を含みません。

# v2.9.16 大会前の練習・検証専用版の起動

全仕様completion:false。この配布物は**大会前の練習・検証専用**です。公式ポケモン・技・持ち物の一覧本文は未取得で、全件適合は未確認です。対戦中の外部ツール利用許可は確認されていません。公式大会で使用できるとの証明ではありません。既存UIのM-C区分はローカル登録内容であり、今回の公式再認定ではありません。公式資料・規約の追加確認は今回の対象外で、3e85b05から継承する未確認状態を引き継ぎます。OFFICIAL_CATALOG_REVIEW.mdとUNCONFIRMED_CONDITIONS.mdを参照してください。

1. gc2027ii-v2.9.16-practice-verification.zipを新しいフォルダーへ**全展開**します。START_HERE.txtとRELEASE_MANIFEST.jsonの用途がpre-tournament-practice-and-verification-onlyであることを確認してください。旧フォルダーへ部分上書きせず、index.htmlだけをコピーしないでください。ZIPと同じ場所のSHA256SUMS.txtにより配布ZIP自身を検査でき、展開後のSHA256SUMS_CONTENTS.txtには内部ファイルの指紋があります。
2. 旧版から先に「対戦履歴・統計・データ出力」→JSON出力で保管します。元のURL・ブラウザ・プロフィールで行います。
3. 前のローカルサーバーが動いていればCtrl+Cで停止します。Python3が使えるWindows PCで、展開先のルートにあるstart-pc-trial.cmdをダブルクリックします。手動は `py -3 launch-pc-trial.py`。macOS/Linuxは `python3 launch-pc-trial.py`。
4. Chrome/Edgeで **http://127.0.0.1:8765/index.html** を開きます。URL欄が127.0.0.1:8765であることを確認してください。公開サイトやlocalhost表記、別ポート、別プロフィールは保存領域が違います。公開版からはJSONで移行し、公開サイトの更新操作は不要です。
5. 画面のv2.9.16表記とSTART_HERE.txtを確認してください。v2.9.13は旧版です。今回のソースは64d8d75のタスキ修正と登録済み半減実18種の修正を保持し、LIVE_PRACTICAL_AUDIT.mdの操作/推奨修正とSERIES_MATCH_AUDIT.mdの登場タイミング/場の持続修正を含みます。各実行ファイルの指紋はFROZEN_BASELINE.jsonのruntimeSha256で確認できます。
6. 表示倍率100%、横幅1,280px以上を推奨。入力は通常スクロール、幅300pxの固定欄で相手2体（自分2体×相手2体の4行）を同時表示します。保存、ターン、巻き戻し、復元は従来の操作のままです。
7. 必要ならJSON_BACKUP.mdに従いJSONから復元します。復元は現在のチーム・試合・履歴を置き換えるため、移行先も先にJSON出力します。別端末へ自動同期はされません。
8. オフラインで使う前に、上記URLで一度HTTP読込を完了してください。正常キャッシュ後の再読込・HP再計算・保存復元を検証済みです。キャッシュがない初回、消去/破損キャッシュ、旧キャッシュだけでの起動は未確認です。HTMLの直接起動（file://）も検証対象外です。
9. 終了はサーバーウィンドウでCtrl+C。次回も同じURL/ブラウザ/プロフィールを使い、試合前後にはJSONファイルも別途保管します。サーバーはこのPCの127.0.0.1だけで待ち受けます。

さらに前のバックアップZIPはrelease/tournament-v2.9.13/gc2027ii-v2.9.13-tournament-trial.zip。SHA-256は3cc7b8d9ca186e3a543f8aa0b514e094b253f90d119e716aef2229b6d7d95a90です。これはタスキ修正・今回の半減実修正を含まない旧版です。PowerShellの `Get-FileHash <ZIPのパス> -Algorithm SHA256` で照合できます。新しい練習・検証専用ZIPはrelease/practice-v2.9.16/にあり、ZIP自身のSHAは同じフォルダーのSHA256SUMS.txtを参照してください。ZIP自身のSHAは自己参照になるためZIP内には格納せず、内部ファイルのSHA一覧を同梱しています。

自動PC検証はLinux Chromium＋Windows Chrome/Edge UA互換プロファイルです。Windows製品版の全組み合わせや人間の判断込み45秒を認定しません。既存のユーザーPC実機確認は別記録で保持しています。

直前のv2.9.13練習ZIPはrelease/practice-v2.9.13/にバックアップとして保持しています。SHAはa1113c059faada5cada8b28b57d44227e18ae1aeeeb3932069ed739335d298da。新版の初回読込はローカルサーバーを起動した状態で行い、v2.9.16の表示と新キャッシュを確認してからオフラインにしてください。

直前v2.9.14の確定ZIPはrelease/practice-v2.9.14/へ保持しています。SHA-256はa36b1119c6e08e20e35ac73131e963f2564dbdf30a2e60c8a9c187c072b91095です。v2.9.16へ部分上書きせず、移行前後にJSONを保存してください。

PC操作の限定改善はPC_OPERATION_AUDIT.mdを参照。入力済み相手HPはPCで直接訂正でき、入力中も固定欄の「第一推奨・参考推定」を確認できます。入力する前後で相手/自分のラベルを確認してください。確定後の訂正は従来どおり「前ターンを修正」を使います。

直前v2.9.15の確定ZIPはrelease/practice-v2.9.15/に保存しています。SHA-256: 455aa0c934386b0d12528f117b7497bcd9173377832c5bff0cdb3e5b3a442522。部分上書きせず、旧版・新版双方でJSONを保管してください。

GC2027II スマホPWA版 v1.72

このフォルダの中身を、そのままGitHub Pagesの公開ルートへ配置してください。

必要ファイル:
- index.html
- manifest.webmanifest
- sw.js
- icon-192.png
- icon-512.png

GitHub Pages想定:
1. リポジトリ直下へ5ファイルを配置
2. Settings → Pages
3. Deploy from a branch
4. main / root を選択
5. 公開URLをiPhone Safariで開く
6. 共有 → ホーム画面に追加

仕様:
- 相対パスのみ使用しているため、ユーザーサイト/プロジェクトサイトの両方に対応
- 初回アクセス時はネット接続が必要
- Service Worker登録後はアプリ本体をオフライン起動可能
- 外部ポケモン画像はオフライン時に表示されない場合があるが、アプリ本体は動作する

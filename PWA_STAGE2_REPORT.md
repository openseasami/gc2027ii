# GC2027II v1.72 スマホ第2段階（PWA）レポート

## 基準版
`GC2027II_support_v1.71.1-mobile-stage1-stable-verified.html`

## 追加した公開ファイル
- `index.html`
- `manifest.webmanifest`
- `sw.js`
- `icon-192.png`
- `icon-512.png`
- `README.txt`

## PWA設定
- start_url: `./`
- scope: `./`
- display: `standalone`
- orientation: `portrait-primary`
- theme color: `#0f172a`

GitHub Pagesのプロジェクトサイト配下でも使えるよう、パスはすべて相対指定。

## Service Worker
キャッシュ名:
`gc2027ii-v1.72-pwa`

初回オンライン起動時に以下をapp shellとしてキャッシュ:
- `./`
- `./index.html`
- `./manifest.webmanifest`
- `./icon-192.png`
- `./icon-512.png`

ページ遷移はネットワーク優先、失敗時はキャッシュ済みindex.htmlへフォールバック。
同一オリジンの静的ファイルはキャッシュ優先。

外部ポケモン画像はapp shellに含めないため、オフライン時は画像だけ表示されない場合がある。
アプリ本体の対戦支援ロジックはローカル資産だけで動作する。

## 検証
PASS:
- manifest JSON構文
- start_url / scope / display / orientation
- manifest・apple-touch-iconリンク
- Service Worker JavaScript構文
- app shell参照ファイルの存在
- index.html内JavaScript構文
- 重複HTML idなし
- 390pxスマホ表示で横スクロールなし
- PWAコード追加後も対戦開始・第一推奨生成
- ダメージ計算がスマホでオーバーレイしない
- ページJavaScriptエラーなし

## 検証上の制約
この実行環境では localhost へのブラウザアクセスが管理上ブロックされるため、
Service Workerの「実際の登録・activate・offline fetch」だけはブラウザ実動検証できていない。

ただし、
- sw.js構文
- 登録コード
- manifest
- app shellパス
- 必須ファイル存在
は静的に確認済み。

実際のGitHub Pages公開後にService Worker登録を最終確認する。

## 次段階
第3段階では、このフォルダをそのままGitHub Pagesへ配置できる公開ZIPとして使用し、
GitHub Pagesへの配置手順と最終公開確認へ進む。
